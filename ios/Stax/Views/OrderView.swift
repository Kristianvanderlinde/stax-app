import SwiftUI

/// Instellingen → Budgetten: groepen, budgetten en inkomsten aanmaken, bewerken (tik op een rij) en in volgorde
/// slepen. Een budget naar een andere groep zetten doe je in het bewerkscherm ("In groep").
struct OrderView: View {
	@Environment(Session.self) private var session
	@State private var data: Ordering?
	@State private var error: String?
	@State private var editing: BudgetDetail?
	@State private var adding: Adding?
	/// Slepen: de rij die je vasthoudt, hoe ver hij van zijn plek is, en wat er na het loslaten naar de server moet.
	@State private var sleep: String?
	@State private var sleepVerschuiving: CGFloat = 0
	@State private var sleepVerzet: CGFloat = 0
	/// Afstand van rij tot rij: rij plus scheidingslijn.
	private let rijHoogte: CGFloat = 55
	@State private var naLoslaten: (() -> Void)?

	private enum Adding: String, Identifiable {
		case budget, group, income
		var id: String { rawValue }
	}

	private var month: String { Date.now.formatted(.iso8601.year().month()) }

	var body: some View {
		Group {
			if let data {
				VertexScherm(
					titel: "Budgetten", terug: "Instellingen", gloed: false,
					acties: AnyView(
						VertexMenu {
							Button { adding = .budget } label: { Label("Nieuw budget", vSym: "plus.circle") }
							Button { adding = .group } label: { Label("Nieuwe groep", vSym: "folder.badge.plus") }
							Button { adding = .income } label: { Label("Nieuwe inkomsten", vSym: "arrow.down.circle") }
						} label: {
							VertexIcoonLabel(systeemIcoon: "plus")
						}
						.accessibilityLabel("Nieuw")
					)
				) {
					Text("Tik op een rij om te bewerken. Sleep aan de streepjes om de volgorde te wijzigen.")
						.vertexTekst(Vertex.Tekst.body).foregroundStyle(Vertex.Kleur.tekstGedempt)
					if let error { VertexMelding(tekst: error, toon: .negatief) }
					VertexSectiekop(titel: "Groepen")
					VSection {
						ForEach(data.groups) { g in
							sortRow(g.id, g.name, g.icon, hue: g.hue, effen: true, tag: "g", ids: data.groups.map(\.id)) { from, to in moveGroup(from, to) }
						}
					}
					ForEach(Array(data.groups.enumerated()), id: \.element.id) { index, g in
						VertexSectiekop(titel: g.name)
						VSection {
							ForEach(g.budgets) { b in
								sortRow(b.id, b.name, b.icon, hue: b.hue, effen: false, tag: "b\(index)", ids: g.budgets.map(\.id)) { from, to in moveBudget(group: index, from, to) }
							}
						}
					}
					if !data.income.isEmpty {
						VertexSectiekop(titel: "Inkomsten")
						VSection {
							ForEach(data.income) { i in
								sortRow(i.id, i.name, i.icon, hue: i.hue, effen: false, tag: "i", ids: data.income.map(\.id)) { from, to in moveIncome(from, to) }
							}
						}
					}
				}
			} else if let error {
				ContentUnavailableView { Label("Kon Stax niet bereiken", vSym: "wifi.exclamationmark") } description: { Text(error) }
			} else {
				ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
			}
		}
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

	/// Rij met tegel en naam (tik = bewerken) en een handvat om te slepen. De rij volgt je vinger, de andere rijen schuiven mee opzij.
	private func sortRow(_ id: Int, _ name: String, _ icon: String?, hue: String?, effen: Bool, tag: String, ids: [Int], move: @escaping (IndexSet, Int) -> Void) -> some View {
		let sleutel = "\(tag):\(id)"
		let vast = sleep == sleutel
		return HStack(spacing: 12) {
			Button { open(id) } label: {
				HStack(spacing: 12) {
					VertexTegel(image: iconImage(icon), hue: VertexHue(hue), effen: effen, maat: 38)
					Text(name).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
					Spacer(minLength: 8)
				}
				.contentShape(Rectangle())
			}
			.buttonStyle(.plain)
			VSym("line.3.horizontal", 15).foregroundStyle(vast ? Vertex.Kleur.accentStandaard : Vertex.Kleur.tekstVaag)
				.frame(width: 44, height: 44)
				.contentShape(Rectangle())
				.gesture(
					DragGesture(minimumDistance: 0, coordinateSpace: .global)
						.onChanged { w in
							if sleep == nil {
								sleep = sleutel; sleepVerzet = 0
								UIImpactFeedbackGenerator(style: .medium).impactOccurred()
							}
							guard sleep == sleutel, let van = ids.firstIndex(of: id) else { return }
							let stappen = Int(((w.translation.height - sleepVerzet) / rijHoogte).rounded())
							let naar = min(max(van + stappen, 0), ids.count - 1)
							if naar != van {
								withAnimation(.spring(duration: 0.28, bounce: 0.1)) { move(IndexSet(integer: van), naar > van ? naar + 1 : naar) }
								sleepVerzet += CGFloat(naar - van) * rijHoogte
								UISelectionFeedbackGenerator().selectionChanged()
							}
							sleepVerschuiving = w.translation.height - sleepVerzet
						}
						.onEnded { _ in
							withAnimation(.spring(duration: 0.3, bounce: 0.12)) { sleepVerschuiving = 0; sleep = nil }
							naLoslaten?(); naLoslaten = nil
						}
				)
				.accessibilityLabel("\(name) verslepen")
		}
		// De rij vult de hele breedte van de kaart (zelf padding), zodat hij als geheel opgetild wordt.
		.padding(.horizontal, 16)
		.frame(height: 54)
		.vzonderPadding()
		.background(vast ? Vertex.Kleur.hoogte2Vlak : Color.clear, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
		.scaleEffect(vast ? 1.02 : 1)
		.offset(y: vast ? sleepVerschuiving : 0)
		.shadow(color: vast ? Vertex.Kleur.schaduw : .clear, radius: 10, y: 6)
		.zIndex(vast ? 1 : 0)
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
		let volgorde = d.groups.map(\.id); let ouder = d.expensesRoot
		naLoslaten = { send(id, parent: ouder, in: volgorde) }
	}

	private func moveBudget(group: Int, _ from: IndexSet, _ to: Int) {
		guard var d = data, let i = from.first else { return }
		let id = d.groups[group].budgets[i].id
		d.groups[group].budgets.move(fromOffsets: from, toOffset: to)
		data = d
		let volgorde = d.groups[group].budgets.map(\.id); let ouder = d.groups[group].id
		naLoslaten = { send(id, parent: ouder, in: volgorde) }
	}

	private func moveIncome(_ from: IndexSet, _ to: Int) {
		guard var d = data, let i = from.first else { return }
		let id = d.income[i].id
		d.income.move(fromOffsets: from, toOffset: to)
		data = d
		let volgorde = d.income.map(\.id); let ouder = d.incomeRoot
		naLoslaten = { send(id, parent: ouder, in: volgorde) }
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
