import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: { external: ['node:sqlite'] },
	// Vertex (het ontwerpsysteem) staat in een eigen map naast Stax.
	server: { fs: { allow: ['..'] } }
});
