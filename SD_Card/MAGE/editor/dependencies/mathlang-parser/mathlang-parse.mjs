import lex from "./mathlang-lex.mjs"
import language from "./mathlang-language.mjs"

const { tree, onStart, onEnd, terminators, keywords } = language;

const findLineAndCharNumbers = (input, pos) => {
	const splits = input.substring(0,pos).split('\n')
	const charCount = splits[splits.length - 1].length;
	const wholeString = input.split('\n')
	const lineNumber = splits.length;
	return {
		row: lineNumber,
		col: charCount+1,
		lineString: wholeString[lineNumber - 1],
		char: input[pos]
	};
};
const getPosContext = (inputString, origPos, message, fileName) => {
	let printFileName = fileName ? `"${fileName}" l` : 'L';
	let pos = origPos;
	let errorCoords = findLineAndCharNumbers(inputString, pos);
	let arrow = '~'.repeat(errorCoords.col) + '^';
	let lineString = errorCoords.lineString.replace(/\t/g,' ');
	while (lineString.replace(/[\s\t]/g, '').length === 0) {
		pos -= 1;
		errorCoords = findLineAndCharNumbers(inputString, pos);
		arrow = '~'.repeat(errorCoords.col) + '^';
		lineString = errorCoords.lineString.replace(/\t/g,' ');
	}
	const newMessage
		= `\n╓ ${printFileName}ine ${errorCoords.row}:${errorCoords.col}: ${message}`
		+ '\n║ ' + `${lineString}`
		+ '\n╙' + arrow
	return newMessage;
};
const printParseMessage = (inputString, pos, message, fileName, messageType) => {
	const fancyMessage = getPosContext(inputString, pos, message, fileName);
	if (messageType === "error") {
		console.error(fancyMessage);
	} else if (messageType === "warning") {
		console.warn(fancyMessage);
	} else {
		console.log(fancyMessage);
	}
};
const decayTo = {
	EOF: token => token.type === 'EOF',
	bareword: token => {
		if (token.type === "bareword") return token.value;
		if (token.barewordValue) return token.barewordValue;
		return null;
	},
	operator: token => token.type === "operator" ? token.value : null,
	color: token => token.type === "color" ? token.value : null,
	boolean: token => token.type === "boolean" ? token.value : null,
	quoted_string: token => token.type === "quoted_string" ? token.value : null,
	number: token => token.type === "number" ? token.value : null,
	duration: token => token.type === "duration" || token.type === "number" ? token.value : null,
	distance: token => token.type === "distance" || token.type === "number" ? token.value : null,
	quantity: token => token.type === "quantity" || token.type === "number" ? token.value : null,
	constant: token => token.type === "constant" ? token.value : null,
	string: token => {
		const bareWord = decayTo.bareword(token);
		if (bareWord) return bareWord;
		if (token.type === "quoted_string") return token.value;
		return null;
	},
};
const verbose = false;
const runTests = false;
const debugLog = (string) => { if (verbose) console.log(string); };

const printStack = (stack) => {
	return stack.map(item=>`${item.branchName}[${item.startPos}]`)
		.reverse()
		.join(' > ');
};
const stackBranchName = (stack) => stack[0].branchName;
const stackPos = (stack) => stack[0].startPos;

const pushStack = (crawlState, branchName, startPos) => {
	crawlState.stack.unshift({ branchName, startPos });
	debugLog(`----adding to stack: ${branchName}[${startPos}]`);
};
const popStack = (crawlState) => {
	const shift = crawlState.stack.shift();
	debugLog(`----shifting off the top of stack: ${shift.branchName}[${shift.startPos}]`);
	debugLog(printStack(crawlState.stack));
};
const addCapture = (crawlState, label, value) => {
	if (!label) throw new Error("Found capture sans label!");
	crawlState.captures.push({
		label,
		value,
		pos: crawlState.tokenPos,
	});
};
const errorRecoverPos = (tokens, origTokenPos, terminatorTwig) => {
	const endTokensPos = {
		terminatorPos: null,
		newlinePos: null,
	};
	let tokenPos = origTokenPos;
	let foundTerminator = false;
	let foundNewline = false;
	// advance tokens until you hit both a terminator token and newline token
	if (!terminatorTwig) foundTerminator = true;
	while (tokenPos < tokens.length) {
		const token = tokens[tokenPos];
		if (token.type === 'newline') {
			if (!foundNewline) {
				endTokensPos.newlinePos = tokenPos;
				foundNewline = true;
				if (foundTerminator) break;
			}
		} else {
			if (!foundTerminator) {
				if (terminatorTwig.type === 'literal') {
					if (token.value === terminatorTwig.value) {
						endTokensPos.terminatorPos = tokenPos;
						foundTerminator = true;
						if (foundNewline) break;
					};
				} else if (terminatorTwig.type === 'capture') {
					found = decayTo[terminatorTwig.value](token);
					if (found) {
						endTokensPos.terminatorPos = tokenPos;
						foundTerminator = true;
						if (foundNewline) break;
					}
				}
			}
		}
		tokenPos += 1;
	}
	const continuePos = endTokensPos.terminatorPos !== null
	? endTokensPos.terminatorPos + 1
	: endTokensPos.newlinePos !== null
		? endTokensPos.newlinePos + 1
		: origTokenPos;
	return continuePos;
};

/* ------------------------------------- TRYBRANCH ------------------------------------- */

const tryToken = (file, crawlState, twig, token) => {
	// debugLog(`tryToken: ${token.value} == ${twig.original}`);
	let matched = false;
	let lookup;
	if (twig.type === 'literal') {
		matched = token.value === twig.value;
		if (matched && twig.label) {
			addCapture(crawlState, twig.label, token.value);
		}
	} else if (twig.type === 'capture') {
		if (twig.value === 'EOF' && token.type !== 'EOF') {
			return { matched, lookup };
		}
		matched = decayTo[twig.value](token) !== null;
		if (matched) {
			let label = twig.label ? twig.label : crawlState.unusedLabels.pop();
			if (label) addCapture(crawlState, label, token.value);
		}
	} else if (twig.type === 'lookup') {
		if (twig.label) {
			crawlState.unusedLabels.push(twig.label);
		}
		pushStack(crawlState, twig.value, crawlState.tokenPos);
		lookup = tryBranches(file, crawlState);
		matched = lookup.matched;
		popStack(crawlState);
	}
	return {
		matched,
		lookup,
	};
}

/* ------------------------------------- TRYBRANCH ------------------------------------- */

const tryBranch = (file, crawlState, branch, branchID) => {
	const branchName = stackBranchName(crawlState.stack);
	debugLog(`\ttryBranch: ${branchName}`);
	const tokens = file.tokens;
	const report = {
		startPos: stackPos(crawlState.stack),
		expected: null,
		expectedPos: null,
		matched: false,
		malformed: false,
	};
	let twigPos = 0;
	let twig = branch[twigPos];
	let token = tokens[crawlState.tokenPos];
	let repeating = false;
	let confirmed = false;

	const advanceTwig = () => {
		twigPos += 1;
		twig = branch[twigPos];
		repeating = false;
	};
	const repeatTwig = () => {
		debugLog("REPEATING")
		twigPos -=1 ;
		twig = branch[twigPos];
		repeating = true;
		crawlState.stack[0].startPos = crawlState.tokenPos;
	};
	const advanceToken = () => {
		crawlState.tokenPos += 1;
		token = tokens[crawlState.tokenPos];
	};
	const updateCrawlState = (newCrawlState) => {
		crawlState = newCrawlState;
		token = tokens[crawlState.tokenPos];
	};
	// BIG LOOP
	while (twigPos < branch.length && crawlState.tokenPos < tokens.length) {
		if (token.ignorable) {
			advanceToken();
			continue;
		}
		const rep = twig.rep;
		const zeroOkay = rep === '*' || rep === '?';
		const multipleOkay = rep === '*' || rep === '+';
		const tryTokenReport = tryToken(file, crawlState, twig, token);

		if (tryTokenReport.matched) {
			debugLog(`\tMatched [${crawlState.tokenPos}] ${token.value} with ${twig.original}`)
			if (twig.type === 'lookup') {
				updateCrawlState(tryTokenReport.lookup.crawlState);
				// we already advanced the token in there; time to undo that now
				crawlState.tokenPos -=1;
			}
			if (twig.confirmNode) {
				confirmed = true;
				if (onStart[branchName]) onStart[branchName](file, crawlState);
			}
			advanceToken();
			advanceTwig();
			if (multipleOkay) {
				repeatTwig();
				continue;
			}
			if (twigPos === branch.length) report.matched = true;
		} else {
			debugLog(`\t[${crawlState.tokenPos}] ${token.value} did not match ${twig.original}`)
			if ((multipleOkay && repeating)|| zeroOkay) {
				advanceTwig();
				if (twigPos === branch.length) report.matched = true;
				continue;
			} else {
				if (twig.type === 'literal') report.expected = `'${twig.value}'`;
				else if (twig.type === 'capture') report.expected = `${twig.value}`;
				else if (twig.type === 'lookup') {
					updateCrawlState(tryTokenReport.lookup.crawlState);
					report.crawlState = crawlState;
					report.expected = tryTokenReport.lookup.expected;
				}
				if (confirmed) report.malformed = true;
				break; // no advance token; tokenPos is pos of error (?)
			}
		}
	}
	if (report.malformed) {
		report.matched = true;
		report.expectedPos = crawlState.tokenPos;
		const terminatorTwig = terminators[branchName][branchID];
		if (terminatorTwig) {
			const continuePos = errorRecoverPos(tokens, crawlState.tokenPos, terminatorTwig);
			crawlState.tokenPos = continuePos !== null
				? continuePos
				: crawlState.tokenPos + 1
		}
	}
	return {crawlState, report};
};

const processFails = (crawlError, fails) => {
	fails.sort((a,b)=>b.crawlState.tokenPos - a.crawlState.tokenPos);
	const maxPos = fails[0].crawlState.tokenPos;
	const expectedArr = fails
		.filter(item=>item.crawlState.tokenPos === maxPos)
		.map(item=>item.report.expected);
	if (maxPos > crawlError.bestPos) {
		crawlError.bestPos = maxPos;
		crawlError.expected = expectedArr;
	} else if (maxPos === crawlError.bestPos) {
		crawlError.expected = crawlError.expected.concat(expectedArr);
	}
	return expectedArr.join(', ');
};

const tryBranches = (file, origCrawlState) => {
	debugLog('tryBranches: ' + printStack(origCrawlState.stack));
	const branchName = stackBranchName(origCrawlState.stack);
	const startPos = stackPos(origCrawlState.stack);
	const branches = file.tree[branchName];
	let triedBranch = null;
	let crawlState = null;
	let expected = '';
	const fails = [];
	for (let i = 0; i < branches.length; i++) {
		const branch = branches[i];
		crawlState = JSON.parse(JSON.stringify(origCrawlState));
		const tryBranchReport = tryBranch(file, crawlState, branch, i);
		if (tryBranchReport.report.matched) {
			triedBranch = tryBranchReport;
			break;
		} else {
			fails.push(tryBranchReport);
		}
	}
	if (triedBranch) {
		crawlState = triedBranch.crawlState;
		popStack(crawlState);
		if (onEnd[branchName]) {
			onEnd[branchName](file, crawlState);
		}
		if (triedBranch.report.malformed) {
			file.errors.push({
				file: file.fileName,
				value: 'Malformed node',
				message: `${branchName} error`,
				startPos: startPos,
				expected: triedBranch.report.expected, 
				errorPos: triedBranch.report.expectedPos,
				endPos: triedBranch.crawlState.tokenPos,
			});
		}
	} else {
		// add to `file` the branch(es) that made it the furthest
		// (in `file` because it persists)
		expected = processFails(file.crawlError, fails);
		// what to do with these fails in an error recovery way?
	}
	return {
		matched: !!triedBranch,
		matchedBranch: triedBranch,
		crawlState,
		expected,
	};
}


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ TESTS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

if (runTests) {

const tryBranchTests = [
	{
		input: `include!("header.mgs")\nadd`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: false,  nextPos: 5,
	},
	{
		input: `include("header.mgs")\nadd`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: true,  nextPos: 4,
	},
	{
		input: `include!()\nadd`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: true,  nextPos: 4,
	},
	{
		input: `include()\nadd`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: true,  nextPos: 3,
	},
	{
		input: `include(\nadd`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: true,  nextPos: 3,
	},
	{
		input: `include( add`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: true,  nextPos: 2,
	},
	{
		input: `$trombones = 76;`, branchName: 'constant_assignment', branchID: 0,
		matched: true, malformed: false, nextPos: 4,
	},
	{
		input: `$trombones = ;`, branchName: 'constant_assignment', branchID: 0,
		matched: true, malformed: true, nextPos: 3,
	},
];
tryBranchTests.forEach((test, i)=>{
	test.tokens = lex(test.input).tokens;
	test.tree = tree;
	test.stack = [{
		branchName: test.branchName,
		startPos: 0,
	}];
});
const testCrawl = {
	tokenPos: 0,
	captures: [],
	unusedLabels: [],
	nodes: [],
	stack: [],
};
let passedTests = 0;
const failedTests = [];
tryBranchTests.forEach((test, i)=>{
	const branch = tree[test.branchName][test.branchID];
	const crawlState = JSON.parse(JSON.stringify(testCrawl));
	crawlState.stack = test.stack;
	const tried = tryBranch(test, crawlState, branch);
	const nextPosTest = tried.crawlState.tokenPos === test.nextPos;
	const matchedTest = (tried.report.matched || false) === test.matched;
	const malformedTest = (tried.report.malformed || false) === test.malformed;
	if (nextPosTest && matchedTest && malformedTest) {
		passedTests += 1;
	} else {
		const testReport = {
			testID: i,
			test: test.input,
		};
		if (!nextPosTest) {
			testReport.nextPos = {expected: test.nextPos, found: tried.crawlState.tokenPos};
		}
		if (!matchedTest) {
			testReport.matched = {expected: test.matched, found: tried.report.matched};
		}
		if (!malformedTest) {
			testReport.malformed = {expected: test.malformed, found: tried.report.malformed};
		}
		failedTests.push(testReport);
	}
});
if (failedTests.length > 0) {
	console.log(failedTests);
}
}

/* ------------------------------------------ PARSE FILE ------------------------------------------ */

const parseFile = (lexResult, tree, givenFileName) => {
	// state
	const fileName = givenFileName ? givenFileName : 'anon' + Math.floor(Math.random()*10000000000);
	const startCrawlState = {
		stack: [{ branchName: 'document', startPos: 0 }],
		tokenPos: 0,
		captures: [],
		unusedLabels: [],
		nodes: [],
		staged: {},
	};
	const file = {
		fileName,
		plaintext: lexResult.plaintext,
		success: false, // whether the file parsing succeeded
		nodes: [], // the file nodes discovered
		// these will have no actual effect yet, and are still per-file, but now files can reference each other and build into more interdependent things
		warnings: [], // good things to know but non-breaking
		errors: [], // parsing might have still finished if there are errors, but some nodes will be broken so the scenario might be wonky
		tokens: lexResult.tokens, // still useful for error handling; you can get a token by its index (from a node) and look at the token pos within the file (char) to get the line/col to make error messages
		tree, // handed around because it's permanent and everything needs to see it
		crawlError: { bestPos: 0, expected: [] },
	};
	
	// parse file
	let tryBranchesReport;
	let prevContinuePos;
	do {
		tryBranchesReport = tryBranches(file, startCrawlState);
		file.success = tryBranchesReport.matched;
		file.crawlState = tryBranchesReport.crawlState;
		if (!file.success) {
			const continuePos = errorRecoverPos(file.tokens, file.crawlError.bestPos);
			if (prevContinuePos === continuePos) break;
			const error = {
				value: 'Syntax error',
				message: `Unknown syntax error`,
				errorPos: file.crawlError.bestPos,
				expected: [...new Set (file.crawlError.expected)].sort().join(', '),
			};
			file.errors.push(error);
			prevContinuePos = continuePos;
			if (continuePos === file.tokens.length) break;
			startCrawlState.tokenPos = continuePos;
		}
	} while (!file.success);

	// review errors and warnings
	tryBranchesReport.crawlState.captures.forEach(capture => {
		if (capture.pos !== file.tokens.length-1) {
			file.errors.push({
				value: 'Orphaned capture',
				message: `Found orphaned capture at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
				errorPos: capture.pos,
			});
		}
	});
	tryBranchesReport.crawlState.unusedLabels.forEach(capture => {
		file.errors.push({
			value: 'Unused capture label',
			message: `Found unused capture label at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
			errorPos: capture.pos,
		});
	});

	// Print errors in the order they land in the file
	file.errors.sort((a,b)=>a.errorPos - b.errorPos);
	file.errors.map(error=>{
		let printable = getPosContext(
			file.plaintext,
			file.tokens[error.errorPos].pos,
			error.message,
			file.fileName,
		);
		if (error.expected?.length > 0) {
			printable += `\nExpected: ${error.expected}`;
		}
		error.printable = printable;
	});

	// done!
	return file;
}

/* ------------------ tests ------------------ */

const testInput = ``
// +`\n$trombones = ;` // error
// +`\n$steamedhams = "Hamburgers";`
// +`\nblarg` // error
// +`\ninclude!()` // error
// +`\ninclude!("header.mgs")`
// +`\nadd serial_dialog settings { wrap 1 }`
// +`\nadd serial_dialog settings { wrap 2 one }` // error
// +`\nadd serial_dialog settings { wrap 3 two wrap 4 }` // error
// +`\nadd dialog settings {
// 	default { alignment BL }
// }`
// +`\nserial_dialog testName {
// 	"Message!"
// 	# "Why not?" = scriptWhyNot
// 	# "Why though?" = actuallyWhy
// 	_ "You're mixing option types now." = errorScript
// }`
// +`\ndialog bobconversation {
// 	Bob alignment TR "Hello!" "I'm Bob!"
// 	PLAYER "...What?"
// 	entity "Uncle Zappy" "Oh, this is the famous Bob's Club, then."
// 	> "Dare I ask?" = ohNoScript
// 	> "Is that what it sounds like?" = soundsSCript
// }`
+`script testScriptName {
	start:
	load map mainMenu;
	return;
}`
+``;
const testParsedFile = parseFile(lex(testInput), tree, 'testMGSFile.mgs');

testParsedFile.errors.forEach(error=>{
	console.error(error.printable);
});

console.log('break');

/* TODOS */

// Don't use JSON clone; make a function to move the values over instead

/* should also expect 'wrap':
╓ "testMGSFile.mgs" line 8:38: add_serial_dialog_settings error
║ add serial_dialog settings { wrap 70 wrappp }
╙~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
Expected: '}'
*/
