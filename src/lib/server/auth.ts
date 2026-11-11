import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import QRCode from 'qrcode';
import { db } from './db';

// Inloggen met naam, wachtwoord en een TOTP-code (uit een authenticator-app of wachtwoordmanager).
// Wachtwoorden staan alleen als scrypt-hash in de database, sessietokens alleen als SHA-256-hash.

export const SESSION_COOKIE = 'stax_sessie';
export const SESSION_DAYS = 30;

export interface User {
	id: number;
	name: string;
}

// --- Wachtwoorden ---

export function hashPassword(password: string): string {
	const salt = randomBytes(16);
	const hash = scryptSync(password, salt, 64);
	return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function checkPassword(password: string, stored: string): boolean {
	const [, salt, hash] = stored.split('$');
	if (!salt || !hash) return false;
	const expected = Buffer.from(hash, 'hex');
	const actual = scryptSync(password, Buffer.from(salt, 'hex'), expected.length);
	return timingSafeEqual(actual, expected);
}

export function passwordProblem(password: string, repeat: string): string | null {
	if (password.length < 12) return 'Kies een wachtwoord van minstens 12 tekens.';
	if (password !== repeat) return 'De twee wachtwoorden zijn niet gelijk.';
	return null;
}

// --- TOTP (RFC 6238: 30 seconden, 6 cijfers, SHA-1, zoals authenticator-apps en wachtwoordmanagers verwachten) ---

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function newTotpSecret(): string {
	const bytes = randomBytes(20);
	let bits = '';
	for (const b of bytes) bits += b.toString(2).padStart(8, '0');
	let out = '';
	for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
	return out;
}

function base32Decode(secret: string): Buffer {
	let bits = '';
	for (const c of secret.replace(/=+$/, '').toUpperCase()) {
		const v = B32.indexOf(c);
		if (v < 0) continue;
		bits += v.toString(2).padStart(5, '0');
	}
	const bytes: number[] = [];
	for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
	return Buffer.from(bytes);
}

function hotp(key: Buffer, counter: number): string {
	const msg = Buffer.alloc(8);
	msg.writeBigUInt64BE(BigInt(counter));
	const h = createHmac('sha1', key).update(msg).digest();
	const o = h[h.length - 1] & 0xf;
	const n = (h.readUInt32BE(o) & 0x7fffffff) % 1_000_000;
	return String(n).padStart(6, '0');
}

/** Geeft het tijdvak terug waarin de code geldig is (één vak speling), of null. */
export function checkTotp(secret: string, code: string, notBefore = 0): number | null {
	const clean = code.replace(/\s/g, '');
	if (!/^\d{6}$/.test(clean)) return null;
	const key = base32Decode(secret);
	const now = Math.floor(Date.now() / 30_000);
	for (const step of [now, now - 1, now + 1]) {
		// Een code mag maar één keer gebruikt worden.
		if (step <= notBefore) continue;
		const a = Buffer.from(hotp(key, step));
		if (timingSafeEqual(a, Buffer.from(clean))) return step;
	}
	return null;
}

export function totpUri(name: string, secret: string): string {
	const label = encodeURIComponent(`Stax:${name}`);
	return `otpauth://totp/${label}?secret=${secret}&issuer=Stax&algorithm=SHA1&digits=6&period=30`;
}

export function totpQr(name: string, secret: string): Promise<string> {
	return QRCode.toString(totpUri(name, secret), { type: 'svg', margin: 1 });
}

// --- Gebruikers ---

export function userCount(): number {
	return (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
}

export function listUsers(): User[] {
	return db.prepare('SELECT id, name FROM users ORDER BY id').all() as unknown as User[];
}

export function createUser(name: string, password: string, secret: string): number {
	return Number(db.prepare('INSERT INTO users (name, pass_hash, totp_secret) VALUES (?, ?, ?)').run(name, hashPassword(password), secret).lastInsertRowid);
}

/** Naam wijzigen; geeft een melding terug als die niet kan. */
export function changeName(id: number, name: string): string | null {
	name = name.trim();
	if (!name) return 'Vul een naam in.';
	try {
		db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, id);
		return null;
	} catch {
		return 'Deze naam is al in gebruik.';
	}
}

/**
 * Wachtwoord wijzigen; het huidige wachtwoord moet kloppen. Alle andere sessies en telefoons worden uitgelogd;
 * alleen de sessie (website) of telefoon (app) waarmee je dit doet blijft staan. Geeft een melding terug als het niet lukt.
 */
export function changePassword(id: number, current: string, next: string, repeat: string, keep: { sessionToken?: string; device?: number } = {}): string | null {
	const row = db.prepare('SELECT pass_hash FROM users WHERE id = ?').get(id) as { pass_hash: string } | undefined;
	if (!row || !checkPassword(current, row.pass_hash)) return 'Het huidige wachtwoord klopt niet.';
	const problem = passwordProblem(next, repeat);
	if (problem) return problem;
	db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(hashPassword(next), id);
	db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(id, keep.sessionToken ? sha(keep.sessionToken) : '');
	db.prepare('DELETE FROM devices WHERE user_id = ? AND id != ?').run(id, keep.device ?? 0);
	return null;
}

export function deleteUser(id: number) {
	db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

/** Controleert naam, wachtwoord en code. Alle drie moeten kloppen; de melding zegt niet welke fout was. */
export function verifyLogin(name: string, password: string, code: string): User | null {
	const row = db.prepare('SELECT id, name, pass_hash, totp_secret, totp_last FROM users WHERE name = ?').get(name.trim()) as
		| { id: number; name: string; pass_hash: string; totp_secret: string; totp_last: number }
		| undefined;
	// Ook zonder gebruiker even lang rekenen, zodat je aan de tijd niet ziet of een naam bestaat.
	if (!row) {
		checkPassword(password, `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`);
		return null;
	}
	if (!checkPassword(password, row.pass_hash)) return null;
	const step = checkTotp(row.totp_secret, code, row.totp_last);
	if (step === null) return null;
	db.prepare('UPDATE users SET totp_last = ? WHERE id = ?').run(step, row.id);
	return { id: row.id, name: row.name };
}

// --- Sessies ---

const sha = (token: string) => createHash('sha256').update(token).digest('hex');

export function createSession(userId: number): string {
	const token = randomBytes(32).toString('base64url');
	const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
	db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
	db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha(token), userId, expires);
	return token;
}

export function sessionUser(token: string | undefined): User | null {
	if (!token) return null;
	const row = db
		.prepare('SELECT u.id, u.name, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?')
		.get(sha(token)) as { id: number; name: string; expires_at: string } | undefined;
	if (!row || row.expires_at < new Date().toISOString()) return null;
	return { id: row.id, name: row.name };
}

export function endSession(token: string | undefined) {
	if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token));
}

// --- Apparaten: de iOS-app logt één keer in en krijgt dan een eigen sleutel ---

export interface Device {
	id: number;
	user: string;
	name: string;
	created_at: string;
	last_used_at: string | null;
}

export function createDevice(userId: number, name: string): string {
	const token = randomBytes(32).toString('base64url');
	db.prepare('INSERT INTO devices (user_id, name, token_hash) VALUES (?, ?, ?)').run(userId, name.trim().slice(0, 80) || 'iPhone', sha(token));
	return token;
}

/** Gebruiker bij een apparaatsleutel. Werkt de laatste keer gebruikt hooguit eens per uur bij. */
export function deviceUser(token: string | null | undefined): (User & { device: number }) | null {
	if (!token) return null;
	const row = db
		.prepare('SELECT d.id AS device, d.last_used_at, u.id, u.name FROM devices d JOIN users u ON u.id = d.user_id WHERE d.token_hash = ?')
		.get(sha(token)) as { device: number; last_used_at: string | null; id: number; name: string } | undefined;
	if (!row) return null;
	const now = new Date().toISOString();
	if (!row.last_used_at || Date.parse(row.last_used_at) < Date.now() - 3_600_000) db.prepare('UPDATE devices SET last_used_at = ? WHERE id = ?').run(now, row.device);
	return { id: row.id, name: row.name, device: row.device };
}

export function listDevices(): Device[] {
	return db
		.prepare('SELECT d.id, u.name AS user, d.name, d.created_at, d.last_used_at FROM devices d JOIN users u ON u.id = d.user_id ORDER BY d.created_at DESC')
		.all() as unknown as Device[];
}

export function revokeDevice(id: number) {
	db.prepare('DELETE FROM devices WHERE id = ?').run(id);
}

// --- Te veel mislukte pogingen: per IP-adres maximaal 5 per kwartier ---

const failures = new Map<string, number[]>();
const WINDOW = 15 * 60_000;

export function blocked(ip: string): boolean {
	const recent = (failures.get(ip) ?? []).filter((t) => t > Date.now() - WINDOW);
	failures.set(ip, recent);
	return recent.length >= 5;
}

export function recordFailure(ip: string) {
	failures.set(ip, [...(failures.get(ip) ?? []), Date.now()]);
}

// --- Installatiecode: alleen wie de serverlog kan lezen, kan het eerste account aanmaken ---

const g = globalThis as unknown as { __staxSetupCode?: string };

export function setupCode(): string | null {
	if (userCount() > 0) return null;
	if (!g.__staxSetupCode) {
		g.__staxSetupCode = randomBytes(5).toString('hex').toUpperCase();
		console.log(`\n  Stax heeft nog geen account. Installatiecode: ${g.__staxSetupCode}\n  Ga naar /setup om het eerste account aan te maken.\n`);
	}
	return g.__staxSetupCode;
}

export function clientIp(request: Request, fallback: () => string): string {
	// Achter een proxy of tunnel (zoals Cloudflare) staat het echte adres in deze kop.
	return request.headers.get('cf-connecting-ip') ?? fallback();
}
