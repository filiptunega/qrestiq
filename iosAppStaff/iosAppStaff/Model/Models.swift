import Foundation

// MARK: - Order Models
struct Order: Identifiable, Codable {
    let id: Int
    let tableNumber: Int   // API: table_number  → decoded via .convertFromSnakeCase
    var status: String
    let items: [OrderItem]
    let total: Double      // FIX: if API sends String, use FlexibleDouble below
    let note: String?
    let createdAt: String  // API: created_at → decoded via .convertFromSnakeCase

    var displayStatus: OrderStatus {
        if status == "completed" { return .delivered }
        return OrderStatus(rawValue: status) ?? .pending
    }
}

struct OrderItem: Codable {
    let name: String
    let quantity: Int
    let price: Double      // FIX: if API sends String, use FlexibleDouble below
}

enum OrderStatus: String, CaseIterable {
    case pending, preparing, ready, delivered

    var label: String {
        switch self {
        case .pending:   return "⏰ Pending"
        case .preparing: return "📦 Preparing"
        case .ready:     return "✅ Ready"
        case .delivered: return "🚚 Delivered"
        }
    }

    var color: String {
        switch self {
        case .pending:   return "pending"
        case .preparing: return "preparing"
        case .ready:     return "ready"
        case .delivered: return "delivered"
        }
    }

    var nextStatus: String? {
        switch self {
        case .pending:   return "preparing"
        case .preparing: return "ready"
        case .ready:     return "completed"
        case .delivered: return nil
        }
    }

    var actionLabel: String? {
        switch self {
        case .pending:   return "📦 Start Preparing"
        case .preparing: return "✅ Mark as Ready"
        case .ready:     return "🚚 Mark as Delivered"
        case .delivered: return nil
        }
    }
}

// MARK: - Menu Models
struct MenuItem: Identifiable, Codable {
    let id: Int
    var name: String
    var category: String
    var description: String?
    var price: Double         // API: price → Double alebo String
    var imgUrl: String?       // API: img_url → imgUrl via .convertFromSnakeCase
    var isActive: Bool        // API: is_active → isActive via .convertFromSnakeCase
    var sortOrder: Int        // API: sort_order → sortOrder via .convertFromSnakeCase
}

// MARK: - Table Models
struct RestaurantTable: Identifiable, Codable {
    let id: Int
    var number: Int
    var isActive: Bool        // API: is_active → isActive via .convertFromSnakeCase
}

// MARK: - Auth
struct LoginResponse: Codable {
    let token: String
}

struct APIError: Codable {
    let message: String?
}

// MARK: - FlexibleDouble (use this if price/total comes as String OR Double from API)
// Replace `var price: Double` with `var price: FlexibleDouble` if needed.
struct FlexibleDouble: Codable {
    let value: Double

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let d = try? container.decode(Double.self) {
            value = d
        } else if let s = try? container.decode(String.self), let d = Double(s) {
            value = d
        } else {
            throw DecodingError.typeMismatch(Double.self,
                .init(codingPath: decoder.codingPath, debugDescription: "Expected Double or String"))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(value)
    }
}

// MARK: - Form Models
struct MenuItemForm {
    var name: String = ""
    var category: String = ""
    var description: String = ""
    var price: String = ""
    var sortOrder: String = "0"
    var imgUrl: String = ""
    var isActive: Bool = true

    mutating func load(from item: MenuItem) {
        name = item.name
        category = item.category
        description = item.description ?? ""
        price = String(format: "%.2f", item.price)
        sortOrder = "\(item.sortOrder)"
        imgUrl = item.imgUrl ?? ""
        isActive = item.isActive
    }
}

struct TableForm {
    var number: String = ""
    var isActive: Bool = true
}
