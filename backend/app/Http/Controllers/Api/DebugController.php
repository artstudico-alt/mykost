<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DebugController extends Controller
{
    public function check(Request $request)
    {
        $user = auth('sanctum')->user();
        $token = $request->bearerToken();
        $manualUser = null;
        if ($token) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            if ($accessToken) {
                $manualUser = $accessToken->tokenable->load('role');
            }
        }

        return response()->json([
            'auth_user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role?->name
            ] : null,
            'manual_user' => $manualUser ? [
                'id' => $manualUser->id,
                'name' => $manualUser->name,
                'role' => $manualUser->role?->name
            ] : null,
            'token_exists' => !empty($token),
            'token_snippet' => $token ? substr($token, 0, 5) . '...' : null
        ]);
    }
}
