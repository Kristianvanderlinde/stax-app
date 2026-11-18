import SwiftUI
import UIKit

/// Icoon van een budget: dezelfde Google Material-iconen als de website, in een Vertex-tegel met de kleur van de groep.
struct CategoryIcon: View {
	let name: String?
	var size: CGFloat = 32
	var solid = false
	/// Kleur van de groep (accent, lucht, koraal, mint of zon).
	var hue: String?
	/// Op een gradient: een wit icoon in een lichte, doorschijnende tegel.
	var onGradient = false

	var body: some View {
		if onGradient {
			ZStack {
				if let image = iconImage(name) {
					image.renderingMode(.template).resizable().scaledToFit().frame(width: size * 0.5, height: size * 0.5).foregroundStyle(.white)
				}
			}
			.frame(width: size, height: size)
			.background(Color.white.opacity(0.24), in: RoundedRectangle(cornerRadius: size * 0.32, style: .continuous))
		} else {
			VertexTegel(image: iconImage(name), hue: VertexHue(hue), effen: solid, maat: size)
		}
	}
}

/// Voortgangsbalk met tekst eronder.
struct ProgressBar: View {
	let bar: Bar

	var body: some View {
		VStack(alignment: .leading, spacing: 4) {
			VertexBalk(pct: bar.pct, over: bar.over)
			Text(bar.text)
				.font(.vCaption)
				.foregroundStyle(bar.warn ? Vertex.Kleur.statusWaarschuwing : Vertex.Kleur.tekstGedempt)
		}
	}
}

/// Kiezen uit de maanden waarvan er boekingen zijn.
struct MonthMenu: View {
	let months: [String]
	@Binding var month: String?
	var allowAll = false

	var body: some View {
		VertexMenu(scroll: true) {
			if allowAll {
				Button { month = "alle" } label: { MenuKeuzeRij(tekst: "Alle maanden", gekozen: month == "alle") }
			}
			ForEach(months, id: \.self) { m in
				Button { month = m } label: { MenuKeuzeRij(tekst: Format.monthTitle(m), gekozen: month == m) }
			}
		} label: {
			HStack(spacing: 4) {
				Text(month == "alle" ? "Alle maanden" : month.map { Format.monthTitle($0) } ?? "Maand")
				VSym("chevron.down", 11)
			}
			.vertexTekst(Vertex.Tekst.bodyVet)
			.foregroundStyle(Vertex.Kleur.accentStandaard)
			.padding(.horizontal, 14).frame(height: 40)
			.background(Vertex.Kleur.hoogte2Vlak, in: Capsule())
			.overlay(Capsule().strokeBorder(Vertex.Kleur.hoogte2Rand, lineWidth: 1))
			.vertexSchaduw(2)
		}
	}
}

/// Een budget als rij: naam en balans, daaronder één korte regel. Zonder euroteken: in lijsten is dat alleen onrustig.
/// Een budget: "340,26 van 300,00" (uitgegeven van budget). Een budget dat spaart: "0,00 van 150,00 ingelegd". Meer staat op de detailpagina.
struct BudgetRowView: View {
	let row: BudgetRow

	private var isBudget: Bool { row.kind == "budget" && !row.group }
	/// Wat er deze maand netto is uitgegeven; terugbetalingen halen het eraf.
	private var spent: Int { max(0, -row.net) }
	private var over: Bool { row.bar?.over == true }

	private var detail: String {
		if isBudget {
			// Zonder budget staat het bedrag al in de balans rechts.
			return row.plan > 0 ? "\(Format.amount(spent)) van \(Format.amount(row.plan))" : ""
		}
		return row.group ? "" : (row.bar?.text ?? "")
	}

	var body: some View {
		HStack(alignment: .center, spacing: 12) {
			CategoryIcon(name: row.icon, size: 44, solid: row.group, hue: row.hue)
			VStack(alignment: .leading, spacing: 2) {
				HStack(alignment: .firstTextBaseline) {
					Text(row.name).font(.vBody).lineLimit(1)
					Spacer(minLength: 8)
					Text(Format.amount(row.balance ?? row.net))
						.font(.vBody.weight(.semibold).monospacedDigit())
						.foregroundStyle((row.balance ?? 0) < 0 ? Vertex.Kleur.statusNegatief : Vertex.Kleur.tekstHoofd)
				}
				if !detail.isEmpty {
					Text(detail).font(.vSub.monospacedDigit()).foregroundStyle(over ? Vertex.Kleur.statusNegatief : Vertex.Kleur.tekstGedempt).lineLimit(1)
				}
			}
		}
		.padding(.leading, CGFloat(row.level) * 18)
		.padding(.vertical, 2)
	}
}

/// Zwevende balk onderaan: wisselen van maand (ook naar de toekomst) en op een detailpagina door de budgetten bladeren.
struct PeriodBar: View {
	@Binding var month: String
	let months: [String]
	var browse: Browse?

	struct Browse {
		let name: String
		let previous: Int?
		let next: Int?
		let go: (Int) -> Void
	}

	var body: some View {
		HStack(spacing: 2) {
			step("chevron.left", "Vorige maand") { month = Format.shift(month, by: -1) }
			VertexMenu(scroll: true, boven: true) {
				ForEach(months, id: \.self) { m in
					Button { month = m } label: { MenuKeuzeRij(tekst: Format.monthTitle(m), gekozen: m == month) }
				}
			} label: {
				// Vaste breedte, zodat de balk niet verspringt als de maandnaam korter of langer is.
				Text(browse == nil ? Format.monthTitle(month) : Format.shortMonth(month))
					.vertexTekst(Vertex.Tekst.bodyVet)
					.foregroundStyle(Vertex.Kleur.tekstHoofd)
					.lineLimit(1)
					.minimumScaleFactor(0.8)
					.frame(width: browse == nil ? 138 : 68, height: 36)
			}
			step("chevron.right", "Volgende maand") { month = Format.shift(month, by: 1) }
			if let browse {
				Divider().frame(height: 22).padding(.horizontal, 4)
				step("chevron.left", "Vorig budget", enabled: browse.previous != nil) { if let id = browse.previous { browse.go(id) } }
				Text(browse.name).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd).lineLimit(1).minimumScaleFactor(0.75).frame(width: 118)
				step("chevron.right", "Volgend budget", enabled: browse.next != nil) { if let id = browse.next { browse.go(id) } }
			}
		}
		.padding(5)
		.background(Vertex.Kleur.hoogte2Vlak, in: Capsule())
		.overlay(Capsule().strokeBorder(Vertex.Kleur.hoogte2Rand, lineWidth: 1))
		.vertexSchaduw(3)
	}

	private func step(_ symbol: String, _ label: String, enabled: Bool = true, action: @escaping () -> Void) -> some View {
		Button(action: action) {
			VSym(symbol, 16).frame(width: 36, height: 36).contentShape(Rectangle())
		}
		.buttonStyle(.plain)
		.foregroundStyle(enabled ? Vertex.Kleur.accentStandaard : Vertex.Kleur.tekstVaag)
		.disabled(!enabled)
		.accessibilityLabel(label)
	}
}

/// Laadt gegevens bij openen en bij elke wijziging; toont fouten en een herhaalknop.
struct Loader<T, Content: View>: View {
	@Environment(Session.self) private var session
	let key: String
	let fetch: (Api) async throws -> T
	@ViewBuilder let content: (T) -> Content
	@State private var value: T?
	@State private var error: String?

	var body: some View {
		Group {
			if let value {
				content(value)
			} else if let error {
				VStack(spacing: 12) {
					VSym("wifi.exclamationmark", 34).foregroundStyle(Vertex.Kleur.tekstVaag)
					Text("Kon Stax niet bereiken").vertexTekst(Vertex.Tekst.subkop).foregroundStyle(Vertex.Kleur.tekstHoofd)
					Text(error).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).multilineTextAlignment(.center)
					Button("Opnieuw") { Task { await load() } }.buttonStyle(VertexSecundaireKnop()).frame(maxWidth: 200)
				}
				.padding(32)
				.frame(maxWidth: .infinity, maxHeight: .infinity)
				.vertexPagina(gloed: false)
				.toolbar(.hidden, for: .navigationBar)
			} else {
				ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity).vertexPagina(gloed: false)
					.toolbar(.hidden, for: .navigationBar)
			}
		}
		.task(id: "\(key)|\(session.revision)") { await load() }
		.refreshable { await load() }
	}

	private func load() async {
		do {
			value = try await session.load(fetch)
			error = nil
		} catch is CancellationError {
		} catch let e as URLError where e.code == .cancelled {
		} catch {
			if value == nil { self.error = error.localizedDescription }
		}
	}
}

/// Het icoon van een budget als afbeelding, voor de Vertex-tegel.
func iconImage(_ name: String?) -> Image? {
	(name.flatMap { UIImage(named: "icon-\($0)") } ?? UIImage(named: "icon-category")).map { Image(uiImage: $0) }
}

/// Rij in een keuzemenu: tekst links, vinkje rechts bij de gekozen waarde, zodat de tekst niet verspringt.
struct MenuKeuzeRij: View {
	let tekst: String
	let gekozen: Bool

	var body: some View {
		HStack(spacing: 12) {
			Text(tekst)
			Spacer(minLength: 0)
			if gekozen { VSym("checkmark", 16).foregroundStyle(Vertex.Kleur.accentStandaard) }
		}
		.frame(maxWidth: .infinity)
	}
}
