import { Parser } from 'web-tree-sitter';
import {
	reportErrorNodes,
	reportMissingChildNodes,
	simplifyLabelGotos,
	temporaryCount,
} from './parser-utilities.ts';
import { FileState } from './parser-file.ts';
import { handleNode } from './parser-node.ts';
import {
	AnyNode,
	MathlangNode,
	MathlangMessage,
	MathlangLocation,
	ScriptDefinition,
	DialogDefinition,
	SerialDialogDefinition,
	CommentNode,
	CopyMacro,
} from './parser-types.ts';
import { Action, COPY_SCRIPT, isHasVariables, isMightHaveLabel } from './parser-bytecode-info.ts';
import { namedChildren, optionalChildForField } from './parser-capture.ts';
import { type TestExpected } from './parser-test-data-files.ts';

type FileMapEntry = {
	arrayBuffer: Promise<unknown>;
	fileText: string;
	name: string;
	text: Promise<unknown>;
	type: string;
	parsed?: FileState;
	expected?: TestExpected;
};

const copyRecursion: string[] = [];

export type FileMap = Record<string, FileMapEntry>;
export class ProjectState {
	// stuff needed to be handed around
	parser: Parser;
	fileMap: FileMap;
	// global project things
	scripts: Record<string, ScriptDefinition>;
	dialogs: Record<string, DialogDefinition>;
	serialDialogs: Record<string, SerialDialogDefinition>;
	// duplicates
	duplicates: {
		scripts: Record<string, ScriptDefinition[]>;
		dialogs: Record<string, DialogDefinition[]>;
		serialDialogs: Record<string, SerialDialogDefinition[]>;
	};
	integers: Set<string>;
	// error/warning messages
	errors: MathlangMessage[];
	warnings: MathlangMessage[];
	mgsErrors: string;
	mgsWarnings: string;
	// auto counter, so that auto-generated gotos don't share labels:
	gotoSuffixValue: number;
	constructor(tsParser: Parser, fileMap: FileMap, scenarioData: Record<string, unknown>) {
		// why did we need to do this?
		Object.entries(scenarioData).forEach(([k, v]) => {
			this[k] = v;
		});
		this.parser = tsParser;
		this.fileMap = fileMap;
		this.scripts = {};
		this.dialogs = {};
		this.serialDialogs = {};
		this.duplicates = {
			scripts: {},
			dialogs: {},
			serialDialogs: {},
		};
		this.mgsErrors = '';
		this.mgsWarnings = '';
		this.integers = new Set();
		this.errors = [];
		this.warnings = [];
		this.gotoSuffixValue = 0;
	}
	newError(v: MathlangMessage) {
		this.errors.push(v);
	}
	newWarning(v: MathlangMessage) {
		this.warnings.push(v);
	}
	advanceGotoSuffix() {
		return ++this.gotoSuffixValue;
	}
	getGotoSuffix() {
		return this.gotoSuffixValue;
	}

	// for adding a file's data to the project
	addScript(data: ScriptDefinition) {
		const name = data.scriptName;
		data.rawNodes = data.actions; // making a backup of actions
		// finalize actions
		const finalizedActions: AnyNode[] = [];
		data.rawNodes.forEach((node) => {
			if (node instanceof ScriptDefinition) {
				this.addScript(node);
			} else if (node instanceof DialogDefinition) {
				this.addDialog(node);
			} else if (node instanceof SerialDialogDefinition) {
				this.addSerialDialog(node);
			} else {
				finalizedActions.push(node);
			}
		});
		data.actions = simplifyLabelGotos(finalizedActions.flat());

		if (!this.scripts[name]) {
			this.scripts[name] = data;
			return;
		}
		const oldLocation = this.scripts[name].debug;
		const newLocation = data.debug;
		if (oldLocation.isIdenticalTo(newLocation)) {
			throw new Error(
				'UNREACHABLE? This is maybe a duplicate script definition within a fn; cannot use same solution as (s)dialogs; think of something else!',
			);
		}
		if (!this.duplicates.scripts[name]) {
			this.duplicates.scripts[name] = [this.scripts[name]];
		}
		this.duplicates.scripts[name].push(data);
	}
	addDialog(data: DialogDefinition) {
		const name = data.dialogName;
		if (!this.dialogs[name]) {
			this.dialogs[name] = data;
			return;
		}
		// todo: it's possible the dialogs themselves are different due to settings and when fns are "called"
		// this is currently only checking whether the definition node location is the same, not whether the contents are the same
		const oldLocation = this.dialogs[name].debug;
		const newLocation = data.debug;
		if (oldLocation.isIdenticalTo(newLocation)) {
			return;
		}
		if (!this.duplicates.dialogs[name]) {
			this.duplicates.dialogs[name] = [this.dialogs[name]];
		}
		this.duplicates.dialogs[name].push(data);
	}
	addSerialDialog(data: SerialDialogDefinition) {
		const name = data.dialogName;
		if (!this.serialDialogs[name]) {
			this.serialDialogs[name] = data;
			return;
		}
		// todo: it's possible the dialogs themselves are different due to settings and when fns are "called"
		// this is currently only checking whether the definition node location is the same, not whether the contents are the same
		const oldLocation = this.serialDialogs[name].debug;
		const newLocation = data.debug;
		if (oldLocation.isIdenticalTo(newLocation)) {
			return;
		}
		if (!this.duplicates.serialDialogs[name]) {
			this.duplicates.serialDialogs[name] = [this.serialDialogs[name]];
		}
		this.duplicates.serialDialogs[name].push(data);
	}

	// take the given file name and expand all copy_script inside
	// needs to be here because it can call itself
	bakeCopyScriptSingle(debug: MathlangLocation, scriptName: string) {
		// Recursion detection
		if (copyRecursion.includes(scriptName)) {
			copyRecursion.push(scriptName);
			const type = 'recursive copy_script';
			const message = `copy_script recursion not allowed (script "${scriptName}")`;
			const footer = '\n       -> ' + copyRecursion.join('\n       -> ');
			debug.quickError(type, message, footer);
			copyRecursion.pop();
			// junk the whole thing
			this.scripts[scriptName].copyScriptResolved = true;
			this.scripts[scriptName].actions = [];
		}
		copyRecursion.push(scriptName);

		const finalActions: AnyNode[] = [];
		const scriptData = this.scripts[scriptName];

		// one node can become multiple nodes, so this needs to be .forEach() and not .map()
		scriptData.actions.forEach((action: AnyNode) => {
			// not copy script, easy, hand it in
			if (!(action instanceof COPY_SCRIPT) && !(action instanceof CopyMacro)) {
				finalActions.push(action);
				return;
			}
			if (action instanceof COPY_SCRIPT) {
				throw new Error('These should all be CopyMacro now');
			}
			// copy script now:
			const targetScript: string = action.script;
			if (!this.scripts[targetScript]) {
				// named script not found; error
				const useNode =
					action instanceof MathlangNode
						? optionalChildForField(action.debug, 'script') || action.debug.node
						: debug.node;
				this.newError(
					new MathlangMessage(
						[debug.using(useNode)],
						'missing script',
						'copy_script could not find script ' + targetScript,
					),
				);
				return;
			}

			// if the target script hasn't had its own copy_script pass done yet, do that pass first
			if (!this.scripts[action.script].copyScriptResolved) {
				this.bakeCopyScriptSingle(action.debug, action.script);
			}

			// add suffix to action labels so they don't collide with other copies
			const labelSuffix = 'c' + this.advanceGotoSuffix();
			let copiedActions: AnyNode[] = this.scripts[action.script].actions.map((v) => {
				if (isMightHaveLabel(v)) {
					return v.clone().ifLabelAddSuffix(labelSuffix);
				}
				return v;
			});

			// change temporary variables so they don't collide with any in progress
			// but only if temporaries don't start at 0 at the moment
			const tempCount = temporaryCount();
			if (tempCount > 0) {
				// TODO: test this at all
				copiedActions = copiedActions.map((v) => {
					if (isHasVariables(v)) {
						return v.clone().realignVars();
					}
					return v;
				});
			}

			// search-and-replace
			if (action.search_and_replace) {
				// search-and-replace does naive JSON stringifying and straight find-and-replace.
				// Mathlang nodes have properties (args, debug) that cannot be printed.
				// Only find-and-replace vanilla actions, then?
				// One action at a time seems a good compromise

				// Do the search-and-replace
				const searchAndReplace = action.search_and_replace;
				const searchedAndReplaced = copiedActions.map((v) => {
					if (v instanceof MathlangNode) return v;
					if (!(v instanceof Action)) throw new Error('Should be an Action');
					let string = JSON.stringify(v);
					Object.entries(searchAndReplace).forEach(([k, v]) => {
						string = string.replace(new RegExp(k, 'g'), v);
					});
					let ret = '';
					try {
						ret = JSON.parse(string);
					} catch {
						throw new Error('failed to parse JSON in bakeCopyScriptSingle');
					}
					return Action.fromArgs(ret, debug);
				});
				const comment = `Copying: ${action.script} (-${labelSuffix}) with search_and_replace: ${JSON.stringify(action.search_and_replace)}`;
				finalActions.push(CommentNode.quick(debug, comment));
				finalActions.push(...searchedAndReplaced);
			} else {
				// plain version
				const comment = `Copying: ${action.script} (-${labelSuffix})`;
				finalActions.push(CommentNode.quick(debug, comment));
				finalActions.push(...copiedActions);
			}
		});
		this.scripts[scriptName].copyScriptResolved = true;
		this.scripts[scriptName].actions = finalActions;

		// log the variables we're using
		// (must be done after variables are realigned)
		finalActions.forEach((v) => {
			if (isHasVariables(v)) {
				v.registerVars(this.integers);
			}
		});

		copyRecursion.pop();
	}
	parseFile(fileName: string) {
		const fileMap = this.fileMap;
		// tree-sitter things
		const text = fileMap[fileName].fileText;
		const ast = this.parser.parse(text);
		if (!ast) throw new Error('tree-sitter parser failed to produce AST');
		const document = ast.rootNode;

		// file crawl state
		const f = new FileState(this, fileName);
		const documentDebug = MathlangLocation.quick(f, document);
		reportMissingChildNodes(documentDebug);
		const errorNodes = reportErrorNodes(documentDebug);
		if (errorNodes.length) {
			console.log(errorNodes);
		}
		let catastrophicErrorReported = false;
		const nodes = namedChildren(documentDebug)
			.map((node) => {
				const debug = MathlangLocation.quick(f, node);
				if (catastrophicErrorReported) {
					return;
				} else if (node && !node.isError) {
					// Normal
					return handleNode(debug);
				} else if (!catastrophicErrorReported) {
					if (node?.text === ';') {
						// semicolons after script definitions or such
						debug.quickError('unexpected token', `unexpected semicolon`);
					} else {
						// The first catastrophic error should be the last!
						// Every node underneath is just wrecked. Nuke it all!
						if (!node) {
							throw new Error('no node found for catastrophic error case');
						}
						debug.quickError(
							'syntax error',
							`catastrophic syntax error (naive guess: invalid script name)`,
							`Avoid keywords for bare script names in definitions, or wrap the script name in quotes\n` +
								`   add { ... } // INVALID\n` +
								`   include { ... } // INVALID\n` +
								`   script add { ... } // fix with keyword\n` +
								`   "include" { ... } // fix with quotes\n`,
						);
						catastrophicErrorReported = true;
					}
				}
			})
			.flat()
			.filter((v) => v); // catastrophic errors are undefined
		f.nodes = nodes.filter((v) => v !== undefined);
		// add parsed file to the pile
		fileMap[fileName].parsed = f;
		return f;
	}
}
