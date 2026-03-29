<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KaryawanController;
use App\Http\Controllers\Api\KostController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\HunianController;
use App\Http\Controllers\Api\TrackingController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\KeluhanController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UploadController;

/*
|--------------------------------------------------------------------------
| MyKost API Routes
|--------------------------------------------------------------------------
| Sewa berbasis kost (tanpa tabel kamar / kantor di aplikasi).
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

        Route::post('/', [PembayaranController::class, 'store'])
            ->middleware('role:karyawan,super_admin,hr');

        Route::get('/{id}', [PembayaranController::class, 'show']);

        Route::patch('/{id}/verify', [PembayaranController::class, 'verify'])
            ->middleware('role:pemilik_kost,super_admin');
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
    });

    Route::prefix('keluhan')->group(function () {
        Route::get('/',     [KeluhanController::class, 'index']);
        Route::get('/{id}', [KeluhanController::class, 'show']);

        Route::post('/', [KeluhanController::class, 'store'])
            ->middleware('role:karyawan');

        Route::patch('/{id}/respon', [KeluhanController::class, 'respon'])
            ->middleware('role:pemilik_kost,super_admin');
    });
});
