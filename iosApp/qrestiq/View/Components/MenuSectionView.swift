//
//  MenuSectionView.swift
//  qrestiq
//
//  Created by Filip Tunega on 27/05/2026.
//
import SwiftUI

// MARK: - SEKCOVÉ MENU
struct MenuSectionView: View {
    let category: String
    let items: [MenuItem]
    @ObservedObject var cartManager: CartManager
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(category)
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.primaryTheme)
                .padding(.leading, 4)
            
            ForEach(items) { item in
                MenuItemRow(item: item, cartManager: cartManager)
            }
        }
    }
}
