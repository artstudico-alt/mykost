<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = Role::where('name', 'super_admin')->first();

        User::firstOrCreate(
            ['email' => 'superadmin@mykost.com'],
            [
                'name'     => 'Super Admin MyKost',
                'password' => 'password123',
                'phone'             => '081234567890',
                'role_id'           => $superAdminRole?->id,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('✅ Super Admin default dibuat: superadmin@mykost.com / password123');
    }
}
