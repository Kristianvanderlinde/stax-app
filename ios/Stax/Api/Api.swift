import Foundation

/// Praat met de Stax-server, of met de lokale kern in de app. Elke telefoon heeft een eigen sleutel (Bearer-token) uit de sleutelhanger.
struct Api {
	let server: URL
	let token: String?
	/// Zonder server: de rekenkern in de app zelf.
	var local: LocalCore? = nil

	enum Failure: LocalizedError {
		case unauthorized
		case message(String)

		var errorDescription: String? {
			switch self {
			case .unauthorized: "Je bent uitgelogd. Log opnieuw in."
			case .message(let text): text
			}
		}
	}

	fileprivate static let decoder: JSONDecoder = {
		let d = JSONDecoder()
		d.keyDecodingStrategy = .convertFromSnakeCase
		return d
	}()

	func get<T: Decodable>(_ path: String, _ query: [String: String?] = [:]) async throws -> T {
		var url = URLComponents(url: server.appending(path: "api/v1/\(path)"), resolvingAgainstBaseURL: false)!
		let items = query.compactMap { key, value in value.map { URLQueryItem(name: key, value: $0) } }
		if !items.isEmpty { url.queryItems = items }
		if let local { return try await sendLocal(local, "GET", path, url.percentEncodedQuery ?? "", nil) }
		return try await send(URLRequest(url: url.url!))
	}

	func post<T: Decodable>(_ path: String, _ body: some Encodable) async throws -> T {
		try await send(method: "POST", path, body)
	}

	func put<T: Decodable>(_ path: String, _ body: some Encodable) async throws -> T {
		try await send(method: "PUT", path, body)
	}

	func delete(_ path: String) async throws {
		if let local { let _: Empty = try await sendLocal(local, "DELETE", path, "", nil); return }
		var request = URLRequest(url: server.appending(path: "api/v1/\(path)"))
		request.httpMethod = "DELETE"
		let _: Empty = try await send(request)
	}

	/// Het antwoord als bytes, voor bestanden zoals de back-up. Zelfde foutafhandeling als de rest.
	func raw(_ method: String, _ path: String, body: Data? = nil) async throws -> Data {
		if let local {
			let reply = try await local.handle(method: method, path: path, query: "", body: body)
			try Self.check(status: reply.status, data: reply.body, token: nil)
			return reply.body
		}
		var request = URLRequest(url: server.appending(path: "api/v1/\(path)"))
		request.httpMethod = method
		request.timeoutInterval = 120
		if let body {
			request.setValue("application/json", forHTTPHeaderField: "Content-Type")
			request.httpBody = body
		}
		if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
		let (data, response) = try await URLSession.shared.data(for: request)
		try Self.check(status: (response as? HTTPURLResponse)?.statusCode ?? 0, data: data, token: token)
		return data
	}

	private func send<T: Decodable>(method: String, _ path: String, _ body: some Encodable) async throws -> T {
		if let local { return try await sendLocal(local, method, path, "", try JSONEncoder().encode(body)) }
		var request = URLRequest(url: server.appending(path: "api/v1/\(path)"))
		request.httpMethod = method
		request.setValue("application/json", forHTTPHeaderField: "Content-Type")
		request.httpBody = try JSONEncoder().encode(body)
		return try await send(request)
	}

	private func send<T: Decodable>(_ request: URLRequest) async throws -> T {
		var request = request
		request.timeoutInterval = 20
		if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
		let (data, response) = try await URLSession.shared.data(for: request)
		return try Self.decode(status: (response as? HTTPURLResponse)?.statusCode ?? 0, data: data, token: token)
	}

	/// Dezelfde afhandeling als bij een netwerkantwoord, maar dan van de lokale kern.
	private func sendLocal<T: Decodable>(_ core: LocalCore, _ method: String, _ path: String, _ query: String, _ body: Data?) async throws -> T {
		let reply = try await core.handle(method: method, path: path, query: query, body: body)
		return try Self.decode(status: reply.status, data: reply.body, token: nil)
	}

	private static func check(status: Int, data: Data, token: String?) throws {
		if status == 401, token != nil { throw Failure.unauthorized }
		guard (200..<300).contains(status) else {
			let text = (try? JSONDecoder().decode(ErrorBody.self, from: data))?.error ?? (try? JSONDecoder().decode(KitError.self, from: data))?.message
			throw Failure.message(text ?? "Er ging iets mis (\(status)).")
		}
	}

	private static func decode<T: Decodable>(status: Int, data: Data, token: String?) throws -> T {
		try check(status: status, data: data, token: token)
		return try decoder.decode(T.self, from: data)
	}

	private struct ErrorBody: Decodable { let error: String }
	private struct KitError: Decodable { let message: String }
}

struct Empty: Codable {}
