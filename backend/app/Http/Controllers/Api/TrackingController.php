<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hunian;
use App\Models\Karyawan;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    /**
     * GET /api/tracking/hunian
     */
    public function hunian(Request $request)
    {
        $user  = $request->user();
        $query = Hunian::with([
            'karyawan.user',
            'kost',
            'booking',
            'booking.pembayaran'
        ]);

        // Filter berdasarkan role
        if ($user->hasRole('hr')) {
            // HR hanya bisa lihat data karyawan yang masih aktif
            $query->whereHas('karyawan', fn($q) => $q->where('status', 'aktif'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('is_verified')) {
            $query->where('is_verified', filter_var($request->is_verified, FILTER_VALIDATE_BOOLEAN));
        }

        $hunians = $query->latest()->get();

        // Tambah data pembayaran untuk tracking lebih detail
        $hunians = $hunians->map(function ($hunian) {
            $pembayaran = $hunian->booking?->pembayaran;
            $hunian->payment_info = [
                'status' => $pembayaran?->status ?? 'unknown',
                'tanggal_bayar' => $pembayaran?->tanggal_bayar,
                'jumlah' => $pembayaran?->jumlah,
                'metode' => $pembayaran?->metode,
            ];
            return $hunian;
        });

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
     */
    public function detailKaryawan(Request $request, $karyawanId)
    {
        $karyawan = Karyawan::with(['user'])->find($karyawanId);

        if (!$karyawan) {
            return response()->json(['message' => 'Data karyawan tidak ditemukan'], 404);
        }

        $hunians = Hunian::with(['kost', 'booking'])
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
     * GET /api/tracking/radius?latitude=-6.56&longitude=106.78&radius=5
     * Radius dari titik referensi (bukan dari tabel kantor).
     */
    public function radius(Request $request)
    {
        $request->validate([
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius'    => 'required|numeric|min:0.1',
        ]);

        $lat = (float) $request->latitude;
        $lng = (float) $request->longitude;
        $radius = (float) $request->radius;

        $hunians = Hunian::with(['karyawan', 'kost'])
            ->where('status', 'aktif')
            ->get()
            ->map(function ($hunian) use ($lat, $lng) {
                $jarak = $this->hitungJarak(
                    $lat,
                    $lng,
                    (float) $hunian->kost->latitude,
                    (float) $hunian->kost->longitude
                );
                $hunian->jarak_ke_titik = round($jarak, 2);
                return $hunian;
            });

        $dalamRadius = $hunians->filter(fn ($h) => $h->jarak_ke_titik <= $radius)->values();
        $luarRadius  = $hunians->filter(fn ($h) => $h->jarak_ke_titik > $radius)->values();

        return response()->json([
            'message' => 'Data tracking radius berhasil diambil',
            'pusat'   => ['latitude' => $lat, 'longitude' => $lng],
            'radius'  => $radius . ' km',
            'stats'   => [
                'total_hunian' => $hunians->count(),
                'dalam_radius' => $dalamRadius->count(),
                'luar_radius'  => $luarRadius->count(),
            ],
            'dalam_radius' => $dalamRadius,
            'luar_radius'  => $luarRadius,
        ]);
    }

    /**
     * GET /api/tracking/laporan — ringkasan hunian per kost (kota)
     */
    public function laporan(Request $request)
    {
        $byKota = Hunian::with(['karyawan', 'kost'])
            ->where('status', 'aktif')
            ->get()
            ->groupBy(fn ($h) => $h->kost->kota ?? '—')
            ->map(function ($group, $kota) {
                $aktif = $group->count();
                $ver   = $group->where('is_verified', true)->count();
                return [
                    'kota'                  => $kota,
                    'hunian_aktif'          => $aktif,
                    'terverifikasi'         => $ver,
                    'belum_verifikasi'      => $aktif - $ver,
                    // kompatibilitas UI lama (per kantor → per kota)
                    'total_karyawan'        => $aktif,
                    'punya_hunian'          => $ver,
                    'belum_ada_hunian'      => max(0, $aktif - $ver),
                    'persentase_hunian'     => $aktif > 0 ? round(($ver / $aktif) * 100, 1) . '%' : '0%',
                ];
            })
            ->values();

        return response()->json([
            'message' => 'Laporan hunian berhasil dibuat',
            'data'    => $byKota,
        ]);
    }

    /**
     * POST /api/tracking/sync-pembayaran
     * Sinkronkan hunian dari pembayaran yang sudah lunas tapi belum ada hunian
     */
    public function syncPembayaran(Request $request)
    {
        $user = $request->user();
        if (! $user->hasAnyRole(['super_admin', 'hr'])) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        // Cari pembayaran yang sudah lunas tapi belum ada hunian
        $pembayarans = \App\Models\Pembayaran::with(['booking.user', 'booking.kost'])
            ->where('status', 'lunas')
            ->whereHas('booking', function ($query) {
                $query->whereIn('status', ['aktif', 'confirmed', 'paid']);
            })
            ->whereDoesntHave('booking.hunian')
            ->get();

        $created = 0;
        $skipped = 0;

        foreach ($pembayarans as $pembayaran) {
            $booking = $pembayaran->booking;
            $user = $booking->user;

            // Cari karyawan
            $karyawan = \App\Models\Karyawan::where('user_id', $user->id)->first();

            if (! $karyawan) {
                $skipped++;
                continue;
            }

            // Selesaikan hunian aktif sebelumnya
            \App\Models\Hunian::where('karyawan_id', $karyawan->id)
                ->where('status', 'aktif')
                ->update(['status' => 'selesai', 'tanggal_keluar' => now()]);

            // Buat hunian baru
            \App\Models\Hunian::create([
                'karyawan_id'    => $karyawan->id,
                'kost_id'        => $booking->kost_id,
                'booking_id'     => $booking->id,
                'tanggal_masuk'  => $booking->tanggal_mulai,
                'tanggal_keluar' => $booking->tanggal_selesai,
                'status'         => 'aktif',
                'is_verified'    => false,
            ]);

            $created++;
        }

        return response()->json([
            'message' => 'Sinkronisasi selesai',
            'created' => $created,
            'skipped' => $skipped,
            'total_processed' => $pembayarans->count(),
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
