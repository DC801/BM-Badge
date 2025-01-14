// "use strict";

var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var utils = natlang.utils;

if (typeof module === 'object') {
	utils = require('./natlang-utils.js');
}

var constants = {};

constants.barewordValue = token => {
	if (!token)  throw new Error (`constants.barewordValue: Token out of bounds!`);
	if (token.barewordValue)  return token.barewordValue;
	if (token.type === "bareword")  return token.value;
	return false; // won't conflict with boolean `false` because we're using the barewordValue
}

constants.isConstant = token => {
	// should be bareword `$_____`
	const barewordValue = constants.barewordValue(token);
	return barewordValue?.[0] === '$' ? barewordValue : false;
};

constants.isDeclaration = (tokens, tokenPos) => {
	const constName = constants.isConstant(tokens[tokenPos]);
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

constants.process = origTokens => {
	// first check whether the whole lex object was passed by accident:
	const tokens = origTokens.success ? origTokens.tokens : origTokens;
	// (okay we're good now)
	const declaredConstants = {};
	const outputTokens = [];
	let tokenPos = 0;
	while (tokenPos < tokens.length) {
		if (tokens[tokenPos].value === "const!") {
			const collection = utils.collectBetween(tokens, tokenPos+1, ")");
			if (!collection.success) {
				const errorObject = new Error(`constants.process: collection failure`);
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
			let declarationPos = 0;
			const declarationTokens = collection.collection;
			while (declarationPos < declarationTokens.length) {
				const declaration = constants.isDeclaration(declarationTokens, declarationPos);
				if (!declaration) {
					const errorObject = new Error(`constants.process: invalid constant declaration!`);
					errorObject.tokenIndex = tokenPos;
					errorObject.token = declarationTokens[declarationPos];
					errorObject.pos = declarationTokens[declarationPos].pos;
					throw errorObject;
				}
				// found `$varName = value`
				if (declaredConstants[declaration.name]) {
					const errorObject = new Error(`constants.process: cannot redefine '${declaration.name}' (already assigned value: '${declaredConstants[declaration.name].value}')`);
					errorObject.tokenIndex = tokenPos;
					errorObject.token = declarationTokens[declarationPos];
					errorObject.pos = declarationTokens[declarationPos].pos;
					throw errorObject;
				}
				const valueToken = JSON.parse(JSON.stringify(declaration.value));
				valueToken.declarationName = declaration.name;
				valueToken.macro = "constants";
				declaredConstants[declaration.name] = valueToken;
				declarationPos += 3;
			}
		} else {
			const constName = constants.isConstant(tokens[tokenPos]);
			if (constName) { // found `$varName`
				const valueToken = declaredConstants[constName];
				if (!valueToken) {
					const errorObject = new Error(`constants.process: ${constName} is undefined! (inputString pos: ${tokens[tokenPos].pos})`);
					errorObject.tokenIndex = tokenPos;
					errorObject.token = tokens[tokenPos];
					errorObject.pos = tokens[tokenPos].pos;
					throw errorObject;
				}
				const useToken = tokens[tokenPos];
				// valueToken = the `$varName` declaration token
				// useToken = the in-context `$varName` token
				const insertToken = JSON.parse(JSON.stringify(valueToken));
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

constants.log = tokens => { // THIS WAS COPIED todo: figure out the data flow
	const bracketStack = [];
	let logBody = '';
	let newline = false;
	tokens.forEach((token, i) => {
		var tokenValue = token.barewordValue || token.value;
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
		logBody: logBody,
		logType: "mgs",
		raw: tokens
	};
}

window.constants = constants;

if (typeof module === 'object') {
	module.exports = constants
}
