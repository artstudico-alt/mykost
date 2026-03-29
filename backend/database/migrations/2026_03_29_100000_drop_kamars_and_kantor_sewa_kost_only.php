<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sewa hanya per kost (tanpa entitas kamar). Tabel kantor dihapus — HR/karyawan tidak memakai FK kantor.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'kamar_id')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->dropForeign(['kamar_id']);
            });
            Schema::table('bookings', function (Blueprint $table) {
                $table->dropColumn('kamar_id');
            });
        }

        if (Schema::hasTable('hunians') && Schema::hasColumn('hunians', 'kamar_id')) {
            Schema::table('hunians', function (Blueprint $table) {
                $table->dropForeign(['kamar_id']);
            });
            Schema::table('hunians', function (Blueprint $table) {
                $table->dropColumn('kamar_id');
            });
        }

        if (Schema::hasTable('keluhans') && Schema::hasColumn('keluhans', 'kamar_id')) {
            Schema::table('keluhans', function (Blueprint $table) {
                $table->dropForeign(['kamar_id']);
            });
            Schema::table('keluhans', function (Blueprint $table) {
                $table->dropColumn('kamar_id');
            });
        }

        if (Schema::hasTable('karyawan') && Schema::hasColumn('karyawan', 'kantor_id')) {
            Schema::table('karyawan', function (Blueprint $table) {
                $table->dropForeign(['kantor_id']);
            });
            Schema::table('karyawan', function (Blueprint $table) {
                $table->dropColumn('kantor_id');
            });
        }

        Schema::dropIfExists('kamars');
        Schema::dropIfExists('kantor');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Rollback tidak mengembalikan data kamar/kantor; jalankan migrate:fresh + seed jika perlu.
    }
};
