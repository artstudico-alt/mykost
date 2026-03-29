<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Karyawan extends Model
{
    protected $table = 'karyawan';

    protected $fillable = [
        'user_id',
        'nik',
        'nama',
        'email',
        'no_hp',
        'jabatan',
        'divisi',
        'tanggal_bergabung',
        'status',
    ];

    protected $casts = [
        'tanggal_bergabung' => 'date',
    ];

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
