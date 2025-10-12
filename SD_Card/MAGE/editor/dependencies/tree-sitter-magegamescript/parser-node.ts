import { type FunctionStackEntry } from './parser-file.ts';
import {
	ConditionalBlock,
	reportMissingChildNodes,
	reportErrorNodes,
	debugLog,
	autoIdentifierName,
	ifChainMaker,
	simpleBranchMaker,
	flattenAndDoAutoReturn,
	doAutoBreakContinue,
	dropTemporary,
	newTemporary,
	updateScriptName,
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
} from './parser-capture.ts';
import { handleAction, extractLambdas, lambdaOrScriptIdentifier } from './parser-actions.ts';
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
	SerialDialogDefinition,
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
	forLoopMaker,
	IntExpression,
} from './parser-types.ts';
import {
	Action,
	COPY_SCRIPT,
	GOTO_ACTION_INDEX,
	MUTATE_VARIABLE,
	RUN_SCRIPT,
	SHOW_SERIAL_DIALOG,
} from './parser-bytecode-info.ts';

// When to check for errors/missing children? The point a TreeSitterNode is chosen.
// (Tree-sitter does not(?) report these on its own; we have to seek them each time.)

// Anytime a new (child) node is instead summoned/found, the check must be made
// again for THEIR children. Null nodes will be filtered at this time.

// Thus, if you've found a place where a node can be TreeSitterNode or null,
// it is an indication that the native tree-sitter methods were used instead of
// the Mathlang functions that also do this other work. Fix it!

export const handleNode = (debug: MathlangLocation): AnyNode[] => {
	const node = debug.node;
	debugLog(`handleNode: ${node.type} (${node.grammarType})`);

	reportMissingChildNodes(debug);
	reportErrorNodes(debug);

	// Actions are their own beast and are handled elsewhere
	if (node.type.startsWith('action_')) {
		return handleAction(debug);
	}

	const nodeFn = nodeFns[node.type];
	if (nodeFn) return nodeFn(debug);
	throw new Error('no parser-node function for ' + node.type);
};

const includeRecursion: string[] = [];

const nodeFns: Record<string, (debug: MathlangLocation) => AnyNode[]> = {
	line_comment: () => [],
	block_comment: () => [],
	semicolon: () => [],
	ERROR: (debug): [] => {
		// I guess feel free to add more of these as they come up
		// This might be the only place some of them can be detected
		// (This is only for nodes so malformed that tree-sitter can't tell what they are)
		const allChildren = namedChildren(debug);
		if (allChildren.some((child) => child.grammarType === 'over_time_operator')) {
			debug.quickError(
				'syntax error',
				`malformed 'do over time' expression`,
				`should take the form '@movable -> @coordinate over @duration [forever];'\n` +
					`   @movable = (player | self | entity @string) position | camera\n` +
					`   @coordinate = (player | self | entity @string) position | geometry @string (origin | length)`,
			);
		} else {
			debug.quickError('syntax error', 'syntax error');
		}
		return [];
	},
	fn: (debug) => {
		const nameN = optionalChildForField(debug, 'name');
		const name = nameN
			? coerceToString(debug, handleCapture(debug.using(nameN)))
			: autoIdentifierName(debug);
		if (debug.f.functions[name]) {
			debug.quickError('fn already defined', `fn ${name} already defined`);
			return [];
		}

		const paramNodes = childrenForField(debug, 'arg');

		// verify that fn params are all $constants
		let error = false;
		const params = paramNodes.map((param) => {
			if (param.grammarType !== 'CONSTANT') {
				debug.quickError('invalid fn arg', 'fn arg must be CONSTANT (prefixed with $)');
				error = true;
			}
			return param.text;
		});
		if (error) return [];

		// check for duplicate args
		const paramSet = new Set([...params]);
		if (paramSet.size !== params.length) {
			// TODO: tell the red squiggles which params are the duplicates
			debug.quickError('duplicate fn arg', 'duplicate fn args');
			return [];
		}

		// the body node remains unprocessed so the capture system can switch out args
		// (and use correct variable temporaries) at the time of the "call"
		const bodyNode = mandatoryChildForField(debug, 'body');
		const definition = FunctionDefinition.quick(debug, name, params, paramNodes, bodyNode);
		debug.f.functions[name] = definition;
		return [definition];
	},
	fn_call: (debug) => {
		const name = stringCaptureForField(debug, 'name');
		const definition = debug.f.functions[name];
		if (!definition) {
			const nameNode = optionalChildForField(debug, 'name') || debug.node;
			debug.using(nameNode).quickError('undefined fn', `function ${name} is undefined`);
			return [];
		}
		definition.callCount += 1;

		const callParamNodes = childrenForField(debug, 'arg');
		const definitionParamNodes = definition.paramNodes;

		// compare lengths of params in definition vs call
		if (callParamNodes.length < definitionParamNodes.length) {
			debug.quickError(
				'not enough fn args',
				`function ${name} requires ${definitionParamNodes.length} arguments; found ${callParamNodes.length}`,
			);
			// TODO: yellow squiggles when too many params are passed?
			// What if it's inside a .map() and you're not using all of them?
			return [];
		}

		const argSteps: AnyNode[] = [];
		let temporaryCount = 0;
		const callParams = callParamNodes.map((callParamNode) => {
			const capture = handleCapture(debug.using(callParamNode));
			if (typeof capture === 'string' || typeof capture === 'number') {
				return capture;
			}
			if (capture instanceof IntExpression) {
				temporaryCount += 1;
				const temp = newTemporary();
				argSteps.push(...capture.toSteps(temp));
				return temp;
			}
			debug
				.using(callParamNode)
				.quickError('invalid fn arg', 'function arg not an int epxression');
			return coerceToString(debug.using(callParamNode), capture, 'fucntion param');
		});

		// make local const registry based on what we were passed for this call
		const localConstants: FunctionStackEntry = {};
		callParams.forEach((callParam, i) => {
			const paramDebug = debug.using(callParamNodes[i]);
			const constantName = definition.params[i];
			const value =
				typeof callParam === 'boolean'
					? BoolLiteral.quick(paramDebug, callParam)
					: callParam;
			const constantDefinition = ConstantDefinition.quick(paramDebug, constantName, value);
			localConstants[constantName] = constantDefinition;
		});

		// add const registry to top of fn stack
		const stack: FunctionStackEntry[] = debug.f.currFunction;
		stack.unshift(localConstants);

		// and NOW we handle the fn body (with our newly-registered consts poised to be inserted)
		let fnSteps = handleNamedChildren(debug.using(definition.bodyNode));

		// bake it like a script body
		fnSteps = flattenAndDoAutoReturn(debug, fnSteps);

		// if there's any scripts-in-place, add a suffix to them
		// (we don't know if the fn args changed what the definition is)
		fnSteps.forEach((v, i, arr) => {
			if (v instanceof ScriptDefinition) {
				const oldName = v.scriptName;
				const newName = v.scriptName + `-call${definition.callCount}`;
				v.scriptName = newName;
				v.actions.forEach((action) => updateScriptName(action, oldName, newName));
				for (let j = i + 1; j < arr.length; j++) {
					updateScriptName(arr[j], oldName, newName);
				}
			}
		});

		// we're done with the args for this call; remove them from the fn stack
		stack.shift();

		// clean up temporaries
		for (let i = 0; i < temporaryCount; i++) {
			dropTemporary();
		}
		return argSteps.concat(fnSteps);
	},
	script_block: (debug) => {
		return handleNamedChildren(debug);
	},
	script_definition: (debug) => {
		const scriptName = stringCaptureForField(debug, 'script_name');
		const scriptBlockNode = mandatoryChildForField(debug, 'script_block');
		const definition = ScriptDefinition.processAndMake(debug, scriptName, scriptBlockNode);
		return [definition];
	},
	constant_assignment: (debug) => {
		const label = textForField(debug, 'label');
		const value = captureForField(debug, 'value');
		if (!isMGSPrimitive(value)) {
			const valueNode = mandatoryChildForField(debug, 'value');
			debug
				.using(valueNode)
				.quickError(
					'invalid constant value',
					`constant value not an MGS primitive (${label})`,
				);
			return [];
		}
		if (debug.f.constants[label]) {
			debug.quickError('constant already defined', `cannot redefine constant ${label}`);
		}
		debug.f.constants[label] = { debug, value };
		return [ConstantDefinition.quick(debug, label, value)];
	},
	include_macro: (debug) => {
		const f = debug.f;

		// die if recursion detected
		if (includeRecursion.includes(f.fileName)) {
			includeRecursion.push(f.fileName); // so the round trip is logged
			const message = `include_macro recursion\n       ${includeRecursion.join('\n       -> ')}`;
			throw new Error(message);
		}
		includeRecursion.push(f.fileName);

		// get prerequesite file
		const fileName = stringCaptureForField(debug, 'fileName');
		if (!f.p.fileMap[fileName]) {
			const message = `include_macro: cannot find file "${fileName}"`;
			debug.quickError('missing file', message);
			includeRecursion.pop();
			return [];
		}
		let insertF = f.p.fileMap[fileName].parsed;
		if (!insertF) {
			debugLog(`include_macro: must first parse prerequesite "${fileName}"`);
			f.p.parseFile(fileName);
			insertF = f.p.fileMap[fileName].parsed;
			if (!insertF) {
				const message = `include_macro: could not parse prerequesite "${fileName}"`;
				debug.quickError('missing file', message);
				includeRecursion.pop();
				return [];
			}
		} else {
			debugLog(`include_macro: prerequesite "${fileName}" already parsed`);
		}

		// WE GOOD TO GO
		debugLog(`include_macro: merging ${fileName} into ${f.fileName}...`);

		// add their constants to us
		Object.keys(insertF.constants).forEach((constantName) => {
			if (!f.constants[constantName]) {
				f.constants[constantName] = insertF.constants[constantName];
			} else {
				const message = `cannot redefine constant ${constantName} (via 'include')`;
				debug.quickError('constant already defined', message);
			}
		});

		// add their functions to us
		Object.keys(insertF.functions).forEach((functionName) => {
			if (!f.functions[functionName]) {
				f.functions[functionName] = insertF.functions[functionName];
			} else {
				const message = `cannot redefine function ${functionName} (via 'include')`;
				debug.quickError('fn already defined', message);
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

		// DONE!
		includeRecursion.pop();
		return [IncludeNode.quick(debug, fileName)];
	},
	rand_macro: (debug) => {
		const horizontal: AnyNode[][] = [];

		// count items per spread
		let spreadCount = -Infinity;
		namedChildren(debug).forEach((innerNode) => {
			const actions: AnyNode[] = handleNode(debug.using(innerNode));
			const len = actions.length;
			if (len === 0) return; // empties are ignored
			horizontal.push(actions);
			if (len === 1) return; // singles are passed through
			if (spreadCount === -Infinity) spreadCount = len;
			if (spreadCount !== len) {
				debug
					.using(innerNode)
					.quickError(
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

		// vertical slices -> if chain
		const temp = newTemporary();
		const iffs: ConditionalBlock[] = vertical.map((body, i) => {
			const condition = CheckVariable.quick(debug, temp, i, '==');
			const conditionNode = debug.node.firstChild || debug.node;
			const block: ConditionalBlock = {
				debug,
				condition,
				conditionNode,
				body,
				bodyNode: debug.node,
			};
			return block;
		});
		const steps = ifChainMaker(debug, iffs, [], 'rand_macro');

		// put the RNG roll at the top
		steps.unshift(MUTATE_VARIABLE.change(debug, temp, vertical.length, '?'));

		// DONE
		dropTemporary();
		return steps;
	},
	label_definition: (debug) => {
		const label = textForField(debug, 'label');
		return [LabelDefinition.quick(debug, label)];
	},
	add_dialog_settings: (debug) => {
		const targets = AddDialogSettingsTarget.breakIfNotAll(handleNamedChildren(debug));

		// Make a node "receipt"
		return [AddDialogSettings.quick(debug, targets)];
	},
	add_dialog_settings_target: (debug) => {
		const type = textForField(debug, 'type');
		let settingsTarget: DialogSettings = {}; // we don't know which bucket to use yet, but here's where it's going
		let target: string | undefined;

		// figure out which settings target ("bucket") it is
		if (type === 'default') {
			settingsTarget = debug.f.settings.default;
		} else if (type === 'label' || type === 'entity') {
			target = stringCaptureForField(debug, 'target');
			// make a bucket if there isn't one for that entity/label yet
			debug.f.settings[type][target] = debug.f.settings[type][target] || {};
			settingsTarget = debug.f.settings[type][target];
		} else {
			throw new Error(`unknown target type: ${type}`);
		}

		// find the settings themselves
		const parameters = DialogParameter.breakIfNotAll(
			capturesForField(debug, 'dialog_parameter'),
		);
		parameters.forEach((param) => {
			// put them in the bucket
			settingsTarget[param.property] = param.value;
		});

		// Make a node "receipt"
		const ret = AddDialogSettingsTarget.quick(debug, type, parameters, target);
		return [ret];
	},
	add_serial_dialog_settings: (debug) => {
		const rawParameters = capturesForField(debug, 'serial_dialog_parameter');
		const parameters = SerialDialogParameter.breakIfNotAll(rawParameters);
		parameters.forEach((param) => {
			debug.f.settings.serial[param.property] = param.value;
		});
		// Make a node "receipt"
		return [AddSerialDialogSettings.quick(debug, parameters)];
	},
	serial_dialog_option: (debug) => {
		// Option type
		const optionChar = textForField(debug, 'option_type');
		let optionType: SerialOptionType = 'options';
		if (optionChar === '_') optionType = 'text_options';
		else if (optionChar !== '#') throw new Error('invalid option type: ' + optionChar);
		// Label
		const label = stringCaptureForField(debug, 'label');
		// Script
		const scriptNode = mandatoryChildForField(debug, 'script');
		const scriptCapture = handleCapture(debug.using(scriptNode));
		const { script, steps } = lambdaOrScriptIdentifier(scriptCapture, 'serial_dialog_option');
		// Build it
		const option = SerialDialogOption.quick(debug, optionType, label, script);
		steps.push(option);
		return steps;
	},
	dialog_option: (debug) => {
		// Label
		const label = stringCaptureForField(debug, 'label');
		// Script
		const scriptNode = mandatoryChildForField(debug, 'script');
		const scriptCapture = handleCapture(debug.using(scriptNode));
		const { script, steps } = lambdaOrScriptIdentifier(scriptCapture, 'dialog_option');
		// Build it
		const ret = DialogOption.quick(debug, label, script);
		steps.push(ret);
		return steps;
	},
	serial_dialog_definition: (debug) => {
		const serialDialogNode = mandatoryChildForField(debug, 'serial_dialog');
		const dialogName = stringCaptureForField(debug, 'serial_dialog_name');
		const serialDialogs = handleNode(debug.using(serialDialogNode));
		if (serialDialogs.length !== 1) {
			throw new Error('serial dialogs must have only 1 serial dialog');
		}
		const serialDialog = SerialDialog.breakIfNot(serialDialogs[0]);
		return [SerialDialogDefinition.quick(debug, dialogName, serialDialog)];
	},
	dialog_definition: (debug) => {
		const name = stringCaptureForField(debug, 'dialog_name');
		const dialogs = Dialog.breakIfNotAll(handleChildrenForField(debug, 'dialog'));
		return [DialogDefinition.quick(debug, name, dialogs)];
	},
	serial_dialog: (debug): AnyNode[] => {
		// Settings
		const settings = {};
		const params = SerialDialogParameter.breakIfNotAll(
			capturesForField(debug, 'serial_dialog_parameter'),
		);
		params.forEach((v) => {
			settings[v.property] = v.value;
		});
		// Options
		const rawOptions = handleChildrenForField(debug, 'serial_dialog_option');
		const { scripts: steps, other: options } = extractLambdas(rawOptions);
		// Messages
		const messages = capturesForField(debug, 'serial_message');
		if (!messages.every((v) => typeof v === 'string')) {
			throw new Error('not every message is a string');
		}
		// Build it
		const info: SerialDialogInfo = {
			settings,
			messages,
			options: SerialDialogOption.breakIfNotAll(options),
		};
		const serialDialog = buildSerialDialogFromInfo(debug, info);
		// DONE
		steps.push(serialDialog);
		return steps;
	},
	dialog: (debug): AnyNode[] => {
		// Identifier
		const identifier = DialogIdentifier.breakIfNot(captureForField(debug, 'dialog_identifier'));
		// Settings
		const settings = {};
		const params = DialogParameter.breakIfNotAll(capturesForField(debug, 'dialog_parameter'));
		params.forEach((v) => {
			settings[v.property] = v.value;
		});
		// Messages
		const messageN = childrenForField(debug, 'message');
		const messages = messageN.map((v) => coerceToString(debug, handleCapture(debug.using(v))));
		// Options
		const rawOptions = handleChildrenForField(debug, 'dialog_option');
		const siphoned = extractLambdas(rawOptions);
		const steps: AnyNode[] = siphoned.scripts;
		const options: DialogOption[] = DialogOption.breakIfNotAll(siphoned.other);
		// Build it
		const info: DialogInfo = {
			identifier,
			settings,
			messages,
			options,
		};
		const dialogs = buildDialogFromInfo(debug, info, messageN);
		// DONE
		steps.push(dialogs);
		return steps;
	},
	json_object: (debug): AnyNode[] => {
		try {
			const parsed = JSON.parse(debug.node.text);
			let parsedAction = Action.fromArgs(parsed);
			if (parsedAction instanceof COPY_SCRIPT) {
				parsedAction = CopyMacro.quick(
					debug,
					parsedAction.script,
					parsedAction.search_and_replace,
				);
			}
			return [parsedAction];
		} catch {
			debug.quickError(
				`invalid JSON action`,
				`invalid JSON error, no known cause; check trailing commas and param names!`,
			);
		}
		return [];
	},
	json_literal: (debug): AnyNode[] => {
		const jsonNode = namedChildren(debug)[0];
		if (!jsonNode) throw new Error('could not find JSON node');
		if (jsonNode.grammarType !== 'json_array') {
			debug.quickError(
				'invalid JSON action',
				'the top level structure of a JSON literal should be an array: []',
			);
			return [];
		}
		const handledChildren: AnyNode[] = handleNamedChildren(debug.using(jsonNode));
		return [JSONLiteral.quick(debug, handledChildren)];
	},
	copy_macro: (debug): [CopyMacro] => {
		const script = stringCaptureForField(debug, 'script');
		return [CopyMacro.quick(debug, script)];
	},
	debug_macro: (debug): AnyNode[] => {
		const steps: AnyNode[] = [];
		let dialogName = '';
		const serialDialogNode = optionalChildForField(debug, 'serial_dialog');
		if (!serialDialogNode) {
			// might just be the name of a serial dialog, and not a serial-dialog-in-place
			dialogName = stringCaptureForField(debug, 'serial_dialog_name');
		} else {
			const serialDialogs = handleNode(debug.using(serialDialogNode));
			const serialDialog = SerialDialog.breakIfNot(serialDialogs[0]);
			dialogName = autoIdentifierName(debug);
			steps.push(
				new SerialDialogDefinition(debug, {
					dialogName,
					serialDialog,
				}),
			);
		}
		const condition = CheckDebugMode.quick(debug, true);
		const ifTrue = SHOW_SERIAL_DIALOG.quick(dialogName);
		const newSteps = simpleBranchMaker(debug, condition, [ifTrue], []);
		steps.push(...newSteps);
		return steps;
	},
	looping_block: (debug): AnyNode[] => {
		const n = debug.f.p.advanceGotoSuffix();
		const steps = handleNamedChildren(debug);
		const continueL = `condition #${n}`;
		const breakL = `break #${n}`;
		return doAutoBreakContinue(steps, continueL, breakL);
	},
	while_block: (debug) => {
		const block = new ConditionalBlock(debug);
		return forLoopMaker(debug, [], block.condition, block.body, [], 'while');
	},
	do_while_block: (debug) => {
		const n = debug.f.p.advanceGotoSuffix();
		const block = new ConditionalBlock(debug);
		const continueL = `do while continue #${n}`;
		const bodyL = `do while body #${n}`;
		const breakL = `do while break #${n}`;
		const body = doAutoBreakContinue(block.body, continueL, breakL);

		const steps = [
			LabelDefinition.quick(debug, bodyL),
			...body,
			LabelDefinition.quick(debug.using(block.conditionNode), continueL),
			...block.condition.toSteps(bodyL),
			LabelDefinition.quick(debug, breakL),
		];
		return steps;
	},
	for_block: (debug) => {
		const conditionN = mandatoryChildForField(debug, 'condition');
		const bodyN = mandatoryChildForField(debug, 'body');
		const incrementerN = mandatoryChildForField(debug, 'incrementer');
		const initializerN = mandatoryChildForField(debug, 'initializer');
		const rawBody = handleNode(debug.using(bodyN));

		const initializeSteps = handleNode(debug.using(initializerN));
		const condition = BoolExpression.breakIfNot(handleCapture(debug.using(conditionN)));
		const incrementerSteps = handleNode(debug.using(incrementerN));

		return forLoopMaker(debug, initializeSteps, condition, rawBody, incrementerSteps, 'for');
	},
	if_single: (debug): AnyNode[] => {
		// For parsing the bytecode output; not really meant to be seen in the wild
		// e.g. `if varName then goto label LABELNAME;`
		// vs `if (varName) { /*do stuff at the label destination*/ }`
		const type = optionalTextForField(debug, 'type');
		let condition = captureForField(debug, 'condition');
		if (typeof condition === 'string') {
			condition = CheckSaveFlag.quick(debug, condition, true);
		}

		// Bool literals true/false always jump or never jump, respectively
		if (typeof condition === 'boolean' || condition instanceof BoolLiteral) {
			const value = coerceToBool(debug, condition);
			if (!type) {
				const script = stringCaptureForField(debug, 'script');
				return value ? [RUN_SCRIPT.quick(script)] : [];
			} else if (type === 'index') {
				const index = numberCaptureForField(debug, 'index');
				return value ? [GOTO_ACTION_INDEX.quick(index)] : [];
			} else if (type === 'label') {
				const label = stringCaptureForField(debug, 'label');
				return value ? [GotoLabel.quick(debug, label)] : [];
			}
		}

		// The rest are singles, not expressions; bake the destination
		if (condition instanceof BoolComparison || condition instanceof BoolGetable) {
			if (!type) {
				const success_script = stringCaptureForField(debug, 'script');
				return [condition.toAction({ success_script })];
			} else if (type === 'index') {
				const jump_index = numberCaptureForField(debug, 'index');
				return [condition.toAction({ jump_index })];
			} else if (type === 'label') {
				const label = stringCaptureForField(debug, 'label');
				return [condition.toAction({ label })];
			}
			return [condition];
		}

		// If you're here, it broke
		throw new Error('invalid if_single');
	},
	if_chain: (debug) => {
		const ifNodes = childrenForField(debug, 'if_block');
		// todo: this could probably be improved somehow
		const iffs = ifNodes.map((v) => new ConditionalBlock(debug.using(v)));
		const elseNode = optionalChildForField(debug, 'else_block');
		let elseBody: AnyNode[] = [];
		if (elseNode) {
			const lastChild = optionalLastChild(debug.using(elseNode));
			if (lastChild) {
				elseBody = handleNamedChildren(debug.using(lastChild));
			}
		}
		return ifChainMaker(debug, iffs, elseBody, 'if_chain');
	},
};

/*

What is the difference between handleNode(), handleAction(), and handleCapture()?

- handleNode() => AnyNode[]
	- Can return any number of things
	- Basic stuff; meant for top level or bespoke nodes
- handleAction() => AnyNode
	- Can return exactly one thing. This is because the result will need to be "spread" and interact with its peers as a single unit. (e.g. inside a `rand!()`)
	- Also involves the generic action dictionary handler, which uses basic field names to generate the original pass of captures, some simple and some complex.
- handleCapture() => AnyNode | AnyNode[]
	- Handles constant/arg lookup and replacement for single tokens
	- Can return a single thing or multiple things (the latter is often for spreading fields for actions)

*/
