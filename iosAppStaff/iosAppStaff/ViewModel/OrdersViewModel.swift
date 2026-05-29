import SwiftUI
import Foundation
import Combine

@MainActor
class OrdersViewModel: ObservableObject {
    @Published var orders: [Order] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedStatus: String = "all"

    private var pollingTask: Task<Void, Never>?

    var filteredOrders: [Order] {
        let visible = orders.filter { $0.status != "cancelled" }
        if selectedStatus == "all" { return visible }
        let target = selectedStatus == "delivered" ? ["delivered", "completed"] : [selectedStatus]
        return visible.filter { target.contains($0.status) }
    }

    func countFor(_ status: String) -> Int {
        if status == "all" { return orders.filter { $0.status != "cancelled" }.count }
        let target = status == "delivered" ? ["delivered", "completed"] : [status]
        return orders.filter { target.contains($0.status) }.count
    }

    func startPolling() {
        stopPolling()
        pollingTask = Task {
            while !Task.isCancelled {
                await loadOrders()
                try? await Task.sleep(nanoseconds: 10_000_000_000)
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }

    func loadOrders() async {
        do {
            let fetched = try await APIService.shared.fetchOrders()
            orders = fetched
            errorMessage = nil
        } catch AppError.unauthorized {
            errorMessage = "Session expired."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func advanceStatus(order: Order) async {
        guard let next = order.displayStatus.nextStatus else { return }
        do {
            try await APIService.shared.updateOrderStatus(id: order.id, status: next)
            await loadOrders()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteOrder(order: Order) async {
        do {
            try await APIService.shared.deleteOrder(id: order.id)
            await loadOrders()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func clearAllOrders() async {
        let toDelete = orders.filter { $0.status != "delivered" && $0.status != "completed" && $0.status != "cancelled" }
        await withTaskGroup(of: Void.self) { group in
            for order in toDelete {
                group.addTask { try? await APIService.shared.deleteOrder(id: order.id) }
            }
        }
        await loadOrders()
    }
}
