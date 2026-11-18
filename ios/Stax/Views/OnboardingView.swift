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
				Button("Overslaan") { finish() }
					.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).padding(.horizontal, 20).padding(.vertical, 12)
			}
			TabView(selection: $page) {
				ForEach(Array(steps.enumerated()), id: \.offset) { i, s in
					VStack(spacing: 14) {
						Spacer(minLength: 0)
						if i == 0 {
							VertexLogo(maat: 88)
						} else {
							Image(s.icon)
								.renderingMode(.template)
								.resizable()
								.scaledToFit()
								.foregroundStyle(Vertex.Kleur.tekstOpAccent)
								.padding(24)
								.frame(width: 88, height: 88)
								.background(Vertex.verloopAccent, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
								.vertexAccentSchaduw()
						}
						Text(s.title).vertexTekst(Vertex.Tekst.titelM).foregroundStyle(Vertex.Kleur.tekstHoofd).multilineTextAlignment(.center).padding(.top, 8)
						Text(s.text).vertexTekst(Vertex.Tekst.body).foregroundStyle(Vertex.Kleur.tekstGedempt).multilineTextAlignment(.center)
						if let note = s.note { Text(note).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstVaag).multilineTextAlignment(.center) }
						if let action = s.action {
							Button(action) { open(i) }
								.vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.accentStandaard)
								.padding(.horizontal, 18).padding(.vertical, 12)
								.background(Vertex.Kleur.accentZacht, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
								.padding(.top, 6)
						}
						Spacer(minLength: 0)
						Spacer(minLength: 0)
					}
					.padding(.horizontal, 28)
					.tag(i)
				}
			}
			.tabViewStyle(.page(indexDisplayMode: .never))
			HStack(spacing: 6) {
				ForEach(0..<steps.count, id: \.self) { i in
					Capsule().fill(i == page ? Vertex.Kleur.accentStandaard : Vertex.Kleur.tekstVaag.opacity(0.4)).frame(width: i == page ? 22 : 6, height: 6)
				}
			}
			.animation(.snappy, value: page)
			.padding(.bottom, 16)
			Button {
				if page == steps.count - 1 { finish() } else { withAnimation { page += 1 } }
			} label: {
				Text(page == steps.count - 1 ? "Aan de slag" : "Volgende")
			}
			.buttonStyle(VertexPrimaireKnop())
			.padding(.horizontal, 16)
			.padding(.bottom, 12)
		}
		.vertexPagina()
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
