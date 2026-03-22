<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user_id = App\Models\User::where('email', 'superadmin@mykost.com')->value('id') ?? 1;

$kantor = App\Models\Kantor::updateOrCreate(
    ['nama_kantor' => 'WAN Teknologi'],
    [
        'user_id' => $user_id,
        'kota' => 'Bogor',
        'latitude' => -6.5636901,
        'longitude' => 106.7810486,
        'radius_toleransi' => 5
    ]
);

App\Models\Kost::updateOrCreate(
    ['nama_kost' => 'Kost Jarak Dekat (1km)'],
    [
        'user_id' => $user_id,
        'alamat' => 'Jl. Dekat WAN',
        'kota' => 'Bogor',
        'kecamatan' => 'Bogor Utara',
        'tipe' => 'campur',
        'harga_min' => 1000000,
        'latitude' => -6.5546901,
        'longitude' => 106.7810486,
        'fasilitas_umum' => json_encode(['WIFI']),
        'status' => 'aktif'
    ]
);

App\Models\Kost::updateOrCreate(
    ['nama_kost' => 'Kost Jarak Sedang (3km)'],
    [
        'user_id' => $user_id,
        'alamat' => 'Jl. Agak Jauh WAN',
        'kota' => 'Bogor',
        'kecamatan' => 'Bogor Utara',
        'tipe' => 'putra',
        'harga_min' => 800000,
        'latitude' => -6.5636901,
        'longitude' => 106.8080486,
        'fasilitas_umum' => json_encode(['Dapur']),
        'status' => 'aktif'
    ]
);

App\Models\Kost::updateOrCreate(
    ['nama_kost' => 'Kost Jarak Sangat Jauh (15km)'],
    [
        'user_id' => $user_id,
        'alamat' => 'Jl. Parung',
        'kota' => 'Bogor',
        'kecamatan' => 'Kemang',
        'tipe' => 'putri',
        'harga_min' => 1500000,
        'latitude' => -6.4236901,
        'longitude' => 106.7810486,
        'fasilitas_umum' => json_encode(['AC']),
        'status' => 'aktif'
    ]
);

echo "Kantor_ID WAN Teknologi: " . $kantor->id . "\n";
