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
				.tabItem { Label("Overzicht", image: "nav-start") }
				.tag(Tab.overview)
			SavingsView()
				.tabItem { Label("Sparen", image: "nav-piggy") }
				.tag(Tab.savings)
			BookingsView(openCount: $openCount)
				.tabItem { Label("Boekingen", image: "nav-list") }
				.badge(openCount)
				.tag(Tab.bookings)
			SettingsView()
				.tabItem { Label("Instellingen", image: "nav-settings") }
				.tag(Tab.settings)
		}
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
			Form {
				Section {
					NavigationLink { OrderView() } label: { SettingsRow(icon: "nav-folder", title: "Budgetten", subtitle: "Aanmaken, bewerken en op volgorde zetten") }
					NavigationLink { RulesView() } label: { SettingsRow(icon: "nav-list", title: "Regels", subtitle: "Automatisch indelen") }
					NavigationLink { AccountsView() } label: { SettingsRow(icon: "nav-card", title: "Rekeningen", subtitle: "Naam en soort") }
					if session.local == nil {
						NavigationLink { AccountView() } label: { SettingsRow(icon: "icon-shield", title: "Account", subtitle: "Toegang en telefoons") }
					}
					NavigationLink { BackupView() } label: { SettingsRow(icon: "nav-upload", title: "Back-up", subtitle: "Al je gegevens bewaren of terugzetten") }
					NavigationLink { StartView() } label: { SettingsRow(icon: "nav-goal", title: "Startsaldo", subtitle: "Startdatum en saldo per budget") }
					Button { session.showIntro = true } label: { SettingsRow(icon: "nav-start", title: "Introductie", subtitle: "Loop de eerste stappen nog eens door") }
						.buttonStyle(.plain)
				}
				if session.local == nil {
					Section {
						LabeledContent("Ingelogd als", value: session.user)
						LabeledContent("Server", value: session.server.host() ?? session.server.absoluteString)
					}
				} else {
					Section {
						LabeledContent("Gegevens", value: "Op deze telefoon")
					} footer: {
						Text("Verwijder je de app, dan zijn je gegevens weg. Maak daarom regelmatig een back-up.")
					}
					Section {
						Button("Gegevens wissen en opnieuw kiezen", role: .destructive) { confirmLeave = true }
							.confirmationDialog("Alle gegevens op deze telefoon wissen?", isPresented: $confirmLeave, titleVisibility: .visible) {
								Button("Alles wissen", role: .destructive) { session.leaveLocal() }
								Button("Annuleren", role: .cancel) {}
							} message: {
								Text("Je keert terug naar het keuzescherm (lokaal of server). Maak eerst een back-up als je de gegevens wilt houden.")
							}
					}
				}
				Section {
					Toggle("Openen met Face ID", isOn: $session.faceID)
				} footer: {
					Text("Na een minuut op de achtergrond vraagt Stax opnieuw om Face ID.")
				}
				if session.local == nil {
					Section {
						Link(destination: session.server) {
							Label("Stax openen in Safari", systemImage: "safari")
						}
					}
					Section {
						// De bevestiging hoort bij de knop zelf, zodat hij ook op iPad bij de knop verschijnt.
						Button("Uitloggen", role: .destructive) { confirm = true }
							.confirmationDialog("Uitloggen op deze telefoon?", isPresented: $confirm, titleVisibility: .visible) {
								Button("Uitloggen", role: .destructive) { session.signOut() }
							}
					}
				}
			}
			.navigationTitle("Instellingen")
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
