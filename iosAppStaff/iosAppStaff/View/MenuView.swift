import SwiftUI

struct MenuView: View {
    @StateObject private var vm = MenuViewModel()

    var body: some View {
        VStack(spacing: 0) {
            // Toolbar
            HStack {
                // Category filter
                Menu {
                    Button("All categories") { vm.selectedCategory = "" }
                    ForEach(vm.categories, id: \.self) { cat in
                        Button(cat) { vm.selectedCategory = cat }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(vm.selectedCategory.isEmpty ? "All categories" : vm.selectedCategory)
                            .font(.system(size: 14, weight: .medium))
                        Image(systemName: "chevron.down")
                            .font(.system(size: 11))
                    }
                    .foregroundColor(.brandPrimary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.brandBg)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "d1d5db")))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                // Show inactive toggle
                Toggle(isOn: $vm.showInactive) {
                    Text("Inactive")
                        .font(.system(size: 13))
                        .foregroundColor(.brandPrimary)
                }
                .toggleStyle(SwitchToggleStyle(tint: .brandPrimary))
                .fixedSize()

                Spacer()

                Button {
                    vm.openAdd()
                } label: {
                    Label("Add", systemImage: "plus")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Color.brandPrimary)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.white)
            .overlay(Divider(), alignment: .bottom)

            if vm.isLoading && vm.items.isEmpty {
                Spacer()
                ProgressView()
                Spacer()
            } else if vm.groupedItems.isEmpty {
                emptyState
            } else {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 24, pinnedViews: []) {
                        ForEach(vm.groupedItems, id: \.category) { group in
                            VStack(alignment: .leading, spacing: 12) {
                                Text(group.category)
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(.brandPrimary)
                                    .padding(.horizontal, 16)

                                ForEach(group.items) { item in
                                    MenuItemCard(item: item,
                                        onEdit:   { vm.openEdit(item) },
                                        onDelete: { vm.confirmDelete(item) }
                                    )
                                    .padding(.horizontal, 16)
                                }
                            }
                        }
                    }
                    .padding(.vertical, 16)
                }
            }
        }
        .background(Color.brandBg)
        .task { await vm.load() }
        .sheet(isPresented: $vm.showAddEdit) {
            MenuItemFormSheet(vm: vm)
        }
        .confirmationDialog(
            "Delete \"\(vm.deletingItem?.name ?? "")\"?",
            isPresented: $vm.showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) { Task { await vm.deleteConfirmed() } }
            Button("Cancel", role: .cancel) {}
        }
        .alert("Error", isPresented: Binding(
            get: { vm.errorMessage != nil },
            set: { if !$0 { vm.errorMessage = nil } }
        )) { Button("OK", role: .cancel) {} } message: { Text(vm.errorMessage ?? "") }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Spacer()
            ZStack {
                Circle().stroke(Color.brandSecondary, lineWidth: 2).frame(width: 52, height: 52)
                Text("🍽").font(.system(size: 22))
            }
            Text("No menu items")
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(.brandPrimary)
            Text("Add your first item using the button above.")
                .font(.system(size: 14))
                .foregroundColor(.brandSecondary)
                .multilineTextAlignment(.center)
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Menu Item Card
struct MenuItemCard: View {
    let item: MenuItem
    let onEdit: () -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Image
            if let urlStr = item.imgUrl, let url = URL(string: urlStr), !urlStr.isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let img):
                        img.resizable().scaledToFill()
                    default:
                        Color(hex: "f3f4f6")
                    }
                }
                .frame(width: 64, height: 64)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            } else {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(hex: "f3f4f6"))
                    .frame(width: 64, height: 64)
                    .overlay(Text("🍽").font(.system(size: 26)))
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(item.name)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.brandPrimary)
                    Spacer()
                    Text("€\(String(format: "%.2f", item.price))")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.brandPrimary)
                }

                if let desc = item.description, !desc.isEmpty {
                    Text(desc)
                        .font(.system(size: 12))
                        .foregroundColor(.brandSecondary)
                        .lineLimit(2)
                }

                HStack(spacing: 8) {
                    // Active badge
                    Text(item.isActive ? "Active" : "Inactive")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(item.isActive ? Color(hex: "166534") : Color(hex: "6b7280"))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(item.isActive ? Color(hex: "dcfce7") : Color(hex: "f3f4f6"))
                        .clipShape(Capsule())

                    Spacer()

                    // Edit button
                    Button(action: onEdit) {
                        Label("Edit", systemImage: "pencil")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(Color(hex: "1d4ed8"))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color(hex: "dbeafe"))
                            .clipShape(RoundedRectangle(cornerRadius: 7))
                    }

                    // Delete button
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .font(.system(size: 12))
                            .foregroundColor(.dangerRed)
                            .padding(7)
                            .background(Color.dangerRedBg)
                            .clipShape(RoundedRectangle(cornerRadius: 7))
                    }
                }
                .padding(.top, 2)
            }
        }
        .padding(14)
        .background(item.isActive ? Color.white : Color.white.opacity(0.6))
        .opacity(item.isActive ? 1 : 0.65)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: "e5e7eb"), lineWidth: 1))
    }
}

// MARK: - Menu Item Form Sheet
struct MenuItemFormSheet: View {
    @ObservedObject var vm: MenuViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Basic Info") {
                    LabeledContent("Name *") {
                        TextField("e.g., Margherita Pizza", text: $vm.form.name)
                            .multilineTextAlignment(.trailing)
                    }

                    LabeledContent("Category *") {
                        TextField("e.g., Pizza", text: $vm.form.category)
                            .multilineTextAlignment(.trailing)
                    }

                    LabeledContent("Description") {
                        TextField("Short description...", text: $vm.form.description, axis: .vertical)
                            .multilineTextAlignment(.trailing)
                            .lineLimit(2...4)
                    }
                }

                Section("Price and Order") {
                    LabeledContent("Price (€) *") {
                        TextField("0.00", text: $vm.form.price)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }
                    LabeledContent("Sort Order") {
                        TextField("0", text: $vm.form.sortOrder)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                    }
                }

                Section("Image") {
                    LabeledContent("Image URL") {
                        TextField("https://...", text: $vm.form.imgUrl)
                            .keyboardType(.URL)
                            .autocapitalization(.none)
                            .multilineTextAlignment(.trailing)
                    }
                }

                Section {
                    Toggle("Active (visible to customers)", isOn: $vm.form.isActive)
                        .tint(.brandPrimary)
                }

                if !vm.formError.isEmpty {
                    Section {
                        Text(vm.formError)
                            .foregroundColor(.dangerRed)
                            .font(.system(size: 13))
                    }
                }
            }
            .navigationTitle(vm.editingItem == nil ? "Add Item" : "Edit Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await vm.save() }
                    } label: {
                        if vm.isSaving {
                            ProgressView().scaleEffect(0.8)
                        } else {
                            Text("Save").bold()
                        }
                    }
                    .disabled(vm.isSaving)
                }
            }
        }
    }
}
