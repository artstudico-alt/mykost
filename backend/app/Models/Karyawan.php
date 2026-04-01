<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Auth\Authenticatable;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class Karyawan extends Model implements AuthenticatableContract, CanResetPasswordContract
{
    use Authenticatable, CanResetPassword, HasApiTokens;
    protected $table = 'karyawan';

    protected $fillable = [
        'user_id',
        'kantor_id',
        'nik',
        'nama',
        'email',
        'no_hp',
        'jabatan',
        'divisi',
        'tanggal_bergabung',
        'status',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'tanggal_bergabung' => 'date',
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // === Mutator for password hashing ===
    public function setPasswordAttribute($value)
    {
        if ($value && !Hash::needsRehash($value)) {
            $this->attributes['password'] = $value;
        } elseif ($value) {
            $this->attributes['password'] = Hash::make($value);
        }
    }

    // === Auth helper methods ===
    public function getAuthIdentifierName()
    {
        return 'email';
    }

    public function getAuthIdentifier()
    {
        return $this->email;
    }

    // === Relasi ===

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function hunians()
    {
        return $this->hasMany(Hunian::class);
    }

    public function hunianAktif()
    {
        return $this->hasOne(Hunian::class)->where('status', 'aktif')->latest();
    }
}
