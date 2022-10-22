// "use strict";

var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var utils = natlang.utils;

if (typeof module === 'object') {
	utils = require('./natlang-utils.js');
}

var bracketMap = [
	{ start: "{", end: "}" },
	{ start: "(", end: ")" },
];
var findOpenChar = function (endChar) {
	var charEntry = bracketMap.find(function (object) {
		return object.end === endChar;
	})
	return charEntry ? charEntry.start : false;
};
var findCloseChar = function (openChar) {
	var charEntry = bracketMap.find(function (object) {
		return object.start === openChar;
	})
	return charEntry ? charEntry.end : false;
};

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
		bracketInfo: {},
	};
	if (conditionsInfo && conditionsInfo.success) {
		report.bracketInfo.conditionStartToken = conditionsInfo.startToken;
		report.bracketInfo.conditionEndToken = conditionsInfo.endToken;
	}
	report.bracketInfo.behaviorsStartToken = behaviorsInfo.startToken;
	report.bracketInfo.behaviorsEndToken = behaviorsInfo.endToken;
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
	var ifRootToken = tokens[pos];
	// get past the "if"
	pos += 1;
	// get info out of `if ( * ) { * }`
	var ifStatement = zigzag.parseSingleZig(tokens,pos);
	ifStatement.rootToken = ifRootToken;
	// make it the first of (possibly) several /(if|else if|else)/ statements:
	var statements = [
		ifStatement
	];
	var pos = ifStatement.nextTokenIndex;
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

zigzag.expandZigzag = function (zigReport, scriptNameToken) {
	var scriptName = scriptNameToken.value;
	var statements = zigReport.statements;
	// info for the last curly (token) in the zigzag:
	var lastStatement = statements[statements.length - 1];
	var finalCurlyToken = lastStatement.bracketInfo.behaviorsEndToken; // reused a lot
	var convergedScriptName = scriptName + "-CONVERGED" + finalCurlyToken.pos;
	// (doing it this way so that wrapped strings and barewords will both work):
	var convergedScriptNameToken = JSON.parse(JSON.stringify(scriptNameToken));
	convergedScriptNameToken.pos = finalCurlyToken.pos;
	convergedScriptNameToken.value = convergedScriptName;
	convergedScriptNameToken.macro = "zigzag";
	// other state:
	var result = []; // going at the top (to glue on to where we found the zigzag)
	var tokensToAppend = []; // when done, this will get glued to `result` ^
	statements.forEach(function (statement, index) {
		if (
			// explicitly "OR" in case I want to do "AND" someday separately:
			statement.conditionsType === "OR"
			|| statement.conditionsType === "single"
		) {
			// ONCE PER STATEMENT e.g. if ( _ ) { **** }
			// procedural script info
			var closeParenToken = statement.bracketInfo.conditionEndToken;
				//^MOVE: `then`
				// MOVE: `goto`
			var openCurlyToken = statement.bracketInfo.behaviorsStartToken;
				//^MOVE: procedural BRANCH script name
				// MOVE: declaration of procedural BRANCH script name
				// MOVE: `{`
				// also use this pos for the BRANCH script name itself
			var zigScriptName = scriptName + "-BRANCH" + openCurlyToken.pos;
			var zigScriptNameToken = JSON.parse(JSON.stringify(scriptNameToken));
			zigScriptNameToken.pos = openCurlyToken.pos;
			zigScriptNameToken.value = zigScriptName;
			zigScriptNameToken.macro = "zigzag";
			var closeCurlyToken = statement.bracketInfo.behaviorsEndToken;
				//^VERBATIM: end of procedural branch script: `}`

			// ONE CONDITION AT A TIME e.g. if ( ** || ** || ** ) { _ }
			statement.conditions.forEach(function (singleCondition) { // each condition gets one "line" in the output token array
				// `if`
				result.push({
					pos: statement.rootToken.pos,
					type: "bareword",
					value: "if", // hardcoded; this might be `else` in the orig token!
					macro: "zigzag"
				});
				// condition(s)
				result = result.concat(singleCondition);
				// faking `then`
				result.push({
					pos: closeParenToken.pos,
					type: "bareword",
					value: "then",
					macro: "zigzag"
				});
				// faking `goto`
				result.push({
					pos: closeParenToken.pos,
					type: "bareword",
					value: "goto",
					macro: "zigzag"
				});
				// faking `_____` (scriptname)
				result.push(zigScriptNameToken);
			})

			// Making the (shared) procedural BRANCH script
			// (put these in `tokensToAppend` instead of `result`)

			// BRANCH script name declaration
			tokensToAppend.push(zigScriptNameToken);
			// {
			tokensToAppend.push({
				pos: openCurlyToken.pos,
				type: "operator",
				value: "{",
				macro: "zigzag"
			});
			// behavior body
			tokensToAppend = tokensToAppend.concat(statement.behaviors);
			// goto procedural CONVERGED script
			var closeCurlyToken = statement.bracketInfo.behaviorsEndToken;
			tokensToAppend.push({
				pos: closeCurlyToken.pos,
				type: "bareword",
				value: "goto",
				macro: "zigzag"
			});
			tokensToAppend.push(convergedScriptNameToken);
			// }
			tokensToAppend.push({
				pos: closeCurlyToken.pos,
				type: "operator",
				value: "}",
				macro: "zigzag"
			});
		} else if (
			statement.conditionsType === "none" // no conditions found
			|| !statement.conditions.length // fallback: conditions array is empty
		) { // end of the zigzag; default (fallthrough) script behavior follows
			// default behavior body
			result = result.concat(statement.behaviors);
			// goto procedural CONVERGED script
			var closeCurlyToken = statement.bracketInfo.behaviorsEndToken;
		}
		if (index === statements.length - 1) { // if it's the last statement
			// close the "default" script
			result.push({
				pos: closeCurlyToken.pos,
				type: "bareword",
				value: "goto",
				macro: "zigzag"
			});
			result.push(convergedScriptNameToken);
			// }
			result.push({
				pos: closeCurlyToken.pos,
				type: "operator",
				value: "}",
				macro: "zigzag"
			});
		}
	});
	var combinedTokens = result.concat(tokensToAppend);//
	combinedTokens.push(convergedScriptNameToken)
	combinedTokens.push({
		"pos": convergedScriptNameToken.pos + 1,
		"type": "operator",
		"value": "{",
		"macro": "zigzag"
	})
	return {
		tokens: combinedTokens,
		nextTokenIndex: zigReport.nextTokenIndex,
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
