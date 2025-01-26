import { lex } from "./mathlang-lex.mjs"
import { parseFile } from './mathlang-parse.mjs';

const patternTests = {
	add_dialog_settings: [
		{
			name: 'normal',
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
		{
			name: 'error at the end',
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
		{
			name: 'error in the middle',
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
		{
			name: 'normal',
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
		{
			name: 'error at the end',
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
		{
			name: 'error in the middle',
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
		{
			name: 'normal',
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
		{
			name: 'empty',
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
		{
			name: 'normal',
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
		{
			name: 'no value',
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
const simplifyValues = (lh, rh) => {
	if (lh === null) {
		return { lh, rh };
	} else if (Array.isArray(lh)) {
		return simplifyArrays(lh, rh);
	} else if (typeof lh === 'object') {
		return simplifyObjects(lh, rh);
	} else return { lh, rh };
}
const simplifyArrays = (origLH = [], origRH = []) => {
	const newLH = [];
	const newRH = [];
	origLH.forEach((left, i)=>{
		const right = origRH[i];
		if (Array.isArray(left)) {
			const { lh, rh } = simplifyArrays(lh, rh);
			newLH.push(lh);
			newRH.push(rh);
		} else if (typeof left === 'object') {
			const { lh, rh } = simplifyObjects(left, right);
			newLH.push(lh);
			newRH.push(rh);
		} else {
			newLH.push(origLH);
			newRH.push(origRH);
		}
	});
	return { lh: newLH, rh: newRH };
}
const simplifyObjects = (lh = {}, rh = {}) => {
	const sortedLH = {};
	const sortedRH = {};
	Object.keys(lh).sort().forEach(k=>{
		if (Array.isArray(lh[k])) {
			const { newLH, newRH } = simplifyArrays(lh[k], rh[k]);
			sortedLH[k] = newLH;
			sortedRH[k] = newRH;
		} else if (typeof lh[k] === 'object') {
			const { newLH, newRH } = simplifyObjects(lh[k], rh[k]);
			sortedLH[k] = newLH;
			sortedRH[k] = newRH;
		} else {
			sortedLH[k] = lh[k];
			sortedRH[k] = rh[k];
		}
	});
	return { lh: sortedLH, rh: sortedRH };
}

const doTest = (test) => {
	const errors = [];
	const lexObject = lex(test.pattern);
	const file = parseFile(lexObject);
	if (test.fileSuccess !== file.success) { // I doubt this will happen
		const expected = test.fileSuccess ? 'succeeded' : 'failed';
		const found = file.success ? 'succeeded' : 'failed';
		errors.push({
			message: `Parsing ${found}; should have ${expected}`,
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
				message: `FOUND - ${found} ${foundI}, expected ${expected}`,
			});
		}
	});
	test.nodes.forEach((expected, i)=>{
		// expected.malformed = !!expected.malformed;
		const found = file.nodes[i];
		Object.entries(expected).forEach(([k,v])=>{
			const {lh, rh} = simplifyValues(expected[k], found[k]);
			const jsonLeft = JSON.stringify(lh);
			const jsonRight = JSON.stringify(rh);
			if (jsonLeft !== jsonRight) {
				errors.push({
					message: `Found ${k}:${jsonLeft}, expected ${jsonRight}`,
				});
			}
		});
	});
	return {
		testName: test.name,
		errors,
		pattern: test.pattern,
	};
};

const indent = '    '
Object.entries(patternTests).forEach(([testCat, tests])=>{
	console.log(`=== ${testCat} =========>`);
	tests.map(doTest).forEach(test=>{
		if (test.errors.length === 0) {
			console.log(`${indent}${test.testName} --> OK`);
		} else {
			console.error(`${indent}${test.testName} -->`);
			console.error(indent+indent+'Pattern: `'+test.pattern+'`')
			test.errors.map(error=>{
				console.error(indent+indent+error.message)
			});
		}
	});
});
