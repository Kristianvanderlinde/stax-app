import SwiftUI

/// Korte introductie: wat Stax doet en de eerste drie dingen om te regelen. Elke stap opent het echte scherm.
struct OnboardingView: View {
	@Environment(Session.self) private var session
	@Environment(\.dismiss) private var dismiss
	@State private var page = 0
	@State private var importing = false
	@State private var startSaldo = false
	@State private var budgets = false
	@State private var backup = false

	private struct Step {
		let icon: String
		let title: String
		let text: String
		var note: String?
		var action: String?
	}

	private let steps = [
		Step(icon: "nav-start", title: "Welkom bij Stax", text: "Stax laat zien wat je deze maand nog kunt uitgeven en wat je opzij zet. Je verdeelt je geld vooraf over budgetten, en elke boeking van de bank hoort bij een budget.", note: "Er is geen koppeling met je bank: je uploadt zelf een export."),
		Step(icon: "nav-upload", title: "Haal je boekingen binnen", text: "Download in je bankapp een export (camt.053, XML) en kies die hier. Stax deelt boekingen zo veel mogelijk zelf in; wat het niet weet, komt in Boekingen onder \"nog indelen\".", action: "Bankexport uploaden"),
		Step(icon: "nav-goal", title: "Zet je startsaldo", text: "Voor sparen: kies vanaf welke dag Stax je spaarsaldo bijhoudt en verdeel wat er al op de spaarrekening staat over je budgetten.", action: "Startsaldo instellen"),
		Step(icon: "nav-folder", title: "Maak je budgetten", text: "Een groep (zoals Wonen) bevat budgetten (zoals Huur). Een budget kan ook sparen of een doel hebben. Stel per maand in hoeveel erin hoort.", note: "Je vindt dit later terug in Instellingen → Budgetten.", action: "Budgetten bekijken"),
		Step(icon: "nav-upload", title: "Bewaar een back-up", text: "Maak af en toe een back-up: één bestand met al je gegevens. Raak je je telefoon of server kwijt, dan zet je alles in een paar tikken terug.", note: "Je vindt dit later terug in Instellingen → Back-up.", action: "Back-up maken")
	]

	var body: some View {
		VStack(spacing: 0) {
			HStack {
				Spacer()
				Button("Overslaan") { finish() }.foregroundStyle(.secondary).padding()
			}
			TabView(selection: $page) {
				ForEach(Array(steps.enumerated()), id: \.offset) { i, s in
					VStack(spacing: 18) {
						if i == 0 {
							Image("Logo")
								.resizable()
								.frame(width: 132, height: 132)
								.clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
								.shadow(color: .stax.opacity(0.3), radius: 16, y: 8)
						} else {
							Image(s.icon)
								.renderingMode(.template)
								.resizable()
								.scaledToFit()
								.foregroundStyle(.white)
								.padding(38)
								.frame(width: 132, height: 132)
								.background(LinearGradient(colors: [.stax.opacity(0.85), .stax], startPoint: .top, endPoint: .bottom), in: Circle())
								.shadow(color: .stax.opacity(0.3), radius: 16, y: 8)
						}
						Text(s.title).font(.title.bold()).multilineTextAlignment(.center)
						Text(s.text).multilineTextAlignment(.center)
						if let note = s.note { Text(note).font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center) }
						if let action = s.action {
							Button(action) { open(i) }.buttonStyle(.bordered).controlSize(.large)
						}
						Spacer(minLength: 0)
					}
					.padding(.horizontal, 28)
					.padding(.top, 24)
					.tag(i)
				}
			}
			.tabViewStyle(.page(indexDisplayMode: .never))
			HStack(spacing: 8) {
				ForEach(0..<steps.count, id: \.self) { i in
					Capsule().fill(i == page ? Color.stax : Color.secondary.opacity(0.3)).frame(width: i == page ? 22 : 8, height: 8)
				}
			}
			.animation(.snappy, value: page)
			.padding(.top, 8)
			Button {
				if page == steps.count - 1 { finish() } else { withAnimation { page += 1 } }
			} label: {
				Text(page == steps.count - 1 ? "Aan de slag" : "Volgende").bold().frame(maxWidth: .infinity)
			}
			.buttonStyle(.borderedProminent)
			.controlSize(.large)
			.padding(24)
		}
		.sheet(isPresented: $importing) { ImportSheet() }
		.sheet(isPresented: $startSaldo) { NavigationStack { StartView().toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Klaar") { startSaldo = false } } } } }
		.sheet(isPresented: $backup) { NavigationStack { BackupView().toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Klaar") { backup = false } } } } }
		.sheet(isPresented: $budgets) { NavigationStack { OrderView().toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Klaar") { budgets = false } } } } }
	}

	private func open(_ i: Int) {
		switch i {
		case 1: importing = true
		case 2: startSaldo = true
		case 3: budgets = true
		default: backup = true
		}
	}

	private func finish() {
		UserDefaults.standard.set(true, forKey: "onboarded")
		session.showIntro = false
		session.revision += 1
	}
}
