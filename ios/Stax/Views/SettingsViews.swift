import SwiftUI
import UniformTypeIdentifiers

// De schermen onder Instellingen: bankexport, rekeningen, regels, startsaldo en account. Zelfde keuzes als op de website.

/// Een regel in de instellingenlijst, met hetzelfde icoon als op de website.
struct SettingsRow: View {
	let icon: String
	let title: String
	let subtitle: String?

	var body: some View {
		HStack(spacing: 14) {
			Image(icon).renderingMode(.template).resizable().scaledToFit().frame(width: 18, height: 18)
				.foregroundStyle(.white).frame(width: 34, height: 34)
				.background(.staxGradient, in: Circle())
			VStack(alignment: .leading, spacing: 1) {
				Text(title).foregroundStyle(.primary)
				if let subtitle { Text(subtitle).font(.footnote).foregroundStyle(.secondary) }
			}
		}
	}
}

private func requestError(_ error: Error) -> String { error.localizedDescription }

// MARK: - Bankexport

/// Bankexport (camt.053-XML of CSV) kiezen en inlezen. Boekingen die er al zijn, worden overgeslagen.
struct ImportView: View {
	@Environment(Session.self) private var session
	@State private var picking = false
	@State private var busy = false
	@State private var outcome: ImportOutcome?
	@State private var error: String?
	/// Inhoud van de zojuist gekozen bestanden, voor als een CSV nog om kolommen vraagt.
	@State private var contents: [String: String] = [:]
	@State private var mapping: MappingRequest?

	var body: some View {
		Loader(key: "importeren", fetch: { try await $0.get("importeren") as Imports }) { (data: Imports) in
			List {
				Section {
					Button {
						picking = true
					} label: {
						HStack {
							Label(busy ? "Bezig met inlezen…" : "Bestanden kiezen", systemImage: "square.and.arrow.down")
							if busy { Spacer(); ProgressView() }
						}
					}
					.disabled(busy)
				} footer: {
					Text("Exporteer in de app of op de website van je bank de transacties als XML (camt.053) of CSV en kies de bestanden hier. Meerdere rekeningen tegelijk mag. Boekingen die er al zijn, worden overgeslagen.")
				}
				if let error {
					Section { Label(error, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.red) }
				}
				if let outcome {
					Section("Zojuist ingelezen") {
						ForEach(outcome.results) { r in
							VStack(alignment: .leading, spacing: 2) {
								Text(r.filename).lineLimit(1)
								if let needs = r.needs {
									Button("Kolommen kiezen") { mapping = MappingRequest(filename: r.filename, needs: needs, content: contents[r.filename] ?? "") }
								} else if let e = r.error {
									Text(e).font(.footnote).foregroundStyle(.red)
								} else {
									Text("\(r.account) · \(r.added) nieuw van \(r.total)").font(.footnote).foregroundStyle(.secondary)
								}
							}
						}
						if outcome.categorized > 0 {
							Label("\(outcome.categorized) boekingen automatisch ingedeeld", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
						}
					}
				}
				Section("Eerdere uploads") {
					ForEach(data.imports) { i in
						VStack(alignment: .leading, spacing: 2) {
							Text(i.filename).lineLimit(1)
							Text("\(i.account) · \(i.nNew) nieuw van \(i.nTotal) · \(Format.date(i.importedAt))")
								.font(.footnote).foregroundStyle(.secondary)
						}
					}
					if data.imports.isEmpty { Text("Nog niets geüpload").foregroundStyle(.secondary) }
				}
			}
		}
		.navigationTitle("Bankexport")
		.navigationBarTitleDisplayMode(.inline)
		.sheet(item: $mapping) { request in
			CsvMappingSheet(request: request) { choice, iban in
				await send([UploadFile(name: request.filename, content: contents[request.filename] ?? "", mapping: choice, iban: iban)])
			}
		}
		.fileImporter(isPresented: $picking, allowedContentTypes: [.xml, .commaSeparatedText, .plainText, .data], allowsMultipleSelection: true) { result in
			switch result {
			case .success(let urls): Task { await upload(urls) }
			case .failure(let e): error = requestError(e)
			}
		}
		#if DEBUG
		.task {
			if let path = UserDefaults.standard.string(forKey: "debugImportFile") { await upload([URL(fileURLWithPath: path)]) }
		}
		#endif
	}

	private func upload(_ urls: [URL]) async {
		error = nil
		var files: [UploadFile] = []
		for url in urls {
			let scoped = url.startAccessingSecurityScopedResource()
			defer { if scoped { url.stopAccessingSecurityScopedResource() } }
			guard let data = try? Data(contentsOf: url) else { error = "Kon \(url.lastPathComponent) niet lezen."; return }
			let text = String(data: data, encoding: .utf8) ?? String(data: data, encoding: .isoLatin1) ?? ""
			contents[url.lastPathComponent] = text
			files.append(UploadFile(name: url.lastPathComponent, content: text))
		}
		await send(files)
	}

	private func send(_ files: [UploadFile]) async {
		busy = true
		error = nil
		defer { busy = false }
		struct Body: Encodable { let files: [UploadFile] }
		do {
			let result = try await session.load { try await $0.post("importeren", Body(files: files)) as ImportOutcome }
			outcome = result
			session.revision += 1
			// Een CSV zonder herkende kolommen: meteen om een keuze vragen.
			if let r = result.results.first(where: { $0.needs != nil }), let needs = r.needs { mapping = MappingRequest(filename: r.filename, needs: needs, content: contents[r.filename] ?? "") }
		} catch { self.error = requestError(error) }
	}
}

struct UploadFile: Encodable {
	let name: String
	let content: String
	var mapping: CsvChoice? = nil
	var iban: String? = nil
}

/// Rol → kolomnummer, met het scheidingsteken ernaast, zoals de server het verwacht.
struct CsvChoice: Encodable {
	var roles: [String: Int]
	var delimiter: String
	private struct Key: CodingKey {
		var stringValue: String
		var intValue: Int? { nil }
		init(_ s: String) { stringValue = s }
		init?(stringValue: String) { self.stringValue = stringValue }
		init?(intValue: Int) { nil }
	}
	func encode(to encoder: Encoder) throws {
		var c = encoder.container(keyedBy: Key.self)
		for (role, column) in roles { try c.encode(column, forKey: Key(role)) }
		try c.encode(delimiter, forKey: Key("delimiter"))
	}
}

struct MappingRequest: Identifiable {
	var id: String { filename }
	let filename: String
	let needs: CsvNeeds
	let content: String
}

/// Controleer hoe een CSV wordt gelezen: eerst een voorbeeld van het resultaat, pas daaronder de kolommen.
struct CsvMappingSheet: View {
	@Environment(Session.self) private var session
	@Environment(\.dismiss) private var dismiss
	let request: MappingRequest
	let onSend: (CsvChoice, String?) async -> Void
	/// Per betekenis het gekozen kolomnummer.
	@State private var roles: [String: Int] = [:]
	@State private var iban = ""
	@State private var busy = false
	@State private var example: ExampleOutcome?
	@State private var loading = false

	private static let main: [(String, String)] = [("date", "Datum"), ("amount", "Bedrag"), ("counterparty", "Naam tegenpartij"), ("description", "Omschrijving")]
	private static let more: [(String, String)] = [
		("direction", "Af of bij (bedrag zonder min)"), ("debit", "Bedrag af"), ("credit", "Bedrag bij"),
		("counterpartyIban", "IBAN tegenpartij"), ("iban", "Eigen rekening (IBAN)"), ("balance", "Saldo na boeking"), ("ref", "Volgnummer of referentie")
	]

	private var hasIban: Bool { roles["iban"] != nil }
	private var ibanOK: Bool { hasIban || iban.filter { !$0.isWhitespace }.count >= 12 }
	private var ready: Bool { (example?.total ?? 0) > 0 && example?.error == nil && ibanOK }
	private var choice: CsvChoice { CsvChoice(roles: roles, delimiter: request.needs.delimiter) }

	private func columnLabel(_ i: Int) -> String {
		let head = request.needs.headers[i].isEmpty ? "Kolom \(i + 1)" : request.needs.headers[i]
		if let value = request.needs.sample.compactMap({ i < $0.count && !$0[i].isEmpty ? $0[i] : nil }).first { return "\(head) · \(value)" }
		return head
	}

	private func binding(_ role: String) -> Binding<Int> {
		Binding(
			get: { roles[role] ?? -1 },
			set: { column in
				// Eén kolom heeft één betekenis.
				if column >= 0 { roles = roles.filter { $0.value != column } }
				roles[role] = column < 0 ? nil : column
			}
		)
	}

	private func sample(_ column: Int) -> String? {
		request.needs.sample.compactMap { column < $0.count && !$0[column].isEmpty ? $0[column] : nil }.first
	}

	private func picker(_ role: String, _ label: String) -> some View {
		let column = roles[role]
		return HStack(alignment: .firstTextBaseline, spacing: 12) {
			VStack(alignment: .leading, spacing: 2) {
				Text(label)
				Text(column.flatMap(sample) ?? "Geen kolom gekozen")
					.font(.footnote).foregroundStyle(.secondary).lineLimit(1)
			}
			Spacer(minLength: 8)
			Picker(label, selection: binding(role)) {
				Text("Geen").tag(-1)
				ForEach(Array(request.needs.headers.indices), id: \.self) { i in
					Text(request.needs.headers[i].isEmpty ? "Kolom \(i + 1)" : request.needs.headers[i]).tag(i)
				}
			}
			.labelsHidden()
			.fixedSize()
		}
	}

	private struct ExampleBody: Encodable {
		let content: String
		let mapping: CsvChoice
		let iban: String?
	}

	/// Wat er bij de huidige keuzes ingelezen zou worden.
	private func refresh() async {
		try? await Task.sleep(for: .milliseconds(200))
		guard !Task.isCancelled else { return }
		loading = true
		defer { loading = false }
		let payload = ExampleBody(content: request.content, mapping: choice, iban: hasIban ? nil : iban)
		if let r = try? await session.load({ try await $0.post("importeren/voorbeeld", payload) as ExampleOutcome }) { example = r }
	}

	var body: some View {
		NavigationStack {
			Form {
				Section {
					if let example, !example.examples.isEmpty {
						ForEach(example.examples) { e in
							HStack(alignment: .firstTextBaseline, spacing: 10) {
								VStack(alignment: .leading, spacing: 2) {
									Text(e.counterparty ?? (e.description.isEmpty ? "—" : e.description)).lineLimit(1)
									HStack(spacing: 6) {
										Text(Format.date(e.date))
										if e.counterparty != nil, !e.description.isEmpty { Text("· \(e.description)").lineLimit(1) }
									}
									.font(.footnote).foregroundStyle(.secondary)
								}
								Spacer(minLength: 8)
								Text(Format.amount(e.amountCents, signed: true)).monospacedDigit().foregroundStyle(e.amountCents < 0 ? Color.primary : Color.green)
							}
						}
					} else if let message = example?.error {
						Label(message, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.red).font(.footnote)
					} else {
						HStack { ProgressView(); Text("Even kijken…").foregroundStyle(.secondary) }
					}
				} header: {
					Text("Zo wordt het ingelezen")
				} footer: {
					if let n = example?.total, n > 0 { Text("Eerste \(min(n, example?.examples.count ?? n)) van \(n) boekingen uit \(request.filename). Klopt dit niet? Pas hieronder aan welke kolom wat is.") }
				}
				.opacity(loading ? 0.5 : 1)

				if !hasIban {
					Section {
						LabeledContent("IBAN") {
							TextField("Rekeningnummer", text: $iban, prompt: Text("NL00 BANK 0123 4567 89").foregroundStyle(Color(.placeholderText)))
								.multilineTextAlignment(.trailing).textInputAutocapitalization(.characters).autocorrectionDisabled()
						}
					} header: { Text("Van welke rekening?") } footer: { Text("Dit bestand bevat geen eigen rekeningnummer.") }
				}

				Section {
					ForEach(Self.main, id: \.0) { picker($0.0, $0.1) }
					DisclosureGroup("Meer opties") {
						ForEach(Self.more, id: \.0) { picker($0.0, $0.1) }
					}
				} header: { Text("Kolommen") }
			}
			.navigationTitle("Controleer")
			.navigationBarTitleDisplayMode(.inline)
			.toolbar {
				ToolbarItem(placement: .cancellationAction) { Button("Annuleer") { dismiss() } }
				ToolbarItem(placement: .confirmationAction) {
					Button("Inlezen") {
						Task {
							busy = true
							await onSend(choice, hasIban ? nil : iban)
							dismiss()
						}
					}
					.disabled(!ready || busy)
				}
			}
			.onAppear { roles = request.needs.mapping }
			.task(id: "\(roles.sorted { $0.key < $1.key })|\(iban)") { await refresh() }
		}
	}
}

/// De bankexport als losse pagina, vanuit de plus op Overzicht en Boekingen.
struct ImportSheet: View {
	@Environment(\.dismiss) private var dismiss
	var body: some View {
		NavigationStack {
			ImportView()
				.toolbar { ToolbarItem(placement: .cancellationAction) { Button("Sluit") { dismiss() } } }
		}
	}
}

// MARK: - Rekeningen

struct AccountsView: View {
	var body: some View {
		Loader(key: "rekeningen", fetch: { try await $0.get("rekeningen") as BankAccounts }) { (data: BankAccounts) in
			List {
				Section {
					ForEach(data.accounts) { a in
						NavigationLink(value: a) {
							VStack(alignment: .leading, spacing: 2) {
								Text(a.name)
								Text("\(a.kind == "spaar" ? "Spaarrekening" : "Betaalrekening") · \(Self.spaced(a.iban))")
									.font(.footnote).foregroundStyle(.secondary)
							}
						}
					}
					if data.accounts.isEmpty { Text("Rekeningen verschijnen hier na de eerste upload.").foregroundStyle(.secondary) }
				} footer: {
					Text("Rekeningen verschijnen vanzelf na een upload. Op een spaarrekening houdt Stax per budget het spaarsaldo bij.")
				}
			}
		}
		.navigationTitle("Rekeningen")
		.navigationBarTitleDisplayMode(.inline)
		.navigationDestination(for: BankAccount.self) { AccountEditor(account: $0) }
	}

	static func spaced(_ iban: String) -> String {
		stride(from: 0, to: iban.count, by: 4).map { String(iban.dropFirst($0).prefix(4)) }.joined(separator: " ")
	}
}

struct AccountEditor: View {
	@Environment(Session.self) private var session
	@Environment(\.dismiss) private var dismiss
	let account: BankAccount
	@State private var name: String
	@State private var kind: String
	@State private var error: String?
	@State private var busy = false

	init(account: BankAccount) {
		self.account = account
		_name = State(initialValue: account.name)
		_kind = State(initialValue: account.kind)
	}

	var body: some View {
		Form {
			Section("Naam") { TextField("Naam", text: $name) }
			Section {
				Picker("Soort", selection: $kind) {
					Text("Betaalrekening").tag("betaal")
					Text("Spaarrekening").tag("spaar")
				}
				.pickerStyle(.segmented)
			}
			Section { LabeledContent("Rekeningnummer", value: AccountsView.spaced(account.iban)) }
			if let error { Section { Text(error).foregroundStyle(.red) } }
		}
		.navigationTitle(account.name)
		.navigationBarTitleDisplayMode(.inline)
		.toolbar {
			ToolbarItem(placement: .confirmationAction) {
				Button("Opslaan") { Task { await save() } }.disabled(busy || name.trimmingCharacters(in: .whitespaces).isEmpty)
			}
		}
	}

	private func save() async {
		busy = true
		defer { busy = false }
		struct Body: Encodable { let name: String; let kind: String }
		do {
			let _: Empty = try await session.load { try await $0.put("rekeningen/\(account.id)", Body(name: name, kind: kind)) }
			session.revision += 1
			dismiss()
		} catch { self.error = requestError(error) }
	}
}

// MARK: - Regels

struct RulesView: View {
	@Environment(Session.self) private var session
	@State private var adding = false
	@State private var editing: RuleItem?
	@State private var showMcc = false
	@State private var message: String?

	static let fields = ["tegenpartij": "Tegenpartij", "omschrijving": "Omschrijving", "iban": "Rekeningnummer", "mcc": "Winkelsoort (MCC)"]

	var body: some View {
		Loader(key: "regels", fetch: { try await $0.get("regels") as Rules }) { (data: Rules) in
			let name = { (id: Int) in data.budgets.first { $0.id == id }?.name ?? "Onbekend budget" }
			List {
				Section {
					ForEach(data.rules.filter { showMcc || $0.field != "mcc" }) { r in
						Button { editing = r } label: {
							HStack {
								VStack(alignment: .leading, spacing: 2) {
									Text(r.pattern).foregroundStyle(.primary)
									Text("\(Self.fields[r.field] ?? r.field) \(r.op)").font(.footnote).foregroundStyle(.secondary)
								}
								Spacer()
								Text(name(r.categoryId)).foregroundStyle(.secondary)
							}
						}
						.buttonStyle(.plain)
						.swipeActions {
							Button("Verwijderen", role: .destructive) { Task { await remove(r) } }
						}
					}
					Toggle("Ook regels op winkelsoort tonen", isOn: $showMcc)
				} footer: {
					VStack(alignment: .leading, spacing: 4) {
						if let message { Text(message) }
						Text("Een regel deelt nieuwe boekingen automatisch in. Een regel op rekeningnummer of tegenpartij gaat vóór een regel op winkelsoort.")
					}
				}
			}
			.sheet(isPresented: $adding) { RuleEditor(budgets: data.budgets, rule: nil) { message = $0 } }
			.sheet(item: $editing) { r in RuleEditor(budgets: data.budgets, rule: r) { message = $0 } }
		}
		.navigationTitle("Regels")
		.navigationBarTitleDisplayMode(.inline)
		.toolbar { ToolbarItem(placement: .primaryAction) { Button { adding = true } label: { Image(systemName: "plus") } } }
	}

	private func remove(_ r: RuleItem) async {
		do {
			try await session.load { try await $0.delete("regels/\(r.id)") }
			session.revision += 1
		} catch { message = requestError(error) }
	}
}

struct RuleEditor: View {
	@Environment(Session.self) private var session
	@Environment(\.dismiss) private var dismiss
	let budgets: [RuleBudget]
	let rule: RuleItem?
	let done: (String) -> Void
	@State private var field = "tegenpartij"
	@State private var op = "bevat"
	@State private var pattern = ""
	@State private var category = 0
	@State private var error: String?
	@State private var busy = false

	var body: some View {
		NavigationStack {
			Form {
				if rule == nil {
					Section("Als de boeking…") {
						Picker("Veld", selection: $field) {
							ForEach(["tegenpartij", "omschrijving", "iban", "mcc"], id: \.self) { Text(RulesView.fields[$0] ?? $0).tag($0) }
						}
						Picker("Soort", selection: $op) {
							Text("is").tag("is")
							Text("bevat").tag("bevat")
						}
						.pickerStyle(.segmented)
						TextField("Tekst of nummer", text: $pattern).textInputAutocapitalization(.never).autocorrectionDisabled()
					}
				} else if let rule {
					Section { LabeledContent("\(RulesView.fields[rule.field] ?? rule.field) \(rule.op)", value: rule.pattern) }
				}
				Section("…dan indelen bij") {
					Picker("Budget", selection: $category) {
						Text("Kies een budget").tag(0)
						ForEach(budgets) { Text($0.path.isEmpty ? $0.name : "\($0.path) › \($0.name)").tag($0.id) }
					}
				}
				if let error { Section { Text(error).foregroundStyle(.red) } }
			}
			.navigationTitle(rule == nil ? "Nieuwe regel" : "Regel")
			.navigationBarTitleDisplayMode(.inline)
			.toolbar {
				ToolbarItem(placement: .cancellationAction) { Button("Annuleer") { dismiss() } }
				ToolbarItem(placement: .confirmationAction) {
					Button("Opslaan") { Task { await save() } }.disabled(busy || category == 0 || (rule == nil && pattern.trimmingCharacters(in: .whitespaces).isEmpty))
				}
			}
			.onAppear { if let rule { category = rule.categoryId } }
		}
	}

	private func save() async {
		busy = true
		defer { busy = false }
		struct New: Encodable { let field: String; let op: String; let pattern: String; let categoryId: Int
			enum CodingKeys: String, CodingKey { case field, op, pattern; case categoryId = "category_id" } }
		struct Change: Encodable { let categoryId: Int
			enum CodingKeys: String, CodingKey { case categoryId = "category_id" } }
		do {
			let result: Applied = try await session.load { api in
				if let rule { return try await api.put("regels/\(rule.id)", Change(categoryId: category)) }
				return try await api.post("regels", New(field: field, op: op, pattern: pattern, categoryId: category))
			}
			done("\(result.applied) boekingen ingedeeld.")
			session.revision += 1
			dismiss()
		} catch { self.error = requestError(error) }
	}
}

// MARK: - Startsaldo

struct StartView: View {
	@State private var date: Date?
	var body: some View {
		Loader(key: "startsaldo|\(date.map { Self.iso($0) } ?? "")", fetch: { api in
			try await api.get("startsaldo", ["datum": date.map { Self.iso($0) }]) as StartData
		}) { (data: StartData) in
			StartForm(data: data) { date = $0 }
				.id(data.startdatum)
		}
		.navigationTitle("Startsaldo")
		.navigationBarTitleDisplayMode(.inline)
	}

	static func iso(_ d: Date) -> String {
		let f = DateFormatter()
		f.calendar = Calendar(identifier: .gregorian)
		f.locale = Locale(identifier: "en_US_POSIX")
		f.dateFormat = "yyyy-MM-dd"
		return f.string(from: d)
	}
	static func parse(_ s: String) -> Date {
		let f = DateFormatter()
		f.calendar = Calendar(identifier: .gregorian)
		f.locale = Locale(identifier: "en_US_POSIX")
		f.dateFormat = "yyyy-MM-dd"
		return f.date(from: s) ?? .now
	}
}

struct StartForm: View {
	@Environment(Session.self) private var session
	@Environment(\.dismiss) private var dismiss
	let data: StartData
	let changeDate: (Date) -> Void
	@State private var start: Date
	@State private var values: [Int: String]
	@State private var incomePot: Int
	@State private var error: String?
	@State private var busy = false

	init(data: StartData, changeDate: @escaping (Date) -> Void) {
		self.data = data
		self.changeDate = changeDate
		_start = State(initialValue: StartView.parse(data.startdatum))
		_values = State(initialValue: Dictionary(uniqueKeysWithValues: data.pots.map { ($0.id, $0.openingCents != 0 ? Format.input($0.openingCents) : "") }))
		_incomePot = State(initialValue: data.incomePot ?? 0)
	}

	private var total: Int { values.values.reduce(0) { $0 + (Format.parse($1) ?? 0) } }
	private var rest: Int { data.balance - total }

	var body: some View {
		Form {
			Section {
				DatePicker("Startdatum", selection: $start, displayedComponents: .date)
					.onChange(of: start) { _, new in changeDate(new) }
			} footer: {
				Text("Vanaf deze dag houdt Stax de spaarsaldi bij. Alles wat daarna op de spaarrekening binnenkomt of eraf gaat, wordt per boeking aan een budget gekoppeld.")
			}
			Section {
				Picker("Inkomsten op de spaarrekening", selection: $incomePot) {
					Text("Niet bij inkomsten").tag(0)
					ForEach(data.pots) { Text("Naar \($0.name)").tag($0.id) }
				}
			} footer: {
				Text("Rente en ander geld dat direct op de spaarrekening binnenkomt, kun je bij inkomsten zetten. Het geld zelf komt dan bij dit budget, zodat de spaarsaldi blijven kloppen met de bank.")
			}
			Section {
				LabeledContent("Op de spaarrekening") { Text(Format.money(data.balance)).monospacedDigit() }
				LabeledContent("Verdeeld") { Text(Format.money(total)).monospacedDigit() }
				LabeledContent(rest == 0 ? "Alles verdeeld" : rest > 0 ? "Nog te verdelen" : "Te veel verdeeld") {
					Text(Format.money(abs(rest))).monospacedDigit().foregroundStyle(rest == 0 ? .green : .orange)
				}
			}
			Section("Startsaldo per budget") {
				ForEach(data.pots) { p in
					HStack {
						VStack(alignment: .leading, spacing: 1) {
							Text(p.name).fontWeight(p.isGroup ? .semibold : .regular)
							if !p.context.isEmpty { Text(p.context).font(.footnote).foregroundStyle(.secondary) }
						}
						Spacer()
						TextField("0,00", text: Binding(get: { values[p.id] ?? "" }, set: { values[p.id] = $0 }))
							.keyboardType(.decimalPad).multilineTextAlignment(.trailing).frame(width: 100)
						if rest > 0 {
							Button("+ rest") { values[p.id] = Format.input((Format.parse(values[p.id] ?? "") ?? 0) + rest) }
								.font(.footnote).buttonStyle(.borderless)
						}
					}
				}
				if data.pots.isEmpty { Text("Er zijn nog geen budgetten die sparen. Zet bij een budget de optie “Spaart” aan.").foregroundStyle(.secondary) }
			}
			if let error { Section { Text(error).foregroundStyle(.red) } }
		}
		.toolbar {
			ToolbarItem(placement: .confirmationAction) { Button("Opslaan") { Task { await save() } }.disabled(busy) }
		}
	}

	private func save() async {
		busy = true
		defer { busy = false }
		struct Body: Encodable {
			let startdatum: String
			let incomePot: Int?
			let openings: [String: Int]
			enum CodingKeys: String, CodingKey { case startdatum, openings; case incomePot = "income_pot" }
		}
		let openings = Dictionary(uniqueKeysWithValues: data.pots.map { (String($0.id), Format.parse(values[$0.id] ?? "") ?? 0) })
		do {
			let _: Empty = try await session.load {
				try await $0.put("startsaldo", Body(startdatum: StartView.iso(start), incomePot: incomePot == 0 ? nil : incomePot, openings: openings))
			}
			session.revision += 1
			dismiss()
		} catch { self.error = requestError(error) }
	}
}

// MARK: - Account

struct AccountView: View {
	@Environment(Session.self) private var session
	@State private var name = ""
	@State private var nameLoaded = false
	@State private var current = ""
	@State private var next = ""
	@State private var repeatNext = ""
	@State private var busy = false
	@State private var error: String?
	@State private var message: String?
	@State private var removeDevice: AccountInfo.Device?

	var body: some View {
		Loader(key: "account", fetch: { try await $0.get("account") as AccountInfo }) { (data: AccountInfo) in
			List {
				Section("Naam") {
					TextField("Naam", text: $name)
						.textContentType(.username)
						.textInputAutocapitalization(.never)
						.autocorrectionDisabled()
						.onAppear { if !nameLoaded { name = data.me?.name ?? session.user; nameLoaded = true } }
					Button("Naam bewaren") { Task { await saveName() } }
						.disabled(busy || name.trimmingCharacters(in: .whitespaces).isEmpty || name == session.user)
				}
				Section {
					SecureField("Huidig wachtwoord", text: $current).textContentType(.password)
					SecureField("Nieuw wachtwoord", text: $next).textContentType(.newPassword)
					SecureField("Nieuw wachtwoord nog een keer", text: $repeatNext).textContentType(.newPassword)
					Button("Wachtwoord wijzigen") { Task { await savePassword() } }
						.disabled(busy || current.isEmpty || next.isEmpty || repeatNext.isEmpty)
				} header: {
					Text("Wachtwoord")
				} footer: {
					Text("Minstens 12 tekens. Na een wijziging worden je andere sessies en telefoons uitgelogd.")
				}
				if let message { Section { Label(message, systemImage: "checkmark.circle.fill").foregroundStyle(.green) } }
				if let error { Section { Label(error, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.red) } }
				Section {
					ForEach(data.devices) { d in
						VStack(alignment: .leading, spacing: 2) {
							Text(d.name)
							Text("\(d.user) · \(d.lastUsedAt.map { "laatst gebruikt \(Format.date($0))" } ?? "ingelogd \(Format.date(d.createdAt))")")
								.font(.footnote).foregroundStyle(.secondary)
						}
						.swipeActions { Button("Toegang afnemen", role: .destructive) { removeDevice = d } }
					}
				} header: {
					Text("Telefoons met de app")
				} footer: {
					Text("Veeg een telefoon naar links om de toegang af te nemen; hij moet dan opnieuw inloggen.")
				}
			}
		}
		.navigationTitle("Account")
		.navigationBarTitleDisplayMode(.inline)
		.confirmationDialog("Toegang afnemen?", isPresented: .constant(removeDevice != nil), titleVisibility: .visible, presenting: removeDevice) { d in
			Button("Toegang van \(d.name) afnemen", role: .destructive) { Task { await revoke(d) } }
			Button("Annuleer", role: .cancel) { removeDevice = nil }
		}
	}

	private struct NameBody: Encodable { let name: String }
	private struct PasswordBody: Encodable { let current: String; let next: String; let repeat_: String
		enum CodingKeys: String, CodingKey { case current, next, repeat_ = "repeat" }
	}

	private func saveName() async {
		busy = true
		error = nil
		message = nil
		defer { busy = false }
		do {
			let _: Empty = try await session.load { try await $0.put("account/naam", NameBody(name: name)) }
			session.user = name.trimmingCharacters(in: .whitespaces)
			UserDefaults.standard.set(session.user, forKey: "user")
			message = "Naam bewaard."
			session.revision += 1
		} catch { self.error = requestError(error) }
	}

	private func savePassword() async {
		busy = true
		error = nil
		message = nil
		defer { busy = false }
		do {
			let _: Empty = try await session.load { try await $0.post("account/wachtwoord", PasswordBody(current: current, next: next, repeat_: repeatNext)) }
			current = ""; next = ""; repeatNext = ""
			message = "Wachtwoord gewijzigd. Andere telefoons en sessies zijn uitgelogd."
			session.revision += 1
		} catch { self.error = requestError(error) }
	}

	private func revoke(_ d: AccountInfo.Device) async {
		removeDevice = nil
		do {
			try await session.load { try await $0.delete("account/apparaten/\(d.id)") }
			session.revision += 1
		} catch { self.error = requestError(error) }
	}
}

// MARK: - Back-up

/// Het back-upbestand (JSON) voor het Bestanden-scherm.
struct BackupFile: FileDocument {
	static var readableContentTypes: [UTType] { [.json] }
	var data: Data
	init(data: Data) { self.data = data }
	init(configuration: ReadConfiguration) throws { data = configuration.file.regularFileContents ?? Data() }
	func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: data) }
}

/// Al je gegevens in één bestand bewaren of terugzetten. Hetzelfde bestand werkt op de server en in de app.
struct BackupView: View {
	@Environment(Session.self) private var session
	@State private var file: BackupFile?
	@State private var exporting = false
	@State private var picking = false
	@State private var pending: Data?
	@State private var confirm = false
	@State private var busy = false
	@State private var error: String?
	@State private var message: String?

	private struct Summary: Decodable { let accounts: Int; let transactions: Int; let budgets: Int }

	var body: some View {
		List {
			Section {
				Button { Task { await make() } } label: {
					HStack {
						Label("Back-up maken", systemImage: "square.and.arrow.up")
						if busy && pending == nil { Spacer(); ProgressView() }
					}
				}
				.disabled(busy)
			} footer: {
				Text("Eén bestand met al je gegevens: rekeningen, boekingen, budgetten, regels en startsaldo. Zonder inloggegevens. Bewaar het op een veilige plek, bijvoorbeeld in iCloud Drive.")
			}
			Section {
				Button(role: .destructive) { picking = true } label: { Label("Back-up terugzetten", systemImage: "square.and.arrow.down") }
					.disabled(busy)
					.confirmationDialog("Alles vervangen door deze back-up?", isPresented: $confirm, titleVisibility: .visible) {
						Button("Alles vervangen", role: .destructive) { if let pending { Task { await restore(pending) } } }
						Button("Annuleren", role: .cancel) { pending = nil }
					} message: {
						Text("Wat nu in Stax staat, verdwijnt. Dit kan niet ongedaan worden gemaakt.")
					}
			} footer: {
				Text("Kies een back-upbestand van Stax, van de server of van een andere telefoon.")
			}
			if let message { Section { Label(message, systemImage: "checkmark.circle.fill").foregroundStyle(.green) } }
			if let error { Section { Label(error, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.red) } }
		}
		.navigationTitle("Back-up")
		.navigationBarTitleDisplayMode(.inline)
		.fileExporter(isPresented: $exporting, document: file, contentType: .json, defaultFilename: "stax-backup-\(Self.today)") { result in
			if case .failure(let e) = result { error = requestError(e) } else { message = "Back-up bewaard." }
		}
		.fileImporter(isPresented: $picking, allowedContentTypes: [.json], allowsMultipleSelection: false) { result in
			error = nil
			message = nil
			switch result {
			case .success(let urls):
				guard let url = urls.first else { return }
				let scoped = url.startAccessingSecurityScopedResource()
				defer { if scoped { url.stopAccessingSecurityScopedResource() } }
				guard let data = try? Data(contentsOf: url) else { error = "Kon \(url.lastPathComponent) niet lezen."; return }
				pending = data
				confirm = true
			case .failure(let e): error = requestError(e)
			}
		}
	}

	private static var today: String {
		let f = DateFormatter()
		f.dateFormat = "yyyy-MM-dd"
		f.locale = Locale(identifier: "en_US_POSIX")
		return f.string(from: .now)
	}

	private func make() async {
		busy = true
		error = nil
		message = nil
		defer { busy = false }
		do {
			file = BackupFile(data: try await session.load { try await $0.raw("GET", "backup") })
			exporting = true
		} catch { self.error = requestError(error) }
	}

	private func restore(_ data: Data) async {
		busy = true
		defer { busy = false; pending = nil }
		do {
			let reply = try await session.load { try await $0.raw("POST", "backup", body: data) }
			let d = JSONDecoder()
			d.keyDecodingStrategy = .convertFromSnakeCase
			if let s = try? d.decode(Summary.self, from: reply) {
				message = "Teruggezet: \(s.accounts) \(s.accounts == 1 ? "rekening" : "rekeningen"), \(s.transactions) boekingen en \(s.budgets) budgetten."
			} else { message = "Teruggezet." }
			session.revision += 1
		} catch { self.error = requestError(error) }
	}
}
