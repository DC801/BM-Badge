import { Node as TreeSitterNode } from 'web-tree-sitter';
import {
	coerceToNumber,
	coerceToString,
	handleCapture,
	handleChildrenForFieldName,
	mandatoryChildForFieldName,
	optionalStringCaptureForFieldName,
	type Capture,
} from './parser-capture.ts';
import {
	type ActionSetPosition,
	type ActionSetDirection,
	type ActionSetScript,
	type ActionMoveOverTime,
	type ActionSetEntityString,
	type ActionSetEntityInt,
	type ActionSetBool,
	BoolGetableAction,
	MUTATE_VARIABLE,
	MUTATE_VARIABLES,
	RUN_SCRIPT,
	NON_BLOCKING_DELAY,
	BLOCKING_DELAY,
	COPY_VARIABLE,
	SET_ENTITY_DIRECTION_RELATIVE,
	UNREGISTER_SERIAL_DIALOG_COMMAND,
	UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT,
	SET_ENTITY_X,
	SET_ENTITY_Y,
	SET_ENTITY_NAME,
	SET_ENTITY_TYPE,
	SET_ENTITY_INTERACT_SCRIPT,
	SET_ENTITY_TICK_SCRIPT,
	SET_ENTITY_PRIMARY_ID,
	SET_ENTITY_SECONDARY_ID,
	SET_ENTITY_CURRENT_FRAME,
	SET_ENTITY_CURRENT_ANIMATION,
	SET_ENTITY_PRIMARY_ID_TYPE,
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
	SET_ENTITY_MOVEMENT_RELATIVE,
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
	SerialDialog,
	Dialog,
	GotoLabel,
	MathlangLocation,
	BoolLiteral,
	BoolComparison,
	CheckSaveFlag,
	EntityIntField,
} from './parser-types.ts';
import {
	autoIdentifierName,
	newTemporary,
	dropTemporary,
	quickTemporary,
	simpleBranchMaker,
} from './parser-utilities.ts';
import { FileState } from './parser-file.ts';

// ------------------------ BOOL EXPRESSIONS ------------------------ //

const actionSetBoolMaker = (
	f: FileState,
	node: TreeSitterNode,
	_lhsSetAction: ActionSetBool,
	_rhsBoolExp: BoolExpression,
): MathlangSequence | ActionSetBool => {
	const debug = new MathlangLocation(f, node);
	if (typeof _lhsSetAction === 'string' && typeof _rhsBoolExp === 'string') {
		// not sure if this case will ever happen on its own due to the ambiguity dance
		// (and the typing we've got set up) but it's here if we need it
		return SET_SAVE_FLAG.toFlag(f, node, _lhsSetAction, _rhsBoolExp);
	}
	const lhsSetAction =
		typeof _lhsSetAction === 'string'
			? SET_SAVE_FLAG.toValue(_lhsSetAction, true)
			: _lhsSetAction;

	// player glitched = true;
	if (_rhsBoolExp instanceof BoolLiteral) {
		lhsSetAction.updateProp(_rhsBoolExp.value);
		// lhsSetAction[lhsBoolField] = _rhsBoolExp;
		return lhsSetAction;
	}

	// player glitched = self glitched;
	// ->
	// if (self glitched) { player glitched = true; } else { player glitched = false; }
	const rhsBoolExp: BoolExpression =
		typeof _rhsBoolExp === 'string'
			? CheckSaveFlag.quick(debug, _rhsBoolExp, true)
			: _rhsBoolExp;
	const cloneIfFalse = lhsSetAction.clone();
	cloneIfFalse.invert();
	if (rhsBoolExp instanceof BoolGetableAction || rhsBoolExp instanceof BoolComparison) {
		return simpleBranchMaker(f, node, rhsBoolExp, [lhsSetAction], [cloneIfFalse]);
	}

	return simpleBranchMaker(
		f,
		rhsBoolExp.debug?.node || node,
		rhsBoolExp,
		[lhsSetAction],
		[cloneIfFalse],
	);
};

// ------------------------ COMMON ACTION HANDLING ------------------------ //

export type GenericObj = Record<string, unknown>;
// Takes an object with simple values and an object with array values and "spreads" them --
// e.g. { a: b }, { c: [d,e] } -> [ {a:b, c:d}, {a:b, c:e} ]
const spreadValues = (
	f: FileState,
	commonFields: GenericObj,
	fieldsToSpread: Record<string, FieldToSpread>,
): GenericObj[] => {
	// ->[]
	// count spreads
	let spreadSize = -Infinity;
	Object.values(fieldsToSpread).forEach((spreadField) => {
		const len = spreadField.captures.length;
		// spreadSize won't be 1 btw, because 1s go to commonFields
		if (spreadSize === -Infinity) spreadSize = len;
		if (spreadSize !== len) {
			f.quickError(
				spreadField.node,
				`spreads must have the same count of items within a given action`,
			);
			spreadSize = Math.max(spreadSize, len);
		}
	});
	// if it's a single thing, pass it back whole
	if (spreadSize === -Infinity) {
		return [commonFields];
	}
	// but spread action into multiple variants
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
	return ret;
};

type FieldToSpread = {
	node: TreeSitterNode;
	captures: Capture[];
};
export const handleAction = (f: FileState, node: TreeSitterNode): AnyNode[] => {
	const data = actionData[node.grammarType];
	if (!data) {
		const customFn = actionFns[node.grammarType];
		if (!customFn)
			throw new Error(
				`no action data nor handler function found for action ${node.grammarType}`,
			);
		return customFn(f, node);
	}
	const action = {
		debug: new MathlangLocation(f, node),
		...data.values,
	};
	// Action params
	const captures: string[] = data.captures || [];
	const fieldsToSpread: Record<string, FieldToSpread> = {};
	captures.forEach((fieldName) => {
		const captureNode = node.childForFieldName(fieldName);
		if (captureNode === null) {
			if (!data.optionalCaptures || !data.optionalCaptures.includes(fieldName)) {
				throw new Error(
					`capture found for field not associated with action ${node.grammarType} (${fieldName})`,
				);
			}
			return;
		}
		const capture = handleCapture(f, captureNode);
		if (!Array.isArray(capture)) {
			action[fieldName] = capture;
		} else {
			fieldsToSpread[fieldName] = {
				node: captureNode,
				captures: capture,
			};
		}
	});
	const spreads: GenericObj[] = spreadValues(f, action, fieldsToSpread);
	// Different param combinations will result in different actions,
	// so let the handler sort them out after the spreads are spread
	const handleFn = data.handle;
	if (!handleFn) throw new Error('need action handling function?');
	const ret = spreads.map((v, i) => {
		return handleFn(v, f, node, i);
	});
	return ret.filter((v) => v !== undefined);
};

type ShowDialogOutput = (SHOW_DIALOG | DialogDefinition)[];
type ShowSerialDialogOutput = (SHOW_SERIAL_DIALOG | SerialDialogDefinition)[];

// Put things here if you don't care about auto-spreading them; otherwise they should go in actionData
type ActionFn = (f: FileState, node: TreeSitterNode, isConcat?: boolean) => AnyNode[];
const actionFns: Record<string, ActionFn> = {
	action_show_dialog: (f: FileState, node: TreeSitterNode): ShowDialogOutput => {
		const tryName = optionalStringCaptureForFieldName(f, node, 'dialog_name');
		const dialogName = tryName !== null ? tryName : autoIdentifierName(f, node);
		const dialogs = handleChildrenForFieldName(f, node, 'dialog');
		const action = SHOW_DIALOG.quick(dialogName);
		if (dialogs.length) {
			if (!dialogs.every((v) => v instanceof Dialog)) {
				throw new Error('parsed dialogs not all of type Dialog');
			}
			const debug = new MathlangLocation(f, node);
			const dialogDefinition = DialogDefinition.quick(debug, dialogName, dialogs);
			return [dialogDefinition, action];
		}
		return [action];
	},
	action_concat_serial_dialog: (f: FileState, node: TreeSitterNode): ShowSerialDialogOutput => {
		return actionShowSerialDialog(f, node, true);
	},
	action_show_serial_dialog: (f: FileState, node: TreeSitterNode): ShowSerialDialogOutput => {
		return actionShowSerialDialog(f, node, false);
	},
};

// This is the only way the return type is preserved? Otherwise it gets genericized to AnyNode[]? That can't be right....
const actionShowSerialDialog = (
	f: FileState,
	node: TreeSitterNode,
	disable_newline: boolean = false,
): ShowSerialDialogOutput => {
	const tryName = optionalStringCaptureForFieldName(f, node, 'serial_dialog_name');
	const name = tryName !== null ? tryName : autoIdentifierName(f, node);
	const serialDialogs = handleChildrenForFieldName(f, node, 'serial_dialog');
	const action = SHOW_SERIAL_DIALOG.quick(name, disable_newline);
	if (serialDialogs.length) {
		if (!(serialDialogs[0] instanceof SerialDialog)) {
			throw new Error('parsed serial dialogs not all of type SerialDialog');
		}
		const debug = new MathlangLocation(f, node);
		const serialDialoDefinition = SerialDialogDefinition.quick(debug, name, serialDialogs[0]);
		return [serialDialoDefinition, action];
	}
	return [action];
};

type actionDataEntry = {
	values?: Record<string, unknown>;
	captures?: string[];
	optionalCaptures?: string[];
	handle?: (v: GenericObj, f: FileState, node: TreeSitterNode, i?: number) => AnyNode | undefined;
};
const actionData: Record<string, actionDataEntry> = {
	action_return_statement: {
		// TODO: everything after is unreachable
		// Ditto some other actions, too
		handle: (v, f, node) => new ReturnStatement(new MathlangLocation(f, node)),
	},
	action_continue_statement: {
		handle: (v, f, node) => new ContinueStatement(new MathlangLocation(f, node)),
	},
	action_break_statement: {
		handle: (v, f, node) => new BreakStatement(new MathlangLocation(f, node)),
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
		handle: (v, f, node) => new GotoLabel(new MathlangLocation(f, node), v),
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
	action_set_alias: {
		captures: ['alias', 'command'],
		handle: (v) => new REGISTER_SERIAL_DIALOG_COMMAND_ALIAS(v),
	},
	action_set_command: {
		values: { is_fail: false },
		captures: ['command', 'script'],
		handle: (v) => new REGISTER_SERIAL_DIALOG_COMMAND(v),
	},
	action_set_command_fail: {
		values: { is_fail: true },
		captures: ['command', 'script'],
		handle: (v) => new REGISTER_SERIAL_DIALOG_COMMAND(v),
	},
	action_set_command_arg: {
		values: { is_fail: true },
		captures: ['command', 'argument', 'script'],
		handle: (v) => new REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT(v),
	},
	action_set_ambiguous: {
		// if the LHS is ambiguous (a variable name)
		values: {},
		captures: ['lhs', 'rhs'],
		handle: (v, f, node, i): AnyNode => {
			const lhs = coerceToString(f, node, v.lhs, 'action_set_ambiguous lhs');

			// simple cases first (easy to check for)

			// varName = false;
			if (v.rhs instanceof BoolLiteral) {
				return SET_SAVE_FLAG.toValue(lhs, v.rhs.value);
			}

			// varName = 255;
			if (typeof v.rhs === 'number') return MUTATE_VARIABLE.set(lhs, v.rhs);

			// AMBIGUITY DANCE PARTY
			// varName = varName;
			if (typeof v.rhs == 'string') {
				if (i === undefined) throw new Error('undefined index');
				// For expansions, we only want to print one ambiguous identifier at a time in an error/warning message.
				// `i` is from the caller, who knows which one of the set we're looking at now.
				// Basically, the whole spread might not be ambiguous, so we need to report
				// only once the action is identified in an individual spread, not all the time.
				const lhsSquiggliesNode =
					node.childForFieldName('lhs')?.namedChildren?.[i] ||
					node.childForFieldName('lhs');
				const rhsSquiggliesNode =
					node.childForFieldName('rhs')?.namedChildren?.[i] ||
					node.childForFieldName('rhs');
				if (!lhsSquiggliesNode || !rhsSquiggliesNode) {
					throw new Error(`couldn't find nodes to squiggle`);
				}
				const printNodes = [lhsSquiggliesNode, rhsSquiggliesNode];
				const suggestion = v.rhs.includes(' ') ? '"' + v.rhs + '"' : v.rhs;
				f.p.newWarning({
					locations: printNodes.map((v) => ({ node: v, fileName: f.fileName })),
					message: 'these identifiers could be ints or bools',
					footer:
						`Both identifiers will be interpreted as ints unless you coerce the right-hand side to a bool expression, like this:` +
						`\n    !!${suggestion}` +
						`\nTo silence this warning, turn the RHS into a passthrough int expression (which will produce the same output), e.g.:` +
						`\n    ${suggestion} + 0` +
						`\n    ${suggestion} * 1`,
				});
				const debug = new MathlangLocation(f, node);
				return MUTATE_VARIABLES.set(debug, lhs, v.rhs);
			}

			// varName = player x;
			if (v.rhs instanceof EntityIntField) {
				return COPY_VARIABLE.intoVariable(v.rhs.entity, v.rhs.field, lhs);
			}

			// varName = (255 + player x);
			if (v.rhs instanceof IntBinaryExpression) {
				const temporary = newTemporary(lhs);
				const steps = v.rhs.flatten([]);
				dropTemporary();
				steps.push(MUTATE_VARIABLES.set(v.rhs.debug, lhs, temporary));
				const debug = new MathlangLocation(f, node);
				return new MathlangSequence(debug, {
					steps,
					type: 'parser-actions: action_set_ambiguous',
				});
			}

			// varName = (debug_mode || player glitched);
			if (v.rhs instanceof BoolExpression) {
				return actionSetBoolMaker(f, node, SET_SAVE_FLAG.toValue(lhs, true), v.rhs);
			}

			throw new Error('failed to parse');
		},
	},
	action_set_int: {
		// If we've matched this, we know the LHS is not a variable name.
		// Only option is an entity field.
		values: {},
		captures: ['lhs', 'rhs'],
		handle: (v, f, node): ActionSetEntityInt | MathlangSequence | COPY_VARIABLE => {
			const debug = new MathlangLocation(f, node);
			if (!(v.lhs instanceof EntityIntField)) {
				throw new Error('LHS not EntityIntField');
			}
			const entity = coerceToString(f, node, v.lhs.entity, 'action_set_int entity');

			// player x = 0;
			if (typeof v.rhs === 'number') {
				if (v.lhs.field === 'x') {
					return SET_ENTITY_X.quick(entity, v.rhs);
				}
				if (v.lhs.field === 'y') {
					return SET_ENTITY_Y.quick(entity, v.rhs);
				}
				if (v.lhs.field === 'primary_id') {
					return SET_ENTITY_PRIMARY_ID.quick(entity, v.rhs);
				}
				if (v.lhs.field === 'secondary_id') {
					return SET_ENTITY_SECONDARY_ID.quick(entity, v.rhs);
				}
				if (v.lhs.field === 'primary_id_type') {
					return SET_ENTITY_PRIMARY_ID_TYPE.quick(entity, v.rhs);
				}
				if (v.lhs.field === 'current_animation') {
					return SET_ENTITY_CURRENT_ANIMATION.quick(entity, v.rhs);
				}
				if (v.lhs.field === 'animation_frame') {
					return SET_ENTITY_CURRENT_FRAME.quick(entity, v.rhs);
				}
				if (v.lhs.field === 'strafe') {
					return SET_ENTITY_MOVEMENT_RELATIVE.quick(entity, v.rhs);
				}
				if (v.lhs.field === 'relative_direction') {
					return SET_ENTITY_DIRECTION_RELATIVE.quick(entity, v.rhs);
				}
				throw new Error('unidentified int_getable, field: ' + v.lhs.field);
			}

			// player x = varName;
			if (typeof v.rhs === 'string') {
				return COPY_VARIABLE.intoField(v.rhs, v.lhs.entity, v.lhs.field);
			}

			// player x = player y;
			if (v.rhs instanceof IntBinaryExpression) {
				const temporary = newTemporary();
				const steps = v.rhs.flatten([]);
				dropTemporary();
				steps.push(COPY_VARIABLE.intoField(temporary, v.lhs.entity, v.lhs.field));
				return new MathlangSequence(debug, {
					steps,
					type: 'parser-actions: action_set_int',
				});
			}

			throw new Error('unknown RHS type');
		},
	},
	action_set_bool: {
		// If we've matched this, we know the LHS is not a variable name.
		values: {},
		captures: ['lhs', 'rhs'],
		handle: (v, f, node): MathlangSequence | ActionSetBool => {
			const debug = new MathlangLocation(f, node);
			if (!(v.lhs instanceof BoolSetable)) {
				throw new Error('LHS not a bool_setable');
			}
			if (typeof v.rhs === 'boolean') v.rhs = BoolLiteral.quick(debug, v.rhs);
			if (typeof v.rhs === 'string') v.rhs = CheckSaveFlag.quick(debug, v.rhs);
			if (!(v.rhs instanceof BoolExpression)) {
				throw new Error('RHS not a bool_expression');
			}
			if (v.lhs.type === 'entity') {
				const entity = coerceToString(
					f,
					node,
					v.lhs.value,
					'SET_ENTITY_GLITCHED field entity',
				);
				const lhs: ActionSetBool = SET_ENTITY_GLITCHED.quick(entity, true);
				return actionSetBoolMaker(f, node, lhs, v.rhs);
			}
			if (v.lhs.type === 'light') {
				const lights = coerceToString(
					f,
					node,
					v.lhs.value,
					'SET_LIGHTS_STATE field lights',
				);
				const lhs = SET_LIGHTS_STATE.quick(lights, true);
				return actionSetBoolMaker(f, node, lhs, v.rhs);
			}
			if (v.lhs.type === 'player_control') {
				const lhs = SET_PLAYER_CONTROL.quick(true);
				return actionSetBoolMaker(f, node, lhs, v.rhs);
			}
			if (v.lhs.type === 'lights_control') {
				const lhs = SET_LIGHTS_CONTROL.quick(true);
				return actionSetBoolMaker(f, node, lhs, v.rhs);
			}
			if (v.lhs.type === 'hex_editor') {
				const lhs = SET_HEX_EDITOR_STATE.quick(true);
				return actionSetBoolMaker(f, node, lhs, v.rhs);
			}
			if (v.lhs.type === 'hex_dialog_mode') {
				const lhs = SET_HEX_EDITOR_DIALOG_MODE.quick(true);
				return actionSetBoolMaker(f, node, lhs, v.rhs);
			}
			if (v.lhs.type === 'hex_control') {
				const lhs = SET_HEX_EDITOR_CONTROL.quick(true);
				return actionSetBoolMaker(f, node, lhs, v.rhs);
			}
			if (v.lhs.type === 'hex_clipboard') {
				const lhs = SET_HEX_EDITOR_CONTROL_CLIPBOARD.quick(true);
				return actionSetBoolMaker(f, node, lhs, v.rhs);
			}
			if (v.lhs.type === 'serial_control') {
				const lhs = SET_SERIAL_DIALOG_CONTROL.quick(true);
				return actionSetBoolMaker(f, node, lhs, v.rhs);
			}
			throw new Error('unknown LHS type');
		},
	},
	action_set_position: {
		values: {},
		captures: ['movable', 'coordinate'],
		handle: (v, f, node): ActionSetPosition | MathlangSequence => {
			const debug = new MathlangLocation(f, node);
			if (!(v.movable instanceof MovableIdentifier)) {
				throw new Error('invalid MovableIdentifier');
			}
			if (!(v.coordinate instanceof CoordinateIdentifier)) {
				throw new Error('invalid CoordinateIdentifier');
			}
			if (v.movable.type === 'camera') {
				if (v.coordinate.type === 'geometry' && v.coordinate.polygonType !== 'length') {
					return TELEPORT_CAMERA_TO_GEOMETRY.quick(v.coordinate.value);
				}
				if (v.coordinate.type === 'entity') {
					return SET_CAMERA_TO_FOLLOW_ENTITY.quick(v.coordinate.value);
				}
			} else if (v.movable.type === 'entity') {
				if (v.coordinate.type === 'geometry' && v.coordinate.polygonType !== 'length') {
					return TELEPORT_ENTITY_TO_GEOMETRY.quick(v.movable.value, v.coordinate.value);
				}
				if (v.coordinate.type === 'entity') {
					const variable = quickTemporary();
					const copyFrom = v.coordinate.value;
					const copyTo = v.movable.value;
					const steps = [
						COPY_VARIABLE.intoField(variable, copyFrom, 'x'),
						COPY_VARIABLE.intoVariable(copyTo, 'x', variable),
						COPY_VARIABLE.intoField(variable, copyFrom, 'y'),
						COPY_VARIABLE.intoVariable(copyTo, 'y', variable),
					];
					return new MathlangSequence(debug, {
						steps,
						type: 'parser-actions: action_set_position',
					});
				}
			}
			throw new Error('invalid everything');
		},
	},
	action_move_over_time: {
		values: {},
		captures: ['movable', 'coordinate', 'duration', 'forever'],
		optionalCaptures: ['forever'],
		handle: (v, f, node): ActionMoveOverTime | undefined => {
			if (!(v.movable instanceof MovableIdentifier)) {
				throw new Error('invalid MovableIdentifier');
			}
			if (!(v.coordinate instanceof CoordinateIdentifier)) {
				throw new Error('invalid CoordinateIdentifier');
			}
			if (!(v.debug instanceof MathlangLocation)) {
				throw new Error('invalid debug node');
			}
			const duration = coerceToNumber(f, node, v.duration, 'duration');
			if (v.movable.type === 'camera') {
				// Moving the camera
				if (v.coordinate.type === 'entity') {
					// ... to an entity
					if (v.forever) {
						// ... forever (ILLEGAL)
						f.quickError(
							v.debug.node,
							`cannot move camera to an entity's position forever`,
						);
						return;
					} else {
						// ... not forever
						return PAN_CAMERA_TO_ENTITY.quick(v.coordinate.value, duration);
					}
				}
				if (v.coordinate.type === 'geometry') {
					// ... to a geometry
					if (v.coordinate.polygonType === 'length') {
						// ... length
						if (v.forever) {
							// ... forever
							return LOOP_CAMERA_ALONG_GEOMETRY.quick(v.coordinate.value, duration);
						} else {
							// ... not forever
							return PAN_CAMERA_ALONG_GEOMETRY.quick(v.coordinate.value, duration);
						}
					} else if (v.coordinate.polygonType === 'origin') {
						// ... origin (single point)
						if (v.forever) {
							// ... forever (ILLEGAL)
							f.quickError(
								v.debug.node,
								`'forever' can only be used with geometry lengths, not single points`,
							);
							return;
						} else {
							// ... not forever
							return PAN_CAMERA_TO_GEOMETRY.quick(v.coordinate.value, duration);
						}
					}
				}
			}

			if (v.movable.type === 'entity') {
				// Moving an entity
				if (v.coordinate.type === 'entity') {
					// ... to another entity (ILLEGAL)
					f.quickError(
						v.debug.node,
						`cannot move an entity to another entity's position over time`,
					);
					return;
				}
				if (v.coordinate.type === 'geometry') {
					// ... to a geometry
					if (v.coordinate.polygonType === 'length') {
						// ... length
						if (v.forever) {
							// ... forever
							return LOOP_ENTITY_ALONG_GEOMETRY.quick(
								v.movable.value,
								v.coordinate.value,
								duration,
							);
						} else {
							// ... not forever
							return WALK_ENTITY_ALONG_GEOMETRY.quick(
								v.movable.value,
								v.coordinate.value,
								duration,
							);
						}
					}
					if (v.coordinate.polygonType === 'origin') {
						// ... origin (single point)
						if (v.forever) {
							// ... forever (ILLEGAL)
							f.quickError(
								v.debug.node,
								`'forever' can only be used with geometry lengths, not single points`,
							);
							return;
						} else {
							// ... not forever
							return WALK_ENTITY_TO_GEOMETRY.quick(
								v.movable.value,
								v.coordinate.value,
								duration,
							);
						}
					}
				}
			}
		},
	},
	action_set_direction: {
		values: {},
		captures: ['entity', 'target'],
		handle: (v, f, node): ActionSetDirection => {
			const entity = coerceToString(f, node, v.entity, 'entity');
			if (!(v.target instanceof DirectionTarget)) {
				throw new Error('action_set_direction target not a DirectionTarget');
			}
			if (v.target.type === 'nsew') {
				return SET_ENTITY_DIRECTION.quick(entity, v.target.value);
			}
			if (v.target.type === 'geometry') {
				return SET_ENTITY_DIRECTION_TARGET_GEOMETRY.quick(entity, v.target.value);
			}
			if (v.target.type === 'entity') {
				return SET_ENTITY_DIRECTION_TARGET_ENTITY.quick(entity, v.target.value);
			}
			throw new Error('invalid type of DirectionTarget');
		},
	},
	action_set_script: {
		values: {},
		captures: ['entity', 'script_slot', 'script'],
		handle: (v, f, node): ActionSetScript | undefined => {
			const entity = coerceToString(f, node, v.entity, 'entity');
			const script_slot = coerceToString(f, node, v.script_slot, 'script_slot');
			const script = coerceToString(f, node, v.script, 'script');
			if (entity === '%MAP%') {
				if (script_slot === 'on_tick') {
					return SET_MAP_TICK_SCRIPT.quick(script);
				} else if (script_slot === 'on_tick') {
					return SET_MAP_LOOK_SCRIPT.quick(script);
				}
				const errorNode = mandatoryChildForFieldName(f, node, 'script_slot');
				f.quickError(
					errorNode,
					`invalid map script slot`,
					`You can only set a map's 'on_tick' or 'on_look' slot`,
				);
				return;
			}
			// not a map; must be an entity
			if (v.script_slot === 'on_tick') {
				return SET_ENTITY_TICK_SCRIPT.quick(entity, script);
			}
			if (v.script_slot === 'on_interact') {
				return SET_ENTITY_INTERACT_SCRIPT.quick(entity, script);
			}
			if (v.script_slot === 'on_look') {
				return SET_ENTITY_LOOK_SCRIPT.quick(entity, script);
			}
			const errorNode = mandatoryChildForFieldName(f, node, 'script_slot');
			f.quickError(
				errorNode,
				`invalid entity script slot`,
				`Valid entity script slots: 'on_tick', 'on_interact', 'on_look'`,
			);
		},
	},
	action_set_entity_string: {
		values: {},
		captures: ['entity', 'field', 'value'],
		handle: (v, f, node): ActionSetEntityString => {
			const entity = coerceToString(f, node, v.entity, 'entity');
			const value = coerceToString(f, node, v.value, 'value');
			if (v.field === 'name') {
				return SET_ENTITY_NAME.quick(entity, value);
			} else if (v.field === 'type') {
				return SET_ENTITY_TYPE.quick(entity, value);
			} else if (v.field === 'path') {
				return SET_ENTITY_PATH.quick(entity, value);
			}
			throw new Error('invalid field?');
		},
	},
	action_op_equals: {
		values: {},
		captures: ['lhs', 'operator', 'rhs'],
		handle: (v, f, node): AnyNode => {
			const debug = new MathlangLocation(f, node);
			const op = coerceToString(f, node, v.operator, 'op');

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
					return new MathlangSequence(debug, {
						steps,
						type: 'parser-actions: action_op_equals (LHS: string, RHS: IntGetable)',
					});
				}
				// varName += (var2 * 7)
				if (v.rhs instanceof IntBinaryExpression) {
					const temporary = newTemporary();
					if (!(v.rhs instanceof IntBinaryExpression)) {
						throw new Error('not IntBinaryExpression');
					}
					const steps = v.rhs.flatten([]);
					dropTemporary();
					steps.push(MUTATE_VARIABLES.change(v.lhs, temporary, op));
					return new MathlangSequence(debug, {
						steps,
						type: 'action_op_equals (LHS: string, RHS: IntBinaryExpression)',
					});
				}
				throw new Error('unknown op equals type');
			}

			// LHS is an int getable, like `player y`
			// Can only set these to set values; cannot do math to them.
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
					return new MathlangSequence(debug, {
						steps,
						type: 'parser-actions: action_op_equals (LHS: IntGetable, RHS: number)',
					});
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
					return new MathlangSequence(debug, {
						steps,
						type: 'parser-actions: action_op_equals (LHS: IntGetable, RHS: string)',
					});
				}
				// player x = (varName * 7);
				if (v.rhs instanceof IntBinaryExpression) {
					const temporary1 = newTemporary();
					const temporary2 = newTemporary();
					if (!(v.rhs instanceof IntBinaryExpression)) {
						throw new Error('not IntBinaryExpression');
					}
					const steps = [
						COPY_VARIABLE.intoVariable(v.lhs.entity, v.lhs.field, temporary1),
						...v.rhs.flatten([]),
						MUTATE_VARIABLES.change(temporary1, temporary2, op),
						COPY_VARIABLE.intoField(temporary1, v.lhs.entity, v.lhs.field),
					];
					dropTemporary();
					dropTemporary();
					return new MathlangSequence(debug, {
						steps,
						type: 'parser-actions: action_op_equals (LHS: IntGetable, RHS: IntBinaryExpression)',
					});
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
					return new MathlangSequence(debug, {
						steps,
						type: 'parser-actions: action_op_equals (LHS: IntGetable, RHS: IntGetable)',
					});
				}
			}
			throw new Error('unknown op equals type');
		},
	},
	action_plus_minus_equals_ables: {
		values: {},
		captures: ['entity', 'operator', 'value'],
		handle: (v, f, node) => {
			const entity = coerceToString(f, node, v.entity, 'entity');
			const op = coerceToString(f, node, v.operator, 'operator');
			if (op !== '-=' && op !== '+=') {
				throw new Error('invalid op: ' + op);
			}
			const value = coerceToNumber(f, node, v.value, 'value');
			const sign = op === '-=' ? -1 : 1;
			return SET_ENTITY_DIRECTION_RELATIVE.quick(entity, sign * value);
		},
	},
};
