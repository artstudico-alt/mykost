<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $invoice_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f8fafc;
            padding: 20px;
            color: #334155;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .invoice-header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 32px;
        }
        .invoice-header h1 {
            font-size: 28px;
            margin-bottom: 8px;
        }
        .invoice-number {
            font-size: 14px;
            opacity: 0.9;
        }
        .invoice-body {
            padding: 32px;
        }
        .company-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #f1f5f9;
        }
        .company-details h2 {
            font-size: 18px;
            color: #10b981;
            margin-bottom: 8px;
        }
        .company-details p {
            font-size: 14px;
            color: #64748b;
            line-height: 1.6;
        }
        .invoice-dates {
            text-align: right;
        }
        .invoice-dates p {
            font-size: 14px;
            margin-bottom: 4px;
        }
        .invoice-dates strong {
            color: #334155;
        }
        .section {
            margin-bottom: 24px;
        }
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        .customer-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
        }
        .customer-info h3 {
            font-size: 18px;
            color: #334155;
            margin-bottom: 8px;
        }
        .customer-info p {
            font-size: 14px;
            color: #64748b;
            line-height: 1.6;
        }
        .booking-details {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }
        .booking-details th {
            background: #f1f5f9;
            padding: 12px 16px;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
        }
        .booking-details td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
        }
        .booking-details tr:last-child td {
            border-bottom: none;
        }
        .total-section {
            background: #f8fafc;
            padding: 24px;
            border-radius: 12px;
            margin-top: 24px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
        }
        .total-row.grand-total {
            font-size: 20px;
            font-weight: 700;
            color: #10b981;
            padding-top: 16px;
            border-top: 2px solid #e2e8f0;
            margin-top: 16px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-lunas {
            background: #dcfce7;
            color: #166534;
        }
        .footer {
            text-align: center;
            padding: 24px;
            background: #f8fafc;
            border-top: 1px solid #f1f5f9;
        }
        .footer p {
            font-size: 13px;
            color: #64748b;
        }
        .print-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #10b981;
            color: white;
            padding: 16px 24px;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .print-btn:hover {
            background: #059669;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .invoice-container {
                box-shadow: none;
                border-radius: 0;
            }
            .print-btn {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <h1>INVOICE</h1>
            <p class="invoice-number">{{ $invoice_number }}</p>
        </div>
        
        <div class="invoice-body">
            <div class="company-info">
                <div class="company-details">
                    <h2>{{ $company['name'] }}</h2>
                    <p>
                        {{ $company['address'] }}<br>
                        Telp: {{ $company['phone'] }}<br>
                        Email: {{ $company['email'] }}
                    </p>
                </div>
                <div class="invoice-dates">
                    <p><strong>Tanggal Invoice:</strong> {{ $invoice_date }}</p>
                    <p><strong>Tanggal Pembayaran:</strong> {{ $pembayaran->tanggal_bayar ? $pembayaran->tanggal_bayar->format('d F Y') : '-' }}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-lunas">LUNAS</span></p>
                </div>
            </div>
            
            <div class="section">
                <p class="section-title">Ditagihkan Kepada</p>
                <div class="customer-info">
                    <h3>{{ $customer->name }}</h3>
                    <p>
                        Email: {{ $customer->email }}<br>
                        @if($customer->phone)
                            Telp: {{ $customer->phone }}
                        @endif
                    </p>
                </div>
            </div>
            
            <div class="section">
                <p class="section-title">Detail Booking</p>
                <table class="booking-details">
                    <thead>
                        <tr>
                            <th>Kost</th>
                            <th>Tanggal Mulai</th>
                            <th>Tanggal Selesai</th>
                            <th>Durasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <strong>{{ $kost->nama_kost }}</strong><br>
                                <small>{{ $kost->alamat }}, {{ $kost->kota }}</small>
                            </td>
                            <td>{{ $booking->tanggal_mulai->format('d F Y') }}</td>
                            <td>{{ $booking->tanggal_selesai->format('d F Y') }}</td>
                            <td>{{ $booking->durasi_bulan }} bulan</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="total-section">
                <div class="total-row">
                    <span>Harga per Bulan</span>
                    <span>Rp {{ number_format($booking->harga_per_bulan, 0, ',', '.') }}</span>
                </div>
                <div class="total-row">
                    <span>Durasi</span>
                    <span>{{ $booking->durasi_bulan }} bulan</span>
                </div>
                <div class="total-row grand-total">
                    <span>Total Pembayaran</span>
                    <span>Rp {{ number_format($pembayaran->jumlah, 0, ',', '.') }}</span>
                </div>
            </div>
            
            <div class="section" style="margin-top: 24px;">
                <p class="section-title">Detail Pembayaran</p>
                <p style="font-size: 14px; color: #64748b;">
                    <strong>Metode:</strong> {{ ucfirst($pembayaran->metode) }}<br>
                    <strong>No. Referensi:</strong> {{ $pembayaran->nomor_referensi }}<br>
                    @if($pembayaran->keterangan)
                        <strong>Keterangan:</strong> {{ $pembayaran->keterangan }}
                    @endif
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>Terima kasih telah menggunakan layanan MyKost.<br>Invoice ini sah dan diproses secara elektronik.</p>
        </div>
    </div>
    
    <button class="print-btn" onclick="window.print()">
        🖨️ Cetak Invoice
    </button>
</body>
</html>
