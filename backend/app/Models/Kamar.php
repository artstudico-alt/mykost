<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kamar extends Model
{
    protected $fillable = [
        'kost_id',
        'nomor_kamar',
        'tipe_kamar',
        'harga_bulanan',
        'luas',
        'kapasitas',
        'fasilitas',
        'deskripsi',
        'status',
    ];

    protected $casts = [
        'fasilitas'     => 'array',
        'harga_bulanan' => 'float',
        'luas'          => 'float',
        'kapasitas'     => 'integer',
    ];

    // === Relasi ===

    public function kost()
    {
        return $this->belongsTo(Kost::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function hunians()
    {
        return $this->hasMany(Hunian::class);
    }
}