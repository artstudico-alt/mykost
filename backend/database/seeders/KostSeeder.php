<?php

namespace Database\Seeders;

use App\Models\Kost;
use App\Models\User;
use Illuminate\Database\Seeder;

class KostSeeder extends Seeder
{
    public function run(): void
    {
        $pemilik = User::role('pemilik_kost')->first();

        if (!$pemilik) return;

        $kosts = [
            [
                'user_id' => $pemilik->id,
                'nama_kost' => 'Kost Green Garden Bogor',
                'deskripsi' => 'Kost eksklusif dengan fasilitas lengkap, dekat dengan pusat kota dan stasiun Bogor.',
                'tipe' => 'campur',
                'alamat' => 'Jl. Pajajaran No. 45, Baranangsiang',
                'kelurahan' => 'Baranangsiang',
                'kecamatan' => 'Bogor Timur',
                'kota' => 'Bogor',
                'provinsi' => 'Jawa Barat',
                'kode_pos' => '16143',
                'latitude' => -6.6017,
                'longitude' => 106.8048,
                'fasilitas_umum' => ['WiFi', 'Dapur', 'Parkir Motor', 'CCTV'],
                'harga_min' => 1500000,
                'foto_utama' => 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop',
                'status' => 'aktif',
            ],
            [
                'user_id' => $pemilik->id,
                'nama_kost' => 'Kost Putri Amanah (Dekat IPB)',
                'deskripsi' => 'Kost khusus putri yang aman dan tenang. Dekat dengan kampus IPB Dramaga.',
                'tipe' => 'putri',
                'alamat' => 'Jl. Raya Dramaga No. 12',
                'kelurahan' => 'Dramaga',
                'kecamatan' => 'Dramaga',
                'kota' => 'Bogor',
                'provinsi' => 'Jawa Barat',
                'kode_pos' => '16680',
                'latitude' => -6.5891,
                'longitude' => 106.7214,
                'fasilitas_umum' => ['WiFi', 'Dapur', 'Mushola', 'Ruang Tamu'],
                'harga_min' => 850000,
                'foto_utama' => 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070&auto=format&fit=crop',
                'status' => 'aktif',
            ],
            [
                'user_id' => $pemilik->id,
                'nama_kost' => 'Kost Putra Pandu Residence',
                'deskripsi' => 'Kost putra modern bergaya industrial. Fasilitas kamar mandi dalam dan AC.',
                'tipe' => 'putra',
                'alamat' => 'Jl. Pandu Raya No. 10',
                'kelurahan' => 'Tegal Gundil',
                'kecamatan' => 'Bogor Utara',
                'kota' => 'Bogor',
                'provinsi' => 'Jawa Barat',
                'kode_pos' => '16152',
                'latitude' => -6.5822,
                'longitude' => 106.8115,
                'fasilitas_umum' => ['WiFi', 'Parkir Luas', 'Dapur Bersama', 'Penjaga 24 Jam'],
                'harga_min' => 2200000,
                'foto_utama' => 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop',
                'status' => 'aktif',
            ],
            [
                'user_id' => $pemilik->id,
                'nama_kost' => 'Kost Mewah Sentul City',
                'deskripsi' => 'Kost premium di kawasan elit Sentul City. View pegunungan dan udara segar.',
                'tipe' => 'campur',
                'alamat' => 'Kawasan Sentul City, Jl. MH. Thamrin',
                'kelurahan' => 'Cipambuan',
                'kecamatan' => 'Babakan Madang',
                'kota' => 'Bogor',
                'provinsi' => 'Jawa Barat',
                'kode_pos' => '16810',
                'latitude' => -6.5492,
                'longitude' => 106.8624,
                'fasilitas_umum' => ['Kolam Renang', 'Gym', 'WiFi Speed Tinggi', 'Parkir Mobil'],
                'harga_min' => 3500000,
                'foto_utama' => 'https://images.unsplash.com/photo-1554995207-c18c20360a59?q=80&w=2070&auto=format&fit=crop',
                'status' => 'aktif',
            ],
        ];

        foreach ($kosts as $k) {
            Kost::create($k);
        }
    }
}
