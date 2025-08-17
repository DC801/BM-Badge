// Compares old JSON output with new JSON output after being translated to mathlang via regex.
// Capable of following branches of if-else structures even when their output's line ordering is different.

import { writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { resolve as _resolve } from 'node:path';

// The original JSON output as intercepted manually from the original encoder.
// Lacks some scripts for some reason.
// import { composites as oldPost } from './comparisons/exfiltrated_composites.ts';
import {
	compareFileSerialDialogs,
	compareSerialDialogs,
	type EncoderSerialDialog,
	serialDialogs as origSerialDialogs,
} from './comparisons/exfiltrated_serialdialogs.ts';
import {
	compareBigDialog,
	compareSeriesOfBigDialogs,
	type EncoderDialog,
	dialogs as origDialogs,
} from './comparisons/exfiltrated_dialogs.ts';

// The original JSON output at an earlier stage, also intercepted manually from the original encoder.
// Has scripts the other lacks.
import { idk as oldPre } from './comparisons/exfiltrated_idk.ts';

import { parseProject } from './parser.ts';
import { ansiTags, printScript } from './parser-utilities.ts';
import { compareNonlinearScripts } from './parser-adventure.ts';
import { ProjectState } from './parser-project.ts';
import { DialogDefinition, SerialDialog } from './parser-types.ts';
import { Action } from './parser-bytecode-info.ts';

export const makeMap = (path: string) => {
	let map = {};
	const files = readdirSync(path, { withFileTypes: true });
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		if (file.name === '.DS_Store') continue;
		const filePath = `${path}/${file.name}`;
		if (file.isDirectory()) {
			map = {
				...map,
				...makeMap(filePath),
			};
		} else {
			const fileBlob = readFileSync(filePath);
			const type = filePath.split('.').pop();
			map[file.name] = {
				name: file.name,
				type,
				arrayBuffer: () => {
					return new Promise((resolve) => {
						resolve(fileBlob);
					});
				},
				text: () => {
					return new Promise((resolve) => {
						resolve(fileBlob.toString('utf8'));
					});
				},
				get fileText() {
					return fileBlob.toString('utf8');
				},
			};
		}
	}
	return map;
};

const splitAndStripNonGotoActions = (text: string): string[] => {
	const ret: string[] = [];
	text.split('\n').forEach((origLine) => {
		let line = origLine.trim();
		// strip label/index goto definitions (keep script jumps)
		const match = line.match(/((.+) then) goto (index \d+|label .+);/);
		line = match ? match[1] : line;
		// ignore bare label/index gotos
		if (/^\s*goto (index \d+|label .+)/.test(line)) {
			return;
		}
		// split script jumps in case they're separate some times and not others
		// (this is actually happening)
		// we're taking away the word script apparently
		const gotoScriptSplit = line.match(/^(if (.+) then) (goto script (".+");)/);
		if (gotoScriptSplit) {
			ret.push(gotoScriptSplit[1]);
			ret.push(gotoScriptSplit[3]);
			return;
		}
		if (/^\s*\/\//.test(line)) {
			// ignore comments
			return;
		}
		if (/^\s*.+:$/.test(line)) {
			// ignore labels
			return;
		}
		// take off any RHS comments (idk if there are any tbh)
		const comments = line.match(/(\s*[^\s]+\s*)\/\/.+$/);
		line = comments ? comments[1].trim() : line;
		// genericize dialog identifiers that squeaked through
		if (line.startsWith('show') || line.startsWith('concat')) {
			line = line.replace(/(-|:)\d+:\d+";$/, '-XX";').replace(/-/g, '_');
		}
		ret.push(line);
	});
	return ret;
};

type PrintComparison = { old: string; new: string };
const inputPath = _resolve('./scenario_source_files');
const fileMap = makeMap(inputPath);

type ScriptComparison = {
	type: 'functional' | 'bad' | 'tally';
	old: string;
	new: string;
};
const compareScripts = (p: ProjectState, scriptName: string): ScriptComparison => {
	// let oldActions = oldPost[scriptName];
	// let newActions = p.scripts[scriptName].actions;
	// if (!oldActions) {
	// oldActions = oldPre[scriptName];
	// newActions = p.scripts[scriptName].preActions;
	// }
	if (!oldPre[scriptName]) {
		return {
			type: 'bad',
			old: `${scriptName} {\n\t// MISSING\n}`,
			new: `${scriptName} {\n\t// not yet processed, but present\n}`,
		};
	}
	const oldActions = oldPre[scriptName].map(Action.fromArgs);
	const newActions = p.scripts[scriptName].preActions?.map(Action.fromArgs);
	if (!newActions) throw new Error(`missing newActions for script "${scriptName}"`);
	if (!oldActions) throw new Error(`missing oldActions for script "${scriptName}"`);

	const oldPrint = printScript(scriptName, oldActions);
	const newPrint = printScript(scriptName, newActions);
	if (
		(!oldPrint.includes('goto label') || !oldPrint.includes('goto index')) &&
		(!newPrint.includes('goto label') || !newPrint.includes('goto index'))
	) {
		const oldPrintLines = splitAndStripNonGotoActions(oldPrint);
		const newPrintLines = splitAndStripNonGotoActions(newPrint);
		if (oldPrintLines.join('\n') === newPrintLines.join('\n')) {
			// Literal exact copies.
			return {
				type: 'tally',
				old: oldPrint,
				new: newPrint,
			};
		}
	}
	const compared = compareNonlinearScripts(oldPrint, newPrint, scriptName);
	if (compared) {
		return {
			type: 'functional',
			old: oldPrint,
			new: newPrint,
		};
	} else {
		return {
			type: 'bad',
			old: oldPrint,
			new: newPrint,
		};
	}
};

// TODO: put into types
const sortSerialDialogs = (dialogs: Record<string, EncoderSerialDialog | SerialDialog>) => {
	const ret = {
		NAMED: {},
	};
	Object.entries(dialogs).forEach(([name, values]) => {
		const splits = name.split('.mgs');
		if (splits.length === 1) {
			ret.NAMED[name] = values;
		} else {
			const useName = splits[0];
			ret[useName] = ret[useName] || [];
			ret[useName].push(values);
		}
	});
	return ret;
};
// TODO: put into types
const sortDialogs = (dialogs: Record<string, EncoderDialog[] | DialogDefinition>) => {
	const ret = {
		NAMED: {},
	};
	Object.entries(dialogs).forEach(([name, values]) => {
		const splits = name.split('.mgs');
		if (splits.length === 1) {
			ret.NAMED[name] = values;
		} else {
			const useName = splits[0];
			ret[useName] = ret[useName] || [];
			ret[useName].push(values);
		}
	});
	return ret;
};

const identical: Record<string, PrintComparison> = {};
const functional: Record<string, PrintComparison> = {};
const bad: Record<string, PrintComparison> = {};
parseProject(fileMap, {}).then((p: ProjectState): void => {
	// console.log('PROJECT');
	// console.log(p);

	// COMPARING SERIAL DIALOGS
	const foundSerialDialogs = {};
	Object.entries(p.serialDialogs).map(([k, v]) => {
		foundSerialDialogs[k] = v.serialDialog;
	});
	const expectedSerialDialogs: Record<string, EncoderSerialDialog> = origSerialDialogs;
	const expectedSerialDialogsSorted = sortSerialDialogs(expectedSerialDialogs);
	const foundSerialDialogsSorted = sortSerialDialogs(foundSerialDialogs);

	const serialDialogNames = new Set([
		...Object.keys(expectedSerialDialogsSorted.NAMED),
		...Object.keys(foundSerialDialogsSorted.NAMED),
	]);
	const serialDialogFileNames = new Set([
		...Object.keys(expectedSerialDialogsSorted),
		...Object.keys(foundSerialDialogsSorted),
	]);
	serialDialogFileNames.delete('NAMED');

	// Comparing named serial dialogs
	const namedSerialDialogDiffs: string[] = [];
	[...serialDialogNames].forEach((name) => {
		const found: SerialDialog = foundSerialDialogsSorted.NAMED[name];
		const expected: EncoderSerialDialog = expectedSerialDialogsSorted.NAMED[name];
		const diffs = compareSerialDialogs(expected, found, 'serialDialogName', name);
		namedSerialDialogDiffs.push(...diffs);
	});
	if (namedSerialDialogDiffs.length) {
		console.error(`Named serial dialogs: found ${namedSerialDialogDiffs.length} differences`);
		console.error(namedSerialDialogDiffs.join('\n'));
	} else {
		console.log(`All ${serialDialogNames.size} named serial dialogs are identical!`);
	}

	// Comparing anonymous serial dialogs
	const anonymousSerialDialogDiffs: string[] = [];
	const anonymousSerialDialogWarnings: string[] = [];
	[...serialDialogFileNames].forEach((name) => {
		const expected: EncoderSerialDialog[] = expectedSerialDialogsSorted[name];
		const found: SerialDialog[] = foundSerialDialogsSorted[name];
		if (Array.isArray(expected) && Array.isArray(found) && expected.length !== found.length) {
			namedSerialDialogDiffs.push(
				`Expected ${expected.length} serial dialogs in file ${name}, found ${found.length}`,
			);
			return;
		}
		const diffs = compareFileSerialDialogs(expected, found, name);
		anonymousSerialDialogDiffs.push(...diffs.errors);
		anonymousSerialDialogWarnings.push(...diffs.warnings);
	});
	if (anonymousSerialDialogDiffs.length) {
		console.error(
			`Anonymous serial dialogs: found ${anonymousSerialDialogDiffs.length} differences`,
		);
		if (anonymousSerialDialogWarnings.length) {
			console.log(
				`    ...and ${anonymousSerialDialogWarnings.length} anonymous serial dialogs were only probable matches (due to text wrap bug from old version)`,
			);
		}
		console.error(anonymousSerialDialogDiffs.join('\n'));
	} else {
		if (anonymousSerialDialogWarnings.length) {
			console.log(
				`Anonymous serial dialogs from all ${serialDialogFileNames.size} files are identical with the caveat that...\n` +
					`    ...${anonymousSerialDialogWarnings.length} anonymous serial dialogs were probable matches (due to text wrap bug from old version)\n` +
					`    Good enough!`,
			);
		} else {
			console.log(
				`All anonymous serial dialogs from all ${serialDialogFileNames.size} files are identical!`,
			);
		}
	}

	// COMPARING DIALOGS
	const foundDialogs = p.dialogs;
	const expectedDialogs: Record<string, EncoderDialog[]> = origDialogs;
	const expectedDialogsSorted = sortDialogs(expectedDialogs);
	const foundDialogsSorted = sortDialogs(foundDialogs);

	const dialogNames = new Set([
		...Object.keys(expectedDialogsSorted.NAMED),
		...Object.keys(foundDialogsSorted.NAMED),
	]);
	const dialogFileNames = new Set([
		...Object.keys(expectedDialogsSorted),
		...Object.keys(foundDialogsSorted),
	]);
	dialogFileNames.delete('NAMED');

	// Comparing named dialogs
	const namedDialogDiffs: string[] = [];
	[...dialogNames].forEach((name) => {
		const found: DialogDefinition = foundDialogsSorted.NAMED[name];
		const expected: EncoderDialog[] = expectedDialogsSorted.NAMED[name];
		const diffs = compareBigDialog(expected, found.dialogs, 'dialogName', name);
		namedDialogDiffs.push(...diffs);
	});
	if (namedDialogDiffs.length) {
		console.error(`Named dialogs: found ${namedDialogDiffs.length} differences`);
		console.error(namedDialogDiffs.join('\n'));
	} else {
		console.log(`All ${dialogNames.size} named dialogs are identical!`);
	}

	// Comparing anonymous dialogs
	const anonymousDialogDiffs: string[] = [];
	[...dialogFileNames].forEach((name) => {
		const expected: EncoderDialog[][] = expectedDialogsSorted[name];
		const found: DialogDefinition[] = foundDialogsSorted[name];
		const diffs = compareSeriesOfBigDialogs(expected, found, name);
		anonymousDialogDiffs.push(...diffs);
	});
	if (anonymousDialogDiffs.length) {
		console.error(`Anonymous dialogs: found ${anonymousDialogDiffs.length} differences`);
		console.error(anonymousDialogDiffs.join('\n'));
	} else {
		console.log(`All anonymous dialogs from all ${dialogFileNames.size} files are identical!`);
	}

	// COMPARING SCRIPTS
	const scriptNames = Object.keys(p.scripts);
	let tally = 0;
	let functionalTally = 0;
	let badTally = 0;
	scriptNames.forEach((scriptName) => {
		const result = compareScripts(p, scriptName);
		if (result.type === 'tally') {
			tally += 1;
			identical[scriptName] = {
				old: result.old,
				new: result.new,
			};
			return;
		}
		if (result.type === 'functional') {
			functionalTally += 1;
			functional[scriptName] = {
				old: result.old,
				new: result.new,
			};
			return;
		}
		if (result.type === 'bad') {
			badTally += 1;
			bad[scriptName] = {
				old: result.old,
				new: result.new,
			};
			return;
		}
	});

	const badNames: string[] = [];
	const olds: string[] = [];
	const news: string[] = [];
	Object.entries(bad)
		.sort((a, b) => a[1].old.length - b[1].old.length)
		.forEach((entry: [string, PrintComparison]) => {
			const [k, v] = entry;
			badNames.push(k);
			olds.push(v.old);
			news.push(v.new);
		});
	const clearlyDifferent =
		badTally === 0
			? `${badTally} were clearly different`
			: `${ansiTags.red}${badTally} were clearly different${ansiTags.reset}:`;
	console.log(
		`${tally} scripts were identical, ${functionalTally} ${badTally === 1 ? 'was' : 'were'} functionally identical, and ${clearlyDifferent}`,
	);
	badNames.forEach((oldScriptName) => {
		console.error(`  - ${ansiTags.red}${oldScriptName}${ansiTags.reset}`);
	});
	writeFileSync(`./comparisons/olds.mgs`, olds.join('\n\n'));
	writeFileSync(`./comparisons/news.mgs`, news.join('\n\n'));
});
