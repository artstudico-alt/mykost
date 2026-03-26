import 'package:flutter/material.dart';
import '../../utils/colors.dart';

class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});

  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  // Data dummy tagihan (data dari ajuan sewa)
  final List<Map<String, dynamic>> _bills = [
    {
      "id": "INV-001",
      "month": "Maret 2026",
      "amount": 1800000,
      "dueDate": "10 Maret 2026",
      "status": "Belum Bayar",
      "kost_name": "Kost Gg. Melati Indah",
    }
  ];

  void _processPayment(String billId) {
    // Simulasi memanggil API Midtrans dari Backend
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return const Center(child: CircularProgressIndicator(color: AppColors.primary));
      },
    );

    Future.delayed(const Duration(seconds: 2), () {
      Navigator.pop(context); // Tutup loading
      
      // Biasanya disini akan membuka WebView Midtrans atau Midtrans Snap SDK
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Mengalihkan ke halaman pembayaran otomatis UI (Midtrans)...")),
      );
      
      // Simulasi pindah ke halaman checkout midtrans
      // Untuk simulasi UI saat ini, cukup tampilkan snackbar
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text("Tagihan & Pembayaran", style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: _bills.isEmpty
          ? const Center(
              child: Text(
                "Tidak ada tagihan saat ini",
                style: TextStyle(color: Colors.grey, fontSize: 16),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _bills.length,
              itemBuilder: (context, index) {
                final bill = _bills[index];
                return _buildBillCard(bill);
              },
            ),
    );
  }

  Widget _buildBillCard(Map<String, dynamic> bill) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Tagihan Sewa",
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    bill['status'],
                    style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.w600, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              "${bill['kost_name']} - ${bill['month']}",
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Total Tagihan", style: TextStyle(color: Colors.grey)),
                Text(
                  "Rp ${bill['amount']}",
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Jatuh Tempo", style: TextStyle(color: Colors.grey)),
                Text(
                  bill['dueDate'],
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Divider(height: 1),
            ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _processPayment(bill['id']),
                icon: const Icon(Icons.payment),
                label: const Text("Bayar Sekarang"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

