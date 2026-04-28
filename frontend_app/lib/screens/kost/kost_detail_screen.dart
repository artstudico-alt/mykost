import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:frontend_app/utils/colors.dart';
import 'package:frontend_app/widgets/custom_button.dart';
import 'package:frontend_app/api/api_service.dart';
import 'package:frontend_app/screens/complaint/complaint_screen.dart';
import 'package:frontend_app/screens/kost/rental_application_screen.dart';

class KostDetailScreen extends StatefulWidget {
  final Map<String, dynamic> kost;

  const KostDetailScreen({super.key, required this.kost});

  @override
  State<KostDetailScreen> createState() => _KostDetailScreenState();
}

class _KostDetailScreenState extends State<KostDetailScreen> {
  bool _isTenant = false;
  bool _isLoading = true;
  int _selectedImageIndex = 0;
  
  // List of all images for the kost
  List<String> get _allImages {
    final List<String> images = [];
    
    // Add main image first
    final mainImage = widget.kost['foto_utama'] ?? widget.kost['foto'] ?? widget.kost['thumbnail'];
    if (mainImage != null && mainImage.toString().isNotEmpty) {
      images.add(_getFullImageUrl(mainImage.toString()));
    }
    
    // Add gallery images if available
    final gallery = widget.kost['foto_galeri'] ?? widget.kost['gallery'] ?? widget.kost['images'];
    if (gallery is List) {
      for (var img in gallery) {
        if (img is String && img.isNotEmpty) {
          images.add(_getFullImageUrl(img));
        } else if (img is Map && img['url'] != null) {
          images.add(_getFullImageUrl(img['url'].toString()));
        }
      }
    }
    
    // Fallback to placeholder if no images
    if (images.isEmpty) {
      images.add('https://via.placeholder.com/800x600?text=No+Image');
    }
    
    return images;
  }
  
  // Get full image URL using ApiService helper
  String _getFullImageUrl(String url) {
    return ApiService.getFullImageUrl(url);
  }

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
    final title = widget.kost['nama_kost'] ?? "Detail Kost";
    final price = "Rp ${widget.kost['harga_min'] ?? '...'}";
    final location = "${widget.kost['kecamatan'] ?? ''}, ${widget.kost['kota'] ?? ''}";
    final type = (widget.kost['tipe'] ?? "CAMPUR").toString().toUpperCase();
    
    // Safe owner name extraction
    String ownerName = "Pemilik Kost";
    final dynamic rawUser = widget.kost['user'];
    if (rawUser is Map) {
      final dynamic rawName = rawUser['name'];
      if (rawName is String) {
        ownerName = rawName;
      }
    }
    
    // Get current main image based on selection
    final mainImage = _allImages.isNotEmpty ? _allImages[_selectedImageIndex] : 'https://via.placeholder.com/800x600?text=No+Image';

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
                  Image.network(
                    mainImage,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: Colors.grey.shade300,
                      child: const Icon(Icons.maps_home_work, size: 100, color: Colors.grey),
                    ),
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
                  // Thumbnail Gallery
                  SizedBox(
                    height: 80,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _allImages.length,
                      itemBuilder: (context, index) {
                        final isSelected = index == _selectedImageIndex;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedImageIndex = index;
                            });
                          },
                          child: Container(
                            width: 100,
                            margin: const EdgeInsets.only(right: 12),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: isSelected 
                                ? Border.all(color: AppColors.primary, width: 3)
                                : null,
                              boxShadow: isSelected
                                ? [BoxShadow(
                                    color: AppColors.primary.withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  )]
                                : null,
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                _allImages[index],
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  color: Colors.grey.shade300,
                                  child: const Icon(Icons.image_not_supported, color: Colors.grey),
                                ),
                              ),
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
                    children: (widget.kost['fasilitas_umum'] as List? ?? ["Bebas Jam Malam", "Aman", "Strategis"]).map((f) {
                      return _buildFacility(Icons.check_circle_outline, f.toString());
                    }).toList(),
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
                  Text(
                    widget.kost['deskripsi'] ?? "Kost strategis dengan fasilitas lengkap, aman, dan nyaman untuk hunian Anda.",
                    style: const TextStyle(
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
                              builder: (context) => ComplaintScreen(
                                kostId: widget.kost['id'] ?? widget.kost['kost_id'],
                                kostName: widget.kost['nama_kost'] ?? "Detail Kost",
                              ),
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
    // Calculate distance to office from kost coordinates
    final officeLat = widget.kost['office_lat'] ?? -6.5946; // Default Bogor office
    final officeLng = widget.kost['office_lng'] ?? 106.7892;
    final kostLat = widget.kost['latitude'] ?? widget.kost['lat'];
    final kostLng = widget.kost['longitude'] ?? widget.kost['lng'] ?? widget.kost['long'];
    
    double distanceKm = 0;
    if (kostLat != null && kostLng != null) {
      distanceKm = _calculateDistance(
        double.tryParse(kostLat.toString()) ?? 0,
        double.tryParse(kostLng.toString()) ?? 0,
        officeLat,
        officeLng,
      );
    }
    
    // Calculate walking and motorbike times
    final walkingMinutes = (distanceKm * 12.5).round(); // 12.5 min per km walking
    final motorbikeMinutes = (distanceKm * 3.33).round(); // 3.33 min per km motorbike
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Jarak ke Kantor",
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          "Estimasi waktu tempuh dari kost ke kantor",
          style: TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary.withOpacity(0.8),
          ),
        ),
        const SizedBox(height: 16),
        
        // Distance Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade100),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              // Distance Display
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.location_on, color: AppColors.primary, size: 24),
                  const SizedBox(width: 8),
                  Text(
                    distanceKm > 0 ? '${distanceKm.toStringAsFixed(1)} km' : 'Jarak tidak tersedia',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(height: 1),
              const SizedBox(height: 20),
              
              // Transport Options
              Row(
                children: [
                  // Walking
                  Expanded(
                    child: _buildTransportTimeCard(
                      icon: Icons.directions_walk,
                      label: 'Jalan Kaki',
                      time: distanceKm > 0 ? '$walkingMinutes menit' : '-',
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Motorbike
                  Expanded(
                    child: _buildTransportTimeCard(
                      icon: Icons.motorcycle,
                      label: 'Motor',
                      time: distanceKm > 0 ? '$motorbikeMinutes menit' : '-',
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double earthRadius = 6371; // km
    final double dLat = _degreesToRadians(lat2 - lat1);
    final double dLon = _degreesToRadians(lon2 - lon1);
    final double a = 
      (math.sin(dLat / 2) * math.sin(dLat / 2)) +
      math.cos(_degreesToRadians(lat1)) * math.cos(_degreesToRadians(lat2)) *
      (math.sin(dLon / 2) * math.sin(dLon / 2));
    final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadius * c;
  }
  
  double _degreesToRadians(double degrees) {
    return degrees * (math.pi / 180);
  }
  
  Widget _buildTransportTimeCard({
    required IconData icon,
    required String label,
    required String time,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color.withOpacity(0.8),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            time,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
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
