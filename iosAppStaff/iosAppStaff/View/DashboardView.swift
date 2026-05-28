import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @State private var showClearConfirm = false
    
    var body: some View {
        ZStack {
            Color(hex: "#faf6f2").ignoresSafeArea()
            
            VStack(spacing: 0) {
                // TOP BAR
                VStack(spacing: 0) {
                    HStack(alignment: .center, spacing: 12) {
                        Image("logo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 45, height: 45)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(viewModel.currentMainTab == "orders" ? "Staff Dashboard" : "Menu Manager")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(Color(hex: "#0b2940"))
                            
                            Text(viewModel.currentMainTab == "orders" ? "Manage and track all incoming orders" : "Edit and configure customer menu items")
                                .font(.system(size: 12))
                                .foregroundColor(Color(hex: "#7b8a98"))
                        }
                        Spacer()
                        
                        Menu {
                            Button(role: .destructive, action: { showClearConfirm = true }) {
                                Label("🗑 Clear All Orders", systemImage: "trash")
                            }
                            Button(action: { viewModel.logout() }) {
                                Label("Logout", systemImage: "arrow.backward.square")
                            }
                        } label: {
                            Image(systemName: "line.3.horizontal")
                                .font(.title2)
                                .foregroundColor(Color(hex: "#0b2940"))
                                .padding(8)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    
                    // HLAVNÉ TABY
                    HStack(spacing: 0) {
                        Button(action: { viewModel.currentMainTab = "orders" }) {
                            VStack(spacing: 8) {
                                Text("Orders")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(viewModel.currentMainTab == "orders" ? Color(hex: "#0b2940") : Color(hex: "#7b8a98"))
                                Rectangle()
                                    .fill(viewModel.currentMainTab == "orders" ? Color(hex: "#0b2940") : Color.clear)
                                    .frame(height: 2)
                            }
                        }
                        
                        Button(action: { viewModel.currentMainTab = "menu" }) {
                            VStack(spacing: 8) {
                                Text("Menu Manager")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(viewModel.currentMainTab == "menu" ? Color(hex: "#0b2940") : Color(hex: "#7b8a98"))
                                Rectangle()
                                    .fill(viewModel.currentMainTab == "menu" ? Color(hex: "#0b2940") : Color.clear)
                                    .frame(height: 2)
                            }
                        }
                    }
                    .padding(.top, 4)
                }
                .background(Color.white)
                .overlay(VStack { Spacer(); Rectangle().fill(Color.gray.opacity(0.2)).frame(height: 1) })
                
                // OBSAH
                if viewModel.currentMainTab == "orders" {
                    // TABY OBJEDNÁVOK
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(TabFilter.allCases, id: \.self) { tab in
                                TabButton(tab: tab, count: viewModel.count(for: tab), isActive: viewModel.activeTab == tab) {
                                    viewModel.activeTab = tab
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                    }
                    .background(Color.white)
                    
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            let filtered = viewModel.filteredOrders()
                            if filtered.isEmpty {
                                EmptyStateView().padding(.top, 40)
                            } else {
                                ForEach(filtered) { order in
                                    OrderCardView(order: order)
                                }
                            }
                        }
                        .padding()
                    }
                } else {
                    MenuManagerView()
                        .environmentObject(viewModel)
                }
            }
        }
        .alert(isPresented: $showClearConfirm) {
            Alert(
                title: Text("Clear All"),
                message: Text("Are you sure you want to cancel all active orders?"),
                primaryButton: .destructive(Text("Yes")) { viewModel.clearAll() },
                secondaryButton: .cancel()
            )
        }
    }
}

// Subviews
struct TabButton: View {
    let tab: TabFilter
    let count: Int
    let isActive: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text("\(tab.rawValue.capitalized) (\(count))")
                .font(.system(size: 14, weight: .medium))
                .padding(.horizontal, 18)
                .padding(.vertical, 10)
                .background(backgroundColor)
                .foregroundColor(textColor)
                .cornerRadius(8)
        }
    }
    
    var backgroundColor: Color {
        if isActive { return Color(hex: "#0b2940") }
        switch tab {
        case .all: return Color(hex: "#faf6f2")
        case .pending: return Color(hex: "#fef3c7")
        case .preparing: return Color(hex: "#dbeafe")
        case .ready: return Color(hex: "#dcfce7")
        case .delivered: return Color(hex: "#e5e7eb")
        }
    }
    var textColor: Color { isActive ? .white : Color(hex: "#0b2940") }
}

struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 16) {
            Text("!")
                .font(.system(size: 24, weight: .semibold))
                .foregroundColor(Color(hex: "#7b8a98"))
                .frame(width: 52, height: 52)
                .overlay(Circle().stroke(Color(hex: "#7b8a98"), lineWidth: 2))
            Text("No orders found").font(.headline)
            Text("No orders have been placed yet.")
                .font(.subheadline)
                .foregroundColor(Color(hex: "#7b8a98"))
        }
    }
}
