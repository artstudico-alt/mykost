import 'package:flutter/material.dart';
import '../../utils/colors.dart';
import '../../api/api_service.dart';
import '../auth/login_screen.dart';
import '../payment/billing_screen.dart';
import '../payment/payment_history_screen.dart';
import 'hunian_saya_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _userData = ApiService.currentUser;
  bool _isLoading = ApiService.currentUser == null;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      if (ApiService.token == null) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }
      final response = await ApiService.me();
      if (response != null && response['data'] != null) {
        if (mounted) {
          setState(() {
            _userData = response['data'];
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /// Returns 1–2 uppercase initials from a name string.
  String _initials(String name) {
    if (name.trim().isEmpty) return 'GU';
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  /// Deterministic pastel-ish color from name.
  Color _avatarColor(String name) {
    final colors = [
      const Color(0xFF00B14F), // green
      const Color(0xFF6C63FF), // purple
      const Color(0xFFFF6B6B), // coral
      const Color(0xFFFF8C00), // orange
      const Color(0xFF00B4D8), // cyan
      const Color(0xFFE83E8C), // pink
    ];
    if (name.isEmpty) return colors[0];
    return colors[name.codeUnitAt(0) % colors.length];
  }

  // ─── Edit Profile bottom sheet ───────────────────────────────────────────────
  void _showEditProfile() {
    final nameCtrl = TextEditingController(text: _userData?['name'] ?? '');
    final emailCtrl = TextEditingController(text: _userData?['email'] ?? '');
    final phoneCtrl = TextEditingController(text: _userData?['phone'] ?? '');
    final passwordCtrl = TextEditingController();
    final confirmPasswordCtrl = TextEditingController();
    bool isSaving = false;
    bool isPasswordVisible = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
            height: MediaQuery.of(ctx).size.height * 0.85, // max height to prevent overflow
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Drag handle
                const SizedBox(height: 12),
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
                
                // Form Content inside ScrollView
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 36),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Preview avatar in sheet
                        Center(
                          child: _buildInitialsAvatar(
                            nameCtrl.text.trim().isNotEmpty 
                                ? nameCtrl.text 
                                : (_userData?['name'] != null && _userData!['name'].toString().trim().isNotEmpty 
                                    ? _userData!['name'] 
                                    : 'Guest User'),
                            radius: 36,
                            fontSize: 22,
                          ),
                        ),
                        const SizedBox(height: 20),

                        const Text(
                          'Edit Profil',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Sesuaikan data dirimu di bawah ini.',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 24),

                        // Name field
                        _sheetField(
                          label: 'Nama Lengkap',
                          controller: nameCtrl,
                          icon: Icons.person_outline_rounded,
                          onChanged: (_) => setSheetState(() {}),
                        ),
                        const SizedBox(height: 16),
                        
                        // Phone field
                        _sheetField(
                          label: 'Nomor Telepon',
                          controller: phoneCtrl,
                          icon: Icons.phone_outlined,
                          keyboardType: TextInputType.phone,
                        ),
                        const SizedBox(height: 16),

                        // Email field
                        _sheetField(
                          label: 'Email',
                          controller: emailCtrl,
                          icon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 16),
                        
                        // Separator for Password
                        const Divider(height: 32),
                        const Text(
                          'Ubah Kata Sandi',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        const Text(
                          'Kosongkan jika tidak ingin mengubah password.',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 16),

                        // Password field
                        _sheetField(
                          label: 'Password Baru',
                          controller: passwordCtrl,
                          icon: Icons.lock_outline_rounded,
                          isPassword: true,
                          obscureText: !isPasswordVisible,
                          onTogglePass: () => setSheetState(() => isPasswordVisible = !isPasswordVisible),
                        ),
                        const SizedBox(height: 16),

                        // Confirm Password field
                        _sheetField(
                          label: 'Ulangi Password',
                          controller: confirmPasswordCtrl,
                          icon: Icons.lock_outline_rounded,
                          isPassword: true,
                          obscureText: !isPasswordVisible,
                          onTogglePass: () => setSheetState(() => isPasswordVisible = !isPasswordVisible),
                        ),
                        const SizedBox(height: 32),

                        // Save button
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton(
                            onPressed: isSaving
                                ? null
                                : () async {
                                    if (passwordCtrl.text.isNotEmpty && passwordCtrl.text != confirmPasswordCtrl.text) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Password tidak cocok.'),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                      return;
                                    }

                                    setSheetState(() => isSaving = true);
                                    try {
                                      final Map<String, dynamic> updateData = {
                                        'name': nameCtrl.text.trim(),
                                        'email': emailCtrl.text.trim(),
                                        'phone': phoneCtrl.text.trim(),
                                      };
                                      
                                      if (passwordCtrl.text.isNotEmpty) {
                                        updateData['password'] = passwordCtrl.text;
                                        updateData['password_confirmation'] = confirmPasswordCtrl.text;
                                      }

                                      await ApiService.updateProfile(updateData);
                                      
                                      if (mounted) {
                                        Navigator.pop(ctx);
                                        await _loadProfile();
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: const Row(children: [
                                              Icon(Icons.check_circle, color: Colors.white, size: 18),
                                              SizedBox(width: 8),
                                              Text('Profil berhasil diperbarui'),
                                            ]),
                                            backgroundColor: AppColors.primary,
                                            behavior: SnackBarBehavior.floating,
                                            shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(12)),
                                          ),
                                        );
                                      }
                                    } catch (e) {
                                      setSheetState(() => isSaving = false);
                                      if (mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text('Gagal menyimpan: $e'),
                                            backgroundColor: Colors.red,
                                            behavior: SnackBarBehavior.floating,
                                            shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(12)),
                                          ),
                                        );
                                      }
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16)),
                            ),
                            child: isSaving
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(
                                        color: Colors.white, strokeWidth: 2.5))
                                : const Text(
                                    'Simpan Perubahan',
                                    style: TextStyle(
                                        fontSize: 15, fontWeight: FontWeight.bold),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _sheetField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    ValueChanged<String>? onChanged,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onTogglePass,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            onChanged: onChanged,
            obscureText: obscureText,
            style: const TextStyle(fontSize: 15, color: AppColors.textPrimary),
            decoration: InputDecoration(
              border: InputBorder.none,
              contentPadding:
                  const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
              prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
              suffixIcon: isPassword
                  ? IconButton(
                      icon: Icon(
                        obscureText ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        color: Colors.grey.shade400,
                        size: 20,
                      ),
                      onPressed: onTogglePass,
                    )
                  : null,
            ),
          ),
        ),
      ],
    );
  }

  // ─── Logout dialog ───────────────────────────────────────────────────────────
  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration:
                    BoxDecoration(color: Colors.red.shade50, shape: BoxShape.circle),
                child: const Icon(Icons.logout_rounded, color: Colors.red, size: 32),
              ),
              const SizedBox(height: 20),
              const Text(
                'Keluar dari Akun?',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary),
              ),
              const SizedBox(height: 8),
              const Text(
                'Kamu harus masuk kembali untuk menggunakan aplikasi.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 28),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(color: AppColors.border),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Batal',
                          style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        Navigator.pop(ctx);
                        showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (_) => const Center(
                              child: CircularProgressIndicator(
                                  color: AppColors.primary)),
                        );
                        try {
                          if (ApiService.token != null) await ApiService.logout();
                          if (mounted) {
                            Navigator.pop(context);
                            Navigator.of(context).pushAndRemoveUntil(
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                              (r) => false,
                            );
                          }
                        } catch (e) {
                          if (mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Gagal logout: $e')));
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Keluar',
                          style: TextStyle(fontWeight: FontWeight.bold)),
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

  // ─── Initials avatar ─────────────────────────────────────────────────────────
  Widget _buildInitialsAvatar(String name,
      {double radius = 48, double fontSize = 26}) {
    final initials = _initials(name);
    final color = _avatarColor(name);
    return CircleAvatar(
      radius: radius,
      backgroundColor: color,
      child: Text(
        initials,
        style: TextStyle(
          color: Colors.white,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
        ),
      ),
    );
  }

  // ─── Build ───────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final name = _userData?['name'] ?? 'Guest User';
    final email = _userData?['email'] ?? 'Email belum terkait';

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text(
          'Profil Saya',
          style: TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.bold,
              fontSize: 18),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              child: Column(
                children: [
                  // ── Header ─────────────────────────────────────────
                  Container(
                    width: double.infinity,
                    color: Colors.white,
                    padding: const EdgeInsets.fromLTRB(24, 36, 24, 32),
                    child: Column(
                      children: [
                        // Initials avatar — no camera button needed
                        Stack(
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                    color: _avatarColor(name).withOpacity(0.3),
                                    width: 4),
                              ),
                              child: _buildInitialsAvatar(name),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          name,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          email,
                          style: const TextStyle(
                              fontSize: 14, color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 20),
                        OutlinedButton.icon(
                          onPressed: _showEditProfile,
                          icon: const Icon(Icons.edit_rounded, size: 14),
                          label: const Text('Edit Profil'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            side: const BorderSide(color: AppColors.primary),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20)),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 8),
                            textStyle: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── Menu ───────────────────────────────────────────
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        _buildMenuItem(
                          icon: Icons.receipt_long_outlined,
                          label: 'Tagihan Saya',
                          color: const Color(0xFF6C63FF),
                          onTap: () => Navigator.push(context,
                              MaterialPageRoute(builder: (_) => const BillingScreen())),
                        ),
                        _divider(),
                        _buildMenuItem(
                          icon: Icons.history_rounded,
                          label: 'Riwayat Pembayaran',
                          color: const Color(0xFF00B14F),
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const PaymentHistoryScreen())),
                        ),
                        _divider(),
                        _buildMenuItem(
                          icon: Icons.home_work_rounded,
                          label: 'Hunian Saya',
                          color: const Color(0xFFFF8C00),
                          onTap: () => Navigator.push(context,
                              MaterialPageRoute(
                                  builder: (_) => HunianSayaScreen())),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // ── Logout button ──────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: GestureDetector(
                      onTap: _handleLogout,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Colors.red.shade400, Colors.red.shade600],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.red.withOpacity(0.25),
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.logout_rounded, color: Colors.white, size: 20),
                            SizedBox(width: 10),
                            Text(
                              'Keluar Akun',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 48),
                ],
              ),
            ),
    );
  }

  Widget _divider() =>
      const Divider(height: 1, indent: 72, color: Color(0xFFF0F0F0));

  Widget _buildMenuItem({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            Icon(Icons.chevron_right_rounded,
                color: Colors.grey.shade400, size: 22),
          ],
        ),
      ),
    );
  }
}
