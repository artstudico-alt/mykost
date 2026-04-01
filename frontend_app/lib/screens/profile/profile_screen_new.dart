import 'package:flutter/material.dart';
import 'package:frontend_app/utils/colors.dart';
import 'package:frontend_app/api/api_service.dart';
import 'package:frontend_app/screens/auth/login_screen.dart';
import 'package:frontend_app/screens/payment/payment_history_screen.dart';
import 'package:frontend_app/screens/profile/hunian_saya_screen.dart';
import 'package:frontend_app/screens/complaint/list_keluhan_screen.dart';
import 'package:frontend_app/screens/auth/password_otp_screen.dart';
import 'package:frontend_app/screens/complaint/complaint_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _userData = ApiService.currentUser;
  List<dynamic> _hunianList = [];
  List<dynamic> _keluhanList = [];
  List<dynamic> _bookingList = [];
  bool _isLoading = true;
  int _selectedMenuIndex = 0;

  final List<_MenuItemData> _menuItems = [
    _MenuItemData(icon: Icons.dashboard_outlined, label: 'Ringkasan', color: AppColors.primary),
    _MenuItemData(icon: Icons.home_work_outlined, label: 'Hunian', color: AppColors.accentGreen),
    _MenuItemData(icon: Icons.receipt_long_outlined, label: 'Pembayaran', color: AppColors.limeAccent),
    _MenuItemData(icon: Icons.report_problem_outlined, label: 'Keluhan', color: AppColors.warning),
    _MenuItemData(icon: Icons.settings_outlined, label: 'Pengaturan', color: AppColors.textSecondary),
  ];

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    setState(() => _isLoading = true);
    try {
      if (ApiService.token != null) {
        final userResponse = await ApiService.me();
        if (userResponse != null && userResponse['data'] != null) {
          _userData = userResponse['data'];
        }
      }

      try {
        final hunianResponse = await ApiService.getHunianSaya();
        if (hunianResponse != null && hunianResponse['data'] != null) {
          _hunianList = hunianResponse['data'] as List;
        }
      } catch (_) {}

      try {
        final keluhanResponse = await ApiService.getKeluhan();
        if (keluhanResponse != null && keluhanResponse['data'] != null) {
          _keluhanList = keluhanResponse['data'] as List;
        }
      } catch (_) {}

      try {
        final bookingResponse = await ApiService.getBooking();
        if (bookingResponse != null && bookingResponse['data'] != null) {
          _bookingList = bookingResponse['data'] as List;
        }
      } catch (_) {}
    } catch (e) {
      debugPrint('Error loading data: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _initials(dynamic name) {
    if (name == null) return 'GU';
    final nameStr = name.toString();
    if (nameStr.trim().isEmpty) return 'GU';
    final parts = nameStr.trim().split(RegExp(r'\s+'));
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  Color _avatarColor(dynamic name) {
    final colors = [
      AppColors.primary,
      AppColors.accentGreen,
      AppColors.limeAccent,
      AppColors.primaryDark,
      AppColors.primaryLight,
    ];
    if (name == null) return colors[0];
    final nameStr = name.toString();
    if (nameStr.isEmpty) return colors[0];
    return colors[nameStr.codeUnitAt(0) % colors.length];
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.logout, color: AppColors.error),
            SizedBox(width: 12),
            Text('Keluar?', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text('Anda akan keluar dari aplikasi.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ApiService.logout();
              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (r) => false,
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
  }

  void _handleMenuTap(int index) {
    setState(() => _selectedMenuIndex = index);
    
    switch (index) {
      case 1:
        Navigator.push(context, MaterialPageRoute(builder: (_) => const HunianSayaScreen()));
        break;
      case 2:
        Navigator.push(context, MaterialPageRoute(builder: (_) => const PaymentHistoryScreen()));
        break;
      case 3:
        Navigator.push(context, MaterialPageRoute(builder: (_) => const ListKeluhanScreen()));
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    // Safely extract user data with type checking
    final dynamic rawName = _userData?['name'];
    final String name = (rawName is String) ? rawName : 'Guest';
    
    final dynamic rawEmail = _userData?['email'];
    final String email = (rawEmail is String) ? rawEmail : '';
    
    final dynamic rawRole = _userData?['role'];
    String role = 'Pengguna';
    if (rawRole is Map) {
      final dynamic rawRoleName = rawRole['name'];
      if (rawRoleName is String) {
        role = rawRoleName;
      }
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SafeArea(
              child: Stack(
                children: [
                  // Decorative circles
                  Positioned(
                    top: -80,
                    right: -80,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primary.withOpacity(0.1),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 100,
                    left: -50,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.secondary,
                      ),
                    ),
                  ),
                  SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        _buildHeader(name, email, role),
                        const SizedBox(height: 24),
                        
                        // Menu Grid
                        _buildMenuGrid(),
                        const SizedBox(height: 24),
                        
                        // Current Hunian Card
                        _buildHunianCard(),
                        const SizedBox(height: 24),
                        
                        // Keluhan Section
                        _buildKeluhanSection(),
                        const SizedBox(height: 24),
                        
                        // Stats Card
                        _buildStatsCard(),
                        const SizedBox(height: 24),
                        
                        // Logout Button
                        _buildLogoutButton(),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildHeader(String name, String email, String role) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: _avatarColor(name).withOpacity(0.4),
                  blurRadius: 16,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: CircleAvatar(
              radius: 40,
              backgroundColor: _avatarColor(name),
              child: Text(
                _initials(name),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  email,
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.secondary,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    role.toString().toUpperCase(),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _showEditProfile,
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.secondarySoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.edit_outlined, color: AppColors.primary, size: 20),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1,
      ),
      itemCount: _menuItems.length,
      itemBuilder: (context, index) {
        final item = _menuItems[index];
        final isSelected = _selectedMenuIndex == index;
        
        return InkWell(
          onTap: () => _handleMenuTap(index),
          borderRadius: BorderRadius.circular(20),
          child: Container(
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary : AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: isSelected 
                      ? AppColors.primary.withOpacity(0.3)
                      : AppColors.primary.withOpacity(0.05),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isSelected 
                        ? Colors.white.withOpacity(0.2)
                        : item.color.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    item.icon,
                    color: isSelected ? Colors.white : item.color,
                    size: 24,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  item.label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHunianCard() {
    final currentHunian = _hunianList.isNotEmpty ? _hunianList.first : null;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.secondarySoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.home_work_outlined,
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Hunian Saat Ini',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              if (currentHunian != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.accentGreen.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    currentHunian['status']?.toString().toUpperCase() ?? 'AKTIF',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppColors.accentGreen,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (currentHunian != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                currentHunian['kost']?['foto_url'] ?? 
                currentHunian['kost']?['foto'] ?? 
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
                height: 160,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 160,
                  decoration: BoxDecoration(
                    color: AppColors.secondarySoft,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.home_outlined, color: AppColors.primary, size: 48),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              currentHunian['kost']?['nama'] ?? 'Kost Tidak Diketahui',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textMuted),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    currentHunian['kost']?['alamat'] ?? 'Alamat tidak tersedia',
                    style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ] else ...[
            Container(
              height: 160,
              decoration: BoxDecoration(
                color: AppColors.secondarySoft,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.home_outlined, color: AppColors.textMuted, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      'Anda belum memiliki hunian aktif',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 14),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildKeluhanSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.report_problem_outlined,
                      color: AppColors.warning,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Keluhan Saya',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              TextButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ComplaintScreen()),
                ),
                icon: const Icon(Icons.add, size: 18, color: AppColors.primary),
                label: const Text(
                  'Buat',
                  style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_keluhanList.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.secondarySoft,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.check_circle_outline,
                      size: 48,
                      color: AppColors.accentGreen,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Anda tidak pernah memberikan keluhan',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Column(
              children: _keluhanList.take(2).map((keluhan) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.secondarySoft,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: _getKategoriColor(keluhan['kategori']).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              keluhan['kategori'] ?? 'Umum',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: _getKategoriColor(keluhan['kategori']),
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            keluhan['status']?.toString().toUpperCase() ?? 'MENUNGGU',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: _getStatusColor(keluhan['status']),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        keluhan['judul'] ?? 'Tidak ada judul',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }

  Widget _buildStatsCard() {
    final bookingCount = _bookingList.length;
    final paidCount = _bookingList.where((b) => b['status'] == 'paid').length;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.accentGreen],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.analytics_outlined, color: Colors.white, size: 20),
              SizedBox(width: 8),
              Text(
                'Statistik',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _buildStatBox(
                  'Total Booking',
                  bookingCount.toString(),
                  Icons.receipt_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatBox(
                  'Selesai',
                  paidCount.toString(),
                  Icons.check_circle_outline,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatBox(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.white70, size: 24),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.white.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: OutlinedButton.icon(
        onPressed: _handleLogout,
        icon: const Icon(Icons.logout_rounded, size: 20, color: AppColors.error),
        label: const Text(
          'Keluar',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.error,
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: AppColors.error.withOpacity(0.3)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  void _showEditProfile() {
    final nameCtrl = TextEditingController(text: _userData?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: _userData?['phone'] ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Edit Profil', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildEditField('Nama Lengkap', nameCtrl, Icons.person_outline),
            const SizedBox(height: 16),
            _buildEditField('Telepon', phoneCtrl, Icons.phone_outlined),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  Widget _buildEditField(String label, TextEditingController controller, IconData icon) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppColors.primary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
      ),
    );
  }

  Color _getKategoriColor(String? kategori) {
    switch (kategori?.toLowerCase()) {
      case 'fasilitas':
        return AppColors.primary;
      case 'kebersihan':
        return AppColors.accentGreen;
      case 'keamanan':
        return AppColors.warning;
      case 'lainnya':
        return AppColors.limeAccent;
      default:
        return AppColors.primary;
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'selesai':
        return AppColors.accentGreen;
      case 'diproses':
        return AppColors.warning;
      case 'menunggu':
        return AppColors.textMuted;
      default:
        return AppColors.textMuted;
    }
  }
}

class _MenuItemData {
  final IconData icon;
  final String label;
  final Color color;

  _MenuItemData({required this.icon, required this.label, required this.color});
}
