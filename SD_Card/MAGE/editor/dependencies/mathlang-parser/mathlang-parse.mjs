import lex from "./mathlang-lex.mjs"
import language from "./mathlang-language.mjs"

const { tree, onEnd, keywords } = language;
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
const getPosContext = (inputString, pos, message) => {
	const errorCoords = findLineAndCharNumbers(inputString, pos);
	const arrow = '~'.repeat(errorCoords.col) + '^';
	const lineString = errorCoords.lineString.replace(/\t/g,' ');
	const newMessage
		= `\n╓ Line ${errorCoords.row}:${errorCoords.col}: ${message}`
		+ '\n║ ' + `${lineString}`
		+ '\n╙' + arrow
	return newMessage;
};
const printParseMessage = (inputString, pos, message, messageType) => {
	const fancyMessage = getPosContext(inputString, pos, message);
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
const verbose = true;
const runTests = true;
const debugLog = (string) => { if (verbose) console.log(string); };

/* ------------------------------------- TRYBRANCH TESTS ------------------------------------- */

const tryToken = (file, crawlState, twig, token) => {
	let matched = false;
	let lookup;
	if (twig.type === 'capture' && twig.value === 'EOF') {
		if (token.type !== 'EOF') {
			return { matched, lookup };
		}
	}
	const addCapture = (crawlState, label, value) => {
		if (!label) throw new Error("Found capture sans label!");
		crawlState.captures.push({
			label,
			value,
			pos: crawlState.tokenPos,
		});
	};

	if (twig.type === 'literal') {
		matched = token.value === twig.value;
		if (matched && twig.label) {
			addCapture(crawlState, label, token.value);
		}
	} else if (twig.type === 'capture') {
		const found = decayTo[twig.value](token);
		matched = found !== null;
		if (matched) {
			let label = twig.label;
			if (!label && crawlState.unusedLabels.length > 0) {
				label = crawlState.unusedLabels.pop();
			}
			if (label){
				addCapture(crawlState, label, token.value)
			};
		}
	} else if (twig.type === 'lookup') {
		if (twig.label) {
			crawlState.unusedLabels.push(twig.label);
		}
		lookup = tryBranches(file, crawlState, twig.value);
		matched = lookup.matched;
	}
	return {
		matched,
		lookup,
	};
}
const tryBranch = (file, crawlState, branch) => {
	const tokens = file.tokens;
	const report = {
		startPos: crawlState.tokenPos,
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
	const advanceToken = () => {
		crawlState.tokenPos += 1;
		token = tokens[crawlState.tokenPos];
	};
	const updateCrawlState = (newCrawlState) => {
		newCrawlState.startPos = crawlState.startPos;
		newCrawlState.branchName = crawlState.branchName;
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
		const triedToken = tryToken(file, crawlState, twig, token);

		if (triedToken.matched) {
			debugLog(`Matched [${crawlState.tokenPos}] ${token.value} with ${twig.value}`)
		} else {
			debugLog(`[${crawlState.tokenPos}] ${token.value} did not match ${twig.value}`)
		}
		if (triedToken.matched) {
			if (twig.type === 'lookup') {
				updateCrawlState(triedToken.lookup.crawlState);
				// we already advanced the token in there; time to undo that
				crawlState.tokenPos -=1;
			}
			if (twig.confirmNode) confirmed = true;
			advanceToken();
			if (!multipleOkay) {
				advanceTwig();
			} else {
				twigPos = 0;
			}
		} else {
			if ((multipleOkay && repeating)|| zeroOkay) {
				advanceTwig();
				continue;
			} else {
				if (twig.type === 'lookup') {
					report.crawlState = updateCrawlState(triedToken.lookup.crawlState);
					report.expected = triedToken.lookup.expected;
				} else if (twig.type === 'literal') {
					report.expected = `'${twig.value}'`;
				} else if (twig.type === 'capture') {
					report.expected = `${twig.value}`;
				}
				if (confirmed) report.malformed = true;
				// no advance token; tokenPos is pos of error (?)
				break;
			}
		}
	}
	if (twigPos === branch.length) report.matched = true;
	if (report.malformed) {
		report.matched = true;
		report.expectedPos = crawlState.tokenPos;
		let terminatorTwig;
		while (twigPos < branch.length) {
			if (branch[twigPos].terminator) terminatorTwig = branch[twigPos];
			advanceTwig();
		}
		const continuePos = errorRecoverPos(tokens, crawlState.tokenPos, terminatorTwig);
		crawlState.tokenPos = continuePos !== null
			? continuePos
			: crawlState.tokenPos + 1
	}
	return {crawlState, report};
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
	return endTokensPos.terminatorPos !== null
		? endTokensPos.terminatorPos + 1
		: endTokensPos.newlinePos !== null
			? endTokensPos.newlinePos + 1
			: null;
}

const tryBranches = (file, origCrawlState, branchName) => {
	const branches = file.tree[branchName];
	const startPos = origCrawlState.startPos;
	let triedBranch = null;
	let crawlState = null;
	let expected = '';
	const fails = [];
	debugLog(`\tTRYING BRANCH: ${branchName}`);
	for (let i = 0; i < branches.length; i++) {
		const branch = branches[i];
		crawlState = JSON.parse(JSON.stringify(origCrawlState));
		const tryingBranch = tryBranch(file, crawlState, branch);
		if (tryingBranch.report.matched) {
			triedBranch = tryingBranch;
			break;
		} else {
			fails.push(tryingBranch);
		}
	}
	if (triedBranch) {
		crawlState = triedBranch.crawlState;
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
		fails.sort((a,b)=>b.crawlState.tokenPos - a.crawlState.tokenPos);
		const maxPos = fails[0].crawlState.tokenPos;
		const expectedArr = fails
			.filter(item=>item.crawlState.tokenPos === maxPos)
			.map(item=>item.report.expected);
		if (!file.crawlError) {
			file.crawlError = {
				bestPos: -Infinity,
				expected: [],
			};
		}
		if (maxPos > file.crawlError.bestPos) {
			file.crawlError.bestPos = maxPos;
			file.crawlError.expected = expectedArr;
		} else if (maxPos === file.crawlError.bestPos) {
			file.crawlError.expected = file.crawlError.expected.concat(expectedArr);
		}
		expected = expectedArr.join(', ')
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
	tryBranchTests.forEach(test=>{
		test.tokens = lex(test.input).tokens;
		test.tree = tree;
	});
	const testCrawl = {
		tokenPos: 0,
		captures: [],
		unusedLabels: [],
		nodes: [],
	};
	let passedTests = 0;
	const failedTests = [];
	tryBranchTests.forEach((test, i)=>{
		const branch = tree[test.branchName][test.branchID];
		const tried = tryBranch(test, JSON.parse(JSON.stringify(testCrawl)), branch);
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
	const fileName = givenFileName ? givenFileName : 'anon' + Math.floor(Math.random()*10000000000);
	const startCrawlState = {
		tokenPos: 0,
		captures: [],
		unusedLabels: [],
		nodes: [],
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
		crawlError: {
			bestPos: 0,
			expected: [],
		},
	};
	const triedAll = tryBranches(file, startCrawlState, 'document');
	file.success = triedAll.matched;
	file.crawlState = triedAll.crawlState;

	// review errors and warnings
	triedAll.crawlState.captures.forEach(capture => {
		if (capture.pos !== file.tokens.length-1) {
			file.errors.push({
				value: 'Orphaned capture',
				message: `Found orphaned capture at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
				errorPos: capture.pos,
			});
		}
	});
	triedAll.crawlState.unusedLabels.forEach(capture => {
		file.errors.push({
			value: 'Unused capture label',
			message: `Found unused capture label at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
			errorPos: capture.pos,
		});
	});
	if (!file.success) {
		file.errors.push({
			value: 'Syntax error',
			message: `Unknown syntax error`,
			errorPos: file.crawlError.bestPos,
			expected: [...new Set (file.crawlError.expected)].join(', '),
		});
	}
	file.errors.sort((a,b)=>a.errorPos - b.errorPos);
	file.errors.map(error=>{
		let printable = getPosContext(
			file.plaintext,
			file.tokens[error.errorPos].pos,
			error.message,
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

const testInput = `
include!("header.mgs")
include!()
$trombones = ;
$steamedhams = "Hamburgers";
add
`;
const testParsedFile = parseFile(lex(testInput), tree, 'testMGSFile');

testParsedFile.errors.forEach(error=>{
	console.error(error.printable);
})

console.log('break');
