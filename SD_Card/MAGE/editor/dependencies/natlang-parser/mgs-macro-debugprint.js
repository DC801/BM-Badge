// "use strict";

var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var utils = natlang.utils;

if (typeof module === 'object') {
	utils = require('./natlang-utils.js');
}

var debugprint = {};

var buildToken = function (_token, value, type, extra) {
	var token = JSON.parse(JSON.stringify(_token));
	token.value = value || "WHYLE " + token.pos; // change to provided or auto made
	token.type = type || token.type; // change to provided or use orig
	if (extra !== undefined) {
		token.meta = extra;
	}
	return token;
};

debugprint.process = function (origTokens) {
	// first check whether the whole lex object was passed by accident:
	var tokens = origTokens.success ? origTokens.tokens : origTokens;
	// (okay we're good now)
	var tokenPos = 0;
	var outputTokens = [];
	while (tokenPos < tokens.length) {
		if (tokens[tokenPos].value === "debug!") {
			var collection = utils.collectBetween(tokens, tokenPos+1, ")");
			if (!collection.success) {
				var errorObject = new Error(`debugprint.process: collection failure`);
				errorObject.tokenIndex = tokenPos;
				errorObject.token = tokens[tokenPos];
				errorObject.pos = tokens[tokenPos].pos;
				throw errorObject;
			}
			var rootToken = JSON.parse(JSON.stringify(tokens[tokenPos]));
			var bracketOpenToken = JSON.parse(JSON.stringify(tokens[tokenPos +1]));
			tokenPos = collection.nextTokenIndex;
			var bracketCloseToken = JSON.parse(JSON.stringify(tokens[tokenPos -1]));
			// if (tokens[tokenPos].value !== ";") {
			// 	throw new Error (`Expected semicolon after debug!() macro! (Found '${tokens[tokenPos].value}')`);
			// }
			// tokenPos += 1; //(skipping over semicolon)
			// replacing :
			outputTokens = outputTokens.concat([
				buildToken(rootToken, "if", "bareword", "debugprint: condition"),
				buildToken(rootToken, "(", "operator", "debugprint: condition"),
				buildToken(rootToken, "debug", "bareword", "debugprint: condition"),
				buildToken(rootToken, "mode", "bareword", "debugprint: condition"),
				buildToken(rootToken, "is", "bareword", "debugprint: condition"),
				buildToken(rootToken, true, "boolean", "debugprint: condition"),
				buildToken(rootToken, ")", "operator", "debugprint: condition"),
				buildToken(rootToken, "{", "operator", "debugprint: condition"),
				buildToken(rootToken, "show", "bareword", "debugprint: serial dialog"),
				buildToken(rootToken, "serial", "bareword", "debugprint: serial dialog"),
				buildToken(rootToken, "dialog", "bareword", "debugprint: serial dialog"),
				buildToken(bracketOpenToken, "{", "operator", "debugprint: serial dialog"),
			])
			.concat(collection.collection)
			.concat([
				buildToken(bracketCloseToken, "}", "operator", "debugprint: serial dialog"),
				buildToken(bracketCloseToken, "}", "operator", "debugprint: condition"),
			]);
		} else {
			outputTokens.push(tokens[tokenPos]);
			tokenPos += 1;
		}
	}
	return outputTokens;
};

debugprint.log = function (tokens) { // THIS WAS COPIED todo: figure out the data flow
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

window.debugprint = debugprint;

if (typeof module === 'object') {
	module.exports = debugprint
}
