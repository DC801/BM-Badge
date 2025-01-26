import { lex } from "./mathlang-lex.mjs"
import { parseFile } from './mathlang-parse.mjs';

// remember newlines count as a token, so avoid them
// to make it easier to count them with your eyeballs!
const patternTests = {
	serial_dialog_definition: [
		{ name: 'double',
			pattern: `serial_dialog test { "Test message!" "Another!" }`,
			fileSuccess: true,
			counts: { tokens: 10, nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					dialogs: [{
						node: "serial_dialog",
						messages: [ "Test message!", "Another!" ],
					}]
				}
			]
		},
		{ name: 'parameters',
			pattern: `serial_dialog test { wrap 80 "Test message!" "Another!" }`,
			fileSuccess: true,
			counts: { tokens: 8, nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					parameters: [{ property: 'wrap', value: 80 }],
					messages: [ "Test message!", "Another!" ],
				}
			]
		},
		{ name: 'parameters with error at the end',
			pattern: `serial_dialog test { wrap 80 asdf "Test message!" "Another!" }`,
			fileSuccess: true,
			counts: { tokens: 9, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					malformed: true,
					name: "test",
					parameters: [{ property: 'wrap', value: 80 }],
					messages: [ "Test message!", "Another!" ],
				}
			]
		},
		{ name: 'parameters with error in the middle',
			pattern: `serial_dialog test { wrap 80 asdf wrap 79 "Test message!" "Another!" }`,
			fileSuccess: true,
			counts: { tokens: 11, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					malformed: true,
					name: "test",
					parameters: [
						{ property: 'wrap', value: 80 },
						{ property: 'wrap', value: 79 },
					],
					messages: [ "Test message!", "Another!" ],
				}
			]
		},
		{ name: 'options',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ "Fill in" = correctScriptChoice`
				+`}`,
			fileSuccess: true,
			counts: { tokens: 10, nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [{ label: 'Fill in', script: 'correctScriptChoice' }],
				}
			]
		},
		{ name: 'options no script',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ "Fill in" =`
				+`}`,
			fileSuccess: true,
			counts: { tokens: 9, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [{ label: 'Fill in', script: '' }],
				}
			]
		},
		{ name: 'options no equal sign / script',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ "Fill in"`
				+`}`,
			fileSuccess: true,
			counts: { tokens: 8, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [{ label: 'Fill in', script: '' }],
				}
			]
		},
		{ name: 'options no label / equal sign / script',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ `
				+`}`,
			fileSuccess: true,
			counts: { tokens: 7, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [{ label: '', script: '' }],
				}
			]
		},
		// Should only fail once:
		{ name: 'options with garbage',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ asdfasdf`
				+`}`,
			fileSuccess: true,
			counts: { tokens: 8, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [{ label: '', script: '' }],
				}
			]
		},
	],
	dialog_definition: [
		{ name: 'double',
			pattern: `dialog greetings {`
				+ `Bob "Hello?" "Is there anyone there?"`
				+ `PLAYER "Oh?" "I heard something!"`
				+ `}`,
			fileSuccess: true,
			counts: { tokens: 10, nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "greetings",
					dialogs: [
						{
							node: "dialog",
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?", "Is there anyone there?" ],
						},
						{
							node: "dialog",
							identifier: { type: "label", value: "PLAYER" },
							messages: [ "Oh?", "I heard something!"],
						}
					]
				}
			]
		},
		{ name: 'parameters',
			pattern: `dialog _ { Bob alignment BR "Hello?" }`,
			fileSuccess: true,
			counts: { tokens: 8, nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							parameters: [{ property: 'alignment', value: 'BR' }],
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
						},
					]
				}
			]
		},
		{ name: 'parameters failure at the end',
			pattern: `dialog _ { Bob alignment BR ERRORTOKEN "Hello?" }`,
			fileSuccess: true,
			counts: { tokens: 9, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							parameters: [{ property: 'alignment', value: 'BR' }],
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
						},
					]
				}
			]
		},
		{ name: 'parameters failure in the middle',
			pattern: `dialog _ { Bob alignment BR ERRORTOKEN wrap 10 "Hello?" }`,
			fileSuccess: true,
			counts: { tokens: 11, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							parameters: [
								{ property: 'alignment', value: 'BR' },
								{ property: 'wrap', value: 10 },
							],
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
						},
					]
				}
			]
		},
		{ name: 'options',
			pattern: `dialog _ { Bob "Hello?" > "Oh?" = scriptName }`,
			fileSuccess: true,
			counts: { tokens: 10, nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
							options: [{
								label: 'Oh?',
								script: 'scriptName'
							}],
						},
					]
				}
			]
		},
		{ name: 'options no script',
			pattern: `dialog _ { Bob "Hello?" > "Oh?" = }`,
			fileSuccess: true,
			counts: { tokens: 9, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
							options: [{
								label: 'Oh?',
								script: ''
							}],
						},
					]
				}
			]
		},
		{ name: 'options no equal sign / script',
			pattern: `dialog _ { Bob "Hello?" > "Oh?" }`,
			fileSuccess: true,
			counts: { tokens: 8, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
							options: [{
								label: 'Oh?',
								script: ''
							}],
						},
					]
				}
			]
		},
		{ name: 'options no label / equal sign / script',
			pattern: `dialog _ { Bob "Hello?" > }`,
			fileSuccess: true,
			counts: { tokens: 7, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
							options: [{
								label: '',
								script: ''
							}],
						},
					]
				}
			]
		},
		// Should only fail once:
		{ name: 'options with garbage',
			pattern: `dialog _ { Bob "Hello?" > asdfasdf }`,
			fileSuccess: true,
			counts: { tokens: 8, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
							options: [{
								label: '',
								script: ''
							}],
						},
					]
				}
			]
		},
	],
	add_dialog_settings: [
		{ name: 'normal',
			pattern: `add dialog settings { default { alignment TR } }`,
			fileSuccess: true,
			counts: { tokens: 10, nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: 'add_dialog_settings',
					settings: [{
						targetType: 'default',
						targetValue: '',
						settings: [
							{ property: 'alignment', value: 'TR' },
						]
					}]
				}
			]
		},
		{ name: 'error at the end',
			pattern: `add dialog settings { default { alignment TR demigloss } }`,
			fileSuccess: true,
			counts: { tokens: 11, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: 'add_dialog_settings',
					malformed: true,
					settings: [{
						targetType: 'default',
						targetValue: '',
						settings: [
							{ property: 'alignment', value: 'TR' },
						]
					}]
				}
			]
		},
		{ name: 'error in the middle',
			pattern: `add dialog settings { default { alignment TR deglaze portrait secretSnake } }`,
			fileSuccess: true,
			counts: { tokens: 13, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: 'add_dialog_settings',
					malformed: true,
					settings: [{
						targetType: 'default',
						targetValue: '',
						settings: [
							{ property: 'alignment', value: 'TR' },
							{ property: 'portrait', value: 'secretSnake' },
						]
					}]
				},
				
			]
		},
	],
	add_serial_dialog_settings: [
		{ name: 'normal',
			pattern: `add serial_dialog settings { wrap 1 }`,
			fileSuccess: true,
			counts: { tokens: 7, nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: 'add_serial_dialog_settings',
					settings: [{ property: 'wrap', value: 1 }],
				}
			]
		},
		{ name: 'error at the end',
			pattern: `add serial_dialog settings { wrap 1 two }`,
			fileSuccess: true,
			counts: { tokens: 8, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: 'add_serial_dialog_settings',
					malformed: true,
					settings: [
						{ property: 'wrap', value: 1 }
					],
				}
			]
		},
		{ name: 'error in the middle',
			pattern: `add serial_dialog settings { wrap 1 two wrap 3 }`,
			fileSuccess: true,
			counts: { tokens: 10, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: 'add_serial_dialog_settings',
					malformed: true,
					settings: [
						{ property: 'wrap', value: 1 },
						{ property: 'wrap', value: 3 },
					],
				},
				
			]
		},
	],
	include_macro: [
		{ name: 'normal',
			pattern: `include!("header.mgs")`,
			fileSuccess: true,
			counts: { tokens: 5, nodes: 1, errors: 0, warnings: 0 }, // should be 1 warning, 0 errors? no state is broken
			nodes: [
				{
					node: 'include_macro',
					value: 'header.mgs',
				}
			]
		},
		{ name: 'empty',
			pattern: `include!()`,
			fileSuccess: true,
			counts: { tokens: 4, nodes: 1, errors: 1, warnings: 0 }, // should be 1 warning, 0 errors? no state is broken
			nodes: [
				{
					node: 'include_macro',
					value: '',
					malformed: true
				}
			]
		}
	],
	constant_assignment: [
		{ name: 'normal',
			pattern: `$steamedHams = "Hamburgers";`,
			fileSuccess: true,
			counts: { tokens: 4, nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: 'constant_assignment',
					name: '$steamedHams',
					value: 'Hamburgers'
				}
			]
		},
		{ name: 'no value',
			pattern: `$trombones = ;`,
			fileSuccess: true,
			counts: { tokens: 3, nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					name: '$trombones',
					value: null,
					malformed: true,
					node: 'constant_assignment',
				}
			]
		},
	],
}
const ansiRed = '\u001b[1;31m';
const ansiYellow = '\u001b[1;33m';
const ansiReset = '\u001b[0m';
const simplifyValues = (lh, rh) => {
	if (lh === null) return simplifyLiteral(lh, rh);
	if (Array.isArray(lh)) return simplifyArrays(lh, rh);
	if (typeof lh === 'object') return simplifyObjects(lh, rh);
	return simplifyLiteral(lh, rh);
}
const simplifyLiteral = (lh, rh) => {
	const red = ansiRed+JSON.stringify(rh)+ansiReset;
	const diff = lh === rh
	? rh
	: red + ` (expected ${ansiYellow}${JSON.stringify(lh)}${ansiReset})`;
	return { lh, rh, diff };
};
const simplifyArrays = (origLH = [], origRH = []) => {
	const newLH = [];
	const newRH = [];
	const newDiffs = [];
	origLH.forEach((left, i)=>{
		const right = origRH[i];
		if (Array.isArray(left)) {
			const { lh, rh, diff } = simplifyArrays(left, right);
			newLH.push(lh);
			newRH.push(rh);
			newDiffs.push(diff);
		} else if (typeof left === 'object') {
			const { lh, rh, diff } = simplifyObjects(left, right);
			newLH.push(lh);
			newRH.push(rh);
			newDiffs.push(diff);
		} else {
			const { lh, rh, diff } = simplifyLiteral(left, right);
			newLH.push(lh);
			newRH.push(rh);
			newDiffs.push(diff);
		}
	});
	return { lh: newLH, rh: newRH, diff: newDiffs };
}
const simplifyObjects = (origLH = {}, origRH = {}) => {
	const sortedLH = {};
	const sortedRH = {};
	const sortedDiff = {};
	Object.keys(origLH).sort().forEach(k=>{
		if (Array.isArray(origLH[k])) {
			const { lh, rh, diff } = simplifyArrays(origLH[k], origRH[k]);
			sortedLH[k] = lh;
			sortedRH[k] = rh;
			sortedDiff[k] = diff;
		} else if (typeof origLH[k] === 'object') {
			const { lh, rh, diff } = simplifyObjects(origLH[k], origRH[k]);
			sortedLH[k] = lh;
			sortedRH[k] = rh;
			sortedDiff[k] = diff;
		} else {
			const { lh, rh, diff } = simplifyLiteral(origLH[k], origRH[k]);
			sortedLH[k] = lh;
			sortedRH[k] = rh;
			sortedDiff[k] = diff;
		}
	});
	return { lh: sortedLH, rh: sortedRH, diff: sortedDiff };
}

const doTest = (test) => {
	const errors = [];
	const lexObject = lex(test.pattern);
	const file = parseFile(lexObject);
	if (test.fileSuccess !== file.success) { // I doubt this will happen
		const expected = test.fileSuccess ? 'succeeded' : 'failed';
		const found = file.success ? 'succeeded' : 'failed';
		errors.push({
			message: `Parsing ${ansiRed}${found}${ansiReset}; should have ${ansiYellow}${expected}${ansiReset}`,
		});
	}
	Object.keys(test.counts).forEach(item=>{
		const fileCounts = {
			// Account for EOF as a token:
			tokens: file.tokens.length - 1,
			nodes: file.nodes.length,
			warnings: file.warnings.length,
			errors: file.errors.length,
		}
		if (fileCounts[item] !== test.counts[item]) {
			const found = fileCounts[item];
			const foundP = fileCounts[item] !== 1;
			const foundI = foundP ? item : item.replace(/s$/,'');
			const expected = test.counts[item];
			errors.push({
				message: `Found ${ansiRed}${found} ${foundI}${ansiReset}, expected ${ansiYellow}${expected}${ansiReset}`,
			});
		}
	});
	test.nodes.forEach((expected, i)=>{
		// expected.malformed = !!expected.malformed;
		const found = file.nodes[i];
		Object.keys(expected).forEach(key=>{
			const {lh, rh, diff} = simplifyValues(expected[key], found[key]);
			const jsonLeft = JSON.stringify(lh, null, '  ');
			const jsonRight = JSON.stringify(rh, null, '  ');
			if (jsonLeft !== jsonRight) {
				if (typeof lh === 'object') {
					const message = { message: `Found ${JSON.stringify(diff, null, '  ')}` }
					errors.push(message);
				} else {
					const message = { message: `Found ${ansiRed}${key}: ${jsonLeft}${ansiReset}, expected value ${ansiYellow}${jsonRight}${ansiReset}` };
					errors.push(message);
				}
			}
		});
	});
	return {
		testName: test.name,
		errors,
		pattern: test.pattern,
	};
};
const printTestResults = (test) => {
	if (test.errors.length === 0) {
		console.log(`${indent}${test.testName} --> OK`);
	} else {
		console.error(`${indent}${test.testName} -->`);
		console.error(indent+indent+'Pattern: `'+test.pattern+'`')
		test.errors.map(error=>{
			error.message = error.message.replaceAll('\\u001b[','\u001b[');
			const print = error.message.split('\n').map(s=>indent+indent+s).join('\n');
			console.error(print);
		});
	}
};
const indent = '    ';
const megaTestGamut = () => {
	Object.entries(patternTests).forEach(([testCat, tests])=>{
		console.log(`=== ${testCat} =========>`);
		tests.map(doTest).forEach(printTestResults);
	});
}
const topTest = () => {
	const [testCat, tests] = Object.entries(patternTests)[0];
	console.log(`=== ${testCat} =========>`);
	const doneTest = doTest(tests[0]);
	printTestResults(doneTest);
}

// megaTestGamut();
topTest();
