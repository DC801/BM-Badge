const lexStructure = {
	completed: false, // Even if there are errors, if lexing still got to the end, then some kind of semi-understandable state is possible. Completely breaking errors will set this to true.
	errors: [],
	warnings: [],
	tokens: [],
};

const tokenStructure = {
	type: '', // e.g. bareword, duration, operator
	rawValue: '', // the actual thing captured, e.g. `"%PLAYER%"` or `1s`
	value: '', // translated for the JSON output, e.g. `%PLAYER%` or `1000`
	pos: NaN, // the char position in the file the token starts from
	ignorable: false, // only comments and newlines are `true`
};

const errorStructure = {
	message: '',
	value: '',
	pos: NaN,
};
const warningStructure = {
	message: '',
	value: '',
	pos: NaN,
	suggestion: '',
};

const kebabToCamel = (string) => string
	.split('-')
	.map((word, i)=>{
		if (i === 0) return word;
		const chars = word.split('')
		chars[0] = chars[0].toLocaleUpperCase();
		return chars.join('');
	})
	.join('');

const isDigit = (char) => char >= '0'&& char <= '9';
const isHexDigit = (char) => char >= '0'&& char <= '9'
	|| (char >= 'a' && char <= 'f')
	|| (char >= 'A' && char <= 'F');
const isLetter = (char) => (char >= 'a' && char <= 'z')
	|| (char >= 'A' && char <= 'Z');
const isBarewordInitial = (char) => isLetter(char) || char === '_'
const isBarewordable = (char) => isBarewordInitial(char) || isDigit(char) || char === '-'

const OPERATORS_SINGLE = new Set('{}[]()<>+-=*/?!%:;,#'.split(''));
const OPERATORS_LONG = new Set([ "!=", "==", ">=", "<=", "||", "&&", "->" ]);
const IGNORE_WHITESPACE = new Set([' ', '\t'])

const NUMBER_SUFFIXES = {
    ms: (n) => { return { type: 'duration', value: n } },
    s: (n) => { return { type: 'duration', value: n *1000} },
    px: (n) => { return { type: 'distance', value: n } },
    pix: (n) => { return { type: 'distance', value: n } },
    x: (n) => { return { type: 'quantity', value: n } },
};
const WORDS_WITH_TYPES = {
	on: { type: 'boolean', value: true, barewordValue: 'on' },
	off: { type: 'boolean', value: false, barewordValue: 'off' },
	true: { type: 'boolean', value: true, barewordValue: 'true' },
	false: { type: 'boolean', value: false, barewordValue: 'false' },
	open: { type: 'boolean', value: true, barewordValue: 'open' },
	closed: { type: 'boolean', value: false, barewordValue: 'closed' },
	black: { type: 'color', value: '#000000', barewordValue: 'black' },
	white: { type: 'color', value: '#FFFFFF', barewordValue: 'white' },
	red: { type: 'color', value: '#FF0000', barewordValue: 'red' },
	green: { type: 'color', value: '#00FF00', barewordValue: 'green' },
	blue: { type: 'color', value: '#0000FF', barewordValue: 'blue' },
	magenta: { type: 'color', value: '#FF00FF', barewordValue: 'magenta' },
	yellow: { type: 'color', value: '#FF00FF', barewordValue: 'yellow' },
	cyan: { type: 'color', value: '#00FFFF', barewordValue: 'cyan' },
	once: { type: 'quantity', value: 1, barewordValue: 'once' },
	twice: { type: 'quantity', value: 2, barewordValue: 'twice' },
	thrice: { type: 'quantity', value: 3, barewordValue: 'thrice' },
};

export const lex = (string) => {
	const errors = [];
	const warnings = [];
	const tokens = [];
	let pos = 0;
	let curr = string[pos];
	const advance = () => {
		pos += 1;
		const value = string[pos] || '';
		curr = value;
		return value;
	};
	const peek = (n) => {
		if (n === undefined || n === 1) {
			return string[pos+1] || '';
		}
		return string.slice(pos+1, pos+1+n);
	}
	lex: while (pos < string.length) {
		// whitespace
		while (IGNORE_WHITESPACE.has(curr)) {
			advance();
			if (curr === '') break lex;
		}
		// for capturing everything else
		const startPos = pos;
		// harvest newlines for potential error correction
		let newlines = '';
		while (curr === '\n' || curr === '\v' || curr === '\r') {
			newlines += curr;
			advance();
			if (curr === '') break;
		}
		if (newlines.length > 0) {
			tokens.push({
				type: 'newline',
				rawValue: newlines,
				value: newlines,
				pos: startPos,
				ignorable: true,
			});
			continue;
		}
		// comments
		if (curr === '/') {
			if (peek() === '/') { // line comment
				do {
					advance();
				} while (curr !== '\n' && curr !== '')
				tokens.push({
					type: 'line_comment',
					rawValue: string.slice(startPos, pos),
					value: string.slice(startPos+2, pos),
					pos: startPos,
					ignorable: true,
				})
				continue;
			} else if (peek() === '*') { // block comment
				advance();
				do {
					advance();
				} while (curr+peek() !== '*/' && curr !== '' && peek() !== '')
				advance();
				advance();
				tokens.push({
					type: 'block_comment',
					rawValue: string.slice(startPos, pos),
					value: string.slice(startPos+2, pos).replace(/\*\/$/,''),
					pos: startPos,
					ignorable: true,
				})
				continue;
			}
		}
		// color
		if (curr === '#') {
			const next = peek();
			if (isHexDigit(next)) {
				do {
					advance();
				} while (isHexDigit(curr))
				const hexChars = string.slice(startPos+1, pos);
				if (hexChars.length === 3) {
					const color = string[startPos]
						+ hexChars[0] + hexChars[0]
						+ hexChars[1] + hexChars[1]
						+ hexChars[2] + hexChars[2];
					tokens.push({
						type: 'color',
						rawValue: '#' + hexChars,
						value: color,
						pos,
					});
				} else if (hexChars.length === 6) {
					const color = string.slice(startPos, pos);
					tokens.push({
						type: 'color',
						rawValue: color,
						value: color,
						pos,
					});
				} else {
					const color = string.slice(startPos, pos);
					tokens.push({
						type: 'error:color',
						rawValue: color,
						value: color,
						pos,
					});
					errors.push({
						message: 'Invalid color: ' + color,
						pos: startPos,
						value: color,
					});
				}
			}
		}
		// minus sidetracking
		const minus = curr === '-' ? '-' : '';
		if (minus && !isDigit(peek())) {
			tokens.push({
				type: 'operator',
				rawValue: curr,
				value: curr,
				pos,
			});
			advance();
		}
		// numbers
		if (isDigit(curr)) {
			const token = {
				type: '',
				rawValue: '',
				value: NaN,
				pos: startPos,
			}
			let number = minus;
			while (curr !== '' && isDigit(curr)) {
				number += curr;
				advance();
			}
			let suffix = '';
			while (curr !== '' && isBarewordable(curr)) {
				suffix += curr;
				advance();
			}
			token.rawValue = number + suffix;
			if (suffix) {
				const numberSuffixFn = NUMBER_SUFFIXES[suffix];
				if (numberSuffixFn) {
					const fnd = numberSuffixFn(number);
					token.type = fnd.type;
					token.value = Number(fnd.value);
				} else {
					token.type = 'error:number'
					token.value = Number(number);
					errors.push({
						message: 'Invalid number suffix: ' + number + suffix,
						pos: startPos,
						value: number + suffix,
					});
				}
			} else {
				token.type = 'number',
				token.value = Number(number);
			}
			tokens.push(token);
			continue;
		}
		// operators
		if (OPERATORS_LONG.has(curr + peek())) {
			let op = curr + advance();
			tokens.push({
				type: 'operator',
				rawValue: op,
				value: op,
				pos,
			});
			advance();
			continue;
		} else if (OPERATORS_SINGLE.has(curr)) {
			tokens.push({
				type: 'operator',
				rawValue: curr,
				value: curr,
				pos,
			});
			advance();
			continue;
		}
		// constant
		if (curr === '$') {
			do {
				advance();
			} while (isBarewordable(curr))
			const constant = string.slice(startPos, pos);
			tokens.push({
				type: 'constant',
				rawValue: constant,
				value: constant,
				pos: startPos,
			})
			continue;
		}
		// barewords
		if (isBarewordInitial(curr)) {
			do {
				advance();
			} while (isBarewordable(curr))
			const word = string.slice(startPos, pos);
			const typeInfo = WORDS_WITH_TYPES[word];
			if (typeInfo) {
				tokens.push({
					type: typeInfo.type,
					rawValue: word,
					value: typeInfo.value,
					pos: startPos,
				});
			} else {
				tokens.push({
					type: 'bareword',
					rawValue: word,
					value: word,
					pos: startPos,
				});
			}
			if (/-/.test(word)) {
				const splits = word.split('-');
				warnings.push({
					message: `Found bareword with hyphen: '${word}'`,
					value: word,
					pos: startPos,
					suggestion: `Hyphens in barewords will be made invalid eventually, at which point, this bareword would count as ${splits.length*2-1} tokens! You should rename these before things break. Suggest camel case: '${kebabToCamel(word)}'`,
				})
			}
			continue;
		}
		// quoted string
		if (curr === '"') {
			advance();
			while (curr !== '"') {
				if (curr === '') {
					const value = string.slice(startPos, pos);
					tokens.push({
						type: 'error:quoted_string',
						rawValue: value,
						value: value,
						pos: startPos,

					});
					errors.push({
						message: 'Unterminated quoted string: ' + value,
						value: value,
						pos: startPos,
					});
					break lex;
				}
				if (curr === '\\' && peek() === '"') {
					advance(); // skip one extra
				}
				advance();
			}
			advance();
			tokens.push({
				type: 'quoted_string',
				rawValue: string.slice(startPos, pos),
				value: string.slice(startPos+1, pos-1),
				pos: startPos,
			})
			continue;
		}
		// if you got here...
		while (curr !== '' && !IGNORE_WHITESPACE.has(curr)) {
			advance();
		}
		const unknown = string.slice(startPos, pos);
		tokens.push({
			type: 'error:unknown_token',
			rawValue: unknown,
			value: unknown,
			pos: startPos,
		});
		errors.push({
			message: 'Unkown token: ' + unknown,
			value: unknown,
			pos: startPos,
		});
	}
	tokens.push({
		type: 'EOF',
		rawValue: 'EOF',
		value: 'EOF',
		pos: string.length,
	})
	return {
		errors,
		tokens,
		warnings,
		plaintext: string,
		completed: true,
	}
}

// const report = lex(test);
// // console.log(JSON.stringify(report.tokens, null, '  '));
// const flatReport = report.tokens
// 	.filter(token=>!token.ignorable)
// 	.map(token=>token.value).join(' ');
// console.log(flatReport);
