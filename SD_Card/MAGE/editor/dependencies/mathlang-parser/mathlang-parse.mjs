import { lex } from "./mathlang-lex.mjs"
import { tree } from "./mathlang-language.mjs"
import { getPosContext, decayTo, makeAutoIdentifierName, collectBetween } from "./mathlang-utilities.mjs"

const verbose = true;
const debugLog = (string) => { if (verbose) console.log(string); };

const ansiRed = '\u001b[1;31m';
const ansiGreen = '\u001b[1;32m';
const ansiYellow = '\u001b[1;33m';
const ansiReset = '\u001b[0m';

/* ------------------------------------------ MUNCH ------------------------------------------ */

const matchTokenToCaptureBucket = (token, entry) => {
	if (entry.captures[token.type]) return token.type;
	const numberish = token.type === 'duration'
		|| token.type === 'distance'
		|| token.type === 'quantity';
	if (entry.captures.number && numberish) return 'number';
	const isBareword = token.type === 'bareword' || token.barewordValue
	if (isBareword && token.barewordValue) return 'bareword';
	const stringish = isBareword || token.type === 'quoted_string';
	if (entry.captures.string && stringish) return 'string';
}

const createCapture = (cs, twig) => {
	const token = cs.token;
	let label;
	if (twig.type === 'literal' && twig.label) label = twig.label;
	if (twig.type === 'capture') {
		label = twig.label || twig.originalPattern || 'UNLABELED_CAPTURE';
	}
	if (label) {
		return {
			label,
			value: token.value,
			tokenPos: cs.tokenPos,
			originalPattern: twig.originalPattern,
			debug: token,
		}
	} else {
		return null;
	}
};
// should consume token or no? (currently yes)
const munch = (cs, entry, peek) => {
	const peekMessage = peek ? 'PEEKING' : 'trying'
	debugLog(`[${cs.tokenPos}] '${cs.token.value}' --${peekMessage}--> ${[...entry.expected].join(', ')}`)
	const token = cs.token;
	const ret = {
		originalPattern: null,
		success: false,
		captures: [],
		nextEntry: null,
	}
	let bucketType;
	let bucketName;
	let newBucket;

	// Try literals first
	// match the value no matter what type the token thinks it is
	newBucket = entry.literals[token.value];
	if (newBucket) {
		bucketType = 'literals';
		bucketName = token.value;
	} else {
		// try captures if that didn't work
		bucketName = matchTokenToCaptureBucket(token, entry) || null;
		if (bucketName) {
			newBucket = entry.captures[bucketName];
			bucketType = 'captures';
		}
	}
	// if we found anything:
	if (newBucket) {
		const twig = newBucket.twig;
		const capture = createCapture(cs, twig);
		if (capture) ret.captures.push(capture);
		ret.success = true;
		ret.nextEntry = newBucket;
		const peekedMessage = peek ? 'PEEKED' : 'Munched'
		debugLog(`${peekedMessage}: '${token.value}'`);
		if (!peek) cs.advance();
		if (twig.rep === '*' && !peek) {
			let repeating = true;
			while (repeating) {
				const token = cs.token;
				if (token.ignorable) {
					cs.advance();
					continue;
				}
				const repeatMatched = twig.type === 'literal'
					? twig.value === token.value
					: decayTo[bucketName](token) !== null;
				if (repeatMatched) {
					const capture = createCapture(cs, twig);
					if (capture) ret.captures.push(capture);
					debugLog(`REPEAT: '${token.value}'`);
					cs.advance();
				} else {
					repeating = false;
				}
			}
		}
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

const onMatch = {
	json_literal: (f, cs, patternName, ret) => {
		const startPos = cs.tokenPos;
		const collection = collectBetween(cs, ']');
		const clean = collection.map(token=>{
			if (token.type === 'boolean') {
				if (token.value === 'true') return true;
				if (token.value === 'false') return false;
			}
			if (
				token.type === 'bareword'
				|| token.type === 'quoted_string'
				|| token.barewordValue
			) {
				return `"${token.value}"`;
			}
			return token.value;
		})
		const json = '['+clean.join('');
		let parsed = [];
		try {
			parsed = JSON.parse(json);
		} catch (err) {
			// todo: line up the error squigglies with this?
			const posCaptureRaw = err.message.match(/at position ([\d]+)/);
			const posCapture = posCaptureRaw?.[1] || 0;
			// const errorStringPos = cs.tokens[startPos].pos + (posCapture || 0);
			console.error(getPosContext(json, Number(posCapture), 'JSON syntax error', f.fileName + ': JSON literal segment'));
			const message = posCapture
				? err.message.split('after property')[0]
				: 'Unexpected token somewhere in this JSON literal segment';
			console.error(message);
			f.errors.push({
				message: message,
				expected: ret.expected,
				startPos,
				tokenPos: cs.tokenPos,
			})
			ret.malformed = true;
		}
		ret.captures.push({
			label: 'json_literal',
			value: parsed,
			startPos,
			tokenPos: cs.tokenPos,
		})
		console.log(collection);
	},
}
const parse = (f, cs, patternName, parentEntry) => {
	const ret = {
		originalPattern: patternName,
		success: false,
		startPos: cs.tokenPos,
		captures: [],
		expected: [],
	};
	const patternComplete = (patternName) => {
		ret.success = true;
		const fn = onMatch[patternName];
		if (fn) fn(f, cs, patternName, ret);
		debugLog(`Just matched the pattern '${patternName}'!`);
	}
	let entry = tree[patternName];
	while (entry?.expected.size) {
		// TODO: how to deal with skipping past the very newlines we seek
		// for error recovering?
		while (cs.token.ignorable) cs.advance();

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
			cs.mostRecentReportedPattern = entry.originalPattern;
			entry = munched.nextEntry;
			munched.captures.forEach(capture=>{
				ret.captures.push(capture)
			});
			if (entry.expected.size) {
				continue;
			} else {
				// if there's no 'next' then we win
				ret.originalPattern = munched.originalPattern;
				patternComplete(munched.originalPattern);
				return ret;
			}
		}

		// If not, try a lookup (should only be @lookup*s now)
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
			const peeked = munch(cs, until, true);
			ret.originalPattern = peeked.originalPattern || ret.originalPattern;
			if (peeked.success) {
				// disregard capture and step the token back
				// (we'll get them again on the other side)
				// do advance the twig
				entry = peeked.nextEntry;
				if (entry.expected.size) {
					continue;
				} else {
					// if there's no 'next' then we win
					// ... but in this case we should actually munch the token
					cs.advance();
					patternComplete(peeked.originalPattern);
					return ret;
				}
			}
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
				cs.move(-1);
			}
			fastForward(cs, entry.twig.errorRecoveryValue);
			cs.advance();
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

/* ------------------------------------------ PARSE FILE ------------------------------------------ */

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
			const printValue = !ret.token
				? 'OUT OF BOUNDS'
				: ret.token.type === 'newline'
					? '<newline(s)>'
					: ret.token.value;
			debugLog(`=> [${ret.tokenPos}]: ${printValue}`);
			return tokens[ret.tokenPos];
		},
		move: (n) => {
			ret.tokenPos += n;
			ret.token = tokens[ret.tokenPos];
			const header = n > 0 ? '=>' : '<='
			const printValue = ret.token.type === 'newline'
				? '<newline(s)>'
				: ret.token.value;
			debugLog(`${header} [${ret.tokenPos}]: ${printValue}`);
			return tokens[ret.tokenPos];
		},
	}
	return ret;
};
export const parseFile = (inputString, givenFileName) => {
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
	const nodes = result.captures.map(clean);
	const ret = {
		tokens: lexResult.tokens,
		inputString: f.inputString,
		errors: f.errors,
		warnings: f.warnings,
		success: f.success,
		nodes,
	}

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
	return ret;
}

const cleanStructure = {
	json_literal: {
		actions: `json_literal`,
	},
	include_macro: {
		fileName: `fileName`,
	},
	constant_assignment: {
		label: `constantName`,
		value: `constantValue`,
	},
	add_serial_dialog_settings: {
		settings: 'serial_dialog_parameter[{}]'
	},
	add_dialog_settings: {
		targets: 'dialog_settings_target[@]'
	},
	dialog_settings_target: {
		targetType: 'target',
		targetValue: 'tarvetValue',
		settings: 'dialog_parameter[{}]'
	},
	dialog_literal: {
		dialogName: `dialogName`,
		dialogs: 'dialog[@]',
	},
	dialog: {
		identifierType: `identifierType`,
		identifierValue: `identifierValue`,
		parameters: `dialog_parameter[{}]`,
		messages: `dialogMessage['']`,
		options: `dialog_option[{}]`,
	},
};

const cleanGeneric = (raw) => {
	const values = raw.value.slice();
	const node = {
		node: raw.label,
		startPos: raw.startPos,
		tokenPos: raw.tokenPos,
		debug: raw,
	};
	if (raw.malformed) node.malformed;
	const structure = cleanStructure[node.node];
	if (!structure) throw new Error(`No node cleaning structure found for ${node.node}`);
	Object.keys(structure).forEach(propName=>{
		const value = structure[propName];
		const splits = value.match(/([_a-zA-Z]+)(\[(.*?)\])?/);
		const filterBy = splits[1];
		const suffix = splits[2];
		const suffixInner = splits[3];
		const filtered = values.filter(v=>v.label === filterBy);
		if (!suffix) {
			if (filtered.length > 1) throw new Error(`Found more than 1 item in ${node.node} called '${filterBy}!'`)
			node[propName] = Array.isArray(filtered)
				? filtered[0]?.value
				: filtered.value;
			return;
		}
		if (suffixInner === '@') {
			node[propName] = filtered.map(clean);
		} else if (suffixInner === `''`) {
			node[propName] = filtered.map(v=>v.value);
		} else if (suffixInner === `{}`) {
			node[propName] = filtered.map(v=>{
				let insert = {};
				v.value.forEach(capture=>{
					insert[capture.label] = capture.value;
				});
				return insert;
			});
		}
	});
	return node;
};

const cleanCustomMap = {
	root: (capture) => {
		throw new Error("This shouldn't happen! (root node w/o identification)")
		console.log('todo')
	},
	dialog_literal: (rawDialogBlock, f) => {
		const node = clean(rawDialogBlock);
		if (!node.dialogName) {
			node.dialogName = makeAutoIdentifierName(
				f.inputString,
				f.tokens[rawDialogBlock.startPos].pos,
				f.fileName
			);
		}
		return node;
	},
}

const clean = (raw) => {
	const name = raw.label;
	const cleanCustom = cleanCustomMap[name];
	return cleanCustom ? cleanCustom(raw) : cleanGeneric(raw);
};

/* ------------------ tests ------------------ */

const testFile = parseFile(`// asdf\n`
	+` json![{action:NEW_ACTION, asdf:asdf s}] `

	// +` $steamedHams = ;\n`
	// +` $trombones = 76;`
// +` add serial_dialog settings {
// 	wrap 80  wrap 99
// }`
// +` add dialog settings {
// 	label PLAYER {
// 		alignment BL
// 		entity "%PLAYER%"
// 	}
// 	default {
// 		alignment BR
// 	}
// }`
// +	` 
// dialog greetings {
// 	entity Bob alignment BR emote 44 "Hi"
// 		"What do you think you're doing now??"
// 	;
// 	PLAYER alignment TL "I guess I'll need to choose one?"
// 	> "I'll take the left door." = leftScript
// 	> "I'll take the right door." = rightScript
// 	;
// }

// // asdf
// `

, 'bobPartyRoom');

console.log(testFile);
