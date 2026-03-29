<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Karyawan;
use Illuminate\Http\Request;

class KaryawanController extends Controller
{
    // GET /api/karyawan
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Karyawan::with(['user', 'hunianAktif.kost']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('divisi')) {
            $query->where('divisi', $request->divisi);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nama', 'like', '%' . $request->search . '%')
                  ->orWhere('nik', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $karyawan = $query->latest()->get();

        return response()->json([
            'message' => 'Data karyawan berhasil diambil',
            'total'   => $karyawan->count(),
            'data'    => $karyawan,
        ]);
    }

    // POST /api/karyawan
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'           => 'nullable|exists:users,id',
            'nik'               => 'required|string|max:50|unique:karyawan,nik',
            'nama'              => 'required|string|max:255',
            'email'             => 'nullable|email|max:255',
            'no_hp'             => 'nullable|string|max:20',
            'jabatan'           => 'nullable|string|max:100',
            'divisi'            => 'nullable|string|max:100',
            'tanggal_bergabung' => 'nullable|date',
            'status'            => 'sometimes|in:aktif,nonaktif',
        ]);

        $karyawan = Karyawan::create($validated);

        return response()->json([
            'message' => 'Data karyawan berhasil ditambahkan',
            'data'    => $karyawan->load(['user']),
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

    // PUT /api/karyawan/{id}
    public function update(Request $request, $id)
    {
        $karyawan = Karyawan::find($id);

        if (!$karyawan) {
            return response()->json(['message' => 'Data karyawan tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'user_id'           => 'nullable|exists:users,id',
            'nik'               => 'sometimes|string|max:50|unique:karyawan,nik,' . $id,
            'nama'              => 'sometimes|string|max:255',
            'email'             => 'nullable|email|max:255',
            'no_hp'             => 'nullable|string|max:20',
            'jabatan'           => 'nullable|string|max:100',
            'divisi'            => 'nullable|string|max:100',
            'tanggal_bergabung' => 'nullable|date',
            'status'            => 'sometimes|in:aktif,nonaktif',
        ]);

        $karyawan->update($validated);

        return response()->json([
            'message' => 'Data karyawan berhasil diperbarui',
            'data'    => $karyawan->load(['user']),
        ]);
    }

    // DELETE /api/karyawan/{id}
    public function destroy($id)
    {
        $karyawan = Karyawan::find($id);

        if (!$karyawan) {
            return response()->json(['message' => 'Data karyawan tidak ditemukan'], 404);
        }

        $karyawan->delete();

        return response()->json(['message' => 'Data karyawan berhasil dihapus']);
    }
}
