//
//  CartSheetView.swift
//  qrestiq
//
//  Created by Filip Tunega on 27/05/2026.
//
import SwiftUI

// MARK: - KOŠÍK (SHEET MODAL)
struct CartSheetView: View {
    @ObservedObject var cartManager: CartManager
    let availableTables: [Int]
    @Binding var showCart: Bool
    
    var isTableValid: Bool {
        if let num = Int(cartManager.tableNumber) {
            return availableTables.contains(num)
        }
        return false
    }
    
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Your Order")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.primaryTheme)
                Spacer()
                Button(action: { showCart = false }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.secondaryText)
                        .frame(width: 36, height: 36)
                        .background(Color.chip)
                        .clipShape(Circle())
                }
            }
            .padding()
            .background(Color.card)
            
            Divider()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    
                    // Stôl
                    VStack(alignment: .leading, spacing: 8) {
                        Text("TABLE SELECTION")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.secondaryText)
                        
                        TextField("Enter table number", text: $cartManager.tableNumber)
                            .keyboardType(.numberPad)
                            .padding(14)
                            .background(Color.card)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(!cartManager.tableNumber.isEmpty && !isTableValid ? Color.danger : Color.secondaryText.opacity(0.2), lineWidth: 1)
                            )
                        
                        if !cartManager.tableNumber.isEmpty && !isTableValid {
                            Text("Table not available")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.danger)
                        }
                    }
                    
                    // Položky
                    VStack(spacing: 12) {
                        ForEach(cartManager.items) { item in
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(item.menuItem.name)
                                        .font(.system(size: 15, weight: .bold))
                                    Text(String(format: "€%.2f each", item.menuItem.price))
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(.secondaryText)
                                }
                                
                                Spacer()
                                
                                HStack(spacing: 16) {
                                    Button("-") { cartManager.updateQuantity(for: item, delta: -1) }
                                        .frame(width: 34, height: 34)
                                        .background(Color.chip)
                                        .clipShape(Circle())
                                    
                                    Text("\(item.quantity)")
                                        .font(.system(size: 16, weight: .bold))
                                    
                                    Button("+") { cartManager.updateQuantity(for: item, delta: 1) }
                                        .frame(width: 34, height: 34)
                                        .background(Color.chip)
                                        .clipShape(Circle())
                                }
                                .foregroundColor(.primaryTheme)
                            }
                            .padding(16)
                            .background(Color.card)
                            .cornerRadius(14)
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.secondaryText.opacity(0.1), lineWidth: 1))
                        }
                    }
                    
                    // Poznámka
                    VStack(alignment: .leading, spacing: 8) {
                        Text("ORDER NOTE")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.secondaryText)
                        
                        TextField("Any special requests? (e.g., no onions)", text: $cartManager.note, axis: .vertical)
                            .lineLimit(3...6)
                            .padding(14)
                            .background(Color.card)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.secondaryText.opacity(0.2), lineWidth: 1))
                    }
                }
                .padding()
            }
            .background(Color.bg)
            
            // Footer
            VStack {
                Button(action: {
                    Task {
                        let success = await cartManager.submitOrder(availableTables: availableTables)
                        if success { showCart = false }
                    }
                }) {
                    Text(cartManager.isSubmitting ? "Sending..." : "Submit Order – \(String(format: "€%.2f", cartManager.total))")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(18)
                        .background(!isTableValid || cartManager.items.isEmpty ? Color.secondaryText.opacity(0.6) : Color.primaryTheme)
                        .cornerRadius(14)
                }
                .disabled(!isTableValid || cartManager.items.isEmpty || cartManager.isSubmitting)
            }
            .padding()
            .background(Color.card)
            .overlay(Divider(), alignment: .top)
        }
        .preferredColorScheme(.light)
    }
}
