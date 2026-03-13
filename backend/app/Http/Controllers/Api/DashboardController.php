<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Hunian;
use App\Models\Kantor;
use App\Models\Kamar;
use App\Models\Karyawan;
use App\Models\Kost;
use App\Models\Pembayaran;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return match ($user->role?->name) {
            'super_admin'  => $this->dashboardSuperAdmin(),
            'hr'           => $this->dashboardHr($user),
            'pemilik_kost' => $this->dashboardPemilikKost($user),
            'karyawan'     => $this->dashboardKaryawan($user),
            default        => response()->json(['message' => 'Role tidak dikenali'], 403),
        };
    }

    private function dashboardSuperAdmin()
    {
        return response()->json([
            'message' => 'Dashboard Super Admin',
            'data'    => [
                'total_user'       => User::count(),
                'total_kantor'     => Kantor::count(),
                'total_kost'       => Kost::count(),
                'kost_pending'     => Kost::where('status', 'pending')->count(),
                'kost_aktif'       => Kost::where('status', 'aktif')->count(),
                'total_karyawan'   => Karyawan::count(),
                'total_booking'    => Booking::count(),
                'booking_pending'  => Booking::where('status', 'pending')->count(),
                'booking_aktif'    => Booking::where('status', 'aktif')->count(),
                'total_pembayaran' => Pembayaran::count(),
                'pembayaran_berhasil' => Pembayaran::where('status', 'berhasil')->sum('jumlah'),
                'hunian_aktif'     => Hunian::where('status', 'aktif')->count(),
            ],
        ]);
    }

    private function dashboardHr(User $user)
    {
        $kantor = Kantor::where('user_id', $user->id)->first();

        if (!$kantor) {
            return response()->json([
                'message' => 'Dashboard HR',
                'data'    => ['info' => 'Belum ada kantor yang terdaftar'],
            ]);
        }

        $karyawanIds = Karyawan::where('kantor_id', $kantor->id)->pluck('id');
        $hunians     = Hunian::whereIn('karyawan_id', $karyawanIds)->get();

        return response()->json([
            'message' => 'Dashboard HR',
            'kantor'  => $kantor->only(['id', 'nama_kantor', 'kota']),
            'data'    => [
                'total_karyawan'      => $karyawanIds->count(),
                'karyawan_aktif'      => Karyawan::where('kantor_id', $kantor->id)->where('status', 'aktif')->count(),
                'punya_hunian'        => $hunians->where('status', 'aktif')->count(),
                'belum_ada_hunian'    => $karyawanIds->count() - $hunians->where('status', 'aktif')->count(),
                'hunian_verified'     => $hunians->where('is_verified', true)->count(),
                'hunian_belum_verify' => $hunians->where('is_verified', false)->where('status', 'aktif')->count(),
            ],
        ]);
    }

    private function dashboardPemilikKost(User $user)
    {
        $kostIds = Kost::where('user_id', $user->id)->pluck('id');

        return response()->json([
            'message' => 'Dashboard Pemilik Kost',
            'data'    => [
                'total_kost'    => $kostIds->count(),
                'kost_aktif'    => Kost::where('user_id', $user->id)->where('status', 'aktif')->count(),
                'kost_pending'  => Kost::where('user_id', $user->id)->where('status', 'pending')->count(),
                'total_kamar'   => Kamar::whereIn('kost_id', $kostIds)->count(),
                'kamar_kosong'  => Kamar::whereIn('kost_id', $kostIds)->where('status', 'kosong')->count(),
                'kamar_terisi'  => Kamar::whereIn('kost_id', $kostIds)->where('status', 'terisi')->count(),
                'kamar_booking' => Kamar::whereIn('kost_id', $kostIds)->where('status', 'booking')->count(),
                'booking_pending'    => Booking::whereIn('kost_id', $kostIds)->where('status', 'pending')->count(),
                'booking_aktif'      => Booking::whereIn('kost_id', $kostIds)->where('status', 'aktif')->count(),
                'total_pendapatan'   => Pembayaran::whereHas('booking', fn($q) => $q->whereIn('kost_id', $kostIds))
                    ->where('status', 'berhasil')->sum('jumlah'),
            ],
        ]);
    }

    private function dashboardKaryawan(User $user)
    {
        $karyawan   = Karyawan::where('user_id', $user->id)->with('kantor')->first();
        $hunianAktif = null;
        $bookingAktif = null;

        if ($karyawan) {
            $hunianAktif  = Hunian::with(['kost', 'kamar'])
                ->where('karyawan_id', $karyawan->id)
                ->where('status', 'aktif')
                ->latest()->first();
        }

        $bookingAktif = Booking::with(['kost', 'kamar'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed', 'aktif'])
            ->latest()->first();

        return response()->json([
            'message'      => 'Dashboard Karyawan',
            'data'         => [
                'karyawan'       => $karyawan,
                'hunian_aktif'   => $hunianAktif,
                'booking_aktif'  => $bookingAktif,
                'total_booking'  => Booking::where('user_id', $user->id)->count(),
            ],
        ]);
    }
}
