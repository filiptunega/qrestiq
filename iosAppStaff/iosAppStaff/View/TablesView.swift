import SwiftUI

// MARK: - Tables View
struct TablesView: View {
    @StateObject private var vm = TablesViewModel()

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        VStack(spacing: 0) {
            // Toolbar
            HStack {
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
                    Label("Add Table", systemImage: "plus")
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

            if vm.isLoading && vm.tables.isEmpty {
                Spacer()
                ProgressView()
                Spacer()
            } else if vm.visibleTables.isEmpty {
                emptyState
            } else {
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 14) {
                        ForEach(vm.visibleTables) { table in
                            TableCard(
                                table: table,
                                onEdit:   { vm.openEdit(table) },
                                onToggle: { Task { await vm.toggleActive(table) } },
                                onDelete: { vm.confirmDelete(table) }
                            )
                        }
                    }
                    .padding(16)
                }
            }
        }
        .background(Color.brandBg)
        .task { await vm.load() }
        .sheet(isPresented: $vm.showAddEdit) {
            TableFormSheet(vm: vm)
        }
        .confirmationDialog(
            "Delete Table \(vm.deletingTable.map { "No. \($0.number)" } ?? "")?",
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
                Text("🪑").font(.system(size: 24))
            }
            Text("No tables")
                .font(.system(size: 17, weight: .semibold)).foregroundColor(.brandPrimary)
            Text("Turn on \"Inactive\" or add a new table.")
                .font(.system(size: 14)).foregroundColor(.brandSecondary).multilineTextAlignment(.center)
            Spacer()
        }.frame(maxWidth: .infinity)
    }
}

// MARK: - Table Card
struct TableCard: View {
    let table: RestaurantTable
    let onEdit: () -> Void
    let onToggle: () -> Void
    let onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("🪑")
                Text("Table \(table.number)")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(.brandPrimary)
                Spacer()
            }

            // Using your existing conditional colors logic
            Text(table.isActive ? "Active" : "Inactive")
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(table.isActive ? Color(hex: "166534") : Color(hex: "6b7280"))
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(table.isActive ? Color(hex: "dcfce7") : Color(hex: "f3f4f6"))
                .clipShape(Capsule())

            Divider()

            // Actions row
            HStack(spacing: 6) {
                Button(action: onEdit) {
                    Image(systemName: "pencil")
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "1d4ed8"))
                        .padding(8)
                        .background(Color(hex: "dbeafe"))
                        .clipShape(RoundedRectangle(cornerRadius: 7))
                }

                Button(action: onToggle) {
                    Text(table.isActive ? "Deactivate" : "Activate")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(table.isActive ? Color(hex: "c2410c") : Color(hex: "15803d"))
                        .padding(.horizontal, 8).padding(.vertical, 6)
                        .background(table.isActive ? Color(hex: "fff7ed") : Color(hex: "f0fdf4"))
                        .overlay(
                            RoundedRectangle(cornerRadius: 7)
                                .stroke(table.isActive ? Color(hex: "fed7aa") : Color(hex: "bbf7d0"), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 7))
                }

                Spacer()

                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .font(.system(size: 13))
                        .foregroundColor(.dangerRed)
                        .padding(8)
                        .background(Color.dangerRedBg)
                        .clipShape(RoundedRectangle(cornerRadius: 7))
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .opacity(table.isActive ? 1 : 0.6)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "e5e7eb"), lineWidth: 1))
    }
}

// MARK: - Table Form Sheet
struct TableFormSheet: View {
    @ObservedObject var vm: TablesViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Table") {
                    LabeledContent("Table Number *") {
                        TextField("e.g., 5", text: $vm.form.number)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                    }

                    if vm.editingTable != nil {
                        Toggle("Active (visible to customers)", isOn: $vm.form.isActive)
                            .tint(.brandPrimary)
                    }
                }

                if !vm.formError.isEmpty {
                    Section {
                        Text(vm.formError)
                            .foregroundColor(.dangerRed)
                            .font(.system(size: 13))
                    }
                }
            }
            .navigationTitle(vm.editingTable == nil ? "Add Table" : "Edit Table")
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
