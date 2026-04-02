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
        $settings = Setting::all()->pluck('value', 'key');
        
        // Map paths to full URLs for images
        if (isset($settings['logo']) && !str_starts_with($settings['logo'], 'http')) {
            $settings['logo'] = asset('storage/' . $settings['logo']);
        }
        if (isset($settings['hero_image']) && !str_starts_with($settings['hero_image'], 'http')) {
            $settings['hero_image'] = asset('storage/' . $settings['hero_image']);
        }

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * Update landing page settings (Admin Only).
     */
    public function update(Request $request)
    {
        $data = $request->all();
        
        foreach ($data as $key => $value) {
            // Skip internal fields
            if ($key === '_method' || $key === 'token') continue;

            $type = 'text';

            if ($request->hasFile($key)) {
                $type = 'image';
                $file = $request->file($key);
                $filename = time() . '_' . $key . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('settings', $filename, 'public');
                
                // Delete old file if exists
                $oldSetting = Setting::where('key', $key)->first();
                if ($oldSetting && $oldSetting->value) {
                    Storage::disk('public')->delete($oldSetting->value);
                }
                
                $value = $path;
            }

            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'type' => $type]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Landing page updated successfully',
            'data' => Setting::all()->pluck('value', 'key')
        ]);
    }
}
