<?php

namespace App\Services;

use App\Models\Notifikasi;
use App\Models\User;

class NotifikasiService
{
    /**
     * Buat notifikasi untuk user tertentu
     */
    public static function create(int $userId, string $judul, string $pesan, string $tipe = 'info', ?string $link = null): Notifikasi
    {
        return Notifikasi::create([
            'user_id' => $userId,
            'judul' => $judul,
            'pesan' => $pesan,
            'tipe' => $tipe,
            'link' => $link,
            'is_read' => false,
        ]);
    }

    /**
     * Buat notifikasi untuk semua user dengan role tertentu
     */
    public static function createForRole(string $roleName, string $judul, string $pesan, string $tipe = 'info', ?string $link = null): void
    {
        $users = User::whereHas('role', fn ($q) => $q->where('name', $roleName))->get();
        
        foreach ($users as $user) {
            self::create($user->id, $judul, $pesan, $tipe, $link);
        }
    }

    /**
     * Notifikasi pembayaran lunas untuk pemilik kost
     */
    public static function pembayaranLunas(int $pemilikKostId, string $kostNama, string $penyewaNama, float $jumlah): void
    {
        self::create(
            $pemilikKostId,
            'Pembayaran Diterima',
            "Pembayaran Rp " . number_format($jumlah, 0, ',', '.') . " dari {$penyewaNama} untuk {$kostNama} telah lunas.",
            'success',
            '/#/owner/pembayaran'
        );
    }

    /**
     * Notifikasi keluhan baru untuk pemilik kost
     */
    public static function keluhanBaru(int $pemilikKostId, string $kostNama, string $penyewaNama): void
    {
        self::create(
            $pemilikKostId,
            'Keluhan Baru',
            "Ada keluhan baru dari {$penyewaNama} untuk {$kostNama}.",
            'warning',
            '/#/owner/keluhan'
        );
    }

    /**
     * Notifikasi respon keluhan untuk penyewa
     */
    public static function keluhanDirespon(int $userId, string $kostNama): void
    {
        self::create(
            $userId,
            'Keluhan Direspon',
            "Keluhan Anda untuk {$kostNama} telah direspon oleh pemilik kost.",
            'success',
            '/#/dashboard'
        );
    }

    /**
     * Notifikasi booking baru untuk pemilik kost dan admin
     */
    public static function bookingBaru(string $kostNama, string $penyewaNama): void
    {
        // Untuk pemilik kost yang memiliki kost
        $pesan = "Booking baru dari {$penyewaNama} untuk {$kostNama}";
        
        self::createForRole('super_admin', 'Booking Baru', $pesan, 'info', '/#/admin/dashboard');
    }

    /**
     * Notifikasi karyawan baru untuk HR
     */
    public static function karyawanBaru(string $namaKaryawan): void
    {
        self::createForRole(
            'hr',
            'Karyawan Baru Terdaftar',
            "Karyawan baru {$namaKaryawan} telah terdaftar di sistem.",
            'info',
            '/#/hr/karyawan'
        );
        
        self::createForRole(
            'super_admin',
            'Karyawan Baru Terdaftar',
            "Karyawan baru {$namaKaryawan} telah terdaftar di sistem.",
            'info',
            '/#/admin/karyawan'
        );
    }

    /**
     * Notifikasi kost baru pending approval
     */
    public static function kostBaruPending(string $namaKost, string $pemilikNama): void
    {
        self::createForRole(
            'super_admin',
            'Kost Baru Menunggu Approval',
            "{$namaKost} oleh {$pemilikNama} menunggu verifikasi.",
            'warning',
            '/#/admin/kost'
        );
    }

    /**
     * Notifikasi kost di-approve
     */
    public static function kostDiapprove(int $pemilikId, string $namaKost): void
    {
        self::create(
            $pemilikId,
            'Kost Diapprove',
            "{$namaKost} telah diverifikasi dan aktif.",
            'success',
            '/#/owner/kost'
        );
    }
}
