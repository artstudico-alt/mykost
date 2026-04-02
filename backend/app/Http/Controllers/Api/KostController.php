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
            if ($user) {
                $user->load('role');
            }

            // CRITICAL DEBUG: Log all authentication and parameter details
            \Log::critical('KOST INDEX - DETAILED DEBUG', [
                'authenticated_user_id' => $user?->id,
                'authenticated_user_name' => $user?->name,
                'authenticated_user_email' => $user?->email,
                'authenticated_user_role' => $user?->role?->name,
                'mine_parameter_raw' => $request->input('mine'),
                'mine_parameter_boolean' => $request->boolean('mine'),
                'all_request_params' => $request->all(),
                'request_headers' => $request->headers->all(),
                'request_url' => $request->fullUrl(),
                'request_method' => $request->method()
            ]);

            $query = Kost::with('user');

            // Katalog publik (beranda, tamu, karyawan, dll.): semua kost berstatus aktif.
            // Hanya "Kost Saya" milik pemilik yang memakai ?mine=1 — supaya beranda tidak kosong saat pemilik login.
            $onlyMine = $request->boolean('mine');

            \Log::critical('KOST INDEX - FILTERING LOGIC', [
                'onlyMine_value' => $onlyMine,
                'user_exists' => !is_null($user),
                'user_role' => $user?->role?->name,
                'is_pemilik_kost' => $user?->hasRole('pemilik_kost'),
                'condition_1' => $user && $user->hasRole('pemilik_kost') && $onlyMine,
                'condition_2' => $user && $user->hasRole('pemilik_kost') && !$onlyMine,
                'condition_3' => !($user && $user->hasRole('pemilik_kost') && $onlyMine) && !($user && $user->hasRole('pemilik_kost') && !$onlyMine)
            ]);

            if ($user && $user->hasRole('pemilik_kost') && $onlyMine) {
                // Pemilik kost hanya lihat kost miliknya sendiri
                // CRITICAL: Double-ensure the filter is applied correctly
                $query->where('user_id', $user->id);

                // Additional safety: Remove any status filter that might override user filter
                // This ensures ONLY user_id filter matters for "mine=1"
                \Log::critical('KOST INDEX - APPLYING STRICT USER FILTER', [
                    'filtering_for_user_id' => $user->id,
                    'filtering_for_user_name' => $user->name,
                    'sql_query_before' => $query->toSql(),
                    'bindings_before' => $query->getBindings(),
                    'user_verification' => [
                        'authenticated_id' => $user->id,
                        'authenticated_name' => $user->name,
                        'authenticated_email' => $user->email
                    ]
                ]);

                // EXTRA SAFETY: Apply the filter again to be absolutely sure
                $query->where('user_id', $user->id);

            } elseif ($user && $user->hasRole('pemilik_kost') && !$onlyMine) {
                // Jika pemilik kost tapi tidak pakai ?mine=1, tetap tampilkan kost aktif (untuk katalog umum)
                $query->where('status', 'aktif');
                \Log::critical('KOST INDEX - SHOWING ACTIVE KOST FOR OWNER', [
                    'user_id' => $user->id,
                    'user_name' => $user->name
                ]);
            } else {
                // Public atau role lain: hanya kost aktif
                $query->where('status', 'aktif');
                \Log::critical('KOST INDEX - SHOWING ACTIVE KOST FOR PUBLIC', [
                    'user_id' => $user?->id,
                    'user_role' => $user?->role?->name
                ]);
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

            \Log::critical('KOST INDEX - QUERY RESULTS', [
                'total_kosts_found' => $kosts->count(),
                'final_sql_query' => $query->toSql(),
                'final_bindings' => $query->getBindings(),
                'kosts_with_owners' => $kosts->map(function($kost) {
                    return [
                        'kost_id' => $kost->id,
                        'kost_name' => $kost->nama_kost,
                        'owner_id' => $kost->user_id,
                        'owner_name' => $kost->user?->name,
                        'owner_email' => $kost->user?->email
                    ];
                })->toArray()
            ]);

            // Special fix: If kost owner with mine=1 gets no results, check if they actually have kosts
            if ($user && $user->hasRole('pemilik_kost') && $onlyMine && $kosts->count() === 0) {
                \Log::warning('Pemilik kost with mine=1 got no results, checking direct query', [
                    'user_id' => $user->id
                ]);

                // Direct query to check if user has any kosts
                $directKosts = Kost::where('user_id', $user->id)->get();
                \Log::info('Direct query result', [
                    'direct_count' => $directKosts->count(),
                    'direct_data' => $directKosts->toArray()
                ]);

                if ($directKosts->count() > 0) {
                    // There was an issue with the query, use direct results
                    $kosts = $directKosts;
                    \Log::info('Using direct query results as fallback');
                }
            }

            return response()->json([
                'message' => 'Data kost berhasil diambil',
                'total'   => $kosts->count(),
                'data'    => $kosts,
                'debug_info' => [
                    'user_id' => $user?->id,
                    'user_name' => $user?->name,
                    'user_role' => $user?->role?->name,
                    'mine_parameter' => $onlyMine,
                    'query_filter_applied' => $user && $user->hasRole('pemilik_kost') && $onlyMine,
                    'final_sql' => $query->toSql(),
                    'final_bindings' => $query->getBindings()
                ]
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
            ]);

            $validated['user_id'] = $request->user()->id;
            $validated['status']  = 'pending'; // default pending, perlu disetujui super_admin

            $kost = Kost::create($validated);

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
