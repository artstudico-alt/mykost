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
        'jumlah_kamar',
        'kamar_terisi',
    ];

    protected $casts = [
        'fasilitas_umum' => 'array',
        'latitude'       => 'float',
        'longitude'      => 'float',
        'harga_min'      => 'float',
        'foto_tambahan'  => 'array',
        'jumlah_kamar'   => 'integer',
        'kamar_terisi'   => 'integer',
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

    public function kamars()
    {
        return $this->hasMany(Kamar::class);
    }

    // === Accessors & Mutators ===

    public function getKamarTersediaAttribute()
    {
        return max(0, $this->jumlah_kamar - $this->kamar_terisi);
    }

    public function getPersentaseTerisiAttribute()
    {
        if ($this->jumlah_kamar == 0) return 0;
        return round(($this->kamar_terisi / $this->jumlah_kamar) * 100, 1);
    }

    public function getIsFullAttribute()
    {
        return $this->kamar_terisi >= $this->jumlah_kamar;
    }

    public function getIsAvailableAttribute()
    {
        return $this->kamar_terisi < $this->jumlah_kamar;
    }

    // === Methods ===

    public function updateKamarTerisi()
    {
        $this->kamar_terisi = $this->bookings()
            ->whereIn('status', ['aktif', 'confirmed'])
            ->count();
        $this->save();
    }

    public function isKamarAvailable($nomorKamar = null)
    {
        if ($this->is_full) return false;

        if ($nomorKamar) {
            // Check if specific room is already booked
            return !$this->bookings()
                ->whereIn('status', ['aktif', 'confirmed'])
                ->where('nomor_kamar', $nomorKamar)
                ->exists();
        }

        return true;
    }
}
