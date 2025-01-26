import { lex } from "./mathlang-lex.mjs"
import { tree, onStart, onEnd, terminators } from "./mathlang-language.mjs"
import { getPosContext, printCondition, printNode, errorRecoverPos, decayTo } from "./mathlang-utilities.mjs"

const verbose = false;
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

/* ------------------------------------- TRYBRANCH ------------------------------------- */

const tryToken = (file, crawlState, twig, token) => {
	// debugLog(`tryToken: ${token.value} == ${twig.original}`);
	let matched = false;
	let tryBranchesReport;
	if (twig.type === 'literal') {
		matched = token.value === twig.value;
		if (matched && twig.label) {
			addCapture(crawlState, twig.label, token.value);
		}
	} else if (twig.type === 'capture') {
		if (twig.value === 'EOF' && token.type !== 'EOF') {
			return { matched, lookup: tryBranchesReport };
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
		tryBranchesReport = tryBranches(file, crawlState);
		matched = tryBranchesReport.matched;
		popStack(crawlState);
	}
	return {
		matched,
		lookup: tryBranchesReport,
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
			debugLog(`\tMatched [${crawlState.tokenPos}] ${token.rawValue} with ${twig.original}`)
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
				if (twig.type === 'literal') {
					const pos = crawlState.tokenPos;
					const checkpoints = file.crawlErrors.checkpoints;
					checkpoints[pos] = checkpoints[pos] || new Set();
					checkpoints[pos].add(`'${twig.value}'`);
					report.expected = `'${twig.value}'`;
				}
				else if (twig.type === 'capture') {
					const pos = crawlState.tokenPos;
					const checkpoints = file.crawlErrors.checkpoints;
					checkpoints[pos] = checkpoints[pos] || new Set();
					checkpoints[pos].add(twig.value);
					report.expected = `${twig.value}`;
				}
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

const processFails = (crawlErrors, fails) => {
	fails.sort((a,b)=>b.crawlState.tokenPos - a.crawlState.tokenPos);
	const maxPos = fails[0].crawlState.tokenPos;
	const expectedArr = fails
		.filter(item=>item.crawlState.tokenPos === maxPos)
		.map(item=>item.report.expected);
	if (maxPos > crawlErrors.bestPos) {
		crawlErrors.checkpoints[maxPos] = new Set(expectedArr);
		crawlErrors.bestPos = maxPos;
	} else if (maxPos === crawlErrors.bestPos) {
		expectedArr.forEach(v=>{
			crawlErrors.checkpoints[maxPos].add(v)
		});
	}
	return expectedArr.join(', ');
};

const tryBranches = (file, origCrawlState) => {
	debugLog('tryBranches: ' + printStack(origCrawlState.stack));
	const branchName = stackBranchName(origCrawlState.stack);
	const startPos = stackPos(origCrawlState.stack);
	const branches = file.tree[branchName];
	let triedBranch;
	let crawlState;
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
		popStack(crawlState); // ?? why doing this twice? (startPos is broken if this is removed? why though?)
		if (onEnd[branchName]) {
			onEnd[branchName](file, crawlState);
		}
		if (triedBranch.report.malformed) {
			const fileExpecteds = file.crawlErrors.checkpoints[triedBranch.report.expectedPos];
			file.errors.push({
				file: file.fileName,
				value: 'Malformed node',
				message: `${branchName} error`,
				startPos: startPos,
				expected: [...fileExpecteds].sort().join(', '), 
				errorPos: triedBranch.report.expectedPos,
				endPos: triedBranch.crawlState.tokenPos,
			});
		}
	} else {
		// add to `file` the branch(es) that made it the furthest
		// (in `file` because it persists)
		expected = processFails(file.crawlErrors, fails);
		// what to do with these fails in an error recovery way?
	}
	return {
		matched: !!triedBranch,
		matchedBranch: triedBranch,
		crawlState,
		expected,
	};
}

/* ------------------------------------------ PARSE FILE ------------------------------------------ */

export const parseFile = (lexResult, givenFileName) => {
	// state
	const fileName = givenFileName ? givenFileName : 'anon' + Math.floor(Math.random()*10000000000);
	const crawlState = {
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
		crawlErrors: {
			checkpoints: {
				0: new Set (),
			},
			bestPos: 0,
		},
	};
	
	// parse file
	let tryBranchesReport;
	let prevContinuePos;
	do {
		tryBranchesReport = tryBranches(file, crawlState);
		file.success = tryBranchesReport.matched;
		file.crawlState = tryBranchesReport.crawlState;
		if (!file.success) {
			const continuePos = errorRecoverPos(file.tokens, file.crawlErrors.bestPos);
			if (prevContinuePos === continuePos) break;
			const errorPos = file.crawlErrors.bestPos;
			const error = {
				value: 'Syntax error',
				message: `Unknown syntax error`,
				errorPos: errorPos,
				expected: [...file.crawlErrors.checkpoints[errorPos]].sort().join(', '),
			};
			file.errors.push(error);
			prevContinuePos = continuePos;
			if (continuePos === file.tokens.length) break;
			crawlState.tokenPos = continuePos;
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

const testInput = `_{}`
// `add serial_dialog settings { wrap 2 one }` // error
// +`\nadd serial_dialog settings { wrap 3 }`
// +`\nadd serial_dialog settings { wrap 3 ERRORTOKEN wrap 4 }`
// +`\nadd dialog settings { wrap 3 alignment 4 }`
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
// +`\nscript testScriptName {
// 	goto label labelname;
// 	return;
// 	goto index 45;
// 	goto scriptName;
// 	load map mainMenu;
// 	close dialog;
// 	unpause map on_tick;
// }`
// +`\ntestScript2 {
// 	show dialog {
// 		name "Guide"
// 		alignment BR
// 		"WELCOME TO"
// 		"MAIN MENU"
// 		> "Load" = loadGame
// 		> "New" = newGame
// 		> "Quit" = quitGame
// 	};
// }`
// +`\n
// $trombones = 76;
// _ {
// 	wait 4000;
// }
// `
// +`\ntestScript {
// 	show serial_dialog YesReferenceNoDefinition;
// 	show serial_dialog {
// 		wrap 90
// 		"Defined two nodes above 'testScript'"
// 		"autonamed"
// 		# "Wait, what?" = destinationScript
// 	};
// 	show serial_dialog definitionAndReference {
// 		"Defined one node above 'testScript'"
// 		"named 'definitionAndReference'"
// 	};
// }`
// + ``

const testParsedFile = parseFile(lex(testInput), 'testMGSFile.mgs');
testParsedFile.nodes.forEach(node=>{
	console.log(printNode(node));
});
testParsedFile.errors.forEach(error=>{
	console.error(error.printable);
});

console.log("")

// ========================== CONDITION EXPRESSION TESTS

// // !(a || b) // Oh, I can have && now!
// // a=true, b=true = false
// // a=false, b=true = false
// // a=true, b=false = false
// // a=false, b=false = true
// // (a&&b) == !(a||b)
// const testConditionScript = `_ {
// 	if (
// 		(falseFlag || trueFlag || unknownFlag)
// 		&& !debug_mode
// 	) {}
// }`
// const testConditionParseFile = parseFile(lex(testConditionScript), tree, 'testMGSFile.mgs')
// const testConditions = testConditionParseFile.nodes[0].body[1].conditions[0];
// console.log(printCondition(testConditions));
