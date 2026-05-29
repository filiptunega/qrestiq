import SwiftUI

// MARK: - Order Card
struct OrderCardView: View {
    let order: Order
    let onAdvance: () async -> Void
    let onDelete: () async -> Void

    @State private var isAdvancing = false
    @State private var isDeleting = false
    @State private var showDeleteConfirm = false

    var body: some View {
        let status = order.displayStatus
        VStack(alignment: .leading, spacing: 0) {

            // Header row
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Table \(order.tableNumber)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.brandPrimary)
                    Text("#\(order.id)")
                        .font(.system(size: 12))
                        .foregroundColor(.brandSecondary)
                    Text(formattedTime(order.createdAt))
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "6b7280"))
                }
                Spacer()
                Text(status.label)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(status.textColor)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(status.tabBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .padding(.bottom, 12)

            Divider().padding(.bottom, 10)

            // Items
            VStack(alignment: .leading, spacing: 4) {
                Text("Order Items:")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.brandPrimary)
                    .padding(.bottom, 2)

                ForEach(order.items, id: \.name) { item in
                    HStack {
                        Text("\(item.quantity)x \(item.name)")
                            .font(.system(size: 14))
                            .foregroundColor(.brandPrimary)
                        Spacer()
                        Text("€\(String(format: "%.2f", item.price * Double(item.quantity)))")
                            .font(.system(size: 14))
                            .foregroundColor(.brandPrimary)
                    }
                }
            }
            .padding(.bottom, 10)

            // Note
            if let note = order.note, !note.isEmpty {
                HStack(alignment: .top, spacing: 6) {
                    Text("📝")
                    Text(note)
                        .font(.system(size: 13, weight: .medium))
                }
                .foregroundColor(Color(hex: "b91c1c"))
                .padding(10)
                .background(Color(hex: "fee2e2"))
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .padding(.bottom, 10)
            }

            Divider().padding(.bottom, 10)

            // Total
            HStack {
                Text("Total")
                    .font(.system(size: 14))
                Spacer()
                Text("€\(String(format: "%.2f", order.total))")
                    .font(.system(size: 15, weight: .bold))
            }
            .foregroundColor(.brandPrimary)
            .padding(.bottom, 12)

            // Action buttons
            VStack(spacing: 8) {
                if let actionLabel = status.actionLabel {
                    Button {
                        Task {
                            isAdvancing = true
                            await onAdvance()
                            isAdvancing = false
                        }
                    } label: {
                        HStack {
                            if isAdvancing { ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white)).scaleEffect(0.8) }
                            Text(actionLabel)
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 11)
                        .background(status.actionButtonColor)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(isAdvancing)
                }

                Button {
                    showDeleteConfirm = true
                } label: {
                    Text("🗑 Delete Order")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.dangerRed)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 11)
                        .background(Color.dangerRedBg)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
        .padding(16)
        .background(status.cardBackground)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(status.borderColor, lineWidth: 2))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .confirmationDialog("Delete Order?", isPresented: $showDeleteConfirm, titleVisibility: .visible) {
            Button("Delete", role: .destructive) {
                Task {
                    isDeleting = true
                    await onDelete()
                    isDeleting = false
                }
            }
            Button("Cancel", role: .cancel) {}
        }
    }

    private func formattedTime(_ iso: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = f.date(from: iso) {
            let df = DateFormatter()
            df.dateFormat = "HH:mm"
            return df.string(from: date)
        }
        return iso
    }
}

// MARK: - Orders View
struct OrdersView: View {
    @StateObject private var vm = OrdersViewModel()
    @State private var showClearConfirm = false

    private let statusTabs = [
        ("all", "All"),
        ("pending", "Pending"),
        ("preparing", "Preparing"),
        ("ready", "Ready"),
        ("delivered", "Delivered")
    ]

    var body: some View {
        VStack(spacing: 0) {

            // Status filter tabs
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(statusTabs, id: \.0) { key, label in
                        statusTabButton(key: key, label: label)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .background(Color.white)
            .overlay(Divider(), alignment: .bottom)

            // Clear all button
            HStack {
                Spacer()
                Button {
                    showClearConfirm = true
                } label: {
                    Label("Clear All", systemImage: "trash")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Color.dangerRed)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
            .padding(.trailing, 16)
            .padding(.vertical, 10)
            .background(Color.brandBg)

            // Orders list
            if vm.filteredOrders.isEmpty {
                emptyState
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(vm.filteredOrders) { order in
                            OrderCardView(
                                order: order,
                                onAdvance: { await vm.advanceStatus(order: order) },
                                onDelete:  { await vm.deleteOrder(order: order) }
                            )
                        }
                    }
                    .padding(16)
                }
            }
        }
        .background(Color.brandBg)
        .task { await vm.loadOrders() }
        .onAppear { vm.startPolling() }
        .onDisappear { vm.stopPolling() }
        .confirmationDialog("Delete all orders?", isPresented: $showClearConfirm, titleVisibility: .visible) {
            Button("Delete All", role: .destructive) { Task { await vm.clearAllOrders() } }
            Button("Cancel", role: .cancel) {}
        }
        .alert("Error", isPresented: Binding(
            get: { vm.errorMessage != nil },
            set: { if !$0 { vm.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(vm.errorMessage ?? "")
        }
    }

    private func statusTabButton(key: String, label: String) -> some View {
        let count = vm.countFor(key)
        let isActive = vm.selectedStatus == key

        let bg: Color = {
            if isActive { return .brandPrimary }
            switch key {
            case "pending":   return Color(hex: "fef3c7")
            case "preparing": return Color(hex: "dbeafe")
            case "ready":     return Color(hex: "dcfce7")
            case "delivered": return Color(hex: "e5e7eb")
            default:          return Color.brandBg
            }
        }()

        return Button {
            vm.selectedStatus = key
        } label: {
            Text("\(label) (\(count))")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(isActive ? .white : .brandPrimary)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(bg)
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Spacer()
            ZStack {
                Circle()
                    .stroke(Color.brandSecondary, lineWidth: 2)
                    .frame(width: 52, height: 52)
                Text("!")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.brandSecondary)
            }
            Text("No orders")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.brandPrimary)
            Text("No orders have been placed yet.")
                .font(.system(size: 14))
                .foregroundColor(.brandSecondary)
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}
