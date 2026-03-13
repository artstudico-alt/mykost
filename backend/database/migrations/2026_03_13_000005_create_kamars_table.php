<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('kamars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kost_id')->constrained('kosts')->cascadeOnDelete();
            $table->string('nomor_kamar');
            $table->string('tipe_kamar')->nullable();
            $table->decimal('harga_bulanan', 12, 2);
            $table->decimal('luas', 8, 2)->nullable()->comment('dalam m2');
            $table->integer('kapasitas')->default(1);
            $table->json('fasilitas')->nullable();
            $table->text('deskripsi')->nullable();
            $table->enum('status', ['kosong', 'booking', 'terisi'])->default('kosong');
            $table->timestamps();

            $table->unique(['kost_id', 'nomor_kamar']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kamars');
    }
};
