//
//  CartManager.swift
//  qrestiq
//
//  Created by Filip Tunega on 27/05/2026.
//
import Combine
import Foundation
import SwiftUI

@MainActor
class CartManager: ObservableObject {
    @Published var items: [CartItem] = []
    @Published var tableNumber: String = ""
    @Published var note: String = ""
    
    @Published var showToast: Bool = false
    @Published var toastMessage: String = ""
    @Published var toastIsError: Bool = false
    
    @Published var isSubmitting: Bool = false
    
    var total: Double {
        items.reduce(0) { $0 + ($1.menuItem.price * Double($1.quantity)) }
    }
    
    var itemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }
    
    func addToCart(item: MenuItem) {
        if let index = items.firstIndex(where: { $0.id == item.id }) {
            items[index].quantity += 1
        } else {
            items.append(CartItem(menuItem: item, quantity: 1))
        }
    }
    
    func updateQuantity(for item: CartItem, delta: Int) {
        if let index = items.firstIndex(where: { $0.id == item.id }) {
            items[index].quantity += delta
            if items[index].quantity <= 0 {
                items.remove(at: index)
            }
        }
    }
    
    func submitOrder(availableTables: [Int]) async -> Bool {
        guard let tableInt = Int(tableNumber), availableTables.contains(tableInt) else {
            showToastMessage("Zadaj platné číslo stola.", isError: true)
            return false
        }
        
        isSubmitting = true
        
        let orderItems = items.map { OrderItemPayload(menuItemId: $0.menuItem.id, quantity: $0.quantity) }
        let payload = OrderPayload(tableNumber: tableInt, note: note.trimmingCharacters(in: .whitespacesAndNewlines), items: orderItems)
        
        guard let url = URL(string: "\(APIConfig.baseURL)/orders") else {
            isSubmitting = false
            return false
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONEncoder().encode(payload)
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse, !((200...299).contains(httpResponse.statusCode)) {
                let errResponse = try? JSONDecoder().decode(OrderResponse.self, from: data)
                let msg = errResponse?.errors?.joined(separator: "\n") ?? "Error sending order."
                showToastMessage(msg, isError: true)
                isSubmitting = false
                return false
            }
            
            let orderResponse = try? JSONDecoder().decode(OrderResponse.self, from: data)
            let orderIdText = orderResponse?.id != nil ? "#\(orderResponse!.id!) " : ""
            
            self.items.removeAll()
            self.note = ""
            self.isSubmitting = false
            
            showToastMessage("Objednávka \(orderIdText)bola úspešne odoslaná!", isError: false)
            return true
            
        } catch {
            print("Submit error: \(error)")
            showToastMessage("Nepodarilo sa odoslať objednávku. Skontrolujte pripojenie.", isError: true)
            isSubmitting = false
            return false
        }
    }
    
    func showToastMessage(_ message: String, isError: Bool = false) {
        toastMessage = message
        toastIsError = isError
        withAnimation { showToast = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            withAnimation { self.showToast = false }
        }
    }
}
