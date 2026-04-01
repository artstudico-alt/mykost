<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Pembayaran;
use App\Services\MidtransPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Midtrans\Snap;

class PembayaranController extends Controller
{
    // GET /api/pembayaran
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Pembayaran::with(['booking.user', 'booking.kost']);

        // Super admin bisa lihat semua pembayaran
        if ($user->hasRole('super_admin')) {
            // Tidak ada filter, lihat semua
        } elseif ($user->hasRole('karyawan')) {
            $query->whereHas('booking', fn ($q) => $q->where('user_id', $user->id));
        } elseif ($user->hasRole('pemilik_kost')) {
            $query->whereHas('booking.kost', fn ($q) => $q->where('user_id', $user->id));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $pembayarans = $query->latest()->get();

        // Sinkronkan status pembayaran dengan status booking
        $pembayarans->each(function ($p) {
            $bookingStatus = $p->booking?->status;
            // Jika booking aktif, pembayaran harus lunas
            if ($bookingStatus === 'aktif' && $p->status !== 'lunas') {
                $p->status = 'lunas';
                // Update database juga untuk konsistensi
                Pembayaran::where('id', $p->id)->update(['status' => 'lunas']);
            }
        });

        $response = response()->json([
            'message' => 'Data pembayaran berhasil diambil',
            'total'   => $pembayarans->count(),
            'data'    => $pembayarans,
        ]);

        // Add cache control headers
        return $response->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                        ->header('Pragma', 'no-cache')
                        ->header('Expires', '0');
    }

    /**
     * GET /api/pembayaran/by-order/{orderId}
     * Untuk halaman callback setelah redirect Snap (polling status lokal).
     */
    public function showByOrder(Request $request, string $orderId)
    {
        $pembayaran = Pembayaran::with(['booking.kost', 'booking.user'])->where('nomor_referensi', $orderId)->first();

        if (! $pembayaran) {
            return response()->json(['message' => 'Pembayaran tidak ditemukan'], 404);
        }

        $user    = $request->user();
        $booking = $pembayaran->booking;
        $kost    = $booking->kost;

        $isPenyewa = (int) $user->id === (int) $booking->user_id;
        $isPemilik = $user->hasRole('pemilik_kost') && (int) $kost->user_id === (int) $user->id;
        $isAdmin   = $user->hasAnyRole(['super_admin', 'hr']);

        if (! $isPenyewa && ! $isPemilik && ! $isAdmin) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        return response()->json([
            'message' => 'OK',
            'data'    => $pembayaran,
        ]);
    }

    /**
     * POST /api/pembayaran/sync-status
     * Sinkronkan dari API Midtrans (jika webhook belum sempat atau untuk uji sandbox).
     */
    public function syncStatus(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|string|max:100',
        ]);

        $pembayaran = Pembayaran::with('booking.kost')->where('nomor_referensi', $validated['order_id'])->first();

        if (! $pembayaran) {
            return response()->json(['message' => 'Pembayaran tidak ditemukan'], 404);
        }

        $user    = $request->user();
        $booking = $pembayaran->booking;
        $isPenyewa = (int) $booking->user_id === (int) $user->id;
        $isPemilik = $user->hasRole('pemilik_kost')
            && (int) $booking->kost->user_id === (int) $user->id;

        if (! $isPenyewa && ! $isPemilik && ! $user->hasAnyRole(['super_admin', 'hr'])) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $updated = MidtransPaymentService::syncOrderStatus($validated['order_id']);

        if (! $updated) {
            return response()->json([
                'message' => 'Sinkronisasi gagal atau data belum tersedia di Midtrans.',
            ], 404);
        }

        return response()->json([
            'message' => 'Status berhasil disinkronkan.',
            'data'    => $updated,
        ]);
    }

    // POST /api/pembayaran — dapat snap_token + redirect_url (halaman pembayaran Midtrans)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'jumlah'     => 'required|numeric|min:0',
            'keterangan' => 'nullable|string',
        ]);

        $user    = $request->user();
        $booking = Booking::with('kost')->find($validated['booking_id']);

        if (! $booking) {
            return response()->json(['message' => 'Booking tidak ditemukan'], 404);
        }

        if ($booking->user_id !== $user->id && ! $user->hasAnyRole(['super_admin'])) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if (! in_array($booking->status, ['pending', 'confirmed', 'aktif'], true)) {
            return response()->json([
                'message' => 'Booking status: ' . $booking->status . ' tidak bisa diproses pembayarannya',
            ], 422);
        }

        $nomor_referensi = 'PAY-' . strtoupper(Str::random(10));
        $grossAmount     = (int) max(1, round((float) $validated['jumlah']));

        MidtransPaymentService::configure();

        $frontend = rtrim(config('midtrans.frontend_url', 'http://localhost:5173'), '/');

        $params = [
            'transaction_details' => [
                'order_id'       => $nomor_referensi,
                'gross_amount'    => $grossAmount,
            ],
            'customer_details' => [
                'first_name' => substr((string) $user->name, 0, 50),
                'email'      => $user->email,
                'phone'      => $user->phone ?? '08123456789',
            ],
            'item_details' => [
                [
                    'id'       => 'kost-' . (string) $booking->kost_id,
                    'price'    => $grossAmount,
                    'quantity' => 1,
                    'name'     => 'Sewa Kost: ' . $booking->kost->nama_kost,
                ],
            ],
            'callbacks' => [
                'finish'   => $frontend . '/#/pembayaran/selesai',
                'unfinish' => $frontend . '/#/pembayaran/unfinish',
                'error'    => $frontend . '/#/pembayaran/error',
            ],
        ];

        try {
            $snapResponse = Snap::createTransaction($params);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat transaksi Snap Midtrans: ' . $e->getMessage(),
            ], 500);
        }

        $snapToken   = $snapResponse->token;
        $redirectUrl = $snapResponse->redirect_url ?? null;

        $pembayaran = Pembayaran::create([
            'booking_id'      => $booking->id,
            'jumlah'          => $grossAmount,
            'metode'          => 'transfer',
            'nomor_referensi' => $nomor_referensi,
            'snap_token'      => $snapToken,
            'status'          => 'pending',
            'keterangan'      => $validated['keterangan'] ?? null,
        ]);

        return response()->json([
            'message'      => 'Pembayaran diinisiasi — lanjutkan di halaman Midtrans',
            'snap_token'   => $snapToken,
            'redirect_url' => $redirectUrl,
            'data'         => $pembayaran->load('booking'),
        ], 201);
    }

    // GET /api/pembayaran/{id}
    public function show(Request $request, $id)
    {
        $pembayaran = Pembayaran::with(['booking.user', 'booking.kost'])->find($id);

        if (! $pembayaran) {
            return response()->json(['message' => 'Data pembayaran tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail pembayaran berhasil diambil',
            'data'    => $pembayaran,
        ]);
    }

    // PATCH /api/pembayaran/{id}/verify — verifikasi manual (override)
    public function verify(Request $request, $id)
    {
        $pembayaran = Pembayaran::with(['booking.kost'])->find($id);

        if (! $pembayaran) {
            return response()->json(['message' => 'Data pembayaran tidak ditemukan'], 404);
        }

        $request->validate([
            'status'     => 'required|in:lunas,gagal,refund',
            'keterangan' => 'nullable|string',
        ]);

        if ($request->status === 'lunas') {
            if ($request->filled('keterangan')) {
                $pembayaran->update(['keterangan' => $request->keterangan]);
            }
            MidtransPaymentService::markPembayaranBerhasil($pembayaran->fresh(), $pembayaran->metode ?: 'transfer');
        } else {
            $pembayaran->update([
                'status'        => $request->status,
                'tanggal_bayar' => null,
                'keterangan'    => $request->keterangan ?? $pembayaran->keterangan,
            ]);
        }

        return response()->json([
            'message' => 'Status pembayaran berhasil diperbarui',
            'data'    => $pembayaran->fresh()->load('booking'),
        ]);
    }

    /**
     * GET /api/pembayaran/debug/{orderId} — debug status dari Midtrans
     */
    public function debugStatus(Request $request, string $orderId)
    {
        $user = $request->user();
        if (! $user->hasAnyRole(['super_admin', 'pemilik_kost', 'hr'])) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $pembayaran = Pembayaran::with('booking.kost')->where('nomor_referensi', $orderId)->first();

        MidtransPaymentService::configure();

        try {
            $remote = \Midtrans\Transaction::status($orderId);
            $remoteData = json_decode(json_encode($remote), true);
        } catch (\Throwable $e) {
            $remoteData = ['error' => $e->getMessage()];
        }

        return response()->json([
            'local' => $pembayaran,
            'midtrans' => $remoteData,
            'server_key_configured' => !empty(config('midtrans.server_key')),
            'is_production' => config('midtrans.is_production'),
        ]);
    }

    /**
     * POST /api/pembayaran/force-sync/{orderId} — force sync status (bisa buat baru)
     */
    public function forceSync(Request $request, string $orderId)
    {
        $user = $request->user();
        if (! $user->hasAnyRole(['super_admin', 'hr', 'pemilik_kost'])) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $pembayaran = Pembayaran::where('nomor_referensi', $orderId)->first();

        // Jika pembayaran tidak ada, coba ambil dari Midtrans dan buat baru
        if (! $pembayaran) {
            MidtransPaymentService::configure();
            try {
                $remote = \Midtrans\Transaction::status($orderId);
                $tx = json_decode(json_encode($remote), true);

                $amount = $tx['gross_amount'] ?? 0;
                $customerEmail = $tx['customer_details']['email'] ?? null;
                $paymentType = strtolower($tx['payment_type'] ?? 'transfer');
                $transactionStatus = $tx['transaction_status'] ?? '';

                // Cari user
                $payUser = \App\Models\User::where('email', $customerEmail)->first();
                if (! $payUser) {
                    return response()->json([
                        'message' => 'User tidak ditemukan untuk email: ' . $customerEmail,
                        'order_id' => $orderId,
                    ], 404);
                }

                // Buat booking dummy - selalu pakai kost_id 1 yang sudah ada
                $booking = \App\Models\Booking::create([
                    'user_id' => $payUser->id,
                    'kost_id' => 1, // Selalu pakai kost ID 1 yang sudah ada
                    'tanggal_mulai' => now(),
                    'tanggal_selesai' => now()->addMonth(),
                    'durasi_bulan' => 1,
                    'harga_per_bulan' => $amount,
                    'total' => $amount,
                    'status' => in_array($transactionStatus, ['settlement', 'capture']) ? 'aktif' : 'pending',
                    'catatan' => 'Dibuat otomatis dari force-sync: ' . $orderId,
                ]);

                // Buat pembayaran
                $pembayaran = Pembayaran::create([
                    'booking_id' => $booking->id,
                    'jumlah' => $amount,
                    'metode' => $paymentType,
                    'nomor_referensi' => $orderId,
                    'status' => in_array($transactionStatus, ['settlement', 'capture']) ? 'lunas' : 'pending',
                    'keterangan' => 'Dibuat dari force-sync Midtrans',
                    'tanggal_bayar' => in_array($transactionStatus, ['settlement', 'capture']) ? now() : null,
                ]);

                // Buat hunian langsung jika sudah settlement/capture dan karyawan sudah ada
                $karyawan = \App\Models\Karyawan::where('user_id', $payUser->id)->first();
                if ($karyawan && in_array($transactionStatus, ['settlement', 'capture']) && !\App\Models\Hunian::where('booking_id', $booking->id)->exists()) {
                    // Selesaikan hunian aktif sebelumnya
                    \App\Models\Hunian::where('karyawan_id', $karyawan->id)
                        ->where('status', 'aktif')
                        ->update(['status' => 'selesai', 'tanggal_keluar' => now()]);

                    // Buat hunian baru
                    \App\Models\Hunian::create([
                        'karyawan_id' => $karyawan->id,
                        'kost_id' => $booking->kost_id,
                        'booking_id' => $booking->id,
                        'tanggal_masuk' => $booking->tanggal_mulai,
                        'tanggal_keluar' => $booking->tanggal_selesai,
                        'status' => 'aktif',
                        'is_verified' => false,
                    ]);
                }

            } catch (\Throwable $e) {
                return response()->json([
                    'message' => 'Gagal mengambil data dari Midtrans: ' . $e->getMessage(),
                    'order_id' => $orderId,
                ], 500);
            }
        }

        $updated = MidtransPaymentService::syncOrderStatus($orderId);

        if (! $updated) {
            return response()->json([
                'message' => 'Sinkronisasi gagal setelah membuat pembayaran.',
                'order_id' => $orderId,
            ], 500);
        }

        // Jika pembayaran sudah lunas tapi belum ada hunian, coba buat hunian
        if ($updated->status === 'lunas') {
            $booking = $updated->booking;
            if ($booking) {
                $payUser = \App\Models\User::find($booking->user_id);
                if ($payUser) {
                    $karyawan = \App\Models\Karyawan::where('user_id', $payUser->id)->first();
                    if ($karyawan && !\App\Models\Hunian::where('booking_id', $booking->id)->exists()) {
                        // Selesaikan hunian aktif sebelumnya
                        \App\Models\Hunian::where('karyawan_id', $karyawan->id)
                            ->where('status', 'aktif')
                            ->update(['status' => 'selesai', 'tanggal_keluar' => now()]);

                        // Buat hunian baru
                        \App\Models\Hunian::create([
                            'karyawan_id' => $karyawan->id,
                            'kost_id' => $booking->kost_id,
                            'booking_id' => $booking->id,
                            'tanggal_masuk' => $booking->tanggal_mulai,
                            'tanggal_keluar' => $booking->tanggal_selesai,
                            'status' => 'aktif',
                            'is_verified' => false,
                        ]);
                    }
                }
            }
        }

        return response()->json([
            'message' => 'Status berhasil disinkronkan',
            'data' => $updated->load('booking'),
        ]);
    }
    public function webhook(Request $request)
    {
        $payload = $request->all();

        Log::info('Midtrans webhook received', [
            'payload' => $payload,
            'headers' => $request->headers->all(),
        ]);

        $orderId = $payload['order_id'] ?? null;
        if (! $orderId) {
            Log::warning('Midtrans webhook tanpa order_id');
            return response()->json(['message' => 'invalid payload'], 400);
        }

        $serverKey     = (string) config('midtrans.server_key');
        $statusCode    = (string) ($payload['status_code'] ?? '');
        $grossAmount   = (string) ($payload['gross_amount'] ?? '');
        $signatureKey  = (string) ($payload['signature_key'] ?? '');

        Log::info('Midtrans webhook signature check', [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_received' => $signatureKey,
            'server_key_configured' => !empty($serverKey),
        ]);

        $expectedSig = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
        if ($signatureKey === '' || ! hash_equals($expectedSig, $signatureKey)) {
            Log::warning('Midtrans webhook signature tidak cocok', [
                'order_id' => $orderId,
                'expected' => $expectedSig,
                'received' => $signatureKey,
            ]);
            return response()->json(['message' => 'invalid signature'], 403);
        }

        // Cek apakah pembayaran sudah ada
        $pembayaran = Pembayaran::where('nomor_referensi', $orderId)->first();

        if (! $pembayaran) {
            // Pembayaran tidak ditemukan - buat baru dari data Midtrans
            Log::info('Membuat pembayaran baru dari webhook Midtrans', ['order_id' => $orderId]);

            // Extract data dari payload
            $customerEmail = $payload['customer_details']['email'] ?? null;
            $customerName = $payload['customer_details']['first_name'] ?? 'Unknown';
            $itemName = $payload['item_details'][0]['name'] ?? 'Sewa Kost';
            $amount = $payload['gross_amount'] ?? 0;

            // Cari user berdasarkan email
            $user = \App\Models\User::where('email', $customerEmail)->first();

            if (! $user) {
                Log::warning('User tidak ditemukan untuk email', ['email' => $customerEmail, 'order_id' => $orderId]);
                return response()->json(['message' => 'user not found'], 404);
            }

            // Cari kost dari nama item atau buat dummy booking
            $kostId = null;
            if (str_starts_with($itemName, 'Sewa Kost: ')) {
                $kostName = substr($itemName, 11);
                $kost = \App\Models\Kost::where('nama_kost', $kostName)->first();
                $kostId = $kost?->id;
            }

            // Buat booking jika belum ada
            $booking = \App\Models\Booking::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'kost_id' => $kostId ?? 1, // fallback ke kost ID 1
                    'status' => 'pending',
                ],
                [
                    'tanggal_mulai' => now(),
                    'tanggal_selesai' => now()->addMonth(),
                    'durasi_bulan' => 1,
                    'harga_per_bulan' => $amount,
                    'total' => $amount,
                    'catatan' => 'Dibuat otomatis dari webhook Midtrans: ' . $orderId,
                ]
            );

            // Buat pembayaran
            $pembayaran = Pembayaran::create([
                'booking_id' => $booking->id,
                'jumlah' => $amount,
                'metode' => strtolower($payload['payment_type'] ?? 'transfer'),
                'nomor_referensi' => $orderId,
                'status' => 'pending',
                'keterangan' => 'Dibuat dari webhook Midtrans',
            ]);

            Log::info('Pembayaran baru dibuat', ['pembayaran_id' => $pembayaran->id, 'booking_id' => $booking->id]);

            // Buat hunian langsung jika karyawan sudah ada
            $karyawan = \App\Models\Karyawan::where('user_id', $user->id)->first();
            if ($karyawan && !\App\Models\Hunian::where('booking_id', $booking->id)->exists()) {
                // Selesaikan hunian aktif sebelumnya
                \App\Models\Hunian::where('karyawan_id', $karyawan->id)
                    ->where('status', 'aktif')
                    ->update(['status' => 'selesai', 'tanggal_keluar' => now()]);

                // Buat hunian baru
                \App\Models\Hunian::create([
                    'karyawan_id' => $karyawan->id,
                    'kost_id' => $booking->kost_id,
                    'booking_id' => $booking->id,
                    'tanggal_masuk' => $booking->tanggal_mulai,
                    'tanggal_keluar' => $booking->tanggal_selesai,
                    'status' => 'aktif',
                    'is_verified' => false,
                ]);
            }
        }

        $updated = MidtransPaymentService::syncOrderStatus($orderId);

        if (! $updated) {
            Log::error('Midtrans webhook: sync gagal', ['order_id' => $orderId]);
        } else {
            Log::info('Midtrans webhook: sync berhasil', [
                'order_id' => $orderId,
                'pembayaran_id' => $updated->id,
                'status' => $updated->status,
            ]);
        }

        return response()->json(['message' => 'ok']);
    }
}
