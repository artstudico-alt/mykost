import 'package:flutter/material.dart';
import '../../api/api_service.dart';
import '../../utils/colors.dart';
import '../../widgets/kost_card.dart';

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

  void _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _hasSearched = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _hasSearched = true;
    });

    try {
      final response = await ApiService.searchKost(query);
      if (response != null && response['data'] != null) {
        setState(() {
          _searchResults = response['data'];
          _isLoading = false;
        });
      } else if (response != null && response is List) {
        setState(() {
          _searchResults = response;
          _isLoading = false;
        });
      } else {
        setState(() {
          _searchResults = [];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _searchResults = [];
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Terjadi kesalahan: $e")),
      );
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
            hintText: "Cari kost berdasarkan lokasi / nama...",
            border: InputBorder.none,
            hintStyle: const TextStyle(color: Colors.grey),
            suffixIcon: IconButton(
              icon: const Icon(Icons.clear, color: Colors.grey),
              onPressed: () {
                _searchController.clear();
                _performSearch('');
              },
            ),
          ),
          onSubmitted: _performSearch,
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : (!_hasSearched)
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.search, size: 64, color: Colors.black12),
                      SizedBox(height: 16),
                      Text(
                        "Ketik lokasi atau nama kos",
                        style: TextStyle(color: Colors.grey, fontSize: 16),
                      ),
                    ],
                  ),
                )
              : _searchResults.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.search_off, size: 64, color: Colors.black12),
                          SizedBox(height: 16),
                          Text(
                            "Kos tidak ditemukan",
                            style: TextStyle(color: Colors.grey, fontSize: 16),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _searchResults.length,
                      itemBuilder: (context, index) {
                        final kost = _searchResults[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: KostCard(
                            kostMap: kost is Map<String, dynamic> ? kost : null,
                            title: kost["title"] ?? kost["nama_kost"] ?? "Kost",
                            price: kost["price"] ?? ((kost["harga_per_bulan"] != null) ? "Rp ${kost['harga_per_bulan']}/bulan" : "Rp 1,8 Juta/bulan"),
                            minRent: kost["minRent"] ?? "Minimal Sewa 1 Bulan",
                            location: kost["location"] ?? kost["alamat"] ?? "Bogor",
                            type: kost["type"] ?? kost["jenis_kost"] ?? "Campur",
                            roomLeft: kost["roomLeft"] ?? "Sisa kamar",
                            ownerName: kost["ownerName"] ?? "Pemilik Kost",
                            lastUpdated: kost["lastUpdated"] ?? "Baru saja",
                            imageCount: 8,
                          ),
                        );
                      },
                    ),
    );
  }
}
