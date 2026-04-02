<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KaryawanController;
use App\Http\Controllers\Api\KostController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\HunianController;
use App\Http\Controllers\Api\TrackingController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\KeluhanController;
use App\Http\Controllers\Api\NotifikasiController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UploadController;

use App\Http\Controllers\Api\InvoiceController;

/*
|--------------------------------------------------------------------------
| MyKost API Routes
|--------------------------------------------------------------------------
| Sewa berbasis kost (tanpa tabel kamar / kantor di aplikasi).
| Roles: super_admin | hr | pemilik_kost | karyawan
|--------------------------------------------------------------------------
*/

// TEST ROUTE - Debug 500 error
Route::get('/test', function () {
    return response()->json(['status' => 'OK', 'message' => 'API is working']);
});

// DEBUG: Check all kost data regardless of status
Route::get('/debug/kost', function () {
    $allKost = \App\Models\Kost::all();
    $aktifKost = \App\Models\Kost::where('status', 'aktif')->get();
    return response()->json([
        'message' => 'Debug kost data',
        'total_all' => $allKost->count(),
        'total_aktif' => $aktifKost->count(),
        'status_counts' => \App\Models\Kost::groupBy('status')->selectRaw('status, count(*) as count')->get(),
        'all_data' => $allKost,
    ]);
});

// DEBUG: Check user permissions for kost creation
Route::get('/debug/kost-permissions', function () {
    $user = request()->user();
    if (!$user) {
        return response()->json(['message' => 'Not authenticated'], 401);
    }

    $user->load('role');
    $kostCount = \App\Models\Kost::where('user_id', $user->id)->count();
    $userKosts = \App\Models\Kost::where('user_id', $user->id)->get();

    return response()->json([
        'user_id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role->name,
        'can_create_kost' => $user->hasRole('pemilik_kost') || $user->hasRole('super_admin'),
        'kost_count' => $kostCount,
        'kost_limit' => 'unlimited', // No limit on kost creation
        'user_kosts' => $userKosts,
    ]);
});

// DEBUG: Test kost API with mine parameter
Route::middleware('auth:sanctum')->get('/debug/kost-mine', function () {
    $user = request()->user();
    $user->load('role');

    // Test with mine=1
    $query = \App\Models\Kost::with('user');
    $onlyMine = request()->boolean('mine');

    if ($user && $user->hasRole('pemilik_kost') && $onlyMine) {
        $query->where('user_id', $user->id);
    } else {
        $query->where('status', 'aktif');
    }

    $kosts = $query->latest()->get();

    return response()->json([
        'user_id' => $user->id,
        'role' => $user->role->name,
        'mine_parameter' => $onlyMine,
        'total_kosts' => $kosts->count(),
        'kosts' => $kosts,
    ]);
});

// CRITICAL DEBUG: Check Budi vs Santoso data isolation issue
Route::middleware('auth:sanctum')->get('/debug/budi-santoso-issue', function () {
    $user = request()->user();
    $user->load('role');

    // Get all kosts with their owners
    $allKosts = \App\Models\Kost::with('user')->get();

    // Get Budi's kosts specifically
    $budiKosts = \App\Models\Kost::with('user')->where('user_id', $user->id)->get();

    // Check if there are any kosts owned by someone else that might be showing
    $otherKosts = \App\Models\Kost::with('user')->where('user_id', '!=', $user->id)->get();

    // Simulate the exact query that should be run
    $simulatedQuery = \App\Models\Kost::with('user')->where('user_id', $user->id);
    $simulatedResults = $simulatedQuery->get();

    return response()->json([
        'current_user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->name
        ],
        'all_kosts_count' => $allKosts->count(),
        'budi_kosts_count' => $budiKosts->count(),
        'other_kosts_count' => $otherKosts->count(),
        'simulated_query_results' => $simulatedResults->count(),
        'all_kosts_with_owners' => $allKosts->map(function($kost) {
            return [
                'kost_id' => $kost->id,
                'kost_name' => $kost->nama_kost,
                'owner_id' => $kost->user_id,
                'owner_name' => $kost->user?->name,
                'owner_email' => $kost->user?->email,
                'status' => $kost->status
            ];
        })->toArray(),
        'budi_kosts_only' => $budiKosts->map(function($kost) {
            return [
                'kost_id' => $kost->id,
                'kost_name' => $kost->nama_kost,
                'owner_id' => $kost->user_id,
                'owner_name' => $kost->user?->name,
                'status' => $kost->status
            ];
        })->toArray(),
        'simulated_query_details' => [
            'sql' => $simulatedQuery->toSql(),
            'bindings' => $simulatedQuery->getBindings(),
            'results' => $simulatedResults->map(function($kost) {
                return [
                    'kost_id' => $kost->id,
                    'kost_name' => $kost->nama_kost,
                    'owner_id' => $kost->user_id,
                    'owner_name' => $kost->user?->name,
                    'status' => $kost->status
                ];
            })->toArray()
        ]
    ]);
});

// ============================================================
// AUTH — Public
// ============================================================
Route::prefix('auth')->group(function () {
    Route::post('/register',   [AuthController::class, 'register']);
    Route::post('/verify-otp',      [AuthController::class, 'verifyOtp']);
    Route::post('/resend-otp',      [AuthController::class, 'resendOtp']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
    Route::post('/login',           [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',       [AuthController::class, 'me']);
        Route::post('/update-profile', [AuthController::class, 'updateProfile']);
        Route::post('/logout',  [AuthController::class, 'logout']);
    });
});

// ============================================================
// WEBHOOK MIDTRANS — Public API (Tidak Butuh Token)
// ============================================================
Route::post('/pembayaran/webhook', [PembayaranController::class, 'webhook']);

// ============================================================
// PUBLIC KOST API
// ============================================================
Route::get('/kost', [KostController::class, 'index']);

Route::middleware(['auth:sanctum', 'role:super_admin'])->get('/kost/moderasi', [KostController::class, 'indexModerasi']);

Route::get('/kost/{id}', [KostController::class, 'show']);

// SEARCH API
Route::get('/search/kost',           [SearchController::class, 'cariKost']);
Route::get('/search/kost-sekitar',   [SearchController::class, 'kostSekitar']);

// ============================================================
// SEMUA ROUTE DI BAWAH MEMBUTUHKAN AUTH
// ============================================================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::post('/upload', [UploadController::class, 'store']);

    Route::prefix('karyawan')->middleware('role:hr,super_admin')->group(function () {
        Route::get('/',       [KaryawanController::class, 'index']);
        Route::post('/',      [KaryawanController::class, 'store']);
        Route::get('/{id}',   [KaryawanController::class, 'show']);
        Route::put('/{id}',   [KaryawanController::class, 'update']);
        Route::delete('/{id}',[KaryawanController::class, 'destroy']);
    });

    Route::prefix('kost')->group(function () {
        Route::middleware('role:pemilik_kost,super_admin')->group(function () {
            Route::post('/',       [KostController::class, 'store']);
            Route::put('/{id}',    [KostController::class, 'update']);
            Route::delete('/{id}', [KostController::class, 'destroy']);
        });

        Route::patch('/{id}/status', [KostController::class, 'updateStatus'])
            ->middleware('role:super_admin');

        Route::delete('/{id}/force', [KostController::class, 'destroy'])
            ->middleware('role:super_admin');
    });

    Route::prefix('booking')->group(function () {
        Route::get('/',     [BookingController::class, 'index']);
        Route::get('/{id}', [BookingController::class, 'show']);

        Route::post('/', [BookingController::class, 'store'])
            ->middleware('role:karyawan,super_admin,hr');

        Route::patch('/{id}/confirm', [BookingController::class, 'confirm'])
            ->middleware('role:pemilik_kost,super_admin');

        Route::patch('/{id}/cancel', [BookingController::class, 'cancel']);

        Route::patch('/{id}/aktif', [BookingController::class, 'aktivasi'])
            ->middleware('role:pemilik_kost,super_admin');
    });

    Route::prefix('pembayaran')->group(function () {
        Route::get('/',     [PembayaranController::class, 'index']);
        Route::get('/by-order/{orderId}', [PembayaranController::class, 'showByOrder']);
        Route::post('/sync-status', [PembayaranController::class, 'syncStatus']);

        Route::get('/debug/{orderId}', [PembayaranController::class, 'debugStatus'])
            ->middleware('role:super_admin,pemilik_kost,hr');

        Route::post('/force-sync/{orderId}', [PembayaranController::class, 'forceSync'])
            ->middleware('role:super_admin,hr,pemilik_kost');

        Route::post('/', [PembayaranController::class, 'store'])
            ->middleware('role:karyawan,super_admin,hr');

        Route::get('/{id}', [PembayaranController::class, 'show']);

        Route::patch('/{id}/verify', [PembayaranController::class, 'verify'])
            ->middleware('role:pemilik_kost,super_admin');
    });

    // INVOICE API
    Route::prefix('invoice')->group(function () {
        Route::get('/{pembayaranId}', [InvoiceController::class, 'generate']);
        Route::get('/{pembayaranId}/preview', [InvoiceController::class, 'preview']);
        Route::get('/{pembayaranId}/download', [InvoiceController::class, 'download']);
    });

    Route::prefix('hunian')->group(function () {
        Route::get('/saya',    [HunianController::class, 'saya'])
            ->middleware('role:karyawan');
        Route::get('/riwayat', [HunianController::class, 'riwayat'])
            ->middleware('role:karyawan');

        Route::middleware('role:hr,super_admin')->group(function () {
            Route::post('/',               [HunianController::class, 'store']);
            Route::patch('/{id}/verify',   [HunianController::class, 'verify']);
            Route::patch('/{id}/selesai',  [HunianController::class, 'selesai']);
        });
    });

    Route::prefix('tracking')->middleware('role:hr,super_admin')->group(function () {
        Route::get('/hunian',               [TrackingController::class, 'hunian']);
        Route::get('/hunian/{karyawanId}',  [TrackingController::class, 'detailKaryawan']);
        Route::get('/radius',               [TrackingController::class, 'radius']);
        Route::get('/laporan',              [TrackingController::class, 'laporan']);
        Route::post('/sync-pembayaran',     [TrackingController::class, 'syncPembayaran']);
    });

    Route::prefix('keluhan')->group(function () {
        Route::get('/',     [KeluhanController::class, 'index']);
        Route::get('/{id}', [KeluhanController::class, 'show']);

        Route::post('/', [KeluhanController::class, 'store'])
            ->middleware('role:karyawan');

        Route::patch('/{id}/respon', [KeluhanController::class, 'respon'])
            ->middleware('role:pemilik_kost,super_admin');
    });

    Route::prefix('notifikasi')->group(function () {
        Route::get('/',     [NotifikasiController::class, 'index']);
        Route::post('/read-all', [NotifikasiController::class, 'markAllAsRead']);
        Route::patch('/{id}/read', [NotifikasiController::class, 'markAsRead']);
        Route::delete('/{id}', [NotifikasiController::class, 'destroy']);
    });
});
