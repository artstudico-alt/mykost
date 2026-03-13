<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['name'];

    // Konstanta roles
    const SUPER_ADMIN   = 'super_admin';
    const HR            = 'hr';
    const PEMILIK_KOST  = 'pemilik_kost';
    const KARYAWAN      = 'karyawan';

    public function users()
    {
        return $this->hasMany(User::class);
    }
}