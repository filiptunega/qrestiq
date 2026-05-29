import SwiftUI

// MARK: - Brand Colors
extension Color {
    static let brandPrimary   = Color(red: 0.043, green: 0.161, blue: 0.251) // #0b2940
    static let brandBg        = Color(red: 0.980, green: 0.965, blue: 0.949) // #faf6f2
    static let brandSecondary = Color(red: 0.482, green: 0.541, blue: 0.596) // #7b8a98

    // Status colours
    static let pendingBg      = Color(hex: "fef9c3")
    static let pendingBorder  = Color(hex: "fde047")
    static let pendingText    = Color(hex: "92400e")

    static let preparingBg    = Color.white
    static let preparingBorder = Color(hex: "7ea9ff")
    static let preparingText  = Color(hex: "1462ff")

    static let readyBg        = Color.white
    static let readyBorder    = Color(hex: "0fd126")
    static let readyText      = Color(hex: "0db921")

    static let deliveredBg    = Color(hex: "eaeaea")
    static let deliveredBorder = Color(hex: "3e4147")
    static let deliveredText  = Color(hex: "3d3e40")

    static let dangerRed      = Color(hex: "dc2626")
    static let dangerRedBg    = Color(hex: "fef2f2")

    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8)  & 0xFF) / 255
        let b = Double(int         & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - Status helpers
extension OrderStatus {
    var cardBackground: Color {
        switch self {
        case .pending:   return .pendingBg
        case .preparing: return .white
        case .ready:     return .white
        case .delivered: return .deliveredBg
        }
    }
    var borderColor: Color {
        switch self {
        case .pending:   return .pendingBorder
        case .preparing: return .preparingBorder
        case .ready:     return .readyBorder
        case .delivered: return .deliveredBorder
        }
    }
    var textColor: Color {
        switch self {
        case .pending:   return .pendingText
        case .preparing: return .preparingText
        case .ready:     return .readyText
        case .delivered: return .deliveredText
        }
    }
    var actionButtonColor: Color {
        switch self {
        case .pending:   return Color(hex: "2563eb")
        case .preparing: return .readyText
        case .ready:     return .brandPrimary
        case .delivered: return .gray
        }
    }
    var tabBackground: Color {
        switch self {
        case .pending:   return Color(hex: "fef3c7")
        case .preparing: return Color(hex: "dbeafe")
        case .ready:     return Color(hex: "dcfce7")
        case .delivered: return Color(hex: "e5e7eb")
        }
    }
}

// MARK: - Reusable View Modifiers
struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

extension View {
    func cardStyle() -> some View { modifier(CardStyle()) }
}
