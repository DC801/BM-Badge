import { Node as TreeSitterNode } from 'web-tree-sitter';
import {
	captureForField,
	capturesForField,
	coerceToNumber,
	coerceToString,
	handleCapture,
	handleChildrenForField,
	mandatoryChildForField,
	optionalChildForField,
	stringCaptureForField,
	type Capture,
} from './parser-capture.ts';
import {
	ActionSetBool,
	MUTATE_VARIABLE,
	MUTATE_VARIABLES,
	RUN_SCRIPT,
	NON_BLOCKING_DELAY,
	BLOCKING_DELAY,
	COPY_VARIABLE,
	SET_ENTITY_DIRECTION_RELATIVE,
	UNREGISTER_SERIAL_DIALOG_COMMAND,
	UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT,
	SET_ENTITY_NAME,
	SET_ENTITY_TYPE,
	SET_ENTITY_INTERACT_SCRIPT,
	SET_ENTITY_TICK_SCRIPT,
	SET_ENTITY_GLITCHED,
	SET_ENTITY_PATH,
	GOTO_ACTION_INDEX,
	SET_SAVE_FLAG,
	SHOW_DIALOG,
	SHOW_SERIAL_DIALOG,
	CLOSE_DIALOG,
	CLOSE_SERIAL_DIALOG,
	SLOT_SAVE,
	SLOT_LOAD,
	SLOT_ERASE,
	LOAD_MAP,
	UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS,
	SET_SERIAL_DIALOG_COMMAND_VISIBILITY,
	SET_SCREEN_SHAKE,
	SCREEN_FADE_IN,
	SCREEN_FADE_OUT,
	SET_SCRIPT_PAUSE,
	SET_WARP_STATE,
	PLAY_ENTITY_ANIMATION,
	SET_CONNECT_SERIAL_DIALOG,
	REGISTER_SERIAL_DIALOG_COMMAND_ALIAS,
	REGISTER_SERIAL_DIALOG_COMMAND,
	REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT,
	TELEPORT_ENTITY_TO_GEOMETRY,
	TELEPORT_CAMERA_TO_GEOMETRY,
	SET_CAMERA_TO_FOLLOW_ENTITY,
	SET_LIGHTS_STATE,
	SET_PLAYER_CONTROL,
	SET_LIGHTS_CONTROL,
	SET_HEX_EDITOR_STATE,
	SET_HEX_EDITOR_DIALOG_MODE,
	SET_SERIAL_DIALOG_CONTROL,
	SET_HEX_EDITOR_CONTROL_CLIPBOARD,
	SET_HEX_EDITOR_CONTROL,
	PAN_CAMERA_TO_ENTITY,
	PAN_CAMERA_TO_GEOMETRY,
	PAN_CAMERA_ALONG_GEOMETRY,
	LOOP_CAMERA_ALONG_GEOMETRY,
	WALK_ENTITY_TO_GEOMETRY,
	WALK_ENTITY_ALONG_GEOMETRY,
	LOOP_ENTITY_ALONG_GEOMETRY,
	SET_MAP_LOOK_SCRIPT,
	SET_MAP_TICK_SCRIPT,
	SET_ENTITY_LOOK_SCRIPT,
	SET_ENTITY_DIRECTION,
	SET_ENTITY_DIRECTION_TARGET_ENTITY,
	SET_ENTITY_DIRECTION_TARGET_GEOMETRY,
	breakIfNotString,
	Action,
	ARRAY_DELETE,
	ARRAY_NEW,
	ARRAY_PUSH_FROM_VARIABLE,
	ARRAY_PUSH_FROM_VALUE,
	ARRAY_LOG,
	ARRAY_WRITE_INTO_INDEX_FROM_VALUE,
	ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VARIABLE,
	ARRAY_WRITE_INTO_INDEX_FROM_VARIABLE,
	ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VALUE,
} from './parser-bytecode-info.ts';
import {
	AnyNode,
	BoolExpression,
	DialogDefinition,
	IntBinaryExpression,
	SerialDialogDefinition,
	MathlangSequence,
	ReturnStatement,
	BreakStatement,
	ContinueStatement,
	BoolSetable,
	MovableIdentifier,
	CoordinateIdentifier,
	DirectionTarget,
	GotoLabel,
	MathlangLocation,
	BoolLiteral,
	CheckSaveFlag,
	EntityIntField,
	RNGSingle,
	RNGPair,
	MathlangMessage,
	FnCallReturnValue,
	ScriptDefinition,
	IntExpression,
	FnCall,
	NumberLiteral,
	IdentifierLiteral,
	ArrayMethodChain,
	ArrayReadFromIndex,
	ArrayReadFromVariableIndex,
	ArrayLength,
	ArraySliceMethod,
	ArrayValueLookup,
	ArrayWriteToIndex,
} from './parser-types.ts';
import {
	autoIdentifierName,
	newTemporary,
	dropTemporary,
	quickTemporary,
	RETURN,
} from './parser-utilities.ts';

// ------------------------ COMMON ACTION HANDLING ------------------------ //

export type GenericObj = Record<string, unknown>;
type FieldToSpread = { node: TreeSitterNode; captures: Capture[] };

// Takes an object with simple values and an object with array values and "spreads" them --
// e.g. { a: b }, { c: [d,e] } -> [ {a:b, c:d}, {a:b, c:e} ]
const spreadValues = (
	debug: MathlangLocation,
	commonFields: GenericObj,
	fieldsToSpread: Record<string, FieldToSpread>,
): GenericObj[] => {
	// count spreads
	let spreadSize = -Infinity;
	Object.values(fieldsToSpread).forEach((spreadField) => {
		const len = spreadField.captures.length;
		// spreadSize won't be 1 btw, because 1s go to commonFields
		if (spreadSize === -Infinity) spreadSize = len;
		if (spreadSize !== len) {
			debug
				.using(spreadField.node)
				.quickError(
					'mismatched spread lengths',
					`spreads must have the same count of items within a given action`,
				);
			spreadSize = Math.max(spreadSize, len);
		}
	});

	// if it's a single thing, pass it back whole
	if (spreadSize === -Infinity) {
		return [commonFields];
	}

	//make sure that define-in-place scripts are only defined once
	const nonSpreadFields = Object.keys(commonFields);
	nonSpreadFields.forEach((nonSpreadFieldName) => {
		const scriptDef = commonFields[nonSpreadFieldName];
		if (scriptDef instanceof ScriptDefinition) {
			const fauxCaptures: (AnyNode | string)[] = [];
			for (let i = 0; i < spreadSize; i++) {
				if (i === 0) {
					fauxCaptures.push(scriptDef);
				} else {
					fauxCaptures.push(scriptDef.scriptName);
				}
			}
			fieldsToSpread[nonSpreadFieldName] = {
				node: scriptDef.debug.node,
				captures: fauxCaptures,
			};
			delete commonFields[nonSpreadFieldName];
		}
	});

	// put spread action into multiple variants
	const ret: GenericObj[] = [];
	for (let i = 0; i < spreadSize; i++) {
		const insert: GenericObj = { ...commonFields };
		Object.keys(fieldsToSpread).forEach((fieldName) => {
			const allValues = fieldsToSpread[fieldName].captures;
			const currValue = allValues[i % allValues.length];
			insert[fieldName] = currValue;
		});
		ret.push(insert);
	}

	// DONE
	return ret;
};

export const handleAction = (debug: MathlangLocation): AnyNode[] => {
	const data = actionData[debug.node.grammarType];
	if (!data) {
		const customFn = actionFns[debug.node.grammarType];
		if (!customFn) {
			const message = `no action data nor handler function found for action ${debug.node.grammarType}`;
			throw new Error(message);
		}
		return customFn(debug);
	}
	const action = { ...data.values };

	// Action params
	const captures: string[] = data.captures || [];
	const fieldsToSpread: Record<string, FieldToSpread> = {};
	captures.forEach((fieldName) => {
		const captureNode = optionalChildForField(debug, fieldName);
		if (captureNode === null) {
			if (!data.optionalCaptures || !data.optionalCaptures.includes(fieldName)) {
				throw new Error(
					`capture found for field not associated with action ${debug.node.grammarType} (${fieldName})`,
				);
			}
			return;
		}
		const capture = handleCapture(debug.using(captureNode));
		if (!Array.isArray(capture)) {
			action[fieldName] = capture;
		} else {
			fieldsToSpread[fieldName] = {
				node: captureNode,
				captures: capture,
			};
		}
	});
	const spreads: GenericObj[] = spreadValues(debug, action, fieldsToSpread);
	// Different param combinations will result in different actions,
	// so let the handler identify them AFTER the spreads are spread
	const handleFn = data.handle || Action.fromArgs;
	return spreads.map((v, i) => handleFn(v, debug, i)).filter((v) => v !== undefined);
};

// Put things here if you don't care about auto-spreading them; otherwise they should go in actionData
// TODO: maybe they should just be regular nodes then? Then only "spreadable" things wanna be handled here?
type ActionFn = (debug: MathlangLocation, isConcat?: boolean) => AnyNode[];
const actionFns: Record<string, ActionFn> = {
	action_array_expression: (debug) => {
		const chain = ArrayMethodChain.breakIfNot(captureForField(debug, 'array_expression'));
		if (
			chain.final instanceof ArrayLength ||
			chain.final instanceof ArrayReadFromIndex ||
			chain.final instanceof ArrayReadFromVariableIndex
		) {
			debug.quickWarning(
				'return value not stored',
				'This array method chain produces a value. Did you mean to discard it?',
			);
		} else if (
			chain.final instanceof ArraySliceMethod ||
			// chain.final instanceof ArrayMap ||
			chain.final instanceof ArrayReadFromVariableIndex
		) {
			debug.quickWarning(
				'return value not stored',
				'This array method chain produces a new array. Did you mean to discard it?',
			);
		}
		const ret = chain.toSteps(RETURN);
		ret.push(MUTATE_VARIABLE.set(RETURN, 0));
		return ret;
	},
	action_new_array: (debug) => {
		const name = stringCaptureForField(debug, 'array');
		const emptyNode = optionalChildForField(debug, 'empty');
		if (emptyNode) return [ARRAY_NEW.quick(name)];
		const valuesNode = optionalChildForField(debug, 'values');
		const steps: AnyNode[] = [ARRAY_NEW.quick(name)];
		if (valuesNode) {
			const handled = handleCapture(debug.using(valuesNode));
			const values = Array.isArray(handled) ? handled : [handled];
			values.forEach((v) => {
				if (typeof v === 'number') {
					steps.push(ARRAY_PUSH_FROM_VALUE.quick(name, v));
				} else if (v instanceof NumberLiteral) {
					steps.push(ARRAY_PUSH_FROM_VALUE.quick(name, v.value));
				} else if (typeof v === 'string') {
					steps.push(ARRAY_PUSH_FROM_VARIABLE.quick(name, v));
				} else if (v instanceof IdentifierLiteral) {
					steps.push(ARRAY_PUSH_FROM_VARIABLE.quick(name, v.source));
				} else if (v instanceof IntExpression) {
					const temp = newTemporary();
					steps.push(...v.toSteps(temp));
					dropTemporary();
					steps.push(ARRAY_PUSH_FROM_VARIABLE.quick(name, temp));
				} else {
					throw new Error('array initial values of unknown type');
				}
			});
			return steps;
		}
		const methodsNode = mandatoryChildForField(debug, 'array_expression');
		const handledRaw = handleCapture(debug.using(methodsNode));
		const handled = ArrayMethodChain.breakIfNot(handledRaw);
		return handled.toSteps(name);
	},
	action_show_dialog: (debug) => {
		const names = capturesForField(debug, 'dialog_name');
		// multi
		if (names.length > 1) {
			return names.map((dialogName) => {
				return SHOW_DIALOG.quick(coerceToString(debug, dialogName, 'dialogName'));
			});
		}
		// single
		const name = names.length === 0 ? autoIdentifierName(debug) : breakIfNotString(names[0]);
		const rawDialogs = handleChildrenForField(debug, 'dialog');
		const { scripts: steps, other: dialogs } = extractLambdas(rawDialogs);
		const action = SHOW_DIALOG.quick(name);
		if (dialogs.length) {
			// single with contents (not just a name)
			const dialogDefinition = DialogDefinition.quick(debug, name, dialogs);
			steps.push(dialogDefinition);
		}
		steps.push(action);
		return steps;
	},
	action_concat_serial_dialog: (debug) => {
		return actionShowSerialDialog(debug, true);
	},
	action_show_serial_dialog: (debug) => {
		return actionShowSerialDialog(debug, false);
	},
};

const actionShowSerialDialog = (
	debug: MathlangLocation,
	disable_newline: boolean = false,
): AnyNode[] => {
	const names = capturesForField(debug, 'serial_dialog_name');
	// multi
	if (names.length > 1) {
		return names.map((dialogName) =>
			SHOW_SERIAL_DIALOG.quick(
				coerceToString(debug, dialogName, 'dialogName'),
				disable_newline,
			),
		);
	}
	// single
	const name = names.length === 0 ? autoIdentifierName(debug) : breakIfNotString(names[0]);
	const rawSerialDialogs = handleChildrenForField(debug, 'serial_dialog');
	const { scripts: steps, other: serialDialogs } = extractLambdas(rawSerialDialogs);
	const action = SHOW_SERIAL_DIALOG.quick(name, disable_newline);
	if (serialDialogs.length) {
		// single with contents (not just a name)
		const serialDialoDefinition = SerialDialogDefinition.quick(debug, name, serialDialogs[0]);
		steps.push(serialDialoDefinition);
	}
	steps.push(action);
	return steps;
};

type actionDataEntry = {
	values?: Record<string, unknown>;
	captures?: string[];
	optionalCaptures?: string[];
	handle?: (v: GenericObj, debug: MathlangLocation, i?: number) => AnyNode | undefined;
};
const actionData: Record<string, actionDataEntry> = {
	action_return_statement: {
		// TODO: everything after is unreachable
		// Ditto some other actions, too: goto script, load map (look for purple)
		handle: (v, debug) => {
			const returnStatement = ReturnStatement.quick(debug);
			const expNode = optionalChildForField(debug, 'expression');
			if (expNode) {
				const steps: AnyNode[] = [];
				const exp = handleCapture(debug.using(expNode));
				if (typeof exp === 'number') {
					steps.push(MUTATE_VARIABLE.set(RETURN, exp));
				} else if (typeof exp === 'string') {
					steps.push(MUTATE_VARIABLES.set(debug, RETURN, exp));
				} else if (exp instanceof IntExpression) {
					const temporary = newTemporary();
					steps.push(
						...exp.toSteps(temporary),
						MUTATE_VARIABLES.set(debug, RETURN, temporary),
					);
					dropTemporary();
				} else {
					throw new Error('invalid return value in return statement');
				}
				steps.push(returnStatement);
				return MathlangSequence.orSingle(debug, steps, 'return_statement_with_value');
			}
			return returnStatement;
		},
	},
	action_continue_statement: {
		handle: (v, debug) => ContinueStatement.quick(debug),
	},
	action_break_statement: {
		handle: (v, debug) => BreakStatement.quick(debug),
	},
	action_close_dialog: {
		handle: () => new CLOSE_DIALOG(),
	},
	action_close_serial_dialog: {
		handle: () => new CLOSE_SERIAL_DIALOG(),
	},
	action_save_slot: {
		handle: () => new SLOT_SAVE(),
	},
	action_load_slot: {
		captures: ['slot'],
		handle: (v) => new SLOT_LOAD(v),
	},
	action_erase_slot: {
		captures: ['slot'],
		handle: (v) => new SLOT_ERASE(v),
	},
	action_load_map: {
		captures: ['map'],
		handle: (v) => new LOAD_MAP(v),
	},
	action_goto_label: {
		captures: ['label'],
		handle: (v, debug) => new GotoLabel(debug, v),
	},
	action_goto_index: {
		captures: ['action_index'],
		handle: (v) => new GOTO_ACTION_INDEX(v),
	},
	action_run_script: {
		captures: ['script'],
		handle: (v) => new RUN_SCRIPT(v),
	},
	action_non_blocking_delay: {
		captures: ['duration'],
		handle: (v) => new NON_BLOCKING_DELAY(v),
	},
	action_blocking_delay: {
		captures: ['duration'],
		handle: (v) => new BLOCKING_DELAY(v),
	},
	action_delete_command: {
		captures: ['command'],
		handle: (v) => new UNREGISTER_SERIAL_DIALOG_COMMAND(v),
	},
	action_delete_command_arg: {
		captures: ['command', 'argument'],
		handle: (v) => new UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT(v),
	},
	action_delete_alias: {
		captures: ['alias'],
		handle: (v) => new UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS(v),
	},
	action_hide_command: {
		values: { is_visible: false },
		captures: ['command'],
		handle: (v) => new SET_SERIAL_DIALOG_COMMAND_VISIBILITY(v),
	},
	action_unhide_command: {
		values: { is_visible: true },
		captures: ['command'],
		handle: (v) => new SET_SERIAL_DIALOG_COMMAND_VISIBILITY(v),
	},
	action_camera_shake: {
		captures: ['frequency', 'amplitude', 'duration'],
		handle: (v) => new SET_SCREEN_SHAKE(v),
	},
	action_camera_fade_in: {
		captures: ['color', 'duration'],
		handle: (v) => new SCREEN_FADE_IN(v),
	},
	action_camera_fade_out: {
		captures: ['color', 'duration'],
		handle: (v) => new SCREEN_FADE_OUT(v),
	},
	action_pause_script: {
		values: { bool_value: true },
		captures: ['script_slot', 'entity'],
		handle: (v) => new SET_SCRIPT_PAUSE(v),
	},
	action_unpause_script: {
		values: { bool_value: false },
		captures: ['script_slot', 'entity'],
		handle: (v) => new SET_SCRIPT_PAUSE(v),
	},
	action_play_entity_animation: {
		captures: ['entity', 'animation', 'play_count'],
		handle: (v) => new PLAY_ENTITY_ANIMATION(v),
	},
	action_set_warp_state: {
		captures: ['string'],
		handle: (v) => new SET_WARP_STATE(v),
	},
	action_set_serial_connect: {
		captures: ['serial_dialog'],
		handle: (v) => new SET_CONNECT_SERIAL_DIALOG(v),
	},
	action_print_array: {
		captures: ['array_name'],
		handle: (v) => new ARRAY_LOG(v),
	},
	action_delete_array: {
		captures: ['array'],
		handle: (v, debug) => {
			const name = stringCaptureForField(debug, 'array');
			return ARRAY_DELETE.quick(name);
		},
	},
	action_set_alias: {
		captures: ['alias', 'command'],
		handle: (v) => new REGISTER_SERIAL_DIALOG_COMMAND_ALIAS(v),
	},
	action_set_command: {
		values: { is_fail: false },
		captures: ['command', 'script'],
		handle: (v, debug) => {
			const { steps, script } = lambdaOrScriptIdentifier(v.script, 'action_set_command');
			steps.push(new REGISTER_SERIAL_DIALOG_COMMAND({ ...v, script }));
			return MathlangSequence.orSingle(debug, steps, 'action_set_command');
		},
	},
	action_set_command_fail: {
		values: { is_fail: true },
		captures: ['command', 'script'],
		handle: (v, debug) => {
			const { steps, script } = lambdaOrScriptIdentifier(v.script, 'action_set_command_fail');
			steps.push(new REGISTER_SERIAL_DIALOG_COMMAND({ ...v, script }));
			return MathlangSequence.orSingle(debug, steps, 'action_set_command_fail');
		},
	},
	action_set_command_arg: {
		values: { is_fail: true },
		captures: ['command', 'argument', 'script'],
		handle: (v, debug) => {
			const { steps, script } = lambdaOrScriptIdentifier(v.script, 'action_set_command_fail');
			steps.push(new REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT({ ...v, script }));
			return MathlangSequence.orSingle(debug, steps, 'action_set_command_args');
		},
	},
	action_set_ambiguous: {
		// if the LHS is ambiguous (a variable name)
		captures: ['lhs', 'rhs'],
		handle: (v, debug, i): AnyNode => {
			const lhs = coerceToString(debug, v.lhs, 'action_set_ambiguous lhs');
			const rhs = v.rhs;

			// simple cases first (easy to check for)

			// varName = false;
			if (rhs instanceof BoolLiteral) {
				return SET_SAVE_FLAG.toValue(lhs, rhs.value);
			}

			// varName = 255;
			if (typeof rhs === 'number') return MUTATE_VARIABLE.set(lhs, rhs);

			// AMBIGUITY DANCE PARTY
			// varName = varName;
			if (typeof rhs == 'string') {
				if (i === undefined) throw new Error('undefined index');
				// For expansions, we only want to print one ambiguous identifier at a time in an error/warning message.
				// `i` is from the caller, who knows which one of the set we're looking at now.
				// Basically, the whole spread might not be ambiguous, so we need to report
				// only once the action is identified in an individual spread, not all the time.
				const lhsChild = mandatoryChildForField(debug, 'lhs');
				const rhsChild = mandatoryChildForField(debug, 'rhs');
				const lhsSquiggliesNode = lhsChild?.namedChildren?.[i] || lhsChild;
				const rhsSquiggliesNode = rhsChild?.namedChildren?.[i] || rhsChild;
				if (!lhsSquiggliesNode || !rhsSquiggliesNode) {
					throw new Error(`couldn't find nodes to squiggle`);
				}
				const printNodes = [lhsSquiggliesNode, rhsSquiggliesNode];
				const suggestion = rhs.includes(' ') ? '"' + rhs + '"' : rhs;
				const footer =
					`Both identifiers will be interpreted as ints unless you coerce the right-hand side to a bool expression, like this:` +
					`\n    !!${suggestion}` +
					`\nTo silence this warning, turn the RHS into a passthrough int expression (which will produce the same output), e.g.:` +
					`\n    ${suggestion} + 0` +
					`\n    ${suggestion} * 1`;
				const message = 'these identifiers could be ints or bools';
				const locations = printNodes.map((printNode) => debug.using(printNode));
				const warning = new MathlangMessage(
					locations,
					'ambiguous identifiers',
					message,
					footer,
				);
				debug.f.p.newWarning(warning);
				return MUTATE_VARIABLES.set(debug, lhs, rhs);
			}

			// varName = player x;
			if (rhs instanceof EntityIntField) {
				return COPY_VARIABLE.intoVariable(rhs.entity, rhs.field, lhs);
			}

			// varName = RNG!(99);
			if (rhs instanceof RNGSingle) {
				return rhs.assignToVar(lhs);
			}

			// varName = RNG!(0, 99);
			if (rhs instanceof RNGPair) {
				return rhs.assignToVar(lhs);
			}

			// varName = fnCall(9);
			if (rhs instanceof FnCall) {
				const baked = rhs.bake().assignToVar(lhs);
				// TODO: can I roll bake into assignToVar? Then it can all be uniform
				return baked;
			}

			// varName = copyScript();
			if (rhs instanceof FnCallReturnValue) {
				return rhs.assignToVar(lhs);
			}

			// varName = (255 + player x);
			if (rhs instanceof ArrayValueLookup) {
				return rhs.assignToVar(lhs);
			}

			// varName = (255 + player x);
			if (rhs instanceof IntBinaryExpression) {
				return rhs.assignToVar(lhs);
			}

			// varName = (debug_mode || player glitched);
			if (rhs instanceof BoolExpression) {
				return rhs.assignToVar(lhs);
			}

			// varName = arrayName.pop();
			if (rhs instanceof ArrayMethodChain) {
				if (rhs.return_type === 'none') {
					debug.quickWarning(
						'array does not return value',
						`cannot assign RHS to variable "${lhs}", as RHS does not return a value; 0 will be used`,
					);
				} else if (rhs.return_type === 'array') {
					debug.quickError(
						'array does not return value',
						`cannot assign RHS to variable "${lhs}", as RHS returns an array; 0 will be used`,
					);
				}
				return rhs.assignToVar(lhs);
			}

			throw new Error('unknown RHS in action_set_ambiguous');
		},
	},
	action_set_int: {
		// If we've matched this, we know the LHS is not a variable name.
		captures: ['lhs', 'rhs'],
		handle: (v, debug): AnyNode => {
			const lhs = v.lhs;
			const rhs = v.rhs;
			if (lhs instanceof EntityIntField) {
				// player x = 0;
				if (typeof rhs === 'number') {
					return lhs.setToNumber(rhs);
				}

				// player x = varName;
				if (typeof rhs === 'string') {
					return lhs.setToVariable(rhs);
				}

				// player x = player y;
				// player x = player y + self y;
				if (rhs instanceof IntExpression) {
					const temporary = newTemporary();
					const steps = rhs.toSteps(temporary);
					steps.push(lhs.setToVariable(temporary));
					dropTemporary();
					return MathlangSequence.quick(debug, steps, 'action_set_int: EntityIntField');
				}
			} else if (lhs instanceof ArrayWriteToIndex) {
				const arrayName = lhs.array_name;
				const steps: AnyNode[] = [];
				const argsRaw = [lhs.exp_index, rhs];
				let temporariesUsed = 0;
				const args = argsRaw.map((arg) => {
					if (typeof arg === 'string') return arg;
					if (typeof arg === 'number') return arg;
					if (arg instanceof NumberLiteral) return arg.value;
					if (arg instanceof IdentifierLiteral) return arg.source;
					if (arg instanceof IntExpression) {
						temporariesUsed += 1;
						const temp = newTemporary();
						steps.push(...arg.toSteps(temp));
						return temp;
					}
					throw new Error('unsupported array write lhs or rhs');
				});
				const index = args[0];
				const exp = args[1];
				if (typeof index === 'number') {
					if (typeof exp === 'number') {
						return ARRAY_WRITE_INTO_INDEX_FROM_VALUE.quick(arrayName, index, exp);
					} else {
						const action = ARRAY_WRITE_INTO_INDEX_FROM_VARIABLE.quick(
							arrayName,
							index,
							exp,
						);
						steps.push(action);
					}
				} else if (typeof index === 'string') {
					if (typeof exp === 'number') {
						const action = ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VALUE.quick(
							arrayName,
							index,
							exp,
						);
						steps.push(action);
					} else {
						const action = ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VARIABLE.quick(
							arrayName,
							index,
							exp,
						);
						steps.push(action);
					}
				}
				while (temporariesUsed > 0) {
					dropTemporary();
					temporariesUsed -= 1;
				}
				return MathlangSequence.orSingle(debug, steps, 'action_set_int (array write)');
			}

			throw new Error('unknown RHS type in action_set_int');
		},
	},
	action_set_bool: {
		// If we've matched this, we know the LHS is not an int variable name.
		captures: ['lhs', 'rhs'],
		handle: (v, debug) => {
			if (!(v.lhs instanceof BoolSetable)) {
				throw new Error('LHS not a bool_setable');
			}
			if (typeof v.rhs === 'boolean') v.rhs = BoolLiteral.quick(debug, v.rhs);
			if (typeof v.rhs === 'string') v.rhs = CheckSaveFlag.quick(debug, v.rhs);
			if (!(v.rhs instanceof BoolExpression)) {
				throw new Error('RHS not a bool_expression');
			}
			let lhs: ActionSetBool | null = null;
			if (v.lhs.type === 'entity') {
				const entity = coerceToString(
					debug,
					v.lhs.value,
					'SET_ENTITY_GLITCHED field entity',
				);
				lhs = SET_ENTITY_GLITCHED.quick(entity, true);
			}
			if (v.lhs.type === 'light') {
				const lights = coerceToString(debug, v.lhs.value, 'SET_LIGHTS_STATE field lights');

				lhs = SET_LIGHTS_STATE.quick(lights, true);
			}
			if (v.lhs.type === 'player_control') {
				lhs = SET_PLAYER_CONTROL.quick(true);
			}
			if (v.lhs.type === 'lights_control') {
				lhs = SET_LIGHTS_CONTROL.quick(true);
			}
			if (v.lhs.type === 'hex_editor') {
				lhs = SET_HEX_EDITOR_STATE.quick(true);
			}
			if (v.lhs.type === 'hex_dialog_mode') {
				lhs = SET_HEX_EDITOR_DIALOG_MODE.quick(true);
			}
			if (v.lhs.type === 'hex_control') {
				lhs = SET_HEX_EDITOR_CONTROL.quick(true);
			}
			if (v.lhs.type === 'hex_clipboard') {
				lhs = SET_HEX_EDITOR_CONTROL_CLIPBOARD.quick(true);
			}
			if (v.lhs.type === 'serial_control') {
				lhs = SET_SERIAL_DIALOG_CONTROL.quick(true);
			}
			if (lhs === null) {
				throw new Error('unknown LHS type');
			}
			return v.rhs.assignToSetBool(lhs);
		},
	},
	action_set_position: {
		captures: ['movable', 'coordinate'],
		handle: (v, debug): Action | MathlangSequence => {
			const movable = MovableIdentifier.breakIfNot(v.movable);
			const coordinate = CoordinateIdentifier.breakIfNot(v.coordinate);
			if (movable.type === 'camera') {
				if (coordinate.type === 'geometry' && coordinate.polygonType !== 'length') {
					return TELEPORT_CAMERA_TO_GEOMETRY.quick(coordinate.value);
				}
				if (coordinate.type === 'entity') {
					return SET_CAMERA_TO_FOLLOW_ENTITY.quick(coordinate.value);
				}
			} else if (movable.type === 'entity') {
				if (coordinate.type === 'geometry' && coordinate.polygonType !== 'length') {
					return TELEPORT_ENTITY_TO_GEOMETRY.quick(movable.value, coordinate.value);
				}
				if (coordinate.type === 'entity') {
					const temp = quickTemporary();
					const copyFrom = coordinate.value;
					const copyTo = movable.value;
					const steps = [
						COPY_VARIABLE.intoVariable(copyFrom, 'x', temp),
						COPY_VARIABLE.intoField(temp, copyTo, 'x'),
						COPY_VARIABLE.intoVariable(copyFrom, 'y', temp),
						COPY_VARIABLE.intoField(temp, copyTo, 'y'),
					];
					return MathlangSequence.quick(debug, steps, 'action_set_position');
				}
			}
			throw new Error('invalid everything');
		},
	},
	action_move_over_time: {
		captures: ['movable', 'coordinate', 'duration', 'forever'],
		optionalCaptures: ['forever'],
		handle: (v, debug): Action | undefined => {
			const movable = MovableIdentifier.breakIfNot(v.movable);
			const coordinate = CoordinateIdentifier.breakIfNot(v.coordinate);
			const duration = coerceToNumber(debug, v.duration, 'duration');
			if (movable.type === 'camera') {
				if (coordinate.type === 'entity') {
					if (v.forever) {
						debug.quickError(
							'invalid action param combination',
							`cannot move camera to an entity's position forever`,
						);
						return;
					} else {
						return PAN_CAMERA_TO_ENTITY.quick(coordinate.value, duration);
					}
				}
				if (coordinate.type === 'geometry') {
					if (coordinate.polygonType === 'length') {
						if (v.forever) {
							return LOOP_CAMERA_ALONG_GEOMETRY.quick(coordinate.value, duration);
						} else {
							return PAN_CAMERA_ALONG_GEOMETRY.quick(coordinate.value, duration);
						}
					} else if (coordinate.polygonType === 'origin') {
						if (v.forever) {
							debug.quickError(
								'invalid action param combination',
								`'forever' can only be used with geometry lengths, not single points`,
							);
							return;
						} else {
							return PAN_CAMERA_TO_GEOMETRY.quick(coordinate.value, duration);
						}
					}
				}
			}

			if (movable.type === 'entity') {
				if (coordinate.type === 'entity') {
					debug.quickError(
						'invalid action param combination',
						`cannot move an entity to another entity's position over time`,
					);
					return;
				}
				if (coordinate.type === 'geometry') {
					if (coordinate.polygonType === 'length') {
						if (v.forever) {
							return LOOP_ENTITY_ALONG_GEOMETRY.quick(
								movable.value,
								coordinate.value,
								duration,
							);
						} else {
							return WALK_ENTITY_ALONG_GEOMETRY.quick(
								movable.value,
								coordinate.value,
								duration,
							);
						}
					}
					if (coordinate.polygonType === 'origin') {
						if (v.forever) {
							debug.quickError(
								'invalid action param combination',
								`'forever' can only be used with geometry lengths, not single points`,
							);
							return;
						} else {
							return WALK_ENTITY_TO_GEOMETRY.quick(
								movable.value,
								coordinate.value,
								duration,
							);
						}
					}
				}
			}
		},
	},
	action_set_direction: {
		captures: ['entity', 'target'],
		handle: (v, debug): Action => {
			const entity = coerceToString(debug, v.entity, 'entity');
			const target = DirectionTarget.breakIfNot(v.target);
			if (target.type === 'nsew') {
				return SET_ENTITY_DIRECTION.quick(entity, target.value);
			} else if (target.type === 'geometry') {
				return SET_ENTITY_DIRECTION_TARGET_GEOMETRY.quick(entity, target.value);
			} else if (target.type === 'entity') {
				return SET_ENTITY_DIRECTION_TARGET_ENTITY.quick(entity, target.value);
			}
			throw new Error('invalid type of DirectionTarget');
		},
	},
	action_set_script: {
		captures: ['entity', 'script_slot', 'script'],
		handle: (v, debug): AnyNode => {
			const entity = coerceToString(debug, v.entity, 'entity');
			const script_slot = coerceToString(debug, v.script_slot, 'script_slot');
			const { script, steps } = lambdaOrScriptIdentifier(v.script, 'action_set_script');
			if (entity === '%MAP%') {
				if (script_slot === 'on_tick') {
					steps.push(SET_MAP_TICK_SCRIPT.quick(script));
				} else if (script_slot === 'on_look') {
					steps.push(SET_MAP_LOOK_SCRIPT.quick(script));
				} else {
					const errorNode = mandatoryChildForField(debug, 'script_slot');
					debug
						.using(errorNode)
						.quickError(
							`invalid map script slot`,
							`You can only set a map's 'on_tick' or 'on_look' slot (setting ${script_slot})`,
						);
				}
			} else if (v.script_slot === 'on_tick') {
				steps.push(SET_ENTITY_TICK_SCRIPT.quick(entity, script));
			} else if (v.script_slot === 'on_interact') {
				steps.push(SET_ENTITY_INTERACT_SCRIPT.quick(entity, script));
			} else if (v.script_slot === 'on_look') {
				steps.push(SET_ENTITY_LOOK_SCRIPT.quick(entity, script));
			} else {
				const errorNode = mandatoryChildForField(debug, 'script_slot');
				debug
					.using(errorNode)
					.quickError(
						`invalid entity script slot`,
						`Valid entity script slots: 'on_tick', 'on_interact', 'on_look'`,
					);
			}
			return MathlangSequence.orSingle(debug, steps, 'action_set_script');
		},
	},
	action_set_entity_string: {
		captures: ['entity', 'field', 'value'],
		handle: (v, debug): Action => {
			const entity = coerceToString(debug, v.entity, 'entity');
			const value = coerceToString(debug, v.value, 'value');
			if (v.field === 'name') {
				return SET_ENTITY_NAME.quick(entity, value);
			} else if (v.field === 'type') {
				return SET_ENTITY_TYPE.quick(entity, value);
			} else if (v.field === 'path') {
				return SET_ENTITY_PATH.quick(entity, value);
			}
			throw new Error(`invalid field ${v.field} for entity ${entity}`);
		},
	},
	action_op_equals: {
		captures: ['lhs', 'operator', 'rhs'],
		handle: (v, debug): AnyNode => {
			const op = coerceToString(debug, v.operator, 'op');

			// LHS is a string, meaning we're doing a thing to an integer variable
			if (typeof v.lhs === 'string') {
				// varName += 1
				if (typeof v.rhs === 'number') {
					return MUTATE_VARIABLE.change(debug, v.lhs, v.rhs, op);
				}
				// varName += var2
				if (typeof v.rhs === 'string') {
					return MUTATE_VARIABLES.change(v.lhs, v.rhs, op);
				}
				// varName += player x
				if (v.rhs instanceof EntityIntField) {
					const temp = quickTemporary();
					const steps = [
						COPY_VARIABLE.intoVariable(v.rhs.entity, v.rhs.field, temp),
						MUTATE_VARIABLES.change(v.lhs, temp, op),
					];
					return MathlangSequence.quick(
						debug,
						steps,
						'action_op_equals (LHS: string, RHS: IntGetable)',
					);
				}
				// varName += (var2 * 7)
				if (v.rhs instanceof IntBinaryExpression) {
					const temporary = newTemporary();
					if (!(v.rhs instanceof IntBinaryExpression)) {
						throw new Error('not IntBinaryExpression');
					}
					const steps = v.rhs.toSteps(temporary);
					dropTemporary();
					steps.push(MUTATE_VARIABLES.change(v.lhs, temporary, op));
					return MathlangSequence.quick(
						debug,
						steps,
						'action_op_equals (LHS: string, RHS: IntBinaryExpression)',
					);
				}
				throw new Error('unknown op equals type');
			}

			// LHS is an int getable, like `player y`
			// Can only copy variables into them; cannot do math to them in place.
			// First put the value into a temporary, then do the math to that, then set it back.
			if (v.lhs instanceof EntityIntField) {
				// player x = 1;
				if (typeof v.rhs === 'number') {
					const temporary = newTemporary();
					const steps = [
						COPY_VARIABLE.intoVariable(v.lhs.entity, v.lhs.field, temporary),
						MUTATE_VARIABLE.change(debug, temporary, v.rhs, op),
						COPY_VARIABLE.intoField(temporary, v.lhs.entity, v.lhs.field),
					];
					dropTemporary();
					return MathlangSequence.quick(debug, steps, 'action_op_equals (RHS: number)');
				}
				// player x = varName;
				if (typeof v.rhs === 'string') {
					const temporary = newTemporary();
					const steps = [
						COPY_VARIABLE.intoVariable(v.lhs.entity, v.lhs.field, temporary),
						MUTATE_VARIABLES.change(temporary, v.rhs, op),
						COPY_VARIABLE.intoField(temporary, v.lhs.entity, v.lhs.field),
					];
					dropTemporary();
					return MathlangSequence.quick(debug, steps, 'action_op_equals (RHS: string)');
				}
				// player x = (varName * 7);
				if (v.rhs instanceof IntBinaryExpression) {
					const temporary1 = newTemporary();
					const temporary2 = newTemporary();
					const steps = [
						COPY_VARIABLE.intoVariable(v.lhs.entity, v.lhs.field, temporary1),
						...v.rhs.toSteps(temporary1),
						MUTATE_VARIABLES.change(temporary1, temporary2, op),
						COPY_VARIABLE.intoField(temporary1, v.lhs.entity, v.lhs.field),
					];
					dropTemporary();
					dropTemporary();
					return MathlangSequence.quick(
						debug,
						steps,
						'action_op_equals (RHS: IntBinaryExpression)',
					);
				}
				// player x = self y;
				if (v.rhs instanceof EntityIntField) {
					const temporary1 = newTemporary();
					const temporary2 = newTemporary();
					const steps = [
						COPY_VARIABLE.intoVariable(v.lhs.entity, v.lhs.field, temporary1),
						COPY_VARIABLE.intoVariable(v.rhs.entity, v.rhs.field, temporary2),
						MUTATE_VARIABLES.change(temporary1, temporary2, op),
						COPY_VARIABLE.intoField(temporary1, v.lhs.entity, v.lhs.field),
					];
					dropTemporary();
					dropTemporary();
					return MathlangSequence.quick(
						debug,
						steps,
						'action_op_equals (RHS: IntGetable)',
					);
				}
			}
			throw new Error('unknown op equals type');
		},
	},
	action_plus_minus_equals_ables: {
		captures: ['entity', 'operator', 'value'],
		handle: (v, debug) => {
			const entity = coerceToString(debug, v.entity, 'entity');
			const op = coerceToString(debug, v.operator, 'operator');
			if (op !== '-=' && op !== '+=') {
				throw new Error('invalid op: ' + op);
			}
			const value = coerceToNumber(debug, v.value, 'value');
			const sign = op === '-=' ? -1 : 1;
			return SET_ENTITY_DIRECTION_RELATIVE.quick(entity, sign * value);
		},
	},
};

export const lambdaOrScriptIdentifier = (parsedScript: unknown, label: string) => {
	const steps: AnyNode[] = [];
	let script = '';
	if (typeof parsedScript === 'string') {
		// try as identifier
		script = parsedScript;
	} else if (parsedScript instanceof ScriptDefinition) {
		steps.push(parsedScript);
		script = parsedScript.scriptName;
	} else {
		throw new Error(`invalid script in ${label}`);
	}
	return { script, steps };
};

export const extractLambdas = (steps: AnyNode[]): { scripts: AnyNode[]; other: AnyNode[] } => {
	// todo: I don't know about this
	return {
		scripts: steps.filter((v) => v instanceof ScriptDefinition),
		other: steps.filter((v) => !(v instanceof ScriptDefinition)),
	};
};
