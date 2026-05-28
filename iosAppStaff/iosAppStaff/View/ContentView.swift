import SwiftUI

struct ContentView: View {
    @StateObject var viewModel = AppViewModel()
    
    var body: some View {
        if viewModel.isAuthenticated {
            DashboardView()
                .environmentObject(viewModel)
        } else {
            LoginView()
                .environmentObject(viewModel)
        }
    }
}

struct LoginView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    
    var body: some View {
        ZStack {
            Color(hex: "#181818").opacity(0.9).ignoresSafeArea()
            
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Staff Login")
                        .font(.title2).bold()
                        .foregroundColor(Color(hex: "#0b2940"))
                    Text("Please log in to continue")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "#7b8a98"))
                }
                
                TextField("Email", text: $email)
                    .font(.system(size: 14))
                    .padding(12)
                    .background(Color.white)
                    .foregroundColor(.black)
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                    .cornerRadius(8)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "#d1d5db"), lineWidth: 1))
                
                HStack {
                    if showPassword {
                        TextField("Password", text: $password)
                            .font(.system(size: 14))
                            .foregroundColor(.black)
                    } else {
                        SecureField("Password", text: $password)
                            .font(.system(size: 14))
                            .foregroundColor(.black)
                    }
                    
                    Button(action: { showPassword.toggle() }) {
                        Text(showPassword ? "hide" : "show")
                            .font(.footnote).bold()
                            .foregroundColor(Color(hex: "#0b2940"))
                    }
                }
                .padding(12)
                .background(Color.white)
                .cornerRadius(8)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "#d1d5db"), lineWidth: 1))
                
                Button(action: { viewModel.login(email: email, pass: password) }) {
                    Text("Login")
                        .bold()
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(hex: "#0b2940"))
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }
            .padding(40)
            .background(Color.white)
            .cornerRadius(15)
            .padding()
        }
        .preferredColorScheme(.light)
    }
}

// MARK: - Pomocná extenzia pre HEX farby
// Pridaním tohto na koniec súboru sa opraví chyba "Extraneous argument label 'hex:'"
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
