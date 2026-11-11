import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, endSession } from '$lib/server/auth';

export const actions = {
	default: async ({ cookies }) => {
		endSession(cookies.get(SESSION_COOKIE));
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, '/login');
	}
};
