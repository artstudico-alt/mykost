<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode Verifikasi MyKost</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #f4f6f9;
            margin: 0; padding: 0;
        }
        .container {
            max-width: 520px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #1a73e8, #0d47a1);
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 26px;
            letter-spacing: 1px;
        }
        .header p {
            color: rgba(255,255,255,0.8);
            margin: 6px 0 0;
            font-size: 13px;
        }
        .body {
            padding: 36px 40px;
        }
        .greeting {
            font-size: 16px;
            color: #333333;
            margin-bottom: 16px;
        }
        .desc {
            font-size: 14px;
            color: #666666;
            line-height: 1.6;
            margin-bottom: 28px;
        }
        .otp-box {
            background: #f0f4ff;
            border: 2px dashed #1a73e8;
            border-radius: 10px;
            text-align: center;
            padding: 24px;
            margin-bottom: 28px;
        }
        .otp-label {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 10px;
        }
        .otp-code {
            font-size: 42px;
            font-weight: 800;
            color: #1a73e8;
            letter-spacing: 10px;
        }
        .otp-expired {
            font-size: 12px;
            color: #e53935;
            margin-top: 10px;
        }
        .warning {
            background: #fff8e1;
            border-left: 4px solid #ffc107;
            border-radius: 6px;
            padding: 12px 16px;
            font-size: 13px;
            color: #666;
            margin-bottom: 24px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🏠 MyKost</h1>
        <p>Platform Kost Berbasis Lokasi Kantor</p>
    </div>
    <div class="body">
        <p class="greeting">Halo, <strong>{{ $namaUser }}</strong>! 👋</p>
        <p class="desc">
            Kamu menerima email ini karena ada permintaan pendaftaran akun di <strong>MyKost</strong>.
            Gunakan kode verifikasi di bawah ini untuk menyelesaikan proses pendaftaran.
        </p>

        <div class="otp-box">
            <div class="otp-label">Kode Verifikasi OTP</div>
            <div class="otp-code">{{ $kode }}</div>
            <div class="otp-expired">⏱ Kode berlaku selama <strong>10 menit</strong></div>
        </div>

        <div class="warning">
            ⚠️ <strong>Jangan bagikan kode ini</strong> kepada siapapun. Tim MyKost tidak akan pernah memintamu mengirimkan kode ini.
        </div>

        <p class="desc">
            Jika kamu tidak merasa mendaftar di MyKost, abaikan email ini.
            Akunmu tidak akan dibuat tanpa verifikasi kode ini.
        </p>
    </div>
    <div class="footer">
        © {{ date('Y') }} MyKost · Platform Kost Berbasis Lokasi Kantor<br>
        Email ini dikirim otomatis, mohon tidak membalas.
    </div>
</div>
</body>
</html>
