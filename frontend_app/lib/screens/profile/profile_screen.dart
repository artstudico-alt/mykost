import 'package:flutter/material.dart';
import 'package:frontend_app/utils/colors.dart';
import 'package:frontend_app/api/api_service.dart';
import 'package:frontend_app/screens/auth/login_screen.dart';
import 'package:frontend_app/screens/payment/payment_history_screen.dart';
import 'package:frontend_app/screens/profile/hunian_saya_screen.dart';
import 'package:frontend_app/screens/complaint/list_keluhan_screen.dart';
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

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  String? _errorMessage;
  bool _hasError = false;

  Future<void> _loadAllData() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
      _errorMessage = null;
    });
    
    final List<String> failedLoads = [];
    final List<String> errorDetails = [];
    
    debugPrint('=== Starting _loadAllData ===');
    debugPrint('Token: ${ApiService.token != null ? "Present" : "NULL"}');
    
    try {
      if (ApiService.token != null) {
        try {
          debugPrint('Loading user data...');
          final userResponse = await ApiService.me();
          debugPrint('User response: $userResponse');
          if (userResponse != null && userResponse['data'] != null) {
            _userData = userResponse['data'];
          }
        } catch (e, stackTrace) {
          debugPrint('Error loading user data: $e');
          debugPrint('Stack trace: $stackTrace');
        }
      } else {
        debugPrint('WARNING: No token available!');
        errorDetails.add('Token tidak tersedia');
      }

      try {
        debugPrint('Loading hunian data...');
        final hunianResponse = await ApiService.getHunianSaya();
        debugPrint('Hunian response: $hunianResponse');
        if (hunianResponse != null && hunianResponse['data'] != null) {
          _hunianList = hunianResponse['data'] as List;
          debugPrint('Hunian loaded: ${_hunianList.length} items');
        } else {
          debugPrint('Hunian response empty or null');
        }
      } catch (e, stackTrace) {
        debugPrint('Error loading hunian: $e');
        debugPrint('Stack trace: $stackTrace');
        failedLoads.add('Hunian');
        errorDetails.add('Hunian: $e');
      }

      try {
        debugPrint('Loading keluhan data...');
        final keluhanResponse = await ApiService.getKeluhan();
        debugPrint('Keluhan response: $keluhanResponse');
        if (keluhanResponse != null && keluhanResponse['data'] != null) {
          _keluhanList = keluhanResponse['data'] as List;
          debugPrint('Keluhan loaded: ${_keluhanList.length} items');
        } else {
          debugPrint('Keluhan response empty or null');
        }
      } catch (e, stackTrace) {
        debugPrint('Error loading keluhan: $e');
        debugPrint('Stack trace: $stackTrace');
        failedLoads.add('Keluhan');
        errorDetails.add('Keluhan: $e');
      }

      try {
        debugPrint('Loading booking data...');
        final bookingResponse = await ApiService.getBooking();
        debugPrint('Booking response: $bookingResponse');
        if (bookingResponse != null && bookingResponse['data'] != null) {
          _bookingList = bookingResponse['data'] as List;
          debugPrint('Booking loaded: ${_bookingList.length} items');
        } else {
          debugPrint('Booking response empty or null');
        }
      } catch (e, stackTrace) {
        debugPrint('Error loading booking: $e');
        debugPrint('Stack trace: $stackTrace');
        failedLoads.add('Booking');
        errorDetails.add('Booking: $e');
      }
      
      debugPrint('=== _loadAllData complete ===');
      debugPrint('Failed loads: $failedLoads');
      debugPrint('Error details: $errorDetails');
      
      if (failedLoads.isNotEmpty && mounted) {
        setState(() {
          _hasError = true;
          _errorMessage = 'Gagal memuat: ${failedLoads.join(', ')}';
        });
        
        // Show snackbar with retry option
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_errorMessage!),
            backgroundColor: Colors.orange,
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'Retry',
              textColor: Colors.white,
              onPressed: _loadAllData,
            ),
          ),
        );
      }
    } catch (e, stackTrace) {
      debugPrint('Error loading data: $e');
      debugPrint('Stack trace: $stackTrace');
      if (mounted) {
        setState(() {
          _hasError = true;
          _errorMessage = 'Gagal memuat data: $e';
        });
      }
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
      const Color(0xFF00B14F),
      const Color(0xFF6C63FF),
      const Color(0xFFFF6B6B),
      const Color(0xFF00B4D8),
      const Color(0xFFE83E8C),
    ];
    if (name == null) return colors[0];
    final nameStr = name.toString();
    if (nameStr.isEmpty) return colors[0];
    return colors[nameStr.codeUnitAt(0) % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final dynamic rawName = _userData?['name'];
    final String name = (rawName is String) ? rawName : 'Guest';
    
    final dynamic rawEmail = _userData?['email'];
    final String email = (rawEmail is String) ? rawEmail : '';
    
    final dynamic rawPhone = _userData?['phone'];
    final String phone = (rawPhone is String) ? rawPhone : '-';
    
    String role = 'Pengguna';
    final dynamic rawRole = _userData?['role'];
    if (rawRole is Map) {
      final dynamic rawRoleName = rawRole['name'];
      if (rawRoleName is String) {
        role = rawRoleName;
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
        ),
        actions: [
          // Settings button placeholder (can be enabled later)
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SafeArea(
              child: RefreshIndicator(
                onRefresh: _loadAllData,
                color: AppColors.primary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 8),
                      _buildProfileHeader(name, email, role),
                      const SizedBox(height: 24),
                      _buildMenuGrid(),
                      const SizedBox(height: 24),
                      _buildStatsSection(),
                      const SizedBox(height: 24),
                      _buildHunianCard(),
                      const SizedBox(height: 24),
                      _buildKeluhanSection(),
                      const SizedBox(height: 24),
                      _buildPersonalInfo(phone, email),
                      const SizedBox(height: 24),
                      _buildLogoutButton(),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildProfileHeader(String name, String email, String role) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary,
            _avatarColor(name).withGreen(180),
          ],
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
        children: [
          Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withOpacity(0.3), width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 15,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: CircleAvatar(
                  radius: 40,
                  backgroundColor: Colors.white,
                  child: Text(
                    _initials(name),
                    style: TextStyle(
                      color: AppColors.primary,
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
                        color: Colors.white,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        role.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
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
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.edit_outlined, color: Colors.white, size: 20),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: Row(
              children: [
                Icon(Icons.email_outlined, color: Colors.white.withOpacity(0.8), size: 18),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    email.isEmpty ? 'Email tidak tersedia' : email,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.9),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          if (_hasError && _errorMessage != null) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: _loadAllData,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 16),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.refresh, color: Colors.white, size: 16),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMenuGrid() {
    final menuItems = [
      _MenuItem(icon: Icons.home_work_outlined, label: 'Hunian', color: AppColors.primary, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HunianSayaScreen()))),
      _MenuItem(icon: Icons.receipt_long_outlined, label: 'Pembayaran', color: const Color(0xFF6C63FF), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PaymentHistoryScreen()))),
      _MenuItem(icon: Icons.report_problem_outlined, label: 'Keluhan', color: Colors.orange, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ListKeluhanScreen()))),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: menuItems.length,
      itemBuilder: (context, index) {
        final item = menuItems[index];
        return InkWell(
          onTap: item.onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: item.color.withOpacity(0.1),
                  blurRadius: 10,
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
                    color: item.color.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(item.icon, color: item.color, size: 24),
                ),
                const SizedBox(height: 8),
                Text(
                  item.label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatsSection() {
    // Safely calculate stats with null checks
    final bookingCount = _bookingList.length;
    final paidCount = _bookingList.where((b) {
      if (b == null || b is! Map) return false;
      final status = b['status'];
      return status != null && status.toString().toLowerCase() == 'paid';
    }).length;

    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'Booking',
            bookingCount.toString(),
            Icons.receipt_outlined,
            AppColors.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            'Selesai',
            paidCount.toString(),
            Icons.check_circle_outline,
            const Color(0xFF6C63FF),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            'Keluhan',
            _keluhanList.length.toString(),
            Icons.report_problem_outlined,
            Colors.orange,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHunianCard() {
    // Safely check if hunian data exists and is valid
    final currentHunian = (_hunianList.isNotEmpty && _hunianList.first != null && _hunianList.first is Map) 
        ? _hunianList.first as Map 
        : null;
    
    // Debug: Log the hunian data structure untuk membantu debugging
    if (currentHunian != null) {
      debugPrint('Hunian data: $currentHunian');
      debugPrint('Kost data: ${currentHunian['kost']}');
    }

    // Helper untuk extract kost data dengan berbagai kemungkinan struktur
    Map<String, dynamic> getKostData(dynamic hunian) {
      if (hunian == null) return {};
      
      // Coba ambil dari field 'kost' (nested)
      if (hunian['kost'] is Map) {
        return Map<String, dynamic>.from(hunian['kost']);
      }
      
      // Coba ambil dari field 'booking' -> 'kost'
      if (hunian['booking']?['kost'] is Map) {
        return Map<String, dynamic>.from(hunian['booking']['kost']);
      }
      
      // Coba ambil dari field 'rental' -> 'kost'
      if (hunian['rental']?['kost'] is Map) {
        return Map<String, dynamic>.from(hunian['rental']['kost']);
      }
      
      // Jika kost data flat langsung di hunian
      return {
        'nama_kost': hunian['nama_kost'] ?? hunian['nama'] ?? hunian['kost_name'],
        'alamat': hunian['alamat'] ?? hunian['alamat_kost'],
        'foto_url': hunian['foto_url'] ?? hunian['foto'] ?? hunian['foto_kost'],
      };
    }
    
    final kostData = getKostData(currentHunian);
    
    // Extract fields dengan fallback chain
    final String kostName = kostData['nama_kost'] ?? 
                           kostData['nama'] ?? 
                           kostData['name'] ?? 
                           currentHunian?['nama_kost'] ?? 
                           currentHunian?['kost_name'] ?? 
                           'Kost Tidak Diketahui';
    
    final String kostAddress = kostData['alamat'] ?? 
                                kostData['alamat_lengkap'] ?? 
                                kostData['kecamatan'] ?? 
                                currentHunian?['alamat'] ?? 
                                currentHunian?['alamat_kost'] ?? 
                                'Alamat tidak tersedia';
    
    final String? fotoUrl = kostData['foto_url'] ?? 
                            kostData['foto'] ?? 
                            kostData['foto_kost'] ?? 
                            kostData['gambar'] ?? 
                            kostData['thumbnail'] ??
                            currentHunian?['foto_url'] ??
                            currentHunian?['foto'];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.05),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Icon(Icons.home_work_outlined, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Hunian Saat Ini',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Spacer(),
                if (currentHunian != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      (currentHunian['status']?.toString() ?? 'aktif').toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (currentHunian != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.zero,
              child: Image.network(
                fotoUrl ?? 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
                height: 160,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 160,
                  color: Colors.grey.shade200,
                  child: Icon(Icons.image_outlined, color: Colors.grey.shade400, size: 48),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    kostName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, size: 14, color: Colors.grey.shade400),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          kostAddress,
                          style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ] else
            Container(
              padding: const EdgeInsets.all(32),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.home_outlined, color: Colors.grey.shade300, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      'Belum memiliki hunian aktif',
                      style: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildKeluhanSection() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.report_problem_outlined, color: AppColors.primary, size: 20),
                    const SizedBox(width: 8),
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
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Buat', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ],
            ),
          ),
          if (_keluhanList.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.check_circle_outline, size: 40, color: Colors.grey.shade300),
                    const SizedBox(height: 8),
                    Text(
                      'Tidak ada keluhan',
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                    ),
                  ],
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: _keluhanList.take(2).where((k) => k != null && k is Map).map((keluhan) {
                  final safeKeluhan = keluhan as Map;
                  final kategori = safeKeluhan['kategori']?.toString() ?? 'Umum';
                  final status = safeKeluhan['status']?.toString() ?? 'menunggu';
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade100),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getKategoriColor(kategori).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            kategori,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: _getKategoriColor(kategori),
                            ),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          status.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: _getStatusColor(status),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          if (_keluhanList.length > 2)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: TextButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ListKeluhanScreen()),
                  ),
                  child: const Text('Lihat Semua'),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPersonalInfo(String phone, String email) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Icon(Icons.person_outline, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Informasi Pribadi',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildInfoItem(Icons.email_outlined, 'Email', email),
                const Divider(height: 24),
                _buildInfoItem(Icons.phone_outlined, 'Telepon', phone),
                const Divider(height: 24),
                _buildInfoItem(
                  Icons.calendar_today_outlined,
                  'Bergabung',
                  _userData?['created_at'] != null
                      ? _formatDate(_userData!['created_at'])
                      : '-',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: Colors.grey.shade500),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textPrimary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton.icon(
        onPressed: _handleLogout,
        icon: const Icon(Icons.logout_rounded, size: 20, color: Colors.red),
        label: const Text(
          'Keluar',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.red),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: Colors.red.shade200),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Keluar?', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Anda akan keluar dari aplikasi.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
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
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Keluar'),
          ),
        ],
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
            TextField(
              controller: nameCtrl,
              decoration: InputDecoration(
                labelText: 'Nama Lengkap',
                prefixIcon: Icon(Icons.person_outline, color: AppColors.primary),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppColors.primary),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: phoneCtrl,
              decoration: InputDecoration(
                labelText: 'Telepon',
                prefixIcon: Icon(Icons.phone_outlined, color: AppColors.primary),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppColors.primary),
                ),
              ),
            ),
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

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  Color _getKategoriColor(String? kategori) {
    switch (kategori?.toLowerCase()) {
      case 'fasilitas':
        return AppColors.primary;
      case 'kebersihan':
        return const Color(0xFF6C63FF);
      case 'keamanan':
        return Colors.orange;
      case 'lainnya':
        return Colors.teal;
      default:
        return AppColors.primary;
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'selesai':
        return AppColors.primary;
      case 'diproses':
        return Colors.orange;
      case 'menunggu':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  _MenuItem({required this.icon, required this.label, required this.color, required this.onTap});
}
