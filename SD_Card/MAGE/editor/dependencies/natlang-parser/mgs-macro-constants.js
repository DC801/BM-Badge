// "use strict";

var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var utils = natlang.utils;

if (typeof module === 'object') {
	utils = require('./natlang-utils.js');
}

var constants = {};

constants.barewordValue = function (token) {
	if (!token) {
		throw new Error (`constants.barewordValue: Token out of bounds!`);
	}
	if (token.barewordValue) {
		return token.barewordValue;
	}
	if (token.type === "bareword") {
		return token.value;
	}
	return false; // won't conflict with boolean `false` because we're using the barewordValue
}

constants.isConstant = function (token) {
	// should be bareword `$_____`
	var barewordValue = constants.barewordValue(token);
	if (barewordValue) {
		return barewordValue[0] === '$' ? barewordValue : false;
	}
	return false;
};

constants.isDeclaration = function (tokens, tokenPos) {
	var constName = constants.isConstant(tokens[tokenPos]);
	if (!constName) {
		return false;
	}
	if (!tokens[tokenPos+1] || !tokens[tokenPos+2]) {
		return false;
	}
	if (tokens[tokenPos+1].value === "=" && tokens[tokenPos+2].type !== "operator") {
		return {
			name: constName,
			value: tokens[tokenPos+2] // NOTE: this is a token, not a bare value!
		}
	}
	return false;
};

constants.process = function (origTokens) {
	// first check whether the whole lex object was passed by accident:
	var tokens = origTokens.success ? origTokens.tokens : origTokens;
	// (okay we're good now)
	var declaredConstants = {};
	var tokenPos = 0;
	var outputTokens = [];
	while (tokenPos < tokens.length) {
		if (tokens[tokenPos].value === "const!") {
			var collection = utils.collectBetween(tokens, tokenPos+1, ")");
			if (!collection.success) {
				var errorObject = new Error(`constants.process: collection failure`);
				errorObject.tokenIndex = tokenPos;
				errorObject.token = tokens[tokenPos];
				errorObject.pos = tokens[tokenPos].pos;
				throw errorObject;
			}
			tokenPos = collection.nextTokenIndex;
			// // eating semicolon
			// if (tokens[tokenPos].value !== ";") {
			// 	throw new Error (`Expected semicolon after const!() macro! (Found '${tokens[tokenPos].value}')`);
			// }
			// tokenPos += 1;
			// replacing :
			// consuming what we collected:
			var declarationPos = 0;
			var declarationTokens = collection.collection;
			while (declarationPos < declarationTokens.length) {
				var declaration = constants.isDeclaration(declarationTokens, declarationPos);
				if (!declaration) {
					var errorObject = new Error(`constants.process: invalid constant declaration!`);
					errorObject.tokenIndex = tokenPos;
					errorObject.token = declarationTokens[declarationPos];
					errorObject.pos = declarationTokens[declarationPos].pos;
					throw errorObject;
				}
				// found `$varName = value`
				if (declaredConstants[declaration.name]) {
					var errorObject = new Error(`constants.process: cannot redefine '${declaration.name}' (already assigned value: '${declaredConstants[declaration.name].value}')`);
					errorObject.tokenIndex = tokenPos;
					errorObject.token = declarationTokens[declarationPos];
					errorObject.pos = declarationTokens[declarationPos].pos;
					throw errorObject;
				}
				var valueToken = JSON.parse(JSON.stringify(declaration.value));
				valueToken.declarationName = declaration.name;
				valueToken.macro = "constants";
				declaredConstants[declaration.name] = valueToken;
				declarationPos += 3;
			}
		} else {
			var constName = constants.isConstant(tokens[tokenPos]);
			if (constName) { // found `$varName`
				var valueToken = declaredConstants[constName];
				if (!valueToken) {
					var errorObject = new Error(`constants.process: ${constName} is undefined! (inputString pos: ${tokens[tokenPos].pos})`);
					errorObject.tokenIndex = tokenPos;
					errorObject.token = tokens[tokenPos];
					errorObject.pos = tokens[tokenPos].pos;
					throw errorObject;
				}
				var useToken = tokens[tokenPos];
				// valueToken = the `$varName` declaration token
				// useToken = the in-context `$varName` token
				var insertToken = JSON.parse(JSON.stringify(valueToken));
				insertToken.declarationPos = insertToken.pos;
				insertToken.pos = useToken.pos;
				outputTokens.push(insertToken);
			} else {
				outputTokens.push(tokens[tokenPos]);
			}
			tokenPos += 1;
		}
	}
	return outputTokens;
};

constants.log = function (tokens) { // THIS WAS COPIED todo: figure out the data flow
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

window.constants = constants;

if (typeof module === 'object') {
	module.exports = constants
}
