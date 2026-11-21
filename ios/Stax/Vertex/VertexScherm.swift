import SwiftUI

// Vertex voor SwiftUI, deel 2: schermen, sectiekaarten, rijen en de tabbalk. Naar de Figma-bibliotheek;
// bewust niet de standaard iOS-lijsten, zodat elke kaart dezelfde rand, schaduw en rijhoogte heeft.

// MARK: - Scherm

private struct VertexAlsSheetKey: EnvironmentKey { static let defaultValue = false }
extension EnvironmentValues {
	/// Waar een scherm als sheet getoond wordt: de terugknop wordt dan "Sluit".
	var vertexAlsSheet: Bool {
		get { self[VertexAlsSheetKey.self] }
		set { self[VertexAlsSheetKey.self] = newValue }
	}
}

private struct VertexInToolbarKey: EnvironmentKey { static let defaultValue = false }
extension EnvironmentValues {
	/// Waar een knop in de navigatiebalk staat: hij tekent dan zelf geen cirkel, de balk doet dat.
	var vertexInToolbar: Bool {
		get { self[VertexInToolbarKey.self] }
		set { self[VertexInToolbarKey.self] = newValue }
	}
}

/// Icoon voor een knop: ronde knop met schaduw in de inhoud, gewoon icoon in de accentkleur in de navigatiebalk.
struct VertexIcoonLabel: View {
	let systeemIcoon: String
	var maat: CGFloat = 44
	@Environment(\.vertexInToolbar) private var inBalk

	var body: some View {
		VSym(systeemIcoon, maat > 36 ? 24 : 17)
			.font(.system(size: maat > 36 ? 16 : 14, weight: .semibold))
			.foregroundStyle(Vertex.Kleur.accentStandaard)
			.frame(width: maat, height: maat)
			.background(Vertex.Kleur.hoogte2Vlak, in: Circle())
			.overlay(Circle().strokeBorder(Vertex.Kleur.hoogte2Rand, lineWidth: 1))
			// In de navigatiebalk snijdt iOS alles buiten het knopframe af, en dan blijft er een vierkante schaduwrand over.
			.modifier(SchaduwInBalk(inBalk: inBalk, maat: maat))
	}
}

private struct SchaduwInBalk: ViewModifier {
	let inBalk: Bool
	let maat: CGFloat
	func body(content: Content) -> some View { content.vertexSchaduw(2) }
}

extension ToolbarContent {
	/// Geen iOS 26-glas achter een balkknop: de knop tekent zelf zijn vorm.
	@ToolbarContentBuilder func vertexZonderGlas() -> some ToolbarContent {
		if #available(iOS 26.0, *) { self.sharedBackgroundVisibility(.hidden) } else { self }
	}
}

extension UINavigationController: @retroactive UIGestureRecognizerDelegate {
	open override func viewDidLoad() {
		super.viewDidLoad()
		interactivePopGestureRecognizer?.delegate = self
	}
	public func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool { viewControllers.count > 1 }
}

/// Eén scherm: pagina (met of zonder gloed), de echte navigatiebalk van iOS in ons thema, en de inhoud.
/// - `titel`: grote titel; hij klapt bij scrollen in tot de kleine titel in de balk.
/// - `midden`: alleen een kleine titel in de balk (voor sheets en detailschermen).
/// - `leiding`: knop links, bijvoorbeeld "Annuleer"; het scherm krijgt dan zijn eigen navigatiestapel (sheet).
/// - `acties`: knoppen rechts in de balk.
/// De terugknop en terugvegen komen van iOS zelf.
struct VertexScherm<Content: View>: View {
	var titel = ""
	var terug: String?
	var midden: String?
	var gloed = true
	var onderruimte: CGFloat = 120
	var leiding: AnyView?
	var acties: AnyView?
	@ViewBuilder let content: Content

	@Environment(\.dismiss) private var dismiss
	@Environment(\.vertexAlsSheet) private var alsSheet
	@Environment(\.colorScheme) private var schema

	init(
		titel: String = "", terug: String? = nil, midden: String? = nil, gloed: Bool = true, onderruimte: CGFloat = 120,
		leiding: AnyView? = nil, acties: AnyView? = nil, @ViewBuilder content: () -> Content
	) {
		self.titel = titel; self.terug = terug; self.midden = midden; self.gloed = gloed; self.onderruimte = onderruimte
		self.leiding = leiding; self.acties = acties; self.content = content()
	}

	private var alleenBalkTitel: Bool { midden != nil || titel.isEmpty }

	private var inhoud: some View {
		ScrollView {
			VStack(alignment: .leading, spacing: 16) {
				content.environment(\.vertexInScherm, true)
			}
			.padding(.horizontal, 16)
			.padding(.top, 8)
			.padding(.bottom, onderruimte)
			.frame(maxWidth: .infinity, alignment: .leading)
		}
		.scrollBounceBehavior(.basedOnSize)
		.scrollDismissesKeyboard(.interactively)
		.font(.vBody)
		.foregroundStyle(Vertex.Kleur.tekstHoofd)
		.tint(Vertex.Kleur.accentStandaard)
		.mask {
			GeometryReader { geo in
				VStack(spacing: 0) {
					LinearGradient(colors: [.clear, .black], startPoint: .top, endPoint: .bottom).frame(height: geo.safeAreaInsets.top + 8)
					Rectangle()
				}
				.ignoresSafeArea()
			}
		}
		.vertexPagina(gloed: gloed)
		.navigationBarBackButtonHidden(true)
		.toolbarColorScheme(schema, for: .navigationBar)
		.navigationTitle(midden ?? titel)
		.navigationBarTitleDisplayMode(alleenBalkTitel ? .inline : .large)
		.toolbar {
			if let leiding {
				ToolbarItem(placement: .topBarLeading) { leiding.environment(\.vertexInToolbar, true) }.vertexZonderGlas()
			} else if alsSheet, terug != nil {
				ToolbarItem(placement: .topBarLeading) { VertexIcoonknop(systeemIcoon: "xmark", label: "Sluit", maat: 44) { dismiss() }.environment(\.vertexInToolbar, true) }.vertexZonderGlas()
			} else if let terug {
				ToolbarItem(placement: .topBarLeading) {
					Button { dismiss() } label: { VertexIcoonLabel(systeemIcoon: "chevron.left", maat: 44).environment(\.vertexInToolbar, true) }
					.buttonStyle(.plain)
				}
				.vertexZonderGlas()
			}
			if let acties {
				ToolbarItem(placement: .topBarTrailing) { acties.environment(\.vertexInToolbar, true) }.vertexZonderGlas()
			}
		}
	}

	var body: some View {
		if leiding != nil || alsSheet {
			NavigationStack { inhoud }.vertexMenuHost()
		} else {
			inhoud
		}
	}
}

// MARK: - Sectie, rijen

private struct VZonderPaddingKey: ContainerValueKey {
	static let defaultValue = false
}
extension ContainerValues {
	var vzonderPadding: Bool {
		get { self[VZonderPaddingKey.self] }
		set { self[VZonderPaddingKey.self] = newValue }
	}
}
extension View {
	/// Een rij die zijn eigen opvulling meeneemt (bijvoorbeeld een link die over de hele rij te tikken is).
	func vzonderPadding() -> some View { containerValue(\.vzonderPadding, true) }
}

/// Kaart met rijen en een lijn ertussen, met een kleine kop erboven en een voetnoot eronder.
struct VSection<Content: View, Header: View, Footer: View>: View {
	let content: Content
	let header: Header
	let footer: Footer

	init(@ViewBuilder content: () -> Content, @ViewBuilder header: () -> Header, @ViewBuilder footer: () -> Footer) {
		self.content = content(); self.header = header(); self.footer = footer()
	}

	var body: some View {
		VStack(alignment: .leading, spacing: 8) {
			if Header.self != EmptyView.self {
				header.vertexTekst(Vertex.Tekst.label).foregroundStyle(Vertex.Kleur.tekstGedempt).padding(.horizontal, 4)
			}
			Group(subviews: content) { subs in
				if !subs.isEmpty {
					VStack(spacing: 0) {
						ForEach(Array(subs.enumerated()), id: \.element.id) { i, sub in
							if i > 0 { Rectangle().fill(Vertex.Kleur.lijnStandaard).frame(height: 1) }
							if sub.containerValues.vzonderPadding {
								sub.frame(maxWidth: .infinity, alignment: .leading)
							} else {
								sub.padding(.horizontal, 16).padding(.vertical, 12).frame(maxWidth: .infinity, minHeight: 46, alignment: .leading)
							}
						}
					}
					.vertexKaart()
				}
			}
			if Footer.self != EmptyView.self {
				footer.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).padding(.horizontal, 4)
			}
		}
	}
}

extension VSection where Header == EmptyView, Footer == EmptyView {
	init(@ViewBuilder content: () -> Content) { self.init(content: content, header: { EmptyView() }, footer: { EmptyView() }) }
}
extension VSection where Header == Text, Footer == EmptyView {
	init(_ titel: String, @ViewBuilder content: () -> Content) { self.init(content: content, header: { Text(titel.uppercased()) }, footer: { EmptyView() }) }
}
extension VSection where Footer == EmptyView {
	init(@ViewBuilder content: () -> Content, @ViewBuilder header: () -> Header) { self.init(content: content, header: header, footer: { EmptyView() }) }
}
extension VSection where Header == EmptyView {
	init(@ViewBuilder content: () -> Content, @ViewBuilder footer: () -> Footer) { self.init(content: content, header: { EmptyView() }, footer: footer) }
}

/// Rij met een grijs label links en de waarde rechts in semibold.
struct VWaarde<Waarde: View>: View {
	let label: String
	let waarde: Waarde

	init(_ label: String, @ViewBuilder content: () -> Waarde) { self.label = label; self.waarde = content() }

	var body: some View {
		HStack(spacing: 12) {
			Text(label).foregroundStyle(Vertex.Kleur.tekstGedempt)
			Spacer(minLength: 8)
			waarde.vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd).multilineTextAlignment(.trailing)
		}
	}
}
extension VWaarde where Waarde == Text {
	init(_ label: String, value: String) { self.init(label) { Text(value) } }
}

/// Link naar een ander scherm: rij met chevron, over de hele rij te tikken.
struct VNavigationLink<Label: View>: View {
	let link: AnyView

	init(@ViewBuilder destination: () -> some View, @ViewBuilder label: () -> Label) {
		let l = label()
		link = AnyView(NavigationLink(destination: destination) { VNavRij(label: l) }.buttonStyle(.plain))
	}
	init<V: Hashable>(value: V, @ViewBuilder label: () -> Label) {
		let l = label()
		link = AnyView(NavigationLink(value: value) { VNavRij(label: l) }.buttonStyle(.plain))
	}

	var body: some View { link.vzonderPadding() }
}

private struct VNavRij<Label: View>: View {
	let label: Label
	var body: some View {
		HStack(spacing: 12) {
			label.frame(maxWidth: .infinity, alignment: .leading)
			VSym("chevron.right", 13).foregroundStyle(Vertex.Kleur.tekstVaag)
		}
		.padding(.horizontal, 16).padding(.vertical, 12)
		.frame(minHeight: 46)
		.contentShape(Rectangle())
	}
}

/// Rij die een knop is: over de hele rij te tikken.
struct VKnopRij<Label: View>: View {
	let actie: () -> Void
	let label: Label
	init(actie: @escaping () -> Void, @ViewBuilder label: () -> Label) { self.actie = actie; self.label = label() }

	var body: some View {
		Button(action: actie) {
			label.frame(maxWidth: .infinity, alignment: .leading)
				.padding(.horizontal, 16).padding(.vertical, 12).frame(minHeight: 46).contentShape(Rectangle())
		}
		.buttonStyle(.plain)
		.vzonderPadding()
	}
}

// MARK: - Meldingen en knoppen

/// Melding in een zachte statuskleur, bijvoorbeeld "Back-up gemaakt".
struct VertexMelding: View {
	enum Toon { case positief, waarschuwing, negatief }
	let tekst: String
	var toon: Toon = .positief
	var icoon: String?

	private var kleur: (Color, Color, String) {
		switch toon {
		case .positief: (Vertex.Kleur.statusPositiefZacht, Vertex.Kleur.statusPositief, "checkmark.circle")
		case .waarschuwing: (Vertex.Kleur.statusWaarschuwingZacht, Vertex.Kleur.statusWaarschuwing, "exclamationmark.triangle")
		case .negatief: (Vertex.Kleur.statusNegatiefZacht, Vertex.Kleur.statusNegatief, "exclamationmark.circle")
		}
	}

	var body: some View {
		HStack(alignment: .top, spacing: 10) {
			VSym(icoon ?? kleur.2, 18)
			Text(tekst).vertexTekst(toon == .positief ? Vertex.Tekst.bodyVet : Vertex.Tekst.body).multilineTextAlignment(.leading)
			Spacer(minLength: 0)
		}
		.foregroundStyle(kleur.1)
		.padding(14)
		.frame(maxWidth: .infinity, alignment: .leading)
		.background(kleur.0, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
	}
}

/// Zachte knop met een rode tekst, voor verwijderen en terugzetten.
struct VertexDestructieveKnop: ButtonStyle {
	func makeBody(configuration: Configuration) -> some View {
		configuration.label
			.vertexTekst(Vertex.Tekst.subkop)
			.foregroundStyle(Vertex.Kleur.statusNegatief)
			.frame(maxWidth: .infinity, minHeight: 52)
			.background(Vertex.Kleur.statusNegatiefZacht, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
			.opacity(configuration.isPressed ? 0.8 : 1)
	}
}

private struct KopKnopSchaduw: ViewModifier {
	let uit: Bool
	func body(content: Content) -> some View {
		if uit { content.vertexSchaduw(2) } else { content.vertexAccentSchaduw() }
	}
}

/// Actieknop rechts in de kop van een sheet ("Bewaar", "Voeg toe"): capsule van 44 hoog, met accentkleur als hij kan.
struct VertexKopKnop: View {
	let titel: String
	var vet = false
	var uit = false
	let actie: () -> Void

	var body: some View {
		Button(action: actie) {
			Text(titel).vertexTekst(Vertex.Tekst.bodyVet).fixedSize()
				.foregroundStyle(uit ? Vertex.Kleur.tekstVaag : Vertex.Kleur.tekstOpAccent)
				.padding(.horizontal, 18).frame(height: 44)
				.background(uit ? AnyShapeStyle(Vertex.Kleur.hoogte2Vlak) : AnyShapeStyle(Vertex.verloopAccent), in: Capsule())
				.overlay(Capsule().strokeBorder(Vertex.Kleur.hoogte2Rand, lineWidth: uit ? 1 : 0))
				.modifier(KopKnopSchaduw(uit: uit))
		}
		.buttonStyle(.plain)
		.disabled(uit)
	}
}

/// Zoekveld in de inhoud, zoals in het ontwerp: wit vlak met een vergrootglas.
struct VertexZoekveld: View {
	let prompt: String
	@Binding var tekst: String
	var onSubmit: () -> Void = {}

	var body: some View {
		HStack(spacing: 10) {
			VSym("magnifyingglass", 15).foregroundStyle(Vertex.Kleur.tekstGedempt)
			TextField("", text: $tekst, prompt: Text(prompt).foregroundStyle(Vertex.Kleur.tekstVaag))
				.vertexTekst(Vertex.Tekst.body)
				.submitLabel(.search)
				.onSubmit(onSubmit)
			if !tekst.isEmpty {
				Button { tekst = ""; onSubmit() } label: { VSym("xmark.circle.fill").foregroundStyle(Vertex.Kleur.tekstVaag) }.buttonStyle(.plain)
			}
		}
		.padding(.horizontal, 14)
		.frame(height: 46)
		.vertexKaart(1, radius: 16)
	}
}

// MARK: - Tabbalk

/// Zwevende tabbalk: capsule op hoogte 3, actief item als zachte accentpil.
struct VertexTabbalk<Tab: Hashable>: View {
	struct Item: Identifiable {
		let tab: Tab
		let titel: String
		let icoon: String
		var teller = 0
		var id: String { titel }
	}
	let items: [Item]
	@Binding var gekozen: Tab
	@Namespace private var pil
	/// Onderste veilige zone van het scherm (het streepje onderaan); wordt uitgelezen met `onGeometryChange`. Niet uit UIKit lezen in `body`: dan ververst de balk niet meer.
	@State private var onderinset: CGFloat = 34

	var body: some View {
		HStack(spacing: 2) {
			ForEach(items) { item in
				let actief = item.tab == gekozen
				Button { withAnimation(.spring(duration: 0.38, bounce: 0.2)) { gekozen = item.tab } } label: {
					VStack(spacing: 3) {
						Image(item.icoon).renderingMode(.template).resizable().scaledToFit().frame(width: 24, height: 24)
						Text(item.titel).vertexTekst(Vertex.Stijl(grootte: 10, regelhoogte: 14, gewicht: 600)).lineLimit(1)
					}
					.foregroundStyle(actief ? Vertex.Kleur.accentStandaard : Vertex.Kleur.tekstGedempt)
					.frame(maxWidth: .infinity, minHeight: 52)
					.background {
						if actief {
							RoundedRectangle(cornerRadius: 28, style: .continuous).fill(Vertex.Kleur.accentZacht)
								.matchedGeometryEffect(id: "pil", in: pil)
						}
					}
					.overlay(alignment: .topTrailing) {
						if item.teller > 0 {
							Text(item.teller > 99 ? "99+" : "\(item.teller)")
								.vertexTekst(Vertex.Stijl(grootte: 11, regelhoogte: 14, gewicht: 600))
								.foregroundStyle(Vertex.Kleur.tekstOpAccent)
								.padding(.horizontal, 5).frame(minWidth: 18, minHeight: 18)
								.background(Vertex.Kleur.accentVlak, in: Capsule())
								.padding(.top, 4).padding(.trailing, 20)
						}
					}
					.contentShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
				}
				.buttonStyle(.plain)
				.accessibilityLabel(item.titel)
				.accessibilityAddTraits(actief ? .isSelected : [])
			}
		}
		.padding(6)
		.vertexKaart(3, radius: 34)
		.padding(.horizontal, Self.zijrand)
		.padding(.bottom, onderrand)
		.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
		.ignoresSafeArea(.container, edges: .bottom)
		.onGeometryChange(for: CGFloat.self) { $0.safeAreaInsets.bottom } action: { onderinset = $0 }
	}

	/// Zoals de tabbalk van iOS zelf: ruim van de zijkanten (een andere maat dan de inhoud van 16 punten) en laag,
	/// zodat de rondingen van de balk meelopen met de hoeken van het scherm.
	static var zijrand: CGFloat { 21 }

	/// Onderrand van de zwevende maandbalk boven de tabbalk (gemeten vanaf de veilige zone): de tabbalk staat lager dan voorheen.
	static var periodeOnderrand: CGFloat { 72 }

	/// Afstand van de balk tot de onderrand van het scherm: het (veilige) inset min 12 punten, bij een toestel zonder streepje 12 punten.
	var onderrand: CGFloat { onderinset > 0 ? max(onderinset - 12, 8) : 12 }
}

// MARK: - Velden in rijen

/// Rij met een keuzemenu: grijs label links, de gekozen waarde rechts met een pijltje; opent het iOS-menu met een vinkje bij de keuze.
struct VKeuze<Waarde: Hashable>: View {
	let label: String
	@Binding var selection: Waarde
	let opties: [(Waarde, String)]

	init(_ label: String, selection: Binding<Waarde>, opties: [(Waarde, String)]) {
		self.label = label; _selection = selection; self.opties = opties
	}

	private var huidig: String { opties.first { $0.0 == selection }?.1 ?? "" }

	var body: some View {
		HStack(spacing: 12) {
			Text(label).foregroundStyle(Vertex.Kleur.tekstGedempt)
			Spacer(minLength: 8)
			VertexMenu(scroll: opties.count > 7) {
				ForEach(Array(opties.enumerated()), id: \.offset) { _, o in
					Button { selection = o.0 } label: { MenuKeuzeRij(tekst: o.1, gekozen: o.0 == selection) }
				}
			} label: {
				HStack(spacing: 6) {
					Text(huidig).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd).lineLimit(1)
					VSym("chevron.down", 13).foregroundStyle(Vertex.Kleur.tekstVaag)
				}
			}
		}
	}
}

/// Rij met een invoerveld: grijs label links, de waarde rechts in semibold.
struct VVeld: View {
	let label: String
	@Binding var tekst: String
	var prompt = ""
	var geheim = false

	init(_ label: String, tekst: Binding<String>, prompt: String = "", geheim: Bool = false) {
		self.label = label; _tekst = tekst; self.prompt = prompt; self.geheim = geheim
	}

	var body: some View {
		HStack(spacing: 12) {
			Text(label).foregroundStyle(Vertex.Kleur.tekstGedempt)
			Spacer(minLength: 8)
			Group {
				if geheim { SecureField("", text: $tekst, prompt: Text(prompt)) } else { TextField("", text: $tekst, prompt: Text(prompt)) }
			}
			.vertexTekst(Vertex.Tekst.bodyVet)
			.foregroundStyle(Vertex.Kleur.tekstHoofd)
			.multilineTextAlignment(.trailing)
		}
	}
}

// MARK: - Menu

private struct VertexSluitMenuKey: EnvironmentKey { static let defaultValue: () -> Void = {} }
extension EnvironmentValues {
	var vertexSluitMenu: () -> Void {
		get { self[VertexSluitMenuKey.self] }
		set { self[VertexSluitMenuKey.self] = newValue }
	}
}

/// Rij in een menu: tekst met icoon, zachte accentkleur bij indrukken, rood voor verwijderen. Sluit het menu na een tik.
struct VertexMenuRij: ButtonStyle {
	@Environment(\.vertexSluitMenu) private var sluit

	func makeBody(configuration: Configuration) -> some View {
		configuration.label
			.labelStyle(VertexMenuLabelStijl(rood: configuration.role == .destructive))
			.vertexTekst(Vertex.Tekst.body)
			.foregroundStyle(configuration.role == .destructive ? Vertex.Kleur.statusNegatief : Vertex.Kleur.tekstHoofd)
			.frame(maxWidth: .infinity, alignment: .leading)
			.padding(.horizontal, 12).padding(.vertical, 11)
			.background(
				RoundedRectangle(cornerRadius: 18, style: .continuous)
					.fill(configuration.isPressed ? Vertex.Kleur.accentZacht : .clear)
			)
			.contentShape(Rectangle())
			.onChange(of: configuration.isPressed) { _, nu in
				// Even laten zien dat de rij gekozen is, dan pas sluiten.
				if !nu { UISelectionFeedbackGenerator().selectionChanged(); DispatchQueue.main.asyncAfter(deadline: .now() + 0.10) { sluit() } }
			}
	}
}

private struct VertexMenuLabelStijl: LabelStyle {
	let rood: Bool
	func makeBody(configuration: Configuration) -> some View {
		HStack(spacing: 12) {
			configuration.icon.foregroundStyle(rood ? Vertex.Kleur.statusNegatief : Vertex.Kleur.accentStandaard).frame(width: 22)
			configuration.title
		}
	}
}

/// Wat een menu toont, plus waar de knop staat. De popover hangt aan het scherm, niet aan de knop zelf:
/// hangt hij aan een knop in de navigatiebalk, dan knipt iOS bij het sluiten de schaduw van die knop af en flitst er een kader.
struct VertexMenuItem {
	let bron: CGRect
	let scroll: Bool
	let boven: Bool
	let inhoud: AnyView
}

/// Een bevestiging: titel, uitleg en een bevestig- en annuleerknop, in Vertex-stijl in plaats van het iOS-actieblad.
struct VertexDialoog {
	let titel: String
	let bericht: String?
	let knop: String
	let verwijdert: Bool
	let actie: () -> Void
	let dicht: () -> Void
}

@Observable final class VertexMenuState {
	var huidig: VertexMenuItem?
	var dialoog: VertexDialoog?
}

private struct VertexInSchermKey: EnvironmentKey { static let defaultValue = false }
extension EnvironmentValues {
	/// True voor alles binnen de inhoud van een VertexScherm: daar hoort de menu- en dialooglaag van dat scherm.
	var vertexInScherm: Bool {
		get { self[VertexInSchermKey.self] }
		set { self[VertexInSchermKey.self] = newValue }
	}
}

private struct VertexMenuStateKey: EnvironmentKey { static let defaultValue: VertexMenuState? = nil }
extension EnvironmentValues {
	var vertexMenuState: VertexMenuState? {
		get { self[VertexMenuStateKey.self] }
		set { self[VertexMenuStateKey.self] = newValue }
	}
}

/// De kaart van een menu: hoogte 4, rand, afronding 28. Klapt open vanaf de knop, naar boven als de knop onderin staat.
struct VertexMenuLaag<Inhoud: View>: View {
	let bron: CGRect
	let scroll: Bool
	let boven: Bool
	let sluit: () -> Void
	@ViewBuilder let inhoud: Inhoud
	@State private var zichtbaar = false
	@State private var hoogte: CGFloat = 0

	private let breedte: CGFloat = 250

	var body: some View {
		GeometryReader { geo in
			let scherm = geo.size
			// De plek van de knop is in schermcoördinaten; deze laag begint niet per se linksboven op het scherm (bijvoorbeeld in een sheet).
			let o = geo.frame(in: .global).origin
			let bron = self.bron.offsetBy(dx: -o.x, dy: -o.y)
			// Knoppen aan de rand: kaart sluit aan op die rand. Knoppen in het midden: kaart komt eronder gecentreerd.
			let ideaalX: CGFloat = abs(bron.midX - scherm.width / 2) < 70 ? bron.midX - breedte / 2 : (bron.midX > scherm.width / 2 ? bron.maxX - breedte : bron.minX)
			let x = min(max(16, ideaalX), scherm.width - breedte - 16)
			let h = scroll ? 300 : hoogte
			let y = boven ? max(8, bron.minY - h - 8) : bron.maxY + 8
			ZStack(alignment: .topLeading) {
				Color.black.opacity(zichtbaar ? 0.10 : 0.001).ignoresSafeArea().onTapGesture { dicht() }
				Group {
					if scroll { ScrollView { rijen }.frame(height: 300) } else { rijen }
				}
				.frame(width: breedte)
				.vertexKaart(1, radius: 28)
				.background(GeometryReader { g in Color.clear.onAppear { hoogte = g.size.height } })
				.scaleEffect(zichtbaar ? 1 : 0.9, anchor: UnitPoint(x: (bron.midX - x) / breedte, y: boven ? 1 : 0))
				.opacity(zichtbaar ? 1 : 0)
				.offset(x: x, y: y)
			}
			.frame(width: scherm.width, height: scherm.height, alignment: .topLeading)
		}
		.onAppear {
			UIImpactFeedbackGenerator(style: .light).impactOccurred()
			withAnimation(.spring(duration: 0.34, bounce: 0.14)) { zichtbaar = true }
		}
	}

	private func dicht() {
		withAnimation(.easeIn(duration: 0.14)) { zichtbaar = false }
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.14) { sluit() }
	}

	private var rijen: some View {
		VStack(alignment: .leading, spacing: 0) { inhoud }
			.environment(\.vertexSluitMenu, { dicht() })
			.buttonStyle(VertexMenuRij())
			.padding(10)
	}
}

/// De kaart van een bevestiging, onderin het scherm, met een lichte dimlaag erachter.
struct VertexDialoogLaag: View {
	let dialoog: VertexDialoog
	@State private var zichtbaar = false

	var body: some View {
		ZStack(alignment: .bottom) {
			Color.black.opacity(zichtbaar ? 0.28 : 0).ignoresSafeArea().onTapGesture { sluit(nil) }
			VStack(alignment: .leading, spacing: 8) {
				Text(dialoog.titel).vertexTekst(Vertex.Tekst.kop).foregroundStyle(Vertex.Kleur.tekstHoofd)
				if let bericht = dialoog.bericht {
					Text(bericht).vertexTekst(Vertex.Tekst.body).foregroundStyle(Vertex.Kleur.tekstGedempt)
				}
				VStack(spacing: 10) {
					if dialoog.verwijdert {
						Button(dialoog.knop) { sluit(dialoog.actie) }.buttonStyle(VertexDestructieveKnop())
					} else {
						Button(dialoog.knop) { sluit(dialoog.actie) }.buttonStyle(VertexPrimaireKnop())
					}
					Button("Annuleren") { sluit(nil) }.buttonStyle(VertexSecundaireKnop())
				}
				.padding(.top, 12)
			}
			.padding(20)
			.frame(maxWidth: .infinity, alignment: .leading)
			.vertexKaart(1, radius: 28)
			.padding(.horizontal, 12).padding(.bottom, 24)
			.offset(y: zichtbaar ? 0 : 60).opacity(zichtbaar ? 1 : 0)
		}
		.onAppear { withAnimation(.spring(duration: 0.34, bounce: 0.1)) { zichtbaar = true } }
	}

	private func sluit(_ daarna: (() -> Void)?) {
		withAnimation(.easeIn(duration: 0.14)) { zichtbaar = false }
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.14) { dialoog.dicht(); daarna?() }
	}
}

private struct VertexBevestiging: ViewModifier {
	let titel: String
	let bericht: String?
	@Binding var isPresented: Bool
	let knop: String
	let verwijdert: Bool
	let actie: () -> Void
	@Environment(\.vertexMenuState) private var staat
	@Environment(\.vertexInScherm) private var inScherm

	func body(content: Content) -> some View {
		let dialoog = VertexDialoog(titel: titel, bericht: bericht, knop: knop, verwijdert: verwijdert, actie: actie, dicht: { isPresented = false; staat?.dialoog = nil })
		if inScherm, let staat {

			// Binnen een scherm: de laag van het scherm tekent de dialoog, ook boven de navigatiebalk.
			content.onChange(of: isPresented) { _, nu in if nu { staat.dialoog = dialoog } }
		} else {
			// Buiten het scherm (op de scherm-view zelf): de dialoog ligt over de hele view.
			content.overlay { if isPresented { VertexDialoogLaag(dialoog: dialoog).ignoresSafeArea() } }
		}
	}
}

extension View {
	/// Vertex-bevestiging in plaats van `confirmationDialog`. Zet `isPresented` op true om hem te tonen.
	func vertexBevestiging(_ titel: String, bericht: String? = nil, isPresented: Binding<Bool>, knop: String, verwijdert: Bool = true, actie: @escaping () -> Void) -> some View {
		modifier(VertexBevestiging(titel: titel, bericht: bericht, isPresented: isPresented, knop: knop, verwijdert: verwijdert, actie: actie))
	}
}

/// Tekent de menulaag boven alles binnen deze view, ook boven de navigatiebalk. Staat bovenaan de app en in elke sheet.
struct VertexMenuHost: ViewModifier {
	@State private var staat = VertexMenuState()

	func body(content: Content) -> some View {
		content
			.environment(\.vertexMenuState, staat)
			.overlay {
				if let m = staat.huidig {
					VertexMenuLaag(bron: m.bron, scroll: m.scroll, boven: m.boven, sluit: { staat.huidig = nil }) { m.inhoud }
					.ignoresSafeArea()
				}
			}
			.overlay {
				if let d = staat.dialoog { VertexDialoogLaag(dialoog: d).ignoresSafeArea() }
			}
	}
}

extension View {
	func vertexMenuHost() -> some View { modifier(VertexMenuHost()) }
}

/// Geeft de plek van een view in venstercoördinaten, ook voor knoppen in de navigatiebalk (waar SwiftUI de plek niet goed doorgeeft).
private struct PlekLezer: UIViewRepresentable {
	@Binding var lezer: (() -> CGRect)?

	func makeUIView(context: Context) -> UIView {
		let v = UIView()
		v.isUserInteractionEnabled = false
		DispatchQueue.main.async { lezer = { [weak v] in v.map { $0.convert($0.bounds, to: nil) } ?? .zero } }
		return v
	}
	func updateUIView(_ uiView: UIView, context: Context) {}
}

/// Menu in Vertex-stijl: een effen kaart zonder pijltje, op een laag boven de pagina. Opent onder de knop,
/// of erboven als `boven` staat (voor knoppen onderin het scherm).
struct VertexMenu<Label: View, Content: View>: View {
	var scroll = false
	var boven = false
	@ViewBuilder let content: Content
	@ViewBuilder let label: Label
	@Environment(\.vertexMenuState) private var staat
	@State private var plek: (() -> CGRect)?

	init(scroll: Bool = false, boven: Bool = false, @ViewBuilder content: () -> Content, @ViewBuilder label: () -> Label) {
		self.scroll = scroll; self.boven = boven; self.content = content(); self.label = label()
	}

	var body: some View {
		Button {
			staat?.huidig = VertexMenuItem(bron: plek?() ?? .zero, scroll: scroll, boven: boven, inhoud: AnyView(content))
		} label: { label }
			.buttonStyle(.plain)
			.background { PlekLezer(lezer: $plek) }
	}
}

// MARK: - Iconen (Material Symbols)

/// Icoon uit Google Material Symbols (rounded, filled). De naam mag ook een oude SF-naam zijn; die wordt vertaald.
struct VSym: View {
	let naam: String
	var maat: CGFloat

	init(_ naam: String, _ maat: CGFloat = 20) { self.naam = naam; self.maat = maat }

	static let kaart: [String: String] = [
		"chevron.right": "chevron_right", "chevron.left": "chevron_left", "chevron.up": "keyboard_arrow_up", "chevron.down": "keyboard_arrow_down",
		"plus": "add", "plus.circle": "add_circle", "folder.badge.plus": "create_new_folder", "arrow.down.circle": "arrow_circle_down",
		"square.and.arrow.down": "download", "square.and.arrow.up": "ios_share", "exclamationmark.triangle": "warning", "exclamationmark.triangle.fill": "warning",
		"exclamationmark.circle": "error", "xmark.circle.fill": "cancel", "xmark": "close", "checkmark": "check", "checkmark.circle": "check_circle",
		"wifi.exclamationmark": "wifi_off", "safari": "explore", "faceid": "face", "arrow.triangle.branch": "call_split", "forward": "skip_next",
		"tray": "inbox", "tray.full": "inbox", "magnifyingglass": "search", "line.3.horizontal": "drag_handle", "info.circle": "info",
		"iphone": "mobile", "doc.text": "description", "ellipsis": "more_horiz", "pencil": "edit", "arrow.uturn.backward": "undo",
		"arrow.down.left": "south_west", "arrow.up.right": "north_east", "sparkles": "rocket_launch", "arrow.down.doc": "download"
	]

	var body: some View {
		if let m = VSym.kaart[naam] ?? (UIImage(named: "ui-\(naam)") != nil ? naam : nil) {
			Image("ui-\(m)").renderingMode(.template).resizable().scaledToFit().frame(width: maat * 1.2, height: maat * 1.2)
		} else {
			Image(systemName: naam).font(.system(size: maat))
		}
	}
}

extension Label where Title == Text, Icon == VSym {
	init(_ titel: String, vSym: String, maat: CGFloat = 18) {
		self.init { Text(titel) } icon: { VSym(vSym, maat) }
	}
}
