import SwiftUI
import Foundation
import Combine

@MainActor
class AppViewModel: ObservableObject {
    @Published var isLoggedIn: Bool = APIService.shared.isLoggedIn
    @Published var selectedTab: Int = 0

    func handleUnauthorized() {
        APIService.shared.clearToken()
        isLoggedIn = false
    }
}
