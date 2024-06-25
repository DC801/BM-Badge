// "use strict";

var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var utils = natlang.utils;

if (typeof module === 'object') {
	utils = require('./natlang-utils.js');
}

var zigzag = {
	identifyIf: function (tokens, tokenPos) {
		return tokens[tokenPos]
			&& tokens[tokenPos].value === "if"
			&& tokens[tokenPos+1]
			&& tokens[tokenPos+1].value === "(";
	},
	identifyElseIf: function (tokens, tokenPos) {
		return tokens[tokenPos]
			&& tokens[tokenPos].value === "else"
			&& tokens[tokenPos+1]
			&& tokens[tokenPos+1].value === "if"
			&& tokens[tokenPos+2]
			&& tokens[tokenPos+2].value === "(";
	},
	identifyElse: function (tokens, tokenPos) {
		return tokens[tokenPos]
			&& tokens[tokenPos].value === "else"
			&& tokens[tokenPos+1]
			&& tokens[tokenPos+1].value === "{";
	},
};

var findLitValue = function (token) {
	if (token.barewordValue) {
		return token.barewordValue;
	} else if (typeof token.value === "string") {
		return token.value;
	} else {
		return false;
	}
};

zigzag.parseSingleZig = function (tokens, startPos) {
	// start from index of first matchable bracket
	var pos = startPos;
	var conditions = [];
	var conditionsInfo;
	var conditionsType = "none";
	if (tokens[pos].value === "(") {
		conditionsInfo = utils.collectBetween(tokens, pos, ")");
		if (!conditionsInfo || !conditionsInfo.success) {
			var errorObject = new Error(`Zigzag parseSingleZig: Collection failure! (Is matching ')' missing?)`);
			errorObject.tokenIndex = pos;
			errorObject.token = tokens[pos];
			errorObject.pos = tokens[pos].pos;
			throw errorObject;
		}
		pos = conditionsInfo.nextTokenIndex;
		// checking for multiple condition statements
		conditionsType = "single";
		var insert = [];
		conditionsInfo.collection.forEach(function (token) {
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
		var errorObject = new Error(`Zigzag parseSingleZig: Expected '{', found '${tokens[pos].value}'`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	var behaviorsInfo = utils.collectBetween(tokens, pos, "}");
	if (!behaviorsInfo || !behaviorsInfo.success) {
		var errorObject = new Error(`Zigzag parseSingleZig: Collection failure! (Is matching '}' missing?)`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	var report = {
		conditions: conditions,
		conditionsType: conditionsType,
		behaviors: behaviorsInfo.collection,
		nextTokenIndex: behaviorsInfo.nextTokenIndex,
		brackets: {
			curlyOpenToken: behaviorsInfo.startToken,
			curlyCloseToken: behaviorsInfo.endToken,
		},
	};
	if (conditionsInfo && conditionsInfo.success) {
		report.brackets.parenOpenToken = conditionsInfo.startToken;
		report.brackets.parenCloseToken = conditionsInfo.endToken;
	}
	return report;
};

zigzag.parseWholeZig = function (tokens, startTokenIndex) {
	// startTokenIndex should be a zigzag start: `if (...`
	// (We will confirm first!)
	var pos = startTokenIndex;
	if (!zigzag.identifyIf(tokens, pos)) {
		var errorObject = new Error(`Zigzag parseWholeZig: Token index ${startTokenIndex} not valid zigzag start. Cannot parse!`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	var rootToken = tokens[pos];
	// get past the "if"
	pos += 1;
	// get info out of `if ( _ ) { _ }`
	var statement = zigzag.parseSingleZig(tokens,pos);
	statement.rootToken = rootToken;
	// make it the first of (possibly) several /(if|else if|else)/ statements:
	var statements = [
		statement
	];
	var pos = statement.nextTokenIndex;
	while (pos < tokens.length) { // until we exhaust the tokens
		// check for an `else if` statement
		var elseIfCheck = zigzag.identifyElseIf(tokens, pos);
		if (elseIfCheck) {
			var elseIfRootToken = tokens[pos];
			pos += 2;
			var nextStatement = zigzag.parseSingleZig(tokens,pos);
			nextStatement.rootToken = elseIfRootToken;
			statements.push(nextStatement);
			var pos = nextStatement.nextTokenIndex;
			continue; // check for another `else if` statement
		}
		// check for an `else` statement
		var elseCheck = zigzag.identifyElse(tokens, pos);
		if (elseCheck) {
			var elseRootToken = tokens[pos];
			pos += 1;
			var nextStatement = zigzag.parseSingleZig(tokens,pos);
			nextStatement.rootToken = elseRootToken;
			statements.push(nextStatement);
			var pos = nextStatement.nextTokenIndex;
		}
		break; // nothing comes after an `else` so stop looping
	}
	// get the last statement
	var lastStatement = statements[statements.length - 1];
	var nextPos = lastStatement.nextTokenIndex;
	return {
		origTokenIndex: startTokenIndex, // what it was given
		statements: statements, // an array of zigzag.parseSingleZig() output
		nextTokenIndex: nextPos, // pick up from here
	};
};

var buildToken = function (_token, value, type, extra) {
	var token = JSON.parse(JSON.stringify(_token));
	token.value = value || "ZIGZAG " + token.pos; // change to provided or auto made
	token.type = type || token.type; // change to provided or use orig
	token.macro = "zigzag";
	if (extra !== undefined) {
		token.meta = extra;
	}
	return token;
};

var bodge = 0;
zigzag.expandZigzag = function (report, scriptNameToken) {
	var srcs = report.statements; // QOL

	bodge += 1;
	
	// CONVERGE TOKEN
	// info for the last curly (token) in the zigzag:
	var finalCurly = srcs[srcs.length - 1].brackets.curlyCloseToken;
	var forover = buildToken(
		finalCurly,
		"LABEL f" + finalCurly.pos,
		"bareword",
		"forover"
	);

	// other state:
	var topTokens = [];
	var tokenBatch = []; // when done, this will get glued to `ret`

	srcs.forEach(function (src, index) {

		// BASE TOKENS for this `if` / `else if` / `else` statement
		var curlyOpen = src.brackets.curlyOpenToken;
		var curlyClose = src.brackets.curlyCloseToken;

		// tokens for `if` and `{` and `}`
		var rootToken = src.rootToken; // `if` (all become `if` in final, even elsess)
		var bodyStart = buildToken(curlyOpen, null, "bareword", "bodyStart"); // {
		var bodyEnd = buildToken(curlyClose, null, "bareword", "bodyEnd"); // }
		bodyStart.value = "bodyStart " + bodyStart.value;
		bodyEnd.value = "bodyEnd " + bodyEnd.value;

		if (
			// explicitly "OR" in case I want to do "AND" someday separately:
			src.conditionsType === "OR"
			|| src.conditionsType === "single"
		) {
			// token info for `(` and `)`
			var parenOpen = src.brackets.parenOpenToken || null;
			var parenClose = src.brackets.parenCloseToken || null;
			var conditionStart = buildToken(parenOpen, null, "bareword", "conditionStart"); // (
			var conditionEnd = buildToken(parenClose, null, "bareword", "conditionEnd"); // )
			conditionStart.value = "conditionStart " + conditionStart.value;
			conditionEnd.value = "conditionEnd " + conditionEnd.value;

			src.conditions.forEach(function (condition) {
				// `if`
				topTokens.push(
					buildToken(rootToken, "if", "bareword", "zigzag"),
				);
				topTokens = topTokens.concat(
					// condition
					condition
				).concat([
					// `then goto label`
					buildToken(conditionEnd, "then", "bareword", "zigzag"),
					buildToken(bodyStart, "goto", "bareword", "zigzag"),
					buildToken(bodyStart, "label", "bareword", "zigzag"),
					// bodyStart `;`
					bodyStart,
					buildToken(bodyStart, ";", "operator", "zigzag"),
				]);
			})
			// (IN LOWER HALF OF EXPANDED TOKENS)
			tokenBatch = tokenBatch.concat([
				// bodyStart `:`
				bodyStart,
				buildToken(bodyStart, ":", "operator", "zigzag"),
			]).concat(
				// behavior
				src.behaviors,
			).concat([
				// `goto label` forover `;`
				buildToken(forover, "goto", "bareword", "zigzag"),
				buildToken(forover, "label", "bareword", "zigzag"),
				forover,
				buildToken(forover, ";", "operator", "zigzag"),
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
		if (index === srcs.length - 1) { // if it's the last statement
			// close the "default" script
			topTokens = topTokens.concat([
				// `goto label` forover `;`
				buildToken(forover, "goto", "bareword", "zigzag"),
				buildToken(forover, "label", "bareword", "zigzag"),
				forover,
				buildToken(forover, ";", "operator", "zigzag"),
			]);
		}
	});
	var combinedTokens = topTokens.concat(tokenBatch);
	// forover `:`
	combinedTokens = combinedTokens.concat([
		forover,
		buildToken(forover, ":", "operator", "zigzag"),
	]);
	return {
		tokens: combinedTokens,
		nextTokenIndex: report.nextTokenIndex,
	}
};

zigzag.processOnce = function (tokens) {
	var pos = 0;
	var crawledTokens = [];
	var punctuationStack = [];
	var naiveScriptNameToken = {};
	while (pos < tokens.length) {
		if (zigzag.identifyIf(tokens, pos)) { // we need to zigzag
			var zigReport = zigzag.parseWholeZig(tokens, pos);
			var zigzagResults = zigzag.expandZigzag(zigReport, naiveScriptNameToken);
			crawledTokens = crawledTokens.concat(zigzagResults.tokens);
			pos = zigzagResults.nextTokenIndex;
			continue;
		} else { // no zigzagging; mundane stuff
			var naiveValue = findLitValue(tokens[pos]);
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
					var errorObject = new Error(`Zigzag processOnce: Found "${naiveValue}" but no "${top}" to close!`)
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

zigzag.process = function (origTokens) { // natlang.parse looks for ".process()"
	// first check whether the whole lex object was passed by accident:
	var tokens = origTokens.success ? origTokens.tokens : origTokens;
	// (okay we're good now)	
	var origLength;
	var expandedTokens = tokens;
	var newLength = tokens.length;
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

zigzag.log = function (tokens) {
	var string = '';
	var bracketStack = [];
	var newline = false;
	tokens.forEach(function (token, index) {
		var tokenValue = token.barewordValue || token.value;
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
			if (tokenValue === 'goto' && tokens[index-1] && tokens[index-1].value !== 'then') {
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
