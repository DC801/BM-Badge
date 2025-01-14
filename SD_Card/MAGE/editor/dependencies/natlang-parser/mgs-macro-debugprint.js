// "use strict";

var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var utils = natlang.utils;

if (typeof module === 'object') {
	utils = require('./natlang-utils.js');
}

var debugprint = {};

const buildDebugToken = (rawToken, value, type, extra) => {
	const token = JSON.parse(JSON.stringify(rawToken));
	token.value = value || "DEBUG " + token.pos; // change to provided or auto made
	token.type = type || token.type; // change to provided or use orig
	if (extra !== undefined) token.meta = extra;
	return token;
};

debugprint.process = origTokens => {
	// first check whether the whole lex object was passed by accident:
	const tokens = origTokens.success ? origTokens.tokens : origTokens;
	// (okay we're good now)
	let tokenPos = 0;
	let outputTokens = [];
	while (tokenPos < tokens.length) {
		if (tokens[tokenPos].value === "debug!") {
			const collection = utils.collectBetween(tokens, tokenPos+1, ")");
			if (!collection.success) {
				const errorObject = new Error(`debugprint.process: collection failure`);
				errorObject.tokenIndex = tokenPos;
				errorObject.token = tokens[tokenPos];
				errorObject.pos = tokens[tokenPos].pos;
				throw errorObject;
			}
			const rootToken = JSON.parse(JSON.stringify(tokens[tokenPos]));
			const bracketOpenToken = JSON.parse(JSON.stringify(tokens[tokenPos +1]));
			tokenPos = collection.nextTokenIndex;
			const bracketCloseToken = JSON.parse(JSON.stringify(tokens[tokenPos -1]));
			// if (tokens[tokenPos].value !== ";") {
			// 	throw new Error (`Expected semicolon after debug!() macro! (Found '${tokens[tokenPos].value}')`);
			// }
			// tokenPos += 1; //(skipping over semicolon)
			// replacing :
			outputTokens = outputTokens.concat([
				buildDebugToken(rootToken, "if", "bareword", "debugprint: condition"),
				buildDebugToken(rootToken, "(", "operator", "debugprint: condition"),
				buildDebugToken(rootToken, "debug", "bareword", "debugprint: condition"),
				buildDebugToken(rootToken, "mode", "bareword", "debugprint: condition"),
				buildDebugToken(rootToken, "is", "bareword", "debugprint: condition"),
				buildDebugToken(rootToken, true, "boolean", "debugprint: condition"),
				buildDebugToken(rootToken, ")", "operator", "debugprint: condition"),
				buildDebugToken(rootToken, "{", "operator", "debugprint: condition"),
				buildDebugToken(rootToken, "show", "bareword", "debugprint: serial dialog"),
				buildDebugToken(rootToken, "serial", "bareword", "debugprint: serial dialog"),
				buildDebugToken(rootToken, "dialog", "bareword", "debugprint: serial dialog"),
				buildDebugToken(bracketOpenToken, "{", "operator", "debugprint: serial dialog"),
			])
			.concat(collection.collection)
			.concat([
				buildDebugToken(bracketCloseToken, "}", "operator", "debugprint: serial dialog"),
				buildDebugToken(bracketCloseToken, "}", "operator", "debugprint: condition"),
			]);
		} else {
			outputTokens.push(tokens[tokenPos]);
			tokenPos += 1;
		}
	}
	return outputTokens;
};

debugprint.log = function (tokens) { // THIS WAS COPIED todo: figure out the data flow
	const bracketStack = [];
	let logBody = '';
	let newline = false;
	tokens.forEach((token, i) => {
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
			if (tokenValue === 'goto' && tokens[i-1] && tokens[i-1].value !== 'then') {
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

window.debugprint = debugprint;

if (typeof module === 'object') {
	module.exports = debugprint
}
