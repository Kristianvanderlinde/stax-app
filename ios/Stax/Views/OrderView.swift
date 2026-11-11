import SwiftUI

/// Instellingen → Budgetten: groepen, budgetten en inkomsten aanmaken, bewerken (tik op een rij) en in volgorde
/// slepen. Een budget naar een andere groep zetten doe je in het bewerkscherm ("In groep").
struct OrderView: View {
	@Environment(Session.self) private var session
	@State private var data: Ordering?
	@State private var error: String?
	@State private var editing: BudgetDetail?
	@State private var adding: Adding?

	private enum Adding: String, Identifiable {
		case budget, group, income
		var id: String { rawValue }
	}

	private var month: String { Date.now.formatted(.iso8601.year().month()) }

	var body: some View {
		Group {
			if let data {
				List {
					if let error { Section { Label(error, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.red) } }
					Section {
						ForEach(data.groups) { g in row(g.id, g.name, g.icon) }
							.onMove { from, to in moveGroup(from, to) }
					} header: {
						Text("Groepen")
					} footer: {
						Text("Tik op een rij om te bewerken. Sleep aan de streepjes om de volgorde te wijzigen.")
					}
					ForEach(Array(data.groups.enumerated()), id: \.element.id) { index, g in
						Section(g.name) {
							ForEach(g.budgets) { b in row(b.id, b.name, b.icon) }
								.onMove { from, to in moveBudget(group: index, from, to) }
						}
					}
					if !data.income.isEmpty {
						Section("Inkomsten") {
							ForEach(data.income) { i in row(i.id, i.name, i.icon) }
								.onMove { from, to in moveIncome(from, to) }
						}
					}
				}
				.environment(\.editMode, .constant(.active))
				.toolbar {
					ToolbarItem(placement: .topBarTrailing) {
						Menu {
							Button { adding = .budget } label: { Label("Nieuw budget", systemImage: "plus.circle") }
							Button { adding = .group } label: { Label("Nieuwe groep", systemImage: "folder.badge.plus") }
							Button { adding = .income } label: { Label("Nieuwe inkomsten", systemImage: "arrow.down.circle") }
						} label: { Image(systemName: "plus") }
						.accessibilityLabel("Nieuw")
					}
				}
			} else if let error {
				ContentUnavailableView("Kon Stax niet bereiken", systemImage: "wifi.exclamationmark", description: Text(error))
			} else {
				ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
			}
		}
		.navigationTitle("Budgetten")
		.navigationBarTitleDisplayMode(.inline)
		.task { await load() }
		.sheet(item: $editing, onDismiss: { Task { await load() } }) { d in
			BudgetEditor(mode: .edit(d), month: d.month)
		}
		.sheet(item: $adding, onDismiss: { Task { await load() } }) { kind in
			switch kind {
			case .budget: BudgetEditor(mode: .newBudget(group: nil), month: month)
			case .group: BudgetEditor(mode: .newGroup, month: month)
			case .income: BudgetEditor(mode: .newIncome, month: month)
			}
		}
		// Het overzicht en de andere schermen laden opnieuw als je terugkomt.
		.onDisappear { session.revision += 1 }
	}

	private func row(_ id: Int, _ name: String, _ icon: String?) -> some View {
		Button { open(id) } label: {
			HStack(spacing: 12) {
				CategoryIcon(name: icon, size: 32)
				Text(name)
				Spacer()
			}
			.contentShape(Rectangle())
		}
		.buttonStyle(.plain)
	}

	private func open(_ id: Int) {
		Task {
			do { editing = try await session.load { try await $0.get("budgetten/\(id)", ["maand": month]) as BudgetDetail } }
			catch { self.error = error.localizedDescription }
		}
	}

	private func load() async {
		do {
			data = try await session.load { try await $0.get("budgetten/volgorde") as Ordering }
			error = nil
		} catch { self.error = error.localizedDescription }
	}

	private func moveGroup(_ from: IndexSet, _ to: Int) {
		guard var d = data, let i = from.first else { return }
		let id = d.groups[i].id
		d.groups.move(fromOffsets: from, toOffset: to)
		data = d
		send(id, parent: d.expensesRoot, in: d.groups.map(\.id))
	}

	private func moveBudget(group: Int, _ from: IndexSet, _ to: Int) {
		guard var d = data, let i = from.first else { return }
		let id = d.groups[group].budgets[i].id
		d.groups[group].budgets.move(fromOffsets: from, toOffset: to)
		data = d
		send(id, parent: d.groups[group].id, in: d.groups[group].budgets.map(\.id))
	}

	private func moveIncome(_ from: IndexSet, _ to: Int) {
		guard var d = data, let i = from.first else { return }
		let id = d.income[i].id
		d.income.move(fromOffsets: from, toOffset: to)
		data = d
		send(id, parent: d.incomeRoot, in: d.income.map(\.id))
	}

	/// Zet `id` op de plek die het nu in `order` heeft: vóór het volgende item, of achteraan.
	private func send(_ id: Int, parent: Int, in order: [Int]) {
		struct Body: Encodable {
			let parentId: Int
			let beforeId: Int?
			enum CodingKeys: String, CodingKey { case parentId = "parent_id"; case beforeId = "before_id" }
		}
		let at = order.firstIndex(of: id) ?? 0
		let before = at + 1 < order.count ? order[at + 1] : nil
		Task {
			do {
				let _: Empty = try await session.load { try await $0.post("budgetten/\(id)/plaats", Body(parentId: parent, beforeId: before)) }
				error = nil
			} catch {
				self.error = error.localizedDescription
				await load()
			}
		}
	}
}
