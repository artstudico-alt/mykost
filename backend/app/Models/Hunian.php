<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hunian extends Model
{
    protected $fillable = [
        'karyawan_id',
        'kost_id',
        'booking_id',
        'tanggal_masuk',
        'tanggal_keluar',
        'status',
        'is_verified',
        'jarak_ke_kantor',
        'catatan',
    ];

    protected $casts = [
        'tanggal_masuk'   => 'date',
        'tanggal_keluar'  => 'date',
        'is_verified'     => 'boolean',
        'jarak_ke_kantor' => 'float',
    ];

    // === Relasi ===

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function kost()
    {
        return $this->belongsTo(Kost::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
