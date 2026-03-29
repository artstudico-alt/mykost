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

        if ($user->hasRole('karyawan')) {
            $query->whereHas('booking', fn ($q) => $q->where('user_id', $user->id));
        } elseif ($user->hasRole('pemilik_kost')) {
            $query->whereHas('booking.kost', fn ($q) => $q->where('user_id', $user->id));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $pembayarans = $query->latest()->get();

        return response()->json([
            'message' => 'Data pembayaran berhasil diambil',
            'total'   => $pembayarans->count(),
            'data'    => $pembayarans,
        ]);
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
                'message' => 'Tidak dapat mengambil status dari Midtrans (cek server key & order_id).',
            ], 502);
        }

        return response()->json([
            'message' => 'Status disinkronkan',
            'data'    => $updated->load(['booking.kost']),
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
            'status'     => 'required|in:berhasil,gagal,refund',
            'keterangan' => 'nullable|string',
        ]);

        if ($request->status === 'berhasil') {
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
     * POST /api/pembayaran/webhook — notifikasi Midtrans (verifikasi tanda tangan + sinkron status API).
     */
    public function webhook(Request $request)
    {
        $payload = $request->all();

        $orderId = $payload['order_id'] ?? null;
        if (! $orderId) {
            Log::warning('Midtrans webhook tanpa order_id');

            return response()->json(['message' => 'invalid payload'], 400);
        }

        $serverKey     = (string) config('midtrans.server_key');
        $statusCode    = (string) ($payload['status_code'] ?? '');
        $grossAmount   = (string) ($payload['gross_amount'] ?? '');
        $signatureKey  = (string) ($payload['signature_key'] ?? '');

        $expectedSig = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
        if ($signatureKey === '' || ! hash_equals($expectedSig, $signatureKey)) {
            Log::warning('Midtrans webhook signature tidak cocok', ['order_id' => $orderId]);

            return response()->json(['message' => 'invalid signature'], 403);
        }

        $updated = MidtransPaymentService::syncOrderStatus($orderId);

        if (! $updated) {
            Log::error('Midtrans webhook: sync gagal', ['order_id' => $orderId]);
        }

        return response()->json(['message' => 'ok']);
    }
}
