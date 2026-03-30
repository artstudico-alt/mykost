import 'dart:async';
import 'package:flutter/material.dart';
import 'package:frontend_app/api/api_service.dart';
import 'package:frontend_app/utils/colors.dart';
import 'package:frontend_app/screens/kost/kost_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _searchResults = [];
  bool _isLoading = false;
  bool _hasSearched = false;
  Timer? _debounce;

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      if (mounted) {
        setState(() {
          _searchResults = [];
          _hasSearched = false;
          _isLoading = false;
        });
      }
      return;
    }

    if (mounted) {
      setState(() {
        _isLoading = true;
        _hasSearched = true;
      });
    }

    try {
      final response = await ApiService.searchKost(query.trim());
      if (mounted) {
        List<dynamic> results = [];
        if (response is List) {
          results = response;
        } else if (response is Map) {
          results = response['data'] ?? response['kost'] ?? [];
        }
        setState(() {
          _searchResults = results;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _searchResults = [];
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Gagal mencari kost: ${e.toString().replaceAll('Exception: ', '')}"),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() {
      _searchResults = [];
      _hasSearched = false;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        title: TextField(
          controller: _searchController,
          autofocus: true,
          style: const TextStyle(fontSize: 16),
          decoration: InputDecoration(
            hintText: "Cari kost berdasarkan nama / lokasi...",
            border: InputBorder.none,
            hintStyle: const TextStyle(color: Colors.grey),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, color: Colors.grey),
                    onPressed: _clearSearch,
                  )
                : null,
          ),
          onChanged: (q) {
            setState(() {}); // refresh suffix icon
            _onSearchChanged(q);
          },
          onSubmitted: _performSearch,
          textInputAction: TextInputAction.search,
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : !_hasSearched
              ? _buildHintState()
              : _searchResults.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _searchResults.length,
                      itemBuilder: (context, index) {
                        final kost = _searchResults[index];
                        return _buildKostItem(kost);
                      },
                    ),
    );
  }

  Widget _buildHintState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search, size: 72, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text(
            "Ketik nama atau lokasi kost",
            style: TextStyle(color: Colors.grey, fontSize: 16, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          Text(
            "Contoh: kost bandung, kost campur",
            style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 72, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text(
            "Kost tidak ditemukan",
            style: TextStyle(color: Colors.grey, fontSize: 16, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          Text(
            "Coba kata kunci yang berbeda",
            style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildKostItem(dynamic kost) {
    final harga = kost['harga_min'] ?? kost['harga'] ?? 0;
    final namaKost = kost['nama_kost'] ?? kost['name'] ?? 'Kost';
    final kecamatan = kost['kecamatan'] ?? '';
    final kota = kost['kota'] ?? '';
    final lokasi = [kecamatan, kota].where((s) => s.isNotEmpty).join(', ');
    final tipe = (kost['tipe'] ?? 'campur').toString().toUpperCase();
    final kamarKosong = kost['kamars_kosong_count'] ?? kost['kamar_kosong'] ?? '?';
    final images = kost['images'] as List?;
    final imageUrl = (images != null && images.isNotEmpty)
        ? images[0]['url'] ?? images[0]['path'] ?? ''
        : '';

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => KostDetailScreen(kost: kost is Map<String, dynamic> ? kost : Map<String, dynamic>.from(kost)),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                bottomLeft: Radius.circular(16),
              ),
              child: imageUrl.isNotEmpty
                  ? Image.network(
                      imageUrl,
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _placeholderImage(),
                    )
                  : _placeholderImage(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            tipe,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      namaKost,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (lokasi.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          children: [
                            const Icon(Icons.location_on, size: 12, color: Colors.grey),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                lokasi,
                                style: const TextStyle(color: Colors.grey, fontSize: 12),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "Rp ${_formatNumber(harga)}/bln",
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          "Sisa $kamarKosong kamar",
                          style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                        ),
                      ],
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

  Widget _placeholderImage() {
    return Container(
      width: 100,
      height: 100,
      color: Colors.grey.shade100,
      child: const Icon(Icons.home, color: Colors.grey, size: 32),
    );
  }

  String _formatNumber(dynamic number) {
    if (number == null) return '0';
    final n = int.tryParse(number.toString()) ?? 0;
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}jt';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}rb';
    return n.toString();
  }
}
