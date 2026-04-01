<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Karyawan;
use App\Models\Kost;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class KaryawanController extends Controller
{
    // GET /api/karyawan - Get all users with karyawan or pemilik_kost role
    public function index(Request $request)
    {
        // Get users with karyawan or pemilik_kost roles
        $karyawanRole = Role::where('name', 'karyawan')->first();
        $pemilikRole = Role::where('name', 'pemilik_kost')->first();

        $roleIds = [];
        if ($karyawanRole) $roleIds[] = $karyawanRole->id;
        if ($pemilikRole) $roleIds[] = $pemilikRole->id;

        $query = User::with(['karyawan.hunianAktif.kost'])
            ->whereIn('role_id', $roleIds);

        if ($request->filled('status')) {
            $query->whereHas('karyawan', function($q) use ($request) {
                $q->where('status', $request->status);
            });
        }
        if ($request->filled('divisi')) {
            $query->whereHas('karyawan', function($q) use ($request) {
                $q->where('divisi', $request->divisi);
            });
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $users = $query->latest()->get();

        // Transform to include karyawan data
        $transformed = $users->map(function($user) {
            $roleName = $user->role?->name ?? 'karyawan';
            return [
                'id' => $user->karyawan?->id ?? $user->id,
                'user_id' => $user->id,
                'nama' => $user->name,
                'email' => $user->email,
                'nik' => $user->karyawan?->nik,
                'no_hp' => $user->karyawan?->no_hp,
                'jabatan' => $user->karyawan?->jabatan,
                'divisi' => $user->karyawan?->divisi,
                'status' => $user->karyawan?->status ?? 'aktif',
                'role' => ['name' => $roleName],
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'role' => ['name' => $roleName],
                ],
                'hunian_aktif' => $user->karyawan?->hunianAktif,
                'created_at' => $user->created_at,
            ];
        });

        return response()->json([
            'message' => 'Data berhasil diambil',
            'total'   => $users->count(),
            'data'    => $transformed,
        ]);
    }

    // POST /api/karyawan (HR only) - Create Karyawan or Pemilik Kost account
    public function store(Request $request)
    {
        $accountType = $request->input('account_type');

        // Different validation rules based on account type
        if ($accountType === 'pemilik_kost') {
            $validated = $request->validate([
                'account_type'      => 'required|in:karyawan,pemilik_kost',
                'nama_pemilik'     => 'required|string|max:255',
                'nama_kost'        => 'required|string|max:255',
                'email'            => 'required|email|max:255|unique:users,email',
                'nomor_telepon'    => 'required|string|max:20',
                'password'         => 'required|string|min:8',
            ]);
            // Force email to lowercase
            $validated['email'] = strtolower($validated['email']);
        } else {
            // Karyawan validation rules
            $validated = $request->validate([
                'account_type'      => 'required|in:karyawan,pemilik_kost',
                'nik'               => 'required|string|max:50|unique:karyawan,nik',
                'nama'              => 'required|string|max:255',
                'email'             => 'required|email|max:255|unique:users,email',
                'no_hp'             => 'nullable|string|max:20',
                'jabatan'           => 'nullable|string|max:100',
                'divisi'            => 'nullable|string|max:100',
                'tanggal_bergabung' => 'nullable|date',
                'status'            => 'sometimes|in:aktif,nonaktif',
                'password'          => 'required|string|min:8',
            ]);
            // Force email to lowercase
            $validated['email'] = strtolower($validated['email']);
        }

        // Get role based on account type
        $roleName = $validated['account_type'] === 'pemilik_kost' ? 'pemilik_kost' : 'karyawan';
        $role = Role::where('name', $roleName)->first();

        if (!$role) {
            return response()->json([
                'message' => 'Role ' . $roleName . ' tidak ditemukan di sistem',
            ], 400);
        }

        // Create user in users table
        $userData = [
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $role->id,
            'email_verified_at' => now(), // Auto verify since HR creates the account
        ];

        // Set name based on account type
        if ($accountType === 'pemilik_kost') {
            $userData['name'] = $validated['nama_pemilik'];
            $userData['phone'] = $validated['nomor_telepon'];
        } else {
            $userData['name'] = $validated['nama'];
        }

        $user = User::create($userData);

        // Create karyawan record for additional data (only for karyawan account type)
        if ($validated['account_type'] === 'karyawan') {
            Karyawan::create([
                'user_id' => $user->id,
                'nik' => $validated['nik'],
                'nama' => $validated['nama'],
                'email' => $validated['email'],
                'no_hp' => $validated['no_hp'] ?? null,
                'jabatan' => $validated['jabatan'] ?? null,
                'divisi' => $validated['divisi'] ?? null,
                'tanggal_bergabung' => $validated['tanggal_bergabung'] ?? null,
                'status' => $validated['status'] ?? 'aktif',
            ]);
        }
        // Note: For pemilik_kost, no kost entry is created automatically.
        // The nama_kost field is just for identity and will be used when they register their actual kost later.

        $typeLabel = $validated['account_type'] === 'pemilik_kost' ? 'Pemilik Kost' : 'Karyawan';

        return response()->json([
            'message' => 'Akun ' . $typeLabel . ' berhasil dibuat oleh HR',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $roleName,
                'type' => $validated['account_type'],
                'nama_kost' => $accountType === 'pemilik_kost' ? $validated['nama_kost'] : null,
            ],
        ], 201);
    }

    // GET /api/karyawan/{id}
    public function show(Request $request, $id)
    {
        $karyawan = Karyawan::with(['user', 'hunians.kost'])->find($id);

        if (!$karyawan) {
            return response()->json(['message' => 'Data karyawan tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail karyawan berhasil diambil',
            'data'    => $karyawan,
        ]);
    }

    // PUT /api/karyawan/{id} (HR only)
    public function update(Request $request, $id)
    {
        $karyawan = Karyawan::find($id);

        if (!$karyawan) {
            return response()->json(['message' => 'Data karyawan tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'kantor_id'         => 'nullable|integer',
            'nik'               => 'sometimes|string|max:50|unique:karyawan,nik,' . $id,
            'nama'              => 'sometimes|string|max:255',
            'email'             => 'sometimes|email|max:255|unique:karyawan,email,' . $id,
            'no_hp'             => 'nullable|string|max:20',
            'jabatan'           => 'nullable|string|max:100',
            'divisi'            => 'nullable|string|max:100',
            'tanggal_bergabung' => 'nullable|date',
            'status'            => 'sometimes|in:aktif,nonaktif',
            'password'          => 'nullable|string|min:8',
        ]);

        $karyawan->update($validated);

        return response()->json([
            'message' => 'Data karyawan berhasil diperbarui',
            'data'    => $karyawan,
        ]);
    }

    // DELETE /api/karyawan/{id}
    public function destroy($id)
    {
        // First try to find a Karyawan record
        $karyawan = Karyawan::find($id);

        if ($karyawan) {
            // Delete the associated user first (to avoid foreign key constraints)
            $userId = $karyawan->user_id;
            $karyawan->delete();
            // Also delete the user record
            User::where('id', $userId)->delete();
            return response()->json(['message' => 'Data karyawan berhasil dihapus']);
        }

        // If no karyawan found, try to find a User with this ID (for pemilik_kost)
        $user = User::find($id);

        if ($user) {
            // Check if user has kost records and delete them first
            Kost::where('user_id', $user->id)->delete();
            // Delete the user
            $user->delete();
            return response()->json(['message' => 'Data pengguna berhasil dihapus']);
        }

        return response()->json(['message' => 'Data tidak ditemukan'], 404);
    }
}
