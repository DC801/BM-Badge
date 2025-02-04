import { lex } from "./mathlang-lex.mjs"
import { tree } from "./mathlang-language.mjs"
import { getPosContext } from "./mathlang-utilities.mjs"

const verbose = false;
const debugLog = (string) => { if (verbose) console.log(string); };

const ansiRed = '\u001b[1;31m';
const ansiGreen = '\u001b[1;32m';
const ansiYellow = '\u001b[1;33m';
const ansiReset = '\u001b[0m';

/* ------------------------------------------ MUNCH ------------------------------------------ */

// should consume token or no? (currently yes)
const munch = (cs, entry) => {
	const token = cs.token;
	const ret = {
		originalPattern: null,
		success: false,
		capture: null,
		nextEntry: null,
	}
	const literal = entry.literals[token.value];
	if (literal) {
		const twig = literal.twig;
		if (twig.label) {
			ret.capture = {
				label: twig.label,
				value: token.value,
				tokenPos: cs.tokenPos,
				originalPattern: twig.originalPattern,
				debug: token,
			};
		}
		debugLog(`Munched: ${token.value}`);
		ret.success = true;
		ret.nextEntry = literal;
		cs.advance();
	}
	let capture = entry.captures[token.type];
	if (
		!capture &&
		(token.type === 'bareword' || token.type === 'quoted_string')
	) {
		capture = entry.captures.string;
	}
	if (capture) {
		const twig = capture.twig;
		ret.capture = {
			label: twig.label || 'UNLABELED_CAPTURE',
			value: token.value,
			tokenPos: cs.tokenPos,
			originalPattern: twig.originalPattern,
			debug: token,
		};
		debugLog(`Munched: ${token.value}`);
		ret.success = true;
		ret.nextEntry = capture;
		cs.advance();
	}
	ret.originalPattern = ret.nextEntry?.twig.originalPattern;
	return ret;
};

// moves the cs.tokenPos until it lands ON (not past) the terminator,
// or lacking a terminator, the next newline token
// the caller can decide whether to advance to the terminator at that point (?)
const fastForward = (cs, terminatorValue) => {
	debugLog("FAST FORWARD!");
	while (cs.tokenPos < cs.tokens.length) {
		if (
			cs.token.type === 'newline'
			|| cs.token.value === terminatorValue
		) {
			return cs.token;
		} else {
			cs.advance();
		}
	}
};

const parse = (f, cs, patternName, parentEntry) => {
	const ret = {
		originalPattern: patternName,
		success: false,
		startPos: cs.tokenPos,
		captures: [],
		expected: [],
	};
	let entry = tree[patternName];
	while (entry?.expected.size) {
		// TODO: how to deal with skipping past the very newlines we seek
		// for error recovering?
		while (cs.token.type === 'newline') cs.advance();

		// EOF check
		// I don't want it checking EOF after every root node, so handle that case now:
		// (Could I just not do `cs.tokenPos < cs.tokens.length` in the while?)
		if (cs.token.type === 'EOF') {
			if (cs.tokenPos === cs.tokens.length - 1) {
				ret.success = true;
				return ret;
			} else {
				throw new Error("Unexpected end of file");
			}
		}
		
		// Try a literal or capture token match
		const munched = munch(cs, entry);
		if (munched.success) {
			entry = munched.nextEntry;
			if (munched.capture) {
				ret.captures.push(munched.capture)
			}
			if (!entry.expected.size) {
				// if there's no 'next' then we win
				ret.originalPattern = munched.originalPattern;
				ret.success = true;
				return ret;
			} else {
				continue;
			}
		}

		// If not, try a lookup (should only be @lookup*)
		// Importantly, we should know when these should stop with 'until'!
		const lookupNames = Object.keys(entry.lookups);
		if (lookupNames.length) {
			if (lookupNames.length > 1) {
				throw new Error (`Multiple lookups possible here! (${lookupNames.join(", ")}) Badly designed tree??`);
			}
			const lookupName = lookupNames[0];
			const nextEntry = entry.lookups[lookupName];
			// (nested lookups might not have their own until, but the parent should)
			const until = nextEntry || parentEntry;
			// Try the until first, just so we don't get partial garbage matches
			const munched = munch(cs, until);
			// Prefer the twig's pattern name to the overall
			// TODO: try to find a more consistent way to label these
			const recoveredPatternName = munched.originalPattern || ret.originalPattern;
			ret.originalPattern = recoveredPatternName;
			if (munched.success) {
				entry = munched.nextEntry;
				if (munched.capture) ret.captures.push(munched.capture)
				if (!entry.expected.size) {
					// if there's no 'next' then we win
					ret.originalPattern = munched.originalPattern;
					ret.success = true;
					return ret;
				} else {
					continue;
				}
			}
			// was hoping the stack would help name things but nope
			// (might still help debug)
			cs.stack.unshift(lookupName);
			const parsed = parse(f, cs, lookupName, nextEntry);
			cs.stack.shift();
			const insert = {
				label: parsed.originalPattern,
				startPos: parsed.startPos,
				value: parsed.captures,
				tokenPos: cs.tokenPos,
			}
			// This will contaminate everything to the root of the document tree,
			// But that's probably exactly what's called for
			if (parsed.malformed) {
				ret.malformed = true;
				insert.malformed = true;
			}
			ret.captures.push(insert);
			continue;
		}
		// Dictionary twig name work around!
		// The syntax error should be labeled with the malformed twig's pattern name
		const retPatternName = entry.twig.type === 'dictionary'
			? entry.twig.value
			: entry.twig.originalPattern
		ret.originalPattern = retPatternName;
		f.errors.push({
			message: `${ret.originalPattern} syntax error`,
			expected: ret.expected,
			startPos: ret.startPos,
			tokenPos: cs.tokenPos,
		})
		ret.expected = entry.expected;
		ret.malformed = true;
		ret.success = true;
		console.error(getPosContext(f.inputString, cs.token.pos, `${ret.originalPattern} syntax error`));
		console.error(`Expected: ${[...ret.expected].join(', ')}`)
		// Error recovery goes here (?)
		// (Yes, because otherwise literal/capture tokens don't get error recovery, right?)
		if (entry.twig.errorRecoveryValue) {
			// Rewind so fastForward can find a 'newline' right at the site of problem
			if (cs.tokens[cs.tokenPos-1]?.type === 'newline') {
				cs.backtrack();
			}
			fastForward(cs, entry.twig.errorRecoveryValue);
		} else {
			// skip over the offending token and retry
			// I think this should work because we're trying the 'until's first each time
			// (e.g. one bad match in the middle of a few @lookup*s; don't want to break the rest)
			cs.advance();
		}
		return ret;
	}
	return ret;
};

const makeCrawlState = (tokens) => {
	const ret = {
		tokens,
		tokenPos: 0,
		token: tokens[0],
		stack: ['document'],
		peek: (n=1) => tokens[ret.tokenPos+n],
		advance: () => {
			ret.tokenPos += 1;
			ret.token = tokens[ret.tokenPos];
			debugLog(`Advancing token to [${ret.tokenPos}]: ${ret.token?.value || 'OUT OF BOUNDS'}`);
			return tokens[ret.tokenPos];
		},
		backtrack: () => {
			ret.tokenPos -= 1;
			ret.token = tokens[ret.tokenPos];
			const printValue = ret.token.type === 'newline'
				? '<newline(s)>'
				: ret.token.value;
			debugLog(`Rewinding token to [${ret.tokenPos}]: ${printValue}`);
			return tokens[ret.tokenPos];
		},
	}
	return ret;
};

/* ------------------------------------------ PARSE FILE ------------------------------------------ */

const parseFile = (inputString, givenFileName) => {
	const fileName = givenFileName ? givenFileName : 'anon' + Math.floor(Math.random()*10000000000);
	const lexResult = lex(inputString, fileName);
	lexResult.tokens.forEach(token=>token.fileName = fileName);
	const cs = makeCrawlState(lexResult.tokens);
	const f = {
		inputString,
		errors: [],
		warnings: [],
	};
	const result = parse(f, cs, 'document');

	// // Print errors in the order they land in the file
	// file.errors.sort((a,b)=>a.errorPos - b.errorPos);
	// file.errors.map(error=>{
	// 	const origToken = file.tokens[error.errorPos]
	// 	const charPos = origToken ? origToken.pos : file.tokens.length-1;
	// 	let printable = getPosContext(
	// 		file.plaintext,
	// 		charPos,
	// 		error.message,
	// 		file.fileName,
	// 	);
	// 	if (error.expected?.length > 0) {
	// 		printable += `\nExpected: ${error.expected}`;
	// 	}
	// 	error.printable = printable;
	// });

	// done!
	return result;
}

/* ------------------ tests ------------------ */

const testFile = parseFile(`
	include "header.mgs"
	add dialog settings {
		label PLAYER { alignment BR entity "%PLAYER%" }
		default { wrap 22 add alignment BL }
	}
	dialog greetings {
		PLAYER "Hi"
	}

`, 'bobPartyRoom');

console.log(testFile);
