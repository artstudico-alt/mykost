import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Gunakan localhost jika dijalankan langsung di laptop (Windows/Chrome)
  static const String baseUrl = "http://127.0.0.1:8000/api";
  // static const String baseUrl = "http://192.168.0.111:8000/api"; 

  
  static String? token;

//HEADER
  static Map<String, String> get headers {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      if (token != null) "Authorization": "Bearer $token",
    };
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

    final response = await http.patch(
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

    // simpan token
    token = response['token'];

    return response;
  }

  // REGISTER
  static Future<dynamic> register(Map<String, dynamic> data) async {
    return await post("/auth/register", data);
  }

  // VERIFY OTP (Updated 'otp' -> 'kode' based on Backend AuthController)
  static Future<dynamic> verifyOtp(String email, String kode) async {
    return await post("/auth/verify-otp", {
      "email": email,
      "kode": kode,
    });
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
  static Future<dynamic> updateProfile(Map<String, dynamic> data) async {
    return await post("/auth/update-profile", data);
  }

  // LOGOUT
  static Future<dynamic> logout() async {
    final response = await post("/auth/logout", {});
    token = null;
    return response;
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