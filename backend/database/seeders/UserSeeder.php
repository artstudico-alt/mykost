<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ── Super Admin ─────────────────────────────────────────
        $superAdminRole  = Role::where('name', 'super_admin')->first();
        $hrRole          = Role::where('name', 'hr')->first();
        $pemilikKostRole = Role::where('name', 'pemilik_kost')->first();

        User::firstOrCreate(
            ['email' => 'superadmin@mykost.com'],
            [
                'name'              => 'Super Admin MyKost',
                'password'          => 'password123',
                'phone'             => '081234567890',
                'role_id'           => $superAdminRole?->id,
                'email_verified_at' => now(),
            ]
        );
        $this->command->info('✅ Super Admin  : superadmin@mykost.com / password123');

        // ── HR Manager ──────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'hr@mykost.com'],
            [
                'name'              => 'HR Manager MyKost',
                'password'          => 'password123',
                'phone'             => '082233445566',
                'role_id'           => $hrRole?->id,
                'email_verified_at' => now(),
            ]
        );
        $this->command->info('✅ HR Manager   : hr@mykost.com / password123');

        // ── Pemilik Kost ────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'pemilik@mykost.com'],
            [
                'name'              => 'Budi Pemilik Kost',
                'password'          => 'password123',
                'phone'             => '083344556677',
                'role_id'           => $pemilikKostRole?->id,
                'email_verified_at' => now(),
            ]
        );
        $this->command->info('✅ Pemilik Kost : pemilik@mykost.com / password123');
    }
}
