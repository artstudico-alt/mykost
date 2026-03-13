<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class OtpCode extends Model
{
    protected $fillable = [
        'email',
        'kode',
        'expires_at',
        'is_used',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_used'    => 'boolean',
    ];

    /**
     * Cek apakah OTP masih valid (belum expired dan belum dipakai)
     */
    public function isValid(): bool
    {
        return !$this->is_used && $this->expires_at->isFuture();
    }

    /**
     * Generate OTP baru untuk email tertentu (hapus OTP lama dulu)
     */
    public static function generate(string $email): self
    {
        // Hapus OTP lama milik email ini
        static::where('email', $email)->delete();

        return static::create([
            'email'      => $email,
            'kode'       => str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'expires_at' => Carbon::now()->addMinutes(10),
            'is_used'    => false,
        ]);
    }
}
