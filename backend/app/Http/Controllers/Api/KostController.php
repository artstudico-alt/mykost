<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kost;
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

    // GET /api/kost — semua role bisa lihat (Publik)
    public function index(Request $request)
    {
        try {
            // Get user from request if authenticated
            $user = $request->user();

            // Simple query without relationship eager loading first
            $query = Kost::query();

            // Katalog publik: semua kost berstatus aktif
            $onlyMine = $request->boolean('mine');

            if ($user && $user->hasRole('pemilik_kost') && $onlyMine) {
                // Pemilik kost hanya lihat kost miliknya sendiri
                $query->where('user_id', $user->id);
            } else {
                // Public atau role lain: hanya kost aktif
                $query->where('status', 'aktif');
            }

            // Additional filters
            if ($request->filled('kota')) {
                $query->where('kota', 'like', '%' . $request->kota . '%');
            }
            if ($request->filled('tipe')) {
                $query->where('tipe', $request->tipe);
            }
            if ($request->filled('harga_max')) {
                $query->where('harga_min', '<=', $request->harga_max);
            }
            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('nama_kost', 'like', '%' . $request->search . '%')
                      ->orWhere('alamat', 'like', '%' . $request->search . '%')
                      ->orWhere('kota', 'like', '%' . $request->search . '%');
                });
            }

            $kosts = $query->latest()->get();

            // Load user relationship manually after query
            $kosts->load('user');

            return response()->json([
                'message' => 'Data kost berhasil diambil',
                'total'   => $kosts->count(),
                'data'    => $kosts,
            ]);
        } catch (\Exception $e) {
            \Log::error('Kost index error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
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
        $kost = Kost::with(['user'])->find($id);

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
