import SwiftUI
import UIKit

/// Beginscherm: kies een Stax-server of werk lokaal. Bij een server log je eenmalig in met naam, wachtwoord en de code
/// uit de authenticator. Daarna onthoudt de telefoon een eigen sleutel.
struct LoginView: View {
	@Environment(Session.self) private var session
	@State private var server = ""
	@State private var path: [Step] = []
	@State private var name = ""
	@State private var password = ""
	@State private var code = ""
	@State private var busy = false
	@State private var error: String?
	@State private var picking = false

	/// De stappen na de keuze; elke stap schuift als eigen scherm naar voren, met de terugknop van het systeem.
	enum Step: Hashable {
		case server
		case login(URL)
		case local
	}

	init() {
		#if DEBUG
			if UserDefaults.standard.bool(forKey: "debugChoosingServer") { _path = State(initialValue: [.server]) }
			if UserDefaults.standard.bool(forKey: "debugChoosingLocal") { _path = State(initialValue: [.local]) }
		#endif
	}

	var body: some View {
		NavigationStack(path: $path) {
			page(subtitle: "Hoe wil je Stax gebruiken?") { choice }
				.navigationDestination(for: Step.self) { step in
					switch step {
					case .server:
						page(subtitle: "Vul het adres in van de server waar jouw Stax draait.") { serverStep }
					case .local:
						page(subtitle: "Je gegevens blijven op deze telefoon. Zonder server, zonder account.") { localStep }
					case .login(let url):
						page(subtitle: "Log in op \(url.host() ?? url.absoluteString) met je naam, wachtwoord en de code uit je authenticator.") { credentials(url) }
					}
				}
		}
		.onChange(of: path) { error = nil }
		#if DEBUG
		.task {
			if let f = UserDefaults.standard.string(forKey: "debugRestoreFile"), let d = try? Data(contentsOf: URL(fileURLWithPath: f)) { begin(restoring: d) }
		}
		#endif
	}

	/// Logo, welkomsttekst en daaronder de inhoud van deze stap.
	private func page<Content: View>(subtitle: String, @ViewBuilder content: () -> Content) -> some View {
		Form {
			Section {
				VStack(spacing: 12) {
					Image("Logo")
						.resizable()
						.frame(width: 76, height: 76)
						.clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
						.shadow(color: .stax.opacity(0.3), radius: 12, y: 6)
					Text("Welkom bij Stax").font(.title2.bold())
					Text(subtitle)
						.font(.subheadline)
						.foregroundStyle(.secondary)
						.multilineTextAlignment(.center)
				}
				.frame(maxWidth: .infinity)
				.listRowBackground(Color.clear)
			}
			content()
			if let error {
				Section { Label(error, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.red) }
			}
		}
		.navigationBarTitleDisplayMode(.inline)
	}

	// MARK: Keuze

	private var choice: some View {
		Section {
			Button { path.append(.server) } label: {
				ChoiceRow(icon: "server.rack", title: "Verbind met een server", subtitle: "Stax draait op je eigen server. Dan werken jij en je partner met dezelfde gegevens.")
			}
			.buttonStyle(.plain)
			Button { path.append(.local) } label: {
				ChoiceRow(icon: "iphone", title: "Lokaal op deze telefoon", subtitle: "Zonder server, alles blijft op je telefoon.")
			}
			.buttonStyle(.plain)
		}
	}

	// MARK: Lokaal

	private var localStep: some View {
		Section {
			Button { begin(restoring: nil) } label: {
				ChoiceRow(icon: "sparkles", title: "Nieuw beginnen", subtitle: "Start met een leeg Stax en je eigen budgetten.", busy: busy)
			}
			.buttonStyle(.plain)
			Button { picking = true } label: {
				ChoiceRow(icon: "arrow.down.doc", title: "Ik heb een back-up", subtitle: "Zet je gegevens terug uit een Stax-back-up, ook van een server.")
			}
			.buttonStyle(.plain)
		} footer: {
			Text("Je gegevens staan alleen op deze telefoon. Verwijder je de app, dan zijn ze weg. Maak daarom af en toe een back-up via Instellingen.")
		}
		.disabled(busy)
		.fileImporter(isPresented: $picking, allowedContentTypes: [.json], allowsMultipleSelection: false) { result in
			switch result {
			case .success(let urls):
				guard let url = urls.first else { return }
				let scoped = url.startAccessingSecurityScopedResource()
				defer { if scoped { url.stopAccessingSecurityScopedResource() } }
				guard let data = try? Data(contentsOf: url) else { error = "Kon \(url.lastPathComponent) niet lezen."; return }
				begin(restoring: data)
			case .failure(let e): error = e.localizedDescription
			}
		}
	}

	/// Start met een lege database, of zet eerst een back-up terug. Pas bij succes gaat de app erop over.
	private func begin(restoring data: Data?) {
		busy = true
		error = nil
		Task {
			defer { busy = false }
			do {
				let core = try LocalCore()
				if let data { _ = try await Api(server: session.server, token: nil, local: core).raw("POST", "backup", body: data) }
				session.startLocal(core)
			} catch { self.error = error.localizedDescription }
		}
	}

	// MARK: Server

	private var serverStep: some View {
		Group {
			Section {
				TextField("Serveradres", text: $server, prompt: Text("https://stax.jouwdomein.nl").foregroundStyle(.secondary))
					.keyboardType(.URL)
					.textContentType(.URL)
					.textInputAutocapitalization(.never)
					.autocorrectionDisabled()
					.onSubmit { Task { await check() } }
			}
			Section {
				Button {
					Task { await check() }
				} label: {
					HStack {
						Spacer()
						if busy { ProgressView() } else { Text("Doorgaan").bold() }
						Spacer()
					}
				}
				.disabled(busy || server.trimmingCharacters(in: .whitespaces).isEmpty)
			}
		}
	}

	// MARK: Inloggen

	private func credentials(_ url: URL) -> some View {
		Group {
			Section {
				TextField("Naam", text: $name)
					.textContentType(.username)
					.textInputAutocapitalization(.never)
					.autocorrectionDisabled()
				SecureField("Wachtwoord", text: $password)
					.textContentType(.password)
				TextField("Code uit de authenticator", text: $code)
					.textContentType(.oneTimeCode)
					.keyboardType(.numberPad)
			}
			Section {
				Button {
					Task { await login(url) }
				} label: {
					HStack {
						Spacer()
						if busy { ProgressView() } else { Text("Inloggen").bold() }
						Spacer()
					}
				}
				.disabled(busy || name.isEmpty || password.isEmpty || code.count < 6)
			}
		}
	}

	/// Maakt van wat je typt een adres: zonder schema wordt het https, een slash aan het eind valt weg.
	private func normalized() -> URL? {
		var text = server.trimmingCharacters(in: .whitespacesAndNewlines)
		if text.isEmpty { return nil }
		if !text.contains("://") { text = "https://" + text }
		while text.hasSuffix("/") { text.removeLast() }
		guard let url = URL(string: text), let host = url.host(), host.contains(".") || host == "localhost" else { return nil }
		return url
	}

	/// Kijkt of er op dit adres een Stax-server antwoordt, voordat je je gegevens intypt.
	private func check() async {
		guard let url = normalized() else {
			error = "Dat serveradres klopt niet."
			return
		}
		busy = true
		defer { busy = false }
		var request = URLRequest(url: url.appending(path: "health"))
		request.timeoutInterval = 8
		do {
			let (_, response) = try await URLSession.shared.data(for: request)
			guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.badServerResponse) }
			error = nil
			server = url.absoluteString
			path.append(.login(url))
		} catch {
			self.error = "Daar antwoordt geen Stax-server. Controleer het adres en je verbinding."
		}
	}

	private func login(_ url: URL) async {
		busy = true
		defer { busy = false }
		do {
			let response: LoginResponse = try await Api(server: url, token: nil).post(
				"login", LoginRequest(name: name, password: password, code: code, device: UIDevice.current.name)
			)
			session.signedIn(server: url, token: response.token, user: response.user)
		} catch {
			self.error = error.localizedDescription
			code = ""
		}
	}
}

private struct ChoiceRow: View {
	let icon: String
	let title: String
	let subtitle: String
	var badge: String?
	var busy = false

	var body: some View {
		HStack(spacing: 14) {
			Image(systemName: icon)
				.font(.title3)
				.foregroundStyle(.white)
				.frame(width: 40, height: 40)
				.background(LinearGradient(colors: [.stax.opacity(0.85), .stax], startPoint: .top, endPoint: .bottom), in: Circle())
			VStack(alignment: .leading, spacing: 2) {
				HStack {
					Text(title).font(.body.weight(.semibold))
					if let badge { Text(badge).font(.caption2.weight(.semibold)).padding(.horizontal, 6).padding(.vertical, 2).background(.quaternary, in: Capsule()) }
				}
				Text(subtitle).font(.footnote).foregroundStyle(.secondary)
			}
			Spacer(minLength: 0)
			if busy { ProgressView() }
		}
		.contentShape(Rectangle())
		.padding(.vertical, 4)
	}
}

/// Vergrendeld: Face ID of de toegangscode van de telefoon.
struct LockView: View {
	@Environment(Session.self) private var session

	var body: some View {
		VStack(spacing: 20) {
			Image("Logo")
				.resizable()
				.frame(width: 88, height: 88)
				.clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
			Button {
				Task { await session.unlock() }
			} label: {
				Label("Ontgrendel Stax", systemImage: "faceid")
					.frame(maxWidth: 260)
			}
			.buttonStyle(.borderedProminent)
			.controlSize(.large)
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity)
		.background(Color(.systemGroupedBackground))
		.task { await session.unlock() }
	}
}
