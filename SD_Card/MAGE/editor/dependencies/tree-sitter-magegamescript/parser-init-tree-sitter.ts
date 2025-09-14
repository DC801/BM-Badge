import { Parser, Language } from 'web-tree-sitter';

export default async function (): Promise<Parser> {
	// node valid unit testing path
	let wasmPath = './tree-sitter-magegamescript.wasm';
	if (typeof window === 'object') {
		// vite build output path that gets base64 encoded to use on NULL origin
		wasmPath = (await import('./tree-sitter-magegamescript.wasm?url')).default;
	}
	await Parser.init();
	const parser = new Parser();
	let loaded = false;
	while (!loaded) {
		try {
			// Sometimes Language.load results in a language object with a bad/empty version number (0).
			// This is like 5-10% of the time.
			// Keep trying.
			const Lang = await Language.load(wasmPath);
			parser.setLanguage(Lang);
			loaded = true;
		} catch {
			await Promise.resolve();
		}
	}
	return parser;
}
