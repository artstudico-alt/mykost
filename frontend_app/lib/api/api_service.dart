import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Gunakan 127.0.0.1 untuk web/windows local, atau 10.0.2.2 jika menggunakan emulator Android
  static const String baseUrl = "http://127.0.0.1:8000/api";
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
        throw Exception(decoded['message'] ?? "Terjadi error");
      }
    } catch (e) {
      print("API Catch Error: $e");
      throw Exception("Invalid response dari server");
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

  // GET PROFILE
  static Future<dynamic> me() async {
    return await get("/auth/me");
  }

  // UPDATE PROFILE
  static Future<dynamic> updateProfile(Map<String, dynamic> data) async {
    return await put("/auth/profile", data);
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
    return await get("/search/kost?q=$query");
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

//DASHBOARD
  static Future<dynamic> getDashboard() async {
    return await get("/dashboard");
  }
}