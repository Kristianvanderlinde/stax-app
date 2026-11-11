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
		NavigationStack {
			Form {
				Section {
					VStack(alignment: .leading, spacing: 6) {
						Text("\(Format.date(row.bookingDate)) · \(account)").font(.subheadline).foregroundStyle(.secondary)
						Text(Format.money(row.amountCents))
							.font(.system(size: 34, weight: .bold).monospacedDigit())
							.foregroundStyle(row.amountCents > 0 ? .green : .primary)
						if !row.rawInfo.isEmpty {
							Text(row.rawInfo).font(.caption).foregroundStyle(.secondary).lineLimit(4)
						}
					}
					.listRowBackground(Color.clear)
				}

				if let message {
					Section { Label(message, systemImage: "checkmark.circle.fill").foregroundStyle(.green) }
				}
				if let error {
					Section { Label(error, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.red) }
				}

				if row.status == "overboeking" {
					Section {
						Text("Dit is een overboeking tussen jullie eigen rekeningen. Die hoeft niet ingedeeld te worden: de kant van de spaarrekening hoort bij een budget dat spaart.")
							.foregroundStyle(.secondary)
					}
				} else {
					hints
					if splitting { splitSection } else { CategoryList(options: data.options, allowed: allowed, incomeFirst: incomeFirst, selected: row.splits.count == 1 ? row.splits[0].categoryId : nil) { id in
						Task { await save([(id, row.amountCents)]) }
					} }
					optionsSection
				}
			}
			.navigationTitle(row.title)
			.navigationBarTitleDisplayMode(.inline)
			.toolbar {
				ToolbarItem(placement: .cancellationAction) { Button("Sluit") { finish() } }
				if row.status != "overboeking" {
					ToolbarItem(placement: .primaryAction) {
						Menu {
							Button(splitting ? "Niet splitsen" : "Splitsen", systemImage: "arrow.triangle.branch") { toggleSplit() }
							if let next = next() {
								Button("Volgende overslaan", systemImage: "forward") { show(next) }
							}
						} label: {
							Image(systemName: "ellipsis.circle")
						}
					}
				}
			}
			.disabled(busy)
			.onAppear { reset() }
		}
		.interactiveDismissDisabled(busy)
	}

	// MARK: - Onderdelen

	@ViewBuilder private var hints: some View {
		if let source = row.refundSource {
			Section {
				VStack(alignment: .leading, spacing: 2) {
					Text("Teruggave van \(source.name)")
					Text("\(Format.date(source.date)) · \(Format.money(source.amount))").font(.caption).foregroundStyle(.secondary)
				}
				Button("Ontkoppelen", role: .destructive) { Task { await link(nil) } }
			}
		} else if !candidates.isEmpty {
			Section("Is dit geld terug voor een uitgave?") {
				ForEach(candidates) { e in
					Button { Task { await link(e.id) } } label: {
						HStack {
							VStack(alignment: .leading) {
								Text(e.name).foregroundStyle(.primary)
								Text(Format.date(e.bookingDate) + (e.note.map { " · \($0)" } ?? "")).font(.caption).foregroundStyle(.secondary)
							}
							Spacer()
							Text("nog \(Format.money(e.expected - e.received))")
								.font(.caption.monospacedDigit())
								.foregroundStyle(e.expected - e.received == row.amountCents ? Color.stax : .secondary)
						}
					}
				}
			}
		}

		if row.withdrawal {
			Section {
				Text("Geld van de spaarrekening naar de betaalrekening. Van welk budget komt het? Het saldo daarvan gaat met dit bedrag omlaag.")
					.font(.subheadline)
					.foregroundStyle(.secondary)
				ForEach(withdrawals) { w in
					Button { Task { await save([(w.id, row.amountCents)]) } } label: {
						HStack {
							Text(w.name).foregroundStyle(.primary)
							Spacer()
							Text("nog \(Format.money(w.cents))")
								.font(.caption.monospacedDigit())
								.foregroundStyle(w.cents == -row.amountCents ? Color.stax : .secondary)
						}
					}
				}
			} header: {
				if !withdrawals.isEmpty { Text("Hier moet nog geld voor komen") }
			}
		} else if row.needsPot {
			Section {
				Text(
					row.isTransfer
						? "Geld naar de spaarrekening. Bij welk budget hoort het?"
						: data.incomePot != nil && row.amountCents > 0
							? "Geld dat direct op de spaarrekening binnenkomt, zoals rente. Zet je het bij inkomsten, dan komt het in \(data.incomePot!)."
							: "Een boeking op de spaarrekening. Bij welk budget hoort het?"
				)
				.font(.subheadline)
				.foregroundStyle(.secondary)
			}
		}
	}

	@ViewBuilder private var splitSection: some View {
		Section {
			ForEach($parts) { $part in
				HStack {
					NavigationLink {
						Form {
							CategoryList(options: data.options, allowed: allowed, incomeFirst: incomeFirst, selected: part.category, closeOnPick: true) { id in
								part.category = id
							}
						}
						.navigationTitle("Kies een budget")
					} label: {
						Text(part.category.flatMap { id in data.options.first { $0.id == id }?.name } ?? "Kies een budget")
							.foregroundStyle(part.category == nil ? .secondary : .primary)
					}
					TextField("0,00", text: $part.amount)
						.keyboardType(.decimalPad)
						.multilineTextAlignment(.trailing)
						.frame(width: 96)
						.monospacedDigit()
				}
			}
			.onDelete { parts.remove(atOffsets: $0) }
			Button("Deel toevoegen", systemImage: "plus") {
				parts.append(Part(category: nil, amount: remaining == 0 ? "" : Format.input(remaining)))
			}
		} header: {
			Text("Splitsen")
		} footer: {
			Text(remaining == 0 ? "Klopt precies." : "Nog \(Format.money(remaining)) te verdelen.")
				.foregroundStyle(remaining == 0 ? Color.secondary : Color.orange)
		}
		Section {
			Button("Opslaan") {
				let splits = parts.compactMap { p -> (Int, Int)? in
					guard let c = p.category, let a = Format.parse(p.amount), a != 0 else { return nil }
					return (c, row.amountCents < 0 ? -abs(a) : abs(a))
				}
				Task { await save(splits) }
			}
			.disabled(remaining != 0)
		}
	}

	@ViewBuilder private var optionsSection: some View {
		Section {
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
							.font(.caption)
							.foregroundStyle(.secondary)
					}
				}
			}
			if row.amountCents < 0 && !row.isTransfer {
				Toggle("Ik krijg hier geld voor terug", isOn: $refundOn)
				if refundOn {
					HStack {
						Text("Hoeveel")
						TextField("0,00", text: $refundAmount).keyboardType(.decimalPad).multilineTextAlignment(.trailing).monospacedDigit()
					}
					if row.refundReceived > 0 {
						Text("Al \(Format.money(row.refundReceived)) terug").font(.caption).foregroundStyle(.secondary)
					}
					if row.refundExpected != nil {
						Button("Klaar, niet meer verwachten") { Task { await closeRefund() } }
					}
				}
			}
			Toggle("Niet meetellen", isOn: $excluded)
			TextField("Notitie", text: $note, axis: .vertical)
		} footer: {
			if !row.splits.isEmpty && !splitting {
				Button("Wijzigingen opslaan") {
					Task { await save(row.splits.map { ($0.categoryId, $0.amountCents) }) }
				}
				.font(.body.weight(.semibold))
				.frame(maxWidth: .infinity)
				.padding(.top, 8)
			}
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
		let list = visible
		Section {
			TextField("Zoek een budget", text: $query)
				.textInputAutocapitalization(.never)
				.autocorrectionDisabled()
			ForEach(Array(list.enumerated()), id: \.element.id) { i, o in
				if i == 0 || list[i - 1].tree != o.tree, query.isEmpty {
					Text(o.tree == "uitgaven" ? "UITGAVEN" : "INKOMSTEN")
						.font(.caption.weight(.semibold))
						.foregroundStyle(.secondary)
				}
				if o.group {
					HStack(spacing: 10) {
						CategoryIcon(name: o.icon, size: 24, solid: o.depth == 1)
						Text(o.name).font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
					}
					.padding(.leading, CGFloat(max(0, o.depth - 1)) * 16)
				} else {
					Button {
						pick(o.id)
						if closeOnPick { dismiss() }
					} label: {
						HStack(spacing: 10) {
							CategoryIcon(name: o.icon, size: 26)
							VStack(alignment: .leading, spacing: 1) {
								Text(o.name).foregroundStyle(.primary)
								if !query.isEmpty && o.depth > 1 {
									Text(o.label).font(.caption).foregroundStyle(.secondary)
								}
							}
							Spacer()
							if o.tree == "uitgaven" && o.kind != "budget" {
								Text(o.kind == "doelpot" ? "Spaart · doel" : "Spaart").font(.caption).foregroundStyle(Color.stax)
							}
							if selected == o.id { Image(systemName: "checkmark").foregroundStyle(Color.stax) }
						}
					}
					.tint(.primary)
					.padding(.leading, query.isEmpty ? CGFloat(max(0, o.depth - 1)) * 16 : 0)
				}
			}
		} header: {
			Text("Budget")
		}
	}
}
