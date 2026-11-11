import Foundation
import Security

/// De apparaatsleutel staat in de iOS-sleutelhanger, alleen leesbaar op deze telefoon als hij ontgrendeld is.
enum Keychain {
	private static let service = Bundle.main.bundleIdentifier ?? "app.stax.finance"

	static func read(_ account: String) -> String? {
		let query: [String: Any] = [
			kSecClass as String: kSecClassGenericPassword,
			kSecAttrService as String: service,
			kSecAttrAccount as String: account,
			kSecReturnData as String: true,
		]
		var item: CFTypeRef?
		guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess, let data = item as? Data else { return nil }
		return String(data: data, encoding: .utf8)
	}

	static func write(_ account: String, _ value: String?) {
		let query: [String: Any] = [
			kSecClass as String: kSecClassGenericPassword,
			kSecAttrService as String: service,
			kSecAttrAccount as String: account,
		]
		SecItemDelete(query as CFDictionary)
		guard let value else { return }
		var add = query
		add[kSecValueData as String] = Data(value.utf8)
		add[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
		SecItemAdd(add as CFDictionary, nil)
	}
}
