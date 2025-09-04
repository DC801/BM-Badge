import initTreeSitter from './parser-init-tree-sitter.ts';
import { debugLog, printableMessage, ansiTags as ansi, printScript } from './parser-utilities.ts';

import { type FileMap, ProjectState } from './parser-project.ts';
import {
	Action,
	breakIfNotString,
	CheckAction,
	COPY_SCRIPT,
	GOTO_ACTION_INDEX,
	LABEL,
} from './parser-bytecode-info.ts';

import {
	DialogDefinition,
	ScriptDefinition,
	SerialDialogDefinition,
	LabelDefinition,
	CommentNode,
	GotoLabel,
	CopyMacro,
	AnyNode,
	MathlangLocation,
	MathlangMessage,
	type MathlangMessageType,
} from './parser-types.ts';

type FileCategory = 'scripts' | 'dialogs' | 'serialDialogs';
type Definition = ScriptDefinition | DialogDefinition | SerialDialogDefinition;

export const parseProject = async (fileMap: FileMap, scenarioData: Record<string, unknown>) => {
	const parser = await initTreeSitter();
	const p = new ProjectState(parser, fileMap, scenarioData);
	// PARSE EACH FILE
	Object.keys(fileMap).forEach((fileName) => {
		if (fileName.endsWith('.mgs') && !fileMap[fileName].parsed) {
			debugLog(`Parsing file ${ansi.c}"${fileName}"${ansi.reset}`);
			p.parseFile(fileName);
		}
	});

	// MAKE FILE SCRIPTS/DIALOGS GLOBAL FOR PROJECT
	// Q. why do these one at a time? so a single file can be parsed on its own, and added/removed on its own (later)
	// TODO: could they not be added to an object for that file rather than being left in sequence?
	// That way we don't have to filter out those nodes anymore when script parsing?
	Object.keys(fileMap).forEach((fileName) => {
		if (!fileName.endsWith('.mgs')) return;
		const f = fileMap[fileName].parsed;
		if (!f) throw new Error(`File "${fileName}" failed to parse in time (?)`);
		f.nodes.forEach((node) => {
			if (node instanceof ScriptDefinition) {
				p.addScript(node);
			} else if (node instanceof DialogDefinition) {
				p.addDialog(node);
			} else if (node instanceof SerialDialogDefinition) {
				p.addSerialDialog(node);
			}
		});
		debugLog(
			`File ${ansi.c}"${fileName}"${ansi.reset} complete! ` + f.printableMessageInformation(),
		);
	});

	// CHECK FOR DUPLICATES
	const cats: FileCategory[] = ['scripts', 'dialogs', 'serialDialogs'];
	cats.forEach((category) => {
		const entries = Object.entries(p.duplicates[category]);
		entries.forEach(([name, dupes]: [string, Definition[]]) => {
			// One error message, multiple locations
			const locations = dupes.map((dupe: Definition) =>
				MathlangLocation.quick(
					dupe.debug.f,
					dupe.debug.node.firstNamedChild || dupe.debug.node,
				),
			);
			let type: MathlangMessageType = 'duplicate script';
			if (category === 'dialogs') type = 'duplicate dialog';
			if (category === 'serialDialogs') type = 'duplicate serial dialog';
			const error = new MathlangMessage(
				locations,
				type,
				`multiple ${category} with name "${name}"`,
			);
			p.newError(error);
			// Increment error count for that file
			dupes.forEach((dupe: Definition) => {
				const file = p.fileMap[dupe.debug.fileName].parsed;
				if (!file) {
					throw new Error(`No parsed file found by name "${dupe.debug.fileName}"`);
				}
				file.errorCount += 1;
			});
		});
	});

	// STANDARDIZE ACTIONS

	Object.keys(p.scripts).forEach((scriptName) => {
		const standardizedActions: AnyNode[] = p.scripts[scriptName].actions
			.filter(
				(v) =>
					!(v instanceof CommentNode) &&
					!(v instanceof DialogDefinition) &&
					!(v instanceof SerialDialogDefinition),
			)
			// This is to be backward compatibile with the old output for comparison reasons
			// todo: change it once the unit tests are good enough to handle sophisticated cases
			.map((action) => {
				if (action instanceof CopyMacro) {
					const script = breakIfNotString(action.script);
					return COPY_SCRIPT.quick(script);
				}
				if (action instanceof LabelDefinition) {
					const value = breakIfNotString(action.label);
					return new LABEL({ value });
				}
				if (action instanceof GotoLabel) {
					const ret = new GOTO_ACTION_INDEX({
						action_index: breakIfNotString(action.label),
					});
					return ret;
				}
				return action;
			});
		// Snapshot current action state (pre copy_script, pre label baking)
		p.scripts[scriptName].preBakingActions = standardizedActions;
		p.scripts[scriptName].prePrint = printScript(scriptName, standardizedActions);
		// final(ish)
		p.scripts[scriptName].actions = standardizedActions.map((v) => v.clone());
	});

	// DO COPY_SCRIPT
	Object.keys(p.scripts).forEach((scriptName) => {
		if (!p.scripts[scriptName].copyScriptResolved) {
			const fileName = p.scripts[scriptName].debug.fileName;
			const f = p.fileMap[fileName].parsed || p.scripts[scriptName].debug.f;
			const node = p.scripts[scriptName].debug.node;
			// todo: better sources of f, node?
			p.bakeCopyScriptSingle(f, node, scriptName);
		}
	});

	// Snapshot current action state (post copy_script, pre label baking)
	Object.keys(p.scripts).forEach((scriptName) => {
		p.scripts[scriptName].testPrint = printScript(scriptName, p.scripts[scriptName].actions);
	});

	// BAKE LABELS
	Object.keys(p.scripts).forEach((scriptName) => {
		const scriptData = p.scripts[scriptName];
		// Register labels with action indicies
		const registry: Record<string, number> = {};
		const actions = scriptData.actions;
		let realIndex = 0;
		for (let i = 0; i < actions.length; i++) {
			const currAction = actions[i];
			if (currAction instanceof CommentNode) {
				continue;
			}
			if (!(currAction instanceof Action)) {
				throw new Error('found nonstandardized action');
			}
			if (currAction instanceof LABEL) {
				const useLabel = currAction.value;
				registry[useLabel] = realIndex;
				const comment = `'${useLabel}':`;
				actions[i] = CommentNode.quick(scriptData.debug, comment);
			} else {
				realIndex += 1;
			}
		}
		actions.forEach((action) => {
			let useLabel: string | undefined = undefined;
			if (action instanceof CheckAction) {
				useLabel = action.label;
			}
			if (action instanceof GOTO_ACTION_INDEX && typeof action.action_index === 'string') {
				useLabel = action.action_index;
			}
			if (!useLabel) return;
			const jumpToIndex = registry[useLabel];
			if (jumpToIndex === undefined) {
				throw new Error(
					`Jump index not registered for label "${useLabel}" in script "${scriptName}"`,
				);
			}
			if (action instanceof CheckAction) {
				delete action.label;
				action.jump_index = jumpToIndex;
			}
			if (action instanceof GOTO_ACTION_INDEX) {
				action.action_index = jumpToIndex;
			}
		});
	});

	// Snapshot current action state (post copy_script, post label baking)
	Object.keys(p.scripts).forEach((scriptName) => {
		const actions = p.scripts[scriptName].actions;
		p.scripts[scriptName].printed = printScript(scriptName, actions);
		p.scripts[scriptName].actions = actions.filter((item) => item instanceof Action);
	});

	// PRINT ERRORS

	let printErrors = '';
	let printWarnings = '';

	const errCount = p.errors.length;
	const warnCount = p.warnings.length;
	if (errCount || warnCount) {
		const messages: string[] = [];
		if (errCount) {
			messages.push(ansi.red + `${errCount} error${plural(errCount)}` + ansi.reset);
		}
		if (warnCount) {
			messages.push(ansi.yellow + `${warnCount} warning${plural(warnCount)}` + ansi.reset);
		}
		// console.log(`Issues found: ${messages.join(', ')}`);
		p.warnings.forEach((message) => {
			const str = ansi.yellow + printableMessage(p.fileMap, 'Warning', message) + ansi.reset;
			printWarnings += '\n' + str;
			// .replace(/\u001B\[\d+m/g, '');
			// console.warn(str);
		});
		p.errors.forEach((message) => {
			const str = ansi.red + printableMessage(p.fileMap, 'Error', message) + ansi.reset;
			printErrors += '\n' + str;
			// .replace(/\u001B\[\d+m/g, '');
			// console.error(str);
		});
		p.mgsErrors = printErrors;
		p.mgsWarnings = printWarnings;
	} else {
		console.log(`All your project's MGS files parsed with no issues!`);
	}

	// DONE
	return p;
};

const plural = (n: number): string => (n !== 1 ? 's' : '');
