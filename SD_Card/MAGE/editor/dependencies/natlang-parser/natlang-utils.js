var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

var utils = {};

utils.syntaxDefaults = {
	matchingBrackets: [
		{ start: "{", end: "}" },
		{ start: "(", end: ")" },
		{ start: "[", end: "]" },
	]
};

/* collectBetween

Returns the tokens found between a pair of characters or strings. (Meant for matching bracket characters; arbitrary values would also work though.)

`tokenPos` should be the token containing the open bracket char. This start token is not included in the collection, but its `value` property is used as the open char for any nested bracket pairs, which will be entirely included in the collection.

The collection is successful only if the endChar is actually encountered. */

utils.collectBetween = (tokens, tokenPos, endChar) => {
	const startChar = tokens[tokenPos].value;
	const collection = [];
	let nested = 0;
	let success = false;
	let pos = tokenPos + 1;
	while (pos < tokens.length) {
		if (tokens[pos].value === startChar) {
			nested += 1;
		} else if (tokens[pos].value === endChar) {
			nested -= 1;
		}
		if (nested === -1) {
			success = true;
			pos += 1;
			break;
		} else {
			collection.push(tokens[pos]);
			pos += 1;
		}
	}
	return {
		success,
		collection,
		startChar,
		startToken: tokens[tokenPos],
		startTokenIndex: tokenPos,
		endChar,
		endToken: tokens[pos-1],
		endTokenIndex: pos-1,
		nextTokenIndex: pos,
	}
};

natlang.utils = utils;

if (typeof module === 'object') {
	module.exports = utils
}
