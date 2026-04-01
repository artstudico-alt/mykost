<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('karyawan', function (Blueprint $table) {
            // Add authentication fields
            $table->string('password')->nullable()->after('email');
            $table->rememberToken()->after('password');
            $table->timestamp('email_verified_at')->nullable()->after('rememberToken');
            
            // Make email required and unique for auth
            $table->unique('email');
        });
    }

    public function down(): void
    {
        Schema::table('karyawan', function (Blueprint $table) {
            $table->dropColumn(['password', 'rememberToken', 'email_verified_at']);
            $table->dropUnique(['email']);
        });
    }
};
