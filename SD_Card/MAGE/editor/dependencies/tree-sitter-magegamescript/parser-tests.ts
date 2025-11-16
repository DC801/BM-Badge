import { parseProject } from './parser.ts';
import { ansiTags } from './parser-utilities.ts';
import { AnyNode } from './parser-types.ts';
import { type GenericObj } from './parser-actions.ts';
import { errorTests } from './parser-test-data-errors.ts';
import { actionTests } from './parser-test-data-actions.ts';
import { fileTests } from './parser-test-data-files.ts';

const actionArrayToScript = (
	scriptName: string,
	actionArray: string[],
	autoAddEOF: boolean = false,
): string => {
	const ret = [`"${scriptName}" {`, ...actionArray.map((v) => '\t' + v)];
	if (autoAddEOF) {
		ret.push(`\tend_of_script_***:`);
	}
	ret.push('}');
	return ret.join('\n');
};

// if there are any entries in any of these, the only the listed tests will be run
const onlyDoTheseActionTests: string[] = [];
const onlyDoTheseFileTests: string[] = [];
const onlyDoTheseErrorTests: string[] = [];
const doErrorTests = true;

// --------------------------- Putting action and file tests into a "project" ---------------------------
// (error tests are separate, as they are each their own project)

const fakeFileMap: Record<string, unknown> = {};

const doAllTests =
	onlyDoTheseActionTests.length === 0 &&
	onlyDoTheseFileTests.length === 0 &&
	onlyDoTheseErrorTests.length === 0;
const actionTestNames = doAllTests ? Object.keys(actionTests) : onlyDoTheseActionTests;
const fileTestNames = doAllTests ? Object.keys(fileTests) : onlyDoTheseFileTests;

// add file tests to project
fileTestNames.forEach((fileTestName) => {
	fakeFileMap[fileTestName] = fileTests[fileTestName];
});

// add action tests to project
fakeFileMap['actionTests.mgs'] = {
	fileText: actionTestNames
		.map((testName) => {
			const v = actionTests[testName];
			if (!v) {
				throw new Error('no test by name ' + testName);
			}
			let strung = actionArrayToScript(testName, v.input);
			if (v.pre) {
				if (typeof v.pre === 'string') {
					strung = v.pre + '\n' + strung;
				} else if (Array.isArray(v.pre)) {
					v.pre.push(strung);
					strung = v.pre.join('\n');
				}
			}
			return strung;
		})
		.join('\n\n'),
	expected: {
		scripts: {},
	},
};
actionTestNames.forEach((testName) => {
	const data = actionTests[testName];
	const expectedArr = data.expected ? data.expected : data.input;
	const expectedPrint = actionArrayToScript(testName, expectedArr, true);
	const expectedScripts = fakeFileMap['actionTests.mgs'].expected.scripts;
	if (!expectedScripts) {
		throw new Error('no scripts found by name ' + testName);
	}
	expectedScripts[testName] = expectedPrint;
});

// --------------------------- Comparing objects and printing diffs ---------------------------

type ColoredDifferentString = {
	diff: string;
	pre: string;
};
// todo: strings with quote differences count as different here but not at the point of comparison; resolve
export const colorDifferentStrings = (expected: string, found: string): ColoredDifferentString => {
	const diff: string[] = [];
	const foundChars = found.split('');
	let colored = false;
	let pre = '';
	for (let i = 0; i < foundChars.length; i++) {
		const c = foundChars[i];
		if (!colored) {
			pre += c;
		}
		if (c !== expected[i] && !colored) {
			diff.push(ansiTags.yellow);
			colored = true;
		}
		diff.push(c);
	}
	return {
		diff: diff.join('') + ansiTags.reset,
		pre,
	};
};
const sanitize = (str: string) => str.replace(/([\{\}\[\]\(\)\.\$\|\+\-\*\/])/g, '\\$1');

type ComparedLines = {
	expected: string;
	found: string;
	diff: ColoredDifferentString;
	value?: string;
	fileName: string;
	lineIndex: number;
};
const makeTextUniform = (text: string) =>
	text
		.trim()
		.replace(/[\t ]+/g, ' ')
		.replace(/\/\/.*?[\n$]/g, '');
type ComparedTexts = {
	status: string;
	message?: string;
	lines?: ComparedLines[];
	lengthDiff?: string[];
};
export const compareTexts = (
	_found: string,
	_expected: string,
	fileName?: string,
	thingName?: string,
): ComparedTexts => {
	const foundLines = makeTextUniform(_found)
		.replace(/\+=/g, '+\n=')
		.replace(/-=/g, '-\n=')
		.replace(/\*=/g, '*\n=')
		.replace(/\/=/g, '/\n=')
		.replace(/\?=/g, '?\n=')
		.replace(/%=/g, '%\n=')
		.split(/\n/g)
		.map((v) => v.trim())
		.filter((v) => !!v);
	const expectedLines = makeTextUniform(_expected)
		.replace(/\+=/g, '+\n=')
		.replace(/-=/g, '-\n=')
		.replace(/\*=/g, '*\n=')
		.replace(/\/=/g, '/\n=')
		.replace(/\?=/g, '?\n=')
		.replace(/%=/g, '%\n=')
		.split(/\n/g)
		.map((v) => v.trim())
		.filter((v) => !!v);
	if (foundLines.length !== expectedLines.length) {
		expectedLines.unshift('EXPECTED');
		foundLines.unshift('FOUND');
		const maxLength = expectedLines.reduce(
			(acc, curr) => Math.max(acc, curr.length),
			-Infinity,
		);
		const flushLines: string[] = expectedLines.map((s) => '   ' + s.padEnd(maxLength + 4, ' '));
		const comboLines = flushLines.map((left, i) => {
			let right = foundLines[i] || '';
			if (expectedLines[i] !== right) {
				right = ansiTags.yellow + right + ansiTags.reset;
			}
			return left + right;
		});
		for (let i = comboLines.length; i < foundLines.length; i++) {
			const left = ' '.repeat(maxLength + 4);
			const right = foundLines[i];
			comboLines.push(left + right);
		}
		return {
			status: 'fail',
			message: thingName + ': different line counts',
			lengthDiff: comboLines,
		};
	}
	const lines: ComparedLines[] = [];
	const registeredLabels: Record<string, string> = {};
	foundLines.forEach((found, i) => {
		const expected = expectedLines[i];
		if (expected === found) {
			return;
		}
		// registering specific wildcards
		const wild = expected.match(/(.*)(\*[A-Z]+\*)(.*)/);
		if (wild) {
			const sanitary = wild.map(sanitize);
			const pattern = new RegExp(`${sanitary[1]}([\\da-zA-Z_"]+)${sanitary[3]}`);
			const label = sanitary[2];
			const capture = found.match(pattern);
			if (capture) {
				if (!registeredLabels[label]) {
					registeredLabels[label] = capture[1];
				} else if (registeredLabels[label] !== capture[1]) {
					const diff = wild[1] + ansiTags.yellow + capture[1] + wild[3];
					lines.push({
						expected,
						found,
						diff: {
							diff,
							pre: '',
						},
						value: capture[1],
						fileName: fileName || 'MISSING FILENAME',
						lineIndex: i,
					});
				}
				return;
			}
		}
		// wild wildcards
		const clean = sanitize(expected).replace(/\\\*\\\*\\\*/g, '.+?');
		const regExpected = new RegExp(clean);
		if (found.match(regExpected)) {
			return;
		}
		if (found.replace(/"|'/g, '') === expected.replace(/"|'/g, '')) {
			return;
		}
		// or they really are different
		const diff: ColoredDifferentString = colorDifferentStrings(expected, found);
		lines.push({
			expected,
			found,
			diff,
			fileName: fileName || 'MISSING FILENAME',
			lineIndex: i,
		});
	});
	if (lines.length) {
		return {
			status: 'fail',
			message: `${thingName || fileName}: mismatched lines`,
			lines: lines.map((v) => {
				if (v.value) {
					let registered: string = '';
					Object.entries(registeredLabels).forEach(([k, val]) => {
						if (val === v.value) {
							registered = k;
						}
					});
					v.diff.diff += ` (${registered})`;
				}
				return v;
			}),
		};
	} else {
		return {
			status: 'success',
		};
	}
};

const errors: ComparedTexts[] = [];

// --------------------------- Other diagnostics ---------------------------

type Literal = string | number | boolean | null | undefined;
const isLiteral = (v: unknown): v is Literal => {
	if (typeof v === 'string') return true;
	if (typeof v === 'number') return true;
	if (typeof v === 'boolean') return true;
	if (v === null) return true;
	if (v === undefined) return true;
	return false;
};

// Borrowed from an earlier iteration of mathlang
const simplifyValues = (lh: unknown, rh: unknown) => {
	if (isLiteral(lh)) {
		if (!isLiteral(rh)) throw new Error('expected RH to be literal');
		return simplifyLiteral(lh, rh);
	}
	if (Array.isArray(lh)) {
		if (!Array.isArray(rh)) throw new Error('expected RH to be array');
		return simplifyArrays(lh, rh);
	}
	if (typeof lh === 'object') {
		if (typeof rh !== 'object') throw new Error('expected RH to be object');
		return simplifyObjects({ ...lh }, { ...rh });
	}
	throw new Error('should be unreachable (no types left over?)');
};
const simplifyLiteral = (lh: Literal, rh: Literal) => {
	const red = ansiTags.red + JSON.stringify(rh) + ansiTags.reset;
	const diff =
		lh === rh
			? rh
			: red + ` (expected ${colorDifferentStrings(String(rh) || '', String(lh) || '').diff})`;
	return { lh, rh, diff };
};
const simplifyArrays = (origLH: unknown[] = [], origRH: unknown[] = []) => {
	const newLH: unknown[] = [];
	const newRH: unknown[] = [];
	const newDiffs: unknown[] = [];
	origLH.forEach((left, i) => {
		const right = origRH[i];
		if (isLiteral(left)) {
			if (!isLiteral(right)) {
				throw new Error('expectd RHS to be literal');
			}
			const { lh, rh, diff } = simplifyLiteral(left, right);
			newLH.push(lh);
			newRH.push(rh);
			newDiffs.push(diff);
		} else if (Array.isArray(left)) {
			if (!Array.isArray(right)) throw new Error('expected RH to be array');
			const { lh, rh, diff } = simplifyArrays(left, right);
			newLH.push(lh);
			newRH.push(rh);
			newDiffs.push(diff);
		} else if (typeof left === 'object') {
			if (typeof right !== 'object') throw new Error('expected RH to be object');
			const { lh, rh, diff } = simplifyObjects({ ...left }, { ...right });
			newLH.push(lh);
			newRH.push(rh);
			newDiffs.push(diff);
		} else {
			throw new Error('unreachable?');
		}
	});
	return { lh: newLH, rh: newRH, diff: newDiffs };
};
const simplifyObjects = (origLH: GenericObj = {}, origRH: GenericObj = {}) => {
	delete origLH.debug;
	delete origRH.debug;
	const sortedLH: Record<string, unknown> = {};
	const sortedRH: Record<string, unknown> = {};
	const sortedDiff: Record<string, unknown> = {};
	Object.keys(origLH)
		.sort()
		.forEach((k) => {
			if (isLiteral(origLH[k])) {
				if (!isLiteral(origRH[k])) throw new Error('expected literal');
				const { lh, rh, diff } = simplifyLiteral(origLH[k], origRH[k]);
				sortedLH[k] = lh;
				sortedRH[k] = rh;
				sortedDiff[k] = diff;
			} else if (Array.isArray(origLH[k])) {
				if (!Array.isArray(origRH[k])) throw new Error('expected RH to be array');
				const { lh, rh, diff } = simplifyArrays(origLH[k], origRH[k]);
				sortedLH[k] = lh;
				sortedRH[k] = rh;
				sortedDiff[k] = diff;
			} else if (typeof origLH[k] === 'object') {
				if (typeof origRH[k] !== 'object') throw new Error('expected RH to be object');
				const { lh, rh, diff } = simplifyObjects({ ...origLH[k] }, { ...origRH[k] });
				sortedLH[k] = lh;
				sortedRH[k] = rh;
				sortedDiff[k] = diff;
			} else {
				throw new Error('unreachable');
			}
		});
	return { lh: sortedLH, rh: sortedRH, diff: sortedDiff };
};
const reportObjectDiffs = (expected: unknown, found: unknown): string[] => {
	const messages: string[] = [];
	const { lh, rh, diff } = simplifyValues(expected, found);
	const jsonLeft = JSON.stringify(lh, null, '  ');
	const jsonRight = JSON.stringify(rh, null, '  ');
	if (jsonLeft !== jsonRight) {
		if (typeof lh === 'object') {
			const message = `Found ${JSON.stringify(diff, null, '  ')}`;
			messages.push(message);
		} else {
			const message = `Found ${ansiTags.red}${jsonRight}: ${jsonRight}${ansiTags.reset}, expected value ${ansiTags.yellow}${jsonLeft}${ansiTags.reset}`;
			messages.push(message);
		}
	}
	return messages.map((s) => s.replace(/\\u001b/g, '\u001b'));
};

type CompareError = { status: string; message: string };
const compareConstants = (
	fileName: string,
	_found: Record<string, unknown>,
	_expected: Record<string, unknown>,
) => {
	const errors: CompareError[] = [];
	const foundKeys = Object.keys(_found);
	const expectedKeys = Object.keys(_expected);
	expectedKeys.forEach((k) => {
		if (!foundKeys.includes(k)) {
			errors.push({
				status: 'fail',
				message: `${fileName}: Did not find expected constant '${k}'`,
			});
		}
	});
	foundKeys.forEach((k) => {
		if (!expectedKeys.includes(k)) {
			errors.push({
				status: 'fail',
				message: `${fileName}: Found unexpected constant '${k}'`,
			});
			return; // quit exploring this constant
		}
		const found = _found[k];
		const expected = _expected[k];
		const comparedErrors = reportObjectDiffs(expected, found);
		comparedErrors.forEach((string) => {
			errors.push({
				status: 'fail',
				message: `${fileName} constants values do not match:\n${string}`,
			});
		});
	});
	return errors;
};
const compareDialogs = (fileName: string, dialogName: string, expectedDialogs, foundDialogs) => {
	const errors: CompareError[] = [];
	if (expectedDialogs.length !== foundDialogs.length) {
		return [
			{
				status: 'fail',
				message: `${fileName}: differing dialog quantity for ${dialogName}`,
			},
		];
	}
	expectedDialogs.forEach((expected, i) => {
		const found = foundDialogs[i];
		const diffs = reportObjectDiffs(expected, found);
		if (diffs.length) {
			errors.push({
				status: 'fail',
				message: `${fileName}: dialog "${dialogName}" [${i}] mismatch\n${diffs.join('\n')}`,
			});
		}
	});
	return errors;
};

// --------------------------- THE OWL ---------------------------

/*
variant   | labels | indices | copyscript | flattened gotos
----------+--------+---------+------------+----------------
prePrint  |  yes   |         |            |      yes
testPrint |  yes   |         |    yes     |      yes
print     |        |   yes   |    yes     |      yes

TODO: Is there a better way?
*/

const doActionTest = (scriptName: string, actionExpected, actionFound): ComparedTexts | null => {
	const expected = actionExpected[scriptName];
	const found = actionFound[scriptName].testPrint;
	const compared = compareTexts(found, expected, '', `script "${scriptName}"`);
	if (compared.status !== 'success') {
		return compared;
	}
	return null;
};

const runTests = async () => {
	parseProject(fakeFileMap, {}).then((result) => {
		// ACTION TESTS
		const fileMap = result.fileMap;
		const expected = fileMap['actionTests.mgs'].expected;
		if (!expected) throw new Error('test lacks expected data');
		const actionsExpected = expected.scripts;
		const actionsFound = result.scripts;
		const actionErrors = actionTestNames
			.map((v) => doActionTest(v, actionsExpected, actionsFound))
			.filter((v) => v !== null);
		errors.push(...actionErrors);

		// FILE TESTS
		if (onlyDoTheseActionTests.length === 0) {
			fileTestNames.forEach((fileName) => {
				// Scripts
				const fileExpectedData = fileMap[fileName].expected || {};
				const fileFoundP = fileMap[fileName].parsed;
				if (!fileFoundP) {
					throw new Error(`File ${fileName} failed to parse`);
				}
				const fileScriptNames = Object.keys(fileExpectedData.scripts || {});
				const foundScripts = result.scripts;
				const expectedScripts = fileExpectedData.scripts;
				if (!expectedScripts) {
					throw new Error(`file ${fileName} entirely lacks expected scripts`);
				}
				fileScriptNames.forEach((scriptName) => {
					const expected = expectedScripts[scriptName].trim();
					const found = (foundScripts[scriptName]?.printed || '').trim();
					const compared = compareTexts(found, expected, '', `script "${scriptName}"`);
					if (compared.status !== 'success') {
						errors.push(compared);
					}
				});

				// Constants
				const constantsDiffs = compareConstants(
					fileName,
					fileFoundP.constants || {},
					fileExpectedData.constants || {},
				);
				if (constantsDiffs.length) {
					errors.push(...constantsDiffs);
				}

				// Dialogs
				const foundDialogs = result.dialogs;
				const expectedDialogs = fileExpectedData.dialogs || {};
				const dialogNames = Object.keys(expectedDialogs) || {};
				dialogNames.forEach((dialogName) => {
					const expected = expectedDialogs[dialogName].dialogs || {};
					const found = foundDialogs[dialogName].dialogs || {};
					const compared = compareDialogs(fileName, dialogName, expected, found);
					compared.forEach((err) => {
						errors.push(err);
					});
				});
			});
		}
		// PRINT TEST RESULTS
		if (result.mgsErrors) console.error(result.mgsErrors);
		if (result.mgsWarnings) console.warn(result.mgsWarnings);
		errors.forEach((error) => {
			console.error('\n' + error.message);
			if (error.lines) {
				error.lines.forEach((v) => {
					console.error(`   Found: ${v.found}`);
					console.error(`Expected: ${v.expected}`);
				});
			}
			if (error.lengthDiff) {
				console.error(error.lengthDiff.join('\n'));
			}
		});

		// DONE
		if (errors.length === 0) {
			if (result.mgsWarnings || result.mgsErrors) {
				console.log('Action or file unit tests had some syntax errors:');
				if (result.mgsWarnings) console.warn(result.mgsWarnings);
				if (result.mgsErrors) console.error(result.mgsErrors);
			} else {
				const normalTestsRun = actionTestNames.length + fileTestNames.length;
				if (normalTestsRun > 1) {
					console.log(`All ${normalTestsRun} basic unit tests passed!`);
				} else if (actionTestNames.length) {
					console.log(`The action unit test '${actionTestNames[0]}' passed!`);
				} else if (fileTestNames.length) {
					console.log(`The file unit test '${fileTestNames[0]}' passed!`);
				}
			}
		}
	});
};

runTests();

// --------------------------- ERROR TESTS ---------------------------

const runErrorTests = async (testNames: string[]) => {
	const promises = testNames.map(async (testName) => {
		const errorErrors: string[] = [];
		const testData = errorTests[testName];
		const errorTestFileMap = {
			[testName + '.mgs']: { fileText: testData.testText, scripts: {} },
		};
		const header = `Error test ${testName}:`;
		await parseProject(errorTestFileMap, {}).then((p) => {
			let printWarnings = false;
			let printErrors = false;
			// check warnings
			if (p.warnings.length !== testData.expectedWarnings.length) {
				printWarnings = true;
				errorErrors.push(
					`${header} Found ${p.warnings.length} warnings, expected ${testData.expectedWarnings.length}`,
				);
			} else {
				testData.expectedWarnings.forEach((expected, i) => {
					const found = p.warnings[i].type;
					if (found !== expected) {
						printWarnings = true;
						errorErrors.push(
							`${header} Found warning '${found}', expected '${expected}'`,
						);
					}
				});
			}
			if (printWarnings) console.warn(p.mgsWarnings);
			// check errors
			if (p.errors.length !== testData.expectedErrors.length) {
				printErrors = true;
				errorErrors.push(
					`${header} Found ${p.errors.length} errors, expected ${testData.expectedErrors.length}`,
				);
			} else {
				testData.expectedErrors.forEach((expected, i) => {
					const found = p.errors[i].type;
					if (found !== expected) {
						printErrors = true;
						errorErrors.push(
							`${header} Found error '${found}', expected '${expected}'`,
						);
					}
				});
			}
			if (printErrors) console.error(p.mgsErrors);
		});
		return errorErrors;
	});
	const allErrorErrors = (await Promise.all(promises)).filter((v) => v).flat();
	if (allErrorErrors.length === 0) {
		if (testNames.length === 1) {
			console.log(`Error test "${testNames[0]}" OK`);
		} else {
			console.log(`All ${testNames.length} error tests OK`);
		}
	} else {
		allErrorErrors.forEach((v) => console.error(v));
	}
};

if (doAllTests && doErrorTests) {
	runErrorTests(Object.keys(errorTests));
} else if (!doAllTests && onlyDoTheseErrorTests.length > 0) {
	runErrorTests(onlyDoTheseErrorTests);
}
