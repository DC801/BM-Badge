// "use strict";

var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var utils = natlang.utils;

if (typeof module === 'object') {
	utils = require('./natlang-utils.js');
}

var zigzag = { // load-bearing var?
	identifyIf: (tokens, i) => tokens[i]?.value === "if"
		&& tokens[i+1]?.value === "(",
	identifyElseIf: (tokens, i) => tokens[i]?.value === "else"
		&& tokens[i+1]?.value === "if"
		&& tokens[i+2]?.value === "(",
	identifyElse: (tokens, i) => tokens[i]?.value === "else"
		&& tokens[i+1]?.value === "{",
};

const findLitValue = token => {
	if (token.barewordValue) return token.barewordValue;
	if (typeof token.value === "string") return token.value;
	return false;
};

zigzag.parseSingleZig = (tokens, startPos) => {
	// start from index of first matchable bracket
	const conditions = [];
	let pos = startPos;
	let conditionsInfo;
	let conditionsType = "none";
	if (tokens[pos].value === "(") {
		conditionsInfo = utils.collectBetween(tokens, pos, ")");
		if (!conditionsInfo || !conditionsInfo.success) {
			const err = new Error(`Zigzag parseSingleZig: Collection failure! (Is matching ')' missing?)`);
			err.tokenIndex = pos;
			err.token = tokens[pos];
			err.pos = tokens[pos].pos;
			throw err;
		}
		pos = conditionsInfo.nextTokenIndex;
		// checking for multiple condition statements
		conditionsType = "single";
		let insert = [];
		conditionsInfo.collection.forEach(token => {
			if (token.value === "||") {
				conditions.push(insert);
				insert = [];
				conditionsType = "OR";
			} else {
				insert.push(token);
			}
		})
		conditions.push(insert);
	}
	// whether or not there were condition(s), check for behavior(s)
	if (tokens[pos].value !== "{") {
		const err = new Error(`Zigzag parseSingleZig: Expected '{', found '${tokens[pos].value}'`);
		err.tokenIndex = pos;
		err.token = tokens[pos];
		err.pos = tokens[pos].pos;
		throw err;
	}
	const behaviorsInfo = utils.collectBetween(tokens, pos, "}");
	if (!behaviorsInfo || !behaviorsInfo.success) {
		const err = new Error(`Zigzag parseSingleZig: Collection failure! (Is matching '}' missing?)`);
		err.tokenIndex = pos;
		err.token = tokens[pos];
		err.pos = tokens[pos].pos;
		throw err;
	}
	const report = {
		conditions,
		conditionsType,
		behaviors: behaviorsInfo.collection,
		nextTokenIndex: behaviorsInfo.nextTokenIndex,
		brackets: {
			curlyOpenToken: behaviorsInfo.startToken,
			curlyCloseToken: behaviorsInfo.endToken,
		},
	};
	if (conditionsInfo?.success) {
		report.brackets.parenOpenToken = conditionsInfo.startToken;
		report.brackets.parenCloseToken = conditionsInfo.endToken;
	}
	return report;
};

zigzag.parseWholeZig = (tokens, startTokenIndex) => {
	// startTokenIndex should be a zigzag start: `if (...`
	// (We will confirm first!)
	let pos = startTokenIndex;
	if (!zigzag.identifyIf(tokens, pos)) {
		const errorObject = new Error(`Zigzag parseWholeZig: Token index ${startTokenIndex} not valid zigzag start. Cannot parse!`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	const rootToken = tokens[pos];
	// get past the "if"
	pos += 1;
	// get info out of `if ( _ ) { _ }`
	let statement = zigzag.parseSingleZig(tokens,pos);
	statement.rootToken = rootToken;
	// make it the first of (possibly) several /(if|else if|else)/ statements:
	let statements = [
		statement
	];
	pos = statement.nextTokenIndex;
	while (pos < tokens.length) { // until we exhaust the tokens
		// check for an `else if` statement
		const elseIfCheck = zigzag.identifyElseIf(tokens, pos);
		if (elseIfCheck) {
			const elseIfRootToken = tokens[pos];
			pos += 2;
			const nextStatement = zigzag.parseSingleZig(tokens,pos);
			nextStatement.rootToken = elseIfRootToken;
			statements.push(nextStatement);
			pos = nextStatement.nextTokenIndex;
			continue; // check for another `else if` statement
		}
		// check for an `else` statement
		const elseCheck = zigzag.identifyElse(tokens, pos);
		if (elseCheck) {
			const elseRootToken = tokens[pos];
			pos += 1;
			const nextStatement = zigzag.parseSingleZig(tokens,pos);
			nextStatement.rootToken = elseRootToken;
			statements.push(nextStatement);
			pos = nextStatement.nextTokenIndex;
		}
		break; // nothing comes after an `else` so stop looping
	}
	// get the last statement
	const lastStatement = statements[statements.length - 1];
	const nextPos = lastStatement.nextTokenIndex;
	return {
		origTokenIndex: startTokenIndex, // what it was given
		statements, // an array of zigzag.parseSingleZig() output
		nextTokenIndex: nextPos, // pick up from here
	};
};

const buildZigzagToken = (rawToken, value, type, extra) => {
	const token = JSON.parse(JSON.stringify(rawToken));
	token.value = value || "ZIGZAG " + token.pos; // change to provided or auto made
	token.type = type || token.type; // change to provided or use orig
	token.macro = "zigzag";
	if (extra !== undefined) token.meta = extra;
	return token;
};

zigzag.expandZigzag = (report, _scriptNameToken) => {
	const srcs = report.statements;
	
	// CONVERGE TOKEN
	// info for the last curly (token) in the zigzag:
	const finalCurly = srcs[srcs.length-1].brackets.curlyCloseToken;
	const forover = buildZigzagToken(
		finalCurly,
		"LABEL f" + finalCurly.pos,
		"bareword",
		"forover"
	);

	// other state:
	let topTokens = [];
	let tokenBatch = []; // when done, this will get glued to `ret`

	srcs.forEach((src, i) => {

		// BASE TOKENS for this `if` / `else if` / `else` statement
		const curlyOpen = src.brackets.curlyOpenToken;
		const curlyClose = src.brackets.curlyCloseToken;

		// tokens for `if` and `{` and `}`
		const rootToken = src.rootToken; // `if` (all become `if` in final, even elsess)
		const bodyStart = buildZigzagToken(curlyOpen, null, "bareword", "bodyStart"); // {
		const bodyEnd = buildZigzagToken(curlyClose, null, "bareword", "bodyEnd"); // }
		bodyStart.value = "bodyStart " + bodyStart.value;
		bodyEnd.value = "bodyEnd " + bodyEnd.value;

		if (
			// explicitly "OR" in case I want to do "AND" someday separately:
			src.conditionsType === "OR"
			|| src.conditionsType === "single"
		) {
			// token info for `(` and `)`
			const parenOpen = src.brackets.parenOpenToken || null;
			const parenClose = src.brackets.parenCloseToken || null;
			const conditionStart = buildZigzagToken(parenOpen, null, "bareword", "conditionStart"); // (
			const conditionEnd = buildZigzagToken(parenClose, null, "bareword", "conditionEnd"); // )
			conditionStart.value = "conditionStart " + conditionStart.value;
			conditionEnd.value = "conditionEnd " + conditionEnd.value;

			src.conditions.forEach(condition => {
				// `if`
				topTokens.push(
					buildZigzagToken(rootToken, "if", "bareword", "zigzag"),
				);
				topTokens = topTokens.concat(
					// condition
					condition
				).concat([
					// `then goto label`
					buildZigzagToken(conditionEnd, "then", "bareword", "zigzag"),
					buildZigzagToken(bodyStart, "goto", "bareword", "zigzag"),
					buildZigzagToken(bodyStart, "label", "bareword", "zigzag"),
					// bodyStart `;`
					bodyStart,
					buildZigzagToken(bodyStart, ";", "operator", "zigzag"),
				]);
			})
			// (IN LOWER HALF OF EXPANDED TOKENS)
			tokenBatch = tokenBatch.concat([
				// bodyStart `:`
				bodyStart,
				buildZigzagToken(bodyStart, ":", "operator", "zigzag"),
			]).concat(
				// behavior
				src.behaviors,
			).concat([
				// `goto label` forover `;`
				buildZigzagToken(forover, "goto", "bareword", "zigzag"),
				buildZigzagToken(forover, "label", "bareword", "zigzag"),
				forover,
				buildZigzagToken(forover, ";", "operator", "zigzag"),
			]);
		} else if (
			src.conditionsType === "none" // no conditions found
			|| !src.conditions.length // fallback: conditions array is empty
		) { // end of the zigzag; default (fallthrough) script behavior follows
			// BACK IN THE UPPER HALF
			// default behavior body
			topTokens = topTokens.concat(
				src.behaviors
			)
		}
		if (i === srcs.length - 1) { // if it's the last statement
			// close the "default" script
			topTokens = topTokens.concat([
				// `goto label` forover `;`
				buildZigzagToken(forover, "goto", "bareword", "zigzag"),
				buildZigzagToken(forover, "label", "bareword", "zigzag"),
				forover,
				buildZigzagToken(forover, ";", "operator", "zigzag"),
			]);
		}
	});
	let combinedTokens = topTokens.concat(tokenBatch);
	// forover `:`
	combinedTokens = combinedTokens.concat([
		forover,
		buildZigzagToken(forover, ":", "operator", "zigzag"),
	]);
	return {
		tokens: combinedTokens,
		nextTokenIndex: report.nextTokenIndex,
	}
};

zigzag.processOnce = tokens => {
	const punctuationStack = [];
	let pos = 0;
	let crawledTokens = [];
	let naiveScriptNameToken = {};
	while (pos < tokens.length) {
		if (zigzag.identifyIf(tokens, pos)) { // we need to zigzag
			const zigReport = zigzag.parseWholeZig(tokens, pos);
			const zigzagResults = zigzag.expandZigzag(zigReport, naiveScriptNameToken);
			crawledTokens = crawledTokens.concat(zigzagResults.tokens);
			pos = zigzagResults.nextTokenIndex;
			continue;
		} else { // no zigzagging; mundane stuff
			const naiveValue = findLitValue(tokens[pos]);
			// naive bracket handling
			if (naiveValue === "{") { // if this token is a block opening
				// get possible scriptnames
				if (
					!punctuationStack.length // there's nothing in the stack
					&& tokens[pos-1] // and there's a token before this one
				) {
					// let's pretend the previous token was a script name
					naiveScriptNameToken = tokens[pos-1];
				}
				// add it to the stack
				punctuationStack.unshift(naiveValue);
				crawledTokens.push(tokens[pos]);
				pos += 1;
				continue;
			} else if (naiveValue === "}") {// if this token is a block closing
				if (punctuationStack.length) { // ...and there's chars in the stack
					punctuationStack.shift();
					crawledTokens.push(tokens[pos]);
					pos += 1;
					continue;
				} else { // ...but there's no chars in the stack
					const errorObject = new Error(`Zigzag processOnce: Found "${naiveValue}" but no "${top}" to close!`)
					errorObject.tokenIndex = pos;
					errorObject.token = tokens[pos];
					errorObject.pos = tokens[pos].pos;
					throw errorObject;
				}
			}
			// if you've gotten this far, the token can fall through
			crawledTokens.push(tokens[pos]);
			pos += 1;
			continue;
		}
	}
	return crawledTokens;
};

zigzag.process = origTokens => { // natlang.parse looks for ".process()"
	// first check whether the whole lex object was passed by accident:
	const tokens = origTokens.success ? origTokens.tokens : origTokens;
	// (okay we're good now)	
	let origLength;
	let expandedTokens = tokens;
	let newLength = tokens.length;
	do {
		try {
			expandedTokens = zigzag.processOnce(expandedTokens);
		} catch (error) {
			throw error;
		}
		origLength = newLength;
		newLength = expandedTokens.length
	} while (origLength !== newLength)
	return expandedTokens;
};

zigzag.log = tokens => {
	const bracketStack = [];
	let string = '';
	let newline = false;
	tokens.forEach((token, i) => {
		let tokenValue = token.barewordValue || token.value;
		if (token.type === "quotedString") {
			tokenValue = token.quotationMark + token.value + token.quotationMark;
		}
		if (string === '') {
			string = tokenValue;
		} else {
			if (tokenValue === '}') {
				newline = true;
				bracketStack.pop();
			}
			if (tokenValue === 'if') {
				newline = true;
			}
			if (tokenValue === 'goto' && tokens[i-1] && tokens[i-1].value !== 'then') {
				newline = true;
			}
			if (newline) {
				string += '\n' + '\t'.repeat(bracketStack.length);
			} else {
				string += ' ';
			}
			newline = false;
			string += tokenValue;
			if (tokenValue === '{') {
				newline = true;
				bracketStack.push(tokenValue);
			}
			if (tokenValue === '}') {
				newline = true;
			}
		}
	})
	return {
		logBody: string,
		logType: "mgs",
		raw: tokens
	};
}

window.zigzag = zigzag;

if (typeof module === 'object') {
	module.exports = zigzag
}
