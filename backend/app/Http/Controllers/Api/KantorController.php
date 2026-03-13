<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kantor;
use Illuminate\Http\Request;

class KantorController extends Controller
{
    // GET /api/kantor — Super Admin: semua, HR: kantor sendiri
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->hasRole('super_admin')) {
            $kantor = Kantor::with('user')->latest()->get();
        } else {
            // HR: hanya kantor yang dia kelola
            $kantor = Kantor::where('user_id', $user->id)->latest()->get();
        }

        return response()->json([
            'message' => 'Data kantor berhasil diambil',
            'data'    => $kantor,
        ]);
    }

    // POST /api/kantor — Super Admin only
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'      => 'nullable|exists:users,id',
            'nama_kantor'  => 'required|string|max:255',
            'kode_kantor'  => 'nullable|string|max:50|unique:kantor,kode_kantor',
            'alamat'       => 'required|string',
            'kelurahan'    => 'nullable|string',
            'kecamatan'    => 'nullable|string',
            'kota'         => 'required|string',
            'provinsi'     => 'required|string',
            'kode_pos'     => 'nullable|string|max:10',
            'latitude'     => 'required|numeric|between:-90,90',
            'longitude'    => 'required|numeric|between:-180,180',
            'telepon'      => 'nullable|string|max:20',
            'email'        => 'nullable|email',
        ]);

        $kantor = Kantor::create($validated);

        return response()->json([
            'message' => 'Kantor berhasil ditambahkan',
            'data'    => $kantor,
        ], 201);
    }

    // GET /api/kantor/{id}
    public function show($id)
    {
        $kantor = Kantor::with(['user', 'karyawan'])->find($id);

        if (!$kantor) {
            return response()->json(['message' => 'Kantor tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail kantor berhasil diambil',
            'data'    => $kantor,
        ]);
    }

    // PUT /api/kantor/{id}
    public function update(Request $request, $id)
    {
        $kantor = Kantor::find($id);

        if (!$kantor) {
            return response()->json(['message' => 'Kantor tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'user_id'      => 'nullable|exists:users,id',
            'nama_kantor'  => 'sometimes|string|max:255',
            'kode_kantor'  => 'nullable|string|max:50|unique:kantor,kode_kantor,' . $id,
            'alamat'       => 'sometimes|string',
            'kelurahan'    => 'nullable|string',
            'kecamatan'    => 'nullable|string',
            'kota'         => 'sometimes|string',
            'provinsi'     => 'sometimes|string',
            'kode_pos'     => 'nullable|string|max:10',
            'latitude'     => 'sometimes|numeric|between:-90,90',
            'longitude'    => 'sometimes|numeric|between:-180,180',
            'telepon'      => 'nullable|string|max:20',
            'email'        => 'nullable|email',
            'is_aktif'     => 'sometimes|boolean',
        ]);

        $kantor->update($validated);

        return response()->json([
            'message' => 'Kantor berhasil diperbarui',
            'data'    => $kantor,
        ]);
    }

    // DELETE /api/kantor/{id}
    public function destroy($id)
    {
        $kantor = Kantor::find($id);

        if (!$kantor) {
            return response()->json(['message' => 'Kantor tidak ditemukan'], 404);
        }

        $kantor->delete();

        return response()->json(['message' => 'Kantor berhasil dihapus']);
    }
}
