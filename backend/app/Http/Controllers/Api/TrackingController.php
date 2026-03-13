<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hunian;
use App\Models\Karyawan;
use App\Models\Kantor;
use App\Models\Kost;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    /**
     * GET /api/tracking/hunian
     * HR: lihat semua data hunian karyawan di kantornya
     * Super Admin: lihat semua
     */
    public function hunian(Request $request)
    {
        $user  = $request->user();
        $query = Hunian::with([
            'karyawan.kantor',
            'kost',
            'kamar',
        ]);

        // HR hanya lihat karyawan di kantornya
        if ($user->hasRole('hr')) {
            $kantor = Kantor::where('user_id', $user->id)->first();
            if ($kantor) {
                $query->whereHas('karyawan', fn($q) => $q->where('kantor_id', $kantor->id));
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('is_verified')) {
            $query->where('is_verified', filter_var($request->is_verified, FILTER_VALIDATE_BOOLEAN));
        }

        $hunians = $query->latest()->get();

        $stats = [
            'total_hunian'     => $hunians->count(),
            'aktif'            => $hunians->where('status', 'aktif')->count(),
            'verified'         => $hunians->where('is_verified', true)->count(),
            'belum_verified'   => $hunians->where('is_verified', false)->where('status', 'aktif')->count(),
        ];

        return response()->json([
            'message' => 'Data tracking hunian berhasil diambil',
            'stats'   => $stats,
            'data'    => $hunians,
        ]);
    }

    /**
     * GET /api/tracking/hunian/{karyawanId}
     * Detail hunian satu karyawan beserta histori
     */
    public function detailKaryawan(Request $request, $karyawanId)
    {
        $karyawan = Karyawan::with(['kantor', 'user'])->find($karyawanId);

        if (!$karyawan) {
            return response()->json(['message' => 'Data karyawan tidak ditemukan'], 404);
        }

        $hunians = Hunian::with(['kost', 'kamar', 'booking'])
            ->where('karyawan_id', $karyawanId)
            ->latest()
            ->get();

        $hunianAktif = $hunians->where('status', 'aktif')->first();

        return response()->json([
            'message'      => 'Detail tracking karyawan berhasil diambil',
            'karyawan'     => $karyawan,
            'hunian_aktif' => $hunianAktif,
            'histori'      => $hunians,
        ]);
    }

    /**
     * GET /api/tracking/radius?kantor_id=1&radius=5
     * Tampilkan karyawan berdasarkan jarak hunian ke kantor
     * radius dalam km
     */
    public function radius(Request $request)
    {
        $request->validate([
            'kantor_id' => 'required|exists:kantor,id',
            'radius'    => 'required|numeric|min:0.1',
        ]);

        $kantor = Kantor::find($request->kantor_id);
        $radius = $request->radius;

        // Ambil semua hunian aktif beserta jarak ke kantor
        $hunians = Hunian::with(['karyawan', 'kost', 'kamar'])
            ->where('status', 'aktif')
            ->whereHas('karyawan', fn($q) => $q->where('kantor_id', $kantor->id))
            ->get()
            ->map(function ($hunian) use ($kantor) {
                $jarak = $this->hitungJarak(
                    $kantor->latitude,
                    $kantor->longitude,
                    $hunian->kost->latitude,
                    $hunian->kost->longitude
                );
                $hunian->jarak_ke_kantor = round($jarak, 2);
                return $hunian;
            });

        $dalamRadius = $hunians->filter(fn($h) => $h->jarak_ke_kantor <= $radius)->values();
        $luarRadius  = $hunians->filter(fn($h) => $h->jarak_ke_kantor > $radius)->values();

        return response()->json([
            'message' => 'Data tracking radius berhasil diambil',
            'kantor'  => $kantor->only(['id', 'nama_kantor', 'kota']),
            'radius'  => $radius . ' km',
            'stats'   => [
                'total_karyawan' => $hunians->count(),
                'dalam_radius'   => $dalamRadius->count(),
                'luar_radius'    => $luarRadius->count(),
            ],
            'dalam_radius' => $dalamRadius,
            'luar_radius'  => $luarRadius,
        ]);
    }

    /**
     * GET /api/tracking/laporan
     * Laporan hunian karyawan per kantor
     */
    public function laporan(Request $request)
    {
        $user  = $request->user();
        $query = Kantor::with([
            'karyawan' => fn($q) => $q->with('hunianAktif.kost'),
        ]);

        if ($user->hasRole('hr')) {
            $query->where('user_id', $user->id);
        }

        $kantors = $query->get()->map(function ($kantor) {
            $karyawanTotal       = $kantor->karyawan->count();
            $karyawanPunyaHunian = $kantor->karyawan->filter(fn($k) => $k->hunianAktif)->count();

            return [
                'kantor'             => $kantor->only(['id', 'nama_kantor', 'kota', 'latitude', 'longitude']),
                'total_karyawan'     => $karyawanTotal,
                'punya_hunian'       => $karyawanPunyaHunian,
                'belum_ada_hunian'   => $karyawanTotal - $karyawanPunyaHunian,
                'persentase_hunian'  => $karyawanTotal > 0
                    ? round(($karyawanPunyaHunian / $karyawanTotal) * 100, 1) . '%'
                    : '0%',
            ];
        });

        return response()->json([
            'message' => 'Laporan hunian berhasil dibuat',
            'data'    => $kantors,
        ]);
    }

    // === Helper: Haversine Formula ===
    private function hitungJarak(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
