import 'package:flutter/material.dart';
import 'package:frontend_app/utils/colors.dart';
import 'package:frontend_app/api/api_service.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;

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
      
      setState(() {
        _history = data;
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

  bool _isLunas(String? status) {
    final s = status?.toLowerCase() ?? '';
    return ['lunas', 'settlement', 'capture', 'success', 'berhasil'].contains(s);
  }

  void _showInvoice(int pembayaranId) async {
    try {
      // Fetch invoice HTML dengan autentikasi
      final url = "${ApiService.baseUrl}/invoice/$pembayaranId/preview";
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer ${ApiService.token}',
          'Accept': 'text/html',
        },
      );

      if (response.statusCode == 200) {
        // Tampilkan di WebView
        _openInvoiceWebView(response.body, 'Invoice #$pembayaranId');
      } else if (response.statusCode == 401) {
        _showError("Silakan login terlebih dahulu");
      } else {
        _showError("Gagal memuat invoice: ${response.statusCode}");
      }
    } catch (e) {
      _showError("Gagal membuka invoice: $e");
    }
  }

  void _downloadInvoice(int pembayaranId) async {
    try {
      // Build download URL dengan token di query parameter untuk compatibilitas backend
      final url = "${ApiService.baseUrl}/invoice/$pembayaranId/download?token=${ApiService.token}";
      final uri = Uri.parse(url);
      
      // Coba berbagai mode launch untuk cross-platform compatibility
      LaunchMode launchMode = LaunchMode.platformDefault;
      
      // Prefer external application untuk Android/iOS agar PDF viewer terbuka
      launchMode = LaunchMode.externalApplication;
      
      if (await canLaunchUrl(uri)) {
        final success = await launchUrl(
          uri, 
          mode: launchMode,
          webOnlyWindowName: '_blank',
        );
        
        if (!success) {
          // Fallback ke platform default jika external application gagal
          await launchUrl(uri, mode: LaunchMode.platformDefault);
        }
      } else {
        _showError("Tidak dapat membuka URL. Pastikan ada browser/pdf viewer yang tersedia.");
      }
    } catch (e) {
      _showError("Gagal mengunduh invoice: $e");
    }
  }

  void _openInvoiceWebView(String htmlContent, String title) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: Text(title, style: const TextStyle(fontSize: 16)),
            backgroundColor: Colors.white,
            foregroundColor: AppColors.textPrimary,
            elevation: 0,
            actions: [
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: HtmlWidget(htmlContent: htmlContent),
              ),
            ),
          ),
        ),
      ),
    );
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

  String _formatDate(String? dateStr) {
    if (dateStr == null) return "-";
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy, HH:mm', 'id_ID').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  Widget _getStatusBadge(String? status) {
    final s = status?.toLowerCase() ?? 'pending';
    final isSuccess = ['settlement', 'capture', 'success', 'berhasil', 'lunas'].contains(s);
    final isPending = ['pending', 'waiting'].contains(s);
    
    Color color = Colors.orange;
    String label = "Pending";
    
    if (isSuccess) {
      color = Colors.green;
      label = "Lunas";
    } else if (!isPending) {
      color = Colors.red;
      label = "Gagal";
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 10),
      ),
    );
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
                          
                          // Fallback data mapping
                          final kostName = kost['nama_kost'] ?? booking['kost_name'] ?? item['keterangan'] ?? "Pembayaran Sewa";
                          final amount = item['jumlah'] ?? item['gross_amount'] ?? 0;
                          
                          final isLunas = _isLunas(item['status']);
                          
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Column(
                              children: [
                                ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  leading: CircleAvatar(
                                    backgroundColor: AppColors.primary.withOpacity(0.1),
                                    child: const Icon(Icons.receipt_long_rounded, color: AppColors.primary),
                                  ),
                                  title: Text(
                                    kostName,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  subtitle: Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(
                                      "${_formatCurrency(amount)} • ${_formatDate(item['created_at'] ?? item['tanggal_bayar'])}",
                                      style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                    ),
                                  ),
                                  trailing: _getStatusBadge(item['status']),
                                ),
                                if (isLunas)
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: OutlinedButton.icon(
                                            onPressed: () => _showInvoice(item['id']),
                                            icon: const Icon(Icons.visibility_outlined, size: 16),
                                            label: const Text("Lihat", style: TextStyle(fontSize: 12)),
                                            style: OutlinedButton.styleFrom(
                                              foregroundColor: AppColors.primary,
                                              side: BorderSide(color: Colors.grey.shade300),
                                              padding: const EdgeInsets.symmetric(vertical: 8),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: OutlinedButton.icon(
                                            onPressed: () => _downloadInvoice(item['id']),
                                            icon: const Icon(Icons.download_outlined, size: 16),
                                            label: const Text("PDF", style: TextStyle(fontSize: 12)),
                                            style: OutlinedButton.styleFrom(
                                              foregroundColor: AppColors.primary,
                                              side: BorderSide(color: Colors.grey.shade300),
                                              padding: const EdgeInsets.symmetric(vertical: 8),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
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

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.redAccent,
            ),
            const SizedBox(height: 16),
            const Text(
              "Gagal memuat riwayat pembayaran",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? "Terjadi kesalahan yang tidak diketahui",
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _fetchHistory,
              icon: const Icon(Icons.refresh),
              label: const Text("Coba Lagi"),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class HtmlWidget extends StatelessWidget {
  final String htmlContent;

  const HtmlWidget({super.key, required this.htmlContent});

  // Extract data from HTML
  Map<String, String> _parseInvoiceData(String html) {
    final data = <String, String>{};
    
    // Clean HTML untuk parsing lebih mudah
    var cleanHtml = html
        .replaceAll(RegExp(r'<style[^>]*>.*?</style>', caseSensitive: false, dotAll: true), '')
        .replaceAll(RegExp(r'<script[^>]*>.*?</script>', caseSensitive: false, dotAll: true), '');
    
    // Extract invoice number dari title atau header
    final invMatch = RegExp(r'Invoice\s*#?\s*([A-Z0-9\-]+)', caseSensitive: false).firstMatch(cleanHtml);
    data['invoice_number'] = invMatch?.group(1) ?? 'INV-000000';
    
    // Extract dates - cari format tanggal Indonesia/Inggris
    final dateMatch = RegExp(r'(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})', caseSensitive: false).allMatches(cleanHtml);
    final dates = dateMatch.map((m) => m.group(1)!).toList();
    if (dates.isNotEmpty) data['invoice_date'] = dates[0];
    if (dates.length > 1) data['payment_date'] = dates[1];
    
    // Extract amounts - cari Rp
    final amountMatch = RegExp(r'Rp\s*([\d.,]+)').allMatches(cleanHtml);
    final amounts = amountMatch.map((m) => 'Rp ${m.group(1)}').toList();
    if (amounts.isNotEmpty) data['total'] = amounts.last;
    
    // Extract customer name - cari setelah "Ditagihkan Kepada" atau di customer-info h3
    final custMatch = RegExp(r'Ditagihkan\s+Kepada.*?</p>.*?<h3>([^<]+)</h3>', caseSensitive: false, dotAll: true).firstMatch(cleanHtml);
    data['customer'] = custMatch?.group(1)?.trim() ?? 
                       RegExp(r'<h3>([^<]+)</h3>').firstMatch(cleanHtml)?.group(1)?.trim() ?? 
                       'Pelanggan';
    
    // Extract email
    final emailMatch = RegExp(r'[\w.-]+@[\w.-]+\.\w+').firstMatch(cleanHtml);
    data['email'] = emailMatch?.group(0) ?? '-';
    
    // Extract kost name - cari di tabel booking-details kolom Kost
    // Cari pattern: <td> <strong>Nama Kost</strong><br>
    final kostMatch = RegExp(r'<td>\s*<strong>([^<]+)</strong><br>', caseSensitive: false, dotAll: true).firstMatch(cleanHtml);
    data['kost_name'] = kostMatch?.group(1)?.trim() ?? 
                       RegExp(r'<strong>([^<]+)</strong>\s*<small>', caseSensitive: false, dotAll: true).firstMatch(cleanHtml)?.group(1)?.trim() ?? 
                       'Kost';
    
    // Extract address - cari di <small> tag setelah kost name
    final addrMatch = RegExp(r'<small>([^<]+)</small>', caseSensitive: false).firstMatch(cleanHtml);
    data['address'] = addrMatch?.group(1)?.trim() ?? 'Jakarta';
    
    // Extract duration - cari "X bulan"
    final durMatch = RegExp(r'(\d+)\s*bulan', caseSensitive: false).firstMatch(cleanHtml);
    data['duration'] = durMatch != null ? '${durMatch.group(1)} bulan' : '1 bulan';
    
    // Extract payment method - cari setelah "Metode:"
    final methodMatch = RegExp(r'Metode[:\s]+([^<\n]+)', caseSensitive: false).firstMatch(cleanHtml);
    data['method'] = methodMatch?.group(1)?.trim() ?? 'Transfer';
    
    // Extract reference number
    final refMatch = RegExp(r'Referensi[:\s]+([^<\s]+)', caseSensitive: false).firstMatch(cleanHtml);
    data['reference'] = refMatch?.group(1) ?? '-';
    
    // Status
    data['status'] = cleanHtml.toLowerCase().contains('lunas') ? 'LUNAS' : 'PENDING';
    
    return data;
  }

  @override
  Widget build(BuildContext context) {
    final data = _parseInvoiceData(htmlContent);
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.primary, AppColors.primary.withGreen(200)],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                const Icon(Icons.receipt_long, size: 48, color: Colors.white),
                const SizedBox(height: 12),
                Text(
                  'INVOICE',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '#${data['invoice_number']}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: data['status'] == 'LUNAS' ? Colors.green : Colors.orange,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    data['status']!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Info Cards
          _buildInfoCard(Icons.person_outline, 'Ditagihkan Kepada', data['customer']!, data['email']!),
          
          const SizedBox(height: 12),
          
          // Kost Info
          _buildKostCard(data['kost_name']!, data['address']!, data['duration']!),
          
          const SizedBox(height: 12),
          
          // Payment Info
          _buildPaymentCard(data['total']!, data['method']!, data['reference']!),
          
          const SizedBox(height: 12),
          
          // Dates
          Row(
            children: [
              Expanded(
                child: _buildDateCard('Tanggal Invoice', data['invoice_date'] ?? '-'),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDateCard('Tanggal Bayar', data['payment_date'] ?? '-'),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Footer
          Text(
            'Terima kasih telah menggunakan layanan MyKost',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade500,
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 20),
          
          // Print Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.print),
              label: const Text('Print / Screenshot'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildInfoCard(IconData icon, String label, String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primary, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey.shade500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (subtitle != '-')
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildKostCard(String name, String address, String duration) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
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
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.home_outlined, color: Colors.blue, size: 20),
              ),
              const SizedBox(width: 12),
              const Text(
                'Detail Kost',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.blue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            name,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.location_on_outlined, size: 14, color: Colors.grey.shade400),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  address,
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Durasi: $duration',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPaymentCard(String total, String method, String reference) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
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
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.payment_outlined, color: Colors.green, size: 20),
              ),
              const SizedBox(width: 12),
              const Text(
                'Pembayaran',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total Pembayaran',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),
              Text(
                total,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Metode',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
              ),
              Text(
                method,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Referensi',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
              ),
              Text(
                reference,
                style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildDateCard(String label, String date) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
          ),
          const SizedBox(height: 4),
          Text(
            date,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}