import { Node as TreeSitterNode } from 'web-tree-sitter';
import { FileState, type FunctionStackEntry } from './parser-file.ts';
import {
	ConditionalBlock,
	reportMissingChildNodes,
	reportErrorNodes,
	debugLog,
	autoIdentifierName,
	ifChainMaker,
	simpleBranchMaker,
	quickTemporary,
	flattenNodes,
} from './parser-utilities.ts';

import { buildSerialDialogFromInfo, buildDialogFromInfo } from './parser-dialogs.ts';

import {
	handleCapture,
	captureForField,
	optionalTextForField,
	textForField,
	capturesForField,
	stringCaptureForField,
	numberCaptureForField,
	mandatoryChildForField,
	handleChildrenForField,
	handleNamedChildren,
	coerceToString,
	childrenForField,
	namedChildren,
	optionalChildForField,
	coerceToBool,
	optionalLastChild,
	mandatoryLastChild,
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
	AnyNode,
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
	FunctionDefinition,
} from './parser-types.ts';
import {
	GOTO_ACTION_INDEX,
	MUTATE_VARIABLE,
	RUN_SCRIPT,
	SHOW_SERIAL_DIALOG,
} from './parser-bytecode-info.ts';

// When to check for errors/missing children? The point a TreeSitterNode is chosen.
// Anytime a new (child) node is instead summoned/found, the check must be made
// again for THEIR children. Null nodes will be filtered at this time.
// Thus, if you've found a place where a node can be TreeSitterNode or null,
// it is an indication that the proper channels were not used.

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
		const allChildren = namedChildren(f, node);
		if (allChildren.some((child) => child.grammarType === 'over_time_operator')) {
			f.quickError(
				node,
				'syntax error',
				`malformed 'do over time' expression`,
				`should take the form '@movable -> @coordinate over @duration [forever];'\n` +
					`   @movable = (player | self | entity @string) position | camera\n` +
					`   @coordinate = (player | self | entity @string) position | geometry @string (origin | length)`,
			);
		} else {
			f.quickError(node, 'syntax error', 'syntax error');
		}
		return [];
	},
	fn: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const name = stringCaptureForField(f, node, 'name');
		// don't waste time if there's a reassignment error
		if (f.functions[name]) {
			f.quickError(node, 'fn already defined', `fn ${name} already defined`);
			return [];
		}
		const paramNodes = childrenForField(f, node, 'arg');
		// verify that fn params are all $constants
		let error = false;
		const params = paramNodes.map((param) => {
			if (param.grammarType !== 'CONSTANT') {
				f.quickError(node, 'invalid fn arg', 'fn arg must be CONSTANT (prefixed with $)');
				error = true;
			}
			return param.text;
		});
		if (error) return [];
		// check for duplicates
		const paramSet = new Set([...params]);
		if (paramSet.size !== params.length) {
			// todo: tell the red squiggles which params are the duplicates
			f.quickError(node, 'duplicate fn arg', 'duplicate fn args');
			return [];
		}
		// the body node remains unprocessed so the compile-time-constant-replacement-system can insert args passed to the function "call"
		const bodyNode = mandatoryChildForField(f, node, 'body');
		const definiton = FunctionDefinition.quick(debug, name, params, paramNodes, bodyNode);
		f.functions[name] = definiton;
	},
	fn_call: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const name = stringCaptureForField(f, node, 'name');
		const lastChild = mandatoryLastChild(f, node);
		const definition = f.functions[name];
		if (!definition) {
			const nameNode = optionalChildForField(f, node, 'name') || node;
			f.quickError(nameNode, 'undefined fn', `function ${name} is undefined`);
			return [];
		}
		const callParamNodes = childrenForField(f, node, 'arg');
		const definitionParamNodes = definition.paramNodes;
		// compare lengths of params in definition vs call
		if (callParamNodes.length < definitionParamNodes.length) {
			f.quickError(
				node,
				'not enough fn args',
				`function ${name} requires ${definitionParamNodes.length} arguments; found ${callParamNodes.length}`,
			);
			// todo: yellow squiggles when too many params are passed
			return [];
		}
		// sanitize passed params
		const callParams = callParamNodes.map((v) => {
			let capture = handleCapture(f, v);
			if (!isMGSPrimitive(capture)) {
				f.quickError(v, 'invalid fn arg', 'function arg not an MGS primitive');
				capture = coerceToString(f, v, capture, 'fucntion param');
			}
			return capture;
		});
		// make local const registry
		const localConstants: FunctionStackEntry = {};
		callParams.forEach((callParam, i) => {
			const debug = MathlangLocation.quick(f, callParamNodes[i]);
			const constantName = definition.params[i];
			const value =
				typeof callParam === 'boolean' ? BoolLiteral.quick(debug, callParam) : callParam;
			const constantDefinition = ConstantDefinition.quick(debug, constantName, value);
			localConstants[constantName] = constantDefinition;
		});
		// add const registry to top of stack
		const stack: FunctionStackEntry[] = f.currFunction;
		stack.unshift(localConstants);
		// and NOW we handle the fn body (with our newly-registered consts poised to be inserted)
		let body = handleNamedChildren(f, definition.bodyNode);
		body = flattenNodes(f, body);

		// TODO: extract auto return stuff so it can share with script definitions

		// add auto return label at the end
		const label = 'end of script ' + f.p.advanceGotoSuffix();
		const autoReturnLabelDefinition = LabelDefinition.quick(
			MathlangLocation.quick(f, lastChild),
			label,
		);
		body.push(autoReturnLabelDefinition);

		// change all return statements to goto labels for the "auto return" label
		body.forEach((node, i) => {
			if (node instanceof ReturnStatement) {
				const labelDebug = MathlangLocation.quick(f, node.debug.node);
				body[i] = GotoLabel.quick(labelDebug, label);
			}
		});

		const sequence = MathlangSequence.quick(debug, body, 'fn_call');
		// get rid of the const registry for this call
		stack.shift();
		return sequence;
	},
	script_block: (f: FileState, node: TreeSitterNode) => {
		return handleNamedChildren(f, node);
	},
	script_definition: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const scriptName = stringCaptureForField(f, node, 'script_name');
		const scriptBlockNode = mandatoryChildForField(f, node, 'script_block');
		const definition = ScriptDefinition.processAndMake(debug, scriptName, scriptBlockNode);
		return [definition];
	},
	constant_assignment: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const label = textForField(f, node, 'label');
		const value = captureForField(f, node, 'value');
		if (!isMGSPrimitive(value)) {
			const valueNode = mandatoryChildForField(f, node, 'value');
			f.quickError(
				valueNode || node,
				'invalid constant value',
				`constant value not an MGS primitive (${label})`,
			);
			return [];
		}
		if (f.constants[label]) {
			f.quickError(node, 'constant already defined', `cannot redefine constant ${label}`);
		}
		f.constants[label] = {
			debug: debug,
			value,
		};
		return [ConstantDefinition.quick(debug, label, value)];
	},
	include_macro: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		// die if recursion detected
		if (includeRecursion.includes(f.fileName)) {
			includeRecursion.push(f.fileName);
			throw new Error(
				`include_macro recursion\n       ${includeRecursion.join('\n       -> ')}`,
			);
		}
		includeRecursion.push(f.fileName);
		// get prerequesite file
		const fileName = stringCaptureForField(f, node, 'fileName');
		if (!f.p.fileMap[fileName]) {
			f.quickError(node, 'missing file', `include_macro: cannot find file "${fileName}"`);
			includeRecursion.pop(); // DO BEFORE GIVING UP
			return [];
		}
		let insertF = f.p.fileMap[fileName].parsed;
		if (!insertF) {
			debugLog(`include_macro: must first parse prerequesite "${fileName}"`);
			f.p.parseFile(fileName);
			insertF = f.p.fileMap[fileName].parsed;
			if (!insertF) {
				f.quickError(
					node,
					'missing file',
					`include_macro: could not parse prerequesite "${fileName}"`,
				);
				includeRecursion.pop(); // DO BEFORE GIVING UP
				return [];
			}
		} else {
			debugLog(`include_macro: prerequesite "${fileName}" already parsed`);
		}
		debugLog(`include_macro: merging ${fileName} into ${f.fileName}...`);
		// add their constants to us
		Object.keys(insertF.constants).forEach((constantName) => {
			if (f.constants[constantName]) {
				f.quickError(
					node,
					'constant already defined',
					`cannot redefine constant ${constantName} (via 'include')`,
				);
			} else {
				f.constants[constantName] = insertF.constants[constantName];
			}
		});
		// add their functions to us
		Object.keys(insertF.functions).forEach((functionName) => {
			if (f.functions[functionName]) {
				f.quickError(
					node,
					'fn already defined',
					`cannot redefine function ${functionName} (via 'include')`,
				);
			} else {
				f.functions[functionName] = insertF.functions[functionName];
			}
		});
		// add their actual node entries to us (might help debugging)
		insertF.nodes.forEach((node) => {
			f.nodes.push(node);
		});
		// add (serial) dialog settings
		['default', 'serial'].forEach((type) => {
			Object.keys(insertF.settings[type]).forEach((param) => {
				f.settings[type][param] = insertF.settings[type][param];
			});
		});
		// ...some of which are extra layered
		['entity', 'label'].forEach((type) => {
			Object.keys(insertF.settings[type]).forEach((target) => {
				const params = Object.keys(insertF.settings[type][target]);
				f.settings[type][target] = f.settings[type][target] || {};
				params.forEach((param) => {
					// (I apologize for this)
					f.settings[type][target][param] = insertF.settings[type][target][param];
				});
			});
		});
		includeRecursion.pop();
		return [IncludeNode.quick(debug, fileName)];
	},
	rand_macro: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const horizontal: AnyNode[][] = [];
		// count items per spread
		let spreadCount = -Infinity;
		namedChildren(f, node).forEach((innerNode) => {
			const actions: AnyNode[] = handleNode(f, innerNode);
			const len = actions.length;
			if (len === 0) return; // empties are ignored
			horizontal.push(actions);
			if (len === 1) return; // singles are passed through
			if (spreadCount === -Infinity) spreadCount = len;
			if (spreadCount !== len) {
				f.quickError(
					innerNode,
					'mismatched spread lengths',
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
			const condition = CheckVariable.quick(debug, temp, i, '==');
			return { condition, debug, body };
		});
		const sequence = ifChainMaker(f, node, iffs, [], 'rand_macro');
		// put the RNG roll at the top
		sequence.steps.unshift(MUTATE_VARIABLE.change(debug, temp, vertical.length, '?'));
		return [sequence];
	},
	label_definition: (f: FileState, node: TreeSitterNode) => {
		const label = textForField(f, node, 'label');
		return [LabelDefinition.quick(MathlangLocation.quick(f, node), label)];
	},
	add_dialog_settings: (f: FileState, node: TreeSitterNode) => {
		const targets = AddDialogSettingsTarget.coerceAll(handleNamedChildren(f, node));
		return [AddDialogSettings.quick(MathlangLocation.quick(f, node), targets)];
	},
	add_dialog_settings_target: (f: FileState, node: TreeSitterNode) => {
		let settingsTarget: DialogSettings = {};
		const type = textForField(f, node, 'type');
		let target: string | undefined;
		// figure out which settings target it is
		if (type === 'default') {
			settingsTarget = f.settings.default;
		} else if (type === 'label' || type === 'entity') {
			target = stringCaptureForField(f, node, 'target');
			f.settings[type][target] = f.settings[type][target] || {};
			settingsTarget = f.settings[type][target];
		} else {
			throw new Error(`unknown target type: ${type}`);
		}
		// find the settings themselves
		const parameters = DialogParameter.coerceAll(capturesForField(f, node, 'dialog_parameter'));
		parameters.forEach((param) => {
			settingsTarget[param.property] = param.value;
		});
		const debug = MathlangLocation.quick(f, node);
		const ret = AddDialogSettingsTarget.quick(debug, type, parameters, target);
		return [ret];
	},
	add_serial_dialog_settings: (f: FileState, node: TreeSitterNode) => {
		const parameters = SerialDialogParameter.coerceAll(
			capturesForField(f, node, 'serial_dialog_parameter'),
		);
		parameters.forEach((param) => {
			f.settings.serial[param.property] = param.value;
		});
		const debug = MathlangLocation.quick(f, node);
		return [AddSerialDialogSettings.quick(debug, parameters)];
	},
	serial_dialog_option: (f: FileState, node: TreeSitterNode) => {
		const optionChar = textForField(f, node, 'option_type');
		let optionType: SerialOptionType = 'options';
		if (optionChar === '_') optionType = 'text_options';
		else if (optionChar !== '#') throw new Error('invalid option type: ' + optionChar);
		const label = stringCaptureForField(f, node, 'label');
		const scriptNode = mandatoryChildForField(f, node, 'script');
		const scriptCapture = handleCapture(f, scriptNode);
		let scriptName = '';
		const steps: AnyNode[] = [];
		if (typeof scriptCapture === 'string') {
			scriptName = scriptCapture;
		} else if (scriptCapture instanceof ScriptDefinition) {
			steps.push(scriptCapture);
			scriptName = scriptCapture.scriptName;
		} else {
			throw new Error('invalid ScriptDefinition');
		}
		const debug = MathlangLocation.quick(f, node);
		const option = SerialDialogOption.quick(debug, optionType, label, scriptName);
		steps.push(option);
		return steps;
	},
	dialog_option: (f: FileState, node: TreeSitterNode) => {
		const label = stringCaptureForField(f, node, 'label');
		const scriptNode = mandatoryChildForField(f, node, 'script');
		const scriptCapture = handleCapture(f, scriptNode);
		let scriptName = '';
		const steps: AnyNode[] = [];
		if (typeof scriptCapture === 'string') {
			scriptName = scriptCapture;
		} else if (scriptCapture instanceof ScriptDefinition) {
			steps.push(scriptCapture);
			scriptName = scriptCapture.scriptName;
		} else {
			throw new Error('invalid ScriptDefinition');
		}
		const debug = MathlangLocation.quick(f, node);
		const option = DialogOption.quick(debug, label, scriptName);
		steps.push(option);
		return steps;
	},
	serial_dialog_definition: (f: FileState, node: TreeSitterNode) => {
		const serialDialogNode = mandatoryChildForField(f, node, 'serial_dialog');
		const dialogName = stringCaptureForField(f, node, 'serial_dialog_name');
		const serialDialogs = handleNode(f, serialDialogNode);
		if (serialDialogs.length !== 1) {
			throw new Error('serial dialogs must have only 1 serial dialog');
		}
		const serialDialog = SerialDialog.coerce(serialDialogs[0]);
		const debug = MathlangLocation.quick(f, node);
		return [SerialDialogDefinition.quick(debug, dialogName, serialDialog)];
	},
	dialog_definition: (f: FileState, node: TreeSitterNode) => {
		const name = stringCaptureForField(f, node, 'dialog_name');
		const dialogs = Dialog.coerceAll(handleChildrenForField(f, node, 'dialog'));
		const debug = MathlangLocation.quick(f, node);
		return [DialogDefinition.quick(debug, name, dialogs)];
	},
	serial_dialog: (f: FileState, node: TreeSitterNode): AnyNode[] => {
		const steps: AnyNode[] = [];
		const settings = {};
		const params = SerialDialogParameter.coerceAll(
			capturesForField(f, node, 'serial_dialog_parameter'),
		);
		params.forEach((v) => {
			settings[v.property] = v.value;
		});
		// TODO: make options more closely resemble final form?
		const rawOptions = handleChildrenForField(f, node, 'serial_dialog_option');
		const options: SerialDialogOption[] = [];
		rawOptions.forEach((v) => {
			if (v instanceof ScriptDefinition) {
				steps.push(v);
			} else if (v instanceof SerialDialogOption) {
				options.push(v);
			} else {
				f.quickError(node, 'syntax error', 'invalid serial_dialog_option script');
			}
		});
		const messages = capturesForField(f, node, 'serial_message');
		if (!messages.every((v) => typeof v === 'string')) {
			throw new Error('not every message is a string');
		}
		const info: SerialDialogInfo = {
			settings,
			messages,
			options,
		};
		const serialDialog = buildSerialDialogFromInfo(f, node, info);
		steps.push(serialDialog)
		return steps;
	},
	dialog: (f: FileState, node: TreeSitterNode): AnyNode[] => {
		const steps: AnyNode[] = [];
		// Identifier
		const identifier = DialogIdentifier.coerce(captureForField(f, node, 'dialog_identifier'));
		// Settings
		const settings = {};
		const params = DialogParameter.coerceAll(capturesForField(f, node, 'dialog_parameter'));
		params.forEach((v) => {
			settings[v.property] = v.value;
		});
		// Messages
		const messageN = childrenForField(f, node, 'message');
		const messages = messageN.map((v) => coerceToString(f, node, handleCapture(f, v)));
		// Options
		const rawOptions = handleChildrenForField(f, node, 'dialog_option');
		const options: DialogOption[] = [];
		rawOptions.forEach((v) => {
			if (v instanceof ScriptDefinition) {
				steps.push(v);
			} else if (v instanceof DialogOption) {
				options.push(v);
			} else {
				f.quickError(node, 'syntax error', 'invalid dialog_option script');
			}
		});
		// Build it
		const info: DialogInfo = {
			identifier,
			settings,
			messages,
			options,
		};
		const dialogs = buildDialogFromInfo(f, node, info, messageN);
		dialogs.debug = MathlangLocation.quick(f, node);
		steps.push(dialogs);
		return steps;
	},
	json_literal: (f: FileState, node: TreeSitterNode): JSONLiteral[] => {
		// TODO: do it more by hand so that errors can be reported more accurately?
		const jsonNode = namedChildren(f, node)[0];
		if (!jsonNode) throw new Error('could not find JSON node');
		const text = jsonNode.text;
		try {
			const parsed = JSON.parse(text);
			return [JSONLiteral.quick(MathlangLocation.quick(f, node), parsed)];
		} catch {
			f.quickError(node, `syntax error`, `Generic error. Check trailing commas!`);
		}
		return [];
	},
	copy_macro: (f: FileState, node: TreeSitterNode): [CopyMacro] => {
		const script = stringCaptureForField(f, node, 'script');
		return [CopyMacro.quick(MathlangLocation.quick(f, node), script)];
	},
	debug_macro: (f: FileState, node: TreeSitterNode): AnyNode[] => {
		const ret: AnyNode[] = [];
		let dialogName = '';
		const serialDialogNode = optionalChildForField(f, node, 'serial_dialog');
		if (!serialDialogNode) {
			// might just be the name of a serial dialog, and not a serial-dialog-in-place
			dialogName = stringCaptureForField(f, node, 'serial_dialog_name');
		} else {
			const serialDialogs = handleNode(f, serialDialogNode);
			const serialDialog = SerialDialog.coerce(serialDialogs[0]);
			dialogName = autoIdentifierName(f, node);
			ret.push(
				new SerialDialogDefinition(MathlangLocation.quick(f, node), {
					dialogName,
					serialDialog,
				}),
			);
		}
		const debug = MathlangLocation.quick(f, node);
		const condition = CheckDebugMode.quick(debug, true);
		const ifTrue = SHOW_SERIAL_DIALOG.quick(dialogName);
		const action = simpleBranchMaker(f, node, condition, [ifTrue], []);
		ret.push(action);
		return ret;
	},
	looping_block: (f: FileState, node: TreeSitterNode, printGotoLabel: string): AnyNode[] => {
		return handleNamedChildren(f, node).map((v) => {
			if (v instanceof ContinueStatement) {
				return GotoLabel.quick(
					MathlangLocation.quick(f, v.debug.node),
					`condition #${printGotoLabel}`,
				);
			} else if (v instanceof BreakStatement) {
				return GotoLabel.quick(
					MathlangLocation.quick(f, v.debug.node),
					`rendezvous #${printGotoLabel}`,
				);
			}
			return v;
		});
	},
	while_block: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const block = new ConditionalBlock(f, node, 'while');
		const n = f.p.advanceGotoSuffix();
		const conditionL = `while condition #${n}`;
		const bodyL = `while body #${n}`;
		const rendezvousL = `while rendezvous #${n}`;
		const body = block.body.map((v) => {
			if (v instanceof ContinueStatement)
				return GotoLabel.quick(MathlangLocation.quick(f, v.debug.node), conditionL);
			if (v instanceof BreakStatement)
				return GotoLabel.quick(MathlangLocation.quick(f, v.debug.node), rendezvousL);
			return v;
		});
		const steps = [
			LabelDefinition.quick(debug, conditionL),
			...block.condition.toSteps(bodyL),
			GotoLabel.quick(MathlangLocation.quick(f, node), rendezvousL),
			LabelDefinition.quick(debug, bodyL),
			...body,
			GotoLabel.quick(MathlangLocation.quick(f, block.conditionNode || node), conditionL),
			LabelDefinition.quick(debug, rendezvousL),
		];
		return [MathlangSequence.quick(debug, steps, 'parser-node: while_block')];
	},
	do_while_block: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const doWhyle = new ConditionalBlock(f, node, 'do while');
		const n = f.p.advanceGotoSuffix();
		const conditionL = `do while condition #${n}`;
		const bodyL = `do while body #${n}`;
		const rendezvousL = `do while rendezvous #${n}`;
		const body = doWhyle.body.map((v) => {
			if (v instanceof ContinueStatement)
				return GotoLabel.quick(MathlangLocation.quick(f, v.debug.node), conditionL);
			if (v instanceof BreakStatement)
				return GotoLabel.quick(MathlangLocation.quick(f, v.debug.node), rendezvousL);
			return v;
		});
		const steps = [
			LabelDefinition.quick(debug, bodyL),
			...body,
			LabelDefinition.quick(debug, conditionL),
			...doWhyle.condition.toSteps(bodyL),
			LabelDefinition.quick(debug, rendezvousL),
		];
		return [MathlangSequence.quick(debug, steps, 'parser-node: do_while_block')];
	},
	for_block: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const n = f.p.advanceGotoSuffix();
		const conditionL = `for condition #${n}`;
		const bodyL = `for body #${n}`;
		const rendezvousL = `for rendezvous #${n}`;
		const continueL = `for continue #${n}`;
		const conditionN = mandatoryChildForField(f, node, 'condition');
		const condition = BoolExpression.coerce(handleCapture(f, conditionN));
		const bodyN = mandatoryChildForField(f, node, 'body');
		const incrementerN = mandatoryChildForField(f, node, 'incrementer');
		const body = handleNode(f, bodyN).map((v) => {
			if (v instanceof ContinueStatement)
				return GotoLabel.quick(MathlangLocation.quick(f, node), continueL);
			if (v instanceof BreakStatement)
				return GotoLabel.quick(MathlangLocation.quick(f, node), rendezvousL);
			return v;
		});
		const initializer = mandatoryChildForField(f, node, 'initializer');
		const steps = [
			...handleNode(f, initializer),
			LabelDefinition.quick(debug, conditionL),
			...condition.toSteps(bodyL),
			GotoLabel.quick(MathlangLocation.quick(f, node), rendezvousL),
			LabelDefinition.quick(debug, bodyL),
			...body,
			LabelDefinition.quick(debug, continueL),
			...handleNode(f, incrementerN),
			GotoLabel.quick(MathlangLocation.quick(f, conditionN), conditionL),
			LabelDefinition.quick(debug, rendezvousL),
		];
		return [MathlangSequence.quick(debug, steps, 'parser-node: for_block')];
	},
	if_single: (f: FileState, node: TreeSitterNode): AnyNode[] => {
		// for parsing the bytecode output; not really meant to be seen in the wild
		// e.g. `if varName then goto label LABELNAME;`
		// vs `if (varName) { /*do stuff at the label destination*/ }`
		const type = optionalTextForField(f, node, 'type');
		let condition = captureForField(f, node, 'condition');
		if (typeof condition === 'string') {
			const debug = MathlangLocation.quick(f, node);
			condition = CheckSaveFlag.quick(debug, condition, true);
		}
		// simple bool values true/false always jump or never jump, respectively
		if (typeof condition === 'boolean' || condition instanceof BoolLiteral) {
			const value = coerceToBool(f, node, condition);
			if (!type) {
				const script = stringCaptureForField(f, node, 'script');
				return value ? [RUN_SCRIPT.quick(script)] : [];
			} else if (type === 'index') {
				const index = numberCaptureForField(f, node, 'index');
				return value ? [GOTO_ACTION_INDEX.quick(index)] : [];
			} else if (type === 'label') {
				const label = stringCaptureForField(f, node, 'label');
				return value ? [GotoLabel.quick(MathlangLocation.quick(f, node), label)] : [];
			}
		}
		if (condition instanceof BoolComparison || condition instanceof BoolGetable) {
			if (!type) {
				const success_script = stringCaptureForField(f, node, 'script');
				return [condition.toAction({ success_script })];
			} else if (type === 'index') {
				const jump_index = numberCaptureForField(f, node, 'index');
				return [condition.toAction({ jump_index })];
			} else if (type === 'label') {
				const label = stringCaptureForField(f, node, 'label');
				return [condition.toAction({ label })];
			}
			return [condition];
		}
		throw new Error('invalid if_single');
	},
	if_chain: (f: FileState, node: TreeSitterNode) => {
		const ifNodes = childrenForField(f, node, 'if_block');
		// todo this could probably be improved somehow
		const iffs = ifNodes.map((v) => new ConditionalBlock(f, v, 'if'));
		const elseNode = optionalChildForField(f, node, 'else_block');
		let elseBody: AnyNode[] = [];
		if (elseNode) {
			const lastChild = optionalLastChild(f, elseNode);
			if (lastChild) {
				elseBody = handleNamedChildren(f, lastChild);
			}
		}
		return [ifChainMaker(f, node, iffs, elseBody, 'if_chain')];
	},
};

// What is the difference between handleNode() and handleCapture() except that you have to flatten handleNode()?
// Is it that you return complex thing vs primitive value?
// Is it that action wants to call handleCapture() and then work on its properties?
// It is, perhaps, that handleCapture() should check values against registered constants, and nodes shouldn't care about that? (DINGDINGDING)
