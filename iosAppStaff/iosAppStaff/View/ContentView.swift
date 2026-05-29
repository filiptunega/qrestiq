import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appVM: AppViewModel

    var body: some View {
        Group {
            if appVM.isLoggedIn {
                MainTabView()
            } else {
                LoginView()
            }
        }
    }
}

struct MainTabView: View {
    @EnvironmentObject var appVM: AppViewModel

    var body: some View {
        TabView(selection: $appVM.selectedTab) {

            NavigationStack {
                OrdersView()
                    .navigationTitle("Staff Dashboard")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar { logoutButton }
            }
            .tabItem {
                Label("Objednávky", systemImage: "doc.plaintext")
            }
            .tag(0)

            NavigationStack {
                MenuView()
                    .navigationTitle("Menu Manager")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar { logoutButton }
            }
            .tabItem {
                Label("Menu", systemImage: "fork.knife")
            }
            .tag(1)

            NavigationStack {
                TablesView()
                    .navigationTitle("Table Manager")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar { logoutButton }
            }
            .tabItem {
                Label("Stoly", systemImage: "chair.lounge")
            }
            .tag(2)
        }
        .accentColor(.brandPrimary)
    }

    private var logoutButton: some ToolbarContent {
        ToolbarItem(placement: .navigationBarTrailing) {
            Button {
                APIService.shared.clearToken()
                appVM.isLoggedIn = false
            } label: {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                    .foregroundColor(.dangerRed)
            }
        }
    }
}
