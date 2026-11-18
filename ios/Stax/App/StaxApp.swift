import LocalAuthentication
import SwiftUI

@main
struct StaxApp: App {
	@State private var session = Session()

	init() { Vertex.registreerLettertype() }
	@Environment(\.scenePhase) private var phase

	var body: some Scene {
		WindowGroup {
			Group {
				if !session.isSignedIn {
					LoginView()
				} else if session.locked {
					LockView()
				} else {
					RootView()
				}
			}
			.environment(session)
			.tint(.stax)
			.onChange(of: phase) { _, now in
				// Na een tijdje op de achtergrond vraagt Stax opnieuw om Face ID.
				// Alleen het eerste moment op de achtergrond telt; een tweede melding mag de tijd niet verversen.
				if now == .background, session.wentAway == nil { session.wentAway = .now }
				if now == .active { session.lockIfAway() }
			}
		}
	}
}

/// Inlogstatus van deze telefoon: welke server, welke sleutel, en of Face ID nodig is.
@Observable
final class Session {
	/// Er is geen vaste server: je kiest er zelf een bij het eerste scherm. Dit adres wordt nooit gebruikt zonder keuze.
	private static let placeholderServer = URL(string: "https://stax.example.com")!

	var server: URL
	var token: String?
	/// Werkt zonder server: de rekenkern en de gegevens staan op deze telefoon.
	var local: LocalCore?
	var user: String
	var locked: Bool
	var wentAway: Date?
	/// Gaat omhoog na elke wijziging, zodat schermen hun gegevens opnieuw ophalen.
	var revision = 0
	/// Toont de introductie: na de eerste keer inloggen, of als je hem zelf opnieuw start.
	var showIntro = false

	var faceID: Bool {
		didSet { UserDefaults.standard.set(faceID, forKey: "faceID") }
	}

	init() {
		server = UserDefaults.standard.url(forKey: "server") ?? Self.placeholderServer
		token = Keychain.read("token")
		user = UserDefaults.standard.string(forKey: "user") ?? ""
		faceID = UserDefaults.standard.object(forKey: "faceID") as? Bool ?? true
		let wasSignedIn = Keychain.read("token") != nil || UserDefaults.standard.bool(forKey: "local")
		locked = wasSignedIn && (UserDefaults.standard.object(forKey: "faceID") as? Bool ?? true)
		// Eerder gekozen voor alleen deze telefoon: de kern en de gegevens staan hier.
		if UserDefaults.standard.bool(forKey: "local"), token == nil {
			local = try? LocalCore()
			user = "lokaal"
		}
		#if DEBUG
			// Alleen voor testen in de simulator: xcrun simctl launch … -debugServer URL -debugToken SLEUTEL
			if let s = UserDefaults.standard.string(forKey: "debugServer"), let url = URL(string: s), let t = UserDefaults.standard.string(forKey: "debugToken") {
				server = url
				token = t
				user = "test"
				locked = false
			}
			// Introductie meteen tonen, of uitgelogd starten (zonder de sleutel te wissen) om het inlogscherm te zien.
			if UserDefaults.standard.bool(forKey: "debugOnboarding") { showIntro = true }
			if UserDefaults.standard.bool(forKey: "debugLoggedOut") { token = nil }
			// Lokaal werken testen: … -debugLocal 1 [-debugLocalDb /pad/naar/stax.db om met die gegevens te beginnen]
			if UserDefaults.standard.bool(forKey: "debugLocal") {
				if let path = UserDefaults.standard.string(forKey: "debugLocalDb") {
					for suffix in ["", "-wal", "-shm"] { try? FileManager.default.removeItem(atPath: LocalCore.defaultURL.path + suffix) }
					try? FileManager.default.copyItem(atPath: path, toPath: LocalCore.defaultURL.path)
				}
				local = try? LocalCore()
				token = nil
				user = "lokaal"
				locked = false
			}
		#endif
	}

	var api: Api { Api(server: server, token: token, local: local) }

	/// Ingelogd op een server, of aan de slag met alleen deze telefoon.
	var isSignedIn: Bool { token != nil || local != nil }

	/// Kiest voor werken zonder server; de keuze blijft bewaard.
	func startLocal(_ core: LocalCore) {
		local = core
		token = nil
		user = "lokaal"
		UserDefaults.standard.set(true, forKey: "local")
		locked = false
		showIntro = !UserDefaults.standard.bool(forKey: "onboarded")
	}

	/// Stopt met lokaal werken: de gegevens op deze telefoon worden gewist en je kiest opnieuw.
	func leaveLocal() {
		local = nil
		for suffix in ["", "-wal", "-shm"] { try? FileManager.default.removeItem(atPath: LocalCore.defaultURL.path + suffix) }
		UserDefaults.standard.set(false, forKey: "local")
		UserDefaults.standard.set(false, forKey: "onboarded")
		locked = false
		showIntro = false
		revision += 1
	}

	func signedIn(server: URL, token: String, user: String) {
		self.server = server
		self.token = token
		self.user = user
		UserDefaults.standard.set(server, forKey: "server")
		UserDefaults.standard.set(user, forKey: "user")
		Keychain.write("token", token)
		locked = false
		showIntro = !UserDefaults.standard.bool(forKey: "onboarded")
	}

	/// Meteen uitloggen op deze telefoon; de server hoort het op de achtergrond. Zo blijft de knop niet hangen als de server niet bereikbaar is.
	func signOut() {
		let old = api
		forget()
		locked = false
		wentAway = nil
		showIntro = false
		revision += 1
		Task.detached { let _: Empty? = try? await old.post("logout", Empty()) }
	}

	/// De sleutel weggooien, bijvoorbeeld als de server hem niet meer kent.
	func forget() {
		token = nil
		Keychain.write("token", nil)
	}

	/// Vraagt om Face ID als de app langer dan een minuut weg was. Het moment van weggaan wordt altijd gewist:
	/// anders vergrendelt elke terugkeer naar actief (ook als het Face ID-venster sluit) opnieuw, en blijft de app in een lus hangen.
	func lockIfAway() {
		let away = wentAway
		wentAway = nil
		guard faceID, isSignedIn, !locked, !unlocking, let away, Date.now.timeIntervalSince(away) > 60 else { return }
		locked = true
	}

	/// Er loopt al een Face ID-vraag; een tweede start zou de eerste afbreken.
	private var unlocking = false

	func unlock() async {
		guard !unlocking else { return }
		unlocking = true
		defer { unlocking = false }
		let context = LAContext()
		var problem: NSError?
		// Zonder Face ID of toegangscode op de telefoon kan Stax niets vragen; dan gewoon open.
		guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &problem) else {
			locked = false
			wentAway = nil
			return
		}
		if (try? await context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Open Stax")) == true {
			locked = false
			wentAway = nil
		}
	}

	/// Voert een verzoek uit; bij een verlopen sleutel terug naar inloggen.
	func load<T>(_ work: (Api) async throws -> T) async throws -> T {
		do {
			return try await work(api)
		} catch Api.Failure.unauthorized {
			forget()
			throw Api.Failure.unauthorized
		}
	}
}

extension Color {
	static let stax = Vertex.Kleur.accentStandaard
}

extension ShapeStyle where Self == LinearGradient {
	static var staxGradient: LinearGradient { Vertex.verloopAccent }
}
