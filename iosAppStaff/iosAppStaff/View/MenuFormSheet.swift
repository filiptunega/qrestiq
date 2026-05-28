//
//  MenuFormSheet.swift
//  iosAppStaff
//

import SwiftUI

struct MenuFormSheet: View {
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var viewModel: AppViewModel

    @State var id: String? = nil
    @State var name: String = ""
    @State var price: String = ""
    @State var category: String = ""
    @State var imageUrl: String = ""
    @State var isActive: Bool = true

    @State private var errorMessage: String = ""
    @State private var isSaving: Bool = false

    var isEditing: Bool { id != nil }

    var body: some View {
        NavigationView {
            ZStack {
                Color(hex: "#faf6f2").ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 0) {
                        // Header card
                        VStack(spacing: 6) {
                            Image(systemName: isEditing ? "pencil.circle.fill" : "plus.circle.fill")
                                .font(.system(size: 38))
                                .foregroundColor(Color(hex: "#0b2940"))
                            Text(isEditing ? "Edit Menu Item" : "New Menu Item")
                                .font(.system(size: 17, weight: .bold))
                                .foregroundColor(Color(hex: "#0b2940"))
                            Text(isEditing ? "Update item details below" : "Fill in the details for the new item")
                                .font(.caption)
                                .foregroundColor(Color(hex: "#7b8a98"))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                        .background(Color.white)

                        VStack(spacing: 14) {
                            // Name
                            FormField(label: "Item Name", icon: "fork.knife") {
                                TextField("e.g. Margherita Pizza", text: $name)
                                    .font(.system(size: 15))
                                    .foregroundColor(Color(hex: "#0b2940"))
                            }

                            // Price
                            FormField(label: "Price (€)", icon: "eurosign.circle") {
                                TextField("e.g. 9.90", text: $price)
                                    .font(.system(size: 15))
                                    .foregroundColor(Color(hex: "#0b2940"))
                                    .keyboardType(.decimalPad)
                            }

                            // Category
                            FormField(label: "Category", icon: "tag") {
                                TextField("e.g. Pizza, Drinks, Desserts", text: $category)
                                    .font(.system(size: 15))
                                    .foregroundColor(Color(hex: "#0b2940"))
                            }

                            // Image URL
                            FormField(label: "Image URL", icon: "photo") {
                                TextField("https://...", text: $imageUrl)
                                    .font(.system(size: 15))
                                    .foregroundColor(Color(hex: "#0b2940"))
                                    .autocapitalization(.none)
                                    .keyboardType(.URL)
                            }

                            // Active toggle
                            HStack {
                                HStack(spacing: 8) {
                                    Image(systemName: "eye")
                                        .font(.system(size: 14))
                                        .foregroundColor(Color(hex: "#7b8a98"))
                                        .frame(width: 20)
                                    Text("Visible to customers")
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(Color(hex: "#0b2940"))
                                }
                                Spacer()
                                Toggle("", isOn: $isActive)
                                    .toggleStyle(SwitchToggleStyle(tint: Color(hex: "#0b2940")))
                                    .labelsHidden()
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 14)
                            .background(Color.white)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color(hex: "#e8edf2"), lineWidth: 1)
                            )
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 18)

                        // Error
                        if !errorMessage.isEmpty {
                            HStack(spacing: 8) {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .foregroundColor(.red)
                                Text(errorMessage)
                                    .font(.system(size: 13))
                                    .foregroundColor(.red)
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.red.opacity(0.08))
                            .cornerRadius(10)
                            .padding(.horizontal, 16)
                            .padding(.top, 12)
                        }

                        // Save button
                        Button(action: handleSave) {
                            HStack(spacing: 8) {
                                if isSaving {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.85)
                                } else {
                                    Image(systemName: isEditing ? "checkmark.circle.fill" : "plus.circle.fill")
                                }
                                Text(isSaving ? "Saving..." : (isEditing ? "Save Changes" : "Add Item"))
                                    .font(.system(size: 15, weight: .bold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                LinearGradient(
                                    colors: [Color(hex: "#0b2940"), Color(hex: "#1a4a6b")],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(12)
                            .shadow(color: Color(hex: "#0b2940").opacity(0.25), radius: 5, x: 0, y: 3)
                        }
                        .disabled(isSaving)
                        .padding(.horizontal, 16)
                        .padding(.top, 20)
                        .padding(.bottom, 32)
                    }
                }
            }
            .navigationTitle(isEditing ? "Edit Item" : "Add Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(action: {
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        Text("Cancel")
                            .foregroundColor(Color(hex: "#7b8a98"))
                    }
                }
            }
        }
    }

    private func handleSave() {
        let cleanPrice = price.replacingOccurrences(of: ",", with: ".")
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Item name cannot be empty."
            return
        }
        guard !category.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Category cannot be empty."
            return
        }
        guard let priceDouble = Double(cleanPrice), priceDouble >= 0 else {
            errorMessage = "Please enter a valid price (e.g. 9.90)"
            return
        }

        isSaving = true
        errorMessage = ""

        let item = MenuItem(
                    id: id,
                    category: category.trimmingCharacters(in: .whitespaces), // 👈 Musí byť pred 'name'
                    name: name.trimmingCharacters(in: .whitespaces),
                    price: priceDouble,
                    imgUrl: imageUrl.isEmpty ? nil : imageUrl, // 👈 V modeli sa premenná volá 'imgUrl'
                    isActive: isActive
                )

        viewModel.saveMenuItem(item) { backendError in
            isSaving = false
            if let error = backendError {
                errorMessage = error
            } else {
                presentationMode.wrappedValue.dismiss()
            }
        }
    }
}

// MARK: - Reusable form field
struct FormField<Content: View>: View {
    let label: String
    let icon: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 11))
                    .foregroundColor(Color(hex: "#7b8a98"))
                Text(label)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Color(hex: "#7b8a98"))
                    .textCase(.uppercase)
            }
            .padding(.leading, 2)

            content()
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color(hex: "#e8edf2"), lineWidth: 1)
                )
        }
    }
}
