<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Karyawan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // ================================================================
    // PUBLIC REGISTRATION DISABLED — HR creates accounts for employees
    // POST /api/auth/register
    // ================================================================
    public function register(Request $request)
    {
        return response()->json([
            'message' => 'Registrasi publik telah dinonaktifkan. Akun karyawan hanya dapat dibuat oleh HR.',
        ], 403);
    }

    // ================================================================
    // PUBLIC OTP VERIFICATION DISABLED
    // POST /api/auth/verify-otp
    // ================================================================
    public function verifyOtp(Request $request)
    {
        return response()->json([
            'message' => 'Verifikasi OTP tidak diperlukan. Akun karyawan hanya dapat dibuat oleh HR.',
        ], 403);
    }

    // ================================================================
    // PUBLIC RESEND OTP DISABLED
    // POST /api/auth/resend-otp
    // ================================================================
    public function resendOtp(Request $request)
    {
        return response()->json([
            'message' => 'Pengiriman ulang OTP tidak diperlukan. Akun karyawan hanya dapat dibuat oleh HR.',
        ], 403);
    }

    // ================================================================
    // LOGIN - Simplified: use only Users table
    // POST /api/auth/login
    // ================================================================
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], 401);
        }

        // Check if email verified
        if (!$user->email_verified_at) {
            return response()->json([
                'message' => 'Email kamu belum diverifikasi.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Auto-create karyawan record jika user punya role karyawan tapi belum ada data karyawan
        if ($user->role?->name === 'karyawan') {
            $karyawanExists = Karyawan::where('user_id', $user->id)->exists();
            if (!$karyawanExists) {
                Karyawan::create([
                    'user_id' => $user->id,
                    'nik' => 'KAR-' . time() . '-' . $user->id,
                    'nama' => $user->name,
                    'email' => $user->email,
                    'no_hp' => $user->phone ?? null,
                    'jabatan' => 'Karyawan',
                    'divisi' => 'Umum',
                    'status' => 'aktif',
                    'tanggal_bergabung' => now(),
                ]);
                Log::info('Auto-created karyawan record for user', ['user_id' => $user->id, 'email' => $user->email]);
            }
        }

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->load('role')->role,
            ],
            'token' => $token,
        ]);
    }

    // ================================================================
    // ME — data user yang sedang login
    // GET /api/auth/me
    // ================================================================
    public function me(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['message' => 'User tidak ditemukan.'], 401);
            }

            return response()->json([
                'message' => 'Data user berhasil diambil.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->name ?? 'unknown',
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in me(): ' . $e->getMessage());
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function forgotPassword(Request $request)
    {
        return response()->json([
            'message' => 'Reset password dengan OTP telah dinonaktifkan. Hubungi HR atau admin untuk reset password.',
        ], 403);
    }

    // ================================================================
    // RESET PASSWORD — DISABLED (no OTP)
    // POST /api/auth/reset-password
    // ================================================================
    public function resetPassword(Request $request)
    {
        return response()->json([
            'message' => 'Reset password dengan OTP telah dinonaktifkan. Hubungi HR atau admin untuk reset password.',
        ], 403);
    }

    // ================================================================
    // UPDATE PROFILE — Update data diri
    // POST /api/auth/update-profile
    // ================================================================
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'phone' => 'nullable|string|max:20',
            'ktp_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $data = $request->only(['phone']);

        if ($request->hasFile('ktp_photo')) {
            $file = $request->file('ktp_photo');
            $filename = time() . '_ktp_' . $user->id . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/ktp'), $filename);
            $data['ktp_photo'] = 'uploads/ktp/' . $filename;
        }

        $user->update($data);

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $user,
        ]);
    }

    // ================================================================
    // LOGOUT
    // POST /api/auth/logout
    // ================================================================
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }
}
