import SwiftUI

/// Een boeking indelen. Kies een budget en hij is opgeslagen; daarna door naar de volgende in de rij.
struct ClassifyView: View {
	@Environment(Session.self) private var session
	let data: Bookings
	let queue: [Booking]
	let close: () -> Void

	@State private var row: Booking
	@State private var splitting = false
	@State private var parts: [Part] = []
	@State private var remember = true
	@State private var fromPot = true
	@State private var refundOn = false
	@State private var refundAmount = ""
	@State private var excluded = false
	@State private var note = ""
	@State private var busy = false
	@State private var error: String?
	@State private var message: String?

	struct Part: Identifiable {
		let id = UUID()
		var category: Int?
		var amount: String
	}

	init(row: Booking, data: Bookings, queue: [Booking], close: @escaping () -> Void) {
		self.data = data
		self.queue = queue
		self.close = close
		_row = State(initialValue: row)
	}

	// MARK: - Regels zoals op de website

	private var savingsIds: Set<Int> { Set(data.options.filter(\.savings).map(\.id)) }

	/// Op de spaarrekening alleen spaarpotten (en inkomsten als er een inkomstenpot is).
	private func allowed(_ o: CategoryOption) -> Bool {
		row.needsPot ? (o.savings || (data.incomePot != nil && o.tree == "inkomsten")) : true
	}

	/// Uitgave van de betaalrekening op een spaarpot: komt hij uit de pot of niet?
	private var onPot: Bool {
		row.amountCents < 0 && !row.isTransfer && !row.needsPot && row.splits.contains { savingsIds.contains($0.categoryId) }
	}

	private var incomeFirst: Bool {
		row.amountCents > 0 && (!row.needsPot || (data.incomePot != nil && !row.isTransfer))
	}

	/// Uitgaven waar deze binnenkomende boeking een teruggave van kan zijn; een passend bedrag eerst.
	private var candidates: [ExpectedRefund] {
		guard row.amountCents > 0, !row.needsPot, !row.isTransfer, row.refundSource == nil else { return [] }
		return data.refunds
			.filter { $0.bookingDate <= row.bookingDate }
			.sorted { ($0.expected - $0.received == row.amountCents ? 0 : 1) < ($1.expected - $1.received == row.amountCents ? 0 : 1) }
			.prefix(6)
			.map { $0 }
	}

	private var withdrawals: [Withdrawal] {
		guard row.withdrawal, row.splits.isEmpty else { return [] }
		return data.toWithdraw.sorted { ($0.cents == -row.amountCents ? 0 : 1) < ($1.cents == -row.amountCents ? 0 : 1) }
	}

	private var remaining: Int {
		row.amountCents - parts.reduce(0) { $0 + (Format.parse($1.amount) ?? 0) * (row.amountCents < 0 ? -1 : 1) }
	}

	private var account: String { data.accounts.first { $0.id == row.accountId }?.name ?? "" }

	var body: some View {
		inhoud
			.interactiveDismissDisabled(busy)
	}

	private var inhoud: some View {
		VertexScherm(
			midden: row.title, gloed: false, onderruimte: 40,
			leiding: AnyView(VertexIcoonknop(systeemIcoon: "xmark", label: "Sluit", maat: 44) { finish() }),
			acties: row.status == "overboeking" ? nil : AnyView(
				HStack(spacing: 8) {
					VertexIcoonknop(systeemIcoon: "arrow.triangle.branch", label: splitting ? "Niet splitsen" : "Splitsen", maat: 44) { toggleSplit() }
					VertexMenu {
						Button { toggleSplit() } label: { Label(splitting ? "Niet splitsen" : "Splitsen", vSym: "arrow.triangle.branch") }
						if let next = next() {
							Button { show(next) } label: { Label("Volgende overslaan", vSym: "forward") }
						}
					} label: {
						VertexIcoonLabel(systeemIcoon: "ellipsis", maat: 44)
					}
				}
			)
		) {
			Text("\(Format.date(row.bookingDate)) · \(account) · \(Format.money(row.amountCents))")
				.vertexTekst(Vertex.Tekst.body).foregroundStyle(row.amountCents > 0 ? Vertex.Kleur.statusPositief : Vertex.Kleur.tekstGedempt)
			if !row.rawInfo.isEmpty {
				Text(row.rawInfo).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).lineLimit(4)
			}
			if let message { VertexMelding(tekst: message, toon: .positief) }
			if let error { VertexMelding(tekst: error, toon: .negatief) }

			if row.status == "overboeking" {
				VertexMelding(tekst: "Dit is een overboeking tussen jullie eigen rekeningen. Die hoeft niet ingedeeld te worden: de kant van de spaarrekening hoort bij een budget dat spaart.", toon: .waarschuwing, icoon: "arrow.left.arrow.right")
			} else {
				hints
				if splitting { splitSection } else { CategoryList(options: data.options, allowed: allowed, incomeFirst: incomeFirst, selected: row.splits.count == 1 ? row.splits[0].categoryId : nil) { id in
					Task { await save([(id, row.amountCents)]) }
				} }
				optionsSection
			}
		}
		.disabled(busy)
		.onAppear { reset() }
	}

	// MARK: - Onderdelen

	@ViewBuilder private var hints: some View {
		if let source = row.refundSource {
			VSection {
				VStack(alignment: .leading, spacing: 2) {
					Text("Teruggave van \(source.name)").vertexTekst(Vertex.Tekst.bodyVet)
					Text("\(Format.date(source.date)) · \(Format.money(source.amount))").vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
				}
				VKnopRij(actie: { Task { await link(nil) } }) { Text("Ontkoppelen").foregroundStyle(Vertex.Kleur.statusNegatief) }
			}
		} else if !candidates.isEmpty {
			VSection("Is dit geld terug voor een uitgave?") {
				ForEach(candidates) { e in
					VKnopRij(actie: { Task { await link(e.id) } }) {
						HStack {
							VStack(alignment: .leading, spacing: 1) {
								Text(e.name).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
								Text(Format.date(e.bookingDate) + (e.note.map { " · \($0)" } ?? "")).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
							}
							Spacer()
							Text("nog \(Format.money(e.expected - e.received))").vertexTekst(Vertex.Tekst.klein).monospacedDigit()
								.foregroundStyle(e.expected - e.received == row.amountCents ? Vertex.Kleur.accentStandaard : Vertex.Kleur.tekstGedempt)
						}
					}
				}
			}
		}

		if row.withdrawal {
			VSection {
				Text("Geld van de spaarrekening naar de betaalrekening. Van welk budget komt het? Het saldo daarvan gaat met dit bedrag omlaag.")
					.foregroundStyle(Vertex.Kleur.tekstGedempt)
				ForEach(withdrawals) { w in
					VKnopRij(actie: { Task { await save([(w.id, row.amountCents)]) } }) {
						HStack {
							Text(w.name).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
							Spacer()
							Text("nog \(Format.money(w.cents))").vertexTekst(Vertex.Tekst.klein).monospacedDigit()
								.foregroundStyle(w.cents == -row.amountCents ? Vertex.Kleur.accentStandaard : Vertex.Kleur.tekstGedempt)
						}
					}
				}
			} header: {
				if !withdrawals.isEmpty { Text("HIER MOET NOG GELD VOOR KOMEN") }
			}
		} else if row.needsPot {
			Text(
				row.isTransfer
					? "Geld naar de spaarrekening. Bij welk budget hoort het?"
					: data.incomePot != nil && row.amountCents > 0
						? "Geld dat direct op de spaarrekening binnenkomt, zoals rente. Zet je het bij inkomsten, dan komt het in \(data.incomePot!)."
						: "Een boeking op de spaarrekening. Bij welk budget hoort het?"
			)
			.vertexTekst(Vertex.Tekst.body).foregroundStyle(Vertex.Kleur.tekstGedempt)
		}
	}

	@ViewBuilder private var splitSection: some View {
		Text("Splitsen").vertexTekst(Vertex.Tekst.kop).foregroundStyle(Vertex.Kleur.tekstHoofd)
		VSection {
			ForEach($parts) { $part in
				HStack(spacing: 12) {
					NavigationLink {
						VertexScherm(titel: "Kies een budget", terug: "Splitsen", gloed: false, onderruimte: 40) {
							CategoryList(options: data.options, allowed: allowed, incomeFirst: incomeFirst, selected: part.category, closeOnPick: true) { id in
								part.category = id
							}
						}
					} label: {
						let option = part.category.flatMap { id in data.options.first { $0.id == id } }
						HStack(spacing: 12) {
							VertexTegel(image: iconImage(option?.icon), hue: VertexHue(option?.hue), maat: 36)
							Text(option?.name ?? "Kies een budget").vertexTekst(Vertex.Tekst.bodyVet)
								.foregroundStyle(option == nil ? Vertex.Kleur.tekstVaag : Vertex.Kleur.tekstHoofd)
						}
					}
					.buttonStyle(.plain)
					TextField("0,00", text: $part.amount)
						.keyboardType(.decimalPad)
						.multilineTextAlignment(.trailing)
						.vertexTekst(Vertex.Tekst.bodyVet)
						.monospacedDigit()
						.padding(.horizontal, 10).frame(width: 96, height: 38)
						.background(Vertex.Kleur.achtergrondKaart2, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
					if parts.count > 2 {
						Button { parts.removeAll { $0.id == part.id } } label: { VSym("xmark.circle.fill").foregroundStyle(Vertex.Kleur.tekstVaag) }
							.buttonStyle(.plain)
					}
				}
			}
		}
		Button {
			parts.append(Part(category: nil, amount: remaining == 0 ? "" : Format.input(remaining)))
		} label: {
			Label("Deel toevoegen", vSym: "plus")
		}
		.buttonStyle(VertexSecundaireKnop())
		Text(remaining == 0 ? "Samen \(Format.money(abs(row.amountCents))) · alles verdeeld" : "Nog \(Format.money(remaining)) te verdelen.")
			.vertexTekst(Vertex.Tekst.klein).foregroundStyle(remaining == 0 ? Vertex.Kleur.statusPositief : Vertex.Kleur.statusWaarschuwing)
		Button("Opslaan") {
			let splits = parts.compactMap { p -> (Int, Int)? in
				guard let c = p.category, let a = Format.parse(p.amount), a != 0 else { return nil }
				return (c, row.amountCents < 0 ? -abs(a) : abs(a))
			}
			Task { await save(splits) }
		}
		.buttonStyle(VertexPrimaireKnop())
		.disabled(remaining != 0)
		.opacity(remaining != 0 ? 0.5 : 1)
	}

	@ViewBuilder private var optionsSection: some View {
		VSection {
			if !splitting && !row.withdrawal {
				Toggle(isOn: $remember) {
					Text(row.needsPot || row.counterparty == nil ? "“\(row.description.isEmpty ? "—" : row.description)” voortaan zo indelen" : "\(row.counterparty!) voortaan zo indelen")
				}
			}
			if onPot {
				Toggle(isOn: $fromPot) {
					VStack(alignment: .leading, spacing: 2) {
						Text("Van het saldo afhalen")
						Text(fromPot ? "Dit geld moet nog van de spaarrekening komen." : "Telt mee als uitgegeven; de lopende rekening betaalt het.")
							.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
					}
				}
			}
			if row.amountCents < 0 && !row.isTransfer {
				Toggle("Ik krijg hier geld voor terug", isOn: $refundOn)
				if refundOn {
					VVeld("Hoeveel", tekst: $refundAmount, prompt: "0,00").keyboardType(.decimalPad).monospacedDigit()
					if row.refundReceived > 0 {
						Text("Al \(Format.money(row.refundReceived)) terug").vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
					}
					if row.refundExpected != nil {
						VKnopRij(actie: { Task { await closeRefund() } }) { Text("Klaar, niet meer verwachten").foregroundStyle(Vertex.Kleur.accentStandaard) }
					}
				}
			}
			Toggle("Niet meetellen", isOn: $excluded)
			TextField("Notitie", text: $note, axis: .vertical)
		}
		if !row.splits.isEmpty && !splitting {
			Button("Wijzigingen opslaan") {
				Task { await save(row.splits.map { ($0.categoryId, $0.amountCents) }) }
			}
			.buttonStyle(VertexPrimaireKnop())
		}
	}

	// MARK: - Acties

	private func reset() {
		splitting = row.splits.count > 1
		parts = row.splits.count > 1
			? row.splits.map { Part(category: $0.categoryId, amount: Format.input($0.amountCents)) }
			: [Part(category: row.splits.first?.categoryId, amount: Format.input(row.amountCents))]
		remember = row.status == "open" && !row.withdrawal
		fromPot = !row.splits.contains { $0.fromPot == 0 }
		refundOn = row.refundExpected != nil
		refundAmount = Format.input(row.refundExpected ?? row.amountCents)
		excluded = row.excluded != 0
		note = row.note ?? ""
		error = nil
	}

	private func toggleSplit() {
		if !splitting && parts.count < 2 {
			parts = [Part(category: parts.first?.category, amount: Format.input(row.amountCents)), Part(category: nil, amount: "")]
		}
		splitting.toggle()
	}

	private func next() -> Booking? {
		guard let i = queue.firstIndex(where: { $0.id == row.id }) else { return nil }
		return queue.dropFirst(i + 1).first
	}

	private func show(_ booking: Booking) {
		row = booking
		message = nil
		reset()
	}

	private func finish() {
		session.revision += 1
		close()
	}

	private func save(_ splits: [(Int, Int)]) async {
		var refund: Int?
		if refundOn && row.amountCents < 0 {
			guard let cents = Format.parse(refundAmount), cents != 0 else {
				error = "Vul in hoeveel je terugverwacht."
				return
			}
			refund = abs(cents)
		}
		busy = true
		defer { busy = false }
		do {
			let body = Classification(
				splits: splits.map { .init(category_id: $0.0, amount_cents: $0.1) },
				fromPot: fromPot,
				note: note,
				excluded: excluded,
				refund: refund,
				remember: remember && splits.count == 1 && !row.withdrawal
			)
			let saved: Saved = try await session.load { try await $0.post("boekingen/\(row.id)", body) }
			let applied = saved.applied ?? 0
			// Door naar de volgende boeking in de rij, of klaar.
			if let next = next() {
				show(next)
				message = applied > 0 ? "Opgeslagen. \(applied) vergelijkbare boekingen ook ingedeeld." : "Opgeslagen."
			} else {
				finish()
			}
		} catch {
			self.error = error.localizedDescription
		}
	}

	private struct LinkBody: Encodable { let of: Int? }

	private func link(_ expense: Int?) async {
		busy = true
		defer { busy = false }
		do {
			let saved: Saved = try await session.load { try await $0.post("boekingen/\(row.id)/koppel", LinkBody(of: expense)) }
			if let fresh = saved.row { row = fresh; reset() }
			message = expense == nil ? "Ontkoppeld." : "Gekoppeld als teruggave. Hij staat nu in hetzelfde budget als de uitgave."
		} catch {
			self.error = error.localizedDescription
		}
	}

	private func closeRefund() async {
		busy = true
		defer { busy = false }
		do {
			let saved: Saved = try await session.load { try await $0.post("boekingen/\(row.id)/afsluiten", Empty()) }
			if let fresh = saved.row { row = fresh; reset() }
		} catch {
			self.error = error.localizedDescription
		}
	}
}

/// Budgetten om uit te kiezen, met de groepen als kopje erboven. Zoeken toont alleen de budgetten.
struct CategoryList: View {
	let options: [CategoryOption]
	let allowed: (CategoryOption) -> Bool
	let incomeFirst: Bool
	let selected: Int?
	/// In een apart scherm (bij splitsen) gaat het scherm na het kiezen dicht.
	var closeOnPick = false
	let pick: (Int) -> Void
	@Environment(\.dismiss) private var dismiss
	@State private var query = ""

	private var visible: [CategoryOption] {
		let ordered = incomeFirst ? options.filter { $0.tree == "inkomsten" } + options.filter { $0.tree != "inkomsten" } : options
		let leaves = ordered.filter { !$0.group && allowed($0) }
		let q = query.trimmingCharacters(in: .whitespaces).lowercased()
		if !q.isEmpty { return leaves.filter { $0.label.lowercased().contains(q) } }
		// Groepen tonen boven de budgetten die je kunt kiezen.
		let byId = Dictionary(uniqueKeysWithValues: options.map { ($0.id, $0) })
		var keep = Set(leaves.map(\.id))
		for leaf in leaves {
			var parent = leaf.parent.flatMap { byId[$0] }
			while let p = parent, p.depth > 0 {
				keep.insert(p.id)
				parent = p.parent.flatMap { byId[$0] }
			}
		}
		return ordered.filter { keep.contains($0.id) }
	}

	var body: some View {
		let list = visible.filter { !$0.group }
		VertexZoekveld(prompt: "Zoek een budget", tekst: $query)
		VSection {
			ForEach(list) { o in
				VKnopRij(actie: {
					pick(o.id)
					if closeOnPick { dismiss() }
				}) {
					HStack(spacing: 12) {
						VertexTegel(image: iconImage(o.icon), hue: VertexHue(o.hue), maat: 38)
						VStack(alignment: .leading, spacing: 1) {
							Text(o.name).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
							Text(o.tree == "inkomsten" ? "Inkomsten" : (o.label.components(separatedBy: " › ").dropLast().last ?? ""))
								.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
						}
						Spacer()
						if o.tree == "uitgaven" && o.kind != "budget" {
							Text(o.kind == "doelpot" ? "Spaart · doel" : "Spaart").vertexTekst(Vertex.Tekst.label).foregroundStyle(Vertex.Kleur.accentStandaard)
						}
						if selected == o.id {
							VSym("checkmark", 11).foregroundStyle(Vertex.Kleur.tekstOpAccent)
								.frame(width: 22, height: 22).background(Vertex.Kleur.accentVlak, in: Circle())
						}
					}
					.padding(.vertical, -3)
				}
			}
		}
	}
}
