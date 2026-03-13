<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pembayarans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->decimal('jumlah', 14, 2);
            $table->enum('metode', ['transfer', 'cash', 'virtual_account', 'qris'])->default('transfer');
            $table->string('nomor_referensi')->nullable()->unique();
            $table->string('bukti_pembayaran')->nullable();
            $table->enum('status', ['pending', 'berhasil', 'gagal', 'refund'])->default('pending');
            $table->timestamp('tanggal_bayar')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembayarans');
    }
};
