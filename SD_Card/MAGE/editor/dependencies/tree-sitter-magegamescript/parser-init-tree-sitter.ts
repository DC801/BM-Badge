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
	const Lang = await Language.load(wasmPath);
	try {
		parser.setLanguage(Lang);
	} catch {
		const Lang = await Language.load(wasmPath);
		try {
			parser.setLanguage(Lang);
		} catch {
			throw new Error('failed to set tree-sitter language (try again?)');
		}
	}
	return parser;
}
