import SwiftUI
import Foundation
import Combine

@MainActor
class TablesViewModel: ObservableObject {
    @Published var tables: [RestaurantTable] = []
    @Published var showInactive = false
    @Published var isLoading = false
    @Published var errorMessage: String?

    // Modal
    @Published var showAddEdit = false
    @Published var editingTable: RestaurantTable?
    @Published var form = TableForm()
    @Published var formError = ""
    @Published var isSaving = false

    @Published var showDeleteConfirm = false
    @Published var deletingTable: RestaurantTable?
    @Published var isDeleting = false

    var visibleTables: [RestaurantTable] {
        (showInactive ? tables : tables.filter { $0.isActive })
            .sorted { $0.number < $1.number }
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            tables = try await APIService.shared.fetchTables()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func openAdd() {
        editingTable = nil
        form = TableForm()
        formError = ""
        showAddEdit = true
    }

    func openEdit(_ table: RestaurantTable) {
        editingTable = table
        form.number = "\(table.number)"
        form.isActive = table.isActive
        formError = ""
        showAddEdit = true
    }

    func save() async {
        formError = ""
        guard let num = Int(form.number), num >= 1 else {
            formError = "Please enter a positive table number."
            return
        }

        isSaving = true
        defer { isSaving = false }

        do {
            if let t = editingTable {
                try await APIService.shared.updateTable(id: t.id, number: num, isActive: form.isActive)
            } else {
                try await APIService.shared.createTable(number: num)
            }
            showAddEdit = false
            await load()
        } catch {
            formError = error.localizedDescription
        }
    }

    func toggleActive(_ table: RestaurantTable) async {
        do {
            try await APIService.shared.updateTable(id: table.id, number: table.number, isActive: !table.isActive)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func confirmDelete(_ table: RestaurantTable) {
        deletingTable = table
        showDeleteConfirm = true
    }

    func deleteConfirmed() async {
        guard let table = deletingTable else { return }
        isDeleting = true
        defer { isDeleting = false }
        do {
            try await APIService.shared.deleteTable(id: table.id)
            showDeleteConfirm = false
            deletingTable = nil
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
