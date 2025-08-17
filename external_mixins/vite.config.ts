import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const config = defineConfig({
	plugins: [sveltekit()],
	build: {
		sourcemap: true,
		target: 'esnext',
	},
	worker: {
		format: 'es',
	},
});

export default config;
