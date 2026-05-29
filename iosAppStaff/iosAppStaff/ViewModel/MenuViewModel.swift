import SwiftUI
import Foundation
import Combine

@MainActor
class MenuViewModel: ObservableObject {
    @Published var items: [MenuItem] = []
    @Published var categories: [String] = []
    @Published var selectedCategory: String = ""
    @Published var showInactive: Bool = false
    @Published var isLoading = false
    @Published var errorMessage: String?

    // Modal state
    @Published var showAddEdit = false
    @Published var editingItem: MenuItem?
    @Published var form = MenuItemForm()
    @Published var formError: String = ""
    @Published var isSaving = false

    @Published var showDeleteConfirm = false
    @Published var deletingItem: MenuItem?
    @Published var isDeleting = false

    var filteredItems: [MenuItem] {
        items.filter { item in
            let catOK = selectedCategory.isEmpty || item.category == selectedCategory
            let activeOK = showInactive || item.isActive
            return catOK && activeOK
        }
    }

    var groupedItems: [(category: String, items: [MenuItem])] {
        let filtered = filteredItems.sorted { $0.sortOrder < $1.sortOrder }
        var dict: [String: [MenuItem]] = [:]
        for item in filtered {
            dict[item.category, default: []].append(item)
        }
        return dict.map { (category: $0.key, items: $0.value) }
                   .sorted { $0.category < $1.category }
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let itemsTask = APIService.shared.fetchMenuItems()
            async let catsTask = APIService.shared.fetchMenuCategories()
            items = try await itemsTask
            categories = try await catsTask
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func openAdd() {
        editingItem = nil
        form = MenuItemForm()
        formError = ""
        showAddEdit = true
    }

    func openEdit(_ item: MenuItem) {
        editingItem = item
        form.load(from: item)
        formError = ""
        showAddEdit = true
    }

    func save() async {
        formError = ""
        guard !form.name.trimmingCharacters(in: .whitespaces).isEmpty else { formError = "Name is required."; return }
        guard !form.category.trimmingCharacters(in: .whitespaces).isEmpty else { formError = "Category is required."; return }
        guard let price = Double(form.price), price >= 0 else { formError = "Please enter a valid price."; return }

        let payload: [String: Any] = [
            "name": form.name.trimmingCharacters(in: .whitespaces),
            "category": form.category.trimmingCharacters(in: .whitespaces),
            "description": form.description.trimmingCharacters(in: .whitespaces),
            "price": price,
            "imgUrl": form.imgUrl.trimmingCharacters(in: .whitespaces),
            "isActive": form.isActive,
            "sortOrder": Int(form.sortOrder) ?? 0
        ]

        isSaving = true
        defer { isSaving = false }

        do {
            if let item = editingItem {
                try await APIService.shared.updateMenuItem(id: item.id, payload: payload)
            } else {
                try await APIService.shared.createMenuItem(payload)
            }
            showAddEdit = false
            await load()
        } catch {
            formError = error.localizedDescription
        }
    }

    func confirmDelete(_ item: MenuItem) {
        deletingItem = item
        showDeleteConfirm = true
    }

    func deleteConfirmed() async {
        guard let item = deletingItem else { return }
        isDeleting = true
        defer { isDeleting = false }
        do {
            try await APIService.shared.deleteMenuItem(id: item.id)
            showDeleteConfirm = false
            deletingItem = nil
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
