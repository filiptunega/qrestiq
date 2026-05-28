import SwiftUI
import Combine

class AppViewModel: ObservableObject {
    let baseURL = "http://172.20.10.5/api" // Uprav podľa svojej lokálnej IP alebo domény
    
    @AppStorage("token") var token: String = ""
    @AppStorage("ordersCache") var ordersCache: Data = Data()
    
    // Auth & Orders
    @Published var isAuthenticated: Bool = false
    @Published var orders: [Order] = []
    @Published var activeTab: TabFilter = .all
    
    // Menu Manager
    @Published var currentMainTab: String = "orders" // "orders" alebo "menu"
    @Published var menuItems: [MenuItem] = []
    @Published var menuCategories: [String] = ["All Categories"]
    @Published var selectedCategoryFilter: String = "All Categories"
    @Published var showInactiveItems: Bool = true
    
    private var timer: AnyCancellable?
    
    init() {
        isAuthenticated = !token.isEmpty
        if isAuthenticated {
            loadCachedOrders()
            startPolling()
        }
    }
    
    // MARK: - Auth
    func login(email: String, pass: String) {
        guard let url = URL(string: "\(baseURL)/auth/login") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = ["email": email, "password": pass]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let data = data, let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any], let newToken = json["token"] as? String {
                    self.token = newToken
                    self.isAuthenticated = true
                    self.startPolling()
                } else {
                    print("Login failed")
                }
            }
        }.resume()
    }
    
    func logout() {
        token = ""
        isAuthenticated = false
        stopPolling()
        orders = []
        menuItems = []
    }
    
    // MARK: - API Helpers
    private var authHeaders: [String: String] {
        return [
            "Content-Type": "application/json",
            "Authorization": "Bearer \(token)"
        ]
    }
    
    // MARK: - Orders Polling & Methods
    func startPolling() {
        fetchOrders()
        timer = Timer.publish(every: 10, on: .main, in: .common).autoconnect().sink { _ in
            if self.isAuthenticated { self.fetchOrders() }
        }
    }
    
    func stopPolling() {
        timer?.cancel()
    }
    
    func fetchOrders() {
        guard let url = URL(string: "\(baseURL)/orders") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        for (key, value) in authHeaders { request.setValue(value, forHTTPHeaderField: key) }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 401 {
                    self.logout()
                    return
                }
                if let data = data {
                    self.ordersCache = data
                    self.loadCachedOrders()
                }
            }
        }.resume()
    }
    
    func loadCachedOrders() {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        if let decoded = try? decoder.decode([Order].self, from: ordersCache) {
            self.orders = decoded
        }
    }
    
    func updateOrderStatus(id: String, nextStatus: String) {
        guard let url = URL(string: "\(baseURL)/orders/\(id)/status") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        for (key, value) in authHeaders { request.setValue(value, forHTTPHeaderField: key) }
        let body = ["status": nextStatus]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { _, response, _ in
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                DispatchQueue.main.async { self.fetchOrders() }
            }
        }.resume()
    }
    
    func deleteOrder(id: String) {
        updateOrderStatus(id: id, nextStatus: "cancelled")
    }
    
    func clearAll() {
        let activeIds = orders.filter { $0.status != .completed && $0.status != .cancelled }.map { $0.id }
        let dispatchGroup = DispatchGroup()
        
        for id in activeIds {
            dispatchGroup.enter()
            guard let url = URL(string: "\(baseURL)/orders/\(id)/status") else { dispatchGroup.leave(); continue }
            var request = URLRequest(url: url)
            request.httpMethod = "PATCH"
            for (key, value) in authHeaders { request.setValue(value, forHTTPHeaderField: key) }
            let body = ["status": "cancelled"]
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
            
            URLSession.shared.dataTask(with: request) { _, _, _ in
                dispatchGroup.leave()
            }.resume()
        }
        
        dispatchGroup.notify(queue: .main) {
            self.fetchOrders()
        }
    }
    
    func filteredOrders() -> [Order] {
        let activeOrders = orders.filter { $0.status != .cancelled }
        switch activeTab {
        case .all: return activeOrders
        case .pending: return activeOrders.filter { $0.status == .pending }
        case .preparing: return activeOrders.filter { $0.status == .preparing }
        case .ready: return activeOrders.filter { $0.status == .ready }
        case .delivered: return activeOrders.filter { $0.status == .completed }
        }
    }
    
    func count(for tab: TabFilter) -> Int {
        let activeOrders = orders.filter { $0.status != .cancelled }
        switch tab {
        case .all: return activeOrders.count
        case .pending: return activeOrders.filter { $0.status == .pending }.count
        case .preparing: return activeOrders.filter { $0.status == .preparing }.count
        case .ready: return activeOrders.filter { $0.status == .ready }.count
        case .delivered: return activeOrders.filter { $0.status == .completed }.count
        }
    }
    
    // MARK: - Menu Methods
        func fetchMenuItems() {
            // Zmenené na admin endpoint podľa staff.js
            guard let url = URL(string: "\(baseURL)/menu/admin/all") else { return }
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            for (key, value) in authHeaders { request.setValue(value, forHTTPHeaderField: key) }
            
            URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("❌ Sieťová chyba: \(error.localizedDescription)")
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 401 {
                    DispatchQueue.main.async { self.logout() }
                    return
                }
                
                if let data = data {
                    do {
                        let decoded = try JSONDecoder().decode([MenuItem].self, from: data)
                        DispatchQueue.main.async {
                            self.menuItems = decoded
                            // Namiesto lokálneho parsovania stiahneme kategórie z backendu tak ako v JS
                            self.fetchMenuCategories()
                        }
                    } catch {
                        print("❌ Chyba pri dekódovaní JSON (Menu): \(error)")
                        if let stringData = String(data: data, encoding: .utf8) {
                            print("📦 Prijatý JSON z backendu: \(stringData)")
                        }
                    }
                }
            }.resume()
        }
        
        // Nová funkcia na základe 'refreshCategoryOptions()' zo staff.js
        func fetchMenuCategories() {
            guard let url = URL(string: "\(baseURL)/menu/admin/categories") else { return }
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            for (key, value) in authHeaders { request.setValue(value, forHTTPHeaderField: key) }
            
            URLSession.shared.dataTask(with: request) { data, response, error in
                if let httpResponse = response as? HTTPURLResponse, !((200...299).contains(httpResponse.statusCode)) {
                    return // potichu ignorujeme podobne ako v JS (!res.ok)
                }
                
                if let data = data {
                    do {
                        let decoded = try JSONDecoder().decode([String].self, from: data)
                        DispatchQueue.main.async {
                            self.menuCategories = ["All Categories"] + decoded
                        }
                    } catch {
                        print("❌ Chyba pri dekódovaní JSON (Kategórie): \(error)")
                    }
                }
            }.resume()
        }
        
        func saveMenuItem(_ item: MenuItem, completion: @escaping (String?) -> Void) {
            let isEdit = item.id != nil
            let urlString = isEdit ? "\(baseURL)/menu/\(item.id!)" : "\(baseURL)/menu"
            guard let url = URL(string: urlString) else { return }
            
            var request = URLRequest(url: url)
            request.httpMethod = isEdit ? "PUT" : "POST"
            for (key, value) in authHeaders { request.setValue(value, forHTTPHeaderField: key) }
            request.httpBody = try? JSONEncoder().encode(item)
            
            URLSession.shared.dataTask(with: request) { data, response, error in
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 401 { DispatchQueue.main.async { self.logout() }; return }
                    if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                        DispatchQueue.main.async { self.fetchMenuItems(); completion(nil) }
                        return
                    }
                }
                var errorMsg = "Save failed."
                if let data = data, let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any], let msg = json["message"] as? String {
                    errorMsg = msg
                }
                DispatchQueue.main.async { completion(errorMsg) }
            }.resume()
        }
        
        func deleteMenuItem(id: String) { // 👈 ZMENENÉ z (id: Int) na (id: String)
            guard let url = URL(string: "\(baseURL)/menu/\(id)") else { return }
            var request = URLRequest(url: url)
            request.httpMethod = "DELETE"
            for (key, value) in authHeaders { request.setValue(value, forHTTPHeaderField: key) }
            
            URLSession.shared.dataTask(with: request) { _, response, _ in
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 401 {
                    DispatchQueue.main.async { self.logout() }
                    return
                }
                DispatchQueue.main.async { self.fetchMenuItems() }
            }.resume()
        }
        
        func filteredMenuItems() -> [MenuItem] {
            return menuItems.filter { item in
                let matchCategory = selectedCategoryFilter == "All Categories" || item.category == selectedCategoryFilter
                // Oprava JS logiky (filter podľa isActive ak showInactiveItems je false)
                let matchVisibility = showInactiveItems ? true : (item.isActive == true)
                return matchCategory && matchVisibility
            }
        }
}
