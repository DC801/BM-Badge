import { Parser, Node as TreeSitterNode } from 'web-tree-sitter';
import { simplifyLabelGotos } from './parser-utilities.ts';
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
	LabelDefinition,
	doesNodeHaveLabelToChangeToIndex,
	CommentNode,
	CopyMacro,
} from './parser-types.ts';
import { Action, COPY_SCRIPT } from './parser-bytecode-info.ts';

type FileMapEntry = {
	arrayBuffer: Promise<unknown>;
	fileText: string;
	name: string;
	text: Promise<unknown>;
	type: string;
	parsed?: FileState;
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
	// error/warning messages
	errors: MathlangMessage[];
	warnings: MathlangMessage[];
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
			if (node instanceof DialogDefinition) {
				this.addDialog(node);
			} else if (node instanceof SerialDialogDefinition) {
				this.addSerialDialog(node);
			} else {
				finalizedActions.push(node);
			}
		});
		data.actions = simplifyLabelGotos(finalizedActions.flat());
		// put script in the project
		if (!this.scripts[name]) {
			// if not registered yet, add it
			this.scripts[name] = data;
		} else {
			// if it's a duplicate, make an array for all the ones we find
			if (!this.duplicates.scripts[name]) {
				this.duplicates.scripts[name] = [this.scripts[name]]; //existing data
			}
			this.duplicates.scripts[name].push(data); //add the new one
		}
	}
	addDialog(data: DialogDefinition) {
		const name = data.dialogName;
		if (!this.dialogs[name]) {
			this.dialogs[name] = data;
		} else {
			if (!this.duplicates.dialogs[name]) {
				this.duplicates.dialogs[name] = [this.dialogs[name]];
			}
			this.duplicates.dialogs[name].push(data);
		}
	}
	addSerialDialog(data: SerialDialogDefinition) {
		const name = data.dialogName;
		if (!this.serialDialogs[name]) {
			this.serialDialogs[name] = data;
		} else {
			if (!this.duplicates.serialDialogs[name]) {
				this.duplicates.serialDialogs[name] = [this.serialDialogs[name]];
			}
			this.duplicates.serialDialogs[name].push(data);
		}
	}

	// take the given file name and expand all copy_script inside
	// needs to be here because it can call itself
	bakeCopyScriptSingle(f: FileState, node: TreeSitterNode, scriptName: string) {
		// Recursion detection
		if (copyRecursion.includes(scriptName)) {
			copyRecursion.push(scriptName);
			throw new Error(`copy_macro recursion\n       ${copyRecursion.join('\n       -> ')}`);
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
			// copy script now:
			const targetScript: string = action.script;
			if (!this.scripts[targetScript]) {
				// named script not found; error
				const useNode =
					action instanceof MathlangNode
						? action.debug.node.childForFieldName('script') || action.debug.node
						: node;
				this.newError({
					locations: [
						{
							fileName: scriptData.debug.fileName,
							node: useNode,
						},
					],
					message: 'copy_script: no script found by the name ' + targetScript,
				});
				return;
			}
			// if the target script hasn't had its own copy_script pass done yet, do that pass first
			if (!this.scripts[action.script].copyScriptResolved) {
				this.bakeCopyScriptSingle(f, node, action.script);
			}
			// add suffix to labels so they don't collide with other copies
			const labelSuffix = 'c' + this.advanceGotoSuffix();
			const copiedActions: AnyNode[] = this.scripts[action.script].actions.map(
				(copiedAction) => {
					if (
						(doesNodeHaveLabelToChangeToIndex(copiedAction) && copiedAction.label) ||
						copiedAction instanceof LabelDefinition
					) {
						copiedAction.label += labelSuffix;
					}
					return copiedAction;
				},
			);
			// search-and-replace
			if (action instanceof COPY_SCRIPT && action.search_and_replace) {
				// search-and-replace does naive JSON stringifying and straight find-and-replace.
				// Mathlang nodes have properties (args, debug) that cannot be printed.
				// Only find-and-replace vanilla actions, then?

				// Do the search-and-replace
				const searchAndReplace = action.search_and_replace;
				const searchedAndReplaced = copiedActions.map((v) => {
					if (v instanceof MathlangNode) return v;
					if (!(v instanceof Action)) throw new Error('Should be an Action');
					let string = JSON.stringify(v);
					Object.entries(searchAndReplace).forEach(([k, v]) => {
						string = string.replace(new RegExp(k, 'g'), v);
					});
					const ret = JSON.parse(string);
					return Action.fromArgs(ret);
				});
				const comment = `Copying: ${action.script} (-${labelSuffix}) with search_and_replace: ${JSON.stringify(action.search_and_replace)}`;
				finalActions.push(CommentNode.quick(new MathlangLocation(f, node), comment));
				finalActions.push(...searchedAndReplaced);
			} else {
				// plain version
				const comment = `Copying: ${action.script} (-${labelSuffix})`;
				finalActions.push(CommentNode.quick(new MathlangLocation(f, node), comment));
				finalActions.push(...copiedActions);
			}
		});
		this.scripts[scriptName].copyScriptResolved = true;
		this.scripts[scriptName].actions = finalActions;
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
		let catastrophicErrorReported = false;
		const nodes = document.namedChildren
			.map((node) => {
				if (catastrophicErrorReported) {
					return;
				} else if (node && !node.isError) {
					// Normal
					return handleNode(f, node);
				} else if (!catastrophicErrorReported) {
					if (node?.text === ';') {
						// semicolons after script definitions or such
						f.quickError(node, `unexpected semicolon`);
					} else {
						// The first catastrophic error should be the last!
						// Every node underneath is just wrecked. Nuke it all!
						if (!node) {
							throw new Error('no node found for catastrophic error case');
						}
						f.quickError(
							node,
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
