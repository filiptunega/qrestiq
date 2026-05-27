//
//  MenuItemRow.swift
//  qrestiq
//
//  Created by Filip Tunega on 27/05/2026.
//
import SwiftUI

// MARK: - POLOŽKA MENU
struct MenuItemRow: View {
    let item: MenuItem
    @ObservedObject var cartManager: CartManager
    @State private var isAdded: Bool = false
    
    var body: some View {
        HStack(spacing: 16) {
            if let imgUrlText = item.img, let url = URL(string: imgUrlText) {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else if phase.error != nil {
                        placeholderImage
                    } else {
                        ProgressView()
                    }
                }
                .frame(width: 90, height: 90)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                placeholderImage
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.primaryTheme)
                
                Text(item.desc)
                    .font(.system(size: 13))
                    .foregroundColor(.secondaryText)
                    .lineLimit(2)
                
                Spacer(minLength: 8)
                
                HStack {
                    Text(String(format: "€%.2f", item.price))
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.primaryTheme)
                    
                    Spacer()
                    
                    Button(action: {
                        cartManager.addToCart(item: item)
                        triggerAddedFeedback()
                    }) {
                        Text(isAdded ? "Added ✓" : "Add +")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(isAdded ? Color.success : Color.primaryTheme)
                            .cornerRadius(20)
                    }
                }
            }
        }
        .padding(14)
        .background(Color.card)
        .cornerRadius(16)
        .shadow(color: Color.primaryTheme.opacity(0.03), radius: 6, y: 4)
    }
    
    private var placeholderImage: some View {
        RoundedRectangle(cornerRadius: 12)
            .fill(Color(hex: "f0f0f0"))
            .frame(width: 90, height: 90)
            .overlay(Image(systemName: "photo").foregroundColor(.secondaryText))
    }
    
    private func triggerAddedFeedback() {
        let impactMed = UIImpactFeedbackGenerator(style: .medium)
        impactMed.impactOccurred()
        
        withAnimation { isAdded = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            withAnimation { isAdded = false }
        }
    }
}
