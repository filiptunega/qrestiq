import Foundation

class APIService {
    static let shared = APIService()
    private init() {}

    private let baseURL = "http://172.20.10.5/api" // <- Replace with your API URL

    // MARK: - Decoder / Encoder with snake_case support
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase  // ← FIX: handles snake_case → camelCase
        return d
    }()

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .convertToSnakeCase    // ← FIX: sends camelCase → snake_case
        return e
    }()

    private var token: String? {
        get { UserDefaults.standard.string(forKey: "auth_token") }
        set { UserDefaults.standard.set(newValue, forKey: "auth_token") }
    }

    var isLoggedIn: Bool { token != nil }

    func saveToken(_ t: String) {
        token = t
        print("🔑 [API] Token successfully saved.")
    }
    
    func clearToken() {
        token = nil
        print("🗑️ [API] Token cleared.")
    }

    private func authHeaders() -> [String: String] {
        var h = ["Content-Type": "application/json"]
        if let t = token { h["Authorization"] = "Bearer \(t)" }
        return h
    }

    // MARK: - Auth
    func login(email: String, password: String) async throws -> String {
        print("🚀 [API] Login attempt for user: \(email)")
        let url = URL(string: "\(baseURL)/auth/login")!
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.allHTTPHeaderFields = ["Content-Type": "application/json"]
        req.httpBody = try JSONEncoder().encode(["email": email, "password": password])
        
        let (data, res) = try await URLSession.shared.data(for: req)
        guard let http = res as? HTTPURLResponse else {
            print("❌ [API] Login failed: Invalid HTTP response")
            throw AppError.network
        }
        
        if !http.isSuccess {
            let e = try? decoder.decode(APIError.self, from: data)
            print("❌ [API] Login failed with status code \(http.statusCode). Message: \(e?.message ?? "None")")
            throw AppError.message(e?.message ?? "Incorrect credentials.")
        }
        
        let resp = try decoder.decode(LoginResponse.self, from: data)
        print("✅ [API] Login successful. Token received.")
        return resp.token
    }

    // MARK: - Orders
    func fetchOrders() async throws -> [Order] {
        try await get("/orders")
    }

    func updateOrderStatus(id: Int, status: String) async throws {
        try await patch("/orders/\(id)/status", body: ["status": status])
    }

    func deleteOrder(id: Int) async throws {
        try await patch("/orders/\(id)/status", body: ["status": "cancelled"])
    }

    // MARK: - Menu
    func fetchMenuItems() async throws -> [MenuItem] {
        try await get("/menu/admin/all")
    }

    func fetchMenuCategories() async throws -> [String] {
        try await get("/menu/admin/categories")
    }

    func createMenuItem(_ payload: [String: Any]) async throws {
        try await postJSON("/menu", body: payload)
    }

    func updateMenuItem(id: Int, payload: [String: Any]) async throws {
        try await putJSON("/menu/\(id)", body: payload)
    }

    func deleteMenuItem(id: Int) async throws {
        try await delete("/menu/\(id)")
    }

    func reorderMenu(items: [[String: Any]]) async throws {
        try await patchJSON("/menu/reorder", body: ["items": items])
    }

    // MARK: - Tables
    func fetchTables() async throws -> [RestaurantTable] {
        try await get("/tables/all")
    }

    func createTable(number: Int) async throws {
        try await postJSON("/tables", body: ["number": number])
    }

    func updateTable(id: Int, number: Int, isActive: Bool) async throws {
        // NOTE: Send snake_case keys manually since we use [String: Any] not Encodable
        try await putJSON("/tables/\(id)", body: ["number": number, "is_active": isActive])
    }

    func deleteTable(id: Int) async throws {
        try await delete("/tables/\(id)")
    }

    // MARK: - Generic Helpers
    private func get<T: Decodable>(_ path: String) async throws -> T {
        print("📡 [API] GET Request -> Path: \(path)")
        let url = URL(string: "\(baseURL)\(path)")!
        var req = URLRequest(url: url)
        req.allHTTPHeaderFields = authHeaders()
        
        let (data, res) = try await URLSession.shared.data(for: req)
        let statusCode = (res as? HTTPURLResponse)?.statusCode ?? 0
        
        try checkAuth(res)
        
        guard (res as? HTTPURLResponse)?.isSuccess == true else {
            print("❌ [API] GET failed. Path: \(path), Status code: \(statusCode)")
            throw AppError.network
        }
        
        do {
            let decodedData = try decoder.decode(T.self, from: data)
            print("✅ [API] GET successful. Path: \(path) (Status: \(statusCode))")
            return decodedData
        } catch {
            // Log the raw JSON to help debug
            if let raw = String(data: data, encoding: .utf8) {
                print("❌ [API] Decoding error for path \(path).")
                print("📄 [API] Raw JSON: \(raw.prefix(500))")
            }
            print("❌ [API] Decode error detail: \(error)")
            throw error
        }
    }

    private func patch(_ path: String, body: [String: Any]) async throws {
        try await sendJSON(path, method: "PATCH", body: body)
    }

    private func patchJSON(_ path: String, body: [String: Any]) async throws {
        try await sendJSON(path, method: "PATCH", body: body)
    }

    private func postJSON(_ path: String, body: [String: Any]) async throws {
        try await sendJSON(path, method: "POST", body: body)
    }

    private func putJSON(_ path: String, body: [String: Any]) async throws {
        try await sendJSON(path, method: "PUT", body: body)
    }

    private func delete(_ path: String) async throws {
        print("🗑️ [API] DELETE Request -> Path: \(path)")
        let url = URL(string: "\(baseURL)\(path)")!
        var req = URLRequest(url: url)
        req.httpMethod = "DELETE"
        req.allHTTPHeaderFields = authHeaders()
        
        let (_, res) = try await URLSession.shared.data(for: req)
        let statusCode = (res as? HTTPURLResponse)?.statusCode ?? 0
        
        try checkAuth(res)
        
        guard (res as? HTTPURLResponse)?.isSuccess == true else {
            print("❌ [API] DELETE failed. Path: \(path), Status code: \(statusCode)")
            throw AppError.network
        }
        print("✅ [API] DELETE successful. Path: \(path) (Status: \(statusCode))")
    }

    private func sendJSON(_ path: String, method: String, body: [String: Any]) async throws {
        print("📤 [API] \(method) Request -> Path: \(path)")
        let url = URL(string: "\(baseURL)\(path)")!
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.allHTTPHeaderFields = authHeaders()
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, res) = try await URLSession.shared.data(for: req)
        let statusCode = (res as? HTTPURLResponse)?.statusCode ?? 0
        
        try checkAuth(res)
        
        guard (res as? HTTPURLResponse)?.isSuccess == true else {
            print("❌ [API] \(method) failed. Path: \(path), Status code: \(statusCode)")
            if let raw = String(data: data, encoding: .utf8) {
                print("📄 [API] Response: \(raw.prefix(300))")
            }
            throw AppError.network
        }
        print("✅ [API] \(method) successful. Path: \(path) (Status: \(statusCode))")
    }

    private func checkAuth(_ response: URLResponse) throws {
        if (response as? HTTPURLResponse)?.statusCode == 401 {
            print("⚠️ [API] Status code 401 (Unauthorized) detected. Logging out...")
            clearToken()
            throw AppError.unauthorized
        }
    }
}

enum AppError: LocalizedError {
    case network
    case unauthorized
    case message(String)

    var errorDescription: String? {
        switch self {
        case .network:        return "Network error. Please try again."
        case .unauthorized:   return "Session expired. Please log in again."
        case .message(let m): return m
        }
    }
}

extension HTTPURLResponse {
    var isSuccess: Bool { (200...299).contains(statusCode) }
}
