<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kost extends Model
{
    protected $fillable = [
        'user_id',
        'nama_kost',
        'deskripsi',
        'tipe',
        'alamat',
        'kelurahan',
        'kecamatan',
        'kota',
        'provinsi',
        'kode_pos',
        'latitude',
        'longitude',
        'fasilitas_umum',
        'harga_min',
        'foto_utama',
        'foto_tambahan',
        'status',
    ];

    protected $casts = [
        'fasilitas_umum' => 'array',
        'latitude'       => 'float',
        'longitude'      => 'float',
        'harga_min'      => 'float',
        'foto_tambahan'  => 'array',
    ];

    // === Relasi ===

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function hunians()
    {
        return $this->hasMany(Hunian::class);
    }

    public function keluhans()
    {
        return $this->hasMany(Keluhan::class);
    }
}
