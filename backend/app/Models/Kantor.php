<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kantor extends Model
{
    protected $table = 'kantor';

    protected $fillable = [
        'user_id',
        'nama_kantor',
        'kode_kantor',
        'alamat',
        'kelurahan',
        'kecamatan',
        'kota',
        'provinsi',
        'kode_pos',
        'latitude',
        'longitude',
        'telepon',
        'email',
        'is_aktif',
    ];

    protected $casts = [
        'latitude'  => 'float',
        'longitude' => 'float',
        'is_aktif'  => 'boolean',
    ];

    // === Relasi ===

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function karyawan()
    {
        return $this->hasMany(Karyawan::class);
    }
}
