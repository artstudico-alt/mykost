<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar',
        'role_id',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // === Relasi ===

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function karyawan()
    {
        return $this->hasOne(Karyawan::class);
    }

    public function kosts()
    {
        return $this->hasMany(Kost::class);
    }

    public function kantor()
    {
        return $this->hasOne(Kantor::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function keluhans()
    {
        return $this->hasMany(Keluhan::class);
    }

    // === Helper Methods ===

    public function hasRole(string $role): bool
    {
        return $this->role?->name === $role;
    }

    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role?->name, $roles);
    }
}