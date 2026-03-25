<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KantorController;
use App\Http\Controllers\Api\KaryawanController;
use App\Http\Controllers\Api\KostController;
use App\Http\Controllers\Api\KamarController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\HunianController;
use App\Http\Controllers\Api\TrackingController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\KeluhanController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| MyKost API Routes
|--------------------------------------------------------------------------
| Platform kost berbasis wilayah kantor untuk tracking hunian karyawan,
| pencarian kost, penyewaan kamar, dan pembayaran.
|
| Roles: super_admin | hr | pemilik_kost | karyawan
|--------------------------------------------------------------------------
*/

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
// SEMUA ROUTE DI BAWAH MEMBUTUHKAN AUTH
// ============================================================
Route::middleware('auth:sanctum')->group(function () {

    // --------------------------------------------------------
    // DASHBOARD — Response berbeda per role
    // --------------------------------------------------------
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // --------------------------------------------------------
    // KANTOR — Super Admin (CRUD), HR (read)
    // --------------------------------------------------------
    Route::prefix('kantor')->group(function () {
        Route::get('/',    [KantorController::class, 'index']);
        Route::get('/{id}', [KantorController::class, 'show']);

        Route::middleware('role:super_admin')->group(function () {
            Route::post('/',       [KantorController::class, 'store']);
            Route::put('/{id}',    [KantorController::class, 'update']);
            Route::delete('/{id}', [KantorController::class, 'destroy']);
        });
    });

    // --------------------------------------------------------
    // KARYAWAN — HR + Super Admin
    // --------------------------------------------------------
    Route::prefix('karyawan')->middleware('role:hr,super_admin')->group(function () {
        Route::get('/',       [KaryawanController::class, 'index']);
        Route::post('/',      [KaryawanController::class, 'store']);
        Route::get('/{id}',   [KaryawanController::class, 'show']);
        Route::put('/{id}',   [KaryawanController::class, 'update']);
        Route::delete('/{id}',[KaryawanController::class, 'destroy']);
    });

    // --------------------------------------------------------
    // KOST — Semua bisa read, Pemilik Kost bisa create/edit
    // --------------------------------------------------------
    Route::prefix('kost')->group(function () {
        Route::get('/',     [KostController::class, 'index']);
        Route::get('/{id}', [KostController::class, 'show']);

        Route::middleware('role:pemilik_kost')->group(function () {
            Route::post('/',       [KostController::class, 'store']);
            Route::put('/{id}',    [KostController::class, 'update']);
            Route::delete('/{id}', [KostController::class, 'destroy']);
        });

        // Super Admin: approve/reject kost
        Route::patch('/{id}/status', [KostController::class, 'updateStatus'])
            ->middleware('role:super_admin');

        // Super Admin juga bisa delete
        Route::delete('/{id}/force', [KostController::class, 'destroy'])
            ->middleware('role:super_admin');

        // ── KAMAR (nested di bawah kost) ──────────────────
        Route::prefix('/{kostId}/kamar')->group(function () {
            Route::get('/',     [KamarController::class, 'index']);
            Route::get('/{id}', [KamarController::class, 'show']);

            Route::middleware('role:pemilik_kost,super_admin')->group(function () {
                Route::post('/',       [KamarController::class, 'store']);
                Route::put('/{id}',    [KamarController::class, 'update']);
                Route::delete('/{id}', [KamarController::class, 'destroy']);
            });
        });
    });

    // --------------------------------------------------------
    // BOOKING
    // --------------------------------------------------------
    Route::prefix('booking')->group(function () {
        Route::get('/',     [BookingController::class, 'index']);
        Route::get('/{id}', [BookingController::class, 'show']);

        // Karyawan buat booking
        Route::post('/', [BookingController::class, 'store'])
            ->middleware('role:karyawan');

        // Pemilik kost konfirmasi / Super Admin juga bisa
        Route::patch('/{id}/confirm', [BookingController::class, 'confirm'])
            ->middleware('role:pemilik_kost,super_admin');

        // Karyawan atau pemilik kost bisa cancel
        Route::patch('/{id}/cancel', [BookingController::class, 'cancel']);

        // Pemilik kost atau super_admin aktifkan booking
        Route::patch('/{id}/aktif', [BookingController::class, 'aktivasi'])
            ->middleware('role:pemilik_kost,super_admin');
    });

    // --------------------------------------------------------
    // PEMBAYARAN
    // --------------------------------------------------------
    Route::prefix('pembayaran')->group(function () {
        Route::get('/',     [PembayaranController::class, 'index']);
        Route::get('/{id}', [PembayaranController::class, 'show']);

        // Karyawan submit pembayaran
        Route::post('/', [PembayaranController::class, 'store'])
            ->middleware('role:karyawan');

        // Pemilik kost / Super Admin verifikasi pembayaran
        Route::patch('/{id}/verify', [PembayaranController::class, 'verify'])
            ->middleware('role:pemilik_kost,super_admin');
    });

    // --------------------------------------------------------
    // HUNIAN (karyawan lihat sendiri)
    // --------------------------------------------------------
    Route::prefix('hunian')->group(function () {
        Route::get('/saya',    [HunianController::class, 'saya'])
            ->middleware('role:karyawan');
        Route::get('/riwayat', [HunianController::class, 'riwayat'])
            ->middleware('role:karyawan');

        // HR: input manual + verifikasi
        Route::middleware('role:hr,super_admin')->group(function () {
            Route::post('/',               [HunianController::class, 'store']);
            Route::patch('/{id}/verify',   [HunianController::class, 'verify']);
            Route::patch('/{id}/selesai',  [HunianController::class, 'selesai']);
        });
    });

    // --------------------------------------------------------
    // TRACKING — HR + Super Admin
    // --------------------------------------------------------
    Route::prefix('tracking')->middleware('role:hr,super_admin')->group(function () {
        Route::get('/hunian',               [TrackingController::class, 'hunian']);
        Route::get('/hunian/{karyawanId}',  [TrackingController::class, 'detailKaryawan']);
        Route::get('/radius',               [TrackingController::class, 'radius']);
        Route::get('/laporan',              [TrackingController::class, 'laporan']);
    });

    // --------------------------------------------------------
    // SEARCH — Semua authenticated
    // --------------------------------------------------------
    Route::prefix('search')->group(function () {
        Route::get('/kost',            [SearchController::class, 'cariKost']);
        Route::get('/kost-by-kantor',  [SearchController::class, 'kostByKantor']);
    });

    // --------------------------------------------------------
    // KELUHAN
    // --------------------------------------------------------
    Route::prefix('keluhan')->group(function () {
        Route::get('/',     [KeluhanController::class, 'index']);
        Route::get('/{id}', [KeluhanController::class, 'show']);

        Route::post('/', [KeluhanController::class, 'store'])
            ->middleware('role:karyawan');

        Route::patch('/{id}/respon', [KeluhanController::class, 'respon'])
            ->middleware('role:pemilik_kost,super_admin');
    });
});