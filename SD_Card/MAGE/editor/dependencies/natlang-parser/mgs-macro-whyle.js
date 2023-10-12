// "use strict";

var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var utils = natlang.utils;

if (typeof module === 'object') {
	utils = require('./natlang-utils.js');
}

var whyle = {
	identifyWhyle: function (tokens, tokenPos) {
		return tokens[tokenPos]
			&& (
				tokens[tokenPos].value === "while"
				|| tokens[tokenPos].value === "for"
			)
			&& tokens[tokenPos+1]
			&& tokens[tokenPos+1].value === "(";
	},
};

var literalValue = function (token) {
	if (token.barewordValue) {
		return token.barewordValue;
	} else if (typeof token.value === "string") {
		return token.value;
	} else {
		return false;
	}
};

whyle.parseSingleWhyle = function (tokens, startPos) {
	// start from index of first matchable bracket
	var pos = startPos;
	if (tokens[pos].value !== "(") {
		var errorObject = new Error(`Whyle parseSingleWhyle: Collection failure! No '('?`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	var conditionsInfo = utils.collectBetween(tokens, pos, ")");
	if (!conditionsInfo || !conditionsInfo.success) {
		var errorObject = new Error(`Whyle parseSingleWhyle: Collection failure! (Is matching ')' missing?)`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	pos = conditionsInfo.nextTokenIndex;
	var conditions = conditionsInfo.collection;
	// collect behavior(s)
	if (tokens[pos].value !== "{") {
		var errorObject = new Error(`Whyle parseSingleWhyle: Expected '{', found '${tokens[pos].value}'`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	var behaviorsInfo = utils.collectBetween(tokens, pos, "}");
	if (!behaviorsInfo || !behaviorsInfo.success) {
		var errorObject = new Error(`Whyle parseSingleWhyle: Collection failure! (Is matching '}' missing?)`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	return {
		conditions: conditions,
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

whyle.parseWholeWhyle = function (tokens, startTokenIndex) {
	// startTokenIndex should be a while or for start: `while (...` (or `for`)
	// (We will confirm first!)
	var pos = startTokenIndex;
	if (!whyle.identifyWhyle(tokens, pos)) {
		var errorObject = new Error(`Whyle parseWholeWhyle: Token index ${startTokenIndex} not valid 'while' or 'for' start. Cannot parse!`);
		errorObject.tokenIndex = pos;
		errorObject.token = tokens[pos];
		errorObject.pos = tokens[pos].pos;
		throw errorObject;
	}
	var rootToken = tokens[pos];
	// get past the `while` (or `for`)
	pos += 1;
	// get info out of ( __ ) { __ }
	var statement = whyle.parseSingleWhyle(tokens, pos);
	statement.rootToken = rootToken;
	return {
		origTokenIndex: startTokenIndex, // what it was given
		statement: statement, // whyle.parseSingleWhyle() output
		nextTokenIndex: statement.nextTokenIndex, // pick up from here
		type: rootToken.value, // "while" or "for"
	};
};

var buildToken = function (_token, value, type, extra) {
	var token = JSON.parse(JSON.stringify(_token));
	token.value = value || "WHYLE " + token.pos; // change to provided or auto made
	token.type = type || token.type; // change to provided or use orig
	if (extra !== undefined) {
		token.meta = extra;
	}
	return token;
};

var parseForInner = function (inner) {
	var order = [ "initial", "condition", "increment" ];
	var result = {
		initial: [],
		condition: [],
		increment: [],
	}
	var chunk = 0;
	inner.forEach(function (token) {
		if (token.value === ";") {
			chunk += 1;
		} else {
			if (!result[order[chunk]]) {
				throw new Error("How many semicolons you got in this 'for', dude??");
			}
			result[order[chunk]].push(token);
		}
	})
	if (chunk !== 2) {
		throw new Error("You don't have enough semicolons in this 'for', bruh!");
	}
	if (result.condition.length === 0) {
		throw new Error("Put a condition in your 'for' please!");
	}
	return result;
};

whyle.expandWhyle = function (report, reportType) {
	var src = report.statement;

	var curlyOpen = src.brackets.curlyOpenToken;
	var curlyClose = src.brackets.curlyCloseToken;
	var parenOpen = src.brackets.parenOpenToken;
	var parenClose = src.brackets.parenCloseToken;

	var initial = [];
	var condition = src.conditions;
	var increment = [];

	var behaviors = src.behaviors || [];

	if (reportType === "for") {
		var inner = parseForInner(condition);
		initial = inner.initial;
		condition = inner.condition;
		increment = inner.increment;
	}

	// LABELS
	var rootToken = src.rootToken;             // while
	var loopcheck = buildToken(parenOpen, null, "bareword", "loopcheck");      // (
	var continuepoint = buildToken(parenClose, null, "bareword", "continuepoint"); // )
	var loopbody = buildToken(curlyOpen, null, "bareword", "loopbody");       // {
	var loopover = buildToken(curlyClose, null, "bareword", "loopover");      // }

	loopcheck.value = "loopcheck " + loopcheck.value;
	continuepoint.value = "continuepoint " + continuepoint.value;
	loopbody.value = "loopbody " + loopbody.value;
	loopover.value = "loopover " + loopover.value;
	

	// BREAK / CONTINUE

	var parsedBehaviors = [];
	behaviors.forEach(function (token) {
		if (token.value === "break") {
			parsedBehaviors.push(buildToken(token, "goto", "bareword", "break"));
			parsedBehaviors.push(buildToken(token, "label", "bareword", "break"));
			parsedBehaviors.push(buildToken(token, loopover.value, "bareword", "break"));
		} else if (token.value === "continue") {
			parsedBehaviors.push(buildToken(token,"goto", "bareword", "continue"));
			parsedBehaviors.push(buildToken(token,"label", "bareword", "continue"));
			parsedBehaviors.push(buildToken(token, continuepoint.value, "bareword", "continue"));
		} else {
			parsedBehaviors.push(token);
		}
	})
	behaviors = parsedBehaviors;
	
	// THE REST OF THE OWL

	// while ( CONDITION ) { CODE } =>
	// for (INITIAL; CONDITION; INCREMENT) { CODE } =>

	var tokens = initial // INITIAL (`for` only)
	.concat([
		// goto label $loopcheck
		buildToken(rootToken, "goto", "bareword", reportType),
		buildToken(rootToken, "label", "bareword", reportType),
		buildToken(rootToken, loopcheck.value, "bareword", reportType),
		// loopbody :
		loopbody,
		buildToken(loopbody, ":", "operator"),
	])
	.concat(behaviors) // CODE
	.concat([
		// continuepoint :
		continuepoint,
		buildToken(continuepoint, ":", "operator"),
	])
	.concat(increment) // INCREMENT (`for` only)
	.concat([
		// loopcheck :
		loopcheck,
		buildToken(loopcheck, ":", "operator"),
		// if (
		buildToken(loopcheck, "if"),
		parenOpen,
	])
	.concat(condition) // CONDITION
	.concat([
		// ) {
		parenClose,
		buildToken(parenClose, "{", "operator"),
		// goto label loopbody
		buildToken(parenClose, "goto", "bareword", "goto label loopbody"),
		buildToken(parenClose, "label", "bareword", "goto label loopbody"),
		buildToken(parenClose, loopbody.value, "bareword", "goto label loopbody"),
		buildToken(parenClose, "}", "operator", "goto label loopbody"),
		// loopover :
		loopover,
		buildToken(loopover, ":", "operator"),
	]);
	return tokens;
};

whyle.processOnce = function (tokens) {
	var pos = 0;
	var crawledTokens = [];
	var punctuationStack = [];
	var naiveScriptNameToken = {}; // why the crap was I using this??
	while (pos < tokens.length) {
		if (whyle.identifyWhyle(tokens, pos)) {
			var info = whyle.parseWholeWhyle(tokens, pos);
			var expanded = whyle.expandWhyle(info, info.type);
			crawledTokens = crawledTokens.concat(expanded);
			pos = info.nextTokenIndex;
			continue;
		} else { // no whiling; mundane stuff
			var naiveValue = literalValue(tokens[pos]);
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
					var errorObject = new Error(`Whyle processOnce: Found "${naiveValue}" but no "${top}" to close!`)
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

whyle.process = function (origTokens) { // natlang.parse looks for ".process()"
	// first check whether the whole lex object was passed by accident:
	var tokens = origTokens.success ? origTokens.tokens : origTokens;
	// (okay we're good now)
	var origLength;
	var newLength = tokens.length;
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

whyle.log = function (tokens) {
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

window.whyle = whyle;

if (typeof module === 'object') {
	module.exports = whyle
}
