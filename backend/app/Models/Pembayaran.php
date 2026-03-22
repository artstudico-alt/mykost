<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pembayaran extends Model
{
    protected $fillable = [
        'booking_id',
        'jumlah',
        'metode',
        'nomor_referensi',
        'bukti_pembayaran',
        'status',
        'snap_token',
        'tanggal_bayar',
        'keterangan',
    ];

    protected $casts = [
        'jumlah'       => 'float',
        'tanggal_bayar' => 'datetime',
    ];

    // === Relasi ===

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
