<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Hunian;
use App\Models\Karyawan;
use App\Models\Kost;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    // GET /api/booking
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Booking::with(['user', 'kost', 'pembayarans']);

        if ($user->hasRole('karyawan')) {
            $query->where('user_id', $user->id);
        } elseif ($user->hasRole('pemilik_kost')) {
            $query->whereHas('kost', fn($q) => $q->where('user_id', $user->id));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $bookings = $query->latest()->get();

        return response()->json([
            'message' => 'Data booking berhasil diambil',
            'total'   => $bookings->count(),
            'data'    => $bookings,
        ]);
    }

    // POST /api/booking — sewa per kost (bukan per kamar)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kost_id'       => 'required|exists:kosts,id',
            'tanggal_mulai' => 'required|date|after_or_equal:today',
            'durasi_bulan'  => 'required|integer|min:1|max:24',
            'catatan'       => 'nullable|string',
        ]);

        $kost = Kost::find($validated['kost_id']);

        if ($kost->status !== 'aktif') {
            return response()->json([
                'message' => 'Kost tidak aktif, tidak bisa melakukan booking',
            ], 422);
        }

        // Hapus atau anggap kadaluarsa booking 'pending' yang sudah lebih dari 60 menit
        // agar tidak mengunci kost selamanya jika orang tidak jadi bayar.
        $expiredThreshold = now()->subMinutes(60);

        $conflict = Booking::where('kost_id', $kost->id)
            ->where(function ($q) use ($expiredThreshold, $request) {
                $q->where('status', 'aktif')
                  ->orWhere('status', 'confirmed')
                  ->orWhere(function ($sq) use ($expiredThreshold, $request) {
                      $sq->where('status', 'pending')
                         ->where('created_at', '>=', $expiredThreshold)
                         ->where('user_id', '!=', $request->user()->id);
                  });
            })
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Kost ini sedang dalam proses sewa oleh orang lain atau sudah aktif. Coba kost lain atau hubungi pemilik.',
            ], 422);
        }

        // Jika user yang sama sudah punya booking pending yang belum expired, kembalikan itu saja (re-use)
        $existingPending = Booking::where('kost_id', $kost->id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->where('created_at', '>=', $expiredThreshold)
            ->first();

        if ($existingPending) {
            return response()->json([
                'message' => 'Melanjutkan pesanan Anda yang sudah ada.',
                'data'    => $existingPending->load(['kost', 'user']),
            ], 200);
        }

        $tanggalMulai   = Carbon::parse($validated['tanggal_mulai']);
        $tanggalSelesai = $tanggalMulai->copy()->addMonths($validated['durasi_bulan']);
        $totalHarga     = $kost->harga_min * $validated['durasi_bulan'];

        $booking = Booking::create([
            'user_id'         => $request->user()->id,
            'kost_id'         => $kost->id,
            'tanggal_mulai'   => $tanggalMulai,
            'durasi_bulan'    => $validated['durasi_bulan'],
            'tanggal_selesai' => $tanggalSelesai,
            'total_harga'     => $totalHarga,
            'status'          => 'pending',
            'catatan'         => $validated['catatan'] ?? null,
        ]);

        return response()->json([
            'message' => 'Booking berhasil dibuat, menunggu konfirmasi pemilik kost',
            'data'    => $booking->load(['kost', 'user']),
        ], 201);
    }

    // GET /api/booking/{id}
    public function show(Request $request, $id)
    {
        $booking = Booking::with(['user', 'kost', 'pembayarans', 'hunian'])->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Booking tidak ditemukan'], 404);
        }

        $user = $request->user();

        $isOwner       = $booking->user_id === $user->id;
        $isPemilikKost = $user->hasRole('pemilik_kost') && $booking->kost->user_id === $user->id;
        $isAdmin       = $user->hasAnyRole(['super_admin', 'hr']);

        if (!$isOwner && !$isPemilikKost && !$isAdmin) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        return response()->json([
            'message' => 'Detail booking berhasil diambil',
            'data'    => $booking,
        ]);
    }

    // PATCH /api/booking/{id}/confirm — pemilik kost konfirmasi booking
    public function confirm(Request $request, $id)
    {
        $booking = Booking::with(['kost'])->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Booking tidak ditemukan'], 404);
        }

        $user = $request->user();

        if ($user->hasRole('pemilik_kost') && $booking->kost->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if ($booking->status !== 'pending') {
            return response()->json([
                'message' => 'Hanya booking berstatus pending yang bisa dikonfirmasi',
            ], 422);
        }

        $booking->update(['status' => 'confirmed']);

        return response()->json([
            'message' => 'Booking berhasil dikonfirmasi',
            'data'    => $booking,
        ]);
    }

    // PATCH /api/booking/{id}/cancel — karyawan atau pemilik kost batalkan booking
    public function cancel(Request $request, $id)
    {
        $booking = Booking::with(['kost'])->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Booking tidak ditemukan'], 404);
        }

        $user          = $request->user();
        $isOwner       = $booking->user_id === $user->id;
        $isPemilikKost = $user->hasRole('pemilik_kost') && $booking->kost->user_id === $user->id;

        if (!$isOwner && !$isPemilikKost && !$user->hasRole('super_admin')) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if (in_array($booking->status, ['selesai', 'dibatalkan'])) {
            return response()->json([
                'message' => 'Booking ini tidak bisa dibatalkan (status: ' . $booking->status . ')',
            ], 422);
        }

        $booking->update(['status' => 'dibatalkan']);

        return response()->json([
            'message' => 'Booking berhasil dibatalkan',
            'data'    => $booking,
        ]);
    }

    // PATCH /api/booking/{id}/aktif — aktifkan booking setelah pembayaran berhasil + buat data hunian
    public function aktivasi(Request $request, $id)
    {
        $booking = Booking::with(['kost'])->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Booking tidak ditemukan'], 404);
        }

        if ($booking->status !== 'confirmed') {
            return response()->json([
                'message' => 'Booking harus berstatus confirmed sebelum diaktifkan',
            ], 422);
        }

        $booking->update(['status' => 'aktif']);

        $karyawan = Karyawan::where('user_id', $booking->user_id)->first();

        if ($karyawan) {
            Hunian::where('karyawan_id', $karyawan->id)
                ->where('status', 'aktif')
                ->update(['status' => 'selesai', 'tanggal_keluar' => now()]);

            Hunian::create([
                'karyawan_id'    => $karyawan->id,
                'kost_id'        => $booking->kost_id,
                'booking_id'     => $booking->id,
                'tanggal_masuk'  => $booking->tanggal_mulai,
                'tanggal_keluar' => $booking->tanggal_selesai,
                'status'         => 'aktif',
                'is_verified'    => false,
            ]);
        }

        return response()->json([
            'message' => 'Booking diaktifkan. Data hunian karyawan berhasil dibuat.',
            'data'    => $booking->load('hunian'),
        ]);
    }
}
