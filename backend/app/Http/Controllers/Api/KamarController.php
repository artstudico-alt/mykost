<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kamar;
use App\Models\Kost;
use Illuminate\Http\Request;

class KamarController extends Controller
{
    // GET /api/kost/{kostId}/kamar
    public function index(Request $request, $kostId)
    {
        $kost = Kost::find($kostId);

        if (!$kost) {
            return response()->json(['message' => 'Kost tidak ditemukan'], 404);
        }

        $query = Kamar::where('kost_id', $kostId);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $kamars = $query->get();

        return response()->json([
            'message' => 'Data kamar berhasil diambil',
            'kost'    => $kost->only(['id', 'nama_kost', 'kota']),
            'total'   => $kamars->count(),
            'data'    => $kamars,
        ]);
    }

    // POST /api/kost/{kostId}/kamar
    public function store(Request $request, $kostId)
    {
        $kost = Kost::find($kostId);

        if (!$kost) {
            return response()->json(['message' => 'Kost tidak ditemukan'], 404);
        }

        $user = $request->user();

        if ($user->hasRole('pemilik_kost') && $kost->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak ke kost ini'], 403);
        }

        $validated = $request->validate([
            'nomor_kamar'   => 'required|string|max:20',
            'tipe_kamar'    => 'nullable|string|max:100',
            'harga_bulanan' => 'required|numeric|min:0',
            'luas'          => 'nullable|numeric|min:0',
            'kapasitas'     => 'sometimes|integer|min:1',
            'fasilitas'     => 'nullable|array',
            'deskripsi'     => 'nullable|string',
        ]);

        // Cek duplikat nomor kamar dalam kost yang sama
        $exists = Kamar::where('kost_id', $kostId)
            ->where('nomor_kamar', $validated['nomor_kamar'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Nomor kamar ' . $validated['nomor_kamar'] . ' sudah ada di kost ini',
            ], 422);
        }

        $validated['kost_id'] = $kostId;
        $kamar = Kamar::create($validated);

        // Update harga_min pada kost jika harga kamar lebih rendah
        if ($kamar->harga_bulanan < $kost->harga_min || $kost->harga_min == 0) {
            $kost->update(['harga_min' => $kamar->harga_bulanan]);
        }

        return response()->json([
            'message' => 'Kamar berhasil ditambahkan',
            'data'    => $kamar,
        ], 201);
    }

    // GET /api/kost/{kostId}/kamar/{id}
    public function show($kostId, $id)
    {
        $kamar = Kamar::where('kost_id', $kostId)->find($id);

        if (!$kamar) {
            return response()->json(['message' => 'Kamar tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail kamar berhasil diambil',
            'data'    => $kamar->load('kost'),
        ]);
    }

    // PUT /api/kost/{kostId}/kamar/{id}
    public function update(Request $request, $kostId, $id)
    {
        $kost  = Kost::find($kostId);
        $kamar = Kamar::where('kost_id', $kostId)->find($id);

        if (!$kost || !$kamar) {
            return response()->json(['message' => 'Kost atau kamar tidak ditemukan'], 404);
        }

        $user = $request->user();

        if ($user->hasRole('pemilik_kost') && $kost->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak ke kost ini'], 403);
        }

        $validated = $request->validate([
            'nomor_kamar'   => 'sometimes|string|max:20',
            'tipe_kamar'    => 'nullable|string|max:100',
            'harga_bulanan' => 'sometimes|numeric|min:0',
            'luas'          => 'nullable|numeric|min:0',
            'kapasitas'     => 'sometimes|integer|min:1',
            'fasilitas'     => 'nullable|array',
            'deskripsi'     => 'nullable|string',
            'status'        => 'sometimes|in:kosong,booking,terisi',
        ]);

        $kamar->update($validated);

        return response()->json([
            'message' => 'Data kamar berhasil diperbarui',
            'data'    => $kamar,
        ]);
    }

    // DELETE /api/kost/{kostId}/kamar/{id}
    public function destroy(Request $request, $kostId, $id)
    {
        $kost  = Kost::find($kostId);
        $kamar = Kamar::where('kost_id', $kostId)->find($id);

        if (!$kost || !$kamar) {
            return response()->json(['message' => 'Kost atau kamar tidak ditemukan'], 404);
        }

        $user = $request->user();

        if ($user->hasRole('pemilik_kost') && $kost->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak ke kost ini'], 403);
        }

        if ($kamar->status !== 'kosong') {
            return response()->json([
                'message' => 'Kamar tidak bisa dihapus karena sedang ditempati atau dalam proses booking',
            ], 422);
        }

        $kamar->delete();

        return response()->json(['message' => 'Kamar berhasil dihapus']);
    }
}