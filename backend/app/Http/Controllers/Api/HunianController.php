<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hunian;
use App\Models\Karyawan;
use Illuminate\Http\Request;

class HunianController extends Controller
{
    // GET /api/hunian/saya — karyawan lihat hunian aktif sendiri
    public function saya(Request $request)
    {
        $user     = $request->user();
        $karyawan = Karyawan::where('user_id', $user->id)->first();

        if (!$karyawan) {
            return response()->json([
                'message' => 'Data karyawan tidak ditemukan untuk akun ini',
            ], 404);
        }

        $hunian = Hunian::with(['kost', 'booking'])
            ->where('karyawan_id', $karyawan->id)
            ->where('status', 'aktif')
            ->latest()
            ->first();

        return response()->json([
            'message' => 'Data hunian aktif berhasil diambil',
            'data'    => $hunian,
        ]);
    }

    // GET /api/hunian/riwayat — karyawan lihat semua riwayat hunian
    public function riwayat(Request $request)
    {
        $user     = $request->user();
        $karyawan = Karyawan::where('user_id', $user->id)->first();

        if (!$karyawan) {
            return response()->json(['message' => 'Data karyawan tidak ditemukan'], 404);
        }

        $hunians = Hunian::with(['kost', 'booking'])
            ->where('karyawan_id', $karyawan->id)
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Riwayat hunian berhasil diambil',
            'total'   => $hunians->count(),
            'data'    => $hunians,
        ]);
    }

    // POST /api/hunian — HR input hunian manual (tanpa booking)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'karyawan_id'    => 'required|exists:karyawan,id',
            'kost_id'        => 'required|exists:kosts,id',
            'booking_id'     => 'nullable|exists:bookings,id',
            'tanggal_masuk'  => 'required|date',
            'tanggal_keluar' => 'nullable|date|after:tanggal_masuk',
            'catatan'        => 'nullable|string',
        ]);

        Hunian::where('karyawan_id', $validated['karyawan_id'])
            ->where('status', 'aktif')
            ->update(['status' => 'selesai', 'tanggal_keluar' => now()]);

        $hunian = Hunian::create([
            ...$validated,
            'status'      => 'aktif',
            'is_verified' => true,
        ]);

        return response()->json([
            'message' => 'Data hunian berhasil ditambahkan',
            'data'    => $hunian->load(['karyawan', 'kost']),
        ], 201);
    }

    // PATCH /api/hunian/{id}/verify — HR verifikasi hunian
    public function verify(Request $request, $id)
    {
        $hunian = Hunian::find($id);

        if (!$hunian) {
            return response()->json(['message' => 'Data hunian tidak ditemukan'], 404);
        }

        $request->validate([
            'is_verified'     => 'required|boolean',
            'jarak_ke_kantor' => 'nullable|numeric|min:0',
            'catatan'         => 'nullable|string',
        ]);

        $hunian->update([
            'is_verified'     => $request->is_verified,
            'jarak_ke_kantor' => $request->jarak_ke_kantor ?? $hunian->jarak_ke_kantor,
            'catatan'         => $request->catatan ?? $hunian->catatan,
        ]);

        return response()->json([
            'message' => 'Status verifikasi hunian berhasil diperbarui',
            'data'    => $hunian->load(['karyawan', 'kost']),
        ]);
    }

    // PATCH /api/hunian/{id}/selesai — HR tandai hunian selesai
    public function selesai(Request $request, $id)
    {
        $hunian = Hunian::find($id);

        if (!$hunian) {
            return response()->json(['message' => 'Data hunian tidak ditemukan'], 404);
        }

        if ($hunian->status === 'selesai') {
            return response()->json(['message' => 'Hunian sudah berstatus selesai'], 422);
        }

        $hunian->update([
            'status'         => 'selesai',
            'tanggal_keluar' => $request->tanggal_keluar ?? now(),
        ]);

        return response()->json([
            'message' => 'Hunian berhasil ditandai selesai',
            'data'    => $hunian,
        ]);
    }
}
