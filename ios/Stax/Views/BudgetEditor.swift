import SwiftUI

/// Budget, groep of inkomstenbron aanmaken of bewerken, zoals in Instellingen → Budgetten op de website.
struct BudgetEditor: View {
	enum Mode {
		/// Een bestaand budget of een bestaande groep, in de getoonde maand.
		case edit(BudgetDetail)
		/// Nieuw budget, eventueel al in een groep.
		case newBudget(group: Int?)
		case newGroup
		case newIncome
	}

	@Environment(Session.self) private var session
	@Environment(\.dismiss) private var dismiss
	let mode: Mode
	/// Maand waarvoor het bedrag per maand geldt.
	let month: String
	/// Na verwijderen: de pagina van dit budget sluiten.
	var onDeleted: () -> Void = {}

	@State private var name = ""
	@State private var icon = ""
	@State private var color = ""
	@State private var kind = "budget"
	@State private var apart = true
	@State private var goal = ""
	@State private var precision = Precision.maand
	@State private var goalYear = Calendar.current.component(.year, from: .now) + 1
	@State private var goalMonth = 1
	@State private var goalDay = Date.now
	@State private var groupId = 0
	@State private var amount = ""
	@State private var scope = "vanaf"
	@State private var groups: [GroupChoices.Group] = []
	@State private var incomeRoot = 0
	@State private var error: String?
	@State private var busy = false
	@State private var confirmDelete = false
	@State private var loaded = false

	enum Precision: String, CaseIterable { case geen = "Geen", jaar = "Jaar", maand = "Maand", dag = "Dag" }

	private var detail: BudgetDetail? { if case .edit(let d) = mode { d } else { nil } }
	private var isGroup: Bool {
		switch mode {
		case .edit(let d): d.node.group
		case .newGroup: true
		default: false
		}
	}
	private var isIncome: Bool {
		switch mode {
		case .edit(let d): d.node.tree == "inkomsten"
		case .newIncome: true
		default: false
		}
	}
	private var isNew: Bool { detail == nil }
	/// Een budget in de uitgaven heeft opties (spaart, doel) en een groep om in te staan.
	private var hasOptions: Bool { !isGroup && !isIncome }

	private var title: String {
		switch mode {
		case .edit(let d): d.node.group ? "Groep bewerken" : "Budget bewerken"
		case .newBudget: "Nieuw budget"
		case .newGroup: "Nieuwe groep"
		case .newIncome: "Nieuwe inkomsten"
		}
	}

	private var amountLabel: String {
		if isIncome { return "Verwacht per maand" }
		return kind == "budget" ? "Budget per maand" : "Inleg per maand"
	}

	/// Het icoon dat het budget krijgt als je niets kiest: dat van de groep.
	private var inheritedIcon: String? {
		guard hasOptions else { return nil }
		return groups.first { $0.id == groupId }?.icon
	}

	var body: some View {
		Group {
			VertexScherm(
				midden: title, gloed: false, onderruimte: 40,
				leiding: AnyView(VertexIcoonknop(systeemIcoon: "xmark", label: "Sluit", maat: 44) { dismiss() }),
				acties: AnyView(VertexKopKnop(titel: isNew ? "Voeg toe" : "Bewaar", vet: true, uit: busy || name.trimmingCharacters(in: .whitespaces).isEmpty) { Task { await save() } })
			) {
				if let error { VertexMelding(tekst: error, toon: .negatief) }
				VSection {
					VVeld("Naam", tekst: $name)
					if isGroup {
						VStack(alignment: .leading, spacing: 10) {
							Text("Kleur").foregroundStyle(Vertex.Kleur.tekstGedempt)
							HStack(spacing: 12) {
								ForEach(["accent", "lucht", "koraal", "mint", "zon"], id: \.self) { h in
									let gekozen = (color.isEmpty ? (detail?.node.hue ?? "accent") : color) == h
									Button { color = h } label: {
										Circle().fill(VertexHue(h).effen).frame(width: 34, height: 34)
											.overlay(Circle().strokeBorder(Vertex.Kleur.tekstHoofd, lineWidth: gekozen ? 2.5 : 0).padding(-4))
									}
									.buttonStyle(.plain)
									.accessibilityLabel(h)
									.accessibilityAddTraits(gekozen ? .isSelected : [])
								}
							}
							.padding(.horizontal, 4)
						}
						.padding(.vertical, 4)
					}
					VNavigationLink {
						IconPicker(selection: $icon, inherited: inheritedIcon, canInherit: hasOptions)
					} label: {
						HStack(spacing: 12) {
							CategoryIcon(name: icon.isEmpty ? inheritedIcon : icon, size: 36, hue: detail?.node.hue)
							Text("Icoon")
							Spacer()
							if icon.isEmpty && hasOptions { Text("zelfde als groep").foregroundStyle(Vertex.Kleur.tekstGedempt) }
						}
					}
				}

				if hasOptions {
					VertexSegmentbalk(opties: [("budget", "Budget"), ("spaarpot", "Spaart"), ("doelpot", "Doel")], waarde: $kind)
					VSection {
						if kind != "budget" {
							Toggle("Geld staat op de spaarrekening", isOn: $apart)
						}
					} footer: {
						Text(
							kind == "budget" ? "Een gewoon budget: je geeft uit tot het bedrag op is."
								: apart ? "Inleg komt binnen via een overboeking naar de spaarrekening."
								: "Het geld blijft op de betaalrekening; de geplande inleg komt er elke maand vanzelf bij."
						)
					}
					if kind == "doelpot" {
						VSection {
							VVeld("Doelbedrag", tekst: $goal, prompt: "0,00").keyboardType(.decimalPad)
							VKeuze("Moet er zijn", selection: $precision, opties: Precision.allCases.map { ($0, $0.rawValue) })
							switch precision {
							case .geen: EmptyView()
							case .jaar:
								VKeuze("Jaar", selection: $goalYear, opties: years.map { ($0, String($0)) })
							case .maand:
								VKeuze("Maand", selection: $goalMonth, opties: (1...12).map { ($0, Format.monthName($0)) })
								VKeuze("Jaar", selection: $goalYear, opties: years.map { ($0, String($0)) })
							case .dag:
								DatePicker("Datum", selection: $goalDay, displayedComponents: .date)
							}
						} header: {
							Text("DOEL")
						} footer: {
							Text("Zonder datum houdt Stax geen schema bij.")
						}
					}
					if !groups.isEmpty {
						VSection("In groep") {
							VKeuze("Groep", selection: $groupId, opties: groups.map { ($0.id, $0.name) })
						}
					}
				}

				if !isGroup {
					VSection {
						VVeld(amountLabel, tekst: $amount, prompt: "0,00").keyboardType(.decimalPad)
						VertexSegmentbalk(opties: [("vanaf", "Vanaf \(Format.month(month, year: false))"), ("alleen", "Alleen \(Format.month(month, year: false))")], waarde: $scope)
							.vzonderPadding().padding(8)
						if let d = detail?.edit, d.override != nil, let template = d.template {
							VKnopRij(actie: { Task { await resetOverride() } }) {
								Text("Terug naar standaard (\(Format.money(template.amount)))").foregroundStyle(Vertex.Kleur.accentStandaard)
							}
						}
					} header: {
						Text("BEDRAG")
					} footer: {
						Text("Vanaf wijzigt het standaardbedrag voor deze en de komende maanden. Alleen geldt voor één maand.")
					}
				}

				if let d = detail {
					VStack(alignment: .leading, spacing: 8) {
						Button("Verwijderen") { confirmDelete = true }
							.buttonStyle(VertexDestructieveKnop())
							.disabled(d.node.group && (d.edit?.childCount ?? 0) > 0)
						if d.node.group, (d.edit?.childCount ?? 0) > 0 {
							Text("Een groep met budgetten kan niet weg. Verplaats of verwijder eerst de budgetten.")
								.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).padding(.horizontal, 4)
						}
					}
				}
			}
			.vertexBevestiging(deleteQuestion, isPresented: $confirmDelete, knop: "Verwijderen") { Task { await remove() } }
			.task {
				await start()
				#if DEBUG
					// Alleen voor testen: -debugSave 1 wijzigt naam, doeldatum, icoon en bedrag en bewaart meteen.
					if UserDefaults.standard.bool(forKey: "debugSave") {
						UserDefaults.standard.removeObject(forKey: "debugSave")
						name += " 2"
						precision = .jaar
						goalYear = 2028
						icon = "key"
						amount = "40,00"
						await save()
					}
				#endif
			}
			.interactiveDismissDisabled(busy)
		}
	}

	private var years: [Int] {
		let now = Calendar.current.component(.year, from: .now)
		return Array(now...(now + 30))
	}

	private var deleteQuestion: String {
		guard let d = detail else { return "" }
		if d.node.group { return "Deze lege groep verwijderen?" }
		let n = d.edit?.bookings ?? 0
		return n > 0 ? "De \(n) \(n == 1 ? "boeking moet" : "boekingen moeten") daarna opnieuw ingedeeld worden. Budget verwijderen?" : "Dit budget verwijderen?"
	}

	/// Velden vullen vanuit het budget dat bewerkt wordt, en de groepen ophalen.
	private func start() async {
		if !loaded {
			loaded = true
			if let d = detail, let e = d.edit {
				name = d.node.name
				icon = e.ownIcon ?? ""
				color = e.ownColor ?? ""
				kind = d.node.kind == "groep" ? "budget" : d.node.kind
				apart = (e.funding ?? d.node.funding) != "betaal"
				if let cents = e.goalCents { goal = Format.input(cents) }
				if let date = e.goalDate {
					let parts = date.split(separator: "-").compactMap { Int($0) }
					if let y = parts.first { goalYear = y }
					if parts.count == 1 { precision = .jaar }
					if parts.count == 2 { precision = .maand; goalMonth = parts[1] }
					if parts.count == 3 {
						precision = .dag
						goalDay = Calendar.current.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2])) ?? .now
					}
				} else {
					precision = .geen
				}
				groupId = e.parentId ?? 0
				if let a = e.amount, a > 0 { amount = Format.input(a) }
			} else if case .newBudget(let g) = mode {
				groupId = g ?? 0
				precision = .geen
			}
		}
		if let choices: GroupChoices = try? await session.load({ try await $0.get("budgetten") }) {
			groups = choices.groups
			incomeRoot = choices.incomeRoot
			if groupId == 0 || !groups.contains(where: { $0.id == groupId }), hasOptions, let first = groups.first, isNew { groupId = first.id }
		}
	}

	private var goalDate: String {
		switch precision {
		case .geen: ""
		case .jaar: String(goalYear)
		case .maand: String(format: "%04d-%02d", goalYear, goalMonth)
		case .dag:
			{
				let c = Calendar.current.dateComponents([.year, .month, .day], from: goalDay)
				return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 1, c.day ?? 1)
			}()
		}
	}

	private struct Created: Decodable { let id: Int }
	private struct CreateBody: Encodable {
		var group: Bool?
		var parent_id: Int?
		var name: String
		var kind: String?
	}
	private struct SaveBody: Encodable {
		var name: String
		var icon: String
		var color: String?
		var kind: String
		var funding: String
		var goal_cents: Int?
		var goal_date: String
		var parent_id: Int?
	}
	private struct AmountBody: Encodable {
		var month: String
		var amount_cents: Int?
		var scope: String
	}

	private func save() async {
		error = nil
		let trimmed = name.trimmingCharacters(in: .whitespaces)
		var goalCents: Int?
		if hasOptions && kind == "doelpot" {
			guard let cents = Format.parse(goal), cents > 0 else {
				error = "Een doel heeft een doelbedrag nodig."
				return
			}
			goalCents = cents
		}
		var cents: Int?
		if !isGroup {
			let text = amount.trimmingCharacters(in: .whitespaces)
			if text.isEmpty {
				cents = isNew ? nil : 0
			} else {
				guard let c = Format.parse(text), c >= 0 else {
					error = "Vul een geldig bedrag in."
					return
				}
				cents = c
			}
		}
		busy = true
		defer { busy = false }
		do {
			let body = { (id: Int) in
				SaveBody(
					name: trimmed, icon: icon, color: isGroup && !color.isEmpty ? color : nil, kind: hasOptions ? kind : "", funding: hasOptions && kind != "budget" ? (apart ? "spaar" : "betaal") : "",
					goal_cents: goalCents, goal_date: goalCents != nil ? goalDate : "", parent_id: hasOptions ? groupId : nil
				)
			}
			var id: Int
			switch mode {
			case .edit(let d):
				id = d.node.id
				let _: Empty = try await session.load { try await $0.put("budgetten/\(id)", body(id)) }
			case .newGroup:
				let made: Created = try await session.load { try await $0.post("budgetten", CreateBody(group: true, name: trimmed)) }
				id = made.id
				if !icon.isEmpty || !color.isEmpty { let _: Empty = try await session.load { try await $0.put("budgetten/\(id)", body(id)) } }
			case .newBudget, .newIncome:
				let parent = isIncome ? incomeRoot : groupId
				let made: Created = try await session.load { try await $0.post("budgetten", CreateBody(parent_id: parent, name: trimmed, kind: hasOptions ? kind : nil)) }
				id = made.id
				let _: Empty = try await session.load { try await $0.put("budgetten/\(id)", body(id)) }
			}
			// Het bedrag alleen vastleggen als het veranderd is; anders ontstaat er een afwijking zonder reden.
			let before = detail?.edit?.amount.map { $0 > 0 ? Format.input($0) : "" } ?? ""
			if let cents, amount.trimmingCharacters(in: .whitespaces) != before, !(isNew && cents == 0) {
				let _: Empty = try await session.load { try await $0.put("budgetten/\(id)/bedrag", AmountBody(month: month, amount_cents: cents, scope: scope)) }
			}
			session.revision += 1
			dismiss()
		} catch {
			self.error = error.localizedDescription
		}
	}

	private func resetOverride() async {
		guard let d = detail else { return }
		busy = true
		defer { busy = false }
		do {
			let _: Empty = try await session.load { try await $0.put("budgetten/\(d.node.id)/bedrag", AmountBody(month: month, amount_cents: nil, scope: "alleen")) }
			session.revision += 1
			dismiss()
		} catch {
			self.error = error.localizedDescription
		}
	}

	private func remove() async {
		guard let d = detail else { return }
		busy = true
		defer { busy = false }
		do {
			try await session.load { try await $0.delete("budgetten/\(d.node.id)") }
			session.revision += 1
			dismiss()
			onDeleted()
		} catch {
			self.error = error.localizedDescription
		}
	}
}

/// Kies een icoon uit dezelfde set als op de website, met zoeken op woorden zoals "auto" of "vakantie".
struct IconPicker: View {
	@Binding var selection: String
	/// Het icoon van de groep, voor "zelfde als groep".
	let inherited: String?
	let canInherit: Bool
	@Environment(\.dismiss) private var dismiss
	@State private var query = ""

	private var groups: [(name: String, icons: [(name: String, words: String)])] {
		let q = query.trimmingCharacters(in: .whitespaces).lowercased()
		guard !q.isEmpty else { return IconCatalog.groups }
		return IconCatalog.groups.compactMap { g in
			let hits = g.icons.filter { $0.words.contains(q) || $0.name.contains(q) }
			return hits.isEmpty ? nil : (g.name, hits)
		}
	}

	var body: some View {
		VertexScherm(titel: "Icoon", terug: "Terug", gloed: false, onderruimte: 40) {
			VertexZoekveld(prompt: "Zoek, bijv. auto of vakantie", tekst: $query)
			VStack(alignment: .leading, spacing: 8) {
				if canInherit && query.isEmpty {
					Button {
						selection = ""
						dismiss()
					} label: {
						HStack(spacing: 12) {
							CategoryIcon(name: inherited, size: 36)
							Text("Zelfde als de groep").foregroundStyle(Vertex.Kleur.tekstHoofd)
							Spacer()
							if selection.isEmpty { VSym("checkmark").foregroundStyle(Vertex.Kleur.accentStandaard) }
						}
						.padding(12)
						.vertexKaart(1, radius: 16)
					}
					.buttonStyle(.plain)
				}
				ForEach(groups, id: \.name) { group in
					Text(group.name.uppercased()).vertexTekst(Vertex.Tekst.label).foregroundStyle(Vertex.Kleur.tekstGedempt).padding(.top, 10).padding(.horizontal, 4)
					LazyVGrid(columns: [GridItem(.adaptive(minimum: 52), spacing: 8)], spacing: 8) {
						ForEach(group.icons, id: \.name) { icon in
							Button {
								selection = icon.name
								dismiss()
							} label: {
								CategoryIcon(name: icon.name, size: 46, solid: selection == icon.name)
									.frame(maxWidth: .infinity)
									.padding(.vertical, 4)
							}
							.buttonStyle(.plain)
							.accessibilityLabel(icon.words)
						}
					}
				}
				if groups.isEmpty {
					Text("Geen icoon gevonden voor “\(query)”.").foregroundStyle(Vertex.Kleur.tekstGedempt).padding(.top, 20)
				}
			}
		}
	}
}
