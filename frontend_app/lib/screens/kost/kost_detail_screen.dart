import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../utils/colors.dart';
import '../../widgets/custom_button.dart';
import '../../api/api_service.dart';
import '../complaint/complaint_screen.dart';
import 'rental_application_screen.dart';

class KostDetailScreen extends StatefulWidget {
  final Map<String, dynamic> kost;

  const KostDetailScreen({super.key, required this.kost});

  @override
  State<KostDetailScreen> createState() => _KostDetailScreenState();
}

class _KostDetailScreenState extends State<KostDetailScreen> {
  bool _isTenant = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkRentalStatus();
  }

  Future<void> _checkRentalStatus() async {
    try {
      if (ApiService.token == null) {
        setState(() => _isLoading = false);
        return;
      }

      final response = await ApiService.getHunianSaya();
      if (response != null && response['data'] != null) {
        final activeHunian = response['data'];
        final currentKostId = widget.kost['id'] ?? widget.kost['kost_id'];
        
        if (activeHunian['kost_id'].toString() == currentKostId.toString()) {
          setState(() {
            _isTenant = true;
          });
        }
      }
    } catch (e) {
      debugPrint("Error checking rental status: $e");
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.kost['title'] ?? widget.kost['nama_kost'] ?? "Detail Kost";
    final price = widget.kost['price'] ?? "Rp ${widget.kost['harga_per_bulan'] ?? '...'}";
    final location = widget.kost['location'] ?? "Lokasi tidak diketahui";
    final type = widget.kost['type'] ?? "Campur";
    final ownerName = widget.kost['ownerName'] ?? widget.kost['pemilik'] ?? "Nama Pemilik Kost";

    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: AppColors.primary,
            iconTheme: const IconThemeData(color: Colors.white),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    color: Colors.grey.shade300,
                    child: const Icon(Icons.maps_home_work, size: 100, color: Colors.grey),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withOpacity(0.4),
                          Colors.transparent,
                          Colors.black.withOpacity(0.4),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        type,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: 80,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: 4,
                      itemBuilder: (context, index) {
                        return Container(
                          width: 100,
                          margin: const EdgeInsets.only(right: 12),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(12),
                            image: const DecorationImage(
                              image: NetworkImage('https://picsum.photos/300/200'),
                              fit: BoxFit.cover,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.share_outlined, color: AppColors.primary),
                            onPressed: () => _showShareOptions(context),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: AppColors.textSecondary, size: 16),
                      const SizedBox(width: 4),
                      Text(location, style: const TextStyle(color: AppColors.textSecondary)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    "Harga",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "$price / bulan",
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.square_foot, color: AppColors.textSecondary, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        "Luas Kamar: ${widget.kost['room_size'] ?? widget.kost['luas_kamar'] ?? '3x4 meter'}",
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),
                  const Text(
                    "Fasilitas",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _buildFacility(Icons.wifi, "WiFi"),
                      _buildFacility(Icons.ac_unit, "AC"),
                      _buildFacility(Icons.bed, "Kasur"),
                      _buildFacility(Icons.bathtub_outlined, "K.Mandi Dalam"),
                      _buildFacility(Icons.kitchen_outlined, "Dapur Bersama"),
                      _buildFacility(Icons.local_parking_outlined, "Parkir Motor"),
                    ],
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    "Deskripsi",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "Kost bebas jam malam yang strategis di pusat kota. Akses mudah ke stasiun, halte bus, dan perkantoran. Fasilitas lengkap tinggal bawa koper.",
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    "Pemilik Kost",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 24,
                        backgroundImage: NetworkImage('https://i.pravatar.cc/150?img=12'),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          ownerName,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  _buildMapSection(),
                  const SizedBox(height: 32),
                  _buildAccessibilitySection(),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : CustomButton(
                      title: _isTenant ? "Ajukan Keluhan" : "Ajukan Sewa",
                      onPressed: () {
                        if (_isTenant) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const ComplaintScreen(),
                            ),
                          );
                        } else {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => RentalApplicationScreen(kost: widget.kost),
                            ),
                          );
                        }
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFacility(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface, // Background minimal
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200), // Outline tipis
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppColors.textSecondary, size: 20),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccessibilitySection() {
    // Sample accessibility data - akan diganti dengan data dari backend
    final List<Map<String, dynamic>> accessibilityData = [
      {
        'type': 'Akses Transportasi',
        'icon': Icons.directions_bus,
        'items': [
          {'name': 'Halte Bus', 'distance': '200 meter'},
          {'name': 'Stasiun Kereta', 'distance': '500 meter'},
          {'name': 'Terminal Bus', 'distance': '1.2 km'},
        ],
      },
      {
        'type': 'Sekolah & Universitas',
        'icon': Icons.school,
        'items': [
          {'name': 'SDN 01 Menteng', 'distance': '300 meter'},
          {'name': 'SMA Negeri 5', 'distance': '800 meter'},
          {'name': 'Universitas Indonesia', 'distance': '2.5 km'},
        ],
      },
      {
        'type': 'Pusat Belanja',
        'icon': Icons.shopping_cart,
        'items': [
          {'name': 'Mini Market', 'distance': '150 meter'},
          {'name': 'Supermarket', 'distance': '400 meter'},
          {'name': 'Mall Grand Indonesia', 'distance': '1.8 km'},
        ],
      },
      {
        'type': 'Fasilitas Kesehatan',
        'icon': Icons.local_hospital,
        'items': [
          {'name': 'Klinik 24 Jam', 'distance': '350 meter'},
          {'name': 'Rumah Sakit', 'distance': '1.5 km'},
          {'name': 'Apotek', 'distance': '250 meter'},
        ],
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        const Text(
          "Aksesibilitas & Radius",
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          "Jarak dari lokasi kost ke berbagai fasilitas penting",
          style: TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary.withOpacity(0.8),
          ),
        ),
        const SizedBox(height: 20),

        // Modern Accessibility Grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 12,
            childAspectRatio: 0.85,
          ),
          itemCount: accessibilityData.length,
          itemBuilder: (context, index) {
            final category = accessibilityData[index];
            return InkWell(
              onTap: () => _showAccessibilityDetailModal(category),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.grey.shade50),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Icon Circle
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.08),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          category['icon'],
                          color: AppColors.primary,
                          size: 20,
                        ),
                      ),
                      const SizedBox(height: 12),
                      
                      // Category Title
                      Text(
                        category['type'],
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      
                      // Items List
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: category['items'].take(3).map<Widget>((item) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                children: [
                                  Container(
                                    width: 4,
                                    height: 4,
                                    decoration: const BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      item['name'],
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary,
                                        fontWeight: FontWeight.w500,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Flexible(
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 1,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _getModernDistanceColor(item['distance']),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        _formatDistance(item['distance']),
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w600,
                                          color: _getModernDistanceTextColor(item['distance']),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  void _showAccessibilityDetailModal(Map<String, dynamic> category) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.8,
        minChildSize: 0.4,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SingleChildScrollView(
            controller: scrollController,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Handle bar
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  
                  // Header with Icon
                  Row(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          category['icon'],
                          color: AppColors.primary,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              category['type'],
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              "${category['items'].length} lokasi terdekat",
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // Description
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.secondary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Informasi Penting",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _getCategoryDescription(category['type']),
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Detailed List
                  const Text(
                    "Daftar Lokasi",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  ...category['items'].map<Widget>((item) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade100),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          // Location Icon
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: _getModernDistanceColor(item['distance']),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.place,
                              color: _getModernDistanceTextColor(item['distance']),
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 16),
                          
                          // Location Info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        item['name'],
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _getModernDistanceColor(item['distance']),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        item['distance'],
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: _getModernDistanceTextColor(item['distance']),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 4,
                                  children: [
                                    _buildTransportOption(
                                      Icons.directions_walk,
                                      _getWalkingTime(item['distance']),
                                    ),
                                    _buildTransportOption(
                                      Icons.motorcycle,
                                      _getMotorcycleTime(item['distance']),
                                    ),
                                    _buildTransportOption(
                                      Icons.directions_car,
                                      _getCarTime(item['distance']),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  
                  const SizedBox(height: 32),
                  
                  // Action Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        "Tutup",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _getCategoryDescription(String categoryType) {
    switch (categoryType) {
      case 'Akses Transportasi':
        return "Akses transportasi umum yang mudah dari lokasi kost, memudahkan mobilitas sehari-hari.";
      case 'Sekolah & Universitas':
        return "Berbagai institusi pendidikan terdekat, cocok untuk pelajar dan mahasiswa.";
      case 'Pusat Belanja':
        return "Fasilitas perbelanjaan lengkap untuk memenuhi kebutuhan sehari-hari.";
      case 'Fasilitas Kesehatan':
        return "Layanan kesehatan terdekat untuk keadaan darurat dan rutin.";
      default:
        return "Fasilitas penting lainnya yang dekat dengan lokasi kost.";
    }
  }

  Widget _buildTransportOption(IconData icon, String time) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 11,
            color: AppColors.textSecondary,
          ),
          const SizedBox(width: 2),
          Text(
            time,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _getWalkingTime(String distance) {
    if (distance.contains('meter')) {
      final meterValue = int.tryParse(distance.split(' ')[0]) ?? 0;
      final minutes = (meterValue / 80).round(); // Average walking speed 80m/min
      return "$minutes menit";
    } else {
      final kmValue = double.tryParse(distance.split(' ')[0]) ?? 0;
      final minutes = (kmValue * 12.5).round(); // Average walking speed 12.5 min/km
      return "$minutes menit";
    }
  }

  String _getMotorcycleTime(String distance) {
    if (distance.contains('meter')) {
      final meterValue = int.tryParse(distance.split(' ')[0]) ?? 0;
      final minutes = (meterValue / 300).round(); // Average motorcycle speed 300m/min (18km/h)
      if (minutes == 0) return "<1 menit";
      return "$minutes menit";
    } else {
      final kmValue = double.tryParse(distance.split(' ')[0]) ?? 0;
      final minutes = (kmValue * 3.33).round(); // Average motorcycle speed 18km/h
      if (minutes == 0) return "<1 menit";
      return "$minutes menit";
    }
  }

  String _getCarTime(String distance) {
    if (distance.contains('meter')) {
      final meterValue = int.tryParse(distance.split(' ')[0]) ?? 0;
      final minutes = (meterValue / 417).round(); // Average car speed 417m/min (25km/h)
      if (minutes == 0) return "<1 menit";
      return "$minutes menit";
    } else {
      final kmValue = double.tryParse(distance.split(' ')[0]) ?? 0;
      final minutes = (kmValue * 2.4).round(); // Average car speed 25km/h
      if (minutes == 0) return "<1 menit";
      return "$minutes menit";
    }
  }

  String _formatDistance(String distance) {
    if (distance.contains('meter')) {
      final meterValue = int.tryParse(distance.split(' ')[0]) ?? 0;
      return '${meterValue}m';
    } else {
      final kmValue = double.tryParse(distance.split(' ')[0]) ?? 0;
      return '${kmValue}km';
    }
  }

  Color _getModernDistanceColor(String distance) {
    if (distance.contains('meter')) {
      final meterValue = int.tryParse(distance.split(' ')[0]) ?? 0;
      if (meterValue <= 200) return Colors.green.shade100;
      if (meterValue <= 500) return Colors.orange.shade100;
      return Colors.red.shade100;
    } else {
      final kmValue = double.tryParse(distance.split(' ')[0]) ?? 0;
      if (kmValue <= 1.0) return Colors.green.shade100;
      if (kmValue <= 2.0) return Colors.orange.shade100;
      return Colors.red.shade100;
    }
  }

  Color _getModernDistanceTextColor(String distance) {
    if (distance.contains('meter')) {
      final meterValue = int.tryParse(distance.split(' ')[0]) ?? 0;
      if (meterValue <= 200) return Colors.green.shade700;
      if (meterValue <= 500) return Colors.orange.shade700;
      return Colors.red.shade700;
    } else {
      final kmValue = double.tryParse(distance.split(' ')[0]) ?? 0;
      if (kmValue <= 1.0) return Colors.green.shade700;
      if (kmValue <= 2.0) return Colors.orange.shade700;
      return Colors.red.shade700;
    }
  }

  // ── Map Section ───────────────────────────────────────────────────────────
  Widget _buildMapSection() {
    // Baca koordinat dari berbagai kemungkinan field name backend
    final dynamic rawLat = widget.kost['latitude'] ?? widget.kost['lat'];
    final dynamic rawLng =
        widget.kost['longitude'] ?? widget.kost['lng'] ?? widget.kost['long'];
    final String locationName = widget.kost['location'] ??
        widget.kost['alamat'] ??
        widget.kost['nama_kost'] ??
        '';

    final double? lat =
        rawLat != null ? double.tryParse(rawLat.toString()) : null;
    final double? lng =
        rawLng != null ? double.tryParse(rawLng.toString()) : null;
    final bool hasCoords = lat != null && lng != null;

    // URL Google Maps yang dibuka saat diklik
    final String mapsUrl = hasCoords
        ? 'https://www.google.com/maps/search/?api=1&query=$lat,$lng'
        : 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(locationName)}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Header row ────────────────────────────────────────────────────
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Lokasi di Peta',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            GestureDetector(
              onTap: () => _launchURL(mapsUrl),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.open_in_new_rounded,
                        color: AppColors.primary, size: 14),
                    SizedBox(width: 4),
                    Text(
                      'Buka Maps',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // ── Peta preview ──────────────────────────────────────────────────
        GestureDetector(
          onTap: () => _launchURL(mapsUrl),
          child: Container(
            height: 200,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFFE8EAE6),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                children: [
                  // Grid pattern ala maps
                  CustomPaint(
                    size: const Size(double.infinity, 200),
                    painter: _MapPatternPainter(),
                    child: const SizedBox.expand(),
                  ),

                  // Pin dan label koordinat
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.18),
                                blurRadius: 14,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.location_on_rounded,
                              color: Colors.red, size: 32),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.08),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                          child: Text(
                            hasCoords
                                ? '${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}'
                                : locationName.isNotEmpty
                                    ? locationName
                                    : 'Lokasi tidak tersedia',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Hint tap
                  Positioned(
                    bottom: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.06),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.touch_app_rounded,
                              size: 12, color: AppColors.textSecondary),
                          SizedBox(width: 4),
                          Text(
                            'Ketuk untuk buka Google Maps',
                            style: TextStyle(
                                fontSize: 10, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _showShareOptions(BuildContext context) {

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 48), // Padding lebih besar agar box tinggi
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                "Bagikan ke",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _shareIcon(Icons.chat_bubble, "WhatsApp", Colors.green, () => _launchURL("https://wa.me/?text=Coba+cek+kos+ini+di+MyKost")),
                  _shareIcon(Icons.camera_alt, "Instagram", Colors.purple, () => _launchURL("https://instagram.com/")),
                  _shareIcon(Icons.facebook, "Facebook", Colors.blue, () => _launchURL("https://www.facebook.com/sharer/sharer.php?u=https://mykost.com")),
                  _shareIcon(Icons.music_note, "TikTok", Colors.black, () => _launchURL("https://tiktok.com/")),
                  _shareIcon(Icons.link, "Salin Link", Colors.grey, () {
                    Clipboard.setData(const ClipboardData(text: "https://mykost.com/kos-detail"));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Link berhasil disalin!")));
                    Navigator.pop(context);
                  }),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Future<void> _launchURL(String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      debugPrint("Gagal membuka $urlString");
    }
  }

  Widget _shareIcon(IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: color.withOpacity(0.1),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}

/// Paints a simple map-style grid pattern as background for the map preview.
class _MapPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Background
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = const Color(0xFFE8EAE6),
    );

    final roadPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke;

    final roadPaintMinor = Paint()
      ..color = const Color(0xFFF5F5F0)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    // Horizontal major roads
    for (double y = 30; y < size.height; y += 50) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), roadPaint);
    }
    // Vertical major roads
    for (double x = 40; x < size.width; x += 60) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), roadPaint);
    }
    // Minor grid lines
    for (double y = 55; y < size.height; y += 50) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), roadPaintMinor);
    }
    for (double x = 70; x < size.width; x += 60) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), roadPaintMinor);
    }

    // Green patches (parks)
    final parkPaint = Paint()..color = const Color(0xFFCEE6B4);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(10, 10, 55, 35),
        const Radius.circular(4),
      ),
      parkPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(size.width - 90, size.height - 60, 80, 45),
        const Radius.circular(4),
      ),
      parkPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}
