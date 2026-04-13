<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Hunian;
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
        $period = $request->get('period', 'week'); // today, week, month, year

        $response = match ($user->role?->name) {
            'super_admin'  => $this->dashboardSuperAdmin($period),
            'hr'           => $this->dashboardHr($user),
            'pemilik_kost' => $this->dashboardPemilikKost($user),
            'karyawan'     => $this->dashboardKaryawan($user),
            default        => response()->json(['message' => 'Role tidak dikenali'], 403),
        };

        // Add cache control headers
        return $response->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                        ->header('Pragma', 'no-cache')
                        ->header('Expires', '0');
    }

    private function dashboardSuperAdmin($period = 'week')
    {
        $totalKost = Kost::count();
        $kostAktif = Kost::where('status', 'aktif')->count();
        $kostPending = Kost::where('status', 'pending')->count();
        $kostNonaktif = Kost::where('status', 'nonaktif')->orWhereNull('status')->count();

        // Cash flow berdasarkan periode yang dipilih
        $cashFlow = $this->getCashFlowByPeriod($period);

        // Property distribution percentages
        $propertyDistribution = [
            'aktif' => $totalKost > 0 ? round(($kostAktif / $totalKost) * 100, 1) : 0,
            'pending' => $totalKost > 0 ? round(($kostPending / $totalKost) * 100, 1) : 0,
            'nonaktif' => $totalKost > 0 ? round(($kostNonaktif / $totalKost) * 100, 1) : 0,
        ];

        return response()->json([
            'message' => 'Dashboard Super Admin',
            'data'    => [
                'total_user'       => User::count(),
                'total_kost'       => $totalKost,
                'kost_pending'     => $kostPending,
                'kost_aktif'       => $kostAktif,
                'kost_nonaktif'    => $kostNonaktif,
                'total_karyawan'   => Karyawan::count(),
                'total_booking'    => Booking::count(),
                'booking_pending'  => Booking::where('status', 'pending')->count(),
                'booking_aktif'    => Booking::where('status', 'aktif')->count(),
                'total_pembayaran' => Pembayaran::count(),
                'pembayaran_berhasil' => Pembayaran::where('status', 'berhasil')->sum('jumlah'),
                'hunian_aktif'     => Hunian::where('status', 'aktif')->count(),
                // New real data for charts
                'cash_flow' => $cashFlow,
                'property_distribution' => $propertyDistribution,
                'period' => $period,
            ],
        ]);
    }

    private function getCashFlowByPeriod($period)
    {
        $cashFlow = [];

        switch ($period) {
            case 'today':
                // 24 jam terakhir, per 4 jam
                $labels = ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'];
                for ($i = 0; $i < 6; $i++) {
                    $startHour = $i * 4;
                    $endHour = ($i + 1) * 4;
                    $amount = Pembayaran::where('status', 'berhasil')
                        ->whereDate('created_at', today())
                        ->whereRaw('HOUR(created_at) >= ? AND HOUR(created_at) < ?', [$startHour, $endHour])
                        ->sum('jumlah');
                    $cashFlow[] = [
                        'day' => $labels[$i],
                        'amount' => round($amount / 1000, 0),
                        'full_amount' => $amount,
                    ];
                }
                break;

            case 'week':
                // 7 hari terakhir
                $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                for ($i = 6; $i >= 0; $i--) {
                    $date = now()->subDays($i);
                    $amount = Pembayaran::where('status', 'berhasil')
                        ->whereDate('created_at', $date)
                        ->sum('jumlah');
                    $cashFlow[] = [
                        'day' => $days[6 - $i],
                        'amount' => round($amount / 1000, 0),
                        'full_amount' => $amount,
                    ];
                }
                break;

            case 'month':
                // 30 hari terakhir, per 5 hari
                $labels = ['1-5', '6-10', '11-15', '16-20', '21-25', '26-30'];
                for ($i = 0; $i < 6; $i++) {
                    $startDay = ($i * 5) + 1;
                    $endDay = ($i + 1) * 5;
                    $amount = Pembayaran::where('status', 'berhasil')
                        ->whereMonth('created_at', now()->month)
                        ->whereYear('created_at', now()->year)
                        ->whereRaw('DAY(created_at) >= ? AND DAY(created_at) <= ?', [$startDay, $endDay])
                        ->sum('jumlah');
                    $cashFlow[] = [
                        'day' => $labels[$i],
                        'amount' => round($amount / 1000, 0),
                        'full_amount' => $amount,
                    ];
                }
                break;

            case 'year':
                // 12 bulan dalam tahun ini
                $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                for ($i = 1; $i <= 12; $i++) {
                    $amount = Pembayaran::where('status', 'berhasil')
                        ->whereMonth('created_at', $i)
                        ->whereYear('created_at', now()->year)
                        ->sum('jumlah');
                    $cashFlow[] = [
                        'day' => $months[$i - 1],
                        'amount' => round($amount / 1000, 0),
                        'full_amount' => $amount,
                    ];
                }
                break;

            default:
                // Default 7 hari
                $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                for ($i = 6; $i >= 0; $i--) {
                    $date = now()->subDays($i);
                    $amount = Pembayaran::where('status', 'berhasil')
                        ->whereDate('created_at', $date)
                        ->sum('jumlah');
                    $cashFlow[] = [
                        'day' => $days[6 - $i],
                        'amount' => round($amount / 1000, 0),
                        'full_amount' => $amount,
                    ];
                }
        }

        return $cashFlow;
    }

    private function dashboardHr(User $user)
    {
        $totalKaryawan = Karyawan::count();
        $hunians       = Hunian::all();

        return response()->json([
            'message' => 'Dashboard HR',
            'data'    => [
                'total_karyawan'      => $totalKaryawan,
                'karyawan_aktif'      => Karyawan::where('status', 'aktif')->count(),
                'punya_hunian'        => $hunians->where('status', 'aktif')->count(),
                'belum_ada_hunian'    => max(0, $totalKaryawan - $hunians->where('status', 'aktif')->count()),
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
                'booking_pending'    => Booking::whereIn('kost_id', $kostIds)->where('status', 'pending')->count(),
                'booking_aktif'      => Booking::whereIn('kost_id', $kostIds)->where('status', 'aktif')->count(),
                'total_pendapatan'   => Pembayaran::whereHas('booking', fn ($q) => $q->whereIn('kost_id', $kostIds))
                    ->where('status', 'berhasil')->sum('jumlah'),
            ],
        ]);
    }

    private function dashboardKaryawan(User $user)
    {
        $karyawan = Karyawan::where('user_id', $user->id)->first();

        // Optimized queries with single database calls
        $hunianAktif = null;
        $bookingAktif = null;

        if ($karyawan) {
            $hunianAktif = Hunian::with(['kost'])
                ->where('karyawan_id', $karyawan->id)
                ->where('status', 'aktif')
                ->latest()
                ->first();
        }

        $bookingAktif = Booking::with(['kost'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed', 'aktif'])
            ->latest()
            ->first();

        // Get total booking count in a single query
        $totalBooking = Booking::where('user_id', $user->id)->count();

        return response()->json([
            'message'      => 'Dashboard Karyawan',
            'data'         => [
                'karyawan'       => $karyawan,
                'hunian_aktif'   => $hunianAktif,
                'booking_aktif'  => $bookingAktif,
                'total_booking'  => $totalBooking,
            ],
        ]);
    }
}
