<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kost;
use Illuminate\Http\Request;

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

    // GET /api/kost — semua role bisa lihat (Publik)
    public function index(Request $request)
    {
        // Gunakan auth('sanctum')->user() untuk deteksi user opsional secara aman
        $user = auth('sanctum')->user();
        if ($user) {
            $user->load('role');
        }


        $query = Kost::with('user')->withCount('kamarsKosong');

        // Katalog publik (beranda, tamu, karyawan, dll.): semua kost berstatus aktif.
        // Hanya "Kost Saya" milik pemilik yang memakai ?mine=1 — supaya beranda tidak kosong saat pemilik login.
        $onlyMine = $request->boolean('mine');
        if ($user && $user->hasRole('pemilik_kost') && $onlyMine) {
            $query->where('user_id', $user->id);
        } else {
            $query->where('status', 'aktif');
        }

        // Filter
        if ($request->filled('kota')) {
            $query->where('kota', 'like', '%' . $request->kota . '%');
        }
        if ($request->filled('tipe')) {
            $query->where('tipe', $request->tipe);
        }
        if ($request->filled('harga_max')) {
            $query->where('harga_min', '<=', $request->harga_max);
        }
        if ($request->filled('status') && $user && $user->hasRole('pemilik_kost') && $onlyMine) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nama_kost', 'like', '%' . $request->search . '%')
                  ->orWhere('alamat', 'like', '%' . $request->search . '%')
                  ->orWhere('kota', 'like', '%' . $request->search . '%');
            });
        }

        $kosts = $query->latest()->get();

        return response()->json([
            'message' => 'Data kost berhasil diambil',
            'total'   => $kosts->count(),
            'data'    => $kosts,
        ]);
    }

    // POST /api/kost
    public function store(Request $request)
    {
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
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['status']  = 'pending'; // default pending, perlu disetujui super_admin

        $kost = Kost::create($validated);

        return response()->json([
            'message' => 'Data kost berhasil ditambahkan, menunggu persetujuan admin',
            'data'    => $kost,
        ], 201);
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

    // DELETE /api/kost/{id}
    public function destroy(Request $request, $id)
    {
        $kost = Kost::find($id);

        if (!$kost) {
            return response()->json(['message' => 'Kost tidak ditemukan'], 404);
        }

        $user = $request->user();

        if ($user->hasRole('pemilik_kost') && $kost->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke kost ini'], 403);
        }

        $kost->delete();

        return response()->json(['message' => 'Kost berhasil dihapus']);
    }
}
