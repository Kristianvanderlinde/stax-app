import Foundation

/// Bedragen en datums zoals de website ze toont: € 1.234,56, € −12,34 en "november 2026".
enum Format {
	private static let number: NumberFormatter = {
		let f = NumberFormatter()
		f.numberStyle = .decimal
		f.locale = Locale(identifier: "nl_NL")
		f.minimumFractionDigits = 2
		f.maximumFractionDigits = 2
		return f
	}()

	/// Zonder euroteken, voor in lijsten: 1.234,56 of −12,34 (met signed ook +12,34).
	static func amount(_ cents: Int?, signed: Bool = false) -> String {
		let c = cents ?? 0
		let sign = c < 0 ? "−" : (signed && c > 0 ? "+" : "")
		return sign + (number.string(from: NSNumber(value: Double(abs(c)) / 100)) ?? "0,00")
	}

	static let dutch = Locale(identifier: "nl_NL")

	/// Euroteken, spatie, eventueel het teken, dan het bedrag: € 1.234,56 of € −12,34.
	static func money(_ cents: Int?) -> String {
		"€\u{00a0}" + amount(cents)
	}

	/// Met + of − ervoor, zoals bij erin en eruit.
	static func signed(_ cents: Int) -> String {
		"€\u{00a0}" + amount(cents, signed: true)
	}

	/// Bedrag invullen in een tekstveld: 12,50 zonder euroteken.
	static func input(_ cents: Int) -> String {
		String(format: "%.2f", Double(abs(cents)) / 100).replacingOccurrences(of: ".", with: ",")
	}

	/// "12,50", "12.50" of "1.234,50" → centen.
	static func parse(_ text: String) -> Int? {
		var t = text.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "€", with: "").replacingOccurrences(of: " ", with: "")
		if t.contains(",") { t = t.replacingOccurrences(of: ".", with: "").replacingOccurrences(of: ",", with: ".") }
		guard let value = Double(t) else { return nil }
		return Int((value * 100).rounded())
	}

	static func month(_ m: String, year: Bool = true) -> String {
		let parts = m.split(separator: "-").compactMap { Int($0) }
		guard parts.count == 2 else { return m }
		let name = dutch.calendar.standaloneMonthSymbols[parts[1] - 1]
		return year ? "\(name) \(parts[0])" : name
	}

	/// "Maart" voor maand 3, voor een keuzelijst.
	static func monthName(_ n: Int) -> String {
		let s = dutch.calendar.standaloneMonthSymbols[n - 1]
		return s.prefix(1).uppercased() + s.dropFirst()
	}

	/// Maandnaam met hoofdletter, voor titels, menu's en de balk: "Oktober 2026". Midden in een zin blijft `month` met kleine letter.
	static func monthTitle(_ m: String) -> String {
		let s = month(m)
		return s.prefix(1).uppercased() + s.dropFirst()
	}

	/// "Okt ’26": kort genoeg voor in de balk onderaan.
	static func shortMonth(_ m: String) -> String {
		let parts = m.split(separator: "-").compactMap { Int($0) }
		guard parts.count == 2 else { return m }
		let name = dutch.calendar.shortMonthSymbols[parts[1] - 1].replacingOccurrences(of: ".", with: "")
		return "\(name.prefix(1).uppercased() + name.dropFirst()) ’\(String(parts[0] % 100))"
	}

	/// Maand verschuiven: shift("2026-12", by: 1) is "2027-01".
	static func shift(_ m: String, by n: Int) -> String {
		let parts = m.split(separator: "-").compactMap { Int($0) }
		guard parts.count == 2 else { return m }
		let index = parts[0] * 12 + (parts[1] - 1) + n
		return String(format: "%04d-%02d", index / 12, index % 12 + 1)
	}

	static var thisMonth: String {
		let c = Calendar(identifier: .gregorian).dateComponents([.year, .month], from: .now)
		return String(format: "%04d-%02d", c.year ?? 2026, c.month ?? 1)
	}

	/// Alle maanden om uit te kiezen: vanaf de vroegste met boekingen tot een jaar vooruit, zodat je ook kunt plannen.
	static func choices(_ known: [String]) -> [String] {
		let first = known.min() ?? thisMonth
		let last = max(shift(thisMonth, by: 12), known.max() ?? "")
		var list: [String] = []
		var m = first
		while m <= last, list.count < 120 {
			list.append(m)
			m = shift(m, by: 1)
		}
		return list
	}

	/// "in 2027", "in maart 2027" of "op 15 maart 2027", afhankelijk van hoe precies het doel is.
	static func goalDate(_ d: String) -> String {
		if d.count == 4 { return "in \(d)" }
		if d.count == 7 { return "in \(month(d))" }
		return "op \(date(d).replacingOccurrences(of: " ", with: " "))"
	}

	static func date(_ iso: String) -> String {
		let parts = iso.prefix(10).split(separator: "-").compactMap { Int($0) }
		guard parts.count == 3 else { return iso }
		let short = dutch.calendar.shortMonthSymbols[parts[1] - 1].replacingOccurrences(of: ".", with: "")
		return "\(parts[2]) \(short) \(parts[0])"
	}
}
