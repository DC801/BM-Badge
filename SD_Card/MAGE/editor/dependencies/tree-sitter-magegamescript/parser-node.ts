import { Node as TreeSitterNode } from 'web-tree-sitter';
import { FileState } from './parser-file.ts';
import {
	ConditionalBlock,
	reportMissingChildNodes,
	reportErrorNodes,
	debugLog,
	autoIdentifierName,
	newElse,
	ifChainMaker,
	simpleBranchMaker,
	quickTemporary,
} from './parser-utilities.ts';

import { buildSerialDialogFromInfo, buildDialogFromInfo } from './parser-dialogs.ts';

import {
	handleCapture,
	captureForFieldName,
	optionalTextForFieldName,
	textForFieldName,
	capturesForFieldName,
	stringCaptureForFieldName,
	numberCaptureForFieldName,
	mandatoryChildForFieldName,
	handleChildrenForFieldName,
	handleNamedChildren,
} from './parser-capture.ts';
import { handleAction } from './parser-actions.ts';
import {
	AddDialogSettings,
	AddDialogSettingsTarget,
	AddSerialDialogSettings,
	ConstantDefinition,
	CopyMacro,
	Dialog,
	DialogDefinition,
	DialogOption,
	IncludeNode,
	ScriptDefinition,
	SerialDialog,
	SerialDialogOption,
	type AnyNode,
	type DialogInfo,
	type DialogSettings,
	type SerialOptionType,
	type SerialDialogInfo,
	isMGSPrimitive,
	JSONLiteral,
	LabelDefinition,
	MathlangSequence,
	SerialDialogDefinition,
	ReturnStatement,
	ContinueStatement,
	BreakStatement,
	SerialDialogParameter,
	DialogIdentifier,
	DialogParameter,
	GotoLabel,
	MathlangLocation,
	BoolLiteral,
	CheckVariable,
	CheckDebugMode,
	CheckSaveFlag,
	BoolComparison,
	BoolGetable,
	BoolExpression,
} from './parser-types.ts';
import {
	Action,
	GOTO_ACTION_INDEX,
	MUTATE_VARIABLE,
	RUN_SCRIPT,
	SHOW_SERIAL_DIALOG,
} from './parser-bytecode-info.ts';

export const handleNode = (f: FileState, node: TreeSitterNode): AnyNode[] => {
	debugLog(`handleNode: ${node.grammarType}`);

	// Tree-sitter does not (?) report these on its own; we have to seek them each time
	reportMissingChildNodes(f, node);
	reportErrorNodes(f, node);

	// Actions are their own beast and are handled elsewhere
	if (node.grammarType.startsWith('action_')) {
		return handleAction(f, node);
	}

	// Look up the handler function
	const nodeFn = nodeFns[node.grammarType];
	if (!nodeFn) {
		throw new Error('no parser-node function for ' + node.grammarType);
	}

	// Do it
	const ret = nodeFn(f, node);
	return ret;
};

const includeRecursion: string[] = [];

// These must return an array, because they might produce multiple things (or zero things)
// NOTICE: The caller should flat() what it receives!
const nodeFns = {
	line_comment: () => [],
	block_comment: () => [],
	semicolon: () => [],
	ERROR: (f: FileState, node: TreeSitterNode): [] => {
		// I guess feel free to add more of these as they come up
		// This might be the only place some of them can be detected
		// (This is only for nodes so malformed that tree-sitter can't tell what they are)
		if (node.namedChildren.some((v) => v?.grammarType === 'over_time_operator')) {
			f.quickError(
				node,
				`malformed 'do over time' expression`,
				`should take the form '@movable -> @coordinate over @duration [forever];'\n` +
					`   @movable = (player | self | entity @string) position | camera\n` +
					`   @coordinate = (player | self | entity @string) position | geometry @string (origin | length)`,
			);
		}
		f.quickError(node, 'syntax error');
		return [];
	},
	script_definition: (f: FileState, node: TreeSitterNode) => {
		const scriptName = stringCaptureForFieldName(f, node, 'script_name');
		const rawActions: AnyNode[] = handleNamedChildren(f, node.lastChild || node);
		const actions: AnyNode[] = [];
		// flatten sequences
		rawActions.forEach((raw) => {
			if (raw instanceof MathlangSequence) {
				raw.steps.forEach((step) => actions.push(step));
			} else if (raw instanceof JSONLiteral) {
				raw.json.forEach((obj) => {
					if (typeof obj === 'object' && (obj as unknown as Action).action) {
						actions.push(Action.fromArgs(obj));
					} else {
						f.quickError(raw.debug.node, 'invalid JSON action: ' + JSON.stringify(obj));
					}
				});
			} else {
				actions.push(raw);
			}
		});
		// add auto return label
		const returnLabel = 'end of script ' + f.p.advanceGotoSuffix();
		const lastChild = node.lastChild;
		if (!lastChild) throw new Error('could not find final node in script block');
		const labelAction: LabelDefinition = new LabelDefinition(
			new MathlangLocation(f, lastChild),
			{
				label: returnLabel,
			},
		);
		actions.push(labelAction);
		// change all return statements to goto labels
		actions.forEach((action, i) => {
			if (action instanceof ReturnStatement) {
				actions[i] = GotoLabel.quick(
					new MathlangLocation(f, action.debug.node),
					returnLabel,
				);
			}
		});
		return [new ScriptDefinition(new MathlangLocation(f, node), { scriptName, actions })];
	},
	constant_assignment: (f: FileState, node: TreeSitterNode) => {
		const debug = new MathlangLocation(f, node);
		const label = textForFieldName(f, node, 'label');
		const value = captureForFieldName(f, node, 'value');
		if (!isMGSPrimitive(value)) {
			const valueNode = node.childForFieldName('value');
			f.quickError(valueNode || node, `constant value not an MGS primitive (${label})`);
			return [];
		}
		if (f.constants[label]) {
			f.quickError(node, `cannot redefine constant ${label}`);
		}
		f.constants[label] = {
			debug: debug,
			value,
		};
		return [ConstantDefinition.quick(debug, label, value)];
	},
	include_macro: (f: FileState, node: TreeSitterNode) => {
		// Recursion detection
		if (includeRecursion.includes(f.fileName)) {
			includeRecursion.push(f.fileName);
			throw new Error(
				`include_macro recursion\n       ${includeRecursion.join('\n       -> ')}`,
			);
		}
		includeRecursion.push(f.fileName);
		const fileName = stringCaptureForFieldName(f, node, 'fileName');
		if (!f.p.fileMap[fileName].parsed) {
			debugLog(`include_macro: must first parse prerequesite "${fileName}"`);
			f.p.parseFile(fileName);
		} else {
			debugLog(`include_macro: prerequesite "${fileName}" already parsed`);
		}
		debugLog(`include_macro: merging ${fileName} into ${f.fileName}...`);

		// INCLUDE FILE
		const newFile = f.p.fileMap[fileName].parsed;
		if (!newFile) throw new Error(`missing file to include: ${fileName}`);
		// add their constants to us
		Object.keys(newFile.constants).forEach((constantName) => {
			if (f.constants[constantName]) {
				f.newError({
					message: `cannot redefine constant ${constantName} (via 'include')`,
					locations: [
						{
							fileName: newFile.fileName,
							node: newFile.constants[constantName].debug.node,
						},
					],
				});
			}
			f.constants[constantName] = newFile.constants[constantName];
		});
		// add their actual node entries to us (might help debugging)
		newFile.nodes.forEach((node) => {
			f.nodes.push(node);
		});
		// add (serial) dialog settings
		['default', 'serial'].forEach((type) => {
			Object.keys(newFile.settings[type]).forEach((param) => {
				f.settings[type][param] = newFile.settings[type][param];
			});
		});
		// ...some of which are extra layered
		['entity', 'label'].forEach((type) => {
			Object.keys(newFile.settings[type]).forEach((target) => {
				const params = Object.keys(newFile.settings[type][target]);
				f.settings[type][target] = f.settings[type][target] || {};
				params.forEach((param) => {
					f.settings[type][target][param] = newFile.settings[type][target][param];
					// (I apologize for this)
				});
			});
		});
		includeRecursion.pop();
		return [IncludeNode.quick(new MathlangLocation(f, node), fileName)];
	},
	rand_macro: (f: FileState, node: TreeSitterNode) => {
		const debug = new MathlangLocation(f, node);
		const horizontal: AnyNode[][] = [];
		// count items per spread
		let spreadCount = -Infinity;
		node.namedChildren
			.filter((v) => v !== null)
			.forEach((innerNode) => {
				const actions: AnyNode[] = handleNode(f, innerNode);
				const len = actions.length;
				if (len === 0) return; // empties are ignored
				horizontal.push(actions);
				if (len === 1) return; // singles are passed through
				if (spreadCount === -Infinity) spreadCount = len;
				if (spreadCount !== len) {
					f.quickError(
						innerNode,
						`spreads inside rand!() must contain same number of items`,
					);
				}
			});
		// tilt the other direction
		// [{a:1},{a:2}], [{b:3}], [{c:4},{c:5}] ->
		// [{a:1},{b:3},{c:4}], [{a:2},{b:3},{c:5}]
		const vertical: AnyNode[][] = [];
		for (let i = 0; i < spreadCount; i++) {
			const insert = horizontal.map((arr) => {
				return arr[i % arr.length];
			});
			vertical.push(insert);
		}
		// slices -> if chain
		const temp = quickTemporary();
		const iffs: ConditionalBlock[] = vertical.map((body, i) => {
			return {
				condition: CheckVariable.quick(debug, temp, i, '=='),
				debug,
				body,
			};
		});
		const sequence: MathlangSequence = ifChainMaker(f, node, iffs, [], 'rand_macro');
		sequence.steps.unshift(MUTATE_VARIABLE.change(debug, temp, vertical.length, '?')); // the RNG roll
		return [sequence];
	},
	label_definition: (f: FileState, node: TreeSitterNode) => {
		const label = textForFieldName(f, node, 'label');
		return [LabelDefinition.quick(new MathlangLocation(f, node), label)];
	},
	add_dialog_settings: (f: FileState, node: TreeSitterNode) => {
		const targets = handleNamedChildren(f, node);
		if (!targets.every((v) => v instanceof AddDialogSettingsTarget)) {
			throw new Error('add_dialog_settings node not a AddDialogSettingsTarget');
		}
		return [AddDialogSettings.quick(new MathlangLocation(f, node), targets)];
	},
	add_dialog_settings_target: (f: FileState, node: TreeSitterNode) => {
		let settingsTarget: DialogSettings = {};
		const type = textForFieldName(f, node, 'type');
		let target: string | undefined;
		// figure out which settings target it is
		if (type === 'default') {
			settingsTarget = f.settings.default;
		} else if (type === 'label' || type === 'entity') {
			target = stringCaptureForFieldName(f, node, 'target');
			f.settings[type][target] = f.settings[type][target] || {};
			settingsTarget = f.settings[type][target];
		} else {
			throw new Error(`unknown target type: ${type}`);
		}
		// find the settings themselves
		const parameters = capturesForFieldName(f, node, 'dialog_parameter');
		if (!parameters.every((v) => v instanceof DialogParameter)) {
			throw new Error('not every dialog_parameter is a DialogParameter');
		}
		parameters.forEach((param) => {
			settingsTarget[param.property] = param.value;
		});
		const debug = new MathlangLocation(f, node);
		const ret = AddDialogSettingsTarget.quick(debug, type, parameters, target);
		return [ret];
	},
	add_serial_dialog_settings: (f: FileState, node: TreeSitterNode) => {
		const parameters = capturesForFieldName(f, node, 'serial_dialog_parameter');
		if (!parameters.every((v) => v instanceof SerialDialogParameter)) {
			throw new Error('not every serial_dialog_parameter is a SerialDialogParameter');
		}
		parameters.forEach((param) => {
			f.settings.serial[param.property] = param.value;
		});
		const debug = new MathlangLocation(f, node);
		return [AddSerialDialogSettings.quick(debug, parameters)];
	},
	serial_dialog_option: (f: FileState, node: TreeSitterNode) => {
		const debug = new MathlangLocation(f, node);
		const optionChar = textForFieldName(f, node, 'option_type');
		let optionType: SerialOptionType = 'options';
		if (optionChar === '_') optionType = 'text_options';
		else if (optionChar !== '#') throw new Error('invalid option type: ' + optionChar);
		const label = stringCaptureForFieldName(f, node, 'label');
		const script = stringCaptureForFieldName(f, node, 'script');
		return [SerialDialogOption.quick(debug, optionType, label, script)];
	},
	dialog_option: (f: FileState, node: TreeSitterNode) => {
		const label = stringCaptureForFieldName(f, node, 'label');
		const script = stringCaptureForFieldName(f, node, 'script');
		const debug = new MathlangLocation(f, node);
		return [DialogOption.quick(debug, label, script)];
	},
	serial_dialog_definition: (f: FileState, node: TreeSitterNode) => {
		const serialDialogNode = mandatoryChildForFieldName(f, node, 'serial_dialog');
		const dialogName = stringCaptureForFieldName(f, node, 'serial_dialog_name');
		const serialDialogs = handleNode(f, serialDialogNode);
		if (serialDialogs.length !== 1) {
			throw new Error('serial dialogs must have only 1 serial dialog');
		}
		const serialDialog = serialDialogs[0];
		if (!(serialDialog instanceof SerialDialog)) throw new Error('missing serial dialog');
		const debug = new MathlangLocation(f, node);
		return [SerialDialogDefinition.quick(debug, dialogName, serialDialog)];
	},
	dialog_definition: (f: FileState, node: TreeSitterNode) => {
		const name = stringCaptureForFieldName(f, node, 'dialog_name');
		const dialogs = handleChildrenForFieldName(f, node, 'dialog');
		if (!dialogs.every((v) => v instanceof Dialog))
			throw new Error('not every dialog is a Dialog');
		const debug = new MathlangLocation(f, node);
		return [DialogDefinition.quick(debug, name, dialogs)];
	},
	serial_dialog: (f: FileState, node: TreeSitterNode): [SerialDialog] => {
		const settings = {};
		const params = capturesForFieldName(f, node, 'serial_dialog_parameter');
		if (!params.every((v) => v instanceof SerialDialogParameter)) {
			throw new Error('not every serial dialog parameter is a SerialDialogParameter');
		}
		params.forEach((v) => {
			settings[v.property] = v.value;
		});
		// TODO: make options more closely resemble final form?
		const options = handleChildrenForFieldName(f, node, 'serial_dialog_option');
		if (!options.every((v) => v instanceof SerialDialogOption)) {
			throw new Error('not every serial dialog option not aSerialDialogOption');
		}
		const messages = capturesForFieldName(f, node, 'serial_message');
		if (!messages.every((v) => typeof v === 'string')) {
			throw new Error('not every message is a string');
		}
		const info: SerialDialogInfo = {
			settings,
			messages,
			options,
		};
		const serialDialog = buildSerialDialogFromInfo(f, node, info);
		return [serialDialog];
	},
	dialog: (f: FileState, node: TreeSitterNode): [Dialog] => {
		// Identifier
		const identifier = captureForFieldName(f, node, 'dialog_identifier');
		if (!(identifier instanceof DialogIdentifier)) {
			throw new Error('dialog_identifier is not a DialogIdentifier');
		}
		// Settings
		const settings = {};
		const params = capturesForFieldName(f, node, 'dialog_parameter');
		if (!params.every((v) => v instanceof DialogParameter)) {
			throw new Error('not every dialog_parameter is a DialogParameter');
		}
		params.forEach((v) => {
			settings[v.property] = v.value;
		});
		// Messages
		const messageN = node.childrenForFieldName('message');
		const messages = messageN.map((v) => handleCapture(f, v));
		if (!messages.every((v) => typeof v === 'string')) {
			throw new Error('not every dialog_message is a string');
		}
		// Options
		const options = handleChildrenForFieldName(f, node, 'dialog_option');
		if (!options.every((v) => v instanceof DialogOption)) {
			throw new Error('not every dialog_option is a DialogOption');
		}
		// Build it
		const info: DialogInfo = {
			identifier,
			settings,
			messages,
			options,
		};
		const dialogs = buildDialogFromInfo(f, node, info, messageN);
		dialogs.debug = new MathlangLocation(f, node);
		return [dialogs];
	},
	json_literal: (f: FileState, node: TreeSitterNode): JSONLiteral[] => {
		// TODO: do it more by hand so that errors can be reported more accurately?
		const jsonNode = node.namedChildren[0];
		if (!jsonNode) throw new Error('could not find JSON node');
		const text = jsonNode.text;
		try {
			const parsed = JSON.parse(text);
			return [new JSONLiteral(new MathlangLocation(f, node), { json: parsed })];
		} catch {
			f.quickError(node, `JSON syntax error`, `Generic error. Check trailing commas!`);
		}
		return [];
	},
	copy_macro: (f: FileState, node: TreeSitterNode): [CopyMacro] => {
		const script = stringCaptureForFieldName(f, node, 'script');
		return [new CopyMacro(new MathlangLocation(f, node), { script })];
	},
	debug_macro: (f: FileState, node: TreeSitterNode): AnyNode[] => {
		const ret: AnyNode[] = [];
		let dialogName = '';
		const serialDialogNode = node.childForFieldName('serial_dialog');
		if (serialDialogNode) {
			const serialDialogs = handleNode(f, serialDialogNode);
			const serialDialog = serialDialogs[0];
			if (!(serialDialog instanceof SerialDialog)) {
				throw new Error('serial dialog not a SerialDialog');
			}
			dialogName = autoIdentifierName(f, node);
			ret.push(
				new SerialDialogDefinition(new MathlangLocation(f, node), {
					dialogName,
					serialDialog,
				}),
			);
		} else {
			// might just be the name of a serial dialog, and not a serial-dialog-in-place
			dialogName = stringCaptureForFieldName(f, node, 'serial_dialog_name');
		}
		const debug = new MathlangLocation(f, node);
		const condition = CheckDebugMode.quick(debug, true);
		const ifTrue = new SHOW_SERIAL_DIALOG({
			disable_newline: false,
			serial_dialog: dialogName,
		});
		const action = simpleBranchMaker(f, node, condition, [ifTrue], []);
		ret.push(action);
		return ret;
	},
	looping_block: (f: FileState, node: TreeSitterNode, printGotoLabel: string): AnyNode[] => {
		return handleNamedChildren(f, node).map((v) => {
			if (Array.isArray(v)) return v;
			if (v instanceof ContinueStatement) {
				return GotoLabel.quick(
					new MathlangLocation(f, v.debug.node),
					`condition #${printGotoLabel}`,
				);
			} else if (v instanceof BreakStatement) {
				return GotoLabel.quick(
					new MathlangLocation(f, v.debug.node),
					`rendezvous #${printGotoLabel}`,
				);
			}
			return v;
		});
	},
	while_block: (f: FileState, node: TreeSitterNode) => {
		const debug = new MathlangLocation(f, node);
		const block = new ConditionalBlock(f, node, 'while');
		const n = f.p.advanceGotoSuffix();
		const conditionL = `while condition #${n}`;
		const bodyL = `while body #${n}`;
		const rendezvousL = `while rendezvous #${n}`;
		const steps = [
			new LabelDefinition(debug, { label: conditionL }),
			...block.condition.flatten(bodyL),
			GotoLabel.quick(new MathlangLocation(f, node), rendezvousL),
			new LabelDefinition(debug, { label: bodyL }),
			...block.body,
			GotoLabel.quick(new MathlangLocation(f, block.conditionNode || node), conditionL),
			new LabelDefinition(debug, { label: rendezvousL }),
		];
		return [new MathlangSequence(debug, { steps, type: 'parser-node: while_block' })];
	},
	do_while_block: (f: FileState, node: TreeSitterNode) => {
		const debug = new MathlangLocation(f, node);
		const doWhyle = new ConditionalBlock(f, node, 'do while');
		const n = f.p.advanceGotoSuffix();
		const conditionL = `do while condition #${n}`;
		const bodyL = `do while body #${n}`;
		const rendezvousL = `do while rendezvous #${n}`;
		const steps = [
			new LabelDefinition(debug, { label: bodyL }),
			...doWhyle.body,
			new LabelDefinition(debug, { label: conditionL }),
			...doWhyle.condition.flatten(bodyL),
			new LabelDefinition(debug, { label: rendezvousL }),
		];
		return [new MathlangSequence(debug, { steps, type: 'parser-node: do_while_block' })];
	},
	for_block: (f: FileState, node: TreeSitterNode) => {
		const debug = new MathlangLocation(f, node);
		const n = f.p.advanceGotoSuffix();
		const conditionL = `for condition #${n}`;
		const bodyL = `for body #${n}`;
		const rendezvousL = `for rendezvous #${n}`;
		const continueL = `for continue #${n}`;
		const conditionN = mandatoryChildForFieldName(f, node, 'condition');
		const condition = handleCapture(f, conditionN);
		if (!(condition instanceof BoolExpression)) throw new Error('invalid condition');
		const bodyN = mandatoryChildForFieldName(f, node, 'body');
		const incrementerN = mandatoryChildForFieldName(f, node, 'incrementer');
		const body = handleNode(f, bodyN).map((v) => {
			if (v instanceof ContinueStatement)
				return GotoLabel.quick(new MathlangLocation(f, node), continueL);
			if (v instanceof BreakStatement)
				return GotoLabel.quick(new MathlangLocation(f, node), rendezvousL);
			return v;
		});
		const initializer = mandatoryChildForFieldName(f, node, 'initializer');
		const steps = [
			...handleNode(f, initializer),
			new LabelDefinition(debug, { label: conditionL }),
			...condition.flatten(bodyL),
			GotoLabel.quick(new MathlangLocation(f, node), rendezvousL),
			new LabelDefinition(debug, { label: bodyL }),
			...body,
			new LabelDefinition(debug, { label: continueL }),
			...handleNode(f, incrementerN),
			GotoLabel.quick(new MathlangLocation(f, conditionN), conditionL),
			new LabelDefinition(debug, { label: rendezvousL }),
		];
		return [new MathlangSequence(debug, { steps, type: 'parser-node: for_block' })];
	},
	if_single: (f: FileState, node: TreeSitterNode): AnyNode[] => {
		// for parsing the bytecode output; not really meant to be seen in the wild
		// e.g. `if varName then goto label LABELNAME;`
		// vs `if (varName) { /*do stuff at the label destination*/ }`
		const type = optionalTextForFieldName(f, node, 'type');
		const conditionN = node.childForFieldName('condition');
		let condition = handleCapture(f, conditionN);
		if (typeof condition === 'string') {
			const debug = new MathlangLocation(f, node);
			condition = CheckSaveFlag.quick(debug, condition, true);
		}
		if (typeof condition === 'boolean' || condition instanceof BoolLiteral) {
			const value = condition instanceof BoolLiteral ? condition.value : condition;
			if (!type) {
				const script = stringCaptureForFieldName(f, node, 'script');
				return value ? [RUN_SCRIPT.quick(script)] : [];
			} else if (type === 'index') {
				const index = numberCaptureForFieldName(f, node, 'index');
				return value ? [GOTO_ACTION_INDEX.quick(index)] : [];
			} else if (type === 'label') {
				const label = stringCaptureForFieldName(f, node, 'label');
				return value ? [GotoLabel.quick(new MathlangLocation(f, node), label)] : [];
			}
		}
		if (condition instanceof BoolComparison || condition instanceof BoolGetable) {
			if (!type) {
				const success_script = stringCaptureForFieldName(f, node, 'script');
				return [condition.toAction({ success_script })];
			} else if (type === 'index') {
				const jump_index = numberCaptureForFieldName(f, node, 'index');
				return [condition.toAction({ jump_index })];
			} else if (type === 'label') {
				const label = stringCaptureForFieldName(f, node, 'label');
				return [condition.toAction({ label })];
			}
			return [condition];
		}
		throw new Error('invalid if_single');
	},
	if_chain: (f: FileState, node: TreeSitterNode) => {
		const ifNodes = node.childrenForFieldName('if_block').filter((v) => v !== null);
		const iffs = ifNodes.map((v) => new ConditionalBlock(f, v, 'if'));
		const elseNode = node.childForFieldName('else_block');
		const elseBody = newElse(f, elseNode);
		return [ifChainMaker(f, node, iffs, elseBody, 'if_chain')];
	},
};

// TODO: what is the difference between handleNode() and handleCapture() except that you have to flatten handleNode()?
// Is it that you return complex thing vs primitive value?
// Is it that action wants to call handleCapture() and then work on its properties?
// It is, perhaps, that handleCapture() should check values against registered constants, and nodes shouldn't care about that
