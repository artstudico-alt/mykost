<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kost;
use App\Models\Kantor;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * GET /api/search/kost
     * Pencarian kost dengan berbagai filter
     */
    public function cariKost(Request $request)
    {
        $request->validate([
            'kota'      => 'nullable|string',
            'tipe'      => 'nullable|in:putra,putri,campur',
            'harga_min' => 'nullable|numeric|min:0',
            'harga_max' => 'nullable|numeric|min:0',
            'fasilitas' => 'nullable|array',
            'search'    => 'nullable|string',
            'latitude'  => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'radius_km' => 'nullable|numeric|min:0.1|max:100',
        ]);

        // Titik pusat kantor default: Kedung Waringin, Kota Bogor (CQPJ+GC)
        $kantorLat = -6.5637499;
        $kantorLng = 106.7810624;

        $query = Kost::with(['kamarsKosong'])
            ->withCount('kamarsKosong')
            ->where('status', 'aktif');

        // ==== LOGIKA PENCARIAN RADIUS HAVERSINE (dari input user) ====
        if ($request->filled('latitude') && $request->filled('longitude')) {
            $lat = $request->latitude;
            $lng = $request->longitude;
            $radius = (float)($request->filled('radius_km') ? $request->radius_km : 5);

            // Kita gunakan subquery agar kolom 'distance_km' bisa dikenali di WHERE (untuk Postgres)
            $query = Kost::query()
                ->selectRaw("kosts.*, ( 6371 * acos( cos( radians(?) ) *
                    cos( radians( kosts.latitude ) )
                    * cos( radians( kosts.longitude ) - radians(?) ) + sin( radians(?) ) *
                    sin( radians( kosts.latitude ) ) )
                ) AS distance_km", [$lat, $lng, $lat])
                ->where('status', 'aktif');
            
            // Laravel's fromSub or wrapping the query
            $query = Kost::fromSub($query, 'kost_distance')
                ->with(['kamarsKosong'])
                ->withCount('kamarsKosong')
                ->where("distance_km", "<=", $radius)
                ->orderBy("distance_km", "asc");
        } else {
            $query->select('kosts.*')->latest();
        }

        if ($request->filled('kota')) {
            $query->where('kota', 'like', '%' . $request->kota . '%');
        }
        if ($request->filled('tipe')) {
            $query->where('tipe', $request->tipe);
        }
        if ($request->filled('harga_min')) {
            $query->where('harga_min', '>=', $request->harga_min);
        }
        if ($request->filled('harga_max')) {
            $query->where('harga_min', '<=', $request->harga_max);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nama_kost', 'like', '%' . $request->search . '%')
                  ->orWhere('alamat', 'like', '%' . $request->search . '%')
                  ->orWhere('kecamatan', 'like', '%' . $request->search . '%')
                  ->orWhere('kota', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('fasilitas')) {
            foreach ($request->fasilitas as $fasilitas) {
                $query->whereJsonContains('fasilitas_umum', $fasilitas);
            }
        }

        $kosts = $query->get();

        // ==== SELALU tambahkan jarak_dari_kantor untuk setiap kost ====
        $kosts = $kosts->map(function ($kost) use ($kantorLat, $kantorLng) {
            $kost->jarak_dari_kantor = round($this->hitungJarak(
                $kantorLat, $kantorLng,
                (float) $kost->latitude,
                (float) $kost->longitude
            ), 2);
            return $kost;
        });

        return response()->json([
            'message' => 'Hasil pencarian kost',
            'total'   => $kosts->count(),
            'radius'  => $request->radius_km ?? 5,
            'center'  => [
                'latitude'  => $request->latitude ?? $kantorLat,
                'longitude' => $request->longitude ?? $kantorLng,
            ],
            'kantor'  => [
                'nama'      => 'Kantor Pusat (Kedung Waringin, Bogor)',
                'latitude'  => $kantorLat,
                'longitude' => $kantorLng,
            ],
            'data'    => $kosts,
        ]);
    }

    /**
     * GET /api/search/kost-by-kantor?kantor_id=1&radius=5&tipe=putra
     * Cari kost di sekitar kantor berdasarkan radius (Haversine)
     */
    public function kostByKantor(Request $request)
    {
        $request->validate([
            'kantor_id' => 'required|exists:kantor,id',
            'radius'    => 'required|numeric|min:0.1|max:50',
            'tipe'      => 'nullable|in:putra,putri,campur',
            'harga_max' => 'nullable|numeric|min:0',
        ]);

        $kantor = Kantor::find($request->kantor_id);
        $radius = (float) $request->radius;

        $query = Kost::with(['kamarsKosong'])
            ->withCount('kamarsKosong')
            ->where('status', 'aktif');

        if ($request->filled('tipe')) {
            $query->where('tipe', $request->tipe);
        }
        if ($request->filled('harga_max')) {
            $query->where('harga_min', '<=', $request->harga_max);
        }

        // Ambil semua kost lalu filter + hitung jarak (kompatibel SQLite)
        $kosts = $query->get()
            ->map(function ($kost) use ($kantor) {
                $jarak = $this->hitungJarak(
                    $kantor->latitude,
                    $kantor->longitude,
                    $kost->latitude,
                    $kost->longitude
                );
                $kost->jarak_dari_kantor = round($jarak, 2);
                return $kost;
            })
            ->filter(fn($kost) => $kost->jarak_dari_kantor <= $radius)
            ->sortBy('jarak_dari_kantor')
            ->values();

        return response()->json([
            'message' => 'Kost di sekitar kantor berhasil ditemukan',
            'kantor'  => $kantor->only(['id', 'nama_kantor', 'kota', 'latitude', 'longitude']),
            'radius'  => $radius . ' km',
            'total'   => $kosts->count(),
            'data'    => $kosts,
        ]);
    }

    // === Helper: Haversine Formula ===
    private function hitungJarak(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
