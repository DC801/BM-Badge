import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
	plugins: [],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	build: {
		minify: false,
		sourcemap: true,
		// the wasm binary should be inlined to allow the build output to be used on a NULL origin
		// setting this limit high enough should allow this.
		assetsInlineLimit: 1024000,
		lib: {
			entry: resolve(__dirname, 'parser.ts'),
			name: 'MGSParser',
			// the proper extensions will be added
			fileName: (type) => `mgs-lib.${type}.js`,
			formats: ['umd'],
		},
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			// external: ['vue'],
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					parser: 'Parser',
					// vue: 'Vue',
				},
			},
		},
	},
});
