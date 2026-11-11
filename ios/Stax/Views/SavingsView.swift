import SwiftUI

/// Alle spaarpotten per groep. Alleen een melding als ze niet kloppen met de spaarrekening.
struct SavingsView: View {
	/// Volgorde van de budgetten die hier staan, om op de detailpagina door te bladeren.
	@State private var orders: [[Int]] = []

	var body: some View {
		NavigationStack {
			Loader(key: "spaarpotten", fetch: { try await $0.get("spaarpotten") as Savings }) { (data: Savings) in
				List {
					Section {
						VStack(alignment: .leading, spacing: 4) {
							Text("Totaal gespaard").font(.subheadline).opacity(0.85)
							Text(Format.money(data.total)).font(.system(size: 34, weight: .bold).monospacedDigit())
							Text("Stand op \(Format.date(data.balanceDate))").font(.caption).opacity(0.75)
						}
						.foregroundStyle(.white)
						.padding(20)
						.frame(maxWidth: .infinity, alignment: .leading)
						.background(.staxGradient, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
						.listRowInsets(EdgeInsets())
						.listRowBackground(Color.clear)
					}
					if data.hasSavings && abs(data.difference) >= 1 {
						Section {
							Label {
								Text(
									data.difference > 0
										? "Op de spaarrekening staat \(Format.money(data.difference)) meer dan bij de budgetten. Deel de boekingen op de spaarrekening in."
										: "De budgetten bevatten \(Format.money(-data.difference)) meer dan er op de spaarrekening staat. Koppel de opnames aan een budget."
								)
								.font(.subheadline)
							} icon: {
								Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange)
							}
						}
					}
					ForEach(data.groups) { group in
						Section {
							ForEach(group.pots) { pot in
								NavigationLink(value: pot.id) { PotRow(pot: pot) }
							}
						} header: {
							HStack(spacing: 8) {
								Text(group.name).font(.title3.weight(.bold))
								Spacer()
								if group.group {
									Text(Format.amount(group.total)).font(.title3.weight(.bold).monospacedDigit())
								}
							}
							.textCase(nil)
							.foregroundStyle(.primary)
							.padding(.top, 6)
						}
					}
				}
				.listStyle(.insetGrouped)
				.onChange(of: data.groups.flatMap { $0.pots.map(\.id) }, initial: true) { _, ids in orders = [ids] }
			}
			.navigationTitle("Sparen")
			.navigationBarTitleDisplayMode(.large)
			.navigationDestination(for: Int.self) { id in BudgetDetailView(id: id, month: nil, orders: orders) }
		}
	}
}

private struct PotRow: View {
	let pot: SavingsPot

	/// Tweede regel: waar het van is (bij een subgroep), een doel, en hoever het is.
	private var detail: String {
		var parts: [String] = []
		if !pot.path.isEmpty { parts.append(pot.path) }
		if let text = pot.bar?.text { parts.append(text) } else if pot.kind == "doelpot" { parts.append("Spaart · doel") }
		return parts.joined(separator: " · ")
	}

	var body: some View {
		HStack(spacing: 12) {
			CategoryIcon(name: pot.icon, size: 32)
			VStack(alignment: .leading, spacing: 2) {
				HStack(alignment: .firstTextBaseline) {
					Text(pot.name).lineLimit(1)
					Spacer(minLength: 8)
					Text(Format.amount(pot.balance))
						.font(.body.weight(.semibold).monospacedDigit())
						.foregroundStyle((pot.balance ?? 0) < 0 ? .red : .primary)
				}
				if !detail.isEmpty {
					Text(detail).font(.subheadline).foregroundStyle(pot.bar?.over == true ? Color.red : Color.secondary).lineLimit(1)
				}
			}
		}
		.padding(.vertical, 1)
	}
}
