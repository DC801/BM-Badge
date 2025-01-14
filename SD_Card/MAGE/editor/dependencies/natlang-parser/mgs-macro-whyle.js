// "use strict";

var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var utils = natlang.utils;

if (typeof module === 'object') {
	utils = require('./natlang-utils.js');
}

var whyle = {
	identifyWhyle: (tokens, tokenPos) => {
		return tokens[tokenPos]
			&& (
				tokens[tokenPos].value === "while"
				|| tokens[tokenPos].value === "for"
			)
			&& tokens[tokenPos+1]
			&& tokens[tokenPos+1].value === "(";
	},
};

const literalValue = token => {
	if (token.barewordValue) return token.barewordValue;
	if (typeof token.value === "string")  return token.value;
	return false;
};

whyle.parseSingleWhyle = (tokens, startPos) => {
	// start from index of first matchable bracket
	let pos = startPos;
	if (tokens[pos].value !== "(") {
		const errorObject = new Error(`Whyle parseSingleWhyle: Collection failure! No '('?`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	const conditionsInfo = utils.collectBetween(tokens, pos, ")");
	if (!conditionsInfo || !conditionsInfo.success) {
		const errorObject = new Error(`Whyle parseSingleWhyle: Collection failure! (Is matching ')' missing?)`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	pos = conditionsInfo.nextTokenIndex;
	const conditions = conditionsInfo.collection;
	// collect behavior(s)
	if (tokens[pos].value !== "{") {
		const errorObject = new Error(`Whyle parseSingleWhyle: Expected '{', found '${tokens[pos].value}'`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	const behaviorsInfo = utils.collectBetween(tokens, pos, "}");
	if (!behaviorsInfo || !behaviorsInfo.success) {
		const errorObject = new Error(`Whyle parseSingleWhyle: Collection failure! (Is matching '}' missing?)`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	return {
		conditions,
		behaviors: behaviorsInfo.collection,
		nextTokenIndex: behaviorsInfo.nextTokenIndex,
		brackets: {
			parenOpenToken: conditionsInfo.startToken,
			parenCloseToken: conditionsInfo.endToken,
			curlyOpenToken: behaviorsInfo.startToken,
			curlyCloseToken: behaviorsInfo.endToken,
		},
	};
};

whyle.parseWholeWhyle = (tokens, startTokenIndex) => {
	// startTokenIndex should be a while or for start: `while (...` (or `for`)
	// (We will confirm first!)
	let pos = startTokenIndex;
	if (!whyle.identifyWhyle(tokens, pos)) {
		const errorObject = new Error(`Whyle parseWholeWhyle: Token index ${startTokenIndex} not valid 'while' or 'for' start. Cannot parse!`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	const rootToken = tokens[pos];
	// get past the `while` (or `for`)
	pos += 1;
	// get info out of ( __ ) { __ }
	const statement = whyle.parseSingleWhyle(tokens, pos);
	statement.rootToken = rootToken;
	return {
		origTokenIndex: startTokenIndex, // what it was given
		statement, // whyle.parseSingleWhyle() output
		nextTokenIndex: statement.nextTokenIndex, // pick up from here
		type: rootToken.value, // "while" or "for"
	};
};

const buildWhyleToken = (rawToken, value, type, extra) => {
	const token = JSON.parse(JSON.stringify(rawToken));
	token.value = value || "WHYLE " + token.pos; // change to provided or auto made
	token.type = type || token.type; // change to provided or use orig
	if (extra !== undefined) {
		token.meta = extra;
	}
	return token;
};

const parseForInner = inner => {
	const order = [ "initial", "condition", "increment" ];
	const result = {
		initial: [],
		condition: [],
		increment: [],
	}
	const semicolons = [];
	let chunk = 0;
	inner.forEach(token => {
		if (token.value === ";") {
			semicolons.push(token);
			chunk += 1;
			if (chunk > 2) {
				throw new Error("How many semicolons you got in this 'for', dude??");
			}
		} else {
			result[order[chunk]].push(token);
		}
	})
	if (chunk !== 2) {
		throw new Error("You don't have enough semicolons in this 'for', bruh!");
	}
	if (result.condition.length === 0) {
		throw new Error("Put a condition in your 'for' please!");
	}
	result.initial.push(semicolons.shift());
	result.increment.push(semicolons.shift());
	return result;
};

whyle.expandWhyle = (report, reportType) => {
	const src = report.statement;

	const curlyOpen = src.brackets.curlyOpenToken;
	const curlyClose = src.brackets.curlyCloseToken;
	const parenOpen = src.brackets.parenOpenToken;
	const parenClose = src.brackets.parenCloseToken;

	let initial = [];
	let condition = src.conditions;
	let increment = [];

	let behaviors = src.behaviors || [];

	if (reportType === "for") {
		const inner = parseForInner(condition);
		initial = inner.initial;
		condition = inner.condition;
		increment = inner.increment;
	}

	// LABELS
	const rootToken = src.rootToken;             // while
	const loopcheck = buildWhyleToken(parenOpen, null, "bareword", "loopcheck");      // (
	const continuepoint = buildWhyleToken(parenClose, null, "bareword", "continuepoint"); // )
	const loopbody = buildWhyleToken(curlyOpen, null, "bareword", "loopbody");       // {
	const loopover = buildWhyleToken(curlyClose, null, "bareword", "loopover");      // }

	loopcheck.value = "loopcheck " + loopcheck.value;
	continuepoint.value = "continuepoint " + continuepoint.value;
	loopbody.value = "loopbody " + loopbody.value;
	loopover.value = "loopover " + loopover.value;
	

	// BREAK / CONTINUE

	const parsedBehaviors = [];
	behaviors.forEach(token => {
		if (token.value === "break") {
			parsedBehaviors.push(buildWhyleToken(token, "goto", "bareword", "break"));
			parsedBehaviors.push(buildWhyleToken(token, "label", "bareword", "break"));
			parsedBehaviors.push(buildWhyleToken(token, loopover.value, "bareword", "break"));
			parsedBehaviors.push(buildWhyleToken(token, ";", "operator", "break"));
		} else if (token.value === "continue") {
			parsedBehaviors.push(buildWhyleToken(token,"goto", "bareword", "continue"));
			parsedBehaviors.push(buildWhyleToken(token,"label", "bareword", "continue"));
			parsedBehaviors.push(buildWhyleToken(token, continuepoint.value, "bareword", "continue"));
			parsedBehaviors.push(buildWhyleToken(token, ";", "operator", "continue"));
		} else {
			parsedBehaviors.push(token);
		}
	})
	behaviors = parsedBehaviors;
	
	// THE REST OF THE OWL

	// while ( CONDITION ) { CODE } =>
	// for (INITIAL; CONDITION; INCREMENT) { CODE } =>

	const tokens = initial // INITIAL (`for` only)
	.concat([
		// goto label $loopcheck
		buildWhyleToken(rootToken, "goto", "bareword", reportType),
		buildWhyleToken(rootToken, "label", "bareword", reportType),
		buildWhyleToken(rootToken, loopcheck.value, "bareword", reportType),
		buildWhyleToken(rootToken, ";", "operator", reportType),
		// loopbody :
		loopbody,
		buildWhyleToken(loopbody, ":", "operator"),
	])
	.concat(behaviors) // CODE
	.concat([
		// continuepoint :
		continuepoint,
		buildWhyleToken(continuepoint, ":", "operator"),
	])
	.concat(increment) // INCREMENT (`for` only)
	.concat([
		// loopcheck :
		loopcheck,
		buildWhyleToken(loopcheck, ":", "operator"),
		// if (
		buildWhyleToken(loopcheck, "if"),
		parenOpen,
	])
	.concat(condition) // CONDITION
	.concat([
		// ) {
		parenClose,
		buildWhyleToken(parenClose, "{", "operator"),
		// goto label loopbody
		buildWhyleToken(parenClose, "goto", "bareword", "goto label loopbody"),
		buildWhyleToken(parenClose, "label", "bareword", "goto label loopbody"),
		buildWhyleToken(parenClose, loopbody.value, "bareword", "goto label loopbody"),
		buildWhyleToken(parenClose, ";", "operator", "goto label loopbody"),
		buildWhyleToken(parenClose, "}", "operator", "goto label loopbody"),
		// loopover :
		loopover,
		buildWhyleToken(loopover, ":", "operator"),
	]);
	return tokens;
};

whyle.processOnce = tokens => {
	const punctuationStack = [];
	let crawledTokens = [];
	let pos = 0;
	while (pos < tokens.length) {
		if (whyle.identifyWhyle(tokens, pos)) {
			const info = whyle.parseWholeWhyle(tokens, pos);
			const expanded = whyle.expandWhyle(info, info.type);
			crawledTokens = crawledTokens.concat(expanded);
			pos = info.nextTokenIndex;
			continue;
		} else { // no whiling; mundane stuff
			const naiveValue = literalValue(tokens[pos]);
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
					const errorObject = new Error(`Whyle processOnce: Found "${naiveValue}" but no "${top}" to close!`)
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

whyle.process = origTokens => { // natlang.parse looks for ".process()"
	// first check whether the whole lex object was passed by accident:
	let tokens = origTokens.success ? origTokens.tokens : origTokens;
	// (okay we're good now)
	let origLength;
	let newLength = tokens.length;
	do {
		try {
			tokens = whyle.processOnce(tokens);
		} catch (error) {
			throw error;
		}
		origLength = newLength;
		newLength = tokens.length
	} while (origLength !== newLength)
	return tokens;
};

whyle.log = tokens => {
	const bracketStack = [];
	let logBody = '';
	let newline = false;
	tokens.forEach((token, index) => {
		let tokenValue = token.barewordValue || token.value;
		if (token.type === "quotedString") {
			tokenValue = token.quotationMark + token.value + token.quotationMark;
		}
		if (logBody === '') {
			logBody = tokenValue;
		} else {
			if (tokenValue === '}') {
				newline = true;
				bracketStack.pop();
			}
			if (tokenValue === 'if') {
				newline = true;
			}
			if (tokenValue === 'goto' && tokens[index-1] && tokens[index-1].value !== 'then') {
				newline = true;
			}
			if (newline) {
				logBody += '\n' + '\t'.repeat(bracketStack.length);
			} else {
				logBody += ' ';
			}
			newline = false;
			logBody += tokenValue;
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
		logBody,
		logType: "mgs",
		raw: tokens
	};
}

window.whyle = whyle;

if (typeof module === 'object') {
	module.exports = whyle
}
