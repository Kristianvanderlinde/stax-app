import SwiftUI
import UIKit

/// Icoon van een budget: dezelfde Google Material-iconen als de website, als vector in de app.
struct CategoryIcon: View {
	let name: String?
	var size: CGFloat = 32
	var solid = false
	/// Op een gradient: een wit icoon in een lichte, doorschijnende cirkel.
	var onGradient = false

	var body: some View {
		let image = name.flatMap { UIImage(named: "icon-\($0)") } ?? UIImage(named: "icon-category")
		ZStack {
			if onGradient {
				Circle().fill(Color.white.opacity(0.24))
			} else {
				Circle().fill(solid ? AnyShapeStyle(.staxGradient) : AnyShapeStyle(Color.stax.opacity(0.12)))
			}
			if let image {
				Image(uiImage: image)
					.renderingMode(.template)
					.resizable()
					.scaledToFit()
					.frame(width: size * 0.56, height: size * 0.56)
					.foregroundStyle(solid || onGradient ? Color.white : Color.stax)
			}
		}
		.frame(width: size, height: size)
	}
}

/// Dunne voortgangsbalk, zoals op de website.
struct ProgressBar: View {
	let bar: Bar

	var body: some View {
		VStack(alignment: .leading, spacing: 4) {
			GeometryReader { geo in
				ZStack(alignment: .leading) {
					Capsule().fill(Color(.systemFill))
					Capsule()
						.fill(bar.over ? AnyShapeStyle(Color.red) : AnyShapeStyle(.staxGradient))
						.frame(width: geo.size.width * min(1, max(0, bar.pct / 100)))
				}
			}
			.frame(height: 6)
			Text(bar.text)
				.font(.caption)
				.foregroundStyle(bar.warn ? .orange : .secondary)
		}
	}
}

/// Kiezen uit de maanden waarvan er boekingen zijn.
struct MonthMenu: View {
	let months: [String]
	@Binding var month: String?
	var allowAll = false

	var body: some View {
		Menu {
			if allowAll {
				Button("Alle maanden") { month = "alle" }
			}
			ForEach(months, id: \.self) { m in
				Button(Format.monthTitle(m)) { month = m }
			}
		} label: {
			HStack(spacing: 4) {
				Text(month == "alle" ? "Alle maanden" : month.map { Format.monthTitle($0) } ?? "Maand")
				Image(systemName: "chevron.down").font(.caption.weight(.semibold))
			}
			.font(.subheadline.weight(.semibold))
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
			CategoryIcon(name: row.icon, size: 34, solid: row.group)
			VStack(alignment: .leading, spacing: 2) {
				HStack(alignment: .firstTextBaseline) {
					Text(row.name).font(.body).lineLimit(1)
					Spacer(minLength: 8)
					Text(Format.amount(row.balance ?? row.net))
						.font(.body.weight(.semibold).monospacedDigit())
						.foregroundStyle((row.balance ?? 0) < 0 ? .red : .primary)
				}
				if !detail.isEmpty {
					Text(detail).font(.subheadline.monospacedDigit()).foregroundStyle(over ? Color.red : Color.secondary).lineLimit(1)
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
			Menu {
				ForEach(months, id: \.self) { m in
					Button {
						month = m
					} label: {
						if m == month { Label(Format.monthTitle(m), systemImage: "checkmark") } else { Text(Format.monthTitle(m)) }
					}
				}
			} label: {
				// Vaste breedte, zodat de balk niet verspringt als de maandnaam korter of langer is.
				Text(browse == nil ? Format.monthTitle(month) : Format.shortMonth(month))
					.font(.subheadline.weight(.semibold))
					.foregroundStyle(.primary)
					.lineLimit(1)
					.minimumScaleFactor(0.8)
					.frame(width: browse == nil ? 138 : 68, height: 36)
			}
			// Een menu kleurt zijn tekst met de accentkleur; de maandnaam hoort in de gewone tekstkleur.
			.tint(.primary)
			step("chevron.right", "Volgende maand") { month = Format.shift(month, by: 1) }
			if let browse {
				Divider().frame(height: 22).padding(.horizontal, 4)
				step("chevron.left", "Vorig budget", enabled: browse.previous != nil) { if let id = browse.previous { browse.go(id) } }
				Text(browse.name).font(.subheadline.weight(.semibold)).lineLimit(1).minimumScaleFactor(0.75).frame(width: 118)
				step("chevron.right", "Volgend budget", enabled: browse.next != nil) { if let id = browse.next { browse.go(id) } }
			}
		}
		.padding(5)
		.background(.regularMaterial, in: Capsule())
		.overlay(Capsule().strokeBorder(Color.primary.opacity(0.08)))
		.shadow(color: .black.opacity(0.12), radius: 14, y: 4)
	}

	private func step(_ symbol: String, _ label: String, enabled: Bool = true, action: @escaping () -> Void) -> some View {
		Button(action: action) {
			Image(systemName: symbol).font(.subheadline.weight(.bold)).frame(width: 36, height: 36).contentShape(Rectangle())
		}
		.buttonStyle(.plain)
		.foregroundStyle(enabled ? Color.stax : Color.secondary.opacity(0.4))
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
				ContentUnavailableView {
					Label("Kon Stax niet bereiken", systemImage: "wifi.exclamationmark")
				} description: {
					Text(error)
				} actions: {
					Button("Opnieuw") { Task { await load() } }
				}
			} else {
				ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
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
