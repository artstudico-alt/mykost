import 'package:flutter/material.dart';
import '../../utils/colors.dart';

class NotificationScreen extends StatelessWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          "Notifikasi",
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: _buildNotificationList(),
    );
  }

  Widget _buildNotificationList() {
    // Dummy Data Notifikasi
    final notifications = [
      {
        "title": "Booking Berhasil",
        "message": "Booking Anda untuk Kost Gg. Melati Indah telah dikonfirmasi.",
        "time": "Baru saja",
        "icon": Icons.check_circle_outline,
        "color": Colors.green,
        "isRead": false,
      },
      {
        "title": "Promo Spesial",
        "message": "Dapatkan potongan harga 10% untuk pembayaran sewa 6 bulan kedepan!",
        "time": "2 jam lalu",
        "icon": Icons.local_offer_outlined,
        "color": Colors.orange,
        "isRead": false,
      },
      {
        "title": "Pembayaran Jatuh Tempo",
        "message": "Jangan lupa membayar tagihan sewa bulan ini maksimal tanggal 10.",
        "time": "1 hari lalu",
        "icon": Icons.payment,
        "color": Colors.red,
        "isRead": true,
      },
      {
        "title": "Selamat Datang!",
        "message": "Terima kasih telah bergabung di MyKost. Cari kos impianmu sekarang!",
        "time": "3 hari lalu",
        "icon": Icons.celebration_outlined,
        "color": AppColors.primary,
        "isRead": true,
      },
    ];

    if (notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.notifications_off_outlined, size: 60, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              "Belum ada Notifikasi",
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: notifications.length,
      itemBuilder: (context, index) {
        final notif = notifications[index];
        final bool isRead = notif['isRead'] as bool;

        return Container(
          color: isRead ? Colors.transparent : Colors.blue.withOpacity(0.05),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            leading: CircleAvatar(
              backgroundColor: (notif['color'] as Color).withOpacity(0.1),
              child: Icon(notif['icon'] as IconData, color: notif['color'] as Color),
            ),
            title: Text(
              notif['title'] as String,
              style: TextStyle(
                fontWeight: isRead ? FontWeight.w500 : FontWeight.bold,
                fontSize: 16,
                color: AppColors.textPrimary,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 6),
                Text(
                  notif['message'] as String,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  notif['time'] as String,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
            onTap: () {
              // Aksi saat notifikasi diklik
            },
          ),
        );
      },
    );
  }
}
