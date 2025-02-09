import { lex } from "./mathlang-lex.mjs"
import { tree } from "./mathlang-language.mjs"
import { getPosContext, decayTo, makeAutoIdentifierName, collectBetween, findLineAndCharNumbers } from "./mathlang-utilities.mjs"

const verbose = false;
const printErrors = false;

const printError = (string) => { if (printErrors || verbose) console.error(string); };
const debugLog = (string) => { if (verbose) console.log(string); };

const ansiRed = '\u001b[1;31m';
const ansiGreen = '\u001b[1;32m';
const ansiYellow = '\u001b[1;33m';
const ansiReset = '\u001b[0m';
const fakeLiterals = {
	string: "FORGED STRING FOR ERROR RECOVERY",
	bareword: "FORGED BAREWORD FOR ERROR RECOVERY",
	quoted_string: "FORGED QUOTED_STRING FOR ERROR RECOVERY",
	number: 65535,
	duration: 65535,
	distance: 65535,
	quantity: 65535,
	color: '#123456',
	boolean: false,
	operator: '=='
}

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
		twigPattern: null,
		success: false,
		captures: [],
		nextEntry: null,
		bucketType: null,
	}
	let bucketName;
	let newBucket;

	// Try literals first
	// match the value no matter what type the token thinks it is
	newBucket = entry.literals[token.value];
	if (newBucket) {
		ret.bucketType = 'literals';
		bucketName = token.value;
	} else {
		// try captures if that didn't work
		bucketName = matchTokenToCaptureBucket(token, entry) || null;
		if (bucketName) {
			newBucket = entry.captures[bucketName];
			ret.bucketType = 'captures';
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
		const repeatOK = twig.rep === '*' || twig.rep === '+';
		if (!peek) cs.advance();
		if (repeatOK && !peek) {
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
		ret.twigPattern = patternNameFromEntry(newBucket).useful || entry.dictionaryLookupName;
	} else {
		ret.twigPattern = patternNameFromEntry(entry).useful || entry.dictionaryLookupName;
	}
	return ret;
};

// moves the cs.tokenPos until it lands ON (not past) the terminator,
// or lacking a terminator, the next newline token
// the caller can decide whether to advance to the terminator at that point (?)
const fastForward = (cs, skipEntry) => {
	debugLog("FAST FORWARD!");
	while (cs.tokenPos < cs.tokens.length) {
		if (cs.token.type === 'newline' || cs.token.type === 'EOF') {
			cs.advance();
			return 'agnostic';
		}
		if (skipEntry?.expected.size) {
			debugLog(`   Peeking the 'skip' for the current guy, ${cs.stack[0].pattern}: ${[...skipEntry.expected].join(', ')}`)
			const peeked = munch(cs, skipEntry, true);
			if (peeked.success) {
				debugLog(`       YUP! Got it! SKIPPING THIS TOKEN`)
				cs.advance();
				return 'self';
			}
		}
		const parentSkipEntry = cs.stack[1]?.skipValue;
		if (parentSkipEntry?.expected.size) {
			debugLog(`   Peeking the 'skip' for the parent, ${cs.stack[1].pattern}: ${[...parentSkipEntry.expected].join(', ')}`)
			const parentPeeked = munch(cs, parentSkipEntry, true);
			if (parentPeeked.success) {
				debugLog(`       YUP! Got it!`)
				return 'parent';
			}
		}
		cs.advance();
	}
};

const onMatch = {
	json_literal: (f, cs, patternName, ret) => {
		const startPos = cs.tokenPos;
		const collection = collectBetween(cs, '[', ']');
		const clean = collection.map(token=>{
			if (token.type === 'boolean') {
				if (token.value === 'true') return true;
				if (token.value === 'false') return false;
			}
			if (token.type === 'quoted_string') return token.rawValue;
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
			const jsonLineCol = findLineAndCharNumbers(f.inputString, cs.tokens[cs.tokenPos].pos);
			let message = posCapture
				? 'JSON syntax error'
				: `Syntax error in JSON literal (file line ${jsonLineCol.col})`
			// Errors discovered: 
			// Expected double-quoted property name in JSON at position 24
			// Expected ',' or '}' after property value in JSON at position 23
			// Unexpected token '}', ...\"ON\",\"asdf\"}]\" is not valid JSON
			// How nuanced can we make this? (The old mathlang actually parsed it for JSON structure!)
			printError(getPosContext(json, Number(posCapture), message, f.fileName + ': JSON literal segment'));
			const splits = err.message.split('in JSON');
			if (splits[1]) {
				printError(splits[0]);
			}
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

const patternNameFromEntry = (entry) => {
	const isOne = entry.patternName.size <= 1;
	const first = Object.values([...entry.patternName])[0] || entry.dictionaryLookupName;
	const dictName = entry.dictionaryLookupName;
	const allAlternatives = Object.values([...entry.patternName]).join('/');
	return {
		useful: isOne ? first : dictName,
		unambiguous: isOne ? first : `${dictName}: (${allAlternatives})`,
	}
};
let continuingSyntaxError = false;
const parse = (f, cs, patternName, givenEntry) => {
	const ret = {
		originalPattern: patternName,
		success: false,
		startPos: cs.tokenPos,
		captures: [],
		expected: [],
	};
	const patternComplete = (ret, entry) => {
		// const patternName = entry.patternName; // as was originally done
		const patternName = patternNameFromEntry(entry).useful;
		ret.originalPattern = patternName;
		ret.success = true;
		const fn = onMatch[patternName];
		if (fn) fn(f, cs, patternName, ret);
		debugLog(`Just matched the pattern '${patternName}'!`);
	}
	let entry = givenEntry || tree[patternName];
	outer: while (entry?.expected.size && cs.token) {
		// TODO: how to deal with skipping past the very newlines we seek
		// for error recovering?
		while (cs.token?.ignorable) {
			cs.advance();
			if (!cs.token) break outer;
		}
		// Try a literal or capture token match
		const munched = munch(cs, entry);
		if (munched.success) {
			continuingSyntaxError = false;
			entry = munched.nextEntry;
			ret.originalPattern = munched.twigPattern;
			munched.captures.forEach(capture=>{
				ret.captures.push(capture)
			});
			if (entry.expected.size) {
				continue;
			} else {
				// if there's no 'next' then we win
				patternComplete(ret, entry);
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
			const until = findNonOptionalEntryAfterNextOptionalLookup(entry)
			// Try the until first, just so we don't get partial garbage matches
			if (until) {
				const peeked = munch(cs, until, true);
				if (peeked.success) {
					continuingSyntaxError = false;
					// disregard capture and ~~step the token back~~ use 'peek' mode so we don't step forward at all
					// (we'll get the captures again on the other side) (?)
					entry = until;
					// if (!usedParentEntry) cs.advance();
					if (entry.expected.size) {
						continue;
					} else {
						// if there's no 'next' then we win
						// ... but in this case we should actually munch the token
						cs.advance();
						patternComplete(ret, entry);
						return ret;
					}
				}
			}
			const lookupName = lookupNames[0];
			const lookupEntry = entry.lookups[lookupName];
			cs.stack.unshift({
				pattern: lookupName,
				twig: lookupEntry.twig,
				skipValue: until,
			});
			const parsed = parse(f, cs, lookupName);
			cs.stack.shift();
			// if (!continuingSyntaxError || parsed.captures.length) {
				const insert = {
					label: parsed.originalPattern,
					startPos: parsed.startPos,
					value: parsed.captures,
					tokenPos: cs.tokenPos,
				}
				if (parsed.malformed) {
					ret.malformed = true;
					insert.malformed = true;
				}
				ret.captures.push(insert);
			// }
			continue;
		}
		const patternLabel = patternNameFromEntry(entry).unambiguous;
		const errorMessage = entry.patternName.size === 1
			? patternLabel + ' syntax error'
			: 'Syntax error in ' + patternLabel;
		ret.originalPattern = patternLabel;
		ret.expected = structuredClone(entry.expected);
		// TODO NOW:
		// hop over the current entry (you already know what's expected, so get that expected's expected in case of '*') (?)
		// (This way didn't work fyi:)
		// if (parentEntry.twig.rep === '*') {
		// 	parentEntry.expected.forEach(k=>ret.expected.add(k))
		// }
		ret.malformed = true;
		ret.success = true;
		if (!continuingSyntaxError) {
			f.errors.push({
				message: errorMessage,
				expected: ret.expected,
				startPos: ret.startPos,
				tokenPos: cs.tokenPos,
			})
			printError(getPosContext(f.inputString, cs.token.pos, errorMessage));
			printError(`Expected: ${[...ret.expected].join(', ')}`);
			continuingSyntaxError = true;
		} else {
			f.errors[f.errors.length-1].tokenPos = cs.tokenPos;
		}
		// Error recovery goes here (?)
		// (Yes, because otherwise literal/capture tokens don't get error recovery, right?)
		const errorRecoveryEntry = cs.stack?.[0].skipValue;
		if (cs.stack?.[0].skipValue) {
			// Rewind so fastForward can find a 'newline' right at the site of problem
			// if (cs.tokens[cs.tokenPos-1]?.type === 'newline') {
				cs.move(-1);
			// }
			const ffType = fastForward(cs, errorRecoveryEntry);
			if (ffType === 'parent') {
				cs.move(-1);
				// FORGERY
				const literals = Object.keys(cs.stack[0].skipValue.literals);
				const captures = Object.keys(cs.stack[0].skipValue.captures);
				const optionCount = literals.length + captures.length;
				if (optionCount !== 1) {
					throw new Error ("Not sure what to do with this!");
				}
				const fakeToken = structuredClone(cs.token);
				if (literals.length) {
					fakeToken.type = 'bareword'; // probably fine
					fakeToken.value = literals[0];
				} else if (captures.length) {
					fakeToken.type = captures[0];
					fakeToken.value = fakeLiterals[captures[0]];
				}
				debugLog("FAKING A TOKEN! LOLOLOLOL")
				cs.token = fakeToken;
				// cs.advance();
			} else if (ffType === 'self') {
				cs.move(-1);
			} else {
				cs.advance();
			}
		} else {
			// skip over the offending token and retry
			// I think this should work because we're trying the 'until's first each time
			// (e.g. one bad match in the middle of a few @lookup*s; don't want to break the rest)
			cs.advance();
		}
		return ret;
	}
	ret.success = true;
	return ret;
};

const findNonOptionalEntryAfterNextOptionalLookup = (entry) => {
	// So you expect `@root*` next, eh, document? How do we find $EOF now?
	const lookupNames = Object.keys(entry.lookups);
	if (entry.expected.size !== 1 || lookupNames.length !== 1) {
		// if there isn't exactly one lookup and nothing else
		return null; // it's a nope, dawg
	}
	const lookupBucket = entry.lookups[lookupNames[0]];
	const allNextValues = Object.values(lookupBucket.literals)
		.concat(Object.values(lookupBucket.lookups))
		.concat(Object.values(lookupBucket.captures));
	if (!allNextValues) {
		return null;
	}
	const optionalNexts = allNextValues.filter(v=>{v.twig.rep === '*' || v.twig.rep === '?'});
	if (optionalNexts.length) {
		return findNonOptionalEntryAfterNextOptionalLookup(lookupBucket);
	}
	return lookupBucket;
};

// const test = findNonOptionalEntryAfterNextOptionalLookup(tree.document);
// console.log(test);

/* ------------------------------------------ PARSE FILE ------------------------------------------ */

const makeCrawlState = (tokens) => {
	const ret = {
		tokens,
		tokenPos: 0,
		token: tokens[0],
		stack: [],
		// stack: [{
		// 	pattern: 'document',
		// 	skipValue: findNonOptionalEntryAfterNextOptionalLookup(tree.document),
		// }],
		peek: (n=1) => tokens[ret.tokenPos+n],
		advance: () => {
			ret.tokenPos += 1;
			ret.token = tokens[ret.tokenPos];
			const printValue = !ret.token
				? '<OUT OF BOUNDS>'
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
		fileName,
		inputString,
		errors: [],
		warnings: [],
	};
	const result = parse(f, cs, 'document');
	const nodes = result.captures
		.filter(v=>v.label !== 'EOF')
		.map(v=>clean(v, f));
	const ret = {
		tokens: lexResult.tokens,
		inputString: f.inputString,
		errors: f.errors,
		warnings: f.warnings,
		success: result.success,
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
		value: `fileName`,
	},
	constant_assignment: {
		label: `constantName`,
		value: `constant_value`,
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
	dialog_definition: {
		label: `dialogName`,
		dialogs: 'dialog[@]',
	},
	dialog_literal: {
		label: `dialogName`,
		dialogs: 'dialog[@]',
	},
	serial_dialog_literal: {
		label: `serialDialogName`,
		serial_dialog: 'serial_dialog[@]',
	},
	dialog: {
		identifierType: `identifierType`,
		identifierValue: `identifierValue`,
		parameters: `dialog_parameter[{}]`,
		messages: `dialogMessage['']`,
		options: `dialog_option[{}]`,
	},
	serial_dialog: {
		parameters: `serial_dialog_parameter[{}]`,
		messages: `serialDialogMessage['']`,
		options: `serial_dialog_option[{}]`,
	},
};

const cleanGeneric = (raw, f) => {
	const values = raw.value.slice();
	const node = {
		node: raw.label,
		startPos: raw.startPos,
		tokenPos: raw.tokenPos,
		debug: raw,
	};
	if (raw.malformed) node.malformed = true;
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
			if (filtered.length === 0) {
				node[propName] = null;
				node.malformed = true;
				// node.malformed = true; // TODO: do I need to literally add this here?
			} else if (filtered.length > 1) {
				throw new Error(`Found more than 1 item in ${node.node} called '${filterBy}!'`);
			} else {
				if (filtered[0]?.malformed) node.malformed = true;
				node[propName] = Array.isArray(filtered)
					? filtered[0]?.value
					: filtered.value;
			}
			return;
		}
		if (suffixInner === '@') {
			node[propName] = filtered.map(v=>clean(v, f));
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
	root: (raw) => {
		return {
			node: raw.label,
			startPos: raw.startPos,
			tokenPos: raw.tokenPos,
			debug: raw,
		};
	},
	dialog_literal: (rawDialogBlock, f) => {
		const node = cleanGeneric(rawDialogBlock, f);
		if (!node.label) {
			node.label = makeAutoIdentifierName(
				f.inputString,
				f.tokens[rawDialogBlock.startPos].pos,
				f.fileName
			);
		}
		return node;
	},
	serial_dialog_literal: (raw, f) => {
		const node = cleanGeneric(raw, f);
		if (!node.label) {
			node.label = makeAutoIdentifierName(
				f.inputString,
				f.tokens[raw.startPos].pos,
				f.fileName
			);
		}
		const oldNode = structuredClone(node);
		const mergedNode = Object.assign(oldNode, node.serial_dialog[0]);
		mergedNode.node = node.node;
		if (mergedNode.options.length) {
			const firstType = mergedNode.options[0].optionType;
			if (mergedNode.options.some(v=>v.optionType !== firstType)) {
				f.warnings.push({
					message: `Serial dialog option types are mixed; the first type will be used.`,
					startPos: mergedNode.startPos,
					tokenPos: mergedNode.tokenPos,
				});
			}
		}
		return mergedNode;
	},
}

const clean = (raw, f) => {
	const name = raw.label;
	const cleanCustom = cleanCustomMap[name];
	return cleanCustom ? cleanCustom(raw, f) : cleanGeneric(raw, f);
};

/* ------------------ tests ------------------ */

// const testFile = parseFile(`// asdf\n`
// // +` json![
// // 	{
// // 		"action":"NEW_ACTION",
// // 		"asdf": 90
// // 	}
// // ]`

// +	`dialog greetings {`
// + `Bob "Hello?" ;`
// + `PLAYER "Oh?" "I heard something!";`
// + `};`

// , 'bobPartyRoom.mgs');

// console.log(testFile);
