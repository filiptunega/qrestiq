import SwiftUI

struct LoginView: View {
    @EnvironmentObject var appVM: AppViewModel

    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var isLoading = false
    @State private var errorMessage = ""

    var body: some View {
        ZStack {
            Color.black.opacity(0.88).ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 6) {
                        Text("Staff Login")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.brandPrimary)
                        Text("Please log in to continue")
                            .font(.system(size: 14))
                            .foregroundColor(.brandSecondary)
                    }

                    // Fields
                    VStack(spacing: 12) {
                        TextField("Email", text: $email)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .textContentType(.emailAddress)
                            .padding(12)
                            .background(Color.white)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "d1d5db")))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        // Password field
                        HStack {
                            Group {
                                if showPassword {
                                    TextField("Password", text: $password)
                                        .textContentType(.password)
                                } else {
                                    SecureField("Password", text: $password)
                                        .textContentType(.password)
                                }
                            }
                            .padding(.vertical, 12)
                            .padding(.leading, 12)

                            Button(showPassword ? "hide" : "show") {
                                showPassword.toggle()
                            }
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.brandPrimary)
                            .padding(.trailing, 12)
                        }
                        .background(Color.white)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "d1d5db")))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    // Error
                    if !errorMessage.isEmpty {
                        Text(errorMessage)
                            .font(.system(size: 13))
                            .foregroundColor(.dangerRed)
                            .multilineTextAlignment(.center)
                    }

                    // Login button
                    Button {
                        Task { await loginTapped() }
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.85)
                            }
                            Text(isLoading ? "Logging in..." : "Login")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(isLoading ? Color.brandPrimary.opacity(0.7) : Color.brandPrimary)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(isLoading)
                }
                .padding(32)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .padding(.horizontal, 24)
                .shadow(color: .black.opacity(0.4), radius: 30, y: 10)

                Spacer()
            }
        }
        .onSubmit { Task { await loginTapped() } }
    }

    private func loginTapped() async {
        errorMessage = ""
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Vyplňte email a heslo."
            return
        }
        isLoading = true
        defer { isLoading = false }
        do {
            let token = try await APIService.shared.login(email: email, password: password)
            APIService.shared.saveToken(token)
            appVM.isLoggedIn = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
