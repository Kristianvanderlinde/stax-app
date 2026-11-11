// Vervangt @sveltejs/kit voor de API-handlers: dezelfde antwoorden als de server, zonder Response.
export class HttpError extends Error {
	constructor(public status: number, public body: { message: string }) {
		super(body.message);
	}
}
export interface Reply {
	status: number;
	body: string;
}

export function json(data: unknown, init?: { status?: number }): Reply {
	return { status: init?.status ?? 200, body: JSON.stringify(data) };
}

export function error(status: number, message: string | { message: string }): never {
	throw new HttpError(status, typeof message === 'string' ? { message } : message);
}
