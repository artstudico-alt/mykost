<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kamar extends Model
{
    protected $fillable = [
        'kost_id',
        'kode_kamar',
        'status',
        'catatan',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    // === Relasi ===

    public function kost()
    {
        return $this->belongsTo(Kost::class);
    }

    public function booking()
    {
        return $this->hasOne(Booking::class);
    }

    // === Scopes ===

    public function scopeTersedia($query)
    {
        return $query->where('status', 'tersedia');
    }

    public function scopeTerisi($query)
    {
        return $query->where('status', 'terisi');
    }

    // === Accessors ===

    public function getIsTersediaAttribute()
    {
        return $this->status === 'tersedia';
    }

    public function getIsTerisiAttribute()
    {
        return $this->status === 'terisi';
    }
}
