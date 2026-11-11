import { fail, redirect } from '@sveltejs/kit';
import { saveStart, startData } from '$lib/server/instellingen';

export function load({ url }) {
	return startData(url.searchParams.get('datum'));
}

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const openings: Record<string, string> = {};
		for (const [key, value] of form.entries()) if (key.startsWith('pot_')) openings[key.slice(4)] = String(value);
		const problem = saveStart(String(form.get('startdatum') ?? ''), Number(form.get('inkomstenpot')) || null, openings);
		if (problem) return fail(400, { error: problem });
		redirect(303, '/sparen');
	}
};
