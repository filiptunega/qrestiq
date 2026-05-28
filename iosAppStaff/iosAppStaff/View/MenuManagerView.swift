//
//  MenuManagerView.swift
//  iosAppStaff
//
//  Created by 108 on 28.05.26.
//


import SwiftUI

struct MenuManagerView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @State private var editingItem: MenuItem? = nil
    @State private var showingAddSheet = false
    
    var body: some View {
        VStack(spacing: 0) {
            VStack(spacing: 12) {
                HStack(spacing: 12) {
                    Picker("Category", selection: $viewModel.selectedCategoryFilter) {
                        ForEach(viewModel.menuCategories, id: \.self) { cat in
                            Text(cat).tag(cat)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(6)
                    .background(Color(hex: "#faf6f2"))
                    .cornerRadius(8)
                    
                    Spacer()
                    
                    Toggle("Show Inactive", isOn: $viewModel.showInactiveItems)
                        .toggleStyle(SwitchToggleStyle(tint: Color(hex: "#0b2940")))
                        .font(.footnote)
                        .fixedSize()
                }
                
                Button(action: { showingAddSheet = true }) {
                    Text("+ Add New Item")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(10)
                        .background(Color(hex: "#0b2940"))
                        .cornerRadius(8)
                }
            }
            .padding()
            .background(Color.white)
            
            List {
                ForEach(viewModel.filteredMenuItems()) { item in
                    HStack(spacing: 12) {
                        AsyncImage(url: URL(string: item.imgUrl ?? "")) { image in // 👈 ZMENENÉ
                        } placeholder: {
                            Color.gray.opacity(0.15)
                        }
                        .frame(width: 50, height: 50)
                        .cornerRadius(8)
                        .clipped()
                        
                        VStack(alignment: .leading, spacing: 2) {
                            HStack {
                                Text(item.name)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(Color(hex: "#0b2940"))
                                
                                if !(item.isActive ?? true) {
                                    Text("Inactive")
                                        .font(.system(size: 10, weight: .bold))
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Color.gray.opacity(0.2))
                                        .foregroundColor(.gray)
                                        .cornerRadius(4)
                                }
                            }
                            Text(item.category)
                                .font(.caption)
                                .foregroundColor(Color(hex: "#7b8a98"))
                            Text(String(format: "€%.2f", item.price))
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(Color(hex: "#0b2940"))
                        }
                        
                        Spacer()
                        
                        HStack(spacing: 16) {
                            Button(action: { editingItem = item }) {
                                Image(systemName: "pencil").foregroundColor(.blue)
                            }
                            .buttonStyle(BorderlessButtonStyle())
                            
                            Button(action: {
                                if let id = item.id { viewModel.deleteMenuItem(id: id) }
                            }) {
                                Image(systemName: "trash").foregroundColor(.red)
                            }
                            .buttonStyle(BorderlessButtonStyle())
                        }
                    }
                    .padding(.vertical, 4)
                    .listRowBackground((item.isActive ?? true) ? Color.white : Color(hex: "#faf6f2"))                }
            }
            .listStyle(PlainListStyle())
        }
        .onAppear { viewModel.fetchMenuItems() }
        .sheet(item: $editingItem) { item in
            MenuFormSheet(id: item.id, name: item.name, price: String(item.price), category: item.category, imageUrl: item.imgUrl ?? "", isActive: item.isActive ?? true) // 👈 ZMENENÉ
                            .environmentObject(viewModel)
        }
        .sheet(isPresented: $showingAddSheet) {
            MenuFormSheet()
                .environmentObject(viewModel)
        }
    }
}
