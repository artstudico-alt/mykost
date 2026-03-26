<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Models\OtpCode;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    // ================================================================
    // STEP 1 — Register: validasi data + kirim OTP ke email
    // POST /api/auth/register
    // ================================================================
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'role_id' => 'nullable|exists:roles,id',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()        // harus ada huruf
                    ->mixedCase()      // harus ada huruf kapital & kecil
                    ->numbers()        // harus ada angka
                    ->symbols()        // harus ada karakter khusus (!@#$%^&*)
                    ->uncompromised(), // tidak boleh ada di database kebocoran
            ],
        ], [
            // Pesan error custom dalam Bahasa Indonesia
            'name.required' => 'Nama wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.unique' => 'Email ini sudah terdaftar.',
            'password.required' => 'Password wajib diisi.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.mixed_case' => 'Password harus mengandung huruf kapital dan huruf kecil.',
            'password.letters' => 'Password harus mengandung minimal satu huruf.',
            'password.numbers' => 'Password harus mengandung minimal satu angka.',
            'password.symbols' => 'Password harus mengandung minimal satu karakter khusus (!@#$%^&*).',
        ]);

        // Simpan data user sementara di cache / session sambil tunggu OTP
        // *** User belum dibuat di DB, baru dibuat setelah OTP verified ***

        // Generate dan kirim OTP
        $otp = OtpCode::generate($request->email);

        try {
            Mail::to($request->email)->send(new OtpMail(
                kode: $otp->kode,
                namaUser: $request->name,
            ));
        } catch (\Exception $e) {
            // Hapus OTP jika pengiriman gagal
            $otp->delete();
            return response()->json([
                'message' => 'Gagal mengirim email verifikasi. Pastikan email yang dimasukkan valid.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }

        // Simpan data pendaftaran sementara di cache (10 menit)
        cache()->put('register_data_' . $request->email, [
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'phone' => $request->phone,
            'role_id' => $request->role_id,
        ], now()->addMinutes(10));

        return response()->json([
            'message' => 'Kode OTP telah dikirim ke email ' . $request->email . '. Berlaku 10 menit.',
            'email' => $request->email,
            'next_step' => 'POST /api/auth/verify-otp dengan { email, kode }',
        ], 200);
    }

    // ================================================================
    // STEP 2 — Verifikasi OTP: konfirmasi kode, buat akun, return token
    // POST /api/auth/verify-otp
    // ================================================================
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'kode' => 'required|string|size:6',
        ]);

        // Cari OTP yang valid
        $otp = OtpCode::where('email', $request->email)
            ->where('kode', $request->kode)
            ->where('is_used', false)
            ->latest()
            ->first();

        if (!$otp) {
            return response()->json([
                'message' => 'Kode OTP tidak ditemukan.',
            ], 422);
        }

        if (!$otp->isValid()) {
            return response()->json([
                'message' => 'Kode OTP sudah kadaluarsa. Silakan request kode baru.',
            ], 422);
        }

        // Ambil data registrasi dari cache
        $registerData = cache()->get('register_data_' . $request->email);

        if (!$registerData) {
            return response()->json([
                'message' => 'Sesi pendaftaran kadaluarsa. Silakan daftar ulang.',
            ], 422);
        }

        // Tentukan role default jika tidak ada
        $roleId = $registerData['role_id'];
        if (!$roleId) {
            $defaultRole = Role::where('name', Role::KARYAWAN)->first();
            $roleId = $defaultRole?->id;
        }

        // Buat user di database
        $user = User::create([
            'name' => $registerData['name'],
            'email' => $registerData['email'],
            'password' => $registerData['password'],
            'phone' => $registerData['phone'],
            'role_id' => $roleId,
            'email_verified_at' => now(), // langsung terverifikasi
        ]);

        // Tandai OTP sebagai sudah dipakai
        $otp->update(['is_used' => true]);

        // Hapus data cache
        cache()->forget('register_data_' . $request->email);

        // Buat token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => '✅ Akun berhasil dibuat dan email berhasil diverifikasi!',
            'user' => $user->load('role'),
            'token' => $token,
        ], 201);
    }

    // ================================================================
    // RESEND OTP — jika kode kadaluarsa / tidak sampai
    // POST /api/auth/resend-otp
    // ================================================================
    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Pastikan ada sesi registrasi yang aktif
        $registerData = cache()->get('register_data_' . $request->email);

        if (!$registerData) {
            return response()->json([
                'message' => 'Tidak ada sesi pendaftaran aktif untuk email ini. Silakan daftar ulang.',
            ], 422);
        }

        // Generate OTP baru
        $otp = OtpCode::generate($request->email);

        try {
            Mail::to($request->email)->send(new OtpMail(
                kode: $otp->kode,
                namaUser: $registerData['name'],
            ));
        } catch (\Exception $e) {
            $otp->delete();
            return response()->json([
                'message' => 'Gagal mengirim ulang email. Coba beberapa saat lagi.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }

        return response()->json([
            'message' => 'Kode OTP baru telah dikirim ke ' . $request->email . '. Berlaku 10 menit.',
        ]);
    }

    // ================================================================
    // LOGIN
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

        // Cek apakah email sudah diverifikasi
        if (!$user->email_verified_at) {
            return response()->json([
                'message' => 'Email kamu belum diverifikasi. Silakan cek email dan masukkan kode OTP.',
                'next_step' => 'POST /api/auth/verify-otp',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => $user->load('role'),
            'token' => $token,
        ]);
    }

    // ================================================================
    // ME — data user yang sedang login
    // GET /api/auth/me
    // ================================================================
    public function me(Request $request)
    {
        return response()->json([
            'message' => 'Data user berhasil diambil.',
            'user' => $request->user()->load('role'),
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Email yang Anda masukkan tidak terdaftar di sistem kami. Silakan cek ulang.',
            ], 404);
        }

        $otp = OtpCode::generate($request->email);

        try {
            Mail::to($request->email)->send(new OtpMail(
                kode: $otp->kode, 
                namaUser: $user->name
            ));
        } catch (\Exception $e) {
            $otp->delete();
            return response()->json([
                'message' => 'Gagal mengirim email reset. Sistem Email SMTP (Gmail) mungkin belum di-setting dengan benar. (Mode Debug: OTP Anda adalah ' . $otp->kode . ')',
            ], 500);
        }

        return response()->json([
            'message' => 'Kode reset password telah dikirim ke email Anda. (Mode Debug: Cek terminal/log atau gunakan ' . $otp->kode . ' jika email gagal masuk)',
            'next_step' => 'POST /api/auth/reset-password dengan { email, kode, password, password_confirmation }',
        ]);
    }

    // ================================================================
    // RESET PASSWORD — Verifikasi OTP dan ganti password
    // POST /api/auth/reset-password
    // ================================================================
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'kode'     => 'required|string|size:6',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols()
            ],
        ], [
            'password.min' => 'Password minimal 8 karakter.',
            'password.symbols' => 'Password harus mengandung simbol.',
        ]);

        $otp = OtpCode::where('email', $request->email)
            ->where('kode', $request->kode)
            ->where('is_used', false)
            ->first();

        if (!$otp || !$otp->isValid()) {
            return response()->json(['message' => 'Kode OTP salah atau kadaluarsa.'], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        // Update Password dan pastikan status verifikasi aktif
        $user->update([
            'password'          => $request->password,
            'email_verified_at' => $user->email_verified_at ?? now(), // Tandai verifikasi jika belum
        ]);

        // Tandai OTP terpakai
        $otp->update(['is_used' => true]);

        return response()->json([
            'message' => '✅ Password berhasil diperbarui! Silakan login kembali.',
        ]);
    }

    // ================================================================
    // UPDATE PROFILE — Update data diri (Phone, NIK, Foto KTP)
    // POST /api/auth/update-profile
    // ================================================================
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'phone'     => 'nullable|string|max:20',
            'nik'       => 'nullable|string|size:16',
            'ktp_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $data = $request->only(['phone', 'nik']);

        if ($request->hasFile('ktp_photo')) {
            $file = $request->file('ktp_photo');
            $filename = time() . '_ktp_' . $user->id . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/ktp'), $filename);
            $data['ktp_photo'] = 'uploads/ktp/' . $filename;
        }

        $user->update($data);

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user'    => $user,
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
