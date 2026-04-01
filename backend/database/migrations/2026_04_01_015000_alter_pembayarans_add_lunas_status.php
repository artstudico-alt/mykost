<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Alter enum untuk menambahkan 'lunas'
        DB::statement("ALTER TABLE pembayarans DROP CONSTRAINT IF EXISTS pembayarans_status_check");
        DB::statement("ALTER TABLE pembayarans ADD CONSTRAINT pembayarans_status_check CHECK (status::text = ANY (ARRAY['pending'::character varying, 'berhasil'::character varying, 'lunas'::character varying, 'gagal'::character varying, 'refund'::character varying]::text[]))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE pembayarans DROP CONSTRAINT IF EXISTS pembayarans_status_check");
        DB::statement("ALTER TABLE pembayarans ADD CONSTRAINT pembayarans_status_check CHECK (status::text = ANY (ARRAY['pending'::character varying, 'berhasil'::character varying, 'gagal'::character varying, 'refund'::character varying]::text[]))");
    }
};
