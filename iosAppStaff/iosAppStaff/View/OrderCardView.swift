import SwiftUI

struct OrderCardView: View {
    @EnvironmentObject var viewModel: AppViewModel
    let order: Order
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Table \(order.tableNumber)").font(.headline)
                    Text("#\(order.id)").font(.caption).foregroundColor(.gray)
                    Text(timeString).font(.caption).foregroundColor(.gray)
                }
                Spacer()
                Text(statusIconAndLabel)
                    .font(.footnote).bold()
                    .foregroundColor(statusTextColor)
            }
            
            VStack(alignment: .leading, spacing: 6) {
                Text("Order Items:").font(.subheadline).bold()
                ForEach(order.items) { item in
                    HStack {
                        Text("\(item.quantity)x \(item.name)")
                        Spacer()
                        Text(String(format: "€%.2f", Double(item.quantity) * item.price))
                    }
                    .font(.subheadline)
                }
            }
            
            if let note = order.note, !note.isEmpty {
                Text("📝 \(note)")
                    .font(.footnote)
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(6)
            }
            
            Divider()
            
            HStack {
                Text("Total").font(.subheadline)
                Spacer()
                Text(String(format: "€%.2f", order.total)).font(.headline)
            }
            
            if let nextActionText = actionButtonText, let nextStatus = nextStatus {
                Button(action: { viewModel.updateOrderStatus(id: order.id, nextStatus: nextStatus.rawValue) }) {
                    Text(nextActionText)
                        .bold()
                        .frame(maxWidth: .infinity)
                        .padding(10)
                        .background(actionButtonColor)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }
            
            Button(action: { viewModel.deleteOrder(id: order.id) }) {
                Text("🗑 Delete Order")
                    .bold()
                    .frame(maxWidth: .infinity)
                    .padding(10)
                    .background(Color(hex: "#fef2f2"))
                    .foregroundColor(Color(hex: "#dc2626"))
                    .cornerRadius(10)
            }
        }
        .padding(16)
        .background(cardBackgroundColor)
        .cornerRadius(14)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(cardBorderColor, lineWidth: 2))
        .foregroundColor(Color(hex: "#0b2940"))
    }
    
    var timeString: String {
        guard let date = order.parsedDate else { return "" }
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
    
    var statusIconAndLabel: String {
        switch order.status {
        case .pending: return "⏰ Pending"
        case .preparing: return "📦 Preparing"
        case .ready: return "✅ Ready"
        case .completed: return "🚚 Delivered"
        default: return ""
        }
    }
    
    var cardBackgroundColor: Color {
        switch order.status {
        case .pending: return Color(hex: "#fef9c3")
        case .completed: return Color(hex: "#eaeaea")
        default: return .white
        }
    }
    
    var cardBorderColor: Color {
        switch order.status {
        case .pending: return Color(hex: "#fde047")
        case .preparing: return Color(hex: "#7ea9ff")
        case .ready: return Color(hex: "#0fd126")
        case .completed: return Color(hex: "#3e4147")
        default: return .clear
        }
    }
    
    var statusTextColor: Color {
        switch order.status {
        case .pending: return Color(hex: "#92400e")
        case .preparing: return Color(hex: "#1462ff")
        case .ready: return Color(hex: "#0db921")
        case .completed: return Color(hex: "#3d3e40")
        default: return .black
        }
    }
    
    var actionButtonText: String? {
        switch order.status {
        case .pending: return "📦 Start Preparing"
        case .preparing: return "✅ Mark as ready"
        case .ready: return "🚚 Mark as delivered"
        default: return nil
        }
    }
    
    var nextStatus: OrderStatus? {
        switch order.status {
        case .pending: return .preparing
        case .preparing: return .ready
        case .ready: return .completed
        default: return nil
        }
    }
    
    var actionButtonColor: Color {
        switch order.status {
        case .pending: return Color(hex: "#2563eb")
        case .preparing: return Color(hex: "#0db921")
        case .ready: return Color(hex: "#0b2940")
        default: return .clear
        }
    }
}
