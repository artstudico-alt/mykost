<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\AuthController;

// Simple ping route for Railway health check (no DB)
Route::get('/ping', function () {
    return response()->json(['status' => 'pong', 'time' => now()->toIso8601String()]);
});

// Health check untuk monitoring deployment
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
            'database' => 'connected'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'unhealthy',
            'timestamp' => now()->toIso8601String(),
            'database' => 'disconnected',
            'error' => $e->getMessage()
        ], 500);
    }
});
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
use App\Http\Controllers\Api\LandingPageController;

Route::get('/landing-page', [LandingPageController::class, 'index']);
Route::post('/landing-page', [LandingPageController::class, 'update'])
    ->middleware(['auth:sanctum', 'role:super_admin']);

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
    try {
        $count = \App\Models\Kost::count();
        return response()->json([
            'message' => 'Debug kost data',
            'count' => $count,
            'db_connected' => true
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Error: ' . $e->getMessage(),
            'db_connected' => false
        ], 500);
    }
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

// DEBUG: Profile data access check
Route::middleware('auth:sanctum')->get('/debug/profile-access', function () {
    $user = request()->user();
    $user->load('role');

    // Test access to each endpoint that profile tries to fetch
    $endpoints = [
        'booking' => '/api/booking',
        'pembayaran' => '/api/pembayaran',
        'keluhan' => '/api/keluhan',
        'kost' => $user->hasRole('pemilik_kost') ? '/api/kost?mine=1' : ($user->hasRole('super_admin') ? '/api/kost/moderasi' : '/api/kost')
    ];

    $results = [];

    foreach ($endpoints as $name => $url) {
        try {
            // Simulate the API call logic
            $response = null;
            $error = null;

            if ($name === 'booking') {
                $query = \App\Models\Booking::with(['user', 'kost', 'pembayarans']);
                if ($user->hasRole('karyawan')) {
                    $query->where('user_id', $user->id);
                } elseif ($user->hasRole('pemilik_kost')) {
                    $query->whereHas('kost', fn($q) => $q->where('user_id', $user->id));
                }
                $data = $query->get();
                $response = ['data' => $data, 'count' => $data->count()];

            } elseif ($name === 'pembayaran') {
                $query = \App\Models\Pembayaran::with(['booking.user', 'booking.kost']);
                if ($user->hasRole('super_admin')) {
                    // No filter
                } elseif ($user->hasRole('karyawan')) {
                    $query->whereHas('booking', fn ($q) => $q->where('user_id', $user->id));
                } elseif ($user->hasRole('pemilik_kost')) {
                    $query->whereHas('booking.kost', fn ($q) => $q->where('user_id', $user->id));
                }
                $data = $query->get();
                $response = ['data' => $data, 'count' => $data->count()];

            } elseif ($name === 'keluhan') {
                $query = \App\Models\Keluhan::with(['user', 'kost']);
                if ($user->hasRole('karyawan')) {
                    $query->where('user_id', $user->id);
                } elseif ($user->hasRole('pemilik_kost')) {
                    $query->whereHas('kost', fn($q) => $q->where('user_id', $user->id));
                } elseif ($user->hasRole('super_admin')) {
                    // No filter
                }
                $data = $query->get();
                $response = ['data' => $data, 'count' => $data->count()];

            } elseif ($name === 'kost') {
                $query = \App\Models\Kost::with('user');
                if ($user->hasRole('pemilik_kost') && str_contains($url, 'mine=1')) {
                    $query->where('user_id', $user->id);
                } elseif ($user->hasRole('super_admin') && str_contains($url, 'moderasi')) {
                    // All kosts for moderation
                } else {
                    $query->where('status', 'aktif');
                }
                $data = $query->get();
                $response = ['data' => $data, 'count' => $data->count()];
            }

            $results[$name] = [
                'accessible' => true,
                'url' => $url,
                'response' => $response,
                'error' => null
            ];

        } catch (\Exception $e) {
            $results[$name] = [
                'accessible' => false,
                'url' => $url,
                'response' => null,
                'error' => $e->getMessage()
            ];
        }
    }

    return response()->json([
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->name
        ],
        'endpoint_access' => $results
    ]);
});

// DEBUG: Test auth/me endpoint directly
Route::middleware('auth:sanctum')->get('/debug/auth-me', function () {
    try {
        $user = request()->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No user found in request',
                'has_token' => request()->bearerToken() ? true : false,
                'token_length' => request()->bearerToken() ? strlen(request()->bearerToken()) : 0
            ], 401);
        }

        // Test role loading
        $roleLoaded = false;
        $roleError = null;
        try {
            $user->load('role');
            $roleLoaded = true;
        } catch (\Exception $e) {
            $roleError = $e->getMessage();
        }

        return response()->json([
            'success' => true,
            'message' => 'Auth/me debug successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_loaded' => $roleLoaded,
                'role_name' => $user->role?->name ?? 'unknown',
                'role_error' => $roleError
            ],
            'debug_info' => [
                'has_token' => request()->bearerToken() ? true : false,
                'token_length' => request()->bearerToken() ? strlen(request()->bearerToken()) : 0,
                'user_model_class' => get_class($user),
                'sanctum_tokens_count' => $user->tokens()->count()
            ]
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Debug endpoint failed: ' . $e->getMessage(),
            'error_details' => [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]
        ], 500);
    }
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
// GET /api/kost — Butuh auth untuk identifikasi user (guest akan return aktif only)
Route::middleware('auth:sanctum')->get('/kost', [KostController::class, 'index']);

// Route spesifik HARUS sebelum route dengan parameter {id}
Route::middleware(['auth:sanctum', 'role:super_admin'])->get('/kost/moderasi', [KostController::class, 'indexModerasi']);

// Route dengan parameter {id} diletakkan PALING BAWAH
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

    // (kosong - /api/kost sudah di atas)

    Route::prefix('kost')->group(function () {
        Route::middleware('role:pemilik_kost,super_admin')->group(function () {
            Route::post('/',       [KostController::class, 'store']);
            Route::put('/{id}',    [KostController::class, 'update']);
            Route::delete('/{id}', [KostController::class, 'destroy']);

            // Permintaan hapus kost dengan alasan (untuk pemilik kost)
            Route::post('/{id}/request-delete', [KostController::class, 'requestDelete']);
        });

        Route::patch('/{id}/status', [KostController::class, 'updateStatus'])
            ->middleware('role:super_admin');

        Route::delete('/{id}/force', [KostController::class, 'destroy'])
            ->middleware('role:super_admin');
    });

    // Admin: kelola permintaan hapus kost
    Route::prefix('admin')->middleware('role:super_admin')->group(function () {
        Route::get('/kost-delete-requests', [KostController::class, 'indexDeleteRequests']);
        Route::patch('/kost-delete-requests/{id}/approve', [KostController::class, 'approveDelete']);
        Route::patch('/kost-delete-requests/{id}/reject', [KostController::class, 'rejectDelete']);
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

// DEBUG: Check booking-payment synchronization issue
Route::middleware('auth:sanctum')->get('/debug/booking-payment-sync', function () {
    $user = request()->user();
    $user->load('role');

    try {
        // Get user's bookings
        $bookings = \App\Models\Booking::with(['kost', 'pembayarans'])
            ->when($user->hasRole('karyawan'), fn($q) => $q->where('user_id', $user->id))
            ->when($user->hasRole('pemilik_kost'), fn($q) => $q->whereHas('kost', fn($q) => $q->where('user_id', $user->id)))
            ->latest()
            ->get();

        // Get user's payments
        $payments = \App\Models\Pembayaran::with(['booking.user', 'booking.kost'])
            ->when($user->hasRole('karyawan'), fn($q) => $q->whereHas('booking', fn($q) => $q->where('user_id', $user->id)))
            ->when($user->hasRole('pemilik_kost'), fn($q) => $q->whereHas('booking.kost', fn($q) => $q->where('user_id', $user->id)))
            ->latest()
            ->get();

        // Analyze synchronization issues
        $syncIssues = [];
        foreach ($bookings as $booking) {
            $hasPayment = $booking->pembayarans->count() > 0;

            if (!$hasPayment && in_array($booking->status, ['confirmed', 'aktif'])) {
                $syncIssues[] = [
                    'type' => 'missing_payment',
                    'booking_id' => $booking->id,
                    'booking_status' => $booking->status,
                    'kost_name' => $booking->kost->nama_kost,
                    'user_name' => $booking->user->name,
                    'issue' => 'Booking confirmed/active but no payment record'
                ];
            }

            if ($hasPayment && $booking->status === 'pending') {
                $syncIssues[] = [
                    'type' => 'payment_without_confirmation',
                    'booking_id' => $booking->id,
                    'booking_status' => $booking->status,
                    'payment_status' => $booking->pembayarans->first()->status,
                    'issue' => 'Payment exists but booking still pending'
                ];
            }
        }

        // Check for orphaned payments
        foreach ($payments as $payment) {
            if (!$payment->booking) {
                $syncIssues[] = [
                    'type' => 'orphaned_payment',
                    'payment_id' => $payment->id,
                    'booking_id' => $payment->booking_id,
                    'issue' => 'Payment exists but booking not found'
                ];
            }
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role->name
            ],
            'bookings_count' => $bookings->count(),
            'payments_count' => $payments->count(),
            'sync_issues_count' => count($syncIssues),
            'bookings' => $bookings->map(function($booking) {
                return [
                    'id' => $booking->id,
                    'status' => $booking->status,
                    'kost_name' => $booking->kost->nama_kost,
                    'payments_count' => $booking->pembayarans->count(),
                    'total_harga' => $booking->total_harga,
                    'user_name' => $booking->user->name
                ];
            })->toArray(),
            'payments' => $payments->map(function($payment) {
                return [
                    'id' => $payment->id,
                    'status' => $payment->status,
                    'jumlah' => $payment->jumlah,
                    'booking_id' => $payment->booking_id,
                    'booking_status' => $payment->booking?->status,
                    'order_id' => $payment->order_id
                ];
            })->toArray(),
            'sync_issues' => $syncIssues
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Debug endpoint failed: ' . $e->getMessage(),
            'error_details' => [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]
        ], 500);
    }
});
