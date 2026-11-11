import { json } from '@sveltejs/kit';
import { blocked, clientIp, createDevice, recordFailure, verifyLogin } from '$lib/server/auth';

/** Inloggen vanuit de app met naam, wachtwoord en TOTP-code. Geeft een sleutel voor dit apparaat terug. */
export async function POST({ request, getClientAddress }) {
	const ip = clientIp(request, getClientAddress);
	if (blocked(ip)) return json({ error: 'Te veel pogingen. Probeer het over een kwartier opnieuw.' }, { status: 429 });
	const body = (await request.json().catch(() => ({}))) as { name?: string; password?: string; code?: string; device?: string };
	const user = verifyLogin(String(body.name ?? ''), String(body.password ?? ''), String(body.code ?? ''));
	if (!user) {
		recordFailure(ip);
		return json({ error: 'Naam, wachtwoord of code klopt niet.' }, { status: 401 });
	}
	return json({ token: createDevice(user.id, String(body.device ?? 'iPhone')), user: user.name });
}
