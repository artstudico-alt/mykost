import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../utils/colors.dart';
import '../screens/kost/kost_detail_screen.dart';
import '../screens/kost/rental_application_screen.dart';
import 'custom_button.dart';

class KostCard extends StatelessWidget {
  final Map<String, dynamic>? kostMap;
  final String title;
  final String price;
  final String minRent;
  final String location;
  final String type;
  final String roomLeft;
  final String ownerName;
  final String lastUpdated;
  final int imageCount;

  final bool isGrid;

  const KostCard({
    super.key,
    this.kostMap,
    required this.title,
    required this.price,
    required this.minRent,
    required this.location,
    required this.type,
    required this.roomLeft,
    required this.ownerName,
    required this.lastUpdated,
    this.imageCount = 8,
    this.isGrid = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: isGrid ? double.infinity : 340, // Responsive layout
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          // Navigasi ke Halaman Detail
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => KostDetailScreen(
                kost: kostMap ?? {
                  'title': title,
                  'price': price,
                  'location': location,
                  'type': type,
                },
              ),
            ),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImageGallery(),
            Expanded(
              child: Padding(
                padding: EdgeInsets.all(isGrid ? 8.0 : 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                _buildTagsAndActions(context),
                SizedBox(height: isGrid ? 4 : 12),
                Text(
                  price,
                  style: TextStyle(
                    fontSize: isGrid ? 14 : 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (!isGrid) ...[
                  const SizedBox(height: 4),
                  Text(
                    minRent,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                SizedBox(height: isGrid ? 6 : 12),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: isGrid ? 12 : 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: isGrid ? 2 : 4),
                Text(
                  location,
                  style: TextStyle(
                    fontSize: isGrid ? 10 : 14,
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (isGrid) ...[
                  const Spacer(), // Dorong tombol ke bawah
                  _buildActionButtons(context),
                ],
                if (!isGrid) ...[
                  const SizedBox(height: 16),
                  Divider(color: Colors.grey.shade200, height: 1),
                  const SizedBox(height: 12),
                  _buildOwnerInfo(),
                  const SizedBox(height: 16),
                  _buildActionButtons(context),
                ],
              ],
            ),
          ))
        ],
      ),
      ),
    );
  }

  Widget _buildImageGallery() {
    return SizedBox(
      height: isGrid ? 100 : 180,
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        child: Stack(
          children: [
            if (isGrid) 
              Container(
                color: Colors.grey.shade300,
                child: const Center(
                  child: Icon(Icons.image, size: 30, color: Colors.grey),
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: Container(
                      color: Colors.grey.shade300,
                      child: const Center(
                        child: Icon(Icons.image, size: 40, color: Colors.grey),
                      ),
                    ),
                  ),
                  const SizedBox(width: 2),
                  Expanded(
                    flex: 1,
                    child: Column(
                      children: [
                        Expanded(
                          child: Container(
                            color: Colors.grey.shade300,
                            child: const Center(
                              child: Icon(Icons.image, size: 20, color: Colors.grey),
                            ),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Expanded(
                          child: Container(
                            color: Colors.grey.shade300,
                            child: const Center(
                              child: Icon(Icons.image, size: 20, color: Colors.grey),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            Positioned(
              left: 12,
              bottom: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.photo_library_outlined, size: 14, color: AppColors.textPrimary),
                    const SizedBox(width: 4),
                    Text(
                      "1/$imageCount",
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTagsAndActions(BuildContext context) {
    if (isGrid) {
      // Sangat minimalis untuk grid, tapi masukkan sisa kamar
      return Wrap(
        spacing: 4,
        runSpacing: 4,
        children: [
          _buildTag(type, AppColors.primary, AppColors.secondary),
          _buildTag(roomLeft, Colors.orange.shade800, Colors.orange.shade50),
        ],
      );
    }

    return Row(
      children: [
        _buildTag(
          type,
          AppColors.primary,
          AppColors.secondary,
        ),
        const SizedBox(width: 8),
        _buildTag(
          roomLeft,
          Colors.orange.shade800,
          Colors.orange.shade50,
        ),
        const Spacer(),
        GestureDetector(
          onTap: () => _showShareOptions(context),
          child: const Icon(Icons.share_outlined, size: 20, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  Widget _buildTag(String text, Color textColor, Color bgColor) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: isGrid ? 6 : 10, vertical: isGrid ? 2 : 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: isGrid ? 9 : 12,
          fontWeight: FontWeight.bold,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildOwnerInfo() {
    return Row(
      children: [
        if (!isGrid) ...[
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.person, color: Colors.white),
          ),
          const SizedBox(width: 12),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!isGrid) ...[
                Text(
                  "Diperbarui $lastUpdated",
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
              ],
              RichText(
                text: TextSpan(
                  style: TextStyle(fontSize: isGrid ? 12 : 14, color: AppColors.textPrimary),
                  children: [
                    TextSpan(
                      text: ownerName,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    TextSpan(text: isGrid ? "" : " • Pemilik properti"),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: isGrid ? 28 : 40,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: EdgeInsets.zero,
              ),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => RentalApplicationScreen(
                      kost: kostMap ?? {
                        'title': title,
                        'price': price,
                        'location': location,
                        'type': type,
                      },
                    ),
                  ),
                );
              },
              child: Text("Ajukan sewa", style: TextStyle(fontWeight: FontWeight.bold, fontSize: isGrid ? 11 : 14)),
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
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 48), // Bottom padding to make it taller
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

