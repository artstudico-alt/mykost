<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Keluhan;
use Illuminate\Http\Request;

class KeluhanController extends Controller
{
    // GET /api/keluhan
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Keluhan::with(['user', 'kost', 'kamar']);

        if ($user->hasRole('karyawan')) {
            $query->where('user_id', $user->id);
        } elseif ($user->hasRole('pemilik_kost')) {
            $query->whereHas('kost', fn($q) => $q->where('user_id', $user->id));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $keluhans = $query->latest()->get();

        return response()->json([
            'message' => 'Data keluhan berhasil diambil',
            'total'   => $keluhans->count(),
            'data'    => $keluhans,
        ]);
    }

    // POST /api/keluhan — karyawan buat keluhan
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kost_id'  => 'required|exists:kosts,id',
            'kamar_id' => 'nullable|exists:kamars,id',
            'judul'    => 'required|string|max:255',
            'isi'      => 'required|string',
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['status']  = 'open';

        $keluhan = Keluhan::create($validated);

        return response()->json([
            'message' => 'Keluhan berhasil dikirim',
            'data'    => $keluhan->load(['kost', 'kamar']),
        ], 201);
    }

    // GET /api/keluhan/{id}
    public function show(Request $request, $id)
    {
        $keluhan = Keluhan::with(['user', 'kost', 'kamar'])->find($id);

        if (!$keluhan) {
            return response()->json(['message' => 'Keluhan tidak ditemukan'], 404);
        }

        $user = $request->user();

        $isOwner       = $keluhan->user_id === $user->id;
        $isPemilikKost = $user->hasRole('pemilik_kost') && $keluhan->kost->user_id === $user->id;
        $isAdmin       = $user->hasAnyRole(['super_admin', 'hr']);

        if (!$isOwner && !$isPemilikKost && !$isAdmin) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        return response()->json([
            'message' => 'Detail keluhan berhasil diambil',
            'data'    => $keluhan,
        ]);
    }

    // PATCH /api/keluhan/{id}/respon — pemilik kost balas keluhan
    public function respon(Request $request, $id)
    {
        $keluhan = Keluhan::with('kost')->find($id);

        if (!$keluhan) {
            return response()->json(['message' => 'Keluhan tidak ditemukan'], 404);
        }

        $user = $request->user();

        if ($user->hasRole('pemilik_kost') && $keluhan->kost->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $request->validate([
            'respon' => 'required|string',
            'status' => 'required|in:diproses,selesai',
        ]);

        $keluhan->update([
            'respon'       => $request->respon,
            'status'       => $request->status,
            'responded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Respon keluhan berhasil disimpan',
            'data'    => $keluhan,
        ]);
    }
}
