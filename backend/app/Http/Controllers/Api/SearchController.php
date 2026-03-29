<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kost;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * GET /api/search/kost
     * Pencarian kost (sewa per kost, tanpa entitas kamar).
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

        // Titik referensi jarak (Bogor) — bukan tabel kantor
        $refLat = -6.5637499;
        $refLng = 106.7810624;

        $query = Kost::query()->where('status', 'aktif');

        if ($request->filled('latitude') && $request->filled('longitude')) {
            $lat = $request->latitude;
            $lng = $request->longitude;
            $radius = (float) ($request->filled('radius_km') ? $request->radius_km : 5);

            $query = Kost::query()
                ->selectRaw("kosts.*, ( 6371 * acos( cos( radians(?) ) *
                    cos( radians( kosts.latitude ) )
                    * cos( radians( kosts.longitude ) - radians(?) ) + sin( radians(?) ) *
                    sin( radians( kosts.latitude ) ) )
                ) AS distance_km", [$lat, $lng, $lat])
                ->where('status', 'aktif');

            $query = Kost::fromSub($query, 'kost_distance')
                ->where('distance_km', '<=', $radius)
                ->orderBy('distance_km', 'asc');
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

        $kosts = $kosts->map(function ($kost) use ($refLat, $refLng) {
            $kost->jarak_dari_referensi = round($this->hitungJarak(
                $refLat,
                $refLng,
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
                'latitude'  => $request->latitude ?? $refLat,
                'longitude' => $request->longitude ?? $refLng,
            ],
            'titik_referensi' => [
                'nama'      => 'Bogor (titik referensi jarak)',
                'latitude'  => $refLat,
                'longitude' => $refLng,
            ],
            'data'    => $kosts,
        ]);
    }

    /**
     * GET /api/search/kost-sekitar?latitude=-6.56&longitude=106.78&radius=5
     * Kost di sekitar koordinat (menggantikan pencarian per kantor).
     */
    public function kostSekitar(Request $request)
    {
        $request->validate([
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius'    => 'required|numeric|min:0.1|max:50',
            'tipe'      => 'nullable|in:putra,putri,campur',
            'harga_max' => 'nullable|numeric|min:0',
        ]);

        $lat = (float) $request->latitude;
        $lng = (float) $request->longitude;
        $radius = (float) $request->radius;

        $query = Kost::query()->where('status', 'aktif');

        if ($request->filled('tipe')) {
            $query->where('tipe', $request->tipe);
        }
        if ($request->filled('harga_max')) {
            $query->where('harga_min', '<=', $request->harga_max);
        }

        $kosts = $query->get()
            ->map(function ($kost) use ($lat, $lng) {
                $jarak = $this->hitungJarak(
                    $lat,
                    $lng,
                    (float) $kost->latitude,
                    (float) $kost->longitude
                );
                $kost->jarak_km = round($jarak, 2);
                return $kost;
            })
            ->filter(fn ($kost) => $kost->jarak_km <= $radius)
            ->sortBy('jarak_km')
            ->values();

        return response()->json([
            'message' => 'Kost di sekitar titik berhasil ditemukan',
            'pusat'   => [
                'latitude'  => $lat,
                'longitude' => $lng,
            ],
            'radius'  => $radius . ' km',
            'total'   => $kosts->count(),
            'data'    => $kosts,
        ]);
    }

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
