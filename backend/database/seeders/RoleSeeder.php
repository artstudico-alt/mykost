<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'super_admin',
            'hr',
            'pemilik_kost',
            'karyawan',
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        $this->command->info('✅ 4 roles berhasil dibuat: super_admin, hr, pemilik_kost, karyawan');
    }
}