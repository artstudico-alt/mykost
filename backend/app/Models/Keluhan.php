<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Keluhan extends Model
{
    protected $fillable = [
        'user_id',
        'kost_id',
        'judul',
        'isi',
        'status',
        'respon',
        'responded_at',
    ];

    protected $casts = [
        'responded_at' => 'datetime',
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
}
