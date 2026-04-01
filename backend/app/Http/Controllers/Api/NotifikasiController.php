<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notifikasi;
use Illuminate\Http\Request;

class NotifikasiController extends Controller
{
    // GET /api/notifikasi
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Notifikasi::where('user_id', $user->id);
        
        if ($request->boolean('unread_only')) {
            $query->where('is_read', false);
        }
        
        $notifikasis = $query->latest()->take(50)->get();
        
        $unreadCount = Notifikasi::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();
        
        return response()->json([
            'message' => 'Data notifikasi berhasil diambil',
            'unread_count' => $unreadCount,
            'data' => $notifikasis,
        ]);
    }

    // PATCH /api/notifikasi/{id}/read
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        $notifikasi = Notifikasi::where('id', $id)
            ->where('user_id', $user->id)
            ->first();
        
        if (! $notifikasi) {
            return response()->json(['message' => 'Notifikasi tidak ditemukan'], 404);
        }
        
        $notifikasi->markAsRead();
        
        return response()->json([
            'message' => 'Notifikasi ditandai sudah dibaca',
            'data' => $notifikasi,
        ]);
    }

    // POST /api/notifikasi/read-all
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        
        Notifikasi::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        
        return response()->json([
            'message' => 'Semua notifikasi ditandai sudah dibaca',
        ]);
    }

    // DELETE /api/notifikasi/{id}
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $notifikasi = Notifikasi::where('id', $id)
            ->where('user_id', $user->id)
            ->first();
        
        if (! $notifikasi) {
            return response()->json(['message' => 'Notifikasi tidak ditemukan'], 404);
        }
        
        $notifikasi->delete();
        
        return response()->json([
            'message' => 'Notifikasi berhasil dihapus',
        ]);
    }
}
