<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

    // POST /api/pembayaran — karyawan submit pembayaran
    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id'       => 'required|exists:bookings,id',
            'jumlah'           => 'required|numeric|min:0',
            'metode'           => 'required|in:transfer,cash,virtual_account,qris',
            'bukti_pembayaran' => 'nullable|string',
            'keterangan'       => 'nullable|string',
        ]);

        $user    = $request->user();
        $booking = Booking::find($validated['booking_id']);

        if (!$booking) {
            return response()->json(['message' => 'Booking tidak ditemukan'], 404);
        }

        // Pastikan pembayaran untuk booking milik user sendiri
        if ($booking->user_id !== $user->id && !$user->hasAnyRole(['super_admin'])) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if (!in_array($booking->status, ['confirmed', 'aktif'])) {
            return response()->json([
                'message' => 'Booking harus berstatus confirmed atau aktif untuk melakukan pembayaran',
            ], 422);
        }

        $pembayaran = Pembayaran::create([
            'booking_id'       => $booking->id,
            'jumlah'           => $validated['jumlah'],
            'metode'           => $validated['metode'],
            'nomor_referensi'  => 'PAY-' . strtoupper(Str::random(10)),
            'bukti_pembayaran' => $validated['bukti_pembayaran'] ?? null,
            'status'           => 'pending',
            'keterangan'       => $validated['keterangan'] ?? null,
        ]);

        return response()->json([
            'message' => 'Pembayaran berhasil disubmit, menunggu verifikasi',
            'data'    => $pembayaran->load('booking'),
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
}
