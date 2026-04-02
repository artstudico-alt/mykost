<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class LandingPageController extends Controller
{
    /**
     * Get all landing page settings.
     */
    public function index()
    {
        $allSettings = Setting::all()->pluck('value', 'key')->toArray();
        
        // Map paths to full URLs for any key containing 'logo' or 'image'
        foreach ($allSettings as $k => $v) {
            if ($v && !str_starts_with($v, 'http') && (str_contains($k, 'logo') || str_contains($k, 'image'))) {
                $allSettings[$k] = asset('storage/' . $v);
            }
        }

        return response()->json([
            'success' => true,
            'data' => (object)$allSettings
        ]);
    }

    /**
     * Update landing page settings (Admin Only).
     */
    public function update(Request $request)
    {
        try {
            $data = $request->all();
            $baseUrl = asset('storage/');
            
            foreach ($data as $key => $value) {
                // Skip internal fields and null values
                if ($key === '_method' || $key === 'token' || $value === 'null' || $value === null) continue;

                $type = 'text';

                if ($request->hasFile($key)) {
                    $type = 'image';
                    $file = $request->file($key);
                    
                    // Validate file
                    if (!$file->isValid()) continue;

                    $filename = time() . '_' . $key . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('settings', $filename, 'public');
                    
                    // Delete old file if exists
                    $oldSetting = Setting::where('key', $key)->first();
                    if ($oldSetting && $oldSetting->value) {
                        Storage::disk('public')->delete($oldSetting->value);
                    }
                    
                    $value = $path;
                } else {
                    // Sanitize: Jika nilai adalah URL lengkap (karena dikirim balik dari frontend),
                    // potong base URL-nya supaya yang disimpan di database tetap relatif.
                    if (is_string($value) && str_starts_with($value, $baseUrl)) {
                        $value = str_replace($baseUrl, '', $value);
                    }
                    
                    // Jangan simpan object/array sebagai text
                    if (!is_string($value) && !is_numeric($value)) continue;
                }

                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value, 'type' => $type]
                );
            }

            // Return fresh settings mapped with URLs
            $allSettings = Setting::all()->pluck('value', 'key')->toArray();
            foreach ($allSettings as $k => $v) {
                if ($v && !str_starts_with($v, 'http') && (str_contains($k, 'logo') || str_contains($k, 'image'))) {
                    $allSettings[$k] = asset('storage/' . $v);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Landing page updated successfully',
                'data' => (object)$allSettings
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('CMS Update Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan aplikasi: ' . $e->getMessage()
            ], 500);
        }
    }
}
