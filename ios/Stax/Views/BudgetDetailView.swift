import Charts
import SwiftUI

/// Eén budget, spaarpot of groep: de cijfers van de maand, een jaar geschiedenis en de boekingen.
struct BudgetDetailView: View {
	@State var id: Int
	@State var month: String?
	@Environment(\.dismiss) private var dismiss
	@State private var editing: BudgetDetail?
	@State private var adding: String?
	/// Volgorde van budgetten (en van groepen) uit het overzicht, om met de balk onderaan door te bladeren.
	var orders: [[Int]] = []
	#if DEBUG
		@State private var debugStepped = false
	#endif

	private func neighbours(_ id: Int) -> (previous: Int?, next: Int?) {
		guard let list = orders.first(where: { $0.contains(id) }), let i = list.firstIndex(of: id) else { return (nil, nil) }
		return (i > 0 ? list[i - 1] : nil, i < list.count - 1 ? list[i + 1] : nil)
	}

	var body: some View {
		Loader(key: "\(id)|\(month ?? "")", fetch: { try await $0.get("budgetten/\(id)", ["maand": month]) as BudgetDetail }) { (data: BudgetDetail) in
			List {
				Section {
					Header(data: data)
						.listRowInsets(EdgeInsets())
						.listRowBackground(Color.clear)
				}
				// Bij een groep staan de budgetten voorop; de cijfers en de grafiek volgen daaronder.
				if !data.children.isEmpty {
					Section {
						ForEach(data.children) { row in
							NavigationLink(value: row.id) { BudgetRowView(row: row) }
						}
					} header: {
						Text("Budgetten").font(.title3.weight(.bold)).textCase(nil).foregroundStyle(.primary)
					}
				}
				Section {
					Figures(data: data)
				}
				if data.history.count > 1 {
					Section(data.node.kind == "budget" || data.node.group || data.node.tree == "inkomsten" ? "Per maand" : "Balans per maand") {
						History(data: data).frame(height: 180).padding(.vertical, 6)
					}
				}
				Section("Boekingen in \(Format.month(data.month, year: false))") {
					if data.bookings.isEmpty {
						Text("Geen boekingen in deze maand.").foregroundStyle(.secondary)
					}
					ForEach(data.bookings) { b in
						HStack {
							VStack(alignment: .leading, spacing: 2) {
								Text(b.transfer ? "Overboeking" : b.name).lineLimit(1)
								Text(data.children.isEmpty ? Format.date(b.date) : "\(Format.date(b.date)) · \(b.budget)")
									.font(.caption)
									.foregroundStyle(.secondary)
							}
							Spacer()
							Text(Format.amount(b.amount)).monospacedDigit().foregroundStyle(b.amount > 0 ? .green : .primary)
						}
					}
				}
			}
			#if DEBUG
				.onAppear {
					if UserDefaults.standard.bool(forKey: "debugEdit"), editing == nil {
						UserDefaults.standard.removeObject(forKey: "debugEdit")
						editing = data
					}
					// Alleen voor testen: -debugNext 1 springt na het laden naar het volgende budget.
					if UserDefaults.standard.bool(forKey: "debugNext"), !debugStepped, let next = neighbours(id).next {
						debugStepped = true
						id = next
					}
				}
			#endif
			.listStyle(.insetGrouped)
			.contentMargins(.top, 0, for: .scrollContent)
			.contentMargins(.bottom, 72, for: .scrollContent)
			.toolbar {
				// Bewerken kan alleen als de server het ondersteunt.
				if data.edit != nil {
					if data.node.group {
						ToolbarItem(placement: .topBarTrailing) {
							Button { adding = "budget" } label: { Image(systemName: "plus") }
								.accessibilityLabel("Nieuw budget in deze groep")
						}
					}
					ToolbarItem(placement: .topBarTrailing) {
						Button { editing = data } label: { Image(systemName: "pencil") }
							.accessibilityLabel(data.node.group ? "Groep bewerken" : "Budget bewerken")
					}
				}
			}
			.sheet(item: $editing) { shown in
				BudgetEditor(mode: .edit(shown), month: shown.month, onDeleted: { dismiss() })
			}
			.sheet(isPresented: Binding(get: { adding != nil }, set: { if !$0 { adding = nil } })) {
				BudgetEditor(mode: .newBudget(group: data.node.id), month: data.month)
			}
			.overlay(alignment: .bottom) {
				let around = neighbours(id)
				PeriodBar(
					month: Binding(get: { month ?? data.month }, set: { month = $0 }),
					months: Format.choices(data.months),
					browse: .init(name: data.node.name, previous: around.previous, next: around.next, go: { id = $0 })
				)
				.padding(.bottom, 8)
			}
		}
		.navigationBarTitleDisplayMode(.inline)
	}
}

private struct Header: View {
	let data: BudgetDetail

	private var where_: String {
		if data.node.group { return "Groep" }
		if data.node.tree == "inkomsten" { return "Inkomsten" }
		switch data.node.kind {
		case "budget": return "Budget"
		case "doelpot": return "Budget · spaart · doel"
		default: return data.node.funding == "betaal" ? "Budget · spaart · op de betaalrekening" : "Budget · spaart · op de spaarrekening"
		}
	}

	private var headline: (String, Int) {
		let f = data.figures
		if data.node.tree == "inkomsten" { return ("Ontvangen", f.spent) }
		if data.node.group { return ("Uitgegeven", f.spent) }
		if data.node.kind == "budget" {
			guard let balance = f.balance, f.plan != nil else { return ("Uitgegeven", f.spent) }
			return (balance < 0 ? "Te veel uitgegeven" : "Nog over deze maand", abs(balance))
		}
		return ("Balans", f.balance ?? 0)
	}

	var body: some View {
		VStack(alignment: .leading, spacing: 16) {
			HStack(alignment: .center, spacing: 14) {
				CategoryIcon(name: data.node.icon, size: 58, onGradient: true)
				VStack(alignment: .leading, spacing: 2) {
					if !data.node.path.isEmpty {
						Text(data.node.path.joined(separator: " › ")).font(.subheadline).opacity(0.8)
					}
					Text(data.node.name).font(.title.bold()).lineLimit(2).minimumScaleFactor(0.75)
					Text(where_).font(.subheadline).opacity(0.8)
				}
			}
			// Bij een spaardoel staat het doel meteen bovenaan.
			if let goal = data.goal {
				Text("Doel \(Format.money(goal.target))\(goal.date.map { " · \(Format.goalDate($0))" } ?? "")")
					.font(.headline)
			}
			VStack(alignment: .leading, spacing: 2) {
				Text("\(headline.0) in \(Format.month(data.month, year: false))").font(.subheadline).opacity(0.85)
				Text(Format.money(headline.1)).font(.system(size: 34, weight: .bold).monospacedDigit())
			}
			if let goal = data.goal {
				VStack(alignment: .leading, spacing: 6) {
					GeometryReader { geo in
						ZStack(alignment: .leading) {
							Capsule().fill(.white.opacity(0.25))
							Capsule().fill(.white).frame(width: geo.size.width * min(1, max(0, goal.progress)))
						}
					}
					.frame(height: 8)
					Text("\(Int(goal.progress * 100))% bereikt\(goal.perMonth.map { " · nog \(Format.money($0)) per maand" } ?? "")")
						.font(.subheadline)
						.opacity(0.85)
				}
			}
		}
		.foregroundStyle(.white)
		.padding(22)
		.frame(maxWidth: .infinity, alignment: .leading)
		.background(.staxGradient, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
	}
}

private struct Figures: View {
	let data: BudgetDetail

	var body: some View {
		let f = data.figures
		LabeledContent("Gebudgetteerd", value: Format.money(f.plan))
		if !data.node.group && data.node.kind != "budget" && data.node.tree != "inkomsten" {
			LabeledContent("Erin", value: Format.signed(f.inleg))
		}
		LabeledContent(data.node.tree == "inkomsten" ? "Ontvangen" : "Uitgegeven", value: Format.money(f.spent))
		if f.outside > 0 {
			LabeledContent("Waarvan van de lopende rekening", value: Format.money(f.outside))
		}
		if data.node.tree != "inkomsten" {
			LabeledContent("Balans", value: Format.money(f.balance))
		}
		if f.toWithdraw > 0 {
			VStack(alignment: .leading, spacing: 4) {
				LabeledContent("Nog op te nemen van de spaarrekening", value: Format.money(f.toWithdraw))
				Text("Je hebt dit bedrag voorgeschoten van de lopende rekening, terwijl het uit deze pot komt. Maak het over van de spaarrekening en koppel die opname aan dit budget; dan verdwijnt deze regel.")
					.font(.footnote)
					.foregroundStyle(.secondary)
			}
		}
		if let expected = data.goal?.expected, let balance = f.balance {
			LabeledContent(balance >= expected ? "Voor op schema" : "Achter op schema", value: Format.money(abs(balance - expected)))
		}
	}
}

private struct History: View {
	let data: BudgetDetail

	private var balances: Bool { !data.node.group && data.node.kind != "budget" && data.node.tree != "inkomsten" }

	var body: some View {
		Chart(data.history) { p in
			let label = String(Format.month(p.month, year: false).prefix(3))
			if balances {
				AreaMark(x: .value("Maand", label), y: .value("Balans", Double(p.balance ?? 0) / 100))
					.foregroundStyle(.staxGradient.opacity(0.25))
				LineMark(x: .value("Maand", label), y: .value("Balans", Double(p.balance ?? 0) / 100))
					.foregroundStyle(Color.stax)
			} else {
				BarMark(x: .value("Maand", label), y: .value("Bedrag", Double(p.spent) / 100))
					.foregroundStyle(.staxGradient)
					.cornerRadius(4)
				if p.plan > 0 {
					// Streepje op de hoogte van het budget van die maand.
					RectangleMark(x: .value("Maand", label), y: .value("Budget", Double(p.plan) / 100), width: .ratio(0.8), height: 2)
						.foregroundStyle(.secondary)
				}
			}
		}
		.chartYAxis { AxisMarks(position: .leading) }
	}
}
