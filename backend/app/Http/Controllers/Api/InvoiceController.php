<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    /**
     * Generate invoice untuk pembayaran yang sudah lunas
     */
    public function generate(Request $request, int $pembayaranId): JsonResponse
    {
        $user = $request->user();

        // Cari pembayaran
        $pembayaran = Pembayaran::with(['booking.kost', 'booking.user'])->find($pembayaranId);

        if (! $pembayaran) {
            return response()->json([
                'message' => 'Pembayaran tidak ditemukan',
            ], 404);
        }

        // Cek akses: hanya super_admin, hr, atau pemilik pembayaran yang bisa lihat
        $isOwner = $pembayaran->booking?->user_id === $user->id;
        $hasAccess = $user->hasAnyRole(['super_admin', 'hr']) || $isOwner;

        if (! $hasAccess) {
            return response()->json([
                'message' => 'Akses ditolak',
            ], 403);
        }

        // Hanya pembayaran lunas yang bisa generate invoice
        if ($pembayaran->status !== 'lunas') {
            return response()->json([
                'message' => 'Invoice hanya tersedia untuk pembayaran yang sudah lunas',
            ], 400);
        }

        $booking = $pembayaran->booking;
        $kost = $booking?->kost;
        $customer = $booking?->user;

        if (! $booking || ! $kost || ! $customer) {
            return response()->json([
                'message' => 'Data booking tidak lengkap',
            ], 400);
        }

        // Generate nomor invoice
        $invoiceNumber = 'INV-' . date('Ymd') . '-' . str_pad((string) $pembayaran->id, 6, '0', STR_PAD_LEFT);

        // Data invoice
        $invoiceData = [
            'invoice_number' => $invoiceNumber,
            'invoice_date' => now()->format('d F Y'),
            'due_date' => now()->addDays(7)->format('d F Y'),
            'pembayaran' => $pembayaran,
            'booking' => $booking,
            'kost' => $kost,
            'customer' => $customer,
            'company' => [
                'name' => 'MyKost Property Management',
                'address' => 'Jakarta, Indonesia',
                'phone' => '+62 812-3456-7890',
                'email' => 'admin@mykost.com',
            ],
        ];

        return response()->json([
            'message' => 'Invoice berhasil digenerate',
            'data' => $invoiceData,
        ]);
    }

    /**
     * Preview invoice (HTML view)
     */
    public function preview(Request $request, int $pembayaranId)
    {
        $user = $request->user();

        $pembayaran = Pembayaran::with(['booking.kost', 'booking.user'])->find($pembayaranId);

        if (! $pembayaran) {
            return response()->json([
                'message' => 'Pembayaran tidak ditemukan',
            ], 404);
        }

        $isOwner = $pembayaran->booking?->user_id === $user->id;
        $hasAccess = $user->hasAnyRole(['super_admin', 'hr']) || $isOwner;

        if (! $hasAccess) {
            return response()->json([
                'message' => 'Akses ditolak',
            ], 403);
        }

        if ($pembayaran->status !== 'lunas') {
            return response()->json([
                'message' => 'Invoice hanya tersedia untuk pembayaran yang sudah lunas',
            ], 400);
        }

        $booking = $pembayaran->booking;
        $kost = $booking?->kost;
        $customer = $booking?->user;

        $invoiceNumber = 'INV-' . date('Ymd') . '-' . str_pad((string) $pembayaran->id, 6, '0', STR_PAD_LEFT);

        $data = [
            'invoice_number' => $invoiceNumber,
            'invoice_date' => now()->format('d F Y'),
            'pembayaran' => $pembayaran,
            'booking' => $booking,
            'kost' => $kost,
            'customer' => $customer,
            'company' => [
                'name' => 'MyKost Property Management',
                'address' => 'Jakarta, Indonesia',
                'phone' => '+62 812-3456-7890',
                'email' => 'admin@mykost.com',
            ],
        ];

        return view('invoice.template', $data);
    }

    /**
     * Download invoice sebagai PDF
     */
    public function download(Request $request, int $pembayaranId)
    {
        $user = $request->user();

        $pembayaran = Pembayaran::with(['booking.kost', 'booking.user'])->find($pembayaranId);

        if (! $pembayaran) {
            return response()->json([
                'message' => 'Pembayaran tidak ditemukan',
            ], 404);
        }

        $isOwner = $pembayaran->booking?->user_id === $user->id;
        $hasAccess = $user->hasAnyRole(['super_admin', 'hr']) || $isOwner;

        if (! $hasAccess) {
            return response()->json([
                'message' => 'Akses ditolak',
            ], 403);
        }

        if ($pembayaran->status !== 'lunas') {
            return response()->json([
                'message' => 'Invoice hanya tersedia untuk pembayaran yang sudah lunas',
            ], 400);
        }

        $booking = $pembayaran->booking;
        $kost = $booking?->kost;
        $customer = $booking?->user;

        $invoiceNumber = 'INV-' . date('Ymd') . '-' . str_pad((string) $pembayaran->id, 6, '0', STR_PAD_LEFT);

        $data = [
            'invoice_number' => $invoiceNumber,
            'invoice_date' => now()->format('d F Y'),
            'pembayaran' => $pembayaran,
            'booking' => $booking,
            'kost' => $kost,
            'customer' => $customer,
            'company' => [
                'name' => 'MyKost Property Management',
                'address' => 'Jakarta, Indonesia',
                'phone' => '+62 812-3456-7890',
                'email' => 'admin@mykost.com',
            ],
        ];

        $pdf = Pdf::loadView('invoice.template', $data);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->download("{$invoiceNumber}.pdf");
    }
}
