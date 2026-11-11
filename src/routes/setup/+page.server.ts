import { fail, redirect, type ActionFailure } from '@sveltejs/kit';
import { blocked, checkTotp, clientIp, createUser, newTotpSecret, passwordProblem, recordFailure, setupCode, totpQr } from '$lib/server/auth';

// Eerste account aanmaken. Kan alleen zolang er nog geen account is, en alleen met de installatiecode uit de serverlog.
export async function load() {
	if (!setupCode()) redirect(303, '/login');
	const secret = newTotpSecret();
	return { secret, qr: await totpQr('eerste account', secret) };
}

export const actions = {
	default: async ({ request, getClientAddress }) => {
		const code = setupCode();
		if (!code) redirect(303, '/login');
		const ip = clientIp(request, getClientAddress);
		if (blocked(ip)) return fail(429, { error: 'Te veel pogingen. Probeer het over een kwartier opnieuw.', name: '', secret: '', qr: '' });
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const secret = String(form.get('secret') ?? '');
		// Bij een fout hetzelfde geheim terugsturen, zodat de al gescande code in je authenticator blijft kloppen.
		const again = async (status: number, error: string): Promise<ActionFailure<{ error: string; name: string; secret: string; qr: string }>> =>
			fail(status, { error, name, secret, qr: await totpQr(name || 'eerste account', secret) });
		if (String(form.get('setup') ?? '').trim().toUpperCase() !== code) {
			recordFailure(ip);
			return again(400, 'De installatiecode klopt niet.');
		}
		if (!name) return again(400, 'Vul een naam in.');
		const problem = passwordProblem(String(form.get('password') ?? ''), String(form.get('repeat') ?? ''));
		if (problem) return again(400, problem);
		if (!/^[A-Z2-7]{32}$/.test(secret) || checkTotp(secret, String(form.get('code') ?? '')) === null)
			return again(400, 'De code uit je authenticator klopt niet. Controleer of je de QR-code hebt gescand.');
		createUser(name, String(form.get('password')), secret);
		redirect(303, '/login');
	}
};
