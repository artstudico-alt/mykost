import 'package:flutter/material.dart';
import 'package:frontend_app/utils/colors.dart';
import 'package:frontend_app/api/api_service.dart';
import 'package:flutter/foundation.dart';

class ComplaintScreen extends StatefulWidget {
  final int? kostId;
  final String? kostName;

  const ComplaintScreen({super.key, this.kostId, this.kostName});

  @override
  State<ComplaintScreen> createState() => _ComplaintScreenState();
}

class _ComplaintScreenState extends State<ComplaintScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  String _selectedCategory = 'Fasilitas Kamar';
  int? _kostId;
  bool _isLoadingKost = true;

  final List<String> _categories = [
    'Fasilitas Kamar',
    'Fasilitas Umum',
    'Keamanan',
    'Kebersihan',
    'Lainnya',
  ];

  @override
  void initState() {
    super.initState();
    _kostId = widget.kostId;
    // Jika kostId tidak diberikan, coba ambil dari hunian aktif user
    if (_kostId == null) {
      _fetchActiveHunian();
    } else {
      _isLoadingKost = false;
    }
  }

  Future<void> _fetchActiveHunian() async {
    try {
      final response = await ApiService.getHunianSaya();
      if (response != null && response['data'] != null) {
        final List<dynamic> hunianList = response['data'];
        if (hunianList.isNotEmpty) {
          // Ambil kost_id dari hunian pertama yang aktif
          final activeHunian = hunianList.first;
          setState(() {
            _kostId = activeHunian['kost_id'] ?? activeHunian['kost']?['id'];
            _isLoadingKost = false;
          });
          return;
        }
      }
      setState(() => _isLoadingKost = false);
    } catch (e) {
      debugPrint('Error fetching hunian: $e');
      setState(() => _isLoadingKost = false);
    }
  }

  void _submitComplaint() async {
    // Validasi semua field wajib
    final title = _titleController.text.trim();
    final description = _descriptionController.text.trim();
    
    if (title.isEmpty) {
      _showError("Judul keluhan tidak boleh kosong");
      return;
    }
    
    if (description.isEmpty) {
      _showError("Detail keluhan tidak boleh kosong");
      return;
    }
    
    if (title.length < 3) {
      _showError("Judul keluhan minimal 3 karakter");
      return;
    }
    
    if (description.length < 10) {
      _showError("Detail keluhan minimal 10 karakter");
      return;
    }

    // Tampilkan loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
    );

    try {
      final data = <String, dynamic>{
        'kategori': _selectedCategory,
        'judul': title,
        'deskripsi': description,
      };
      
      // Tambahkan kost_id jika tersedia
      if (_kostId != null) {
        data['kost_id'] = _kostId;
      }
      
      debugPrint('Submitting complaint with data: $data');
      
      await ApiService.createKeluhan(data);

      if (!mounted) return;
      
      Navigator.pop(context); // Tutup loading
      Navigator.pop(context); // Kembali ke halaman sebelumnya
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Keluhan berhasil dikirim. Kami akan segera menindaklanjuti."),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Tutup loading
      
      String errorMsg = e.toString();
      
      // Parse error spesifik dari Laravel validation
      if (errorMsg.contains('kost_id')) {
        errorMsg = 'Kost harus dipilih. Pastikan Anda memiliki hunian aktif.';
      } else if (errorMsg.contains('judul')) {
        errorMsg = 'Judul keluhan tidak valid. Minimal 3 karakter.';
      } else if (errorMsg.contains('deskripsi')) {
        errorMsg = 'Detail keluhan tidak valid. Minimal 10 karakter.';
      } else if (errorMsg.contains('kategori')) {
        errorMsg = 'Kategori keluhan harus dipilih.';
      }
      
      _showError("Gagal mengirim keluhan: $errorMsg");
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Kirim Keluhan", style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.kostName != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary.withOpacity(0.1)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.home_work_rounded, color: AppColors.primary, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Keluhan untuk Kost:",
                            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                          Text(
                            widget.kostName!,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ] else if (_isLoadingKost) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: const Row(
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                    ),
                    SizedBox(width: 12),
                    Text(
                      "Memuat data hunian...",
                      style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ] else if (_kostId == null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.orange.shade600, size: 24),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        "Anda belum memiliki hunian aktif. Keluhan akan dikirim tanpa referensi kost.",
                        style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
            const Text(
              "Kategori Keluhan",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedCategory,
                  isExpanded: true,
                  items: _categories.map((String category) {
                    return DropdownMenuItem<String>(
                      value: category,
                      child: Text(category),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    if (newValue != null) {
                      setState(() {
                        _selectedCategory = newValue;
                      });
                    }
                  },
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              "Judul Keluhan",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _titleController,
              decoration: InputDecoration(
                hintText: "Contoh: AC Kamar Bocor",
                hintStyle: TextStyle(color: Colors.grey.shade400),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              "Detail Keluhan",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _descriptionController,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: "Ceritakan lebih detail mengenai keluhan Anda...",
                hintStyle: TextStyle(color: Colors.grey.shade400),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
              ),
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _submitComplaint,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  "Kirim Keluhan",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
