<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120', // Maks 5MB
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();

            // Gunakan disk supabase untuk production, public untuk local
            $disk = env('FILESYSTEM_DISK', 'public');
            $path = $file->storeAs('kosts', $filename, $disk);

            // Build URL berdasarkan disk
            if ($disk === 'supabase') {
                // Untuk Supabase S3
                $url = env('SUPABASE_STORAGE_URL') . '/kosts/' . $filename;
            } else {
                // Untuk local/public disk
                $host = $request->getSchemeAndHttpHost();
                $url = $host . '/storage/' . $path;
            }

            // Kembalikan URL penuh
            return response()->json([
                'message' => 'Upload berhasil',
                'url' => $url,
            ]);
        }

        return response()->json(['message' => 'Tidak ada file yang diunggah'], 400);
    }
}
