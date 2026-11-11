import Foundation

// Dezelfde gegevens als de website, kant-en-klaar berekend door de server. Bedragen in centen.

struct Bar: Codable, Hashable {
	let pct: Double
	let over: Bool
	let text: String
	let warn: Bool
}

/// Een rij in het overzicht: budget, spaarpot of groep.
struct BudgetRow: Codable, Identifiable, Hashable {
	let id: Int
	let name: String
	let icon: String?
	let level: Int
	let group: Bool
	let kind: String
	let subtitle: String
	let plan: Int
	let net: Int
	let balance: Int?
	let bar: Bar?
	let toWithdraw: Int
}

struct OverviewGroup: Codable, Identifiable {
	let id: Int
	let name: String
	let icon: String?
	let plan: Int
	let net: Int
	let balance: Int?
	let rows: [BudgetRow]
}

struct Overview: Codable {
	struct Totals: Codable {
		let inkomsten: Int
		let uitgaven: Int
		let planned: Int
		let toDistribute: Int
		/// Verwacht inkomen; ontbreekt bij een oudere server.
		let expected: Int?
		let toDistributeBasis: String?
		let incomeNote: String?
	}
	struct Refunds: Codable {
		let n: Int
		let cents: Int
	}
	let month: String
	let months: [String]
	let totals: Totals
	let open: Int
	let openTotal: Int
	let refunds: Refunds
	let groups: [OverviewGroup]
	let income: [BudgetRow]
}

struct SavingsPot: Codable, Identifiable {
	let id: Int
	let name: String
	let icon: String?
	let kind: String
	let balance: Int?
	let bar: Bar?
	let toWithdraw: Int
	let path: String
	let funding: String
}

struct Savings: Codable {
	struct Group: Codable, Identifiable {
		let id: Int
		let name: String
		let icon: String?
		let group: Bool
		let total: Int
		let pots: [SavingsPot]
	}
	let balanceDate: String
	let total: Int
	let hasSavings: Bool
	let difference: Int
	let savingsAccount: Int?
	let groups: [Group]
}

struct Goal: Codable {
	let target: Int
	let date: String?
	let progress: Double
	let expected: Int?
	let perMonth: Int?
	let monthsLeft: Int?
}

struct BudgetDetail: Codable, Identifiable {
	var id: Int { node.id }
	struct Node: Codable {
		let id: Int
		let name: String
		let path: [String]
		let icon: String?
		let tree: String
		let group: Bool
		let kind: String
		let funding: String
	}
	struct Figures: Codable {
		let kind: String
		let plan: Int?
		let net: Int
		let spent: Int
		let balance: Int?
		let bar: Bar?
		let inleg: Int
		let outside: Int
		let toWithdraw: Int
	}
	struct Point: Codable, Identifiable {
		var id: String { month }
		let month: String
		let spent: Int
		let plan: Int
		let balance: Int?
	}
	struct Booking: Codable, Identifiable {
		let id: Int
		let date: String
		let name: String
		let transfer: Bool
		let amount: Int
		let budget: String
	}
	/// Wat de editor nodig heeft; ontbreekt bij een oudere server (dan is bewerken uit).
	struct Edit: Codable {
		struct Template: Codable {
			let amount: Int
			let since: String
		}
		let parentId: Int?
		/// Het eigen icoon; leeg als het budget het icoon van de groep gebruikt.
		let ownIcon: String?
		let funding: String?
		let goalCents: Int?
		let goalDate: String?
		let bookings: Int
		let childCount: Int
		let amount: Int?
		let template: Template?
		let override: Int?
	}
	let month: String
	let months: [String]
	let node: Node
	let edit: Edit?
	let figures: Figures
	let goal: Goal?
	let history: [Point]
	let bookings: [Booking]
	let children: [BudgetRow]
}

// MARK: - Boekingen

struct Split: Codable, Hashable {
	let categoryId: Int
	let amountCents: Int
	var fromPot: Int?
}

struct RefundSource: Codable, Hashable {
	let id: Int
	let date: String
	let amount: Int
	let name: String
}

struct Booking: Codable, Identifiable, Hashable {
	let id: Int
	let accountId: Int
	let accountKind: String
	let bookingDate: String
	let amountCents: Int
	let counterparty: String?
	let description: String
	let rawInfo: String
	let transferAccountId: Int?
	let excluded: Int
	let note: String?
	let refundExpected: Int?
	let refundReceived: Int
	let refundSource: RefundSource?
	let splits: [Split]
	let status: String
	let needsPot: Bool
	let withdrawal: Bool

	var isTransfer: Bool { transferAccountId != nil }

	/// Bij een overboeking tussen eigen rekeningen zegt de omschrijving meer dan de tegenpartij (jullie eigen naam).
	var title: String {
		if isTransfer { return description.isEmpty ? "Overboeking" : description }
		return counterparty ?? (description.isEmpty ? "Onbekend" : description)
	}

	var refundLeft: Int { refundExpected.map { max(0, $0 - refundReceived) } ?? 0 }
}

struct CategoryOption: Codable, Identifiable, Hashable {
	let id: Int
	let tree: String
	let name: String
	let label: String
	let depth: Int
	let parent: Int?
	let group: Bool
	let kind: String
	let savings: Bool
	let icon: String?
}

struct Account: Codable, Identifiable, Hashable {
	let id: Int
	let name: String
	let kind: String
}

struct ExpectedRefund: Codable, Identifiable, Hashable {
	let id: Int
	let bookingDate: String
	let amountCents: Int
	let name: String
	let note: String?
	let expected: Int
	let received: Int
}

struct Withdrawal: Codable, Identifiable, Hashable {
	let id: Int
	let name: String
	let cents: Int
}

struct Bookings: Codable {
	let rows: [Booking]
	let toWithdraw: [Withdrawal]
	let incomePot: String?
	let months: [String]
	let refunds: [ExpectedRefund]
	let options: [CategoryOption]
	let accounts: [Account]
}

struct Classification: Encodable {
	struct Part: Encodable {
		let category_id: Int
		let amount_cents: Int
	}
	let splits: [Part]
	let fromPot: Bool
	let note: String
	let excluded: Bool
	let refund: Int?
	let remember: Bool
}

struct Saved: Decodable {
	let applied: Int?
	let row: Booking?
}

struct LoginRequest: Encodable {
	let name: String
	let password: String
	let code: String
	let device: String
}

struct LoginResponse: Decodable {
	let token: String
	let user: String
}

/// De groepen waaruit je een groep voor een budget kiest.
struct GroupChoices: Codable {
	struct Group: Codable, Identifiable, Hashable {
		let id: Int
		let name: String
		let icon: String?
	}
	let groups: [Group]
	let incomeRoot: Int
}

// MARK: - Instellingen

struct BankAccount: Codable, Identifiable, Hashable {
	let id: Int
	let iban: String
	var name: String
	var kind: String
}
struct BankAccounts: Codable { let accounts: [BankAccount] }

struct RuleItem: Codable, Identifiable, Hashable {
	let id: Int
	let field: String
	let op: String
	let pattern: String
	let categoryId: Int
}
struct RuleBudget: Codable, Identifiable, Hashable {
	let id: Int
	let name: String
	let path: String
}
struct Rules: Codable {
	let rules: [RuleItem]
	let budgets: [RuleBudget]
}
struct Applied: Codable { let applied: Int }

struct StartData: Codable {
	struct Pot: Codable, Identifiable, Hashable {
		let id: Int
		let name: String
		let context: String
		let depth: Int
		let openingCents: Int
		let isGroup: Bool
	}
	let startdatum: String
	let saved: String?
	let balance: Int
	let pots: [Pot]
	let incomePot: Int?
	let hasSavings: Bool
}

struct ImportRow: Codable, Identifiable {
	let id: Int
	let filename: String
	let importedAt: String
	let nTotal: Int
	let nNew: Int
	let account: String
}
struct Imports: Codable { let imports: [ImportRow] }
struct CsvNeeds: Codable {
	let headers: [String]
	let sample: [[String]]
	let delimiter: String
	let mapping: [String: Int]
	let needsIban: Bool
}
struct CsvExample: Codable, Identifiable {
	var id: String { "\(date)|\(amountCents)|\(counterparty ?? "")|\(description)" }
	let date: String
	let amountCents: Int
	let counterparty: String?
	let description: String
}
struct ExampleOutcome: Codable {
	let total: Int
	let examples: [CsvExample]
	let error: String?
}
struct ImportOutcome: Codable {
	struct Result: Codable, Identifiable {
		var id: String { filename }
		let filename: String
		let account: String
		let total: Int
		let added: Int
		let error: String?
		/// Een CSV waarvan de kolommen niet herkend zijn: de gebruiker kiest ze zelf.
		let needs: CsvNeeds?
	}
	let results: [Result]
	let categorized: Int
}

struct AccountInfo: Codable {
	struct Me: Codable { let id: Int; let name: String }
	struct User: Codable, Identifiable { let id: Int; let name: String }
	struct Device: Codable, Identifiable {
		let id: Int
		let user: String
		let name: String
		let createdAt: String
		let lastUsedAt: String?
	}
	let me: Me?
	let users: [User]
	let devices: [Device]
}

struct Ordering: Codable {
	struct Item: Codable, Identifiable, Hashable {
		let id: Int
		let name: String
		let icon: String?
	}
	struct Group: Codable, Identifiable {
		let id: Int
		let name: String
		let icon: String?
		var budgets: [Item]
	}
	let expensesRoot: Int
	let incomeRoot: Int
	var groups: [Group]
	var income: [Item]
}
