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
				List {
					Section {
						Picker("Filter", selection: $filter) {
							ForEach(Filter.allCases, id: \.self) { Text($0.rawValue) }
						}
						.pickerStyle(.segmented)
						.listRowInsets(EdgeInsets())
						.listRowBackground(Color.clear)
					}
					Section {
						if data.rows.isEmpty {
							ContentUnavailableView(
								filter == .open ? "Alles is ingedeeld" : "Geen boekingen",
								systemImage: filter == .open ? "checkmark.circle" : "tray",
								description: Text(filter == .open ? "Nieuwe boekingen komen hier zodra je een afschrift uploadt." : "")
							)
						}
						ForEach(data.rows) { row in
							Button { selected = row } label: { BookingRow(row: row, options: data.options, accounts: data.accounts) }
								.foregroundStyle(.primary)
						}
					}
				}
				.listStyle(.insetGrouped)
				.onAppear {
					if filter == .open && searched.isEmpty { openCount = data.rows.count }
					#if DEBUG
						if UserDefaults.standard.bool(forKey: "debugOpenFirst"), selected == nil { selected = data.rows.first }
					#endif
				}
				.onChange(of: data.rows) { _, rows in if filter == .open && searched.isEmpty { openCount = rows.count } }
				.toolbar {
					ToolbarItem(placement: .topBarTrailing) {
						Button { importing = true } label: { Image(systemName: "plus") }
							.accessibilityLabel("Bankexport uploaden")
					}
					if filter == .all {
						ToolbarItem(placement: .topBarTrailing) {
							MonthMenu(months: data.months, month: Binding(get: { month ?? data.months.first }, set: { month = $0 }), allowAll: true)
						}
					}
				}
				.sheet(isPresented: $importing) { ImportSheet() }
				.sheet(item: $selected) { row in
					ClassifyView(row: row, data: data, queue: data.rows) { selected = nil }
				}
			}
			.navigationTitle("Boekingen")
			.searchable(text: $query, prompt: "Zoek op naam, omschrijving of bedrag")
			.onSubmit(of: .search) { searched = query }
			.onChange(of: query) { _, q in if q.isEmpty { searched = "" } }
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

	private var chip: (String, Color) {
		switch row.status {
		case "uitgesloten": return ("Telt niet mee", .secondary)
		case "overboeking": return ("Overboeking", .secondary)
		case "open": return (row.needsPot ? "Kies een budget" : "Indelen", .orange)
		default:
			if row.splits.count > 1 { return ("\(row.splits.count) delen", .stax) }
			return (options.first { $0.id == row.splits.first?.categoryId }?.name ?? "?", .stax)
		}
	}

	var body: some View {
		HStack(alignment: .top, spacing: 12) {
			VStack(alignment: .leading, spacing: 3) {
				Text(row.title).lineLimit(1)
				if !subtitle.isEmpty {
					Text(subtitle).font(.caption).foregroundStyle(.secondary).lineLimit(1)
				}
				HStack(spacing: 6) {
					Text(chip.0)
						.font(.caption.weight(.semibold))
						.padding(.horizontal, 8)
						.padding(.vertical, 2)
						.background(chip.1.opacity(0.12), in: Capsule())
						.foregroundStyle(chip.1)
					if row.refundLeft > 0 {
						Text("\(Format.money(row.refundLeft)) terug verwacht").font(.caption).foregroundStyle(.secondary)
					}
					if let source = row.refundSource {
						Text("Teruggave van \(source.name)").font(.caption).foregroundStyle(.secondary).lineLimit(1)
					}
				}
			}
			Spacer(minLength: 8)
			VStack(alignment: .trailing, spacing: 3) {
				Text(Format.money(row.amountCents))
					.font(.body.weight(.semibold).monospacedDigit())
					.foregroundStyle(row.amountCents > 0 ? .green : .primary)
				Text(Format.date(row.bookingDate)).font(.caption).foregroundStyle(.secondary)
			}
		}
		.padding(.vertical, 2)
	}
}
