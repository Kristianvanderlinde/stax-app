import SwiftUI

/// Vier tabbladen, zoals de website: overzicht, spaarpotten, boekingen en instellingen.
struct RootView: View {
	@Environment(Session.self) private var session
	enum Tab: Hashable { case overview, savings, bookings, settings }
	@State private var tab: Tab = {
		#if DEBUG
			switch UserDefaults.standard.string(forKey: "debugTab") {
			case "savings": return .savings
			case "bookings": return .bookings
			case "settings": return .settings
			default: return .overview
			}
		#else
			return .overview
		#endif
	}()
	@State private var openCount = 0

	var body: some View {
		TabView(selection: $tab) {
			OverviewView(openCount: $openCount, showBookings: { tab = .bookings })
				.toolbar(.hidden, for: .tabBar)
				.tag(Tab.overview)
			SavingsView()
				.toolbar(.hidden, for: .tabBar)
				.tag(Tab.savings)
			BookingsView(openCount: $openCount)
				.toolbar(.hidden, for: .tabBar)
				.tag(Tab.bookings)
			SettingsView()
				.toolbar(.hidden, for: .tabBar)
				.tag(Tab.settings)
		}
		.overlay(alignment: .bottom) {
			VertexTabbalk(
				items: [
					.init(tab: Tab.overview, titel: "Overzicht", icoon: "nav-start"),
					.init(tab: Tab.savings, titel: "Sparen", icoon: "nav-piggy"),
					.init(tab: Tab.bookings, titel: "Boekingen", icoon: "nav-list", teller: openCount),
					.init(tab: Tab.settings, titel: "Instellingen", icoon: "nav-settings")
				],
				gekozen: $tab
			)
			.ignoresSafeArea(.keyboard)
		}
		.vertexMenuHost()
		.fullScreenCover(isPresented: Binding(get: { session.showIntro }, set: { session.showIntro = $0 })) { OnboardingView() }
	}
}

struct SettingsView: View {
	@Environment(Session.self) private var session
	@State private var confirm = false
	@State private var confirmLeave = false
	#if DEBUG
		@State private var debugSub: String? = UserDefaults.standard.string(forKey: "debugSub")
	#endif

	var body: some View {
		@Bindable var session = session
		NavigationStack {
			VertexScherm(titel: "Instellingen", gloed: false) {
				VSection {
					VNavigationLink { OrderView() } label: { SettingsRow(icon: "nav-folder", title: "Budgetten", subtitle: "Aanmaken, bewerken en op volgorde zetten") }
					VNavigationLink { RulesView() } label: { SettingsRow(icon: "nav-list", title: "Regels", subtitle: "Automatisch indelen") }
					VNavigationLink { AccountsView() } label: { SettingsRow(icon: "nav-card", title: "Rekeningen", subtitle: "Naam en soort") }
					if session.local == nil {
						VNavigationLink { AccountView() } label: { SettingsRow(icon: "icon-shield", title: "Account", subtitle: "Toegang en telefoons") }
					}
					VNavigationLink { BackupView() } label: { SettingsRow(icon: "nav-upload", title: "Back-up", subtitle: "Al je gegevens bewaren of terugzetten") }
					VNavigationLink { StartView() } label: { SettingsRow(icon: "nav-goal", title: "Startsaldo", subtitle: "Startdatum en saldo per budget") }
					VKnopRij(actie: { session.showIntro = true }) { SettingsRow(icon: "nav-start", title: "Introductie", subtitle: "Loop de eerste stappen nog eens door") }
				}
				if session.local == nil {
					VSection {
						VWaarde("Ingelogd als", value: session.user)
						VWaarde("Server", value: session.server.host() ?? session.server.absoluteString)
					}
				} else {
					VSection {
						VWaarde("Gegevens", value: "Op deze telefoon")
					} footer: {
						Text("Verwijder je de app, dan zijn je gegevens weg. Maak daarom regelmatig een back-up.")
					}
				}
				VSection {
					Toggle("Openen met Face ID", isOn: $session.faceID)
				} footer: {
					Text("Na een minuut op de achtergrond vraagt Stax opnieuw om Face ID.")
				}
				if session.local == nil {
					VSection {
						Link(destination: session.server) {
							Label("Stax openen in Safari", vSym: "safari")
						}
					}
					Button("Uitloggen") { confirm = true }
						.buttonStyle(VertexDestructieveKnop())
						.vertexBevestiging("Uitloggen op deze telefoon?", isPresented: $confirm, knop: "Uitloggen") { session.signOut() }
				} else {
					Button("Gegevens wissen en opnieuw kiezen") { confirmLeave = true }
						.buttonStyle(VertexDestructieveKnop())
						.vertexBevestiging("Alle gegevens op deze telefoon wissen?", bericht: "Je keert terug naar het keuzescherm (lokaal of server). Maak eerst een back-up als je de gegevens wilt houden.", isPresented: $confirmLeave, knop: "Alles wissen") { session.leaveLocal() }
				}
			}
			#if DEBUG
			.navigationDestination(item: $debugSub) { name in
				switch name {
				case "import": ImportView()
				case "rules": RulesView()
				case "accounts": AccountsView()
				case "account": AccountView()
				case "order": OrderView()
				case "backup": BackupView()
				default: StartView()
				}
			}
			#endif
		}
	}
}
