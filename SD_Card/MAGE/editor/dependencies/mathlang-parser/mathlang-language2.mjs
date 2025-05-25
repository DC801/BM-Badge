const getWordReport = (word) => {
	const literal = word.match(/^'(.+?)'/);
	const remainder = literal
		? word.replace(literal[0], '')
		: word;
	const fragments = remainder.length > 0
		? remainder.split(/\b/g)
		: [];
	const token = {
		original: word,
		rep: '',
		type: literal ? 'literal' : '',
		value: literal ? literal[1] : '',
	}
	if (
		fragments[fragments.length-1] === '?'
		|| fragments[fragments.length-1] === '*'
		|| fragments[fragments.length-1] === '+'
	) {
		token.rep = fragments.pop();
	}
	while (fragments.length > 0) {
		if (fragments.length % 2 !== 0) {
			throw new Error(`Subpattern not built up from pairs in ${word}`);
		}
		const left = fragments.shift();
		const right = fragments.shift();
		if (!/[a-zA-Z_]+/.test(right)) {
			throw new Error("Right half is not a word: " + left + right);
		}
		if (left === '$') {
			token.type = 'capture';
			token.value = right;
		} else if (left === '@') {
			token.type = 'lookup';
			token.value = right;
		} else if (left === ':') {
			token.label = right;
		}
		if (left.includes("<")) {
			token.fromCollection = right;
		}
		if (left.includes(">")) {
			token.toCollection = right;
		}
		if (token.type === '') throw new Error("Unknown token sigil: " + left + right);
	}
	return token;
};

const test = getWordReport(`'default':target`);



const NEWLINE_OR_SEMICOLON = [
	{ value: ';' },
	{ type: 'newline' },
];
const NEWLINE_OR_CLOSE_CURLY = [
	{ value: '}' },
	{ type: 'newline' },
];


const patterns2 = {
	include_macro: {
		pattern: `'include' $quoted_string:fileName<fileNames ';'`,
		recovery: {
			type: 'fastForward',
			until:  [
				{ value: ';' },
				{ type: 'newline' },
			]
		},
	},
	constant_assignment: {
		pattern: `$constant:constantName>constantNames '=' @constant_value:value ';'`,
		recovery: {
			type: 'fastForward',
			until:  [
				{ value: ';' },
				{ type: 'newline' },
			]
		},
	},
	constant_value: {
		pattern: `$number | $bareword | $quoted_string
			| $boolean | $constant<constantNames
			| $duration | $quantity | $distance | $color`,
		recovery: {
			type: 'skip'
		},
	},
	add_serial_dialog_settings: {
		pattern: `'add' 'serial_dialog' 'settings' '{'
			@serial_dialog_parameter*
		'}'`,
		recovery: {
			type: 'fastForward',
			until:  [
				{ value: '}' },
				{ type: 'newline' },
			]
		},
	},
	serial_dialog_parameter: {
		pattern: `'wrap':property $number:value`,
		// when it's in an "inner" thing it should always try parent "next" value first
		// THEN try to do the recovery process
		recovery: {
			type: 'retry'
		},
	},
	add_dialog_settings: {
		pattern: `'add' 'dialog' 'settings' '{'
			@dialog_settings_target*
		'}'`,
		recovery: {
			type: 'fastForward',
			until:  [
				{ value: '}' },
				{ type: 'newline' },
			]
		},
	},
	dialog_settings_target: {
		pattern: `'default':target '{' @dialog_parameter* '}'
			| 'label':target $bareword:targetValue '{' @dialog_parameter* '}'
			| 'entity':target $string:targetValue '{' @dialog_parameter* '}'`,
		recovery: {
			type: 'fastForward',
			until:  [
				{ value: '}' },
				{ type: 'newline' },
			]
		},
	},
	dialog_parameter: {
		pattern: `'entity':property $string:value<entityNames
			| 'name':property $string:value
			| 'portrait':property $string:value<portraitNames
			| 'alignment':property $bareword:value<enum_alignment
			| 'border_tileset':property $string:value<borderTileSetNames
			| 'emote':property $number:value
			| 'wrap':property $number:value`,
		recovery: {
			type: 'retry'
		},
	}
}

// I want it to act like this
const parseAs = {
	constant_assignment: (f, cs, untilValues) => {

	},
	include_macro: (f, cs, untilValues = NEWLINE_OR_SEMICOLON) => {
		const node = {
			node: 'include_macro',
			fileName: undefined,
			debug: {
				startPos: cs.tokenPos,
				captures: [],
			}
		}
		cs.advance();

		// file name
		if (cs.token.type !== 'quoted_string') {
			f.newError(cs, 'include_macro', `Expected: $quoted_string`);
			node.malformed = true;
			f.nodes.push(node);
			cs.fastForward(untilValues);
			return false;
		}
		node.fileName = cs.token.value;
		f.addAutoCompleteFromCollection(cs, 'fileNames');
		debug.captures.push({
			label: 'fileName',
			value: cs.token.value,
			tokenPos: cs.tokenPos,
			origToken: cs.token,
		});
		cs.advance();

		// semicolon
		if (cs.token.value !== ';') {
			f.newWarning(cs, 'include_macro', `Expected: ';'`);
			node.warning = true;
			cs.fastForward('\n');
		} else {
			cs.advance();
		}
		f.nodes.push(node);
		return true;
	},
	document: (f, cs, untilToken = { type: 'EOF' }) => {
		const nodes = [];
		while (cs.tokenPos < f.tokens.length) {
			// try the 'until' first
			if (cs.token.type === untilToken.type) {
				cs.advance();
				return {
					success: true,
					nodes,
					startPos,
					tokenPos: cs.tokenPos,
				};
			}
			// otherwise try the individuals
			if (cs.token.value === 'include') {
				parseAs.include(f, cs);
			}
			// except I don't want to check things one at a time,
			// I want to use an object lookup because it's only one step



			// // can we make it more procedural?
			// const literals = {
			// 	include: parseAs.include_macro,
			// 	add: parseAs.add_settings,
			// }
			// const literalFn = literals[token.value];

			// const captures = {
			// 	constant: parseAs.constant_assignment,
			// }


		}
	},
}

const trees = {
	'dialog_parameter': {
		expected: new Set([
			`'entity'`,
			`'name'`,
			`'portrait'`,
			`'alignment'`,
			`'border_tileset'`,
			`'emote'`,
			`'wrap'`,
		]),
		captures: {},
		literals: {
			entity: {
				pattern: new Set(['dialog_parameter']),
				type: 'bareword',
				value: 'entity',
				label: 'property',
				rep: '',
				next: {
					expected: new Set(['string']),
					literals: {},
					captures: {
						string: {
							pattern: new Set(['dialog_parameter']),
							type: 'capture',
							value: 'string',
							label: 'value',
							rep: '',
							fromCollection: 'entityNames',
							final: true,
							next: {},
						}
					},
				}
			},
			name: {
				pattern: new Set(['dialog_parameter']),
				type: 'bareword',
				value: 'name',
				label: 'property',
				rep: '',
				next: {
					expected: new Set(['string']),
					literals: {},
					captures: {
						string: {
							pattern: new Set(['dialog_parameter']),
							type: 'capture',
							value: 'string',
							label: 'value',
							rep: '',
							final: true,
							next: {},
						},
					},
				}
			},
			portrait: {
				pattern: new Set(['dialog_parameter']),
				type: 'bareword',
				value: 'portrait',
				label: 'property',
				rep: '',
				next: {
					expected: new Set(['string']),
					literals: {},
					captures: {
						string: {
							pattern: new Set(['dialog_parameter']),
							type: 'capture',
							value: 'string',
							label: 'value',
							rep: '',
							fromCollection: 'portraitNames',
							final: true,
							next: {},
						},
					},
				}
			},
			alignment: {
				pattern: new Set(['dialog_parameter']),
				type: 'bareword',
				value: 'alignment',
				label: 'property',
				rep: '',
				next: {
					expected: new Set(['bareword']),
					literals: {},
					captures: {
						bareword: {
							pattern: new Set(['dialog_parameter']),
							type: 'capture',
							value: 'bareword',
							label: 'value',
							rep: '',
							fromCollection: 'enum_alignment',
							final: true,
							next: {},
						}
					},
				},
			},
			border_tileset: {
				pattern: new Set(['dialog_parameter']),
				type: 'bareword',
				value: 'border_tileset',
				label: 'property',
				rep: '',
				next: {
					expected: new Set(['string']),
					literals: {},
					captures: {
						string: {
							pattern: new Set(['dialog_parameter']),
							type: 'capture',
							value: 'string',
							label: 'value',
							rep: '',
							fromCollection: 'borderTileSetNames',
							final: true,
							next: {},
						}
					},
				}
			},
			emote: {
				pattern: new Set(['dialog_parameter']),
				type: 'bareword',
				value: 'emote',
				label: 'property',
				rep: '',
				next: {
					expected: new Set(['number']),
					literals: {},
					captures: {
						number: {
							pattern: new Set(['dialog_parameter']),
							type: 'capture',
							value: 'number',
							label: 'value',
							rep: '',
							final: true,
							next: {},
						}
					},
				}
			},
			wrap: {
				pattern: new Set(['dialog_parameter']),
				type: 'bareword',
				value: 'wrap',
				label: 'property',
				rep: '',
				next: {
					expected: new Set(['number']),
					literals: {},
					captures: {
						number: {
							pattern: new Set(['dialog_parameter']),
							type: 'capture',
							value: 'number',
							label: 'value',
							rep: '',
							final: true,
							next: {},
						}
					},
				}
			},
		},
	},
}

const tokenDecays = (token, typeToMatch) => {
	if (token.type === typeToMatch) return true;
	if (token.type === 'number') {
		return typeToMatch === 'duration'
			|| typeToMatch === 'distance'
			|| typeToMatch === 'quantity';
	}
	if (token.barewordValue) {
		return typeToMatch === 'bareword'
			|| typeToMatch === 'string';
	}
	if (token.type === 'quoted_string') {
		return typeToMatch === 'string';
	}
	return false;
};

const doesUntilMatchToken = (token, until) => {
	return token.value === until.value
		|| tokenDecays(token, until.type || '');
}

const createCapture = (cs, twig) => {
	let label;
	if (twig.type === 'literal' && twig.label) label = twig.label;
	if (twig.type === 'capture') {
		label = twig.label || 'UNLABELED_CAPTURE';
	}
	if (label) {
		return {
			label,
			value: cs.token.value,
			tokenPos: cs.tokenPos,
			debug: cs.token,
		}
	}
	return null;
};

const parseDialogParam = (f, cs, until) => {
	const node = {
		node: 'dialog_parameter',
		startPos: cs.tokenPos,
		captures: [],
	}
	const twig = trees.dialog_parameter;
	while (cs.token) {
		if (doesUntilMatchToken(cs.token, until)) return node;
		// try literals
		const literalNext = twig.literals?.[cs.token.value];
		if (literalNext) {
			twig = literalNext;
			if (twig.label) {
				const capture = createCapture(cs, twig);
				if (capture) node.captures.push(capture);
			}
			if (twig.final) return node;
			cs.advance();
			continue;
		}
		
		



	}
	



}



