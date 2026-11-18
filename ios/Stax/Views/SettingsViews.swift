import SwiftUI
import UniformTypeIdentifiers

// De schermen onder Instellingen: bankexport, rekeningen, regels, startsaldo en account. Zelfde keuzes als op de website.

/// Een regel in de instellingenlijst, met hetzelfde icoon als op de website.
struct SettingsRow: View {
	let icon: String
	let title: String
	let subtitle: String?

	/// Elk onderdeel heeft zijn eigen kleur, zoals op de website.
	private var hue: VertexHue {
		switch icon {
		case "nav-list": .lucht
		case "nav-card": .mint
		case "icon-shield": .zon
		case "nav-upload": .lucht
		case "nav-start": .koraal
		default: .accent
		}
	}

	var body: some View {
		HStack(spacing: 12) {
			VertexTegel(image: Image(icon), hue: hue, maat: 38)
			VStack(alignment: .leading, spacing: 1) {
				Text(title).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
				if let subtitle { Text(subtitle).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).multilineTextAlignment(.leading) }
			}
		}
		.padding(.vertical, -3)
	}
}

private func requestError(_ error: Error) -> String { error.localizedDescription }

// MARK: - Bankexport

/// Bankexport (camt.053-XML of CSV) kiezen en inlezen. Boekingen die er al zijn, worden overgeslagen.
struct ImportView: View {
	@Environment(Session.self) private var session
	@Environment(\.dismiss) private var dismiss
	@State private var picking = false
	@State private var busy = false
	@State private var outcome: ImportOutcome?
	@State private var error: String?
	/// Inhoud van de zojuist gekozen bestanden, voor als een CSV nog om kolommen vraagt.
	@State private var contents: [String: String] = [:]
	@State private var mapping: MappingRequest?

	var body: some View {
		Loader(key: "importeren", fetch: { try await $0.get("importeren") as Imports }) { (data: Imports) in
			VertexScherm(terug: "Instellingen", midden: "Bankexport", gloed: false) {
				VStack(spacing: 12) {
					Button { picking = true } label: {
						VStack(spacing: 12) {
							Image("nav-upload").renderingMode(.template).resizable().scaledToFit().padding(13)
								.frame(width: 48, height: 48).foregroundStyle(Vertex.Kleur.tekstOpAccent)
								.background(Vertex.verloopAccent, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
							if busy { ProgressView() } else { Text("Kies bestanden").vertexTekst(Vertex.Tekst.subkop).foregroundStyle(Vertex.Kleur.tekstHoofd) }
						}
						.frame(maxWidth: .infinity).padding(.vertical, 26)
						.background(Vertex.Kleur.achtergrondKaart2, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
						.overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(Vertex.Kleur.accentStandaard, style: StrokeStyle(lineWidth: 2, dash: [6, 5])))
					}
					.buttonStyle(.plain)
					.disabled(busy)
					Text("Exporteer in de app of op de website van je bank de transacties als XML (camt.053) of CSV en kies de bestanden hier. Meerdere rekeningen tegelijk mag. Boekingen die er al zijn, worden overgeslagen.")
						.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
				}
				.padding(12)
				.vertexKaart()
				if let error { VertexMelding(tekst: error, toon: .negatief) }
				if let outcome {
					VSection("Zojuist ingelezen") {
						ForEach(outcome.results) { r in
							ImportRegel(titel: r.filename) {
								if let needs = r.needs {
									Button("Kolommen kiezen") { mapping = MappingRequest(filename: r.filename, needs: needs, content: contents[r.filename] ?? "") }
										.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.accentStandaard)
								} else if let e = r.error {
									Text(e).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.statusNegatief)
								} else {
									Text("\(r.account) · \(r.added) nieuw van \(r.total)").vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
								}
							}
						}
						if outcome.categorized > 0 {
							Label("\(outcome.categorized) boekingen automatisch ingedeeld", vSym: "checkmark.circle")
								.vertexTekst(Vertex.Tekst.body).foregroundStyle(Vertex.Kleur.statusPositief)
						}
					}
				}
				VSection("Eerdere uploads") {
					ForEach(data.imports) { i in
						ImportRegel(titel: i.filename) {
							Text("\(i.account) · \(i.nNew) nieuw van \(i.nTotal) · \(Format.date(i.importedAt))")
								.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
						}
					}
					if data.imports.isEmpty { Text("Nog niets geüpload").foregroundStyle(Vertex.Kleur.tekstGedempt) }
				}
			}
		}
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

/// Een geüpload bestand als rij: documenttegel, naam en een regel erbij.
private struct ImportRegel<Detail: View>: View {
	let titel: String
	@ViewBuilder let detail: Detail

	var body: some View {
		HStack(spacing: 12) {
			VertexTegel(image: Image("ui-description"), hue: .accent, maat: 36)
			VStack(alignment: .leading, spacing: 1) {
				Text(titel).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd).lineLimit(1)
				detail
			}
		}
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
					.font(.vKlein).foregroundStyle(Vertex.Kleur.tekstGedempt).lineLimit(1)
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

	@State private var meer = false

	var body: some View {
		VertexScherm(
			midden: "Controleer", gloed: false, onderruimte: 40,
			leiding: AnyView(VertexIcoonknop(systeemIcoon: "xmark", label: "Sluit", maat: 44) { dismiss() }),
			acties: AnyView(VertexKopKnop(titel: "Inlezen", vet: true, uit: !ready || busy) {
				Task {
					busy = true
					await onSend(choice, hasIban ? nil : iban)
					dismiss()
				}
			})
		) {
				VSection {
					if let example, !example.examples.isEmpty {
						ForEach(example.examples) { e in
							HStack(alignment: .firstTextBaseline, spacing: 10) {
								VStack(alignment: .leading, spacing: 2) {
									Text(e.counterparty ?? (e.description.isEmpty ? "—" : e.description)).vertexTekst(Vertex.Tekst.bodyVet).lineLimit(1)
									HStack(spacing: 6) {
										Text(Format.date(e.date))
										if e.counterparty != nil, !e.description.isEmpty { Text("· \(e.description)").lineLimit(1) }
									}
									.font(.vKlein).foregroundStyle(Vertex.Kleur.tekstGedempt)
								}
								Spacer(minLength: 8)
								Text(Format.amount(e.amountCents, signed: true)).vertexTekst(Vertex.Tekst.bodyVet).monospacedDigit().foregroundStyle(e.amountCents < 0 ? Vertex.Kleur.tekstHoofd : Vertex.Kleur.statusPositief)
							}
						}
					} else if let message = example?.error {
						Label(message, vSym: "exclamationmark.triangle.fill").foregroundStyle(Vertex.Kleur.statusNegatief).font(.vKlein)
					} else {
						HStack { ProgressView(); Text("Even kijken…").foregroundStyle(Vertex.Kleur.tekstGedempt) }
					}
				} header: {
					Text("ZO WORDT HET INGELEZEN")
				} footer: {
					if let n = example?.total, n > 0 { Text("Eerste \(min(n, example?.examples.count ?? n)) van \(n) boekingen uit \(request.filename). Klopt dit niet? Pas hieronder aan welke kolom wat is.") }
				}
				.opacity(loading ? 0.5 : 1)

				if !hasIban {
					VSection {
						VWaarde("IBAN") {
							TextField("Rekeningnummer", text: $iban, prompt: Text("NL00 BANK 0123 4567 89"))
								.multilineTextAlignment(.trailing).textInputAutocapitalization(.characters).autocorrectionDisabled()
						}
					} header: { Text("VAN WELKE REKENING?") } footer: { Text("Dit bestand bevat geen eigen rekeningnummer.") }
				}

				VSection {
					ForEach(Self.main, id: \.0) { picker($0.0, $0.1) }
					VKnopRij(actie: { withAnimation { meer.toggle() } }) {
						HStack {
							Text("Meer opties").foregroundStyle(Vertex.Kleur.accentStandaard)
							Spacer()
							VSym(meer ? "chevron.up" : "chevron.down", 13).foregroundStyle(Vertex.Kleur.tekstVaag)
						}
					}
					if meer { ForEach(Self.more, id: \.0) { picker($0.0, $0.1) } }
				} header: { Text("KOLOMMEN") }
		}
		.onAppear { roles = request.needs.mapping }
		.task(id: "\(roles.sorted { $0.key < $1.key })|\(iban)") { await refresh() }
	}
}

/// De bankexport als losse pagina, vanuit de plus op Overzicht en Boekingen.
struct ImportSheet: View {
	var body: some View {
		ImportView().environment(\.vertexAlsSheet, true)
	}
}

// MARK: - Rekeningen

struct AccountsView: View {
	var body: some View {
		Loader(key: "rekeningen", fetch: { try await $0.get("rekeningen") as BankAccounts }) { (data: BankAccounts) in
			VertexScherm(titel: "Rekeningen", terug: "Instellingen", gloed: false) {
				VSection {
					ForEach(data.accounts) { a in
						VNavigationLink { AccountEditor(account: a) } label: {
							HStack(spacing: 12) {
								VertexTegel(image: Image(a.kind == "spaar" ? "nav-piggy" : "nav-card"), hue: a.kind == "spaar" ? .mint : .accent, maat: 38)
								VStack(alignment: .leading, spacing: 1) {
									Text(a.name).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
									Text("\(a.kind == "spaar" ? "Spaarrekening" : "Betaalrekening") · \(Self.spaced(a.iban))")
										.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
								}
							}
						}
					}
					if data.accounts.isEmpty { Text("Rekeningen verschijnen hier na de eerste upload.").foregroundStyle(Vertex.Kleur.tekstGedempt) }
				} footer: {
					Text("Rekeningen verschijnen vanzelf na een upload. Op een spaarrekening houdt Stax per budget het spaarsaldo bij.")
				}
			}
		}
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
		VertexScherm(titel: account.name, terug: "Rekeningen", gloed: false, onderruimte: 40) {
			VSection("Naam") { VVeld("Naam", tekst: $name) }
			VertexSegmentbalk(opties: [("betaal", "Betaalrekening"), ("spaar", "Spaarrekening")], waarde: $kind)
			VSection { VWaarde("Rekeningnummer", value: AccountsView.spaced(account.iban)) }
			if let error { VertexMelding(tekst: error, toon: .negatief) }
			Button("Opslaan") { Task { await save() } }
				.buttonStyle(VertexPrimaireKnop())
				.disabled(busy || name.trimmingCharacters(in: .whitespaces).isEmpty)
				.opacity(busy || name.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)
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
			VertexScherm(
				titel: "Regels", terug: "Instellingen", gloed: false,
				acties: AnyView(VertexIcoonknop(systeemIcoon: "plus", label: "Nieuwe regel") { adding = true })
			) {
				VSection {
					ForEach(data.rules.filter { showMcc || $0.field != "mcc" }) { r in
						VKnopRij(actie: { editing = r }) {
							HStack(spacing: 12) {
								CategoryIcon(name: data.budgets.first { $0.id == r.categoryId }?.icon, size: 38, hue: data.budgets.first { $0.id == r.categoryId }?.hue)
								VStack(alignment: .leading, spacing: 1) {
									Text(r.pattern).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
									Text("\(Self.fields[r.field] ?? r.field) \(r.op) · \(name(r.categoryId))")
										.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).lineLimit(1)
								}
								Spacer(minLength: 8)
								VSym("chevron.right", 13).foregroundStyle(Vertex.Kleur.tekstVaag)
							}
						}
						
					}
				}
				VSection {
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
	@State private var confirmDelete = false

	var body: some View {
		VertexScherm(
			midden: rule == nil ? "Nieuwe regel" : "Regel", gloed: false, onderruimte: 40,
			leiding: AnyView(VertexIcoonknop(systeemIcoon: "xmark", label: "Sluit", maat: 44) { dismiss() }),
			acties: AnyView(VertexKopKnop(titel: "Bewaar", vet: true, uit: busy || category == 0 || (rule == nil && pattern.trimmingCharacters(in: .whitespaces).isEmpty)) { Task { await save() } })
		) {
			if rule == nil {
				VSection("Als de boeking…") {
					VKeuze("Veld", selection: $field, opties: ["tegenpartij", "omschrijving", "iban", "mcc"].map { ($0, RulesView.fields[$0] ?? $0) })
					VVeld("Tekst of nummer", tekst: $pattern)
				}
				VertexSegmentbalk(opties: [("is", "is"), ("bevat", "bevat")], waarde: $op)
			} else if let rule {
				VSection { VWaarde("\(RulesView.fields[rule.field] ?? rule.field) \(rule.op)", value: rule.pattern) }
			}
			VSection("…dan indelen bij") {
				VKeuze("Budget", selection: $category, opties: [(0, "Kies een budget")] + budgets.map { ($0.id, $0.path.isEmpty ? $0.name : "\($0.path) › \($0.name)") })
			}
			if let error { VertexMelding(tekst: error, toon: .negatief) }
			if rule != nil {
				Button("Verwijderen") { confirmDelete = true }.buttonStyle(VertexDestructieveKnop())
			}
		}
		.vertexBevestiging("Regel verwijderen?", bericht: "Nieuwe boekingen worden niet meer automatisch met deze regel ingedeeld.", isPresented: $confirmDelete, knop: "Verwijderen") { Task { await remove() } }
		.onAppear { if let rule { category = rule.categoryId } }
	}

	private func remove() async {
		guard let rule else { return }
		do {
			try await session.load { try await $0.delete("regels/\(rule.id)") }
			done("Regel verwijderd.")
			session.revision += 1
			dismiss()
		} catch { self.error = requestError(error) }
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
		VertexScherm(
			terug: "Instellingen", midden: "Startsaldo", gloed: false, onderruimte: 40,
			acties: AnyView(VertexKopKnop(titel: "Opslaan", vet: true, uit: busy) { Task { await save() } })
		) {
			VSection {
				DatePicker("Startdatum", selection: $start, displayedComponents: .date)
					.onChange(of: start) { _, new in changeDate(new) }
			} footer: {
				Text("Vanaf deze dag houdt Stax de spaarsaldi bij. Alles wat daarna op de spaarrekening binnenkomt of eraf gaat, wordt per boeking aan een budget gekoppeld.")
			}
			VSection {
				VKeuze("Inkomsten op de spaarrekening", selection: $incomePot, opties: [(0, "Niet bij inkomsten")] + data.pots.map { ($0.id, "Naar \($0.name)") })
			} footer: {
				Text("Rente en ander geld dat direct op de spaarrekening binnenkomt, kun je bij inkomsten zetten. Het geld zelf komt dan bij dit budget, zodat de spaarsaldi blijven kloppen met de bank.")
			}
			VSection {
				VWaarde("Op de spaarrekening", value: Format.money(data.balance))
				VWaarde("Verdeeld", value: Format.money(total))
				VWaarde(rest == 0 ? "Alles verdeeld" : rest > 0 ? "Nog te verdelen" : "Te veel verdeeld") {
					Text(Format.money(abs(rest))).foregroundStyle(rest == 0 ? Vertex.Kleur.statusPositief : Vertex.Kleur.statusWaarschuwing)
				}
			}
			VSection("Startsaldo per budget") {
				ForEach(data.pots) { p in
					HStack(spacing: 12) {
						VertexTegel(image: iconImage(nil), hue: .accent, maat: 36)
						VStack(alignment: .leading, spacing: 1) {
							Text(p.name).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
							if !p.context.isEmpty { Text(p.context).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt) }
						}
						Spacer(minLength: 4)
						TextField("0,00", text: Binding(get: { values[p.id] ?? "" }, set: { values[p.id] = $0 }))
							.keyboardType(.decimalPad).multilineTextAlignment(.trailing).vertexTekst(Vertex.Tekst.bodyVet)
							.padding(.horizontal, 10).frame(width: 96, height: 38)
							.background(Vertex.Kleur.achtergrondKaart2, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
						if rest > 0 {
							Button { values[p.id] = Format.input((Format.parse(values[p.id] ?? "") ?? 0) + rest) } label: {
								Text("+ rest").vertexTekst(Vertex.Tekst.label).foregroundStyle(Vertex.Kleur.accentStandaard)
									.padding(.horizontal, 10).padding(.vertical, 6).background(Vertex.Kleur.accentZacht, in: Capsule())
							}
							.buttonStyle(.plain)
						}
					}
				}
				if data.pots.isEmpty { Text("Er zijn nog geen budgetten die sparen. Zet bij een budget de optie “Spaart” aan.").foregroundStyle(Vertex.Kleur.tekstGedempt) }
			}
			if let error { VertexMelding(tekst: error, toon: .negatief) }
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
			VertexScherm(titel: "Account", terug: "Instellingen", gloed: false) {
				VSection("Naam") {
					VVeld("Naam", tekst: $name)
						.textContentType(.username)
						.textInputAutocapitalization(.never)
						.autocorrectionDisabled()
						.onAppear { if !nameLoaded { name = data.me?.name ?? session.user; nameLoaded = true } }
				}
				Button("Naam bewaren") { Task { await saveName() } }
					.buttonStyle(VertexSecundaireKnop())
					.disabled(busy || name.trimmingCharacters(in: .whitespaces).isEmpty || name == session.user)
				VSection {
					VVeld("Huidig", tekst: $current, geheim: true).textContentType(.password)
					VVeld("Nieuw", tekst: $next, geheim: true).textContentType(.newPassword)
					VVeld("Nog een keer", tekst: $repeatNext, geheim: true).textContentType(.newPassword)
				} header: {
					Text("WACHTWOORD")
				} footer: {
					Text("Minstens 12 tekens. Na een wijziging worden je andere sessies en telefoons uitgelogd.")
				}
				Button("Wachtwoord wijzigen") { Task { await savePassword() } }
					.buttonStyle(VertexPrimaireKnop())
					.disabled(busy || current.isEmpty || next.isEmpty || repeatNext.isEmpty)
					.opacity(current.isEmpty || next.isEmpty || repeatNext.isEmpty ? 0.5 : 1)
				if let message { VertexMelding(tekst: message, toon: .positief) }
				if let error { VertexMelding(tekst: error, toon: .negatief) }
				VSection {
					ForEach(data.devices) { d in
						HStack(spacing: 12) {
							VertexTegel(image: Image("ui-mobile"), hue: .lucht, maat: 36)
							VStack(alignment: .leading, spacing: 1) {
								Text(d.name).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd)
								Text("\(d.user) · \(d.lastUsedAt.map { "laatst gebruikt \(Format.date($0))" } ?? "ingelogd \(Format.date(d.createdAt))")")
									.vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
							}
						}
						.simultaneousGesture(LongPressGesture(minimumDuration: 0.5).onEnded { _ in removeDevice = d })
					}
				} header: {
					Text("TELEFOONS MET DE APP")
				} footer: {
					Text("Houd een telefoon ingedrukt om de toegang af te nemen; hij moet dan opnieuw inloggen.")
				}
			}
		}
		.vertexBevestiging("Toegang afnemen?", bericht: removeDevice.map { "\($0.name) kan dan niet meer inloggen." }, isPresented: Binding(get: { removeDevice != nil }, set: { if !$0 { removeDevice = nil } }), knop: "Toegang afnemen") { if let d = removeDevice { Task { await revoke(d) } } }
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
		VertexScherm(titel: "Back-up", terug: "Instellingen", gloed: false) {
			VSection {
				VKnopRij(actie: { Task { await make() } }) {
					HStack(spacing: 12) {
						VSym("square.and.arrow.up", 18)
						Text("Back-up maken").vertexTekst(Vertex.Tekst.bodyVet)
						if busy && pending == nil { Spacer(); ProgressView() }
					}
					.foregroundStyle(Vertex.Kleur.accentStandaard)
				}
				.disabled(busy)
			} footer: {
				Text("Eén bestand met al je gegevens: rekeningen, boekingen, budgetten, regels en startsaldo. Zonder inloggegevens. Bewaar het op een veilige plek, bijvoorbeeld in iCloud Drive.")
			}
			VSection {
				VKnopRij(actie: { picking = true }) {
					HStack(spacing: 12) {
						VSym("square.and.arrow.down", 18)
						Text("Back-up terugzetten").vertexTekst(Vertex.Tekst.bodyVet)
					}
					.foregroundStyle(Vertex.Kleur.statusNegatief)
				}
				.disabled(busy)
				.vertexBevestiging("Alles vervangen door deze back-up?", bericht: "Wat nu in Stax staat, verdwijnt. Dit kan niet ongedaan worden gemaakt.", isPresented: $confirm, knop: "Alles vervangen") { if let pending { Task { await restore(pending) } } }
			} footer: {
				Text("Kies een back-upbestand van Stax, van de server of van een andere telefoon.")
			}
			if let message { VertexMelding(tekst: message, toon: .positief) }
			if let error { VertexMelding(tekst: error, toon: .negatief) }
		}
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
