import SwiftUI

/// Alle spaarpotten per groep. Alleen een melding als ze niet kloppen met de spaarrekening.
struct SavingsView: View {
	/// Volgorde van de budgetten die hier staan, om op de detailpagina door te bladeren.
	@State private var orders: [[Int]] = []

	var body: some View {
		NavigationStack {
			Loader(key: "spaarpotten", fetch: { try await $0.get("spaarpotten") as Savings }) { (data: Savings) in
				VertexScherm(titel: "Sparen", gloed: true) {
					VStack(alignment: .leading, spacing: 4) {
						Text("Totaal gespaard").vertexTekst(Vertex.Tekst.body).opacity(0.9)
						Text(Format.money(data.total)).vertexTekst(Vertex.Tekst.titelL).monospacedDigit()
						Text("Stand op \(Format.date(data.balanceDate))").vertexTekst(Vertex.Tekst.klein).opacity(0.8)
					}
					.foregroundStyle(Vertex.Kleur.tekstOpAccent)
					.padding(20)
					.frame(maxWidth: .infinity, alignment: .leading)
					.background(Vertex.verloopAccent, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
					.vertexAccentSchaduw()
					if data.hasSavings && abs(data.difference) >= 1 {
						VertexMelding(
							tekst: data.difference > 0
								? "Op de spaarrekening staat \(Format.money(data.difference)) meer dan bij de budgetten. Deel de boekingen op de spaarrekening in."
								: "De budgetten bevatten \(Format.money(-data.difference)) meer dan er op de spaarrekening staat. Koppel de opnames aan een budget.",
							toon: .waarschuwing
						)
					}
					ForEach(data.groups) { group in
						HStack {
							Text(group.name).vertexTekst(Vertex.Tekst.kop)
							Spacer()
							if group.group { Text(Format.amount(group.total)).vertexTekst(Vertex.Stijl(grootte: 22, regelhoogte: 28, gewicht: 500)).foregroundStyle(Vertex.Kleur.tekstGedempt).monospacedDigit() }
						}
						.padding(.top, 4)
						VertexRijen(items: group.pots) { pot in
							NavigationLink(value: pot.id) { PotRow(pot: pot).padding(.horizontal, 16).padding(.vertical, 12).contentShape(Rectangle()) }
								.buttonStyle(.plain)
						}
					}
				}
				.onChange(of: data.groups.flatMap { $0.pots.map(\.id) }, initial: true) { _, ids in orders = [ids] }
			}
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
			CategoryIcon(name: pot.icon, size: 44, hue: pot.hue)
			VStack(alignment: .leading, spacing: 2) {
				HStack(alignment: .firstTextBaseline) {
					Text(pot.name).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd).lineLimit(1)
					Spacer(minLength: 8)
					Text(Format.amount(pot.balance))
						.vertexTekst(Vertex.Tekst.bodyVet).monospacedDigit()
						.foregroundStyle((pot.balance ?? 0) < 0 ? Vertex.Kleur.statusNegatief : Vertex.Kleur.tekstHoofd)
				}
				if !detail.isEmpty {
					Text(detail).vertexTekst(Vertex.Tekst.klein).foregroundStyle(pot.bar?.over == true ? Vertex.Kleur.statusNegatief : Vertex.Kleur.tekstGedempt).lineLimit(1)
				}
			}
		}
	}
}
