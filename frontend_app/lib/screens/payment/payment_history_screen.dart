import 'package:flutter/material.dart';
import '../../utils/colors.dart';
import '../../api/api_service.dart';
import 'package:intl/intl.dart';

class PaymentHistoryScreen extends StatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  State<PaymentHistoryScreen> createState() => _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends State<PaymentHistoryScreen> {
  List<dynamic> _history = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    try {
      final response = await ApiService.getPembayaran();
      final List<dynamic> data = response['data'] ?? [];
      
      // Filter hanya yang lunas (settlement, capture, success)
      final successStatuses = ['settlement', 'capture', 'success', 'berhasil'];
      
      setState(() {
        _history = data.where((p) => 
          successStatuses.contains(p['status']?.toString().toLowerCase())
        ).toList();
        _isLoading = false;
        _error = null;
      });
    } catch (e) {
      final errorStr = e.toString();
      if (errorStr.contains('404')) {
        setState(() {
          _history = [];
          _isLoading = false;
          _error = null;
        });
      } else {
        setState(() {
          _error = errorStr;
          _isLoading = false;
        });
      }
    }
  }

  String _formatCurrency(num amount) {
    return NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    ).format(amount);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text("Riwayat Pembayaran", style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? _buildErrorState()
              : _history.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                      onRefresh: _fetchHistory,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _history.length,
                        itemBuilder: (context, index) {
                          final item = _history[index];
                          final booking = item['booking'] ?? {};
                          final kost = booking['kost'] ?? {};
                          
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              leading: CircleAvatar(
                                backgroundColor: Colors.green.shade50,
                                child: const Icon(Icons.check_circle, color: Colors.green),
                              ),
                              title: Text(
                                kost['nama_kost'] ?? "Pembayaran Sewa",
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  "${_formatCurrency(item['jumlah'] ?? 0)} • ${_formatDate(item['created_at'])}",
                                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                ),
                              ),
                              trailing: const Text(
                                "Lunas",
                                style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text("Belum ada riwayat pembayaran", style: TextStyle(color: Colors.grey, fontSize: 16)),
        ],
      ),
    );
  }
}
