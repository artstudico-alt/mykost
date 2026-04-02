import 'package:flutter/material.dart';
import 'package:frontend_app/utils/colors.dart';
import 'package:frontend_app/widgets/kost_card.dart';
import 'package:frontend_app/api/api_service.dart';
import 'package:frontend_app/screens/notification/notification_screen.dart';
import 'package:frontend_app/screens/profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final GlobalKey _semuaKostKey = GlobalKey();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String _userName = ApiService.currentUser?['name'] ?? 'Guest User';
  String _userEmail = ApiService.currentUser?['email'] ?? '';

  // Sort & Filter state
  String _sortMode = 'default';
  String _categoryFilter = 'Semua';
  String _searchQuery = '';

  // Cached kost data
  List<dynamic> _allKostData = [];
  bool _kostLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _loadKostData();
  }

  Future<void> _loadUser() async {
    // If we already have data, the UI is already showing it. 
    // We still fetch 'me' to ensure it's up to date.
    try {
      if (ApiService.token == null) return;
      final response = await ApiService.me();
      if (response != null && response['data'] != null) {
        if (mounted) {
          setState(() {
            _userName = response['data']['name'] ?? 'Guest User';
            _userEmail = response['data']['email'] ?? '';
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _loadKostData() async {
    setState(() => _kostLoading = true);
    try {
      final rawData = await ApiService.getKost();
      debugPrint("API Response: $rawData");
      List<dynamic> data = [];
      if (rawData is Map && rawData.containsKey('data')) {
        data = rawData['data'];
      } else if (rawData is List) {
        data = rawData;
      }
      setState(() {
        _allKostData = data;
        _kostLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading kost data: $e");
      setState(() {
        _allKostData = [];
        _kostLoading = false;
      });
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
    const colors = [
      Color(0xFF00B14F),
      Color(0xFF6C63FF),
      Color(0xFFFF6B6B),
      Color(0xFFFF8C00),
      Color(0xFF00B4D8),
      Color(0xFFE83E8C),
    ];
    if (name == null) return colors[0];
    final nameStr = name.toString();
    if (nameStr.isEmpty) return colors[0];
    return colors[nameStr.codeUnitAt(0) % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            // Decorative background elements
            Positioned(
              top: -50,
              right: -50,
              child: Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withOpacity(0.08),
                ),
              ),
            ),
            Positioned(
              top: 100,
              left: -30,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.secondary,
                ),
              ),
            ),
            _buildHomeBody(context),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Material(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(24),
          child: TextField(
            controller: _searchController,
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
            onSubmitted: (_) => _scrollToSearchResults(),
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: "Cari nama kost...",
              hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 16),
              prefixIcon: const Icon(Icons.search, color: AppColors.primary, size: 26),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: AppColors.textMuted, size: 20),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchQuery = '';
                        });
                      },
                    )
                  : Container(
                      margin: const EdgeInsets.all(8),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.secondarySoft,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.tune,
                        color: AppColors.primary,
                        size: 20,
                      ),
                    ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ProfileScreen()),
                );
              },
              borderRadius: BorderRadius.circular(30),
              child: Padding(
                padding: const EdgeInsets.all(4.0),
                child: Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 12,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 26,
                        backgroundColor: _avatarColor(_userName),
                        child: Text(
                          _initials(_userName),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.waving_hand,
                              color: AppColors.limeAccent,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            const Text(
                              "Selamat Datang!",
                              style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _userName,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.15),
                  blurRadius: 15,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Material(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              child: InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const NotificationScreen()),
                  );
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.secondary),
                  ),
                  child: const Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Icon(
                        Icons.notifications_none_rounded,
                        color: AppColors.primary,
                        size: 28,
                      ),
                      Positioned(
                        right: 4,
                        top: 2,
                        child: CircleAvatar(
                          radius: 5,
                          backgroundColor: AppColors.accentGreen,
                        ),
                      )
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, {bool isGreen = false, bool showFilter = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          RichText(
            text: TextSpan(
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
              children: [
                if (isGreen) ...[
                  TextSpan(text: title.replaceAll("terdekat", "")),
                  const TextSpan(
                    text: "terdekat",
                    style: TextStyle(color: AppColors.primary),
                  ),
                ] else ...[
                  TextSpan(text: title),
                ],
              ],
            ),
          ),
          if (showFilter)
            GestureDetector(
              onTap: _showSortSheet,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: _sortMode != 'default' ? AppColors.primary : AppColors.secondary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.tune,
                  color: _sortMode != 'default' ? Colors.white : AppColors.primary,
                  size: 20,
                ),
              ),
            )
          else if (!isGreen)
            const Text(
              "Lihat Semua",
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHomeBody(BuildContext context) {
    return SingleChildScrollView(
      controller: _scrollController,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24),
          _buildProfileHeader(context),
          const SizedBox(height: 24),
          _buildSearchBar(context),
          const SizedBox(height: 24),
          _buildPromoBanner(context),
          const SizedBox(height: 32),
          _buildSectionTitle("Rekomendasi kos terdekat", isGreen: true),
          const SizedBox(height: 24),
          _buildRecommendations(),
          const SizedBox(height: 32),
          // Benefit Banner
          _buildBenefitsBanner(context),
          const SizedBox(height: 32),
          // Tempat section "Semua Kost Terdekat" dengan autoscroll
          Container(
            key: _semuaKostKey,
            child: _buildSectionTitle("Semua kost terdekat", isGreen: true, showFilter: true),
          ),
          const SizedBox(height: 12),
          _buildCategoryChips(),
          const SizedBox(height: 16),
          _buildAllKostGrid(),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // ─── Scroll to search results ─────────────────────────────────────────────
  void _scrollToSearchResults() {
    if (_searchQuery.isNotEmpty && _semuaKostKey.currentContext != null) {
      // Delay sedikit agar UI selesai build dengan hasil search yang baru
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_semuaKostKey.currentContext != null && mounted) {
          Scrollable.ensureVisible(
            _semuaKostKey.currentContext!,
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeInOutCubic,
            alignment: 0.1, // Sedikit padding di atas
          );
        }
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // ─── Sort bottom sheet ────────────────────────────────────────────────────
  void _showSortSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      useRootNavigator: true,
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.35,
      ),
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Urutkan',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _sortOption('default', 'Default', Icons.sort_rounded),
            _sortOption('price_asc', 'Harga Terendah', Icons.arrow_upward_rounded),
            _sortOption('price_desc', 'Harga Termahal', Icons.arrow_downward_rounded),
          ],
        ),
      ),
    );
  }

  Widget _sortOption(String value, String label, IconData icon) {
    final isActive = _sortMode == value;
    return InkWell(
      onTap: () {
        setState(() => _sortMode = value);
        Navigator.pop(context);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary.withOpacity(0.08) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isActive ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: isActive ? AppColors.primary : AppColors.textSecondary, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                  color: isActive ? AppColors.primary : AppColors.textPrimary,
                ),
              ),
            ),
            if (isActive)
              const Icon(Icons.check_circle, color: AppColors.primary, size: 20),
          ],
        ),
      ),
    );
  }

  // ─── Category chips ───────────────────────────────────────────────────────
  Widget _buildCategoryChips() {
    final categories = ['Semua', 'Putri', 'Putra', 'Campuran'];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        children: categories.map((cat) {
          final isActive = _categoryFilter == cat;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() => _categoryFilter = cat),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isActive ? AppColors.primary : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isActive ? AppColors.primary : Colors.grey.shade300,
                  ),
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.25),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : [],
                ),
                child: Text(
                  cat,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isActive ? Colors.white : AppColors.textSecondary,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ─── Price parser helper ──────────────────────────────────────────────────
  double _parsePrice(dynamic kost) {
    try {
      // Try API field first
      final harga = kost['harga_min'] ?? kost['harga_per_bulan'];
      if (harga != null) return double.tryParse(harga.toString()) ?? 0;

      // Parse from display string like "Rp 1,8 Juta/bulan"
      final priceStr = (kost['price'] ?? '').toString();
      final cleaned = priceStr
          .replaceAll('Rp ', '')
          .replaceAll('Rp', '')
          .replaceAll('.', '')
          .replaceAll(',', '.')
          .split(' ')[0]
          .split('/')[0];
      return double.tryParse(cleaned) ?? 0;
    } catch (_) {
      return 0;
    }
  }

  // ─── Apply sort & filter ──────────────────────────────────────────────────
  List<dynamic> _applySortAndFilter(List<dynamic> data) {
    List<dynamic> filtered = List.from(data);

    // Search filter by kost name
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = filtered.where((kost) {
        final namaKost = (kost['nama_kost'] ?? '').toString().toLowerCase();
        final kecamatan = (kost['kecamatan'] ?? '').toString().toLowerCase();
        final kota = (kost['kota'] ?? '').toString().toLowerCase();
        return namaKost.contains(query) || 
               kecamatan.contains(query) || 
               kota.contains(query);
      }).toList();
    }

    // Category filter
    if (_categoryFilter != 'Semua') {
      filtered = filtered.where((kost) {
        final type = (kost['tipe'] ?? kost['type'] ?? kost['jenis_kost'] ?? '').toString().toLowerCase();
        if (_categoryFilter == 'Putri') return type.contains('putri');
        if (_categoryFilter == 'Putra') return type.contains('putra') && !type.contains('putri');
        if (_categoryFilter == 'Campuran') return type.contains('campur');
        return true;
      }).toList();
    }

    // Sort
    if (_sortMode == 'price_asc') {
      filtered.sort((a, b) => _parsePrice(a).compareTo(_parsePrice(b)));
    } else if (_sortMode == 'price_desc') {
      filtered.sort((a, b) => _parsePrice(b).compareTo(_parsePrice(a)));
    }

    return filtered;
  }

  Widget _buildAllKostGrid() {
    if (_kostLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    // Apply sort & category filter on cached data
    final data = _applySortAndFilter(_allKostData);

    if (data.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.search_off_rounded, size: 48, color: Colors.grey.shade300),
              const SizedBox(height: 12),
              Text(
                'Tidak ada kost "$_categoryFilter" ditemukan',
                style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        shrinkWrap: true,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          mainAxisExtent: 255,
        ),
        itemCount: data.length,
        itemBuilder: (context, index) {
          final kost = data[index];
          // Safe owner name extraction
          String ownerName = "Pemilik";
          final dynamic rawUser = kost['user'];
          if (rawUser is Map) {
            final dynamic rawName = rawUser['name'];
            if (rawName is String) {
              ownerName = rawName;
            }
          }
          
          return KostCard(
            kostMap: kost is Map<String, dynamic> ? kost : null,
            title: kost["nama_kost"] ?? "Kost",
            price: "Rp ${kost['harga_min'] ?? '0'}/bulan",
            minRent: "Minimal Sewa 1 Bulan",
            location: "${kost['kecamatan'] ?? ''}, ${kost['kota'] ?? ''}",
            type: kost["tipe"]?.toString().toUpperCase() ?? "CAMPUR",
            ownerName: ownerName,
            lastUpdated: "Baru saja",
            imageCount: 1,
            isGrid: true,
          );
        },
      ),
    );
  }

  Widget _buildPromoBanner(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.3),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Background Pattern/Detail
            Positioned(
              right: -30,
              top: -30,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.1),
                ),
              ),
            ),
            Positioned(
              left: -20,
              bottom: -40,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.1),
                ),
              ),
            ),
            // Text and Button Content
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Ayo Mulai Cari Kos\nUntuk Tumbuh di 2026",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      if (_semuaKostKey.currentContext != null) {
                        Scrollable.ensureVisible(
                          _semuaKostKey.currentContext!,
                          duration: const Duration(milliseconds: 500),
                          curve: Curves.easeInOut,
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primary,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                    child: const Text(
                      "Lihat Semua Kos",
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
            // "3D" House Illustration Positioned out of bonds slightly
            Positioned(
              right: 8,
              bottom: 0,
              top: 10,
              child: Image.network(
                'https://cdn3d.iconscout.com/3d/premium/thumb/house-4158428-3453308.png', 
                width: 110,
                height: 110,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  // Fallback icon jika gambar rusak
                  return const Icon(Icons.house_rounded, size: 100, color: Colors.white70);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendations() {
    if (_kostLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    final data = _allKostData;

    if (data.isEmpty) {
      return const Center(
        child: Text("Belum ada kost tersedia", style: TextStyle(color: Colors.grey)),
      );
    }

    return SizedBox(
      height: 520,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        itemCount: data.length > 5 ? 5 : data.length, // Show top 5
        itemBuilder: (context, index) {
          final kost = data[index];
          // Safe owner name extraction
          String ownerName = "Pemilik";
          final dynamic rawUser = kost['user'];
          if (rawUser is Map) {
            final dynamic rawName = rawUser['name'];
            if (rawName is String) {
              ownerName = rawName;
            }
          }

          return Padding(
            padding: const EdgeInsets.only(right: 20, bottom: 20),
            child: KostCard(
              kostMap: kost is Map<String, dynamic> ? kost : null,
              title: kost["nama_kost"] ?? "Kost",
              price: "Rp ${kost['harga_min'] ?? '0'}/bulan",
              minRent: "Minimal sewa 1 bulan",
              location: "${kost['kecamatan'] ?? ''}, ${kost['kota'] ?? ''}",
              type: kost["tipe"]?.toString().toUpperCase() ?? "CAMPUR",
              ownerName: ownerName,
              lastUpdated: "Baru saja",
              imageCount: 1,
            ),
          );
        },
      ),
    );
  }

  Widget _buildBenefitsBanner(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: GestureDetector(
        onTap: () => _showBenefitsPopup(context),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.08),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(color: Colors.grey.shade100),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildBenefitItem(text: "Mudah &\nCepat", iconType: 1),
              _buildBenefitItem(text: "Bebas Biaya\nAdmin", iconType: 2),
              _buildBenefitItem(text: "Harga\nTerbaik", iconType: 3),
              const Icon(Icons.chevron_right, color: Colors.black87),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBenefitItem({required String text, required int iconType}) {
    Widget iconWidget;
    if (iconType == 1) { // Mudah & Cepat
       iconWidget = Stack(
          alignment: Alignment.center,
          children: [
             Icon(Icons.article, color: Colors.green.shade500, size: 28),
             Container(
               padding: const EdgeInsets.all(2),
               decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle),
               child: const Icon(Icons.flash_on, color: Colors.white, size: 12),
             )
          ]
       );
    } else if (iconType == 2) { // Gratis Iklan
       iconWidget = Stack(
         clipBehavior: Clip.none,
         alignment: Alignment.center,
         children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(color: Colors.green.shade500, shape: BoxShape.circle),
              child: const Text("Rp", style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
            ),
            Positioned(
               right: -6,
               bottom: -4,
               child: Container(
                 padding: const EdgeInsets.all(3),
                 decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle),
                 child: const Text("0", style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
               ),
            )
         ]
       );
    } else { // Info Nilai Properti
       iconWidget = Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
             Icon(Icons.home, color: Colors.blue.shade500, size: 28),
             Positioned(
               right: -4,
               top: -2,
               child: Icon(Icons.local_offer, color: Colors.green.shade500, size: 14),
             )
          ]
       );
    }

    return Row(
      children: [
        iconWidget,
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, height: 1.2),
        ),
      ],
    );
  }

  void _showBenefitsPopup(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
              const SizedBox(height: 24),
              const Text(
                "Keuntungan Pakai MyKost",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 24),
              _buildPopupBenefitItem(Icons.flash_on, Colors.blue, "Mudah & Cepat", "Cari dan ajukan sewa kost impianmu dengan cepat dan mudah tanpa ribet."),
              const SizedBox(height: 16),
              _buildPopupBenefitItem(Icons.money_off, Colors.green, "Bebas Biaya Admin", "Pemesanan kost lewat MyKost tidak dipungut biaya admin tambahan apapun."),
              const SizedBox(height: 16),
              _buildPopupBenefitItem(Icons.local_offer, Colors.orange, "Harga Terbaik", "Dapatkan rekomendasi kost dengan harga terbaik yang sesuai dengan budget kamu."),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    elevation: 0,
                  ),
                  child: const Text("Mengerti", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPopupBenefitItem(IconData icon, Color color, String title, String description) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(
          backgroundColor: color.withOpacity(0.1),
          radius: 24,
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary)),
              const SizedBox(height: 4),
              Text(description, style: TextStyle(color: Colors.grey.shade600, fontSize: 13, height: 1.4)),
            ],
          ),
        )
      ],
    );
  }
}

