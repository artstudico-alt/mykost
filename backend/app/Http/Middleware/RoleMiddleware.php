<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Cek apakah user memiliki salah satu role yang diizinkan.
     * Contoh penggunaan: middleware('role:super_admin,hr')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $userRole = $user->role?->name;

        if (!$userRole || !in_array($userRole, $roles)) {
            return response()->json([
                'message' => 'Akses ditolak. Role kamu tidak memiliki izin untuk aksi ini.',
                'role_kamu' => $userRole,
                'role_dibutuhkan' => $roles,
            ], 403);
        }

        return $next($request);
    }
}
