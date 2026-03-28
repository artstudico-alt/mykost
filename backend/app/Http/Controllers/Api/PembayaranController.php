<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Midtrans\Config;
use Midtrans\Snap;
use App\Models\Karyawan;
use App\Models\Hunian;

class PembayaranController extends Controller
{
    // GET /api/pembayaran
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Pembayaran::with(['booking.user', 'booking.kost', 'booking.kamar']);

        if ($user->hasRole('karyawan')) {
            $query->whereHas('booking', fn($q) => $q->where('user_id', $user->id));
        } elseif ($user->hasRole('pemilik_kost')) {
            $query->whereHas('booking.kost', fn($q) => $q->where('user_id', $user->id));
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

    // POST /api/pembayaran — karyawan submit pembayaran & dapat snap token
    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id'       => 'required|exists:bookings,id',
            'jumlah'           => 'required|numeric|min:0',
            'keterangan'       => 'nullable|string',
        ]);

        $user    = $request->user();
        $booking = Booking::with('kost')->find($validated['booking_id']);

        if (!$booking) {
            return response()->json(['message' => 'Booking tidak ditemukan'], 404);
        }

        // Pastikan pembayaran untuk booking milik user sendiri
        if ($booking->user_id !== $user->id && !$user->hasAnyRole(['super_admin'])) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if (!in_array($booking->status, ['pending', 'confirmed', 'aktif'])) {
            return response()->json([
                'message' => 'Booking status: ' . $booking->status . ' tidak bisa diproses pembayarannya',
            ], 422);
        }

        $nomor_referensi = 'PAY-' . strtoupper(Str::random(10));

        // Midtrans IDR harus bilangan bulat
        $grossAmount = (int) max(1, round((float) $validated['jumlah']));

        // Konfigurasi Midtrans
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = (bool) config('midtrans.is_production');
        Config::$isSanitized = (bool) config('midtrans.is_sanitized');
        Config::$is3ds = (bool) config('midtrans.is_3ds');

        $params = array(
            'transaction_details' => array(
                'order_id' => $nomor_referensi,
                'gross_amount' => $grossAmount,
            ),
            'customer_details' => array(
                'first_name' => substr((string) $user->name, 0, 50),
                'email' => $user->email,
                'phone' => $user->phone ?? '08123456789',
            ),
            'item_details' => array(
                [
                    'id' => (string) $booking->kamar_id,
                    'price' => $grossAmount,
                    'quantity' => 1,
                    'name' => 'Sewa Kost: ' . $booking->kost->nama_kost,
                ]
            )
        );

        try {
            $snapToken = Snap::getSnapToken($params);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal generate Snap Token Midtrans: ' . $e->getMessage()
            ], 500);
        }

        $pembayaran = Pembayaran::create([
            'booking_id'       => $booking->id,
            'jumlah'           => $grossAmount,
            'metode'           => 'midtrans', // default untuk sementara
            'nomor_referensi'  => $nomor_referensi,
            'snap_token'       => $snapToken,
            'status'           => 'pending',
            'keterangan'       => $validated['keterangan'] ?? null,
        ]);

        return response()->json([
            'message'    => 'Pembayaran berhasil diinisiasi, silakan proses',
            'snap_token' => $snapToken,
            'data'       => $pembayaran->load('booking'),
        ], 201);
    }

    // GET /api/pembayaran/{id}
    public function show(Request $request, $id)
    {
        $pembayaran = Pembayaran::with(['booking.user', 'booking.kost', 'booking.kamar'])->find($id);

        if (!$pembayaran) {
            return response()->json(['message' => 'Data pembayaran tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail pembayaran berhasil diambil',
            'data'    => $pembayaran,
        ]);
    }

    // PATCH /api/pembayaran/{id}/verify — pemilik kost atau super_admin verifikasi pembayaran
    public function verify(Request $request, $id)
    {
        $pembayaran = Pembayaran::with(['booking.kamar', 'booking.kost'])->find($id);

        if (!$pembayaran) {
            return response()->json(['message' => 'Data pembayaran tidak ditemukan'], 404);
        }

        $request->validate([
            'status'     => 'required|in:berhasil,gagal,refund',
            'keterangan' => 'nullable|string',
        ]);

        $pembayaran->update([
            'status'       => $request->status,
            'tanggal_bayar' => $request->status === 'berhasil' ? Carbon::now() : null,
            'keterangan'   => $request->keterangan ?? $pembayaran->keterangan,
        ]);

        // Jika berhasil, otomatis aktifkan booking
        if ($request->status === 'berhasil' && $pembayaran->booking->status === 'confirmed') {
            $booking = $pembayaran->booking;
            $booking->update(['status' => 'aktif']);
            $booking->kamar->update(['status' => 'terisi']);
        }

        return response()->json([
            'message' => 'Status pembayaran berhasil diperbarui',
            'data'    => $pembayaran->load('booking'),
        ]);
    }

    // POST /api/pembayaran/webhook — Webhook Midtrans
    public function webhook(Request $request)
    {
        $serverKey = config('midtrans.server_key');
        $hashed = hash("sha512", $request->order_id . $request->status_code . $request->gross_amount . $serverKey);
        
        if ($hashed == $request->signature_key) {
            if ($request->transaction_status == 'capture' || $request->transaction_status == 'settlement') {
                $pembayaran = Pembayaran::with('booking.kamar')->where('nomor_referensi', $request->order_id)->first();
                
                if ($pembayaran && $pembayaran->status != 'berhasil') {
                    $pembayaran->update([
                        'status' => 'berhasil',
                        'tanggal_bayar' => Carbon::now(),
                        'metode' => $request->payment_type, // Misal: bank_transfer, qris, dll
                    ]);

                    $booking = $pembayaran->booking;
                    if ($booking && in_array($booking->status, ['pending', 'confirmed'])) {
                        $booking->update(['status' => 'aktif']);
                        if ($booking->kamar) {
                            $booking->kamar->update(['status' => 'terisi']);
                        }

                        // Buat data hunian otomatis
                        $karyawan = Karyawan::where('user_id', $booking->user_id)->first();
                        if ($karyawan) {
                            // Nonaktifkan hunian lama
                            Hunian::where('karyawan_id', $karyawan->id)
                                ->where('status', 'aktif')
                                ->update(['status' => 'selesai', 'tanggal_keluar' => now()]);

                            Hunian::create([
                                'karyawan_id'    => $karyawan->id,
                                'kost_id'        => $booking->kost_id,
                                'kamar_id'       => $booking->kamar_id,
                                'booking_id'     => $booking->id,
                                'tanggal_masuk'  => $booking->tanggal_mulai,
                                'tanggal_keluar' => $booking->tanggal_selesai,
                                'status'         => 'aktif',
                                'is_verified'    => false,
                            ]);
                        }
                    }
                }
            } elseif (in_array($request->transaction_status, ['cancel', 'deny', 'expire'])) {
                $pembayaran = Pembayaran::where('nomor_referensi', $request->order_id)->first();
                if ($pembayaran) {
                    $pembayaran->update(['status' => 'gagal']);
                }
            }
        }
        
        return response()->json(['message' => 'Webhook received']);
    }
}
