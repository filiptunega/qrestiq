//
//  ColorExtention.swift
//  qrestiq
//
//  Created by Filip Tunega on 27/05/2026.
//


import SwiftUI
import Combine
import Foundation



// MARK: - FARBY
extension Color {
    static let bg = Color(hex: "faf6f2")
    static let primaryTheme = Color(hex: "0b2940")
    static let card = Color(hex: "ffffff")
    static let secondaryText = Color(hex: "7b8a98")
    static let chip = Color(hex: "f1ede8")
    static let success = Color(hex: "28a745")
    static let danger = Color(hex: "ff4d4d")
    
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue:  Double(b) / 255, opacity: Double(a) / 255)
    }
}