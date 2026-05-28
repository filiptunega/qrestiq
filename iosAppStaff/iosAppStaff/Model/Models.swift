import Foundation

enum OrderStatus: String, Codable, CaseIterable {
    case pending, preparing, ready, completed, cancelled
    
    var displayTitle: String {
        switch self {
        case .pending: return "Pending"
        case .preparing: return "Preparing"
        case .ready: return "Ready"
        case .completed: return "Delivered"
        case .cancelled: return "Cancelled"
        }
    }
}

struct OrderItem: Codable, Identifiable {
    var id = UUID()
    let name: String
    let quantity: Int
    let price: Double
    
    enum CodingKeys: String, CodingKey {
        case name, quantity, price
    }
}

struct Order: Codable, Identifiable {
    let id: String
    let tableNumber: Int
    let status: OrderStatus
    let items: [OrderItem]
    let note: String?
    let total: Double
    let createdAt: String
    
    var parsedDate: Date? {
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: createdAt)
    }
}

enum TabFilter: String, CaseIterable {
    case all = "all"
    case pending = "pending"
    case preparing = "preparing"
    case ready = "ready"
    case delivered = "completed"
}

