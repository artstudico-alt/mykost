<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Booking extends Model
{
    protected $fillable = [
        'user_id',
        'kost_id',
        'tanggal_mulai',
        'durasi_bulan',
        'tanggal_selesai',
        'total_harga',
        'status',
        'catatan',
    ];

    protected $casts = [
        'tanggal_mulai'   => 'date',
        'tanggal_selesai' => 'date',
        'total_harga'     => 'float',
        'durasi_bulan'    => 'integer',
    ];

    // === Relasi ===

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function kost()
    {
        return $this->belongsTo(Kost::class);
    }

    public function pembayarans()
    {
        return $this->hasMany(Pembayaran::class);
    }

    public function hunian()
    {
        return $this->hasOne(Hunian::class);
    }

    // === Helper Methods ===

    public function hitungTanggalSelesai(): Carbon
    {
        return Carbon::parse($this->tanggal_mulai)->addMonths($this->durasi_bulan);
    }
}
