import SwiftUI
import Combine
import Foundation


// MARK: - HLAVNÁ OBRAZOVKA
struct ContentView: View {
    @StateObject private var menuVM = MenuViewModel()
    @StateObject private var cartManager = CartManager()
    @State private var activeCategory: String?
    @State private var showCart: Bool = false
    
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Color.bg.ignoresSafeArea()
            
            VStack(spacing: 0) {
                HStack {
                    Image("logo")
                        .resizable()
                        .scaledToFit()
                        .frame(height: 30)
                    Text("Qrestiq")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.primaryTheme)
                    Spacer()
                }
                .padding()
                .background(Color.card)
                .shadow(color: Color.primaryTheme.opacity(0.05), radius: 5, y: 2)
                
                if menuVM.isLoading {
                    Spacer()
                    ProgressView("Načítavam menu...")
                    Spacer()
                } else if let error = menuVM.errorMessage {
                    Spacer()
                    Text(error)
                        .foregroundColor(.danger)
                    Button("Skúsiť znova") {
                        Task { await menuVM.loadInitialData() }
                    }
                    .padding()
                    Spacer()
                } else {
                    ScrollViewReader { proxy in
                        // Chips Kategórie
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(menuVM.categories, id: \.self) { category in
                                    Text(category)
                                        .font(.system(size: 14, weight: .semibold))
                                        .padding(.horizontal, 18)
                                        .padding(.vertical, 10)
                                        .background(activeCategory == category ? Color.primaryTheme : Color.chip)
                                        .foregroundColor(activeCategory == category ? .white : .primaryTheme)
                                        .cornerRadius(20)
                                        // Unikátne ID pre čip
                                        .id("chip_\(category)")
                                        .onTapGesture {
                                            activeCategory = category
                                            withAnimation {
                                                // Skrolujeme na špecifické ID sekcie v zozname (anchor .top)
                                                proxy.scrollTo("section_\(category)", anchor: .top)
                                                // Zároveň vycentrujeme samotný čip v horizontálnom menu
                                                proxy.scrollTo("chip_\(category)", anchor: .center)
                                            }
                                        }
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                        }
                        .background(Color.card.opacity(0.95))
                        .overlay(Divider().background(Color.secondaryText.opacity(0.18)), alignment: .bottom)
                        
                        // Menu Zoznam
                        ScrollView {
                            VStack(alignment: .leading, spacing: 36) {
                                ForEach(menuVM.categories, id: \.self) { category in
                                    MenuSectionView(
                                        category: category,
                                        items: menuVM.menuData[category] ?? [],
                                        cartManager: cartManager
                                    )
                                    // Unikátne ID pre samotnú sekciu
                                    .id("section_\(category)")
                                }
                            }
                            .padding(16)
                            .padding(.bottom, 100)
                        }
                    }
                }
            }
            
            // Plávajúci Košík
            if cartManager.itemCount > 0 {
                Button(action: { showCart = true }) {
                    ZStack {
                        Circle()
                            .fill(Color.primaryTheme)
                            .frame(width: 60, height: 60)
                            .shadow(color: Color.primaryTheme.opacity(0.3), radius: 10, y: 5)
                        
                        Image(systemName: "cart")
                            .foregroundColor(.white)
                            .font(.system(size: 22, weight: .semibold))
                    }
                    .overlay(
                        Text("\(cartManager.itemCount)")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 22, height: 22)
                            .background(Color.danger)
                            .clipShape(Circle())
                            .offset(x: 5, y: -5)
                        , alignment: .topTrailing
                    )
                }
                .padding()
                .transition(.scale.combined(with: .opacity))
            }
            
            // Toast Notifikácia
            if cartManager.showToast {
                VStack {
                    HStack {
                        Image(systemName: cartManager.toastIsError ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                        Text(cartManager.toastMessage)
                    }
                    .font(.system(size: 14, weight: .semibold))
                    .padding()
                    .background(Color.card)
                    .foregroundColor(cartManager.toastIsError ? .danger : .success)
                    .cornerRadius(12)
                    .shadow(radius: 10)
                    .padding(.top, 50)
                    
                    Spacer()
                }
                .transition(.move(edge: .top).combined(with: .opacity))
                .zIndex(100)
            }
        }
        .sheet(isPresented: $showCart) {
            CartSheetView(cartManager: cartManager, availableTables: menuVM.availableTables, showCart: $showCart)
        }
        .preferredColorScheme(.light)
    }
}





