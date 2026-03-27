import 'package:flutter/material.dart';
import '../../utils/colors.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/google_logo.dart';
import '../../api/api_service.dart';
import '../home/home_screen.dart';
import 'login_screen.dart';
import 'otp_verification_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final nameController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  bool isTermsAccepted = false;
  bool isLoading = false;

  @override
  void dispose() {
    nameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleRegister() async {
    final name = nameController.text.trim();
    final phone = phoneController.text.trim();
    final email = emailController.text.trim();
    final password = passwordController.text;
    final confirmPassword = confirmPasswordController.text;

    if (name.isEmpty || phone.isEmpty || email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Semua field wajib diisi.')),
      );
      return;
    }

    if (!isTermsAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan setujui Syarat dan Ketentuan.')),
      );
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password tidak cocok.')),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      await ApiService.register({
        'name': name,
        'phone': phone,
        'email': email,
        'password': password,
        'password_confirmation': confirmPassword,
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Registrasi berhasil! Silakan verifikasi email Anda.'),
          backgroundColor: AppColors.primary,
        ),
      );
      
      // Navigate to OTP verification screen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => OtpVerificationScreen(
            email: email,
            name: name,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(28),
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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Header ───────────────────────────────────────────
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.secondary,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.person_add_rounded,
                              color: AppColors.primary,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Buat Akun',
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              Text(
                                'Daftar dan temukan kost idamanmu',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),

                      const SizedBox(height: 28),

                      // ── Nama Lengkap ─────────────────────────────────────
                      CustomTextField(
                        label: 'Nama Lengkap',
                        hintText: 'Contoh: Budi Santoso',
                        prefixIcon: Icons.person_outline_rounded,
                        controller: nameController,
                        keyboardType: TextInputType.name,
                      ),
                      const SizedBox(height: 16),

                      // ── Nomor Telepon ────────────────────────────────────
                      _buildPhoneField(),
                      const SizedBox(height: 16),

                      // ── Email ────────────────────────────────────────────
                      CustomTextField(
                        label: 'Email',
                        hintText: 'example@email.com',
                        prefixIcon: Icons.alternate_email,
                        controller: emailController,
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 16),

                      // ── Password ─────────────────────────────────────────
                      CustomTextField(
                        label: 'Password',
                        hintText: '••••••••',
                        prefixIcon: Icons.lock_outline_rounded,
                        isPassword: true,
                        controller: passwordController,
                      ),
                      const SizedBox(height: 16),

                      // ── Konfirmasi Password ──────────────────────────────
                      CustomTextField(
                        label: 'Ulangi Password',
                        hintText: '••••••••',
                        prefixIcon: Icons.lock_outline_rounded,
                        isPassword: true,
                        controller: confirmPasswordController,
                      ),
                      const SizedBox(height: 20),

                      // ── Terms ────────────────────────────────────────────
                      _buildTermsRow(),
                      const SizedBox(height: 28),

                      // ── Daftar Button ────────────────────────────────────
                      isLoading
                          ? const Center(
                              child: CircularProgressIndicator(
                                  color: AppColors.primary))
                          : CustomButton(
                              title: 'Daftar',
                              onPressed: _handleRegister,
                            ),
                      const SizedBox(height: 24),

                      // ── Divider ──────────────────────────────────────────
                      Row(
                        children: [
                          Expanded(child: Divider(color: AppColors.border)),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'ATAU',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textSecondary.withOpacity(0.5),
                                letterSpacing: 1,
                              ),
                            ),
                          ),
                          Expanded(child: Divider(color: AppColors.border)),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // ── Google Button ────────────────────────────────────
                      _buildGoogleButton(),
                      const SizedBox(height: 28),

                      // ── Already have account ─────────────────────────────
                      Center(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              'Sudah punya akun? ',
                              style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 14),
                            ),
                            TextButton(
                              onPressed: () => Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(
                                    builder: (_) => const LoginScreen()),
                              ),
                              style: TextButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  minimumSize: Size.zero,
                                  tapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap),
                              child: const Text(
                                'Masuk',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Phone field ──────────────────────────────────────────────────────────
  Widget _buildPhoneField() {
    return CustomTextField(
      label: 'Nomor Telepon',
      hintText: '08123456789',
      prefixIcon: Icons.phone_outlined,
      controller: phoneController,
      keyboardType: TextInputType.phone,
    );
  }

  // ── Terms row ────────────────────────────────────────────────────────────
  Widget _buildTermsRow() {
    return GestureDetector(
      onTap: () => setState(() => isTermsAccepted = !isTermsAccepted),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: isTermsAccepted ? AppColors.primary : Colors.transparent,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: isTermsAccepted ? AppColors.primary : AppColors.border,
                width: 2,
              ),
            ),
            child: isTermsAccepted
                ? const Icon(Icons.check_rounded,
                    color: Colors.white, size: 14)
                : null,
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text.rich(
              TextSpan(
                text: 'Saya setuju dengan ',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                children: [
                  TextSpan(
                    text: 'Syarat & Ketentuan',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  TextSpan(text: ' yang berlaku.'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Google Button ────────────────────────────────────────────────────────
  Widget _buildGoogleButton() {
    return InkWell(
      onTap: () {},
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
          border: Border.all(color: AppColors.border, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            GoogleLogo(size: 22),
            SizedBox(width: 10),
            Text(
              'Daftar dengan Google',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                letterSpacing: 0.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}