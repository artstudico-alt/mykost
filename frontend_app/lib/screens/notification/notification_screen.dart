import 'package:flutter/material.dart';
import '../../utils/colors.dart';
import '../../api/api_service.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _notifications = [];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    if (ApiService.token == null) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final List<Map<String, dynamic>> loadedNotifs = [];
      final now = DateTime.now();

      // 1. Ambil data User (Notif Selamat Datang)
      try {
        final userResponse = await ApiService.me();
        if (userResponse != null && userResponse['user'] != null) {
          final userName = userResponse['user']['name'] ?? 'Pengguna';
          loadedNotifs.add({
            "title": "Selamat Datang!",
            "message": "Halo $userName, terima kasih telah login di MyKost. Cari kos impianmu sekarang!",
            "time": "Tersimpan",
            "icon": Icons.celebration_outlined,
            "color": AppColors.primary,
            "isRead": true,
            "timestamp": now.subtract(const Duration(days: 365)).millisecondsSinceEpoch, 
          });
        }
      } catch (e) {
        debugPrint("Generate Notif Welcome: $e");
      }

      // 2. Ambil data Hunian (Notif Booking & Pengingat Masa Sewa)
      try {
        final hunianResponse = await ApiService.getHunianSaya();
        if (hunianResponse != null && hunianResponse['data'] != null) {
          final hunian = hunianResponse['data'];
          final kost = hunian['kost'] ?? {};
          final booking = hunian['booking'] ?? hunian ?? {};
          
          final kostName = kost['name'] ?? booking['kost_name'] ?? 'Kost';
          final startDateStr = booking['start_date'] ?? booking['tanggal_mulai'];
          final endDateStr = booking['end_date'] ?? booking['tanggal_selesai'];

           // Notif Booking Berhasil
           if (startDateStr != null) {
             final startDate = DateTime.tryParse(startDateStr) ?? now;
             loadedNotifs.add({
               "title": "Booking Berhasil",
               "message": "Booking untuk $kostName telah dikonfirmasi dan aktif.",
               "time": "Sistem",
               "icon": Icons.check_circle_outline,
               "color": Colors.green,
               "isRead": false,
               "timestamp": startDate.millisecondsSinceEpoch,
             });
           }

           // Notif Pengingat Masa Sewa
           if (endDateStr != null) {
             try {
               final endDate = DateTime.parse(endDateStr);
               final difference = endDate.difference(now).inDays;

               // Muncul jika kurang dari atau sama dengan 7 hari, dan belum expired
               if (difference >= 0 && difference <= 7) {
                 loadedNotifs.add({
                   "title": "Masa Sewa Hampir Habis",
                   "message": "Sewa di $kostName akan habis dalam $difference hari. Segera perpanjang!",
                   "time": "Penting",
                   "icon": Icons.warning_amber_rounded,
                   "color": Colors.orange,
                   "isRead": false,
                   "timestamp": now.millisecondsSinceEpoch + 1000, 
                 });
               }
             } catch (e) {
               debugPrint("Error date parsing notif: $e");
             }
           }
        }
      } catch (e) {
        debugPrint("Generate Notif Hunian: $e");
      }

      // Urutkan berdasarkan timestamp (terbaru di atas)
      loadedNotifs.sort((a, b) {
        final tA = a['timestamp'] as int;
        final tB = b['timestamp'] as int;
        return tB.compareTo(tA);
      });

      if (mounted) {
        setState(() {
          _notifications = loadedNotifs;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
      debugPrint("Gagal load notifikasi: $e");
    }
  }

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
        actions: [
          if (!_isLoading) 
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
              onPressed: () {
                setState(() => _isLoading = true);
                _loadNotifications();
              },
            ),
        ],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _buildNotificationList(),
    );
  }

  Widget _buildNotificationList() {
    if (ApiService.token == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.person_off_outlined, size: 60, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              "Silakan login",
              style: TextStyle(fontSize: 18, color: Colors.grey, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      );
    }

    if (_notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.notifications_off_outlined, size: 60, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              "Belum ada Notifikasi",
              style: TextStyle(fontSize: 18, color: Colors.grey, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadNotifications,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: _notifications.length,
        itemBuilder: (context, index) {
          final notif = _notifications[index];
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
                // Bisa diarahkan ke screen relevan 
                // misal ke HunianSayaScreen jika notif tentang kost
              },
            ),
          );
        },
      ),
    );
  }
}
