import SwiftUI

/// Boekingen: standaard wat nog ingedeeld moet worden. Tik op een boeking om hem in te delen.
struct BookingsView: View {
	@Binding var openCount: Int
	@Environment(Session.self) private var session

	enum Filter: String, CaseIterable {
		case open = "Nog indelen"
		case all = "Alles"
		case refund = "Terug verwacht"

		var status: String? {
			switch self {
			case .open: "open"
			case .all: nil
			case .refund: "terug"
			}
		}
	}

	@State private var importing = false
	@State private var filter = Filter.open
	@State private var month: String?
	@State private var query = ""
	@State private var searched = ""
	@State private var selected: Booking?

	var body: some View {
		NavigationStack {
			Loader(
				key: "\(filter.rawValue)|\(month ?? "")|\(searched)",
				fetch: { api -> Bookings in
					try await api.get("boekingen", ["status": filter.status, "maand": filter == .all && searched.isEmpty ? month : nil, "q": searched.isEmpty ? nil : searched])
				}
			) { (data: Bookings) in
				VertexScherm(
					titel: "Boekingen", gloed: false,
					acties: AnyView(
						HStack(spacing: 8) {
							if filter == .all {
								MonthMenu(months: data.months, month: Binding(get: { month ?? data.months.first }, set: { month = $0 }), allowAll: true)
							}
							VertexIcoonknop(systeemIcoon: "plus", label: "Bankexport uploaden") { importing = true }
						}
					)
				) {
					VertexZoekveld(prompt: "Zoek op naam, omschrijving of bedrag", tekst: $query) { searched = query }
					VertexSegmentbalk(opties: Filter.allCases.map { ($0, $0.rawValue) }, waarde: $filter)
					if data.rows.isEmpty {
						VStack(spacing: 8) {
							VSym(filter == .open ? "checkmark.circle" : "tray", 34).foregroundStyle(Vertex.Kleur.tekstVaag)
							Text(filter == .open ? "Alles is ingedeeld" : "Geen boekingen").vertexTekst(Vertex.Tekst.subkop)
							if filter == .open {
								Text("Nieuwe boekingen komen hier zodra je een afschrift uploadt.").vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).multilineTextAlignment(.center)
							}
						}
						.frame(maxWidth: .infinity).padding(.vertical, 40)
					} else {
						VSection {
							ForEach(data.rows) { row in
								VKnopRij(actie: { selected = row }) { BookingRow(row: row, options: data.options, accounts: data.accounts) }
							}
						}
					}
				}
				.onAppear {
					if filter == .open && searched.isEmpty { openCount = data.rows.count }
					#if DEBUG
						if UserDefaults.standard.bool(forKey: "debugOpenFirst"), selected == nil { selected = data.rows.first }
					#endif
				}
				.onChange(of: data.rows) { _, rows in if filter == .open && searched.isEmpty { openCount = rows.count } }
				.onChange(of: query) { _, q in if q.isEmpty { searched = "" } }
				.sheet(isPresented: $importing) { ImportSheet() }
				.sheet(item: $selected) { row in
					ClassifyView(row: row, data: data, queue: data.rows) { selected = nil }
				}
			}
		}
	}
}

struct BookingRow: View {
	let row: Booking
	let options: [CategoryOption]
	let accounts: [Account]

	private var subtitle: String {
		if row.isTransfer {
			let other = accounts.first { $0.id == row.transferAccountId }?.name ?? "eigen rekening"
			return "\(row.amountCents < 0 ? "Naar" : "Van") \(other)"
		}
		return row.counterparty != nil ? row.description : ""
	}

	private var chip: (String, VertexChip.Toon) {
		switch row.status {
		case "uitgesloten": return ("Telt niet mee", .neutraal)
		case "overboeking": return ("Overboeking", .neutraal)
		case "open": return (row.needsPot ? "Kies een budget" : "Indelen", .waarschuwing)
		default:
			if row.splits.count > 1 { return ("\(row.splits.count) delen", .accent) }
			return (options.first { $0.id == row.splits.first?.categoryId }?.name ?? "?", .accent)
		}
	}

	var body: some View {
		HStack(alignment: .top, spacing: 12) {
			VStack(alignment: .leading, spacing: 3) {
				Text(row.title).vertexTekst(Vertex.Tekst.bodyVet).foregroundStyle(Vertex.Kleur.tekstHoofd).lineLimit(1)
				if !subtitle.isEmpty {
					Text(subtitle).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).lineLimit(1)
				}
				HStack(spacing: 6) {
					VertexChip(tekst: chip.0, toon: chip.1)
					if row.refundLeft > 0 {
						Text("\(Format.money(row.refundLeft)) terug verwacht").vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
					}
					if let source = row.refundSource {
						Text("Teruggave van \(source.name)").vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt).lineLimit(1)
					}
				}
			}
			Spacer(minLength: 8)
			VStack(alignment: .trailing, spacing: 3) {
				Text(Format.money(row.amountCents))
					.vertexTekst(Vertex.Tekst.bodyVet).monospacedDigit()
					.foregroundStyle(row.amountCents > 0 ? Vertex.Kleur.statusPositief : Vertex.Kleur.tekstHoofd)
				Text(Format.date(row.bookingDate)).vertexTekst(Vertex.Tekst.klein).foregroundStyle(Vertex.Kleur.tekstGedempt)
			}
		}
		.padding(.vertical, 2)
	}
}
