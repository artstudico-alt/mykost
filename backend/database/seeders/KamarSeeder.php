<?php

namespace Database\Seeders;

use App\Models\Kamar;
use App\Models\Kost;
use Illuminate\Database\Seeder;

class KamarSeeder extends Seeder
{
    public function run(): void
    {
        $kosts = Kost::all();

        foreach ($kosts as $k) {
            // Kita buat 5-8 kamar untuk setiap kost
            $jumlah = rand(5, 8);

            for ($i = 1; $i <= $jumlah; $i++) {
                Kamar::create([
                    'kost_id' => $k->id,
                    'nama_kamar' => 'Kamar ' . str_pad($i, 2, '0', STR_PAD_LEFT),
                    'tipe_kamar' => ($i % 2 == 0) ? 'Eksklusif' : 'Standard',
                    'fasilitas' => ['AC', 'Kamar Mandi Dalam', 'Lemari', 'Meja', 'Ventilasi'],
                    'harga_per_bulan' => $k->harga_min + ($i * 100000), // bervariasi
                    'ukuran' => '3x4 m',
                    'status' => (rand(1, 10) > 3) ? 'kosong' : 'terisi',
                    'foto_kamar' => null,
                ]);
            }
        }
    }
}
