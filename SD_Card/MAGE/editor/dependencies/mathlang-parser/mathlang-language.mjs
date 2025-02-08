// the key here I think is this:
// if it's a straight lookup, just copy-paste the entry transparently
// if it's a * or + preserve the lookupiness, as this is how we go all nested,
// and there's not likely to be competitors with literals / captures
// in fact, make '+' into a '' and a '*', so there's only normal and @lookup* (or $capture*)
// then we know when we've ended when we check the normal thing after it... so no double '*' in a row plz
const patterns = {
	document: `@root* $EOF:EOF`,
	root: `@include_macro`
		+` | @constant_assignment`
		+` | @add_serial_dialog_settings`
		+` | @add_dialog_settings`
		+` | @dialog_definition`
		+` | @serial_dialog_definition`
		+` | @json_literal`
		,
	// Derp, why was this in quotes? We just need one word out of it....
	include_macro: `'include' $quoted_string:fileName ';'`,
	constant_assignment: `$constant:constantName '=' @constant_value:value ';'`,
	constant_value: `$number | $bareword | $quoted_string
		| $boolean | $constant<constantNames
		| $duration | $quantity | $distance | $color`,
	add_serial_dialog_settings: `'add' 'serial_dialog' 'settings' '{' @serial_dialog_parameter* '}'`,
	add_dialog_settings: `'add' 'dialog' 'settings' '{' @dialog_settings_target* '}'`,
	serial_dialog_parameter: `'wrap':property $number:value`,
	dialog_settings_target: `'default':target '{' @dialog_parameter* '}'
		| 'label':target $bareword:targetValue '{' @dialog_parameter* '}'
		| 'entity':target $string:targetValue '{' @dialog_parameter* '}'`,
	dialog_parameter: `'entity':property $string:value<entityNames
		| 'name':property $string:value
		| 'portrait':property $string:value<portraitNames
		| 'alignment':property $bareword:value<enum_alignment
		| 'border_tileset':property $string:value
		| 'emote':property $number:value
		| 'wrap':property $number:value`,
	dialog_literal: `'{' @dialog* '}'`,
	serial_dialog_literal: `'{' @serial_dialog? '}'`,
	dialog_definition: `'dialog' $string:dialogName @dialog_literal`,
	serial_dialog_definition: `'serial_dialog' $string:serialDialogName @serial_dialog_literal`,
	dialog: `@dialog_identifier
		@dialog_parameter*
		$quoted_string:dialogMessage+
		@dialog_option*
		';'`, // SEMICOLON IS NEW!
	dialog_identifier: `'entity':identifierType $string:identifierValue
		| 'name':identifierType $string:identifierValue
		| $bareword:identifierValue`,
	serial_dialog: `@serial_dialog_parameter*
		$quoted_string:serialDialogMessage+
		@serial_dialog_option*`,
	serial_dialog_option: `'#':optionType $quoted_string:label '=' $string:script
		| '_':optionType $quoted_string:label '=' $string:script`,
	dialog_option: `'>' $quoted_string:label '=' $string:script`,
	json_literal: `'json' '!' '['` // the rest is handled in the parse fn
};

const getWordReport = (word, patternName) => {
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
			throw new Error("Subpattern not built up from pairs: " + word);
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
			// capturesIdentified[patternName] = capturesIdentified[patternName] || [];
			// capturesIdentified[patternName].push(word);
		}
		if (left.includes("<")) {
			token.autoComplete = right;
		}
		if (left.includes(">")) {
			token.toCollection = right;
		}
		if (token.type === '') throw new Error("Unknown token sigil: " + left + right);
	}
	return token;
};

const flatTrees = {};
Object.keys(patterns).forEach(patternName=>{
	const options = patterns[patternName]
		.split(/[\s\t\n]+\|[\s\t\n]+/g)
		.map(line=>line
				.split(/[\n\t\s]+/g)
				.map(getWordReport)
			);
	flatTrees[patternName] = options;
});

// let's give the flat trees less nuance!
// ...but let's do everything one at a time so we don't get confused
// (this is not efficient but we can cache it so we we're not doing this every time)

Object.entries(flatTrees).forEach(([patternName, variants])=>{
	let newVariants = [];
	for (let j = 0; j < variants.length; j++) {
		const newVariant = [];
		const origVariant = variants[j];
		// get the terminator for the pattern, if any, and apply to
		// every entry (since we can't scan to the end easily in a tree to see when we should stop)
		// (and I don't want to define this manually all the time)
		const last = origVariant[origVariant.length-1];
		last.terminator = true;
		if (
			origVariant.length > 2
			&& last.type !== 'lookup'
			&& (last.rep === '' || last.rep === '+')
		) {
			origVariant.forEach(word=>{
				word.errorRecoveryValue = last.value;
			})
		}
		// since simple lookups are copy-pastad and the identity of the pattern is now lost,
		// best to attach them to the twigs somehow and pull them when parsing (?)
		// (particularly 'root': otherwise every single top label node is called 'root' with no further context!)
		origVariant.forEach(word=>{
			word.originalPattern = patternName;
		})
		// expanding '+' into a '' and a '*'
		while (origVariant.length) {
			const twig = origVariant.shift();
			if (twig.rep === '+') {
				const double = structuredClone(twig);
				double.rep = '*';
				origVariant.unshift(double);
				twig.rep = '';
			}
			newVariant.push(twig);
		}
		// here's where a variant might become multiple variants
		let frontEnds = [[]];
		newVariant.forEach(twig=>{
			if (twig.rep === '?') {
				let kitty = structuredClone(frontEnds);
				twig.rep = ''
				kitty.forEach(cat=>{cat.push(twig)});
				frontEnds = frontEnds.concat(kitty);
			} else {
				frontEnds.forEach(front=>{front.push(twig)});
			}
		});
		// 'frontEnds' are now variants both w/ and w/o the '?' twig
		newVariants = newVariants.concat(frontEnds);
	}
	flatTrees[patternName] = newVariants;
});

// now fill in the non-repeating, non-optional @lookups (copy-paste in place)
const prerequesites = {};
const collectLookupPrerequesites = (words) => {
	const prereqWords = words.filter(twig=>twig.type==='lookup' && twig.rep==='');
	return prereqWords.map(twig=>twig.value);
}
const fillInPrerequesites = (patternName) => {
	const origVariants = flatTrees[patternName];
	const variantPrereq = collectLookupPrerequesites(origVariants.flat());
	const prerequesites = new Set(variantPrereq);
	if (!prerequesites.size) return;
	[...prerequesites].map(fillInPrerequesites);
	let newVariants = [];
	origVariants.forEach(variant=>{
		// similar to above:
		let frontEnds = [[]];
		variant.forEach(twig=>{
			if (twig.type === 'lookup' && twig.rep === '') {
				const lookupVariants = flatTrees[twig.value];
				let newFrontEnds = [];
				lookupVariants.forEach(lookupVariant=>{
					let kitty = frontEnds
						.map(v=>structuredClone(v))
						.map(v=>v=v.concat(lookupVariant));
					newFrontEnds = newFrontEnds.concat(kitty);
				})
				frontEnds = newFrontEnds;
			} else {
				frontEnds.forEach(front=>{
					front.push(twig)
				});
			}
		});
		newVariants = newVariants.concat(frontEnds);
	});
	flatTrees[patternName] = newVariants;
};
// fillInPrerequesites('document'); // (turns out this wasn't sufficient to catch everything)
Object.entries(flatTrees).forEach(([patternName, variants])=>{
	const prereq = collectLookupPrerequesites(variants.flat());
	prerequesites[patternName] = prereq;
});

export const tree = {};
const flatPatternsDone = new Set();
const addFlatPatternToTree = (patternName) => {
	if (flatPatternsDone.has(patternName)) {
		return tree[patternName].next;
	}
	const patterns = flatTrees[patternName];
	const firstEntry = makeEntry(patternName);
	tree[patternName] = firstEntry;
	patterns.forEach(pattern=>{
		let pos = firstEntry;
		pattern.forEach(twig=>{
			pos = addTwigToNext(pos, twig, patternName);
		});
	});
	flatPatternsDone.add(patternName);
};

const addTwigToNext = (entry, twig, patternName) => {
	let peekName; // the peek name in the 'bucket'
	// (e.g. `entity` (literal) or `bareword` (capture))
	let bucket; // the object we will use for the 'bucket'
	// (so we don't say its full name each time)
	let expected; // what will print in errors if when all matches fail
	if (twig.type === 'literal') {
		peekName = twig.value;
		bucket = entry.literals;
		expected = `'${twig.value}'`;
	} else if (twig.type === 'capture') {
		peekName = twig.value;
		bucket = entry.captures;
		expected = twig.value;
	} else if (twig.type === 'lookup') {
		// we're doing this for now, but eventually all
		// nonrepeating lookups will be transparent
		// (it makes the tree hard but the dictionary easy)
		// (it'll be worth it (?))
		peekName = twig.value;
		bucket = entry.lookups;
		expected = `@${twig.value}`;
		addFlatPatternToTree(twig.value);
	}
	if (!bucket[peekName]) {
		// found a new thing, so let's add it:
		bucket[peekName] = makeEntry(patternName, twig);
		entry.expected.add(expected);
	}
	// either way we want to record the twig's original pattern
	// this will help us label errors and identify matches
	// since all the copy-pasta'ing wrecked which pattern is where
	bucket[peekName].patternName.add(twig.originalPattern);
	return bucket[peekName];
}

const makeEntry = (patternName, twig) => {
	return {
		dictionaryLookupName: patternName,
		patternName: new Set (),
		// not sure how to best handle the first entry in each thing
		// the lookup "caller" needs to determine loops and untils, so
		// can supply that pattern's entry for the lookup, but what
		// about the very first one?
		twig: twig || {
			original: '(dictionary)',
			rep: '',
			type: 'dictionary',
			value: patternName,
		},
		literals: {},
		captures: {},
		lookups: {},
		expected: new Set()
	}
};

// Otherwise I think this is perfect!

Object.keys(flatTrees).forEach(patternName=>{
	fillInPrerequesites(patternName);
})
Object.keys(flatTrees).forEach(patternName=>{
	addFlatPatternToTree(patternName);
})

// console.log(tree);