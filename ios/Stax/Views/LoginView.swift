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
			welcome
				.navigationDestination(for: Step.self) { step in
					switch step {
					case .server:
						page(titel: "Verbinden", subtitle: "Vul het adres in van de server waar jouw Stax draait.") { serverStep }
					case .local:
						page(titel: "Lokaal beginnen", subtitle: "Je gegevens blijven op deze telefoon. Zonder server, zonder account.") { localStep }
					case .login(let url):
						page(titel: "Inloggen", subtitle: "op \(url.host() ?? url.absoluteString)") { credentials(url) }
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

	/// Eerste scherm: logo en welkom in het midden, de twee keuzes onderaan.
	private var welcome: some View {
		VStack(spacing: 12) {
			Spacer()
			VertexLogo(maat: 72)
			Text("Welkom bij Stax").vertexTekst(Vertex.Tekst.titelM).foregroundStyle(Vertex.Kleur.tekstHoofd).padding(.top, 8)
			Text("Budgetteren op je eigen manier. Je gegevens blijven van jou.")
				.vertexTekst(Vertex.Tekst.body).foregroundStyle(Vertex.Kleur.tekstGedempt).multilineTextAlignment(.center)
			Spacer()
		}
		.padding(.horizontal, 32)
		.frame(maxWidth: .infinity, maxHeight: .infinity)
		.safeAreaInset(edge: .bottom) {
			VStack(spacing: 12) {
				Button("Verbinden met je server") { path.append(.server) }.buttonStyle(VertexPrimaireKnop())
				Button("Lokaal beginnen") { path.append(.local) }.buttonStyle(VertexSecundaireKnop())
				Text("Lokaal staan je gegevens alleen op deze telefoon. Verwijder je de app, dan zijn ze weg. Maak daarom af en toe een back-up via Instellingen.")
					.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).multilineTextAlignment(.center)
			}
			.padding(.horizontal, 16).padding(.bottom, 8)
		}
		.vertexPagina()
		.toolbar(.hidden, for: .navigationBar)
	}

	/// Logo, titel en daaronder de velden van deze stap.
	private func page<Content: View>(titel: String, subtitle: String, @ViewBuilder content: () -> Content) -> some View {
		ScrollView {
			VStack(alignment: .leading, spacing: 16) {
				VertexLogo(maat: 56)
				Text(titel).vertexTekst(Vertex.Tekst.titelM).foregroundStyle(Vertex.Kleur.tekstHoofd)
				Text(subtitle).vertexTekst(Vertex.Tekst.body).foregroundStyle(Vertex.Kleur.tekstGedempt).padding(.top, -8)
				content()
				if let error {
					Label(error, vSym: "exclamationmark.triangle.fill")
						.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.statusNegatief)
				}
			}
			.padding(16)
			.frame(maxWidth: .infinity, alignment: .leading)
		}
		.scrollBounceBehavior(.basedOnSize)
		.font(.vBody)
		.vertexPagina()
		.navigationBarTitleDisplayMode(.inline)
	}

	// MARK: Lokaal

	private var localStep: some View {
		VStack(spacing: 12) {
			Button { begin(restoring: nil) } label: {
				ChoiceRow(icon: "sparkles", title: "Nieuw beginnen", subtitle: "Start met een leeg Stax en je eigen budgetten.", busy: busy)
			}
			.buttonStyle(.plain)
			.vertexKaart()
			Button { picking = true } label: {
				ChoiceRow(icon: "arrow.down.doc", title: "Ik heb een back-up", subtitle: "Zet je gegevens terug uit een Stax-back-up, ook van een server.")
			}
			.buttonStyle(.plain)
			.vertexKaart()
			Text("Je gegevens staan alleen op deze telefoon. Verwijder je de app, dan zijn ze weg. Maak daarom af en toe een back-up via Instellingen.")
				.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
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
		VStack(spacing: 16) {
			VertexVeld(label: "Serveradres") {
				TextField("Serveradres", text: $server, prompt: Text("https://stax.jouwdomein.nl"))
					.keyboardType(.URL)
					.textContentType(.URL)
					.textInputAutocapitalization(.never)
					.autocorrectionDisabled()
					.onSubmit { Task { await check() } }
			}
			Button { Task { await check() } } label: {
				if busy { ProgressView().tint(.white) } else { Text("Doorgaan") }
			}
			.buttonStyle(VertexPrimaireKnop())
			.disabled(busy || server.trimmingCharacters(in: .whitespaces).isEmpty)
			.opacity(server.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)
		}
	}

	// MARK: Inloggen

	private func credentials(_ url: URL) -> some View {
		VStack(spacing: 16) {
			VertexVeld(label: "Naam") {
				TextField("Naam", text: $name)
					.textContentType(.username)
					.textInputAutocapitalization(.never)
					.autocorrectionDisabled()
			}
			VertexVeld(label: "Wachtwoord") {
				SecureField("Wachtwoord", text: $password)
					.textContentType(.password)
			}
			VertexVeld(label: "Code uit de authenticator") {
				TextField("Code uit de authenticator", text: $code)
					.textContentType(.oneTimeCode)
					.keyboardType(.numberPad)
			}
			Button { Task { await login(url) } } label: {
				if busy { ProgressView().tint(.white) } else { Text("Inloggen") }
			}
			.buttonStyle(VertexPrimaireKnop())
			.disabled(busy || name.isEmpty || password.isEmpty || code.count < 6)
			.opacity(name.isEmpty || password.isEmpty || code.count < 6 ? 0.5 : 1)
			.padding(.top, 8)
			Button("Ander serveradres") { path.removeLast() }
				.vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.accentStandaard)
				.frame(maxWidth: .infinity)
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
			VSym(icon)
				.font(.system(size: 18, weight: .semibold))
				.foregroundStyle(Vertex.Kleur.accentStandaard)
				.frame(width: 44, height: 44)
				.background(Vertex.Kleur.accentZacht, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
			VStack(alignment: .leading, spacing: 2) {
				Text(title).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
				Text(subtitle).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).multilineTextAlignment(.leading)
			}
			Spacer(minLength: 0)
			if busy { ProgressView() }
		}
		.padding(16)
		.contentShape(Rectangle())
	}
}

/// Vergrendeld: Face ID of de toegangscode van de telefoon.
struct LockView: View {
	@Environment(Session.self) private var session

	var body: some View {
		VStack(spacing: 12) {
			Spacer()
			VertexLogo(maat: 72)
			Text("Ontgrendel Stax").vertexTekst(Vertex.Tekst.titelM).foregroundStyle(Vertex.Kleur.tekstHoofd).padding(.top, 8)
			Text("Na een minuut op de achtergrond vraagt Stax opnieuw om Face ID.")
				.vertexTekst(Vertex.Tekst.body).foregroundStyle(Vertex.Kleur.tekstGedempt).multilineTextAlignment(.center)
			Button {
				Task { await session.unlock() }
			} label: {
				Label("Ontgrendel", vSym: "faceid")
			}
			.buttonStyle(VertexPrimaireKnop())
			.padding(.top, 12)
			Spacer()
		}
		.padding(.horizontal, 32)
		.frame(maxWidth: .infinity, maxHeight: .infinity)
		.vertexPagina()
		.task { await session.unlock() }
	}
}
