const patterns = {
	document: `@root* $EOF`,
	root: `@include_macro
		| @constant_assignment`,
	include_macro: `'include' '!' '(' $quoted_string:fileName? ')'`,
	constant_assignment: `$constant:constantName>constantNames '=' @constant_value:constantValue ';'`,
	constant_value: `$constant<constantNames
		| $boolean
		| $quoted_string | $bareword
		| $number | $duration | $distance | $color | $quantity
		| @enum_alignment`,
	enum_alignment: `'TR' | 'BR' | 'TL' | 'BL'
		| 'TOP_RIGHT' | 'BOTTOM_RIGHT' | 'TOP_LEFT' | 'BOTTOM_LEFT'`,
};

// CONSTRAINTS (for now)
// Each entry is linear apart from `|`, which means that any of the "split" phrases will trigger as a match for that pattern
// Phrases cannot be built up from more complicated logic than this; no `()` indicating subphrase splits, etc.
// Every "word" is a single unit of token logic within its larger pattern
// WORD TYPES
// 'literal' = aka terminal; must literally match the token value (no matter what type the token says it is)
// @lookup = aka nonterminal; a reference to another pattern
// $token_literal = any base-level token; the value of that token is captured and labeled either at that token or at the "caller" token (not sure what to do if there's more than one captured token when that label tries to label things (TODO: maybe just add multiple captures with that label? The captures are an array, not an object, after all))
// WORD MODIFIERS
// :label = any captures in that pattern (or any refernced pattern) will be called this in the output handed up
// <collectionName = the token value can be autocompleted from a "collection", e.g. `entityNames`
// >collectionName = the token value populates a "collection", which is used for autocompletion
// <>collectionName = counts as both '<' and '>' at the same time
// ><collectionName = (same as above)
// WORD repitition
// no repitition mark means there must be one token that matches exactly
// ? = 0-1; proceed even if missing
// + = 1+; must match at least once, but can be multiple
// * = 0+; can be zero matches, or can be an unlimited number of matches

// auditing the above pattern dictionary structure
const keywordsFound = new Set();
const patternLookupsFound = new Set();
const tokenTypesFound = new Set();
const collectionsFound = new Set();
const capturesIdentified = {};
const getWordReport = (word, patternName) => {
	const fragments = word.split(/\b/g);
	const token = {
		original: word,
		rep: '',
		type: '',
		value: '',
	}
	if (
		fragments[fragments.length-1] === '?'
		|| fragments[fragments.length-1] === '*'
		|| fragments[fragments.length-1] === '+'
	) {
		token.rep = fragments.pop();
	}
	if (fragments[0].startsWith("'")) {
		const fancy = fragments[0].match(/'(.+?)'/);
		if (fancy) {
			keywordsFound.add(fancy[1]);
			token.value = fancy[1];
			token.type = 'literal';
			return token;
		}
		if (fragments[fragments.length-1] !== "'") {
			throw new Error("Subpattern lacks matching single quote: " + word);
		} else if (fragments.length !== 3) {
			throw new Error("Subpattern of unusual length: " + word);
		}
		keywordsFound.add(fragments[1]);
		token.value = fragments[1];
		token.type = 'literal';
		return token;
	}
	if (fragments.length % 2 !== 0) {
		throw new Error("Subpattern not built up from pairs: " + word);
	}
	while (fragments.length > 0) {
		const left = fragments.shift();
		const right = fragments.shift();
		if (!/[a-zA-Z_]+/.test(right)) {
			throw new Error("Right half is not a word: " + left + right);
		}
		if (left === '$') {
			token.type = 'capture';
			token.value = right;
			tokenTypesFound.add(right);
		} else if (left === '@') {
			token.type = 'lookup';
			token.value = right;
			patternLookupsFound.add(right);
		} else if (left === ":") {
			token.label = right;
			capturesIdentified[patternName] = capturesIdentified[patternName] || [];
			capturesIdentified[patternName].push(word);
		}
		if (left.includes("<")) {
			collectionsFound.add(right);
			token.autoComplete = right;
		}
		if (left.includes(">")) {
			collectionsFound.add(right);
			token.toCollection = right;
		}
		if (token.type === '') throw new Error("Unknown token sigil: " + left + right);
	}
	return token;
};

const tree = {};
Object.entries(patterns).forEach(([patternName, pattern])=>{
	const allTokenPatterns = [];
	const splits = pattern.trim()
		.replace(/[\s\n\t]+/,' ')
		.split('|')
		.map(str=>str.trim());
	splits.forEach(subpattern=>{
		const words = subpattern.split(' ').map(item=>getWordReport(item,patternName));
		allTokenPatterns.push(words);
	});
	tree[patternName] = allTokenPatterns;
});

const parsedPatterns = { // generated from `patterns`, to be rebuilt each time; here for refernced purposes only
  document: [
    [
      { rep: "*", type: "lookup", value: "root", original: "@root*", },
      { rep: "", type: "capture", value: "EOF", original: "$EOF", },
    ],
  ],
  root: [
    [
      { rep: "", type: "lookup", value: "include_macro", original: "@include_macro", },
    ],
    [
      { rep: "", type: "lookup", value: "constant_assignment", original: "@constant_assignment", },
    ],
  ],
  include_macro: [
    [
      { rep: "", type: "literal", value: "include", original: "'include'", },
      { rep: "", type: "literal", value: "!", original: "'!'", },
      { rep: "", type: "literal", value: "(", original: "'('", },
      { rep: "?", type: "capture", value: "quoted_string", label: "fileName", original: "$quoted_string:fileName?", },
      { rep: "", type: "literal", value: ")", original: "')'", },
    ],
  ],
  constant_assignment: [
    [
      { rep: "", type: "capture", value: "constant", label: "constantName", toCollection: "constantNames", original: "$constant:constantName>constantNames", },
      { rep: "", type: "literal", value: "=", original: "'='", },
      { rep: "", type: "lookup", value: "constant_value", label: "constantValue", original: "@constant_value:constantValue", },
      { rep: "", type: "literal", value: ";", original: "';'", },
    ],
  ],
  constant_value: [
    [
      { rep: "", type: "capture", value: "constant", autoComplete: "constantNames", original: "$constant<constantNames", },
    ],
    [
      { rep: "", type: "capture", value: "boolean", original: "$boolean", },
    ],
    [
      { rep: "", type: "capture", value: "quoted_string", original: "$quoted_string", },
    ],
    [
      { rep: "", type: "capture", value: "bareword", original: "$bareword", },
    ],
    [
      { rep: "", type: "capture", value: "number", original: "$number", },
    ],
    [
      { rep: "", type: "capture", value: "duration", original: "$duration", },
    ],
    [
      { rep: "", type: "capture", value: "distance", original: "$distance", },
    ],
    [
      { rep: "", type: "capture", value: "color", original: "$color", },
    ],
    [
      { rep: "", type: "capture", value: "quantity", original: "$quantity", },
    ],
    [
      { rep: "", type: "lookup", value: "enum_alignment", original: "@enum_alignment", },
    ],
  ],
  enum_alignment: [
    [
      { rep: "", type: "literal", value: "TR", original: "'TR'", },
    ],
    [
      { rep: "", type: "literal", value: "BR", original: "'BR'", },
    ],
    [
      { rep: "", type: "literal", value: "TL", original: "'TL'", },
    ],
    [
      { rep: "", type: "literal", value: "BL", original: "'BL'", },
    ],
    [
      { rep: "", type: "literal", value: "TOP_RIGHT", original: "'TOP_RIGHT'", },
    ],
    [
      { rep: "", type: "literal", value: "BOTTOM_RIGHT", original: "'BOTTOM_RIGHT'", },
    ],
    [
      { rep: "", type: "literal", value: "TOP_LEFT", original: "'TOP_LEFT'", },
    ],
    [
      { rep: "", type: "literal", value: "BOTTOM_LEFT", original: "'BOTTOM_LEFT'", },
    ],
  ],
};
const exampleLex = {
	completed: true,
	warnings: [],
	errors: [],
	tokens: [
		{ type: "bareword", rawValue: "include", value: "include", pos: 0, },
		{ type: "operator", rawValue: "!", value: "!", pos: 7, },
		{ type: "operator", rawValue: "(", value: "(", pos: 8,},
		{ type: "quoted_string", rawValue: "\"header.mgs\"", value: "header.mgs", pos: 9, },
		{ type: "operator", rawValue: ")", value: ")", pos: 21, },
		{ type: "newline", rawValue: "\n\n", value: "\n\n", pos: 22, ignorable: true, },
		{ type: "constant", rawValue: "$trombones", value: "$trombones", pos: 24, },
		{ type: "operator", rawValue: "=", value: "=", pos: 35, },
		{ type: "number", rawValue: "76", value: 76, pos: 37, },
		{ type: "operator", rawValue: ";", value: ";", pos: 39, },
		{ type: "newline", rawValue: "\n", value: "\n", pos: 40, ignorable: true, },
		{ type: "constant", rawValue: "$player", value: "$player", pos: 41, },
		{ type: "operator", rawValue: "=", value: "=", pos: 49, },
		{ type: "quoted_string", rawValue: "\"%PLAYER%\"", value: "%PLAYER%", pos: 51, },
		{ type: "operator", rawValue: ";", value: ";", pos: 61, },
		{ type: "EOF", rawValue: "EOF", value: "EOF", pos: 62, },
	],
};

const exampleTokens = exampleLex.tokens;

console.log('break');
