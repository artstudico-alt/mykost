<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('kamar_id')->constrained('kamars')->cascadeOnDelete();
            $table->foreignId('kost_id')->constrained('kosts')->cascadeOnDelete();
            $table->date('tanggal_mulai');
            $table->integer('durasi_bulan')->default(1);
            $table->date('tanggal_selesai');
            $table->decimal('total_harga', 14, 2);
            $table->enum('status', ['pending', 'confirmed', 'aktif', 'selesai', 'dibatalkan'])->default('pending');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
