import 'package:flutter/material.dart';
import 'package:frontend_app/utils/colors.dart';
import 'package:frontend_app/api/api_service.dart';
import 'package:intl/intl.dart';

class ListKeluhanScreen extends StatefulWidget {
  const ListKeluhanScreen({super.key});

  @override
  State<ListKeluhanScreen> createState() => _ListKeluhanScreenState();
}

class _ListKeluhanScreenState extends State<ListKeluhanScreen> {
  List<dynamic> _listKeluhan = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchKeluhan();
  }

  Future<void> _fetchKeluhan() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await ApiService.getKeluhan();
      // Backend typically returns { data: [...] } or just the list
      final data = response['data'] ?? response;
      
      setState(() {
        _listKeluhan = data is List ? data : [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        if (e.toString().contains('DATA_KARYAWAN_NOT_FOUND')) {
          _listKeluhan = [];
          _error = null;
        } else {
          _error = e.toString();
        }
        _isLoading = false;
      });
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return "-";
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy, HH:mm', 'id_ID').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'pending':
        return Colors.orange;
      case 'proses':
      case 'diproses':
        return Colors.blue;
      case 'selesai':
      case 'closed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text(
          "Keluhan Saya",
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? _buildErrorState()
              : _listKeluhan.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                      onRefresh: _fetchKeluhan,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _listKeluhan.length,
                        itemBuilder: (context, index) {
                          final item = _listKeluhan[index];
                          final kost = item['kost'] ?? {};
                          final status = item['status'] ?? 'Pending';

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.03),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: ExpansionTile(
                                leading: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: _getStatusColor(status).withOpacity(0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.report_problem_rounded,
                                    color: _getStatusColor(status),
                                    size: 20,
                                  ),
                                ),
                                title: Text(
                                  item['judul'] ?? "Tanpa Judul",
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                subtitle: Text(
                                  "${item['kategori'] ?? 'Kategori'} • ${_formatDate(item['created_at'])}",
                                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                ),
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _getStatusColor(status).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    status.toUpperCase(),
                                    style: TextStyle(
                                      color: _getStatusColor(status),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Divider(),
                                        const SizedBox(height: 8),
                                        if (kost['nama_kost'] != null) ...[
                                          Row(
                                            children: [
                                              const Icon(Icons.home_work_outlined, size: 14, color: AppColors.textSecondary),
                                              const SizedBox(width: 8),
                                              Text(
                                                kost['nama_kost'],
                                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 12),
                                        ],
                                        const Text(
                                          "Deskripsi:",
                                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          item['deskripsi'] ?? "-",
                                          style: const TextStyle(fontSize: 14, color: AppColors.textPrimary, height: 1.4),
                                        ),
                                        if (item['tanggapan'] != null) ...[
                                          const SizedBox(height: 16),
                                          Container(
                                            padding: const EdgeInsets.all(12),
                                            decoration: BoxDecoration(
                                              color: Colors.grey.shade50,
                                              borderRadius: BorderRadius.circular(12),
                                              border: Border.all(color: Colors.grey.shade200),
                                            ),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                const Text(
                                                  "Tanggapan Pengelola:",
                                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  item['tanggapan'],
                                                  style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.assignment_turned_in_outlined, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text(
            "Belum ada keluhan yang kirim",
            style: TextStyle(color: Colors.grey, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            "Keluhan yang Anda kirim akan muncul di sini",
            style: TextStyle(color: Colors.grey, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
            const SizedBox(height: 16),
            const Text("Gagal memuat keluhan", style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(_error ?? "Terjadi kesalahan", textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey, fontSize: 12)),
            const SizedBox(height: 24),
            ElevatedButton(onPressed: _fetchKeluhan, child: const Text("Coba Lagi")),
          ],
        ),
      ),
    );
  }
}
