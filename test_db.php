<?php

// Script diagnostik untuk mengecek latensi koneksi database
// Jalankan dengan: php backend/test_db.php

require __DIR__ . '/backend/vendor/autoload.php';
$app = require_once __DIR__ . '/backend/bootstrap/app.php';

use Illuminate\Support\Facades\DB;

echo "--- MyKost Database Diagnostic ---\n";

$start = microtime(true);
try {
    echo "Mencoba menghubungkan ke database...\n";
    DB::connection()->getPdo();
    $end = microtime(true);
    $latency = ($end - $start) * 1000;
    
    echo "BERHASIL Konek!\n";
    echo "Latensi: " . round($latency, 2) . " ms\n";
    
    if ($latency > 2000) {
        echo "PERINGATAN: Koneksi sangat lambat (> 2 detik). Ini penyebab timeout 30s di browser.\n";
    } else {
        echo "Koneksi normal.\n";
    }
    
    $count = DB::table('kosts')->count();
    echo "Jumlah Kost di DB: " . $count . "\n";

} catch (\Exception $e) {
    echo "GAGAL Konek!\n";
    echo "Pesan Error: " . $e->getMessage() . "\n";
    echo "\nSaran: Periksa koneksi internet Anda atau cek apakah host database di .env sudah benar.\n";
}

echo "----------------------------------\n";
