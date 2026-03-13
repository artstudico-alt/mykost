<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sewa;
use App\Models\Kamar;
use Illuminate\Http\Request;

class SewaController extends Controller
{
    public function index()
    {
        $sewa = Sewa::with(['penyewa', 'kamar'])->latest()->get();

        return response()->json([
            'message' => 'Data sewa berhasil diambil',
            'data' => $sewa
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'penyewa_id' => 'required|exists:penyewas,id',
            'kamar_id' => 'required|exists:kamars,id',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'nullable|date',
            'status' => 'required|in:aktif,selesai',
        ]);

        $kamar = Kamar::find($request->kamar_id);

        if (!$kamar) {
            return response()->json([
                'message' => 'Kamar tidak ditemukan'
            ], 404);
        }

        if ($kamar->status !== 'kosong') {
            return response()->json([
                'message' => 'Kamar tidak tersedia untuk disewa'
            ], 400);
        }

        $sewa = Sewa::create($validated);

        $kamar->update([
            'status' => 'terisi'
        ]);

        return response()->json([
            'message' => 'Data sewa berhasil ditambahkan',
            'data' => $sewa->load(['penyewa', 'kamar'])
        ], 201);
    }

    public function show(string $id)
    {
        $sewa = Sewa::with(['penyewa', 'kamar'])->find($id);

        if (!$sewa) {
            return response()->json([
                'message' => 'Data sewa tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'message' => 'Detail sewa berhasil diambil',
            'data' => $sewa
        ]);
    }

    public function update(Request $request, string $id)
    {
        $sewa = Sewa::find($id);

        if (!$sewa) {
            return response()->json([
                'message' => 'Data sewa tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'penyewa_id' => 'required|exists:penyewas,id',
            'kamar_id' => 'required|exists:kamars,id',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'nullable|date',
            'status' => 'required|in:aktif,selesai',
        ]);

        $sewa->update($validated);

        return response()->json([
            'message' => 'Data sewa berhasil diperbarui',
            'data' => $sewa->load(['penyewa', 'kamar'])
        ]);
    }

    public function destroy(string $id)
    {
        $sewa = Sewa::find($id);

        if (!$sewa) {
            return response()->json([
                'message' => 'Data sewa tidak ditemukan'
            ], 404);
        }

        $kamar = Kamar::find($sewa->kamar_id);

        if ($kamar) {
            $kamar->update([
                'status' => 'kosong'
            ]);
        }

        $sewa->delete();

        return response()->json([
            'message' => 'Data sewa berhasil dihapus'
        ]);
    }
}