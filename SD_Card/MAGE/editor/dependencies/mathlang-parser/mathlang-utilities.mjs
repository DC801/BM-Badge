// ---------------------- ERROR MESSAGE HANDLING ---------------------- 

export const findLineAndCharNumbers = (input, pos) => {
	const splits = input.substring(0,pos).split('\n')
	const charCount = splits[splits.length - 1].length;
	const wholeString = input.split('\n')
	const lineNumber = splits.length;
	return {
		row: lineNumber,
		col: charCount+1,
		lineString: wholeString[lineNumber - 1],
		char: input[pos]
	};
};

export const getPosContext = (inputString, origPos, message, fileName) => {
	let printFileName = fileName ? `"${fileName}" l` : 'L';
	let pos = origPos;
	let errorCoords = findLineAndCharNumbers(inputString, pos);
	let arrow = '~'.repeat(errorCoords.col) + '^';
	let lineString = errorCoords.lineString.replace(/\t/g,' ');
	while (lineString.replace(/[\s\t]/g, '').length === 0) {
		pos -= 1;
		errorCoords = findLineAndCharNumbers(inputString, pos);
		arrow = '~'.repeat(errorCoords.col) + '^';
		lineString = errorCoords.lineString.replace(/\t/g,' ');
	}
	const newMessage
		= `\n╓ ${printFileName}ine ${errorCoords.row}:${errorCoords.col}: ${message}`
		+ '\n║ ' + `${lineString}`
		+ '\n╙' + arrow
	return newMessage;
};

const printParseMessage = (inputString, pos, message, fileName, messageType) => {
	const fancyMessage = getPosContext(inputString, pos, message, fileName);
	if (messageType === "error") {
		console.error(fancyMessage);
	} else if (messageType === "warning") {
		console.warn(fancyMessage);
	} else {
		console.log(fancyMessage);
	}
};

// ---------------------- PRETTY PRINT EXPRESSIONS ---------------------- 

// as of tree revision I doubt any of this still works

const indentSpace = '  ';
const conditionPrint = {
	operand: (node, indent) => {
		if (node.node === 'boolean_literal') return `${node.label}:${node.value}`;
		const lines = [
			`${node.node} -->`,
			conditionPrint[node.node](node, indentSpace),
		];
		return lines.join('\n')
			.split('\n').map(s=>indent+s).join('\n');
	},
	boolean_literal: (node, indent) => `${node.label}:${node.value}`,
	unary_expression: (node, indent) => {
		const lines = [
			'op = ' + node.operator.value,
			'operand = ' + conditionPrint.operand(node.operand, indentSpace).trim(),
		]
		return lines.join('\n')
			.split('\n').map(s=>indent+s).join('\n');
	},
	grouping: (node, indent) => {
		const inner = node.group;
		const header = `${inner.node} -->\n`;
		const fn = conditionPrint[inner.node];
		return header + fn(inner, indent);
	},
	binary_expression: (node, indent) => {
		const lines = [
			'op = ' + node.operator.value,
			'lhs = ' + conditionPrint.operand(node.lhs, indentSpace).trim(),
			'rhs = ' + conditionPrint.operand(node.rhs, indentSpace).trim(),
		]
		return lines.join('\n')
			.split('\n').map(s=>indent+s).join('\n');
	}
};
export const printCondition = (node) => {
	const header = `------ ${node.node} ------\n`;
	const message = header
		+ conditionPrint[node.node](node, '');
	console.log(message);
	return header;
};

// ---------------------- PRETTY PRINT NODES ---------------------- 

export const printNode = (origNode) => {
	const node = JSON.parse(JSON.stringify(origNode));
	if (node.node === 'script_definition') {
		const body = node.body;
		delete node.body;
		return printNodeGeneric(node)
			+ '\n'
			+ body.map(printAction).join('\n\n');
	} if (node.node === 'dialog_definition') {
		const dialogs = node.dialogs;
		delete node.dialogs;
		const top = printNodeGeneric(node) + '\n';
		const bot = dialogs.map(dialog=>{
			return printNodeGeneric(dialog, 1)
		}).join('\n\n');;
		return top+bot;
	} else {
		return printNodeGeneric(node);
	}
};

const printNodeGeneric = (node) => {
	const header = `---- ${node.node} ---- tokens ${node.startPos} thru ${node.tokenPos}\n`
	delete node.node;
	delete node.startPos;
	delete node.tokenPos;
	delete node.debug;
	if (
		node.malformed !== undefined
		&& node.malformed === false
	) {
		delete node.malformed;
	}
	const space = '   ';
	const result = header + JSON.stringify(node, null, space)
		.replace(/^[\[\{]/,'')
		.replace(/[\]\}]$/,'')
		// .replaceAll('\n'+space,'\n');
	return result;
};
const printAction = (node) => {
	const space = '   ';
	const header = `${space}---- ${node.node} ---- tokens ${node.startPos} thru ${node.tokenPos}\n`
	const workingNode = JSON.parse(JSON.stringify(node));
	delete workingNode.node;
	delete workingNode.startPos;
	delete workingNode.tokenPos;
	delete workingNode.debug;
	return header + JSON.stringify(workingNode, null, space)
		.replace(/^\{\n/,'')
		.replace(/\n\}$/,'')
		.split('\n')
		.map(s=>space+s)
		.join('\n');
};

// ---------------------- GENERAL ---------------------- 

export const makeAutoIdentifierName = (input, pos, fileName) => {
	const coords = findLineAndCharNumbers(input, pos);
	return fileName+':'+coords.row +':'+coords.col;
};

export const errorRecoverPos = (tokens, firstMismatched, terminatorTwig) => {
	const endTokensPos = {
		terminatorPos: null,
		newlinePos: null,
	};
	let tokenPos = firstMismatched - 1; // change to "last to kind of match" token
	let foundTerminator = false;
	let foundNewline = false;
	// advance tokens until you hit both a terminator token and newline token
	if (!terminatorTwig) foundTerminator = true;
	while (tokenPos < tokens.length) {
		const token = tokens[tokenPos];
		if (token.type === 'newline') {
			if (!foundNewline) {
				endTokensPos.newlinePos = tokenPos;
				foundNewline = true;
				if (foundTerminator) break;
			}
		} else {
			if (!foundTerminator) {
				if (terminatorTwig.type === 'literal') {
					if (token.value === terminatorTwig.value) {
						endTokensPos.terminatorPos = tokenPos;
						foundTerminator = true;
						if (foundNewline) break;
					};
				} else if (terminatorTwig.type === 'capture') {
					found = decayTo[terminatorTwig.value](token);
					if (found) {
						endTokensPos.terminatorPos = tokenPos;
						foundTerminator = true;
						if (foundNewline) break;
					}
				}
			}
		}
		tokenPos += 1;
	}
	const continuePos = endTokensPos.terminatorPos !== null
	? endTokensPos.terminatorPos + 1
	: endTokensPos.newlinePos !== null
		? endTokensPos.newlinePos + 1
		: firstMismatched;
	return continuePos;
};

export const decayTo = {
	// needs to be `null` because sometimes it's `false` or `0`
	EOF: token => token.type === 'EOF' ? token.type : null,
	bareword: token => {
		if (token.type === "bareword") return token.value;
		if (token.barewordValue) return token.barewordValue;
		return null;
	},
	operator: token => token.type === "operator" ? token.value : null,
	color: token => token.type === "color" ? token.value : null,
	boolean: token => token.type === "boolean" ? token.value : null,
	quoted_string: token => token.type === "quoted_string" ? token.value : null,
	number: token => token.type === "number" ? token.value : null,
	duration: token => token.type === "duration" || token.type === "number" ? token.value : null,
	distance: token => token.type === "distance" || token.type === "number" ? token.value : null,
	quantity: token => token.type === "quantity" || token.type === "number" ? token.value : null,
	constant: token => token.type === "constant" ? token.value : null,
	string: token => {
		const bareWord = decayTo.bareword(token);
		if (bareWord) return bareWord;
		if (token.type === "quoted_string") return token.value;
		return null;
	},
};
