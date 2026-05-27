//
//  TableItem.swift
//  qrestiq
//
//  Created by Filip Tunega on 27/05/2026.
//


// MARK: - MODELY PRE API
struct TableItem: Codable {
    let number: Int
}

struct MenuItem: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let desc: String
    let price: Double
    let img: String?
}

struct CartItem: Identifiable, Equatable {
    var id: String { menuItem.id }
    let menuItem: MenuItem
    var quantity: Int
}

// Modely pre odoslanie objednávky
struct OrderItemPayload: Codable {
    let menuItemId: String
    let quantity: Int
}

struct OrderPayload: Codable {
    let tableNumber: Int
    let note: String
    let items: [OrderItemPayload]
}

struct OrderResponse: Codable {
    let id: String?
    let errors: [String]?
}