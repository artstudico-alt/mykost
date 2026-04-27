<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KostDeleteRequest extends Model
{
    protected $fillable = [
        'kost_id',
        'requested_by',
        'reason',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function kost()
    {
        return $this->belongsTo(Kost::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
