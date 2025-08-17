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
	parser.setLanguage(Lang);
	return parser;
}
