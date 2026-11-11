import Foundation
import JavaScriptCore
import SQLite3

/// De rekenkern in de app: dezelfde TypeScript als op de server (core.js), uitgevoerd in JavaScriptCore,
/// met een SQLite-database op de telefoon. Alles gebeurt op één seriële wachtrij.
final class LocalCore: @unchecked Sendable {
	struct Reply { let status: Int; let body: Data }
	enum Failure: LocalizedError {
		case setup(String)
		var errorDescription: String? { if case .setup(let t) = self { "Lokale kern: \(t)" } else { nil } }
	}

	private let queue = DispatchQueue(label: "\(Bundle.main.bundleIdentifier ?? "app.stax.finance").core")
	private var context: JSContext!
	private var core: JSValue!
	private var db: OpaquePointer?

	/// Waar de lokale database staat.
	static var defaultURL: URL {
		let dir = URL.applicationSupportDirectory.appending(path: "Stax", directoryHint: .isDirectory)
		try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
		return dir.appending(path: "stax.db")
	}

	init(databaseURL: URL = LocalCore.defaultURL) throws {
		var failure: Error?
		queue.sync {
			do { try self.setUp(databaseURL) } catch { failure = error }
		}
		if let failure { throw failure }
	}

	deinit { sqlite3_close(db) }

	// MARK: - Opstarten

	private func setUp(_ url: URL) throws {
		guard sqlite3_open(url.path, &db) == SQLITE_OK else { throw Failure.setup("database openen mislukt") }
		guard let script = Bundle.main.url(forResource: "core", withExtension: "js"), let source = try? String(contentsOf: script, encoding: .utf8) else {
			throw Failure.setup("core.js ontbreekt in de app")
		}
		let ctx = JSContext()!
		var jsError: String?
		ctx.exceptionHandler = { _, exception in jsError = exception?.toString() }
		installBridge(in: ctx)
		ctx.evaluateScript(source)
		if let jsError { throw Failure.setup(jsError) }
		guard let core = ctx.objectForKeyedSubscript("Core"), !core.isUndefined else { throw Failure.setup("kern niet geladen") }
		context = ctx
		self.core = core
		ctx.exceptionHandler = { _, exception in NSLog("Stax-kern: \(exception?.toString() ?? "?")") }
	}

	/// De drie aanroepen die de TypeScript-kern nodig heeft, in plaats van node:sqlite: exec, query en run.
	private func installBridge(in ctx: JSContext) {
		let bridge = JSValue(newObjectIn: ctx)!
		func fail(_ message: String) {
			let c = JSContext.current()
			c?.exception = JSValue(newErrorFromMessage: message, in: c)
		}
		let transient = unsafeBitCast(-1, to: sqlite3_destructor_type.self)
		func bind(_ stmt: OpaquePointer?, _ json: String) {
			guard let data = json.data(using: .utf8), let values = (try? JSONSerialization.jsonObject(with: data)) as? [Any] else { return }
			for (i, value) in values.enumerated() {
				let n = Int32(i + 1)
				switch value {
				case is NSNull: sqlite3_bind_null(stmt, n)
				case let text as String: sqlite3_bind_text(stmt, n, text, -1, transient)
				case let number as NSNumber:
					if CFGetTypeID(number) == CFBooleanGetTypeID() { sqlite3_bind_int64(stmt, n, number.boolValue ? 1 : 0) }
					else if CFNumberIsFloatType(number) { sqlite3_bind_double(stmt, n, number.doubleValue) }
					else { sqlite3_bind_int64(stmt, n, number.int64Value) }
				default: sqlite3_bind_null(stmt, n)
				}
			}
		}
		let message: () -> String = { [unowned self] in String(cString: sqlite3_errmsg(self.db)) }

		let exec: @convention(block) (String) -> Void = { [unowned self] sql in
			var error: UnsafeMutablePointer<CChar>?
			if sqlite3_exec(self.db, sql, nil, nil, &error) != SQLITE_OK {
				let text = error.map { String(cString: $0) } ?? message()
				sqlite3_free(error)
				fail(text)
			}
		}
		let query: @convention(block) (String, String) -> String = { [unowned self] sql, params in
			var stmt: OpaquePointer?
			guard sqlite3_prepare_v2(self.db, sql, -1, &stmt, nil) == SQLITE_OK else { fail(message()); return "[]" }
			defer { sqlite3_finalize(stmt) }
			bind(stmt, params)
			var rows: [[String: Any]] = []
			while true {
				let rc = sqlite3_step(stmt)
				if rc == SQLITE_DONE { break }
				guard rc == SQLITE_ROW else { fail(message()); return "[]" }
				var row: [String: Any] = [:]
				for c in 0..<sqlite3_column_count(stmt) {
					let name = String(cString: sqlite3_column_name(stmt, c))
					switch sqlite3_column_type(stmt, c) {
					case SQLITE_INTEGER: row[name] = sqlite3_column_int64(stmt, c)
					case SQLITE_FLOAT: row[name] = sqlite3_column_double(stmt, c)
					case SQLITE_TEXT: row[name] = String(cString: sqlite3_column_text(stmt, c))
					default: row[name] = NSNull()
					}
				}
				rows.append(row)
			}
			let data = (try? JSONSerialization.data(withJSONObject: rows)) ?? Data("[]".utf8)
			return String(decoding: data, as: UTF8.self)
		}
		let run: @convention(block) (String, String) -> String = { [unowned self] sql, params in
			var stmt: OpaquePointer?
			guard sqlite3_prepare_v2(self.db, sql, -1, &stmt, nil) == SQLITE_OK else { fail(message()); return "{}" }
			defer { sqlite3_finalize(stmt) }
			bind(stmt, params)
			var rc = sqlite3_step(stmt)
			while rc == SQLITE_ROW { rc = sqlite3_step(stmt) }
			guard rc == SQLITE_DONE else { fail(message()); return "{}" }
			return "{\"changes\":\(sqlite3_changes(self.db)),\"lastInsertRowid\":\(sqlite3_last_insert_rowid(self.db))}"
		}
		bridge.setObject(exec, forKeyedSubscript: "exec" as NSString)
		bridge.setObject(query, forKeyedSubscript: "query" as NSString)
		bridge.setObject(run, forKeyedSubscript: "run" as NSString)
		ctx.setObject(bridge, forKeyedSubscript: "__stax" as NSString)
	}

	// MARK: - Aanroepen

	/// Voert een API-verzoek uit, net als de server.
	func handle(method: String, path: String, query: String, body: Data?) async throws -> Reply {
		try await withCheckedThrowingContinuation { continuation in
			queue.async {
				let bodyText = body.flatMap { String(data: $0, encoding: .utf8) }
				let args: [Any] = [method, path, query, bodyText ?? NSNull()]
				guard let promise = self.core.invokeMethod("handle", withArguments: args) else {
					continuation.resume(throwing: Failure.setup("geen antwoord van de kern"))
					return
				}
				let done = JSValue(object: { (reply: JSValue) in
					let status = Int(reply.forProperty("status")?.toInt32() ?? 500)
					let text = reply.forProperty("body")?.toString() ?? ""
					continuation.resume(returning: Reply(status: status, body: Data(text.utf8)))
				} as @convention(block) (JSValue) -> Void, in: self.context)!
				let failed = JSValue(object: { (reason: JSValue) in
					continuation.resume(throwing: Failure.setup(reason.toString() ?? "onbekende fout"))
				} as @convention(block) (JSValue) -> Void, in: self.context)!
				promise.invokeMethod("then", withArguments: [done, failed])
			}
		}
	}
}
