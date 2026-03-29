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
            // Simpan ke storage/app/public/kosts
            $path = $file->storeAs('kosts', $filename, 'public');

            // Kembalikan URL penuh (misal: http://localhost:8000/storage/kosts/namafile.jpg)
            return response()->json([
                'message' => 'Upload berhasil',
                'url' => asset('storage/' . $path),
            ]);
        }

        return response()->json(['message' => 'Tidak ada file yang diunggah'], 400);
    }
}
