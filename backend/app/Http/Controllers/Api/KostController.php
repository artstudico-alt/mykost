<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kost;
use App\Models\KostDeleteRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class KostController extends Controller
{
    // GET /api/admin/moderasi-kost — KHUSUS ADMIN
    public function indexModerasi(Request $request)
    {
        // Optimasi: Tidak perlu hitung kamarsKosong di tabel moderasi admin agar cepat
        $query = Kost::with('user');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $kosts = $query->latest()->get();

        return response()->json([
            'message' => 'Daftar moderasi kost berhasil diambil',
            'total'   => $kosts->count(),
            'data'    => $kosts,
        ]);
    }

    // GET /api/kost — semua bisa lihat (guest = aktif, pemilik = mine, admin = all)
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $onlyMine = $request->boolean('mine');

            // Query dasar
            $query = Kost::query();

            if ($user) {
                // User terautentikasi
                if ($user->hasRole('pemilik_kost') && $onlyMine) {
                    // Pemilik lihat kost sendiri (semua status)
                    $query->where('user_id', $user->id);
                } elseif ($user->hasRole('super_admin')) {
                    // Admin bisa lihat semua jika tidak ada filter
                    if (!$onlyMine) {
                        $query->where('status', 'aktif');
                    }
                    // Kalau mine=1, admin juga bisa filter (opsional)
                } else {
                    // Role lain (karyawan, hr) - hanya lihat aktif
                    $query->where('status', 'aktif');
                }
            } else {
                // Guest - hanya lihat aktif
                $query->where('status', 'aktif');
            }

            // Get data
            $kosts = $query->latest()->get();

            return response()->json([
                'message' => 'Data kost berhasil diambil',
                'total' => $kosts->count(),
                'data' => $kosts
            ]);
        } catch (\Exception $e) {
            Log::error('Kost index error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    // POST /api/kost
    public function store(Request $request)
    {
        try {
            // Check if user has permission to create kost
            $user = $request->user();
            if (!$user || (!$user->hasRole('pemilik_kost') && !$user->hasRole('super_admin'))) {
                return response()->json([
                    'message' => 'Anda tidak memiliki izin untuk membuat kost. Hanya pemilik kost dan super admin yang bisa membuat kost.'
                ], 403);
            }

            // Check if user is verified (optional - uncomment if needed)
            /*
            if ($user->hasRole('pemilik_kost') && $user->status !== 'verified') {
                return response()->json([
                    'message' => 'Akun Anda belum terverifikasi. Silakan verifikasi akun terlebih dahulu.'
                ], 403);
            }
            */

            $validated = $request->validate([
                'nama_kost'      => 'required|string|max:255',
                'deskripsi'      => 'nullable|string',
                'tipe'           => 'required|in:putra,putri,campur',
                'alamat'         => 'required|string',
                'kelurahan'      => 'nullable|string',
                'kecamatan'      => 'nullable|string',
                'kota'           => 'required|string',
                'provinsi'       => 'required|string',
                'kode_pos'       => 'nullable|string|max:10',
                'latitude'       => 'required|numeric|between:-90,90',
                'longitude'      => 'required|numeric|between:-180,180',
                'fasilitas_umum' => 'nullable|array',
                'harga_min'      => 'required|numeric|min:0',
                'foto_utama'     => 'nullable|string',
                'foto_tambahan'  => 'nullable|array',
                'foto_tambahan.*'=> 'string',
                'jumlah_kamar'   => 'required|integer|min:1',
            ], [
                'nama_kost.required' => 'Nama kost wajib diisi',
                'tipe.required' => 'Tipe kost wajib dipilih',
                'alamat.required' => 'Alamat wajib diisi',
                'kota.required' => 'Kota wajib diisi',
                'provinsi.required' => 'Provinsi wajib diisi',
                'latitude.required' => 'Latitude wajib diisi (pilih di peta)',
                'longitude.required' => 'Longitude wajib diisi (pilih di peta)',
                'harga_min.required' => 'Harga sewa wajib diisi',
                'harga_min.min' => 'Harga sewa tidak boleh negatif',
                'jumlah_kamar.required' => 'Jumlah kamar wajib diisi',
                'jumlah_kamar.min' => 'Jumlah kamar minimal 1',
            ]);

            $validated['user_id'] = $request->user()->id;
            $validated['status']  = 'pending'; // default pending, perlu disetujui super_admin
            $validated['kamar_terisi'] = 0; // default 0 kamar terisi saat baru dibuat

            $kost = Kost::create($validated);

            // Create kamar records based on jumlah_kamar
            if ($request->has('kode_kamar_list') && is_array($request->kode_kamar_list)) {
                // Use provided kode kamar list
                foreach ($request->kode_kamar_list as $kode) {
                    if (!empty($kode)) {
                        $kost->kamars()->create([
                            'kode_kamar' => $kode,
                            'status' => 'tersedia',
                        ]);
                    }
                }
            } else {
                // Auto-generate kode kamar (K001, K002, etc.)
                for ($i = 1; $i <= $validated['jumlah_kamar']; $i++) {
                    $kost->kamars()->create([
                        'kode_kamar' => 'K' . str_pad($i, 3, '0', STR_PAD_LEFT),
                        'status' => 'tersedia',
                    ]);
                }
            }

            return response()->json([
                'message' => 'Data kost berhasil ditambahkan, menunggu persetujuan admin',
                'data'    => $kost,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Kost store error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal membuat kost: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    // GET /api/kost/{id}
    public function show($id)
    {
        $kost = Kost::with(['user', 'kamars'])->find($id);

        if (!$kost) {
            return response()->json(['message' => 'Kost tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail kost berhasil diambil',
            'data'    => $kost,
        ]);
    }

    // PUT /api/kost/{id}
    public function update(Request $request, $id)
    {
        $kost = Kost::find($id);

        if (!$kost) {
            return response()->json(['message' => 'Kost tidak ditemukan'], 404);
        }

        $user = $request->user();

        // Pemilik kost hanya bisa edit kost miliknya
        if ($user->hasRole('pemilik_kost') && $kost->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke kost ini'], 403);
        }

        $validated = $request->validate([
            'nama_kost'      => 'sometimes|string|max:255',
            'deskripsi'      => 'nullable|string',
            'tipe'           => 'sometimes|in:putra,putri,campur',
            'alamat'         => 'sometimes|string',
            'kelurahan'      => 'nullable|string',
            'kecamatan'      => 'nullable|string',
            'kota'           => 'sometimes|string',
            'provinsi'       => 'sometimes|string',
            'kode_pos'       => 'nullable|string|max:10',
            'latitude'       => 'sometimes|numeric|between:-90,90',
            'longitude'      => 'sometimes|numeric|between:-180,180',
            'fasilitas_umum' => 'nullable|array',
            'harga_min'      => 'sometimes|numeric|min:0',
            'foto_utama'     => 'nullable|string',
            'foto_tambahan'  => 'nullable|array',
            'foto_tambahan.*'=> 'string',
            'status'         => 'sometimes|in:aktif,nonaktif,pending',
        ]);

        // Pemilik kost tidak bisa ubah status sendiri
        if ($user->hasRole('pemilik_kost')) {
            unset($validated['status']);
        }

        $kost->update($validated);

        return response()->json([
            'message' => 'Data kost berhasil diperbarui',
            'data'    => $kost,
        ]);
    }

    // PATCH /api/kost/{id}/status — Super Admin: setujui/tolak kost
    public function updateStatus(Request $request, $id)
    {
        $kost = Kost::find($id);

        if (!$kost) {
            return response()->json(['message' => 'Kost tidak ditemukan'], 404);
        }

        $request->validate([
            'status' => 'required|in:aktif,nonaktif,pending',
        ]);

        $kost->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Status kost berhasil diperbarui',
            'data'    => $kost,
        ]);
    }

    // POST /api/kost/{id}/request-delete — Pemilik minta hapus (dengan alasan)
    public function requestDelete(Request $request, $id)
    {
        $kost = Kost::find($id);

        if (!$kost) {
            return response()->json(['message' => 'Kost tidak ditemukan'], 404);
        }

        $user = $request->user();

        // Cek akses
        if ($user->hasRole('pemilik_kost') && $kost->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke kost ini'], 403);
        }

        // Validasi alasan
        $validated = $request->validate([
            'reason' => 'required|string|min:10|max:500',
        ]);

        // Cek apakah sudah ada permintaan pending
        $existingRequest = KostDeleteRequest::where('kost_id', $id)
            ->where('status', 'pending')
            ->first();

        if ($existingRequest) {
            return response()->json([
                'message' => 'Anda sudah memiliki permintaan penghapusan yang menunggu persetujuan admin',
                'data' => $existingRequest,
            ], 422);
        }

        // Buat permintaan hapus
        $deleteRequest = KostDeleteRequest::create([
            'kost_id' => $id,
            'requested_by' => $user->id,
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Permintaan penghapusan kost telah dikirim ke admin untuk persetujuan',
            'data' => $deleteRequest,
        ], 201);
    }

    // GET /api/admin/kost-delete-requests — Admin lihat semua permintaan hapus
    public function indexDeleteRequests(Request $request)
    {
        $query = KostDeleteRequest::with(['kost', 'requester', 'approver']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->latest()->get();

        return response()->json([
            'message' => 'Data permintaan hapus kost berhasil diambil',
            'total' => $requests->count(),
            'data' => $requests,
        ]);
    }

    // PATCH /api/admin/kost-delete-requests/{id}/approve — Admin setujui hapus
    public function approveDelete(Request $request, $id)
    {
        $deleteRequest = KostDeleteRequest::with('kost')->find($id);

        if (!$deleteRequest) {
            return response()->json(['message' => 'Permintaan tidak ditemukan'], 404);
        }

        if ($deleteRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Permintaan sudah diproses sebelumnya',
                'status' => $deleteRequest->status,
            ], 422);
        }

        $admin = $request->user();

        // Update status permintaan
        $deleteRequest->update([
            'status' => 'approved',
            'approved_by' => $admin->id,
            'approved_at' => now(),
        ]);

        // Hapus kost
        $kostName = $deleteRequest->kost?->nama_kost ?? 'Kost';
        $deleteRequest->kost?->delete();

        return response()->json([
            'message' => "Kost '{$kostName}' berhasil dihapus setelah disetujui admin",
            'data' => $deleteRequest->fresh(),
        ]);
    }

    // PATCH /api/admin/kost-delete-requests/{id}/reject — Admin tolak hapus
    public function rejectDelete(Request $request, $id)
    {
        $deleteRequest = KostDeleteRequest::find($id);

        if (!$deleteRequest) {
            return response()->json(['message' => 'Permintaan tidak ditemukan'], 404);
        }

        if ($deleteRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Permintaan sudah diproses sebelumnya',
                'status' => $deleteRequest->status,
            ], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|min:10|max:500',
        ]);

        $admin = $request->user();

        $deleteRequest->update([
            'status' => 'rejected',
            'approved_by' => $admin->id,
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return response()->json([
            'message' => 'Permintaan penghapusan kost telah ditolak',
            'data' => $deleteRequest->fresh(),
        ]);
    }

    // DELETE /api/kost/{id} — Hanya super_admin bisa langsung hapus
    public function destroy(Request $request, $id)
    {
        $kost = Kost::find($id);

        if (!$kost) {
            return response()->json(['message' => 'Kost tidak ditemukan'], 404);
        }

        $user = $request->user();

        // Hanya super_admin yang bisa langsung hapus
        if (!$user->hasRole('super_admin')) {
            return response()->json([
                'message' => 'Pemilik kost harus mengajukan permintaan hapus dengan alasan. Gunakan endpoint POST /api/kost/{id}/request-delete',
            ], 403);
        }

        $kostName = $kost->nama_kost;
        $kost->delete();

        return response()->json([
            'message' => "Kost '{$kostName}' berhasil dihapus oleh admin",
        ]);
    }

    // GET /api/kost/{id}/kamars — cek status kamar
    public function getKamars($id)
    {
        $kost = Kost::with(['kamars'])->find($id);

        if (!$kost) {
            return response()->json(['message' => 'Kost tidak ditemukan'], 404);
        }

        // Get active bookings to see which rooms are actually occupied
        $occupiedRooms = \App\Models\Booking::where('kost_id', $id)
            ->whereIn('status', ['confirmed', 'aktif'])
            ->whereNotNull('nomor_kamar')
            ->pluck('nomor_kamar')
            ->toArray();

        $kamars = $kost->kamars->map(function ($kamar) use ($occupiedRooms) {
            $shouldBeTerisi = in_array($kamar->kode_kamar, $occupiedRooms);
            return [
                'id' => $kamar->id,
                'kode_kamar' => $kamar->kode_kamar,
                'status' => $kamar->status,
                'should_be' => $shouldBeTerisi ? 'terisi' : 'tersedia',
                'is_correct' => ($kamar->status === 'terisi') === $shouldBeTerisi,
            ];
        });

        return response()->json([
            'message' => 'Status kamar berhasil diambil',
            'kost_id' => $id,
            'total_kamars' => $kamars->count(),
            'tersedia' => $kamars->where('status', 'tersedia')->count(),
            'terisi' => $kamars->where('status', 'terisi')->count(),
            'occupied_by_bookings' => $occupiedRooms,
            'data' => $kamars,
        ]);
    }

    // POST /api/kost/{id}/fix-kamars — fix kamar status based on actual bookings
    public function fixKamars(Request $request, $id)
    {
        $user = $request->user();
        $kost = Kost::find($id);

        if (!$kost) {
            return response()->json(['message' => 'Kost tidak ditemukan'], 404);
        }

        // Only pemilik_kost or super_admin can fix
        if (!$user->hasRole('super_admin') && !($user->hasRole('pemilik_kost') && $kost->user_id === $user->id)) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        // Get active bookings
        $occupiedRooms = \App\Models\Booking::where('kost_id', $id)
            ->whereIn('status', ['confirmed', 'aktif'])
            ->whereNotNull('nomor_kamar')
            ->pluck('nomor_kamar')
            ->toArray();

        $fixed = 0;
        $kamars = $kost->kamars;

        foreach ($kamars as $kamar) {
            $shouldBeTerisi = in_array($kamar->kode_kamar, $occupiedRooms);
            $correctStatus = $shouldBeTerisi ? 'terisi' : 'tersedia';

            if ($kamar->status !== $correctStatus) {
                $kamar->update(['status' => $correctStatus]);
                $fixed++;
            }
        }

        // Update kost kamar_terisi count
        $kost->updateKamarTerisi();

        return response()->json([
            'message' => "Status kamar berhasil diperbaiki. {$fixed} kamar diupdate.",
            'fixed_count' => $fixed,
            'occupied_rooms' => $occupiedRooms,
            'kamar_terisi' => $kost->fresh()->kamar_terisi,
        ]);
    }
}
