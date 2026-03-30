import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../utils/colors.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../api/api_service.dart';

class RentalApplicationScreen extends StatefulWidget {
  final Map<String, dynamic> kost;

  const RentalApplicationScreen({super.key, required this.kost});

  @override
  State<RentalApplicationScreen> createState() => _RentalApplicationScreenState();
}

class _RentalApplicationScreenState extends State<RentalApplicationScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;
  bool _isLoading = false;

  // Step 1
  final nameController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();

  // Step 2
  final nikController = TextEditingController();
  PlatformFile? _ktpFile;

  // Step 3
  DateTime selectedDate = DateTime.now();
  int durationMonths = 1;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    try {
      final response = await ApiService.me();
      if (response != null && response['data'] != null) {
        final u = response['data'];
        setState(() {
          nameController.text = u['name'] ?? '';
          emailController.text = u['email'] ?? '';
          phoneController.text = u['phone'] ?? '';
          nikController.text = u['nik'] ?? '';
        });
      }
    } catch (_) {}
  }

  Future<void> _pickKtpImage() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
    );

    if (result != null && result.files.isNotEmpty) {
      setState(() {
        _ktpFile = result.files.first;
      });
    }
  }

  void _nextPage() {
    if (_currentStep < 3) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousPage() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _submitBooking() async {
    if (_ktpFile == null && nikController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Mohon lengkapi NIK dan Foto KTP"), backgroundColor: Colors.orange),
      );
      _pageController.animateToPage(1, duration: const Duration(milliseconds: 300), curve: Curves.ease);
      return;
    }

    setState(() => _isLoading = true);
    try {
      // 1. Update Profile (Phone, NIK, and Foto KTP as Multipart)
      await ApiService.updateProfile({
        'phone': phoneController.text,
        'nik': nikController.text,
      }, file: _ktpFile);

      // 2. Create Booking
      final kostId = widget.kost['id'] ?? widget.kost['kost_id'] ?? 1;
      final bookingResponse = await ApiService.createBooking({
        'kost_id': kostId,
        'tanggal_mulai': "${selectedDate.year}-${selectedDate.month.toString().padLeft(2,'0')}-${selectedDate.day.toString().padLeft(2,'0')}",
        'durasi_bulan': durationMonths,
        'catatan': 'Booking via Mobile App (${widget.kost['nama_kost']})',
      });

      final bookingId = bookingResponse['data']['id'];
      
      // Calculate total for payment
      final String currentPriceStr = widget.kost['price'] ?? "Rp 0";
      final totalHarga = bookingResponse['data']['total_harga'] ?? _calculateTotalDouble(currentPriceStr, durationMonths);

      // 3. Inisiasi Pembayaran Midtrans
      final paymentRes = await ApiService.createPembayaran({
        'booking_id': bookingId,
        'jumlah': totalHarga,
        'keterangan': 'Pembayaran DP Kost: ${widget.kost['nama_kost']}',
      });

      final String? redirectUrl = paymentRes['redirect_url'];
      
      if (redirectUrl != null) {
        if (!mounted) return;
        
        // Menampilkan Dialog Sukses & Tombol Pembayaran
        // Ini diperlukan agar browser tidak memblokir popup (karena dipicu klik user langsung)
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Column(
              children: [
                Icon(Icons.check_circle_outline, color: Colors.green, size: 64),
                SizedBox(height: 16),
                Text("Booking Berhasil!", textAlign: TextAlign.center),
              ],
            ),
            content: const Text(
              "Pesanan Anda telah diterima. Silakan klik tombol di bawah untuk melanjutkan pembayaran via Midtrans.",
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
            actions: [
              Column(
                children: [
                  CustomButton(
                    title: "Bayar Sekarang",
                    onPressed: () async {
                      final Uri url = Uri.parse(redirectUrl);
                      await launchUrl(url, mode: LaunchMode.externalApplication);
                      if (mounted) {
                        Navigator.of(context).pop(); // Close dialog
                        Navigator.of(this.context).pop(); // Back to home
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).pop(); // Close dialog
                      Navigator.of(this.context).pop(); // Back to home
                    },
                    child: const Text("Bayar Nanti (Cek di Hunian Saya)", style: TextStyle(color: AppColors.textSecondary)),
                  ),
                ],
              ),
            ],
          ),
        );

      } else {
        throw "Gagal mendapatkan link pembayaran dari server";
      }

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Gagal: $e"), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    nameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    nikController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: _buildStepper(),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        onPageChanged: (index) {
          setState(() {
            _currentStep = index;
          });
        },
        children: [
          _buildStep1(),
          _buildStep2(),
          _buildStep3(),
          _buildStep4(),
        ],
      ),
    );
  }

  Widget _buildStepper() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(4, (index) {
        return Container(
          width: 40,
          height: 4,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: index <= _currentStep ? AppColors.primary : Colors.grey.shade300,
            borderRadius: BorderRadius.circular(2),
          ),
        );
      }),
    );
  }

  Widget _buildStep1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                "Tertarik dengan Properti Ini?",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                "Dapatkan info lebih lanjut terkait properti ini langsung dari pemilik.",
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary.withOpacity(0.7)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              CustomTextField(
                label: "Nama Lengkap",
                hintText: "Masukkan nama lengkap",
                controller: nameController,
              ),
              const SizedBox(height: 20),
              CustomTextField(
                label: "Nomor HP / WhatsApp",
                hintText: "+62 8xx xxxx xxxx",
                controller: phoneController,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 20),
              CustomTextField(
                label: "Email Aktif",
                hintText: "nama@email.com",
                controller: emailController,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 32),
              CustomButton(
                title: "Lanjut",
                onPressed: _nextPage,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep2() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                "Lengkapi Data Diri",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                "Data ini diperlukan untuk verifikasi identitas penyewa.",
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary.withOpacity(0.7)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              CustomTextField(
                label: "Nomor KTP (NIK)",
                hintText: "1234567890123456",
                controller: nikController,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 20),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "Foto KTP",
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                ),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _pickKtpImage,
                child: Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _ktpFile != null ? AppColors.primary : Colors.grey.shade300, 
                      style: BorderStyle.solid,
                      width: _ktpFile != null ? 2 : 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _ktpFile != null ? Icons.check_circle : Icons.cloud_upload_outlined, 
                        size: 32, 
                        color: _ktpFile != null ? AppColors.primary : AppColors.textSecondary.withOpacity(0.5)
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _ktpFile != null ? _ktpFile!.name : "Klik untuk upload foto KTP",
                        style: TextStyle(
                          fontSize: 13, 
                          color: _ktpFile != null ? AppColors.primary : AppColors.textSecondary.withOpacity(0.5),
                          fontWeight: _ktpFile != null ? FontWeight.bold : FontWeight.normal,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: Colors.grey),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: _previousPage,
                      child: const Text("Kembali", style: TextStyle(color: AppColors.textPrimary)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: CustomButton(
                      title: "Lanjut",
                      onPressed: _nextPage,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep3() {
    // Priority: Raw Numeric Field -> Display String
    final dynamic rawPrice = widget.kost['harga_min'] ?? widget.kost['harga_per_bulan'];
    final String priceStr = widget.kost['price'] ?? (rawPrice != null ? "Rp $rawPrice/bulan" : "Rp 0");
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                "Pilih Durasi Sewa",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                "Tentukan kapan kamu akan mulai menempati kost ini.",
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary.withOpacity(0.7)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "Mulai Kost dari Bulan",
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                ),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: selectedDate,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setState(() {
                      selectedDate = picked;
                    });
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.textPrimary.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "${selectedDate.day}/${selectedDate.month}/${selectedDate.year}",
                        style: const TextStyle(color: Colors.white),
                      ),
                      const Icon(Icons.calendar_today, color: Colors.white, size: 20),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "Durasi Sewa (Bulan)",
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: AppColors.textPrimary.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: DropdownButton<int>(
                  value: durationMonths,
                  isExpanded: true,
                  dropdownColor: AppColors.textPrimary,
                  underline: const SizedBox(),
                  icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white),
                  items: [1, 3, 6, 12].map((m) => DropdownMenuItem(
                    value: m,
                    child: Text("$m Bulan", style: const TextStyle(color: Colors.white)),
                  )).toList(),
                  onChanged: (v) {
                    setState(() {
                      durationMonths = v!;
                    });
                  },
                ),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("Harga per Bulan", style: TextStyle(fontSize: 13, color: AppColors.textSecondary.withOpacity(0.7))),
                        Text(priceStr, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Total Estimasi", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        Text(
                          _getDisplayTotal(priceStr, durationMonths),
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: Colors.grey),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: _previousPage,
                      child: const Text("Kembali", style: TextStyle(color: AppColors.textPrimary)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: CustomButton(
                      title: "Lanjut ke Pembayaran",
                      onPressed: _nextPage,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep4() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.credit_card, size: 48, color: Colors.blue),
              const SizedBox(height: 24),
              const Text(
                "Siap untuk Pembayaran?",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                "Klik tombol di bawah untuk melanjutkan ke gerbang pembayaran aman.",
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary.withOpacity(0.7)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.blue.withOpacity(0.1)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                        children: [
                          const TextSpan(text: "Properti: "),
                          TextSpan(
                            text: widget.kost['nama_kost'] ?? "Kost Pilihan",
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text("Mulai: ${selectedDate.day}/${selectedDate.month}/${selectedDate.year}", style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text("Durasi: $durationMonths Bulan", style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  onPressed: _isLoading ? null : _submitBooking,
                  child: _isLoading 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                    : const Text("Konfirmasi & Bayar", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
              const SizedBox(height: 24),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text(
                  "Batalkan",
                  style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getDisplayTotal(String priceStr, int months) {
    try {
      final double total = _calculateTotalDouble(priceStr, months);
      if (total >= 1000000) {
        return "Rp ${(total / 1000000).toStringAsFixed(1)} Juta";
      }
      return "Rp ${total.toInt()}";
    } catch (e) {
      return "Rp 0";
    }
  }

  double _calculateTotalDouble(String priceStr, int months) {
    try {
      // 1. Cek numeric field langsung dari map jika ada
      final dynamic rawPrice = widget.kost['harga_min'] ?? widget.kost['harga_per_bulan'];
      if (rawPrice != null) {
        return (double.tryParse(rawPrice.toString()) ?? 0) * months;
      }

      // 2. Fallback: Parse dari string "Rp 1,5 Juta/bulan" atau "Rp 1.500.000"
      String clean = priceStr.replaceAll("Rp ", "").replaceAll("Rp", "").split("/")[0].trim();
      
      bool isJuta = clean.contains("Juta");
      if (isJuta) {
        clean = clean.replaceAll(" Juta", "").replaceAll("Juta", "").replaceAll(",", ".");
        return (double.tryParse(clean) ?? 0) * 1000000 * months;
      }

      // Handle dots as thousand separators (e.g., 1.500.000)
      clean = clean.replaceAll(".", "");
      return (double.tryParse(clean) ?? 0) * months;
    } catch (e) {
      return 0.0;
    }
  }
}


