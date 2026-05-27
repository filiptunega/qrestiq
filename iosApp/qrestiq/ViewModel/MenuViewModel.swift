//
//  MenuViewModel.swift
//  qrestiq
//
//  Created by Filip Tunega on 27/05/2026.
//
import SwiftUI
import Combine
import Foundation

// MARK: - VIEW MODELS (API LOGIKA)
@MainActor
class MenuViewModel: ObservableObject {
    @Published var menuData: [String: [MenuItem]] = [:]
    @Published var categories: [String] = []
    @Published var availableTables: [Int] = []
    @Published var isLoading = true
    @Published var errorMessage: String?
    
    init() {
        Task {
            await loadInitialData()
        }
    }
    
    func loadInitialData() async {
        isLoading = true
        
        // Spustíme obe volania paralelne
        async let tablesTask = fetchTables()
        async let menuTask = fetchMenu()
        
        await (_, _) = (tablesTask, menuTask)
        isLoading = false
    }
    
    private func fetchTables() async {
        guard let url = URL(string: "\(APIConfig.baseURL)/tables") else { return }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let decodedTables = try JSONDecoder().decode([TableItem].self, from: data)
            self.availableTables = decodedTables.map { $0.number }
        } catch {
            print("Error loading tables: \(error)")
            self.availableTables = [1, 2, 3, 4, 5]
        }
    }
    
    private func fetchMenu() async {
        guard let url = URL(string: "\(APIConfig.baseURL)/menu/grouped") else { return }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let decodedMenu = try JSONDecoder().decode([String: [MenuItem]].self, from: data)
            self.menuData = decodedMenu
            
            // Kategórie zoradíme (alebo necháme tak, ak chceš poradie z backendu, odstráň .sorted())
            self.categories = Array(decodedMenu.keys).sorted()
        } catch {
            print("Error loading menu: \(error)")
            self.errorMessage = "Nepodarilo sa načítať menu."
        }
    }
}
