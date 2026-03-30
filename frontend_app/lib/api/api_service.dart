import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http_parser/http_parser.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show File;

class ApiService {
  // Gunakan localhost jika dijalankan langsung di laptop (Windows/Chrome)
  static const String baseUrl = "http://127.0.0.1:8000/api";
  // static const String baseUrl = "http://192.168.0.111:8000/api"; 

  
  static String? token;
  static Map<String, dynamic>? currentUser;
  static late SharedPreferences _prefs;

  // Initialize storage and load cached data
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    token = _prefs.getString('token');
    
    String? userJson = _prefs.getString('user_data');
    if (userJson != null) {
      try {
        currentUser = jsonDecode(userJson);
      } catch (e) {
        print("Error decoding cached user: $e");
      }
    }
  }

  static Future<void> _saveAuthData(String token, Map<String, dynamic> user) async {
    ApiService.token = token;
    ApiService.currentUser = user;
    await _prefs.setString('token', token);
    await _prefs.setString('user_data', jsonEncode(user));
  }

//HEADER
  static Map<String, String> get headers {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      if (token != null) "Authorization": "Bearer $token",
    };
  }

//UPLOAD (MULTIPART)
  static Future<dynamic> uploadImage(PlatformFile file) async {
    final url = Uri.parse("$baseUrl/upload");
    final request = http.MultipartRequest('POST', url);
    
    // Headers (Use Accept but not Content-Type)
    request.headers.addAll({
      "Accept": "application/json",
      if (token != null) "Authorization": "Bearer $token",
    });

    if (kIsWeb) {
      if (file.bytes == null) throw Exception("File bytes are null");
      request.files.add(http.MultipartFile.fromBytes(
        'image',
        file.bytes!,
        filename: file.name,
        contentType: MediaType('image', file.extension ?? 'jpg'),
      ));
    } else {
      if (file.path == null) throw Exception("File path is null");
      request.files.add(await http.MultipartFile.fromPath(
        'image',
        file.path!,
        contentType: MediaType('image', file.extension ?? 'jpg'),
      ));
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    return _handleResponse(response);
  }

//GET
  static Future<dynamic> get(String endpoint) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response = await http.get(url, headers: headers);

    return _handleResponse(response);
  }

//POST
  static Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode(data),
    );

    return _handleResponse(response);
  }

//PUT
  static Future<dynamic> put(String endpoint, Map<String, dynamic> data) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response = await http.put(
      url,
      headers: headers,
      body: jsonEncode(data),
    );

    return _handleResponse(response);
  }

//PATCH
  static Future<dynamic> patch(String endpoint, Map<String, dynamic> data) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response = await http.post( // Changed to POST for multipart workaround if needed, but keeping logic
      url,
      headers: headers,
      body: jsonEncode(data),
    );

    return _handleResponse(response);
  }

//DELETE
  static Future<dynamic> delete(String endpoint) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response = await http.delete(url, headers: headers);

    return _handleResponse(response);
  }

//HANDLE RESPON
  static dynamic _handleResponse(http.Response response) {
    final body = response.body;

    try {
      final decoded = jsonDecode(body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return decoded;
      } else {
        print("API Error Response: $decoded");

// Ambil message utama
final msg = decoded['message']?.toString() ?? "Terjadi error";

// Ambil detail error (jika ada)
final detail = decoded['error']?.toString();

// Tangani validasi Laravel (errors array)
if (decoded['errors'] != null && decoded['errors'] is Map) {
  final errors = decoded['errors'] as Map;
  if (errors.isNotEmpty) {
    final firstErrorList = errors.values.first;
    if (firstErrorList is List && firstErrorList.isNotEmpty) {
      throw Exception(firstErrorList.first);
    }
  }
}

// Gabungkan message + detail
throw Exception(
  detail != null && detail.isNotEmpty ? "$msg ($detail)" : msg
);
      }
    } catch (e) {
      print("API Catch Error: $e");
      
      if (e is Exception && e.toString().contains("Exception:")) {
        rethrow;
      }

      // Jika body bukan JSON (misal HTML error page dari Laravel)
      if (response.statusCode >= 500) {
        throw Exception("Server Error (500). Silakan cek koneksi database atau log server.");
      } else if (response.statusCode == 404) {
        throw Exception("Endpoint tidak ditemukan (404).");
      } else if (response.statusCode == 405) {
        throw Exception("Method tidak diizinkan (405).");
      }

      throw Exception("Respon server tidak valid. Pastikan server sudah berjalan dengan benar.");
    }
  }

//AUTH
  // LOGIN
  static Future<dynamic> login(String email, String password) async {
    final response = await post("/auth/login", {
      "email": email,
      "password": password,
    });

    // simpan token dan user
    if (response['token'] != null && response['user'] != null) {
      await _saveAuthData(response['token'], response['user']);
    }

    return response;
  }

  // REGISTER
  static Future<dynamic> register(Map<String, dynamic> data) async {
    return await post("/auth/register", data);
  }

  // VERIFY OTP (Updated 'otp' -> 'kode' based on Backend AuthController)
  static Future<dynamic> verifyOtp(String email, String kode) async {
    final response = await post("/auth/verify-otp", {
      "email": email,
      "kode": kode,
    });

    if (response['token'] != null && response['user'] != null) {
      await _saveAuthData(response['token'], response['user']);
    }

    return response;
  }

  // RESEND OTP
  static Future<dynamic> resendOtp(String email) async {
    return await post("/auth/resend-otp", {
      "email": email,
    });
  }

  // FORGOT PASSWORD
  static Future<dynamic> forgotPassword(String email) async {
    return await post("/auth/forgot-password", {
      "email": email,
    });
  }

  // RESET PASSWORD (Updated 'otp' -> 'kode' and added password_confirmation)
  static Future<dynamic> resetPassword(String email, String kode, String password, String passwordConfirmation) async {
    return await post("/auth/reset-password", {
      "email": email,
      "kode": kode,
      "password": password,
      "password_confirmation": passwordConfirmation,
    });
  }

  // GET PROFILE
  static Future<dynamic> me() async {
    final response = await get("/auth/me");
    // Karena backend kirim field 'user' tapi frontend cari field 'data', kita map di sini agar ngga perlu ngerubah backend
    if (response is Map && response.containsKey('user')) {
      return {
        ...response,
        'data': response['user'],
      };
    }
    return response;
  }

  // UPDATE PROFILE
  static Future<dynamic> updateProfile(Map<String, dynamic> data, {PlatformFile? file}) async {
    dynamic response;
    
    if (file == null) {
      response = await post("/auth/update-profile", data);
    } else {
      final url = Uri.parse("$baseUrl/auth/update-profile");
      final request = http.MultipartRequest('POST', url);
      
      request.headers.addAll({
        "Accept": "application/json",
        if (token != null) "Authorization": "Bearer $token",
      });

      // Add text fields (Convert all values to String for Multipart)
      final Map<String, String> stringFields = data.map((key, value) => MapEntry(key, value.toString()));
      request.fields.addAll(stringFields);

      // Add file
      if (kIsWeb) {
        if (file.bytes == null) throw Exception("File bytes are null");
        request.files.add(http.MultipartFile.fromBytes(
          'ktp_photo',
          file.bytes!,
          filename: file.name,
          contentType: MediaType('image', file.extension ?? 'jpg'),
        ));
      } else {
        if (file.path == null) throw Exception("File path is null");
        request.files.add(await http.MultipartFile.fromPath(
          'ktp_photo',
          file.path!,
          contentType: MediaType('image', file.extension ?? 'jpg'),
        ));
      }

      final streamedResponse = await request.send();
      final httpResponse = await http.Response.fromStream(streamedResponse);
      response = _handleResponse(httpResponse);
    }
    
    // Update cached user data if successful
    if (response['user'] != null) {
      currentUser = response['user'];
      await _prefs.setString('user_data', jsonEncode(currentUser));
    }
    
    return response;
  }

  // LOGOUT
  static Future<dynamic> logout() async {
    try {
      await post("/auth/logout", {});
    } catch (_) {}
    
    token = null;
    currentUser = null;
    await _prefs.remove('token');
    await _prefs.remove('user_data');
    
    return {"message": "Logged out"};
  }

//KOST
  static Future<dynamic> getKost() async {
    return await get("/kost");
  }

  static Future<dynamic> getDetailKost(int id) async {
    return await get("/kost/$id");
  }

//SEARCH
  static Future<dynamic> searchKostByKantor() async {
    return await get("/search/kost-by-kantor");
  }

  static Future<dynamic> searchKost(String query) async {
    return await get("/search/kost?search=$query");
  }

//BOOKING
  static Future<dynamic> createBooking(Map<String, dynamic> data) async {
    return await post("/booking", data);
  }

  static Future<dynamic> getBooking() async {
    return await get("/booking");
  }

  static Future<dynamic> confirmBooking(int id) async {
    return await patch("/booking/$id/confirm", {});
  }

  static Future<dynamic> cancelBooking(int id) async {
    return await patch("/booking/$id/cancel", {});
  }

//PEMBAYARAN
  static Future<dynamic> createPembayaran(Map<String, dynamic> data) async {
    return await post("/pembayaran", data);
  }

  static Future<dynamic> getPembayaran() async {
    return await get("/pembayaran");
  }

//HUNIAN
  static Future<dynamic> getHunianSaya() async {
    return await get("/hunian/saya");
  }

  static Future<dynamic> getRiwayatHunian() async {
    return await get("/hunian/riwayat");
  }

//KELUHAN
  static Future<dynamic> getKeluhan() async {
    return await get("/keluhan");
  }

  static Future<dynamic> getDetailKeluhan(int id) async {
    return await get("/keluhan/$id");
  }

  static Future<dynamic> createKeluhan(Map<String, dynamic> data) async {
    return await post("/keluhan", data);
  }

//DASHBOARD
  static Future<dynamic> getDashboard() async {
    return await get("/dashboard");
  }
}