<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Hunian;
use App\Models\Karyawan;
use App\Models\Pembayaran;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use App\Services\NotifikasiService;
use Midtrans\Config;
use Midtrans\Transaction;

class MidtransPaymentService
{
    public static function configure(): void
    {
        Config::$serverKey    = config('midtrans.server_key');
        Config::$isProduction = (bool) config('midtrans.is_production');
        Config::$isSanitized  = (bool) config('midtrans.is_sanitized');
        Config::$is3ds        = (bool) config('midtrans.is_3ds');
    }

    /**
     * Ambil status terbaru dari Midtrans lalu sinkronkan ke database (sumber utama kebenaran).
     */
    public static function syncOrderStatus(string $orderId): ?Pembayaran
    {
        self::configure();

        try {
            $remote = Transaction::status($orderId);
        } catch (\Throwable $e) {
            Log::warning('Midtrans Transaction::status gagal', [
                'order_id' => $orderId,
                'error'    => $e->getMessage(),
            ]);

            return null;
        }

        $tx = json_decode(json_encode($remote), true);

        return self::applyTransactionPayload($orderId, is_array($tx) ? $tx : []);
    }

    /**
     * Terapkan payload status (dari API status atau setelah notifikasi terverifikasi).
     *
     * @param  array<string, mixed>  $tx
     */
    public static function applyTransactionPayload(string $orderId, array $tx): ?Pembayaran
    {
        $pembayaran = Pembayaran::with('booking.kost')->where('nomor_referensi', $orderId)->first();

        if (! $pembayaran) {
            Log::warning('Pembayaran tidak ditemukan untuk order Midtrans', ['order_id' => $orderId]);

            return null;
        }

        $status      = $tx['transaction_status'] ?? '';
        $paymentType = strtolower((string) ($tx['payment_type'] ?? ''));
        $fraud       = $tx['fraud_status'] ?? null;

        $metode = match (true) {
            str_contains($paymentType, 'qris') => 'qris',
            $paymentType === 'virtual_account' => 'virtual_account',
            default => 'transfer',
        };

        if ($status === 'capture' && ($tx['payment_type'] ?? '') === 'credit_card' && $fraud === 'challenge') {
            $pembayaran->update([
                'keterangan' => 'Menunggu verifikasi anti-fraud (challenge)',
            ]);

            return $pembayaran->fresh();
        }

        if (in_array($status, ['settlement', 'capture'], true)) {
            if ($status === 'capture' && ($tx['payment_type'] ?? '') === 'credit_card' && $fraud !== 'accept') {
                return $pembayaran->fresh();
            }

            return self::markPembayaranBerhasil($pembayaran, $metode);
        }

        if ($status === 'pending') {
            $pembayaran->update([
                'status'      => 'pending',
                'metode'      => $metode,
                'keterangan'  => 'Menunggu pembayaran (' . ($paymentType ?: '—') . ')',
            ]);

            return $pembayaran->fresh();
        }

        if (in_array($status, ['deny', 'cancel', 'expire', 'failure'], true)) {
            $pembayaran->update([
                'status'      => 'gagal',
                'keterangan'  => $tx['status_message'] ?? $status,
            ]);

            return $pembayaran->fresh();
        }

        return $pembayaran->fresh();
    }

    public static function markPembayaranBerhasil(Pembayaran $pembayaran, string $metode): Pembayaran
    {
        if ($pembayaran->status === 'lunas') {
            return $pembayaran;
        }

        $pembayaran->update([
            'status'        => 'lunas',
            'tanggal_bayar' => Carbon::now(),
            'metode'        => $metode,
        ]);

        $booking = $pembayaran->booking;
        // Buat hunian dan kirim notifikasi
        if ($booking && in_array($booking->status, ['pending', 'confirmed'], true)) {
            $booking->update(['status' => 'aktif']);

            // Update status kamar spesifik yang dipilih menjadi 'terisi'
            if ($booking->nomor_kamar) {
                $kamar = \App\Models\Kamar::where('kost_id', $booking->kost_id)
                    ->where('kode_kamar', $booking->nomor_kamar)
                    ->first();
                if ($kamar) {
                    $kamar->update(['status' => 'terisi']);
                }
            }

            // Update kamar terisi count di kost
            $booking->kost->updateKamarTerisi();

            // Cari karyawan berdasarkan user_id
            $karyawan = Karyawan::where('user_id', $booking->user_id)->first();

            // Hanya buat hunian jika karyawan sudah terdaftar
            if ($karyawan && ! Hunian::where('booking_id', $booking->id)->exists()) {
                Hunian::where('karyawan_id', $karyawan->id)
                    ->where('status', 'aktif')
                    ->update(['status' => 'selesai', 'tanggal_keluar' => now()]);

                Hunian::create([
                    'karyawan_id'    => $karyawan->id,
                    'kost_id'        => $booking->kost_id,
                    'booking_id'     => $booking->id,
                    'tanggal_masuk'  => $booking->tanggal_mulai,
                    'tanggal_keluar' => $booking->tanggal_selesai,
                    'status'         => 'aktif',
                    'is_verified'    => false,
                ]);
            }

            // Kirim notifikasi ke pemilik kost
            if ($booking->kost && $booking->kost->user_id) {
                NotifikasiService::pembayaranLunas(
                    $booking->kost->user_id,
                    $booking->kost->nama_kost,
                    $booking->user?->name ?? 'Penyewa',
                    $pembayaran->jumlah
                );
            }
        }

        return $pembayaran->fresh(['booking']);
    }
}
