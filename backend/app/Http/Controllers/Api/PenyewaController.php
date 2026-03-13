<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Penyewa;
use Illuminate\Http\Request;

class PenyewaController extends Controller
{
    public function index()
    {
        $penyewa = Penyewa::with('user')->latest()->get();

        return response()->json([
            'message' => 'Data penyewa berhasil diambil',
            'data' => $penyewa
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'nama' => 'required|string|max:255',
            'nik' => 'nullable|string|max:50',
            'no_hp' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'tanggal_masuk' => 'nullable|date',
            'tanggal_keluar' => 'nullable|date',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        $penyewa = Penyewa::create($validated);

        return response()->json([
            'message' => 'Penyewa berhasil ditambahkan',
            'data' => $penyewa
        ], 201);
    }

    public function show(string $id)
    {
        $penyewa = Penyewa::with('user')->find($id);

        if (!$penyewa) {
            return response()->json([
                'message' => 'Data penyewa tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'message' => 'Detail penyewa berhasil diambil',
            'data' => $penyewa
        ]);
    }

    public function update(Request $request, string $id)
    {
        $penyewa = Penyewa::find($id);

        if (!$penyewa) {
            return response()->json([
                'message' => 'Data penyewa tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'nama' => 'required|string|max:255',
            'nik' => 'nullable|string|max:50',
            'no_hp' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'tanggal_masuk' => 'nullable|date',
            'tanggal_keluar' => 'nullable|date',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        $penyewa->update($validated);

        return response()->json([
            'message' => 'Data penyewa berhasil diperbarui',
            'data' => $penyewa
        ]);
    }

    public function destroy(string $id)
    {
        $penyewa = Penyewa::find($id);

        if (!$penyewa) {
            return response()->json([
                'message' => 'Data penyewa tidak ditemukan'
            ], 404);
        }

        $penyewa->delete();

        return response()->json([
            'message' => 'Data penyewa berhasil dihapus'
        ]);
    }
}