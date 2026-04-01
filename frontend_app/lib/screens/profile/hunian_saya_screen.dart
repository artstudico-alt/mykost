import 'package:flutter/material.dart';
import 'package:frontend_app/utils/colors.dart';
import 'package:frontend_app/api/api_service.dart';
import 'package:intl/intl.dart';
import 'package:frontend_app/screens/complaint/complaint_screen.dart';

class HunianSayaScreen extends StatefulWidget {
  const HunianSayaScreen({super.key});

  @override
  State<HunianSayaScreen> createState() => _HunianSayaScreenState();
}

class _HunianSayaScreenState extends State<HunianSayaScreen> {
  List<dynamic> _rentals = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    setState(() => _isLoading = true);
    final Map<int, dynamic> mergedRentals = {};

    try {
      // 1. Prioritaskan data Hunian Resmi (data yang sudah diverifikasi)
      try {
        final resHunian = await ApiService.getHunianSaya();
        if (resHunian != null && resHunian['data'] != null) {
          final h = resHunian['data'];
          final id = h['id'] ?? (h['booking']?['id']) ?? 0;
          if (id != 0) {
            // Tandai sebagai hunian resmi
            h['is_hunian_resmi'] = true;
            mergedRentals[id] = h;
          }
        }
      } catch (e) {
        debugPrint("Stage 1 (Hunian) Error: $e");
      }

      // 2. Ambil data Booking dengan status aktif/pending
      try {
        final resBooking = await ApiService.getBooking();
        final List<dynamic> bookings = resBooking?['data'] ?? [];
        for (var b in bookings) {
          // Hanya ambil booking yang relevan (aktif, pending, confirmed)
          final status = b['status']?.toLowerCase() ?? '';
          if (['aktif', 'pending', 'confirmed'].contains(status)) {
            final id = b['id'] ?? 0;
            if (id != 0 && !mergedRentals.containsKey(id)) {
              b['is_hunian_resmi'] = false;
              mergedRentals[id] = b;
            }
          }
        }
      } catch (e) {
        debugPrint("Stage 2 (Booking) Error: $e");
      }

      // 3. Fallback ke Pembayaran yang berhasil (untuk jaga-jaga)
      try {
        final resPay = await ApiService.getPembayaran();
        final List<dynamic> payments = resPay?['data'] ?? [];
        for (var p in payments) {
          final status = p['status']?.toLowerCase() ?? '';
          if (['settlement', 'capture', 'success', 'berhasil'].contains(status)) {
            final b = p['booking'];
            if (b != null) {
              final id = b['id'] ?? 0;
              if (id != 0 && !mergedRentals.containsKey(id)) {
                b['is_hunian_resmi'] = false;
                b['payment_info'] = p; // Simpan info pembayaran
                mergedRentals[id] = b;
              }
            }
          }
        }
      } catch (e) {
        debugPrint("Stage 3 (Payment) Error: $e");
      }

      final resultList = mergedRentals.values.toList();
      
      // Urutkan berdasarkan prioritas: Hunian Resmi > Aktif > Pending > Confirmed
      resultList.sort((a, b) {
        final aIsHunian = a['is_hunian_resmi'] ?? false;
        final bIsHunian = b['is_hunian_resmi'] ?? false;
        
        // Prioritaskan hunian resmi
        if (aIsHunian != bIsHunian) {
          return bIsHunian ? 1 : -1;
        }
        
        // Lalu urutkan berdasarkan status
        final sA = _getStatus(a).toLowerCase();
        final sB = _getStatus(b).toLowerCase();
        
        int priority(String s) {
          if (s == 'aktif') return 0;
          if (s == 'confirmed') return 1;
          if (s == 'pending') return 2;
          return 3;
        }
        
        int pA = priority(sA);
        int pB = priority(sB);
        if (pA != pB) return pA.compareTo(pB);
        
        // Terakhir urutkan berdasarkan ID terbaru
        final idA = a['id'] ?? 0;
        final idB = b['id'] ?? 0;
        return idB.compareTo(idA);
      });

      setState(() {
        _rentals = resultList;
        _isLoading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  String _getStatus(dynamic item) {
    if (item.containsKey('booking')) {
      return item['booking']['status'] ?? 'aktif';
    }
    return item['status'] ?? 'aktif';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text(
          'Hunian Saya',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? _buildError()
              : _rentals.isEmpty
                  ? _buildEmpty()
                  : RefreshIndicator(
                      onRefresh: _loadAllData,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _rentals.length,
                        itemBuilder: (context, index) => _rentalCard(_rentals[index]),
                      ),
                    ),
    );
  }

  Widget _rentalCard(dynamic item) {
    final bool isHunian = item.containsKey('booking') && item['booking'] != null;
    final bool isHunianResmi = item['is_hunian_resmi'] ?? false;
    final kost = item['kost'] ?? (isHunian ? item['booking']['kost'] : {}) ?? {};
    final booking = isHunian ? item['booking'] : item;

    final String kostName = kost['nama_kost'] ?? booking['kost_name'] ?? item['kost_name'] ?? 'Nama Kost';
    final String address = kost['alamat'] ?? booking['alamat'] ?? 'Alamat tidak tersedia';
    final String status = booking['status'] ?? 'aktif';
    final String imageUrl = kost['foto_utama'] ?? booking['image'] ?? '';
    final String rawStartDate = booking['tanggal_mulai'] ?? item['tanggal_masuk'] ?? '';
    final String rawEndDate = booking['tanggal_selesai'] ?? item['tanggal_keluar'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: Stack(
              children: [
                imageUrl.isNotEmpty
                    ? Image.network(
                        imageUrl,
                        height: 150,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _placeholderImage(),
                      )
                    : _placeholderImage(),
                Positioned(
                  top: 12,
                  right: 12,
                  child: _statusBadge(status, isHunianResmi: isHunianResmi),
                ),
                if (isHunianResmi)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.purple.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.purple.withOpacity(0.3)),
                      ),
                      child: const Text(
                        'Terverifikasi',
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.purple),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  kostName,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on_rounded, size: 14, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        address,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Periode Sewa', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        const SizedBox(height: 2),
                        Text(
                          '${_formatDate(rawStartDate)} - ${_formatDate(rawEndDate)}',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: () => _showDetail(item),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Detail', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showDetail(dynamic item) {
    // Navigasi ke detail atau update internal state untuk menunjukkan detail view
    // Untuk saat ini, kita bisa navigasi ke screen khusus atau dialog
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SingleChildScrollView(
            controller: controller,
            child: _buildDetailContent(item),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailContent(dynamic item) {
    // Menggunakan logic _buildContent yg lama tapi dipindahkan ke sini
    final bool isHunian = item.containsKey('booking') && item['booking'] != null;
    final kost = item['kost'] ?? (isHunian ? item['booking']['kost'] : {}) ?? {};
    final booking = isHunian ? item['booking'] : item;

    final String kostName = kost['nama_kost'] ?? booking['kost_name'] ?? item['kost_name'] ?? 'Nama Kost';
    final String address = kost['alamat'] ?? booking['alamat'] ?? 'Alamat tidak tersedia';
    final String rawStartDate = booking['tanggal_mulai'] ?? item['tanggal_masuk'] ?? '';
    final String rawEndDate = booking['tanggal_selesai'] ?? item['tanggal_keluar'] ?? '';
    final dynamic rawPrice = kost['harga_min'] ?? booking['total_harga'] ?? 0;
    final String status = booking['status'] ?? 'aktif';

    return Column(
      children: [
        Container(
          margin: const EdgeInsets.all(20),
          width: 40,
          height: 4,
          decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(kostName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _statusBadge(status),
              const SizedBox(height: 24),
              _infoRow(Icons.location_on_rounded, 'Alamat', address),
              const SizedBox(height: 16),
              _infoRow(Icons.calendar_today_rounded, 'Mulai', _formatDate(rawStartDate)),
              const SizedBox(height: 16),
              _infoRow(Icons.event_rounded, 'Berakhir', _formatDate(rawEndDate)),
              const SizedBox(height: 16),
              _infoRow(Icons.payments_outlined, 'Biaya', _formatCurrency(num.tryParse(rawPrice.toString()) ?? 0)),
              const SizedBox(height: 32),
              _buildDurationCard(rawStartDate, rawEndDate),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ComplaintScreen(
                          kostId: kost['id'] ?? item['kost_id'],
                          kostName: kostName,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.report_problem_outlined),
                  label: const Text('Ajukan Keluhan', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.redAccent,
                    side: const BorderSide(color: Colors.redAccent),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ],
    );
  }

  // ... (Sisanya: _buildEmpty, _buildError, _formatCurrency, _formatDate, _placeholderImage, _statusBadge, _infoRow, _buildDurationCard tetap sama atau sedikit disesuaikan)
  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100, height: 100,
              decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.08), shape: BoxShape.circle),
              child: const Icon(Icons.home_work_outlined, size: 48, color: AppColors.primary),
            ),
            const SizedBox(height: 24),
            const Text('Belum ada hunian aktif', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            const Text('Kamu belum memiliki hunian yang aktif saat ini.\nMulai cari kost yang sesuai!', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5)),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
              child: const Text('Cari Kost'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
          const SizedBox(height: 16),
          Text(_error ?? 'Gagal memuat data'),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: _loadAllData, child: const Text('Coba Lagi')),
        ],
      ),
    );
  }

  String _formatCurrency(num amount) => NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(amount);
  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return "-";
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy', 'id_ID').format(date);
    } catch (_) { return dateStr; }
  }

  Widget _placeholderImage() => Container(height: 150, width: double.infinity, color: AppColors.surface, child: const Icon(Icons.home_work_outlined, size: 56, color: AppColors.primary));

  Widget _statusBadge(String status, {bool isHunianResmi = false}) {
    final s = status.toLowerCase();
    Color color = Colors.orange;
    String label = status;
    
    if (isHunianResmi) {
      color = Colors.green;
      label = 'Aktif';
    } else if (s == 'aktif' || s == 'active') {
      color = Colors.green;
      label = 'Aktif';
    } else if (s == 'confirmed') {
      color = Colors.blue;
      label = 'Confirmed';
    } else if (s == 'pending') {
      color = Colors.orange;
      label = 'Pending';
    } else if (s == 'selesai' || s == 'tidak aktif') {
      color = Colors.grey;
      label = 'Selesai';
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          ],
        ),
      ],
    );
  }

  Widget _buildDurationCard(String startDate, String endDate) {
    double progress = 0.5;
    try {
      final start = DateTime.parse(startDate);
      final end = DateTime.parse(endDate);
      final now = DateTime.now();
      progress = (now.difference(start).inDays / end.difference(start).inDays).clamp(0.0, 1.0);
    } catch (_) {}
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Progres Sewa', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        LinearProgressIndicator(value: progress, backgroundColor: Colors.grey.shade200, valueColor: const AlwaysStoppedAnimation(AppColors.primary)),
      ],
    );
  }
}
