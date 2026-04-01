import 'package:flutter/material.dart';

class AppColors {
  // Primary Green Palette (Dominant)
  static const primary = Color(0xFF10B981);      // Emerald 500 - Main brand color
  static const primaryDark = Color(0xFF059669);    // Emerald 600 - Darker shade
  static const primaryLight = Color(0xFF34D399); // Emerald 400 - Lighter shade
  static const primarySoft = Color(0xFF6EE7B7);  // Emerald 300 - Soft accent
  
  // Secondary Green Accents
  static const secondary = Color(0xFFDCFCE7);    // Green 100 - Very light green
  static const secondarySoft = Color(0xFFECFDF5); // Green 50 - Ultra light green
  static const accentGreen = Color(0xFF22C55E);  // Green 500
  static const limeAccent = Color(0xFF65A30D);   // Lime 600
  
  // Background Colors
  static const background = Color(0xFFF0FDF4);   // Green-tinted background
  static const surface = Color(0xFFFFFFFF);       // White surface
  static const cardBg = Color(0xFFFAFAFA);       // Card background
  
  // Text Colors
  static const textPrimary = Color(0xFF0F172A);   // Slate 900
  static const textSecondary = Color(0xFF64748B); // Slate 500
  static const textMuted = Color(0xFF94A3B8);     // Slate 400
  
  // Status Colors (All Green Variants)
  static const success = Color(0xFF10B981);      // Emerald 500
  static const warning = Color(0xFFF59E0B);      // Amber 500
  static const error = Color(0xFFEF4444);        // Red 500
  
  // Border & Divider
  static const border = Color(0xFFE2E8F0);       // Slate 200
  static const divider = Color(0xFFF1F5F9);      // Slate 100
  
  // Gradient Presets
  static const primaryGradient = LinearGradient(
    colors: [primaryDark, primary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const softGradient = LinearGradient(
    colors: [secondarySoft, secondary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}