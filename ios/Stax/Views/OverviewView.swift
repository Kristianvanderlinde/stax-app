import SwiftUI

/// Budgetoverzicht van een maand: vier gelijke bedragen bovenaan, daarna per groep de budgetten.
struct OverviewView: View {
	@Binding var openCount: Int
	let showBookings: () -> Void
	@State private var month: String?
	/// Volgorde van budgetten en groepen, voor bladeren op de detailpagina.
	@State private var orders: [[Int]] = []
	@State private var path: [Int] = []
	/// Wat er nieuw aangemaakt wordt: een budget, groep of inkomstenbron.
	@State private var adding: Add?
	@State private var importing = false
	private enum Add: String, Identifiable {
		case budget, group, income
		var id: String { rawValue }
	}
	#if DEBUG
		/// Alleen voor testen in de simulator: -debugOpen <id> opent dat budget zodra het overzicht geladen is.
		@State private var debugOpen: Int? = UserDefaults.standard.integer(forKey: "debugOpen") > 0 ? UserDefaults.standard.integer(forKey: "debugOpen") : nil
	#endif

	var body: some View {
		NavigationStack(path: $path) {
			Loader(key: month ?? "", fetch: { try await $0.get("overzicht", ["maand": month]) as Overview }) { (data: Overview) in
				let ids = [data.groups.flatMap { $0.rows.map(\.id) } + data.income.map(\.id), data.groups.map(\.id)]
				VertexScherm(
					titel: Format.monthTitle(data.month), gloed: true,
					acties: AnyView(
						VertexMenu {
							Button { adding = .budget } label: { Label("Nieuw budget", vSym: "plus.circle") }
							Button { adding = .group } label: { Label("Nieuwe groep", vSym: "folder.badge.plus") }
							Button { adding = .income } label: { Label("Nieuwe inkomsten", vSym: "arrow.down.circle") }
							Divider()
							Button { importing = true } label: { Label("Bankexport uploaden", vSym: "square.and.arrow.down") }
						} label: {
							VertexIcoonLabel(systeemIcoon: "plus")
						}
						.accessibilityLabel("Nieuw")
					)
				) {
						Totals(data: data)
						if data.openTotal > 0 || data.refunds.n > 0 {
							VStack(spacing: 0) {
								if data.open > 0 {
									Melding(icoon: "tray.full", tekst: "\(data.open) \(data.open == 1 ? "boeking" : "boekingen") uit \(Format.month(data.month, year: false)) nog indelen", actie: showBookings)
								}
								// De badge bij Boekingen telt alle maanden; zo zie je waar het verschil vandaan komt.
								if data.openTotal > data.open {
									Melding(icoon: "tray.full", tekst: "\(data.openTotal - data.open) \(data.openTotal - data.open == 1 ? "boeking" : "boekingen") in andere maanden nog indelen", actie: showBookings)
								}
								if data.refunds.n > 0 {
									Melding(icoon: "arrow.uturn.backward", tekst: "\(Format.money(data.refunds.cents)) terug verwacht", actie: nil)
								}
							}
							.vertexKaart()
						}
						VertexSectiekop(titel: "Budgetten").padding(.top, Vertex.Ruimte.r2)
						VertexRijen(items: data.groups) { group in
							NavigationLink(value: group.id) {
								HStack(spacing: 12) {
									VertexTegel(image: iconImage(group.icon), hue: VertexHue(group.hue), effen: true)
									Text(group.name).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
									Spacer(minLength: 8)
									Text(Format.amount(group.balance ?? 0))
										.vertexTekst(Vertex.Tekst.bodyVet).monospacedDigit()
										.foregroundStyle((group.balance ?? 0) < 0 ? Vertex.Kleur.statusNegatief : Vertex.Kleur.tekstHoofd)
									VSym("chevron.right", 13).foregroundStyle(Vertex.Kleur.tekstVaag)
								}
								.padding(.horizontal, 16).padding(.vertical, 12)
								.contentShape(Rectangle())
							}
							.buttonStyle(.plain)
						}
						if !data.income.isEmpty {
							VertexSectiekop(titel: "Inkomsten").padding(.top, Vertex.Ruimte.r2)
							VertexRijen(items: data.income) { row in
								NavigationLink(value: row.id) {
									HStack(spacing: 12) {
										VertexTegel(image: iconImage(row.icon), hue: VertexHue(row.hue))
										VStack(alignment: .leading, spacing: 2) {
											Text(row.name).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
											if row.plan > 0 {
												Text("verwacht \(Format.amount(row.plan))").vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
											}
										}
										Spacer(minLength: 8)
										Text(Format.amount(row.net)).vertexTekst(Vertex.Tekst.bodyVet).monospacedDigit()
											.foregroundStyle(row.net > 0 ? Vertex.Kleur.statusPositief : Vertex.Kleur.tekstGedempt)
										VSym("chevron.right", 13).foregroundStyle(Vertex.Kleur.tekstVaag)
									}
									.padding(.horizontal, 16).padding(.vertical, 12)
									.contentShape(Rectangle())
								}
								.buttonStyle(.plain)
							}
						}
				}
				.sheet(isPresented: $importing) { ImportSheet() }
				.sheet(item: $adding) { kind in
					switch kind {
					case .budget: BudgetEditor(mode: .newBudget(group: nil), month: data.month)
					case .group: BudgetEditor(mode: .newGroup, month: data.month)
					case .income: BudgetEditor(mode: .newIncome, month: data.month)
					}
				}
				.overlay(alignment: .bottom) {
					PeriodBar(month: Binding(get: { month ?? data.month }, set: { month = $0 }), months: Format.choices(data.months))
						.padding(.bottom, VertexTabbalk<RootView.Tab>.periodeOnderrand)
				}
				.onAppear { openCount = data.openTotal }
				.onChange(of: data.openTotal) { _, n in openCount = n }
				.onChange(of: ids, initial: true) { _, v in
					orders = v
					#if DEBUG
						if let id = debugOpen {
							debugOpen = nil
							path = [id]
						}
							if let raw = UserDefaults.standard.string(forKey: "debugAdd"), adding == nil, let kind = Add(rawValue: raw) {
								UserDefaults.standard.removeObject(forKey: "debugAdd")
								adding = kind
							}
					#endif
				}
			}
			.navigationTitle("Overzicht")
			.navigationDestination(for: Int.self) { id in BudgetDetailView(id: id, month: month, orders: orders) }
		}
	}
}

/// Inkomsten en uitgaven staan vooraan als gekleurde tegels; Gebudgetteerd en Over staan daaronder in één kaart.
private struct Totals: View {
	let data: Overview

	private var expected: Int { data.totals.expected ?? 0 }

	var body: some View {
		let t = data.totals
		VStack(spacing: 12) {
			HStack(spacing: 12) {
				Tile(
					label: "Inkomsten", icoon: "arrow.down.left",
					cents: t.inkomsten,
					info: "Wat er deze maand binnenkwam."
						+ (expected > 0 ? " Verwacht: \(Format.money(expected))\(t.incomeNote.map { ", \($0)" } ?? "")." : " Vul bij Inkomsten in wat je verwacht om vooruit te plannen.")
				)
				Tile(label: "Uitgaven", icoon: "arrow.up.right", cents: t.uitgaven, info: "Wat er deze maand is uitgegeven, met terugbetalingen er al af.")
			}
			HStack(spacing: 0) {
				QuietStat(label: "Gebudgetteerd", cents: t.planned, info: "Alle budgetten van deze maand samen, inclusief wat je inlegt in budgetten die sparen.")
				QuietStat(
					label: "Over",
					cents: t.toDistribute,
					red: t.toDistribute < 0,
					info: "\(t.toDistributeBasis == "verwacht inkomen" ? "Verwacht inkomen" : "Inkomsten") min gebudgetteerd.\(t.incomeNote.map { " Er is \($0)." } ?? "")"
				)
			}
			.padding(.vertical, 14)
			.vertexKaart(1, radius: 22)
		}
	}
}

/// Een gekleurde tegel met verloop voor wat het belangrijkst is.
private struct Tile: View {
	let label: String
	let icoon: String
	let cents: Int
	let info: String

	var body: some View {
		VStack(alignment: .leading, spacing: 10) {
			HStack(spacing: 6) {
				VSym(icoon, 14)
				Text(label).vertexTekst(Vertex.Tekst.bodyVet)
				Spacer(minLength: 4)
				InfoButton(label: label, text: info, tint: Color.white.opacity(0.75))
			}
			.foregroundStyle(Vertex.Kleur.tekstOpAccent)
			Text(Format.money(cents))
				.vertexTekst(Vertex.Tekst.subkop).monospacedDigit()
				.foregroundStyle(Vertex.Kleur.tekstOpAccent)
				.lineLimit(1)
				.minimumScaleFactor(0.6)
		}
		.padding(16)
		.frame(maxWidth: .infinity, minHeight: 88, alignment: .topLeading)
		.background(Vertex.verloopAccent, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
		.vertexAccentSchaduw()
	}
}

/// Een rustig getal in de witte kaart.
private struct QuietStat: View {
	let label: String
	let cents: Int
	var red = false
	let info: String

	var body: some View {
		VStack(alignment: .leading, spacing: 2) {
			HStack {
				Text(label).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
				Spacer(minLength: 4)
				InfoButton(label: label, text: info, tint: Vertex.Kleur.tekstVaag)
			}
			Text(Format.money(cents))
				.vertexTekst(Vertex.Tekst.bodyVet).monospacedDigit()
				.foregroundStyle(red ? Vertex.Kleur.statusNegatief : Vertex.Kleur.tekstHoofd)
				.lineLimit(1)
				.minimumScaleFactor(0.6)
		}
		.padding(.horizontal, 16)
		.frame(maxWidth: .infinity, alignment: .leading)
	}
}

/// Een regel in de meldingenkaart: icoon, tekst en (als je erop kunt tikken) een chevron.
private struct Melding: View {
	let icoon: String
	let tekst: String
	let actie: (() -> Void)?

	var body: some View {
		let inhoud = HStack(spacing: 12) {
			VSym(icoon, 16).foregroundStyle(actie == nil ? Vertex.Kleur.tekstGedempt : Vertex.Kleur.accentStandaard).frame(width: 20)
			Text(tekst).vertexTekst(Vertex.Tekst.body).foregroundStyle(actie == nil ? Vertex.Kleur.tekstGedempt : Vertex.Kleur.tekstHoofd).multilineTextAlignment(.leading)
			Spacer(minLength: 8)
			if actie != nil { VSym("chevron.right", 13).foregroundStyle(Vertex.Kleur.tekstVaag) }
		}
		.padding(.horizontal, 16).padding(.vertical, 11)
		.frame(maxWidth: .infinity, alignment: .leading)
		.contentShape(Rectangle())
		if let actie { Button(action: actie) { inhoud }.buttonStyle(.plain) } else { inhoud }
	}
}

private struct InfoButton: View {
	let label: String
	let text: String
	let tint: Color
	var body: some View {
		VertexMenu {
			Text(text).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).padding(8)
		} label: {
			VSym("info.circle", 16).foregroundStyle(tint)
		}
		.accessibilityLabel("Uitleg over \(label.lowercased())")
	}
}
