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
				List {
					Section {
						Totals(data: data)
							.listRowInsets(EdgeInsets())
							.listRowBackground(Color.clear)
					}
					if data.openTotal > 0 || data.refunds.n > 0 {
						Section {
							if data.open > 0 {
								Button(action: showBookings) {
									Label("\(data.open) \(data.open == 1 ? "boeking" : "boekingen") uit \(Format.month(data.month, year: false)) nog indelen", systemImage: "tray.full.fill")
								}
							}
							// De badge bij Boekingen telt alle maanden; zo zie je waar het verschil vandaan komt.
							if data.openTotal > data.open {
								Button(action: showBookings) {
									Label("\(data.openTotal - data.open) \(data.openTotal - data.open == 1 ? "boeking" : "boekingen") in andere maanden nog indelen", systemImage: "tray.full")
								}
							}
							if data.refunds.n > 0 {
								Label("\(Format.money(data.refunds.cents)) terug verwacht", systemImage: "arrow.uturn.backward.circle.fill")
									.foregroundStyle(.secondary)
							}
						}
						.font(.subheadline)
					}
					Section {
						ForEach(data.groups) { group in
							NavigationLink(value: group.id) {
								HStack(spacing: 12) {
									CategoryIcon(name: group.icon, size: 38, solid: true)
									Text(group.name).font(.body.weight(.semibold))
									Spacer(minLength: 8)
									Text(Format.amount(group.balance ?? 0))
										.font(.body.weight(.semibold).monospacedDigit())
										.foregroundStyle((group.balance ?? 0) < 0 ? .red : .primary)
								}
								.padding(.vertical, 4)
							}
						}
					} header: {
						Text("Budgetten").font(.title3.weight(.bold)).textCase(nil).foregroundStyle(.primary).padding(.top, 6)
					}
					if !data.income.isEmpty {
						Section {
							ForEach(data.income) { row in
								NavigationLink(value: row.id) {
									HStack(spacing: 12) {
										CategoryIcon(name: row.icon, size: 32)
										VStack(alignment: .leading, spacing: 2) {
											Text(row.name)
											if row.plan > 0 {
												Text("verwacht \(Format.amount(row.plan))").font(.caption).foregroundStyle(.secondary)
											}
										}
										Spacer()
										Text(Format.amount(row.net)).font(.body.weight(.semibold).monospacedDigit()).foregroundStyle(row.net > 0 ? .green : .secondary)
									}
								}
							}
						} header: {
							Text("Inkomsten").font(.title3.weight(.bold)).textCase(nil).foregroundStyle(.primary).padding(.top, 6)
						}
					}
				}
				.listStyle(.insetGrouped)
				.listSectionSpacing(.compact)
				.environment(\.defaultMinListHeaderHeight, 6)
				.contentMargins(.top, 0, for: .scrollContent)
				.contentMargins(.bottom, 72, for: .scrollContent)
				.navigationTitle(Format.monthTitle(data.month))
				.navigationBarTitleDisplayMode(.large)
				.toolbar {
					ToolbarItem(placement: .topBarTrailing) {
						Menu {
							Button { adding = .budget } label: { Label("Nieuw budget", systemImage: "plus.circle") }
							Button { adding = .group } label: { Label("Nieuwe groep", systemImage: "folder.badge.plus") }
							Button { adding = .income } label: { Label("Nieuwe inkomsten", systemImage: "arrow.down.circle") }
							Divider()
							Button { importing = true } label: { Label("Bankexport uploaden", systemImage: "square.and.arrow.down") }
						} label: {
							Image(systemName: "plus")
						}
						.accessibilityLabel("Nieuw")
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
						.padding(.bottom, 8)
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

/// Inkomsten en uitgaven staan vooraan: groot, met een gradient. Gebudgetteerd en wat er over is komen daarna, kleiner en lichter.
private struct Totals: View {
	let data: Overview

	private var expected: Int { data.totals.expected ?? 0 }

	var body: some View {
		let t = data.totals
		VStack(spacing: 12) {
			HStack(spacing: 12) {
				Tile(
					label: "Inkomsten",
					cents: t.inkomsten,
					gradient: .staxGradient,
					info: "Wat er deze maand binnenkwam."
						+ (expected > 0 ? " Verwacht: \(Format.money(expected))\(t.incomeNote.map { ", \($0)" } ?? "")." : " Vul bij Inkomsten in wat je verwacht om vooruit te plannen.")
				)
				Tile(
					label: "Uitgaven",
					cents: t.uitgaven,
					gradient: LinearGradient(colors: [Color(red: 0x8b / 255, green: 0x9b / 255, blue: 0xf8 / 255), Color(red: 0x50 / 255, green: 0x48 / 255, blue: 0xcf / 255)], startPoint: .topLeading, endPoint: .bottomTrailing),
					info: "Wat er deze maand is uitgegeven, met terugbetalingen er al af."
				)
			}
			// Minder belangrijk: één rustige grijze tegel, zonder gradient.
			HStack(spacing: 0) {
				QuietStat(label: "Gebudgetteerd", cents: t.planned, info: "Alle budgetten van deze maand samen, inclusief wat je inlegt in budgetten die sparen.")
				Divider().frame(height: 40)
				QuietStat(
					label: "Over",
					cents: t.toDistribute,
					red: t.toDistribute < 0,
					info: "\(t.toDistributeBasis == "verwacht inkomen" ? "Verwacht inkomen" : "Inkomsten") min gebudgetteerd.\(t.incomeNote.map { " Er is \($0)." } ?? "")"
				)
			}
			.padding(.vertical, 14)
			.background(Color(.systemGray5), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
		}
		.padding(.top, 8)
	}
}

/// Een grote tegel met gradient voor wat het belangrijkst is.
private struct Tile: View {
	let label: String
	let cents: Int
	let gradient: LinearGradient
	let info: String
	@State private var showInfo = false

	var body: some View {
		VStack(alignment: .leading, spacing: 10) {
			HStack {
				Text(label).font(.headline).foregroundStyle(Color.white.opacity(0.9))
				Spacer(minLength: 4)
				InfoButton(label: label, text: info, tint: Color.white.opacity(0.7))
			}
			Text(Format.money(cents))
				.font(.title.weight(.bold).monospacedDigit())
				.foregroundStyle(.white)
				.lineLimit(1)
				.minimumScaleFactor(0.6)
		}
		.padding(18)
		.frame(maxWidth: .infinity, minHeight: 112, alignment: .topLeading)
		.background(gradient, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
		.shadow(color: Color.stax.opacity(0.25), radius: 10, y: 5)
	}
}

/// Een rustig getal in de grijze tegel.
private struct QuietStat: View {
	let label: String
	let cents: Int
	var red = false
	let info: String

	var body: some View {
		VStack(alignment: .leading, spacing: 4) {
			HStack {
				Text(label).font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
				Spacer(minLength: 4)
				InfoButton(label: label, text: info, tint: Color.secondary.opacity(0.6))
			}
			Text(Format.money(cents))
				.font(.title3.weight(.bold).monospacedDigit())
				.foregroundStyle(red ? Color.red : Color.primary)
				.lineLimit(1)
				.minimumScaleFactor(0.6)
		}
		.padding(.horizontal, 16)
		.frame(maxWidth: .infinity, alignment: .leading)
	}
}

private struct InfoButton: View {
	let label: String
	let text: String
	let tint: Color
	@State private var show = false

	var body: some View {
		Button { show = true } label: {
			Image(systemName: "info.circle").font(.subheadline).foregroundStyle(tint)
		}
		.buttonStyle(.plain)
		.accessibilityLabel("Uitleg over \(label.lowercased())")
		.popover(isPresented: $show) {
			Text(text).font(.subheadline).padding().frame(width: 260, alignment: .leading).presentationCompactAdaptation(.popover)
		}
	}
}
