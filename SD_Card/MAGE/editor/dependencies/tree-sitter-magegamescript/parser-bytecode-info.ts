import { Node as TreeSitterNode } from 'web-tree-sitter';
import {
	AnyNode,
	GotoLabel,
	CommentNode,
	MathlangLocation,
	CheckSaveFlag,
	LabelDefinition,
	CopyMacro,
	MathlangSequence,
	MathlangMessage,
} from './parser-types.ts';
import { type GenericObj } from './parser-actions.ts';
import { inverseOpMap, realignTemp, simpleBranchMaker } from './parser-utilities.ts';
import { coerceToBool, coerceToNumber, coerceToString } from './parser-capture.ts';

const opIntoStringMap: Record<string, string> = {
	'=': 'SET',
	'+': 'ADD',
	'-': 'SUB',
	'*': 'MUL',
	'/': 'DIV',
	'%': 'MOD',
	'?': 'RNG',
};
const stringIntoOpMap: Record<string, string> = {
	ADD: '+',
	SUB: '-',
	MUL: '*',
	DIV: '/',
	MOD: '%',
	RNG: '?',
	SET: '',
};

export class Action extends AnyNode {
	action: string;
	constructor(args: unknown) {
		super();
		this.action = 'CHILDREN SHOULD IDENTIFY THE ACTION';
	}
	clone() {
		const fn = actionConstructorLookup[this.action];
		if (!fn) throw new Error('no action constructor for ' + this.action);
		const clone = fn(this as GenericObj);
		// TODO double check this
		if (this.constructor !== clone.constructor) {
			throw new Error ('not a real clone');
		}
		return clone;
	}
	isIdenticalTo(that: Action) {
		// ascertain quickly
		if (this.action !== that.action) return false;
		// check the rest of the params one at a time
		const setOfKeys = new Set([...Object.keys(this), ...Object.keys(that)]);
		// but skip the one we already tried
		setOfKeys.delete('action');
		const keys = [...setOfKeys];
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (this[key as keyof Action] !== that[key as keyof Action]) return false;
		}
		return true;
	}
	print() {
		return `json[${JSON.stringify(this, null, '\t')}];`;
	}
	static fromArgs(args: unknown, debug?: MathlangLocation): Action {
		if (args instanceof CopyMacro) {
			return COPY_SCRIPT.quick(args.script, args.search_and_replace);
		}
		if (typeof args !== 'object' || args === null) {
			if (debug) {
				debug.quickError('invalid action', 'cannot make Action from non-object');
			} else {
				throw new Error('cannot make Action from non-object');
			}
		}
		const actionName = (args as Action).action;
		if (!actionName === undefined || typeof actionName !== 'string') {
			if (debug) {
				debug.quickError('invalid action', 'action missing "action" property');
			} else {
				throw new Error(`Action sans 'action' param (${actionName})`);
			}
		}
		const fn = actionConstructorLookup[actionName];
		if (fn) {
			try {
				const newAction = fn(args as GenericObj, debug);
				return newAction;
			} catch (e) {
				if (debug) {
					const message = e instanceof Error ? e.message : '(none provided)';
					debug.quickError(`invalid action params for ${actionName}`, message);
				} else {
					throw new Error(`invalid action params for "${actionName}"`);
				}
			}
		}
		return new UnknownAction(args);
	}
}

export class UnknownAction extends Action {
	constructor(args: unknown) {
		super(args);
		if (typeof args !== 'object' || args === null) {
			throw new Error('cannot make Action from non-object');
		}
		Object.assign(this, args); // Invisible to TS language server? Interesting....
		if (typeof this.action !== 'string') {
			this.action = 'UNKNOWN_ACTION';
		}
	}
	clone(): UnknownAction {
		const clone = Action.fromArgs(this);
		if (!(clone instanceof UnknownAction)) {
			throw new Error ('clone of UnknownAction not UnknownAction')
		}
		return clone;
	}
}

// ---------------------------------- SUPER TYPES ---------------------------------- \\

export class CheckAction extends Action {
	comment?: string;
	success_script?: string;
	label?: string;
	jump_index?: number | string;
	expected_bool: boolean;
	constructor(args: unknown) {
		super(args);
		this.expected_bool = true;
	}
	getBool() {
		return this.expected_bool;
	}
	getScript() {
		return this.success_script;
	}
	setScript(script: string) {
		this.success_script = script;
	}
	invert() {
		this.expected_bool = !this.expected_bool;
		return this;
	}
	ifLabelAddSuffix(suffix: string) {
		if (typeof this.label === 'string') {
			this.label += suffix;
		}
		return this;
	}
}

export class ActionBoolGetable extends CheckAction {}
export class ActionStringCheckable extends CheckAction {
	// placeholder methods
	updateProp(prop: string) {
		throw new Error('children of StringCheckableAction should updateProp with ' + prop);
	}
}
export class ActionNumberComparison extends CheckAction {
	// placeholder methods
	updateProp(prop: boolean) {
		throw new Error('children of NumberComparisonAction should updateProp with ' + prop);
	}
}
export class ActionNumberCheckableEquality extends CheckAction {
	// placeholder methods
	updateProp(prop: string | number) {
		throw new Error('children of NumberCheckableEqualityAction should updateProp with ' + prop);
	}
}
export class ActionSetBool extends Action {
	// placeholder methods
	getProp() {
		throw new Error('children of ActionSetBool should getProp');
	}
	updateProp(bool: boolean) {
		throw new Error('children of ActionSetBool should updateProp with ' + bool);
	}
	invert() {
		throw new Error('children of ActionSetBool should invert');
	}
}

// Maybe don't convert these over unless you need them

// export type ActionSetEntityString = SET_ENTITY_NAME | SET_ENTITY_TYPE | SET_ENTITY_PATH;

// export type ActionSetEntityInt =
// 	| SET_ENTITY_X
// 	| SET_ENTITY_Y
// 	| SET_ENTITY_PRIMARY_ID
// 	| SET_ENTITY_SECONDARY_ID
// 	| SET_ENTITY_PRIMARY_ID_TYPE
// 	| SET_ENTITY_CURRENT_ANIMATION
// 	| SET_ENTITY_CURRENT_FRAME
// 	| SET_ENTITY_MOVEMENT_RELATIVE
// 	| SET_ENTITY_DIRECTION_RELATIVE;

// export type ActionSetPosition =
// 	| TELEPORT_ENTITY_TO_GEOMETRY
// 	| TELEPORT_CAMERA_TO_GEOMETRY
// 	| SET_CAMERA_TO_FOLLOW_ENTITY;

// export type ActionSetDirection =
// 	| SET_ENTITY_DIRECTION
// 	| SET_ENTITY_DIRECTION_TARGET_GEOMETRY
// 	| SET_ENTITY_DIRECTION_TARGET_ENTITY;

// export type ActionMoveOverTime =
// 	| LOOP_CAMERA_ALONG_GEOMETRY
// 	| PAN_CAMERA_ALONG_GEOMETRY
// 	| PAN_CAMERA_TO_GEOMETRY
// 	| PAN_CAMERA_TO_ENTITY
// 	| LOOP_ENTITY_ALONG_GEOMETRY
// 	| WALK_ENTITY_ALONG_GEOMETRY
// 	| WALK_ENTITY_TO_GEOMETRY;

// ---------------------------------- PRINTING ---------------------------------- \\

// Auto labels are illegal (contain spaces) on purpose to prevent collisions
// But that means we don't get round-trip translations unless we sanitze them thus:
export const sanitizeLabel = (label: string): string =>
	label.includes(' ') ? label.replace(/ /g, '_').replace(/-/g, '_').replace(/#/g, '') : label;

export const printGotoSegment = (data: CheckAction | GotoLabel): string => {
	if (data.label) {
		return `goto label ${sanitizeLabel(data.label)}`;
	}
	if (!(data instanceof CheckAction)) throw new Error('not a CheckAction');
	if (data.jump_index !== undefined) {
		if (typeof data.jump_index === 'string') {
			return `goto label ${sanitizeLabel(data.jump_index)}`;
		}
		return `goto index ${data.jump_index}`;
	}
	if (data.success_script) {
		return `goto script "${data.success_script}"`;
	}
	throw new Error('cannot print goto segment without destination!');
};
export const printCheckAction = (data: CheckAction, lhs: string, smartInvert: boolean): string => {
	const bang = smartInvert && !data.getBool() ? '!' : '';
	const goto = printGotoSegment(data);
	return `if ${bang}${lhs} then ${goto};`;
};
export const printSetBoolAction = (data: ActionSetBool, lhs: string): string => {
	return `${lhs} = ${data.getProp()};`;
};
export const printDuration = (duration: number): string => duration + 'ms';
export const printGeometry = (geometry: string): string => `geometry "${geometry}"`;
export const printEntityIdentifier = (entity: string): string => {
	if (entity === '%PLAYER%') return 'player';
	if (entity === '%SELF%') return 'self';
	if (entity === '%MAP%') return 'map';
	if (entity === '%CAMERA%') return 'camera';
	return `entity "${entity}"`;
};
export const printEntityFieldEquality = (
	v: CheckAction,
	entity: string,
	param: string,
	value: number | string
): string => {
	const lhs = `${printEntityIdentifier(entity)} ${param}`;
	return v.expected_bool
		? printCheckAction(v, `${lhs} == ${value}`, false)
		: printCheckAction(v, `${lhs} != ${value}`, false);
};

// ---------------------------------- ACTUAL BYTECODE JSON ---------------------------------- \\

export class NULL_ACTION extends Action {
	// TODO: Does this actually exist?
	action: 'NULL_ACTION';
	constructor(args: unknown) {
		super(args);
		this.action = 'NULL_ACTION';
	}
	print() {
		return `// NULL_ACTION`;
	}
}
export class LABEL extends Action {
	action: 'LABEL';
	value: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'LABEL';
		this.value = tryString(args.value, 'LABEL param "value"', debug);
	}
	ifLabelAddSuffix(suffix: string) {
		this.value += suffix;
		return this;
	}
	print() {
		return `${sanitizeLabel(this.value)}:`;
	}
}
export class RUN_SCRIPT extends Action {
	action: 'RUN_SCRIPT';
	script: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'RUN_SCRIPT';
		this.script = tryString(args.script, 'RUN_SCRIPT param "script"', debug);
	}
	getScript() {
		return this.script;
	}
	setScript(script: string) {
		this.script = script;
	}
	static quick(script: string) {
		return new RUN_SCRIPT({ script });
	}
	print() {
		return `goto script "${this.script}";`;
	}
}
export class BLOCKING_DELAY extends Action {
	action: 'BLOCKING_DELAY';
	duration: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'BLOCKING_DELAY';
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
	}
	print() {
		return `block ${printDuration(this.duration)};`;
	}
}
export class NON_BLOCKING_DELAY extends Action {
	action: 'NON_BLOCKING_DELAY';
	duration: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'NON_BLOCKING_DELAY';
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
	}
	print() {
		return `wait ${printDuration(this.duration)};`;
	}
}
export class SET_ENTITY_NAME extends Action {
	action: 'SET_ENTITY_NAME';
	entity: string;
	string: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_NAME';
		this.entity = tryString(args.entity, `${this.action} param "duration"`, debug);
		this.string = tryString(args.string, `${this.action} param "duration"`, debug);
	}
	static quick(entity: string, string: string) {
		return new SET_ENTITY_NAME({ entity, string });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} name = "${this.string}";`;
	}
}
export class SET_ENTITY_X extends Action {
	action: 'SET_ENTITY_X';
	entity: string;
	u2_value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_X';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.u2_value = tryNumber(args.u2_value, `${this.action} param "u2_value"`, debug);
	}
	static quick(entity: string, u2_value: number) {
		return new SET_ENTITY_X({ entity, u2_value });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} x = ${this.u2_value};`;
	}
}
export class SET_ENTITY_Y extends Action {
	action: 'SET_ENTITY_Y';
	entity: string;
	u2_value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_Y';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.u2_value = tryNumber(args.u2_value, `${this.action} param "u2_value"`, debug);
	}
	static quick(entity: string, u2_value: number) {
		return new SET_ENTITY_Y({ entity, u2_value });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} y = ${this.u2_value};`;
	}
}
export class ActionSetScript extends Action {
	script: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.script = tryString(args.script, `ActionSetScript param "script"`, debug);
	}
	getScript() {
		return this.script;
	}
	setScript(script: string) {
		this.script = script;
	}
}
export class SET_ENTITY_INTERACT_SCRIPT extends ActionSetScript {
	action: 'SET_ENTITY_INTERACT_SCRIPT';
	entity: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args, debug);
		this.action = 'SET_ENTITY_INTERACT_SCRIPT';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
	}
	static quick(entity: string, script: string) {
		return new SET_ENTITY_INTERACT_SCRIPT({ entity, script });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} on_interact = "${this.script}";`;
	}
}
export class SET_ENTITY_TICK_SCRIPT extends ActionSetScript {
	action: 'SET_ENTITY_TICK_SCRIPT';
	entity: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args, debug);
		this.action = 'SET_ENTITY_TICK_SCRIPT';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
	}
	static quick(entity: string, script: string) {
		return new SET_ENTITY_TICK_SCRIPT({ entity, script });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} on_tick = "${this.script}";`;
	}
}
export class SET_ENTITY_TYPE extends Action {
	action: 'SET_ENTITY_TYPE';
	entity: string;
	entity_type: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_TYPE';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.entity_type = tryString(args.entity_type, `${this.action} param "entity_type"`, debug);
	}
	static quick(entity: string, entity_type: string) {
		return new SET_ENTITY_TYPE({ entity, entity_type });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} type = "${this.entity_type}";`;
	}
}
export class SET_ENTITY_PRIMARY_ID extends Action {
	action: 'SET_ENTITY_PRIMARY_ID';
	entity: string;
	u2_value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_PRIMARY_ID';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.u2_value = tryNumber(args.u2_value, `${this.action} param "u2_value"`, debug);
	}
	static quick(entity: string, u2_value: number) {
		return new SET_ENTITY_PRIMARY_ID({ entity, u2_value });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} primary_id = ${this.u2_value};`;
	}
}
export class SET_ENTITY_SECONDARY_ID extends Action {
	action: 'SET_ENTITY_SECONDARY_ID';
	entity: string;
	u2_value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_SECONDARY_ID';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.u2_value = tryNumber(args.u2_value, `${this.action} param "u2_value"`, debug);
	}
	static quick(entity: string, u2_value: number) {
		return new SET_ENTITY_SECONDARY_ID({ entity, u2_value });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} secondary_id = ${this.u2_value};`;
	}
}
export class SET_ENTITY_PRIMARY_ID_TYPE extends Action {
	action: 'SET_ENTITY_PRIMARY_ID_TYPE';
	entity: string;
	byte_value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_PRIMARY_ID_TYPE';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.byte_value = tryNumber(args.byte_value, `${this.action} param "byte_value"`, debug);
	}
	static quick(entity: string, byte_value: number) {
		return new SET_ENTITY_PRIMARY_ID_TYPE({ entity, byte_value });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} primary_id_type = ${this.byte_value};`;
	}
}
export class SET_ENTITY_CURRENT_ANIMATION extends Action {
	action: 'SET_ENTITY_CURRENT_ANIMATION';
	entity: string;
	byte_value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_CURRENT_ANIMATION';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.byte_value = tryNumber(args.byte_value, `${this.action} param "byte_value"`, debug);
	}
	static quick(entity: string, byte_value: number) {
		return new SET_ENTITY_CURRENT_ANIMATION({ entity, byte_value });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} current_animation = ${this.byte_value};`;
	}
}
export class SET_ENTITY_CURRENT_FRAME extends Action {
	action: 'SET_ENTITY_CURRENT_FRAME';
	entity: string;
	byte_value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_CURRENT_FRAME';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.byte_value = tryNumber(args.byte_value, `${this.action} param "byte_value"`, debug);
	}
	static quick(entity: string, byte_value: number) {
		return new SET_ENTITY_CURRENT_FRAME({ entity, byte_value });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} animation_frame = ${this.byte_value};`;
	}
}
export class SET_ENTITY_DIRECTION_RELATIVE extends Action {
	action: 'SET_ENTITY_DIRECTION_RELATIVE';
	entity: string;
	relative_direction: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_DIRECTION_RELATIVE';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.relative_direction = tryNumber(
			args.relative_direction,
			`${this.action} param "relative_direction"`,
			debug,
		);
	}
	static quick(entity: string, relative_direction: number) {
		return new SET_ENTITY_DIRECTION_RELATIVE({ entity, relative_direction });
	}
	print() {
		if (this.relative_direction < 0) {
			return `${printEntityIdentifier(this.entity)} direction -= ${this.relative_direction};`;
		} else {
			return `${printEntityIdentifier(this.entity)} direction += ${this.relative_direction};`;
		}
	}
}
export class SET_ENTITY_DIRECTION extends Action {
	action: 'SET_ENTITY_DIRECTION';
	entity: string;
	direction: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_DIRECTION';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.direction = tryString(args.direction, `${this.action} param "direction"`, debug);
	}
	static quick(entity: string, direction: string) {
		return new SET_ENTITY_DIRECTION({ entity, direction });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} direction = "${this.direction}";`;
	}
}
export class SET_ENTITY_DIRECTION_TARGET_ENTITY extends Action {
	action: 'SET_ENTITY_DIRECTION_TARGET_ENTITY';
	entity: string;
	target_entity: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_DIRECTION_TARGET_ENTITY';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.target_entity = tryString(
			args.target_entity,
			`${this.action} param "target_entity"`,
			debug,
		);
	}
	static quick(entity: string, target_entity: string) {
		return new SET_ENTITY_DIRECTION_TARGET_ENTITY({ entity, target_entity });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} direction = ${printEntityIdentifier(this.target_entity)};`;
	}
}
export class SET_ENTITY_DIRECTION_TARGET_GEOMETRY extends Action {
	action: 'SET_ENTITY_DIRECTION_TARGET_GEOMETRY';
	entity: string;
	target_geometry: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_DIRECTION_TARGET_GEOMETRY';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.target_geometry = tryString(
			args.target_geometry,
			`${this.action} param "target_geometry"`,
			debug,
		);
	}
	static quick(entity: string, target_geometry: string) {
		return new SET_ENTITY_DIRECTION_TARGET_GEOMETRY({ entity, target_geometry });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} direction = ${printGeometry(this.target_geometry)};`;
	}
}
export class SET_ENTITY_GLITCHED extends ActionSetBool {
	action: 'SET_ENTITY_GLITCHED';
	entity: string;
	bool_value: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_GLITCHED';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.bool_value = tryBool(args.bool_value, `${this.action} param "bool_value"`, debug);
	}
	updateProp(v: boolean) {
		this.bool_value = v;
	}
	getProp() {
		return this.bool_value;
	}
	invert() {
		this.bool_value = !this.bool_value;
		return this;
	}
	static quick(entity: string, bool_value: boolean) {
		return new SET_ENTITY_GLITCHED({ entity, bool_value });
	}
	print() {
		return printSetBoolAction(this, `${printEntityIdentifier(this.entity)} glitched`);
	}
}
export class SET_ENTITY_PATH extends Action {
	action: 'SET_ENTITY_PATH';
	entity: string;
	geometry: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_PATH';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.geometry = tryString(args.geometry, `${this.action} param "geometry"`, debug);
	}
	static quick(entity: string, geometry: string) {
		return new SET_ENTITY_PATH({ entity, geometry });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} path = "${this.geometry}";`;
	}
}
export class COPY_SCRIPT extends Action {
	action: 'COPY_SCRIPT';
	script: string;
	search_and_replace?: Record<string, string>;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'COPY_SCRIPT';
		this.script = tryString(args.script, `${this.action} param "script"`, debug);
		if (args.search_and_replace) {
			const search_and_replace: Record<string, string> = {};
			Object.entries(args.search_and_replace).forEach(([k, v]) => {
				if (typeof k === 'string' && typeof v === 'string') search_and_replace[k] = v;
			});
			this.search_and_replace = search_and_replace;
		}
	}
	static quick(script: string, search_and_replace?: Record<string, string>) {
		if (search_and_replace) {
			return new COPY_SCRIPT({ script, search_and_replace });
		}
		return new COPY_SCRIPT({ script });
	}
	getScript() {
		return this.script;
	}
	setScript(script: string) {
		this.script = script;
	}
	print() {
		if (!this.search_and_replace) {
			return `"${this.script}"()`;
		}
		const action = {
			action: this.action,
			script: this.script,
			search_and_replace: this.search_and_replace,
		};
		const strung = JSON.stringify(action, null, '\t');
		return `json[${strung}]`;
	}
}
export class SET_SAVE_FLAG extends ActionSetBool {
	action: 'SET_SAVE_FLAG';
	save_flag: string;
	bool_value: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_SAVE_FLAG';
		this.save_flag = tryString(args.save_flag, `${this.action} param "save_flag"`, debug);
		this.bool_value = tryBool(args.bool_value, `${this.action} param "bool_value"`, debug);
	}
	updateProp(v: boolean) {
		this.bool_value = v;
	}
	getProp() {
		return this.bool_value;
	}
	invert() {
		this.bool_value = !this.bool_value;
		return this;
	}
	static toValue(save_flag: string, bool_value: boolean) {
		return new SET_SAVE_FLAG({ save_flag, bool_value });
	}
	static toFlag(debug: MathlangLocation, save_flag: string, source: string, invert?: boolean) {
		const actionIfTrue = SET_SAVE_FLAG.toValue(save_flag, true);
		const actionIfFalse = SET_SAVE_FLAG.toValue(save_flag, false);
		const steps = simpleBranchMaker(
			debug,
			CheckSaveFlag.quick(debug, source, !invert),
			[actionIfTrue],
			[actionIfFalse],
		);
		return MathlangSequence.quick(debug, steps, 'SET_SAVE_FLAG.toFlag');
	}
	print() {
		return printSetBoolAction(this, `"${this.save_flag}"`);
	}
}
export class SET_PLAYER_CONTROL extends ActionSetBool {
	action: 'SET_PLAYER_CONTROL';
	bool_value: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_PLAYER_CONTROL';
		this.bool_value = tryBool(args.bool_value, `${this.action} param "bool_value"`, debug);
	}
	updateProp(v: boolean) {
		this.bool_value = v;
	}
	getProp() {
		return this.bool_value;
	}
	invert() {
		this.bool_value = !this.bool_value;
		return this;
	}
	static quick(bool_value: boolean) {
		return new SET_PLAYER_CONTROL({ bool_value });
	}
	print() {
		return printSetBoolAction(this, `player_control`);
	}
}
export class SET_MAP_TICK_SCRIPT extends ActionSetScript {
	action: 'SET_MAP_TICK_SCRIPT';
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args, debug);
		this.action = 'SET_MAP_TICK_SCRIPT';
	}
	static quick(script: string) {
		return new SET_MAP_TICK_SCRIPT({ script });
	}
	print() {
		return `map on_tick = "${this.script}";`;
	}
}
export class SET_HEX_CURSOR_LOCATION extends Action {
	action: 'SET_HEX_CURSOR_LOCATION';
	address: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_HEX_CURSOR_LOCATION';
		this.address = tryNumber(args.address, `${this.action} param "address"`, debug);
	}
	// todo print?
}
export class SET_WARP_STATE extends Action {
	action: 'SET_WARP_STATE';
	string: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_WARP_STATE';
		this.string = tryString(args.string, `${this.action} param "string"`, debug);
	}
	print() {
		return `warp_state = "${this.string}";`;
	}
}
export class SET_HEX_EDITOR_STATE extends ActionSetBool {
	action: 'SET_HEX_EDITOR_STATE';
	bool_value: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_HEX_EDITOR_STATE';
		this.bool_value = tryBool(args.bool_value, `${this.action} param "bool_value"`, debug);
	}
	updateProp(v: boolean) {
		this.bool_value = v;
	}
	getProp() {
		return this.bool_value;
	}
	invert() {
		this.bool_value = !this.bool_value;
		return this;
	}
	static quick(bool_value: boolean) {
		return new SET_HEX_EDITOR_STATE({ bool_value });
	}
	print() {
		return printSetBoolAction(this, `hex_editor`);
	}
}
export class SET_HEX_EDITOR_DIALOG_MODE extends ActionSetBool {
	action: 'SET_HEX_EDITOR_DIALOG_MODE';
	bool_value: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_HEX_EDITOR_DIALOG_MODE';
		this.bool_value = tryBool(args.bool_value, `${this.action} param "bool_value"`, debug);
	}
	updateProp(v: boolean) {
		this.bool_value = v;
	}
	getProp() {
		return this.bool_value;
	}
	invert() {
		this.bool_value = !this.bool_value;
		return this;
	}
	static quick(bool_value: boolean) {
		return new SET_HEX_EDITOR_DIALOG_MODE({ bool_value });
	}
	print() {
		return printSetBoolAction(this, `hex_dialog_mode`);
	}
}
export class SET_HEX_EDITOR_CONTROL extends ActionSetBool {
	action: 'SET_HEX_EDITOR_CONTROL';
	bool_value: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_HEX_EDITOR_CONTROL';
		this.bool_value = tryBool(args.bool_value, `${this.action} param "bool_value"`, debug);
	}
	updateProp(v: boolean) {
		this.bool_value = v;
	}
	getProp() {
		return this.bool_value;
	}
	invert() {
		this.bool_value = !this.bool_value;
		return this;
	}
	static quick(bool_value: boolean) {
		return new SET_HEX_EDITOR_CONTROL({ bool_value });
	}
	print() {
		return printSetBoolAction(this, `hex_control`);
	}
}
export class SET_HEX_EDITOR_CONTROL_CLIPBOARD extends ActionSetBool {
	action: 'SET_HEX_EDITOR_CONTROL_CLIPBOARD';
	bool_value: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_HEX_EDITOR_CONTROL_CLIPBOARD';
		this.bool_value = tryBool(args.bool_value, `${this.action} param "bool_value"`, debug);
	}
	updateProp(v: boolean) {
		this.bool_value = v;
	}
	getProp() {
		return this.bool_value;
	}
	invert() {
		this.bool_value = !this.bool_value;
		return this;
	}
	static quick(bool_value: boolean) {
		return new SET_HEX_EDITOR_CONTROL_CLIPBOARD({ bool_value });
	}
	print() {
		return printSetBoolAction(this, `hex_clipboard`);
	}
}
export class LOAD_MAP extends Action {
	action: 'LOAD_MAP';
	map: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'LOAD_MAP';
		this.map = tryString(args.map, `${this.action} param "map"`, debug);
	}
	static quick(map: string) {
		return new LOAD_MAP({ map });
	}
	print() {
		return `load map "${this.map}";`;
	}
}
export class SHOW_DIALOG extends Action {
	action: 'SHOW_DIALOG';
	dialog: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SHOW_DIALOG';
		this.dialog = tryString(args.dialog, `${this.action} param "dialog"`, debug);
	}
	static quick(dialog: string) {
		return new SHOW_DIALOG({ dialog });
	}
	print() {
		return `show dialog "${this.dialog}";`;
	}
}
export class PLAY_ENTITY_ANIMATION extends Action {
	action: 'PLAY_ENTITY_ANIMATION';
	entity: string;
	animation: number;
	play_count: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'PLAY_ENTITY_ANIMATION';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.animation = tryNumber(args.animation, `${this.action} param "animation"`, debug);
		this.play_count = tryNumber(args.play_count, `${this.action} param "play_count"`, debug);
	}
	print() {
		return `${printEntityIdentifier(this.entity)} animation -> ${this.animation} ${this.play_count}x;`;
	}
}
export class TELEPORT_ENTITY_TO_GEOMETRY extends Action {
	action: 'TELEPORT_ENTITY_TO_GEOMETRY';
	geometry: string;
	entity: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'TELEPORT_ENTITY_TO_GEOMETRY';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.geometry = tryString(args.geometry, `${this.action} param "geometry"`, debug);
	}
	static quick(entity: string, geometry: string) {
		return new TELEPORT_ENTITY_TO_GEOMETRY({ entity, geometry });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} position = ${printGeometry(this.geometry)};`;
	}
}
export class WALK_ENTITY_TO_GEOMETRY extends Action {
	action: 'WALK_ENTITY_TO_GEOMETRY';
	geometry: string;
	entity: string;
	duration: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'WALK_ENTITY_TO_GEOMETRY';
		this.geometry = tryString(args.geometry, `${this.action} param "geometry"`, debug);
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
	}
	static quick(entity: string, geometry: string, duration: number) {
		return new WALK_ENTITY_TO_GEOMETRY({ entity, geometry, duration });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} position -> ${printGeometry(this.geometry)} origin over ${printDuration(this.duration)};`;
	}
}
export class WALK_ENTITY_ALONG_GEOMETRY extends Action {
	action: 'WALK_ENTITY_ALONG_GEOMETRY';
	geometry: string;
	entity: string;
	duration: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'WALK_ENTITY_ALONG_GEOMETRY';
		this.geometry = tryString(args.geometry, `${this.action} param "geometry"`, debug);
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
	}
	static quick(entity: string, geometry: string, duration: number) {
		return new WALK_ENTITY_ALONG_GEOMETRY({ entity, geometry, duration });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} position -> ${printGeometry(this.geometry)} length over ${printDuration(this.duration)};`;
	}
}
export class LOOP_ENTITY_ALONG_GEOMETRY extends Action {
	action: 'LOOP_ENTITY_ALONG_GEOMETRY';
	geometry: string;
	entity: string;
	duration: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'LOOP_ENTITY_ALONG_GEOMETRY';
		this.geometry = tryString(args.geometry, `${this.action} param "geometry"`, debug);
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
	}
	static quick(entity: string, geometry: string, duration: number) {
		return new LOOP_ENTITY_ALONG_GEOMETRY({ entity, geometry, duration });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} position -> ${printGeometry(this.geometry)} length over ${printDuration(this.duration)} forever;`;
	}
}
export class SET_CAMERA_TO_FOLLOW_ENTITY extends Action {
	action: 'SET_CAMERA_TO_FOLLOW_ENTITY';
	entity: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_CAMERA_TO_FOLLOW_ENTITY';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
	}
	static quick(entity: string) {
		return new SET_CAMERA_TO_FOLLOW_ENTITY({ entity });
	}
	print() {
		return `camera = ${printEntityIdentifier(this.entity)} position;`;
	}
}
export class TELEPORT_CAMERA_TO_GEOMETRY extends Action {
	action: 'TELEPORT_CAMERA_TO_GEOMETRY';
	geometry: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'TELEPORT_CAMERA_TO_GEOMETRY';
		this.geometry = tryString(args.geometry, `${this.action} param "geometry"`, debug);
	}
	static quick(geometry: string) {
		return new TELEPORT_CAMERA_TO_GEOMETRY({ geometry });
	}
	print() {
		return `camera = ${printGeometry(this.geometry)};`;
	}
}
export class PAN_CAMERA_TO_ENTITY extends Action {
	action: 'PAN_CAMERA_TO_ENTITY';
	entity: string;
	duration: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'PAN_CAMERA_TO_ENTITY';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
	}
	static quick(entity: string, duration: number) {
		return new PAN_CAMERA_TO_ENTITY({ duration, entity });
	}
	print() {
		return `camera -> ${printEntityIdentifier(this.entity)} position over ${printDuration(this.duration)};`;
	}
}
export class PAN_CAMERA_TO_GEOMETRY extends Action {
	action: 'PAN_CAMERA_TO_GEOMETRY';
	geometry: string;
	duration: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'PAN_CAMERA_TO_GEOMETRY';
		this.geometry = tryString(args.geometry, `${this.action} param "geometry"`, debug);
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
	}
	static quick(geometry: string, duration: number) {
		return new PAN_CAMERA_TO_GEOMETRY({ geometry, duration });
	}
	print() {
		return `camera -> ${printGeometry(this.geometry)} origin over ${printDuration(this.duration)};`;
	}
}
export class PAN_CAMERA_ALONG_GEOMETRY extends Action {
	action: 'PAN_CAMERA_ALONG_GEOMETRY';
	geometry: string;
	duration: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'PAN_CAMERA_ALONG_GEOMETRY';
		this.geometry = tryString(args.geometry, `${this.action} param "geometry"`, debug);
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
	}
	static quick(geometry: string, duration: number) {
		return new PAN_CAMERA_ALONG_GEOMETRY({ geometry, duration });
	}
	print() {
		return `camera -> ${printGeometry(this.geometry)} length over ${printDuration(this.duration)};`;
	}
}
export class LOOP_CAMERA_ALONG_GEOMETRY extends Action {
	action: 'LOOP_CAMERA_ALONG_GEOMETRY';
	geometry: string;
	duration: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'LOOP_CAMERA_ALONG_GEOMETRY';
		this.geometry = tryString(args.geometry, `${this.action} param "geometry"`, debug);
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
	}
	static quick(geometry: string, duration: number) {
		return new LOOP_CAMERA_ALONG_GEOMETRY({ geometry, duration });
	}
	print() {
		return `camera -> ${printGeometry(this.geometry)} length over ${printDuration(this.duration)} forever;`;
	}
}
export class SET_SCREEN_SHAKE extends Action {
	action: 'SET_SCREEN_SHAKE';
	duration: number;
	frequency: number;
	amplitude: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_SCREEN_SHAKE';
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
		this.frequency = tryNumber(args.frequency, `${this.action} param "frequency"`, debug);
		this.amplitude = tryNumber(args.amplitude, `${this.action} param "amplitude"`, debug);
	}
	print() {
		return `camera shake -> ${this.frequency}ms ${this.amplitude}px over ${printDuration(this.duration)};`;
	}
}
export class SCREEN_FADE_OUT extends Action {
	action: 'SCREEN_FADE_OUT';
	duration: number;
	color: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SCREEN_FADE_OUT';
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
		this.color = tryString(args.color, `${this.action} param "color"`, debug);
	}
	print() {
		return `camera fade out -> ${this.color} over ${printDuration(this.duration)};`;
	}
}
export class SCREEN_FADE_IN extends Action {
	action: 'SCREEN_FADE_IN';
	duration: number;
	color: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SCREEN_FADE_IN';
		this.duration = tryNumber(args.duration, `${this.action} param "duration"`, debug);
		this.color = tryString(args.color, `${this.action} param "color"`, debug);
	}
	print() {
		return `camera fade in -> ${this.color} over ${printDuration(this.duration)};`;
	}
}
export class MUTATE_VARIABLE extends Action {
	action: 'MUTATE_VARIABLE';
	variable: string;
	operation: string;
	value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'MUTATE_VARIABLE';
		this.variable = tryString(args.variable, `${this.action} param "variable"`, debug);
		this.operation = tryString(args.operation, `${this.action} param "operation"`, debug);
		this.value = tryNumber(args.value, `${this.action} param "value"`, debug);
	}
	static set(variable: string, value: number) {
		return new MUTATE_VARIABLE({ operation: 'SET', value, variable });
	}
	static change(debug: MathlangLocation, variable: string, value: number, op: string) {
		if (op === '+' && value === 0) {
			return CommentNode.quick(debug, 'This action was optimized out (+ 0)');
		}
		if (op === '*' && value === 1) {
			return CommentNode.quick(debug, 'This action was optimized out (* 1)');
		}
		if (op === '/' && value === 1) {
			return CommentNode.quick(debug, 'This action was optimized out (/ 1)');
		}
		if (op === '-' && value === 0) {
			return CommentNode.quick(debug, 'This action was optimized out (- 0)');
		}
		return new MUTATE_VARIABLE({ operation: opIntoStringMap[op] || op, value, variable });
	}
	realignVars() {
		this.variable = realignTemp(this.variable);
		return this;
	}
	registerVars(registry: Set<string>) {
		registry.add(this.variable);
	}
	print() {
		return `"${this.variable}" ${stringIntoOpMap[this.operation]}= ${this.value};`;
	}
}
export class MUTATE_VARIABLES extends Action {
	action: 'MUTATE_VARIABLES';
	variable: string;
	operation: string;
	source: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'MUTATE_VARIABLES';
		this.variable = tryString(args.variable, `${this.action} param "variable"`, debug);
		this.operation = tryString(args.operation, `${this.action} param "operation"`, debug);
		this.source = tryString(args.source, `${this.action} param "source"`, debug);
	}
	static set(debug: MathlangLocation, variable: string, source: string) {
		if (variable === source) {
			return CommentNode.quick(
				debug,
				`This action was optimized out (setting '${variable}' to itself)`,
			);
		}
		return new MUTATE_VARIABLES({ operation: 'SET', source, variable });
	}
	static change(variable: string, source: string, op: string) {
		return new MUTATE_VARIABLES({
			variable,
			source,
			operation: opIntoStringMap[op] || op,
		});
	}
	realignVars() {
		this.variable = realignTemp(this.variable);
		this.source = realignTemp(this.source);
		return this;
	}
	registerVars(registry: Set<string>) {
		registry.add(this.variable);
		registry.add(this.source);
	}
	print() {
		return `"${this.variable}" ${stringIntoOpMap[this.operation]}= "${this.source}";`;
	}
}
export class COPY_VARIABLE extends Action {
	action: 'COPY_VARIABLE';
	variable: string;
	entity: string;
	field: string;
	inbound: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'COPY_VARIABLE';
		this.variable = tryString(args.variable, `${this.action} param "variable"`, debug);
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.field = tryString(args.field, `${this.action} param "field"`, debug);
		this.inbound = tryBool(args.inbound, `${this.action} param "inbound"`, debug);
	}
	static intoField(variable: string, entity: string, field: string) {
		return new COPY_VARIABLE({ entity, field, inbound: false, variable });
	}
	static intoVariable(entity: string, field: string, variable: string) {
		return new COPY_VARIABLE({ entity, field, inbound: true, variable });
	}
	realignVars() {
		this.variable = realignTemp(this.variable);
		return this;
	}
	registerVars(registry: Set<string>) {
		registry.add(this.variable);
	}
	print() {
		return this.inbound
			? `"${this.variable}" = ${printEntityIdentifier(this.entity)} ${this.field};`
			: `${printEntityIdentifier(this.entity)} ${this.field} = "${this.variable}";`;
	}
}
export class SLOT_SAVE extends Action {
	action: 'SLOT_SAVE';
	constructor(args: unknown) {
		super(args);
		this.action = 'SLOT_SAVE';
	}
	print() {
		return `save slot;`;
	}
}
export class SLOT_LOAD extends Action {
	action: 'SLOT_LOAD';
	slot: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SLOT_LOAD';
		this.slot = tryNumber(args.slot, `${this.action} param "slot"`, debug);
	}
	print() {
		return `load slot ${this.slot};`;
	}
}
export class SLOT_ERASE extends Action {
	action: 'SLOT_ERASE';
	slot: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SLOT_ERASE';
		this.slot = tryNumber(args.slot, `${this.action} param "slot"`, debug);
	}
	print() {
		return `erase slot ${this.slot};`;
	}
}
export class SET_CONNECT_SERIAL_DIALOG extends Action {
	action: 'SET_CONNECT_SERIAL_DIALOG';
	serial_dialog: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_CONNECT_SERIAL_DIALOG';
		this.serial_dialog = tryString(
			args.serial_dialog,
			`${this.action} param "serial_dialog"`,
			debug,
		);
	}
	print() {
		return `serial_connect = "${this.serial_dialog}";`;
	}
}
export class SHOW_SERIAL_DIALOG extends Action {
	action: 'SHOW_SERIAL_DIALOG';
	serial_dialog: string;
	disable_newline?: boolean; // might be absent on old stuff
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SHOW_SERIAL_DIALOG';
		this.serial_dialog = tryString(
			args.serial_dialog,
			`${this.action} param "serial_dialog"`,
			debug,
		);
		if (args.disable_newline) {
			this.disable_newline = true;
		}
	}
	static quick(serial_dialog: string, disable_newline?: boolean) {
		return new SHOW_SERIAL_DIALOG({ serial_dialog, disable_newline: !!disable_newline });
	}
	print() {
		const verb = this.disable_newline ? 'concat' : 'show';
		return `${verb} serial_dialog "${this.serial_dialog}";`;
	}
}
export class SET_MAP_LOOK_SCRIPT extends ActionSetScript {
	action: 'SET_MAP_LOOK_SCRIPT';
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args, debug);
		this.action = 'SET_MAP_LOOK_SCRIPT';
	}
	static quick(script: string) {
		return new SET_MAP_LOOK_SCRIPT({ script });
	}
	print() {
		return `map on_look = "${this.script}";`;
	}
}
export class SET_ENTITY_LOOK_SCRIPT extends ActionSetScript {
	action: 'SET_ENTITY_LOOK_SCRIPT';
	entity: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args, debug);
		this.action = 'SET_ENTITY_LOOK_SCRIPT';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
	}
	static quick(entity: string, script: string) {
		return new SET_ENTITY_LOOK_SCRIPT({ entity, script });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} on_look = "${this.script}";`;
	}
}
export class SET_TELEPORT_ENABLED extends Action {
	action: 'SET_TELEPORT_ENABLED';
	bool_value: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_TELEPORT_ENABLED';
		this.bool_value = tryBool(args.bool_value, `${this.action} param "bool_value"`, debug);
	}
	updateProp(v: boolean) {
		this.bool_value = v;
	}
	getProp() {
		return this.bool_value;
	}
	invert() {
		this.bool_value = !this.bool_value;
		return this;
	}
	// todo print?
}
export class SET_BLE_FLAG extends Action {
	action: 'SET_BLE_FLAG';
	ble_flag: string;
	bool_value: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_BLE_FLAG';
		this.ble_flag = tryString(args.ble_flag, `${this.action} param "ble_flag"`, debug);
		this.bool_value = tryBool(args.bool_value, `${this.action} param "bool_value"`, debug);
	}
	updateProp(v: boolean) {
		this.bool_value = v;
	}
	getProp() {
		return this.bool_value;
	}
	invert() {
		this.bool_value = !this.bool_value;
		return this;
	}
}
export class SET_SERIAL_DIALOG_CONTROL extends ActionSetBool {
	action: 'SET_SERIAL_DIALOG_CONTROL';
	bool_value: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_SERIAL_DIALOG_CONTROL';
		this.bool_value = tryBool(args.bool_value, `${this.action} param "bool_value"`, debug);
	}
	updateProp(v: boolean) {
		this.bool_value = v;
	}
	getProp() {
		return this.bool_value;
	}
	invert() {
		this.bool_value = !this.bool_value;
		return this;
	}
	static quick(bool_value: boolean) {
		return new SET_SERIAL_DIALOG_CONTROL({ bool_value });
	}
	print() {
		return printSetBoolAction(this, `serial_control`);
	}
}
export class REGISTER_SERIAL_DIALOG_COMMAND extends Action {
	action: 'REGISTER_SERIAL_DIALOG_COMMAND';
	command: string;
	script: string;
	is_fail?: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'REGISTER_SERIAL_DIALOG_COMMAND';
		this.command = tryString(args.command, `${this.action} param "command"`, debug);
		this.script = tryString(args.script, `${this.action} param "script"`, debug);
		if (args.is_fail) this.is_fail = true;
	}
	getScript() {
		return this.script;
	}
	setScript(script: string) {
		this.script = script;
	}
	print() {
		return this.is_fail
			? `command "${this.command}" fail = "${this.script}";`
			: `command "${this.command}" = "${this.script}";`;
	}
}
export class REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT extends Action {
	action: 'REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT';
	command: string;
	script: string;
	argument: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT';
		this.command = tryString(args.command, `${this.action} param "command"`, debug);
		this.script = tryString(args.script, `${this.action} param "script"`, debug);
		this.argument = tryString(args.argument, `${this.action} param "argument"`, debug);
	}
	getScript() {
		return this.script;
	}
	setScript(script: string) {
		this.script = script;
	}
	print() {
		return `command "${this.command}" + "${this.argument}" = "${this.script}";`;
	}
}
export class UNREGISTER_SERIAL_DIALOG_COMMAND extends Action {
	action: 'UNREGISTER_SERIAL_DIALOG_COMMAND';
	command: string;
	is_fail?: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'UNREGISTER_SERIAL_DIALOG_COMMAND';
		this.command = tryString(args.command, `${this.action} param "command"`, debug);
		if (args.is_fail !== undefined) {
			this.is_fail = tryBool(args.is_fail, `${this.action} param "is_fail"`, debug);
		}
	}
	print() {
		if (this.is_fail) {
			return `delete command "${this.command}" fail;`;
		}
		return `delete command "${this.command}";`;
	}
}
export class UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT extends Action {
	action: 'UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT';
	command: string;
	argument: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT';
		this.command = tryString(args.command, `${this.action} param "command"`, debug);
		this.argument = tryString(args.argument, `${this.action} param "argument"`, debug);
	}
	print() {
		return `delete command "${this.command}" + "${this.argument}";`;
	}
}
export class SET_ENTITY_MOVEMENT_RELATIVE extends Action {
	action: 'SET_ENTITY_MOVEMENT_RELATIVE';
	relative_direction: number;
	entity: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_ENTITY_MOVEMENT_RELATIVE';
		this.relative_direction = tryNumber(
			args.relative_direction,
			`${this.action} param "relative_direction"`,
			debug,
		);
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
	}
	static quick(entity: string, relative_direction: number) {
		return new SET_ENTITY_MOVEMENT_RELATIVE({ entity, relative_direction });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} strafe = ${this.relative_direction};`;
	}
}
export class CLOSE_DIALOG extends Action {
	action: 'CLOSE_DIALOG';
	constructor(args: unknown) {
		super(args);
		this.action = 'CLOSE_DIALOG';
	}
	print() {
		return `close dialog;`;
	}
}
export class CLOSE_SERIAL_DIALOG extends Action {
	action: 'CLOSE_SERIAL_DIALOG';
	constructor(args: unknown) {
		super(args);
		this.action = 'CLOSE_SERIAL_DIALOG';
	}
	print() {
		return `close serial_dialog;`;
	}
}
export class SET_LIGHTS_CONTROL extends ActionSetBool {
	action: 'SET_LIGHTS_CONTROL';
	enabled: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_LIGHTS_CONTROL';
		this.enabled = tryBool(args.enabled, `${this.action} param "enabled"`, debug);
	}
	updateProp(v: boolean) {
		this.enabled = v;
	}
	getProp() {
		return this.enabled;
	}
	invert() {
		this.enabled = !this.enabled;
		return this;
	}
	static quick(enabled: boolean) {
		return new SET_LIGHTS_CONTROL({ enabled });
	}
	print() {
		return printSetBoolAction(this, `lights_control`);
	}
}
export class SET_LIGHTS_STATE extends ActionSetBool {
	action: 'SET_LIGHTS_STATE';
	lights: string | string[];
	enabled: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_LIGHTS_STATE';
		this.enabled = tryBool(args.enabled, `${this.action} param "enabled"`, debug);
		this.lights = tryStringOrStringArray(args.lights, `${this.action} param "lights"`, debug);
	}
	updateProp(v: boolean) {
		this.enabled = v;
	}
	getProp() {
		return this.enabled;
	}
	invert() {
		this.enabled = !this.enabled;
		return this;
	}
	static quick(lights: string, enabled: boolean) {
		return new SET_LIGHTS_STATE({ lights, enabled });
	}
	print() {
		return printSetBoolAction(this, `light ${this.lights}`);
	}
}
export class GOTO_ACTION_INDEX extends Action {
	action: 'GOTO_ACTION_INDEX';
	action_index: number | string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'GOTO_ACTION_INDEX';
		this.action_index = tryStringOrNumber(
			args.action_index,
			`${this.action} param "action_index"`,
			debug,
		);
	}
	static quick(action_index: string | number) {
		return new GOTO_ACTION_INDEX({ action_index });
	}
	ifLabelAddSuffix(suffix: string) {
		if (typeof this.action_index === 'string') {
			this.action_index += suffix;
		}
		return this;
	}
	print() {
		if (typeof this.action_index === 'string') {
			return `goto label ${sanitizeLabel(this.action_index)};`;
		}
		return `goto index ${this.action_index};`;
	}
}
export class SET_SCRIPT_PAUSE extends Action {
	action: 'SET_SCRIPT_PAUSE';
	entity: string;
	script_slot: string;
	bool_value: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_SCRIPT_PAUSE';
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.script_slot = tryString(args.script_slot, `${this.action} param "script_slot"`, debug);
		this.bool_value = tryBool(args.bool_value, `${this.action} param "bool_value"`, debug);
	}
	updateProp(v: boolean) {
		this.bool_value = v;
	}
	getProp() {
		return this.bool_value;
	}
	invert() {
		this.bool_value = !this.bool_value;
		return this;
	}
	print() {
		return `${this.bool_value ? '' : 'un'}pause ${printEntityIdentifier(this.entity)} ${this.script_slot};`;
	}
}
export class REGISTER_SERIAL_DIALOG_COMMAND_ALIAS extends Action {
	action: 'REGISTER_SERIAL_DIALOG_COMMAND_ALIAS';
	command: string;
	alias: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'REGISTER_SERIAL_DIALOG_COMMAND_ALIAS';
		this.command = tryString(args.command, `${this.action} param "command"`, debug);
		this.alias = tryString(args.alias, `${this.action} param "alias"`, debug);
	}
	print() {
		return `alias "${this.alias}" = "${this.command}";`;
	}
}
export class UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS extends Action {
	action: 'UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS';
	alias: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS';
		this.alias = tryString(args.alias, `${this.action} param "alias"`, debug);
	}
	print() {
		return `delete alias "${this.alias}";`;
	}
}
export class SET_SERIAL_DIALOG_COMMAND_VISIBILITY extends Action {
	action: 'SET_SERIAL_DIALOG_COMMAND_VISIBILITY';
	command: string;
	is_visible: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'SET_SERIAL_DIALOG_COMMAND_VISIBILITY';
		this.command = tryString(args.command, `${this.action} param "command"`, debug);
		this.is_visible = tryBool(args.is_visible, `${this.action} param "is_visible"`, debug);
	}
	updateProp(v: boolean) {
		this.is_visible = v;
	}
	getProp() {
		return this.is_visible;
	}
	invert() {
		this.is_visible = !this.is_visible;
		return this;
	}
	print() {
		return `${this.is_visible ? 'un' : ''}hide command "${this.command}";`;
	}
}

// CHECK_ACTIONS

export class CHECK_ENTITY_NAME extends ActionStringCheckable {
	action: 'CHECK_ENTITY_NAME';
	entity: string;
	string: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_NAME';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.string = tryString(args.string, `${this.action} param "string"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: string) {
		this.string = value;
	}
	getProp() {
		return this.string;
	}
	static quick(entity: string, string: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_NAME({ entity, string, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'name', `"${this.string}"`);
	}
}
export class CHECK_ENTITY_X extends ActionNumberCheckableEquality {
	action: 'CHECK_ENTITY_X';
	entity: string;
	expected_u2: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_X';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_u2 = tryNumber(args.expected_u2, `${this.action} param "expected_u2"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: number) {
		this.expected_u2 = value;
	}
	getProp() {
		return this.expected_u2;
	}
	invert() {
		this.expected_bool = !this.expected_bool;
		return this;
	}
	static quick(entity: string, expected_u2: number, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_X({ entity, expected_u2, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'x', this.expected_u2);
	}
}
export class CHECK_ENTITY_Y extends ActionNumberCheckableEquality {
	action: 'CHECK_ENTITY_Y';
	entity: string;
	expected_u2: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_Y';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_u2 = tryNumber(args.expected_u2, `${this.action} param "expected_u2"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: number) {
		this.expected_u2 = value;
	}
	getProp() {
		return this.expected_u2;
	}
	invert() {
		this.expected_bool = !this.expected_bool;
		return this;
	}
	static quick(entity: string, expected_u2: number, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_Y({ entity, expected_u2, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'y', this.expected_u2);
	}
}
export class CHECK_ENTITY_INTERACT_SCRIPT extends ActionStringCheckable {
	action: 'CHECK_ENTITY_INTERACT_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_INTERACT_SCRIPT';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_script = tryString(
			args.expected_script,
			`${this.action} param "expected_script"`,
			debug,
		);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: string) {
		this.expected_script = value;
	}
	getProp() {
		return this.expected_script;
	}
	static quick(entity: string, expected_script: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_INTERACT_SCRIPT({ entity, expected_script, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'on_interact', `"${this.expected_script}"`);
	}
}
export class CHECK_ENTITY_TICK_SCRIPT extends ActionStringCheckable {
	action: 'CHECK_ENTITY_TICK_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_TICK_SCRIPT';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_script = tryString(
			args.expected_script,
			`${this.action} param "expected_script"`,
			debug,
		);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: string) {
		this.expected_script = value;
	}
	getProp() {
		return this.expected_script;
	}
	static quick(entity: string, expected_script: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_TICK_SCRIPT({ entity, expected_script, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'on_tick', `"${this.expected_script}"`);
	}
}
export class CHECK_ENTITY_LOOK_SCRIPT extends ActionStringCheckable {
	action: 'CHECK_ENTITY_LOOK_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_LOOK_SCRIPT';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_script = tryString(
			args.expected_script,
			`${this.action} param "expected_script"`,
			debug,
		);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: string) {
		this.expected_script = value;
	}
	getProp() {
		return this.expected_script;
	}
	static quick(entity: string, expected_script: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_LOOK_SCRIPT({ entity, expected_script, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'on_look', `"${this.expected_script}"`);
	}
}
export class CHECK_ENTITY_TYPE extends ActionStringCheckable {
	action: 'CHECK_ENTITY_TYPE';
	entity: string;
	entity_type: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_TYPE';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.entity_type = tryString(args.entity_type, `${this.action} param "entity_type"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: string) {
		this.entity_type = value;
	}
	getProp() {
		return this.entity_type;
	}
	static quick(entity: string, entity_type: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_TYPE({ entity, entity_type, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'type', `"${this.entity_type}"`);
	}
}
export class CHECK_ENTITY_PRIMARY_ID extends ActionNumberCheckableEquality {
	action: 'CHECK_ENTITY_PRIMARY_ID';
	entity: string;
	expected_u2: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_PRIMARY_ID';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_u2 = tryNumber(args.expected_u2, `${this.action} param "expected_u2"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: number) {
		this.expected_u2 = value;
	}
	getProp() {
		return this.expected_u2;
	}
	invert() {
		this.expected_bool = !this.expected_bool;
		return this;
	}
	static quick(entity: string, expected_u2: number, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_PRIMARY_ID({ entity, expected_u2, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'primary_id', this.expected_u2);
	}
}
export class CHECK_ENTITY_SECONDARY_ID extends ActionNumberCheckableEquality {
	action: 'CHECK_ENTITY_SECONDARY_ID';
	entity: string;
	expected_u2: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_SECONDARY_ID';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_u2 = tryNumber(args.expected_u2, `${this.action} param "expected_u2"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: number) {
		this.expected_u2 = value;
	}
	getProp() {
		return this.expected_u2;
	}
	invert() {
		this.expected_bool = !this.expected_bool;
		return this;
	}
	static quick(entity: string, expected_u2: number, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_SECONDARY_ID({ entity, expected_u2, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'secondary_id', this.expected_u2);
	}
}
export class CHECK_ENTITY_PRIMARY_ID_TYPE extends ActionNumberCheckableEquality {
	action: 'CHECK_ENTITY_PRIMARY_ID_TYPE';
	entity: string;
	expected_byte: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_PRIMARY_ID_TYPE';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_byte = tryNumber(
			args.expected_byte,
			`${this.action} param "expected_byte"`,
			debug,
		);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: number) {
		this.expected_byte = value;
	}
	getProp() {
		return this.expected_byte;
	}
	invert() {
		this.expected_bool = !this.expected_bool;
		return this;
	}
	static quick(entity: string, expected_byte: number, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_PRIMARY_ID_TYPE({ entity, expected_byte, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'primary_id_type', this.expected_byte);
	}
}
export class CHECK_ENTITY_CURRENT_ANIMATION extends ActionNumberCheckableEquality {
	action: 'CHECK_ENTITY_CURRENT_ANIMATION';
	entity: string;
	expected_byte: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_CURRENT_ANIMATION';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_byte = tryNumber(
			args.expected_byte,
			`${this.action} param "expected_byte"`,
			debug,
		);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: number) {
		this.expected_byte = value;
	}
	getProp() {
		return this.expected_byte;
	}
	invert() {
		this.expected_bool = !this.expected_bool;
		return this;
	}
	static quick(entity: string, expected_byte: number, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_CURRENT_ANIMATION({ entity, expected_byte, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'current_animation', this.expected_byte);
	}
}
export class CHECK_ENTITY_CURRENT_FRAME extends ActionNumberCheckableEquality {
	action: 'CHECK_ENTITY_CURRENT_FRAME';
	entity: string;
	expected_byte: number;
	expected_bool: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_CURRENT_FRAME';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_byte = tryNumber(
			args.expected_byte,
			`${this.action} param "expected_byte"`,
			debug,
		);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: number) {
		this.expected_byte = value;
	}
	getProp() {
		return this.expected_byte;
	}
	invert() {
		this.expected_bool = !this.expected_bool;
		return this;
	}
	static quick(entity: string, expected_byte: number, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_CURRENT_FRAME({ entity, expected_byte, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'animation_frame', this.expected_byte);
	}
}
export class CHECK_ENTITY_DIRECTION extends ActionStringCheckable {
	action: 'CHECK_ENTITY_DIRECTION';
	entity: string;
	direction: string; // north, south, east, west
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_DIRECTION';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.direction = tryString(args.direction, `${this.action} param "direction"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: string) {
		this.direction = value;
	}
	getProp() {
		return this.direction;
	}
	static quick(entity: string, direction: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_DIRECTION({ entity, direction, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'direction', `${this.direction}`);
	}
}
export class CHECK_ENTITY_GLITCHED extends ActionBoolGetable {
	action: 'CHECK_ENTITY_GLITCHED';
	entity: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_GLITCHED';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	static quick(entity: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_GLITCHED({ entity, expected_bool });
	}
	print() {
		return printCheckAction(this, `${printEntityIdentifier(this.entity)} glitched`, true);
	}
}
export class CHECK_ENTITY_PATH extends ActionStringCheckable {
	action: 'CHECK_ENTITY_PATH';
	geometry: string;
	entity: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_ENTITY_PATH';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.geometry = tryString(args.geometry, `${this.action} param "geometry"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: string) {
		this.geometry = value;
	}
	getProp() {
		return this.geometry;
	}
	static quick(entity: string, geometry: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_PATH({ entity, geometry, expected_bool });
	}
	print() {
		return printEntityFieldEquality(this, this.entity, 'path', `"${this.geometry}"`);
	}
}
export class CHECK_SAVE_FLAG extends ActionBoolGetable {
	action: 'CHECK_SAVE_FLAG';
	save_flag: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_SAVE_FLAG';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.save_flag = tryString(args.save_flag, `${this.action} param "save_flag"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	static quick(save_flag: string, provided_bool?: boolean, provided_label?: string) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		const action = new CHECK_SAVE_FLAG({ save_flag, expected_bool });
		action.label = provided_label || '';
		return action;
	}
	print() {
		return printCheckAction(this, `"${this.save_flag}"`, true);
	}
}
export class CHECK_IF_ENTITY_IS_IN_GEOMETRY extends ActionBoolGetable {
	action: 'CHECK_IF_ENTITY_IS_IN_GEOMETRY';
	geometry: string;
	entity: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_IF_ENTITY_IS_IN_GEOMETRY';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.geometry = tryString(args.geometry, `${this.action} param "geometry"`, debug);
		this.entity = tryString(args.entity, `${this.action} param "entity"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	static quick(entity: string, geometry: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_IF_ENTITY_IS_IN_GEOMETRY({ entity, geometry, expected_bool });
	}
	print() {
		return printCheckAction(
			this,
			`${printEntityIdentifier(this.entity)} intersects ${printGeometry(this.geometry)}`,
			true,
		);
	}
}
export class CHECK_FOR_BUTTON_PRESS extends ActionBoolGetable {
	action: 'CHECK_FOR_BUTTON_PRESS';
	button_id: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_FOR_BUTTON_PRESS';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.button_id = tryString(args.button_id, `${this.action} param "button_id"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	static quick(button_id: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_FOR_BUTTON_PRESS({ button_id, expected_bool });
	}
	print() {
		return printCheckAction(this, `button ${this.button_id} pressed`, true);
	}
}
export class CHECK_FOR_BUTTON_STATE extends ActionBoolGetable {
	action: 'CHECK_FOR_BUTTON_STATE';
	button_id: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_FOR_BUTTON_STATE';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.button_id = tryString(args.button_id, `${this.action} param "button_id"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	static quick(button_id: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_FOR_BUTTON_STATE({ button_id, expected_bool });
	}
	print() {
		return printCheckAction(
			this,
			`button ${this.button_id} ${this.expected_bool ? 'down' : 'up'}`,
			false,
		);
	}
}
export class CHECK_WARP_STATE extends ActionStringCheckable {
	action: 'CHECK_WARP_STATE';
	string: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_WARP_STATE';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.string = tryString(args.string, `${this.action} param "string"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: string) {
		this.string = value;
	}
	getProp() {
		return this.string;
	}
	static quick(string: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_WARP_STATE({ string, expected_bool });
	}
	print() {
		return this.expected_bool
			? printCheckAction(this, `warp_state == "${this.string}"`, false)
			: printCheckAction(this, `warp_state != "${this.string}"`, false);
	}
}
export class CHECK_VARIABLE extends ActionNumberComparison {
	action: 'CHECK_VARIABLE';
	variable: string;
	comparison: string;
	value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_VARIABLE';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.variable = tryString(args.variable, `${this.action} param "variable"`, debug);
		this.comparison = tryString(args.comparison, `${this.action} param "comparison"`, debug);
		this.value = tryNumber(args.value, `${this.action} param "value"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
		if (this.comparison === '!=') {
			this.comparison = '==';
			this.expected_bool = !this.expected_bool;
		}
	}
	static quick(variable: string, value: number, comparison: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_VARIABLE({
			variable,
			value,
			comparison,
			expected_bool,
		});
	}
	realignVars() {
		this.variable = realignTemp(this.variable);
		return this;
	}
	registerVars(registry: Set<string>) {
		registry.add(this.variable);
	}
	print() {
		const op = this.expected_bool ? this.comparison : inverseOpMap[this.comparison];
		return printCheckAction(this, `"${this.variable}" ${op} ${this.value}`, false);
	}
}
export class CHECK_VARIABLES extends ActionNumberComparison {
	action: 'CHECK_VARIABLES';
	variable: string;
	comparison: string;
	source: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_VARIABLES';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.variable = tryString(args.variable, `${this.action} param "variable"`, debug);
		this.comparison = tryString(args.comparison, `${this.action} param "comparison"`, debug);
		this.source = tryString(args.source, `${this.action} param "source"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
		if (this.comparison === '!=') {
			this.comparison = '==';
			this.expected_bool = !this.expected_bool;
		}
	}
	static quick(variable: string, source: string, comparison: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_VARIABLES({
			variable,
			source,
			comparison,
			expected_bool,
		});
	}
	realignVars() {
		this.variable = realignTemp(this.variable);
		this.source = realignTemp(this.source);
		return this;
	}
	registerVars(registry: Set<string>) {
		registry.add(this.variable);
		registry.add(this.source);
	}
	print() {
		const op = this.expected_bool ? this.comparison : inverseOpMap[this.comparison];
		return printCheckAction(this, `"${this.variable}" ${op} "${this.source}"`, false);
	}
}
export class CHECK_MAP extends ActionStringCheckable {
	// TODO: is this even in the engine? O.o
	action: 'CHECK_MAP';
	map: string;
	expected_bool: boolean;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_MAP';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.map = tryString(args.map, `${this.action} param "map"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: string) {
		this.map = value;
	}
	getProp() {
		return this.map;
	}
	// todo print fn?
}
export class CHECK_BLE_FLAG extends ActionStringCheckable {
	action: 'CHECK_BLE_FLAG';
	ble_flag: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_BLE_FLAG';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.ble_flag = tryString(args.ble_flag, `${this.action} param "ble_flag"`, debug);
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	updateProp(value: string) {
		this.ble_flag = value;
	}
	getProp() {
		return this.ble_flag;
	}
	// todo print fn?
}
export class CHECK_DIALOG_OPEN extends ActionBoolGetable {
	action: 'CHECK_DIALOG_OPEN';
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_DIALOG_OPEN';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	static quick(provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_DIALOG_OPEN({ expected_bool });
	}
	print() {
		return printCheckAction(this, `dialog ${this.expected_bool ? 'open' : 'closed'}`, false);
	}
}
export class CHECK_SERIAL_DIALOG_OPEN extends ActionBoolGetable {
	action: 'CHECK_SERIAL_DIALOG_OPEN';
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_SERIAL_DIALOG_OPEN';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	static quick(provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_SERIAL_DIALOG_OPEN({ expected_bool });
	}
	print() {
		return printCheckAction(
			this,
			`serial_dialog ${this.expected_bool ? 'open' : 'closed'}`,
			false,
		);
	}
}
export class CHECK_DEBUG_MODE extends ActionBoolGetable {
	action: 'CHECK_DEBUG_MODE';
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'CHECK_DEBUG_MODE';
		if (args.success_script) {
			this.success_script = tryString(
				args.success_script,
				`${this.action} param "success_script"`,
				debug,
			);
		} else if (args.label) {
			this.label = tryString(args.label, `${this.action} param "label"`, debug);
		} else if (args.jump_index) {
			this.jump_index = tryStringOrNumber(
				args.jump_index,
				`${this.action} param "jump_index"`,
				debug,
			);
		}
		this.expected_bool = tryBool(
			args.expected_bool,
			`${this.action} param "expected_bool"`,
			debug,
		);
	}
	static quick(provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_DEBUG_MODE({ expected_bool });
	}
	print() {
		return printCheckAction(this, 'debug_mode', true);
	}
}
export class ARRAY_LOG extends Action {
	action: 'ARRAY_LOG';
	array_name: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_LOG';
		this.array_name = tryString(args.array_name, `${this.action} param "array_name"`, debug);
	}
	static quick(array_name: string) {
		return new ARRAY_LOG({ array_name });
	}
	print() {
		return `print array "${this.array_name}";`;
	}
}
export class ARRAY_NEW extends Action {
	action: 'ARRAY_NEW';
	array_name: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_NEW';
		this.array_name = tryString(args.array_name, `${this.action} param "array_name"`, debug);
	}
	static quick(array_name: string) {
		return new ARRAY_NEW({ array_name });
	}
	print() {
		return `array "${this.array_name}" = [];`;
	}
}
export class ARRAY_DELETE extends Action {
	action: 'ARRAY_DELETE';
	array_name: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_DELETE';
		this.array_name = tryString(args.array_name, `${this.action} param "array_name"`, debug);
	}
	static quick(array_name: string) {
		return new ARRAY_DELETE({ array_name });
	}
	print() {
		return `delete array "${this.array_name}";`;
	}
}
export class ARRAY_LENGTH_INTO_VARIABLE extends Action {
	action: 'ARRAY_LENGTH_INTO_VARIABLE';
	array_name: string;
	variable: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_LENGTH_INTO_VARIABLE';
		this.array_name = tryString(args.array_name, `${this.action} param "array_name"`, debug);
		this.variable = tryString(args.variable, `${this.action} param "variable"`, debug);
	}
	static quick(array_name: string, variable: string) {
		return new ARRAY_LENGTH_INTO_VARIABLE({ array_name, variable });
	}
	print() {
		return `"${this.variable}" = "${this.array_name}".length();`;
	}
}
export class ARRAY_WRITE_INTO_INDEX_FROM_VALUE extends Action {
	action: 'ARRAY_WRITE_INTO_INDEX_FROM_VALUE';
	array_name: string;
	index: number;
	value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_WRITE_INTO_INDEX_FROM_VALUE';
		this.array_name = tryString(args.array_name, `${this.action} param "array_name"`, debug);
		this.index = tryNumber(args.index, `${this.action} param "index"`, debug);
		this.value = tryNumber(args.value, `${this.action} param "value"`, debug);
	}
	static quick(array_name: string, index: number, value: number) {
		return new ARRAY_WRITE_INTO_INDEX_FROM_VALUE({ array_name, index, value });
	}
	print() {
		return `"${this.array_name}"[${this.index}] = ${this.value};`;
	}
}
export class ARRAY_WRITE_INTO_INDEX_FROM_VARIABLE extends Action {
	action: 'ARRAY_WRITE_INTO_INDEX_FROM_VARIABLE';
	array_name: string;
	index: number;
	variable: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_WRITE_INTO_INDEX_FROM_VARIABLE';
		this.array_name = tryString(args.array_name, `${this.action} param "array_name"`, debug);
		this.index = tryNumber(args.index, `${this.action} param "index"`, debug);
		this.variable = tryString(args.variable, `${this.action} param "variable"`, debug);
	}
	static quick(array_name: string, index: number, variable: string) {
		return new ARRAY_WRITE_INTO_INDEX_FROM_VARIABLE({ array_name, index, variable });
	}
	print() {
		return `"${this.array_name}"[${this.index}] = "${this.variable}";`;
	}
}
export class ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VALUE extends Action {
	action: 'ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VALUE';
	array_name: string;
	variable_index: string;
	value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VALUE';
		this.array_name = tryString(args.array_name, `${this.action} param "array_name"`, debug);
		this.variable_index = tryString(
			args.variable_index,
			`${this.action} param "variable_index"`,
			debug,
		);
		this.value = tryNumber(args.value, `${this.action} param "value"`, debug);
	}
	static quick(array_name: string, variable_index: string, value: number) {
		return new ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VALUE({
			array_name,
			variable_index,
			value,
		});
	}
	print() {
		return `"${this.array_name}"["${this.variable_index}"] = ${this.value};`;
	}
}
export class ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VARIABLE extends Action {
	action: 'ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VARIABLE';
	array_name: string;
	variable_index: string;
	variable: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VARIABLE';
		this.array_name = tryString(args.array_name, `${this.action} param "array_name"`, debug);
		this.variable_index = tryString(
			args.variable_index,
			`${this.action} param "variable_index"`,
			debug,
		);
		this.variable = tryString(args.variable, `${this.action} param "variable"`, debug);
	}
	static quick(array_name: string, variable_index: string, variable: string) {
		return new ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VARIABLE({
			array_name,
			variable_index,
			variable,
		});
	}
	print() {
		return `"${this.array_name}"["${this.variable_index}"] = "${this.variable}";`;
	}
}
export class ARRAY_READ_FROM_INDEX_INTO_VARIABLE extends Action {
	action: 'ARRAY_READ_FROM_INDEX_INTO_VARIABLE';
	array_name: string;
	index: number;
	variable: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_READ_FROM_INDEX_INTO_VARIABLE';
		this.array_name = tryString(args.array_name, `${this.action} param "array_name"`, debug);
		this.index = tryNumber(args.index, `${this.action} param "index"`, debug);
		this.variable = tryString(args.variable, `${this.action} param "variable"`, debug);
	}
	static quick(array_name: string, index: number, variable: string) {
		return new ARRAY_READ_FROM_INDEX_INTO_VARIABLE({
			array_name,
			index,
			variable,
		});
	}
	print() {
		return `"${this.variable}" = "${this.array_name}"[${this.index}];`;
	}
}
export class ARRAY_READ_FROM_VARIABLE_INDEX_INTO_VARIABLE extends Action {
	action: 'ARRAY_READ_FROM_VARIABLE_INDEX_INTO_VARIABLE';
	array_name: string;
	variable_index: string;
	variable: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_READ_FROM_VARIABLE_INDEX_INTO_VARIABLE';
		this.array_name = tryString(args.array_name, `${this.action} param "array_name"`, debug);
		this.variable_index = tryString(
			args.variable_index,
			`${this.action} param "variable_index"`,
			debug,
		);
		this.variable = tryString(args.variable, `${this.action} param "variable"`, debug);
	}
	static quick(array_name: string, variable_index: string, variable: string): Action {
		return new ARRAY_READ_FROM_VARIABLE_INDEX_INTO_VARIABLE({
			array_name,
			variable_index,
			variable,
		});
	}
	print() {
		return `"${this.variable}" = "${this.array_name}"["${this.variable_index}"];`;
	}
}
export class ARRAY_PUSH_FROM_VALUE extends Action {
	action: 'ARRAY_PUSH_FROM_VALUE';
	array_name: string;
	value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_PUSH_FROM_VALUE';
		this.array_name = tryString(args.array_name, `${this.action} param "array_name"`, debug);
		this.value = tryNumber(args.value, `${this.action} param "value"`, debug);
	}
	static quick(array_name: string, value: number) {
		return new ARRAY_PUSH_FROM_VALUE({ array_name, value });
	}
	print() {
		return `"${this.array_name}".push(${this.value});`;
	}
}
export class ARRAY_PUSH_FROM_VARIABLE extends Action {
	action: 'ARRAY_PUSH_FROM_VARIABLE';
	array_name: string;
	variable: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_PUSH_FROM_VARIABLE';
		this.array_name = tryString(
			args.array_name,
			'ARRAY_PUSH_FROM_VARIABLE param "array_name"',
			debug,
		);
		this.variable = tryString(
			args.variable,
			'ARRAY_PUSH_FROM_VARIABLE param "variable"',
			debug,
		);
	}
	static quick(array_name: string, variable: string) {
		return new ARRAY_PUSH_FROM_VARIABLE({ array_name, variable });
	}
	print() {
		return `"${this.array_name}".push("${this.variable}");`;
	}
}
export class ARRAY_PUSH_LEFT_FROM_VALUE extends Action {
	action: 'ARRAY_PUSH_LEFT_FROM_VALUE';
	array_name: string;
	value: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_PUSH_LEFT_FROM_VALUE';
		this.array_name = tryString(
			args.array_name,
			'ARRAY_PUSH_LEFT_FROM_VALUE param "array_name"',
			debug,
		);
		this.value = tryNumber(args.value, 'ARRAY_PUSH_LEFT_FROM_VALUE param "value"', debug);
	}
	static quick(array_name: string, value: number) {
		return new ARRAY_PUSH_LEFT_FROM_VALUE({ array_name, value });
	}
	print() {
		return `"${this.array_name}".push_left(${this.value});`;
	}
}
export class ARRAY_PUSH_LEFT_FROM_VARIABLE extends Action {
	action: 'ARRAY_PUSH_LEFT_FROM_VARIABLE';
	array_name: string;
	variable: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_PUSH_LEFT_FROM_VARIABLE';
		this.array_name = tryString(
			args.array_name,
			'ARRAY_PUSH_LEFT_FROM_VARIABLE param "array_name"',
			debug,
		);
		this.variable = tryString(
			args.variable,
			'ARRAY_PUSH_LEFT_FROM_VARIABLE param "variable"',
			debug,
		);
	}
	static quick(array_name: string, variable: string) {
		return new ARRAY_PUSH_LEFT_FROM_VARIABLE({ array_name, variable });
	}
	print() {
		return `"${this.array_name}".push_left("${this.variable}");`;
	}
}
export class ARRAY_POP_INTO_VARIABLE extends Action {
	action: 'ARRAY_POP_INTO_VARIABLE';
	array_name: string;
	variable: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_POP_INTO_VARIABLE';
		this.array_name = tryString(
			args.array_name,
			'ARRAY_POP_INTO_VARIABLE param "array_name"',
			debug,
		);
		this.variable = tryString(args.variable, 'ARRAY_POP_INTO_VARIABLE param "variable"', debug);
	}
	static quick(array_name: string, variable: string) {
		return new ARRAY_POP_INTO_VARIABLE({ array_name, variable });
	}
	print() {
		return `"${this.variable}" = "${this.array_name}".pop();`;
	}
}
export class ARRAY_POP_LEFT_INTO_VARIABLE extends Action {
	action: 'ARRAY_POP_LEFT_INTO_VARIABLE';
	array_name: string;
	variable: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_POP_LEFT_INTO_VARIABLE';
		this.array_name = tryString(
			args.array_name,
			'ARRAY_POP_LEFT_INTO_VARIABLE param "array_name"',
			debug,
		);
		this.variable = tryString(
			args.variable,
			'ARRAY_POP_LEFT_INTO_VARIABLE param "variable"',
			debug,
		);
	}
	static quick(array_name: string, variable: string) {
		return new ARRAY_POP_LEFT_INTO_VARIABLE({ array_name, variable });
	}
	print() {
		return `"${this.variable}" = "${this.array_name}".pop_left();`;
	}
}
export class ARRAY_SLICE extends Action {
	action: 'ARRAY_SLICE';
	array_source: string;
	array_destination: string;
	index_start: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_SLICE';
		this.array_destination = tryString(
			args.array_destination,
			'ARRAY_SLICE param "array_destination"',
			debug,
		);
		this.array_source = tryString(args.array_source, 'ARRAY_SLICE param "array_source"', debug);
		this.index_start = tryNumber(args.index_start, 'ARRAY_SLICE param "index_start"', debug);
	}
	static quick(array_source: string, array_destination: string, index_start: number) {
		return new ARRAY_SLICE({ array_source, array_destination, index_start });
	}
	print() {
		return `"${this.array_destination}" = "${this.array_source}".slice(${this.index_start || ''});`;
	}
}
export class ARRAY_SLICE_BY_VARIABLE extends Action {
	action: 'ARRAY_SLICE_BY_VARIABLE';
	array_source: string;
	array_destination: string;
	variable_start: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_SLICE_BY_VARIABLE';
		this.array_source = tryString(
			args.array_source,
			'ARRAY_SLICE_BY_VARIABLE param "array_source"',
			debug,
		);
		this.array_destination = tryString(
			args.array_destination,
			'ARRAY_SLICE_BY_VARIABLE param "array_destination"',
			debug,
		);
		this.variable_start = tryString(
			args.variable_start,
			'ARRAY_SLICE_BY_VARIABLE param "variable_start"',
			debug,
		);
	}
	static quick(array_source: string, array_destination: string, variable_start: string) {
		return new ARRAY_SLICE_BY_VARIABLE({ array_source, array_destination, variable_start });
	}
	print() {
		return `"${this.array_destination}" = "${this.array_source}".slice(${`"${this.variable_start}"` || ''});`;
	}
}
export class ARRAY_SLICE_TWICE extends Action {
	action: 'ARRAY_SLICE_TWICE';
	array_source: string;
	array_destination: string;
	index_start: number;
	index_end: number;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_SLICE_TWICE';
		this.array_source = tryString(
			args.array_source,
			'ARRAY_SLICE_TWICE param "array_source"',
			debug,
		);
		this.array_destination = tryString(
			args.array_destination,
			'ARRAY_SLICE_TWICE param "array_destination"',
			debug,
		);
		this.index_start = tryNumber(
			args.index_start,
			'ARRAY_SLICE_TWICE param "index_start"',
			debug,
		);
		this.index_end = tryNumber(args.index_end, 'ARRAY_SLICE_TWICE param "index_end"', debug);
	}
	static quick(
		array_source: string,
		array_destination: string,
		index_start: number,
		index_end: number,
	) {
		return new ARRAY_SLICE_TWICE({ array_source, array_destination, index_start, index_end });
	}
	print() {
		return `"${this.array_destination}" = "${this.array_source}".slice(${this.index_start}, ${this.index_end});`;
	}
}
export class ARRAY_SLICE_TWICE_BY_VARIABLE extends Action {
	action: 'ARRAY_SLICE_TWICE_BY_VARIABLE';
	array_source: string;
	array_destination: string;
	variable_start: string;
	variable_end: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_SLICE_TWICE_BY_VARIABLE';
		this.array_source = tryString(
			args.array_source,
			'ARRAY_SLICE_TWICE_BY_VARIABLE param "array_source"',
			debug,
		);
		this.array_destination = tryString(
			args.array_destination,
			'ARRAY_SLICE_TWICE_BY_VARIABLE param "array_destination"',
			debug,
		);
		this.variable_start = tryString(
			args.variable_start,
			'ARRAY_SLICE_TWICE_BY_VARIABLE param "variable_start"',
			debug,
		);
		this.variable_end = tryString(
			args.variable_end,
			'ARRAY_SLICE_TWICE_BY_VARIABLE param "variable_end"',
			debug,
		);
	}
	static quick(
		array_source: string,
		array_destination: string,
		variable_start: string,
		variable_end: string,
	) {
		return new ARRAY_SLICE_TWICE_BY_VARIABLE({
			array_source,
			array_destination,
			variable_start,
			variable_end,
		});
	}
	print() {
		return `"${this.array_destination}" = "${this.array_source}".slice("${this.variable_start}", "${this.variable_end}");`;
	}
}
export class ARRAY_REVERSE extends Action {
	action: 'ARRAY_REVERSE';
	array_name: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_REVERSE';
		this.array_name = tryString(args.array_name, 'ARRAY_REVERSE param "array_name"', debug);
	}
	static quick(array_name: string) {
		return new ARRAY_REVERSE({ array_name });
	}
	print() {
		return `"${this.array_name}".reverse();`;
	}
}
export class ARRAY_SORT extends Action {
	action: 'ARRAY_SORT';
	array_name: string;
	constructor(args: GenericObj, debug?: MathlangLocation) {
		super(args);
		this.action = 'ARRAY_SORT';
		this.array_name = tryString(args.array_name, 'ARRAY_SORT param "array_name"', debug);
	}
	static quick(array_name: string) {
		return new ARRAY_SORT({ array_name });
	}
	print() {
		return `"${this.array_name}".sort();`;
	}
}

export type HasOneVariable = MUTATE_VARIABLE | CHECK_VARIABLE | COPY_VARIABLE;
export type HasTwoVariables = MUTATE_VARIABLES | CHECK_VARIABLES;
export type HasVariables = HasOneVariable | HasTwoVariables;
export const isHasVariables = (v: unknown): v is HasVariables => {
	if (v instanceof MUTATE_VARIABLE) return true;
	if (v instanceof MUTATE_VARIABLES) return true;
	if (v instanceof CHECK_VARIABLE) return true;
	if (v instanceof CHECK_VARIABLES) return true;
	if (v instanceof COPY_VARIABLE) return true;
	return false;
};

export type MightHaveLabel = CheckAction | GOTO_ACTION_INDEX | LABEL | LabelDefinition | GotoLabel;
export const isMightHaveLabel = (v: unknown): v is MightHaveLabel => {
	if (v instanceof CheckAction) return true;
	if (v instanceof GOTO_ACTION_INDEX) return true;
	if (v instanceof LABEL) return true;
	if (v instanceof LabelDefinition) return true;
	if (v instanceof GotoLabel) return true;
	return false;
};

export const breakIfNotTSNodeArray = (v: unknown): TreeSitterNode[] => {
	if (Array.isArray(v) && v.every((v) => v instanceof TreeSitterNode)) return v;
	throw new Error('not a TreeSitterNode array');
};
export const breakIfNotTSNode = (v: unknown): TreeSitterNode => {
	if (v instanceof TreeSitterNode) return v;
	throw new Error('not a TreeSitterNode');
};
export const breakIfNotStringArray = (v: unknown): string[] => {
	if (Array.isArray(v) && v.every((v) => typeof v === 'string')) return v;
	throw new Error('not a string or a string array');
};
export const breakIfNotStringOrStringArray = (v: unknown): string | string[] => {
	if (typeof v === 'string') return v;
	if (Array.isArray(v) && v.every((v) => typeof v === 'string')) return v;
	throw new Error('not a string or a strng array');
};
export const breakIfNotString = (v: unknown): string => {
	if (typeof v === 'string') return v;
	throw new Error('not a string');
};
export const breakIfNotStringOrNumber = (v: unknown): string | number => {
	if (typeof v === 'string') return v;
	if (typeof v === 'number') return v;
	throw new Error('not a string or number');
};
export const breakIfNotNumber = (v: unknown): number => {
	if (typeof v === 'number') return v;
	throw new Error('not a number');
};
export const breakIfNotBool = (v: unknown): boolean => {
	if (typeof v === 'boolean') return v;
	throw new Error('not a boolean');
};

export const actionConstructorLookup: Record<string, (args: GenericObj, debug?: MathlangLocation) => Action > = {
	NULL_ACTION: (args) => new NULL_ACTION(args),
	COPY_SCRIPT: (args, debug) => new COPY_SCRIPT(args, debug),
	LABEL: (args, debug) => new LABEL(args, debug),
	RUN_SCRIPT: (args, debug) => new RUN_SCRIPT(args, debug),
	BLOCKING_DELAY: (args, debug) => new BLOCKING_DELAY(args, debug),
	NON_BLOCKING_DELAY: (args, debug) => new NON_BLOCKING_DELAY(args, debug),
	UNREGISTER_SERIAL_DIALOG_COMMAND: (args, debug) => {
		return new UNREGISTER_SERIAL_DIALOG_COMMAND(args, debug);
	},
	UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT: (args, debug) => {
		return new UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT(args, debug);
	},
	SET_ENTITY_NAME: (args, debug) => new SET_ENTITY_NAME(args, debug),
	SET_ENTITY_X: (args, debug) => new SET_ENTITY_X(args, debug),
	SET_ENTITY_Y: (args, debug) => new SET_ENTITY_Y(args, debug),
	SET_ENTITY_INTERACT_SCRIPT: (args, debug) => new SET_ENTITY_INTERACT_SCRIPT(args, debug),
	SET_ENTITY_TICK_SCRIPT: (args, debug) => new SET_ENTITY_TICK_SCRIPT(args, debug),
	SET_ENTITY_TYPE: (args, debug) => new SET_ENTITY_TYPE(args, debug),
	SET_ENTITY_PRIMARY_ID: (args, debug) => new SET_ENTITY_PRIMARY_ID(args, debug),
	SET_ENTITY_SECONDARY_ID: (args, debug) => new SET_ENTITY_SECONDARY_ID(args, debug),
	SET_ENTITY_PRIMARY_ID_TYPE: (args, debug) => new SET_ENTITY_PRIMARY_ID_TYPE(args, debug),
	SET_ENTITY_CURRENT_ANIMATION: (args, debug) => {
		return new SET_ENTITY_CURRENT_ANIMATION(args, debug);
	},
	SET_ENTITY_CURRENT_FRAME: (args, debug) => new SET_ENTITY_CURRENT_FRAME(args, debug),
	SET_ENTITY_DIRECTION: (args, debug) => new SET_ENTITY_DIRECTION(args, debug),
	SET_ENTITY_DIRECTION_RELATIVE: (args, debug) => {
		return new SET_ENTITY_DIRECTION_RELATIVE(args, debug);
	},
	SET_ENTITY_DIRECTION_TARGET_ENTITY: (args, debug) => {
		return new SET_ENTITY_DIRECTION_TARGET_ENTITY(args, debug);
	},
	SET_ENTITY_DIRECTION_TARGET_GEOMETRY: (args, debug) => {
		return new SET_ENTITY_DIRECTION_TARGET_GEOMETRY(args, debug);
	},
	SET_ENTITY_GLITCHED: (args, debug) => new SET_ENTITY_GLITCHED(args, debug),
	SET_ENTITY_PATH: (args, debug) => new SET_ENTITY_PATH(args, debug),
	SET_SAVE_FLAG: (args, debug) => new SET_SAVE_FLAG(args, debug),
	SET_PLAYER_CONTROL: (args, debug) => new SET_PLAYER_CONTROL(args, debug),
	SET_MAP_TICK_SCRIPT: (args, debug) => new SET_MAP_TICK_SCRIPT(args, debug),
	SET_HEX_CURSOR_LOCATION: (args, debug) => new SET_HEX_CURSOR_LOCATION(args, debug),
	SET_WARP_STATE: (args, debug) => new SET_WARP_STATE(args, debug),
	SET_HEX_EDITOR_STATE: (args, debug) => new SET_HEX_EDITOR_STATE(args, debug),
	SET_HEX_EDITOR_DIALOG_MODE: (args, debug) => new SET_HEX_EDITOR_DIALOG_MODE(args, debug),
	SET_HEX_EDITOR_CONTROL: (args, debug) => new SET_HEX_EDITOR_CONTROL(args, debug),
	SET_HEX_EDITOR_CONTROL_CLIPBOARD: (args, debug) => {
		return new SET_HEX_EDITOR_CONTROL_CLIPBOARD(args, debug);
	},
	LOAD_MAP: (args, debug) => new LOAD_MAP(args, debug),
	SHOW_DIALOG: (args, debug) => new SHOW_DIALOG(args, debug),
	PLAY_ENTITY_ANIMATION: (args, debug) => new PLAY_ENTITY_ANIMATION(args, debug),
	TELEPORT_ENTITY_TO_GEOMETRY: (args, debug) => new TELEPORT_ENTITY_TO_GEOMETRY(args, debug),
	WALK_ENTITY_TO_GEOMETRY: (args, debug) => new WALK_ENTITY_TO_GEOMETRY(args, debug),
	WALK_ENTITY_ALONG_GEOMETRY: (args, debug) => new WALK_ENTITY_ALONG_GEOMETRY(args, debug),
	LOOP_ENTITY_ALONG_GEOMETRY: (args, debug) => new LOOP_ENTITY_ALONG_GEOMETRY(args, debug),
	SET_CAMERA_TO_FOLLOW_ENTITY: (args, debug) => new SET_CAMERA_TO_FOLLOW_ENTITY(args, debug),
	TELEPORT_CAMERA_TO_GEOMETRY: (args, debug) => new TELEPORT_CAMERA_TO_GEOMETRY(args, debug),
	PAN_CAMERA_TO_ENTITY: (args, debug) => new PAN_CAMERA_TO_ENTITY(args, debug),
	PAN_CAMERA_TO_GEOMETRY: (args, debug) => new PAN_CAMERA_TO_GEOMETRY(args, debug),
	PAN_CAMERA_ALONG_GEOMETRY: (args, debug) => new PAN_CAMERA_ALONG_GEOMETRY(args, debug),
	LOOP_CAMERA_ALONG_GEOMETRY: (args, debug) => new LOOP_CAMERA_ALONG_GEOMETRY(args, debug),
	SET_SCREEN_SHAKE: (args, debug) => new SET_SCREEN_SHAKE(args, debug),
	SCREEN_FADE_OUT: (args, debug) => new SCREEN_FADE_OUT(args, debug),
	SCREEN_FADE_IN: (args, debug) => new SCREEN_FADE_IN(args, debug),
	MUTATE_VARIABLE: (args, debug) => new MUTATE_VARIABLE(args, debug),
	MUTATE_VARIABLES: (args, debug) => new MUTATE_VARIABLES(args, debug),
	COPY_VARIABLE: (args, debug) => new COPY_VARIABLE(args, debug),
	SLOT_SAVE: (args) => new SLOT_SAVE(args),
	SLOT_LOAD: (args, debug) => new SLOT_LOAD(args, debug),
	SLOT_ERASE: (args, debug) => new SLOT_ERASE(args, debug),
	SET_CONNECT_SERIAL_DIALOG: (args, debug) => new SET_CONNECT_SERIAL_DIALOG(args, debug),
	SHOW_SERIAL_DIALOG: (args, debug) => new SHOW_SERIAL_DIALOG(args, debug),
	SET_MAP_LOOK_SCRIPT: (args, debug) => new SET_MAP_LOOK_SCRIPT(args, debug),
	SET_ENTITY_LOOK_SCRIPT: (args, debug) => new SET_ENTITY_LOOK_SCRIPT(args, debug),
	SET_TELEPORT_ENABLED: (args, debug) => new SET_TELEPORT_ENABLED(args, debug),
	SET_BLE_FLAG: (args, debug) => new SET_BLE_FLAG(args, debug),
	SET_SERIAL_DIALOG_CONTROL: (args, debug) => new SET_SERIAL_DIALOG_CONTROL(args, debug),
	REGISTER_SERIAL_DIALOG_COMMAND: (args, debug) => {
		return new REGISTER_SERIAL_DIALOG_COMMAND(args, debug);
	},
	REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT: (args, debug) => {
		return new REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT(args, debug);
	},
	SET_ENTITY_MOVEMENT_RELATIVE: (args, debug) => {
		return new SET_ENTITY_MOVEMENT_RELATIVE(args, debug);
	},
	CLOSE_DIALOG: (args) => new CLOSE_DIALOG(args),
	CLOSE_SERIAL_DIALOG: (args) => new CLOSE_SERIAL_DIALOG(args),
	SET_LIGHTS_CONTROL: (args, debug) => new SET_LIGHTS_CONTROL(args, debug),
	SET_LIGHTS_STATE: (args, debug) => new SET_LIGHTS_STATE(args, debug),
	GOTO_ACTION_INDEX: (args, debug) => new GOTO_ACTION_INDEX(args, debug),
	SET_SCRIPT_PAUSE: (args, debug) => new SET_SCRIPT_PAUSE(args, debug),
	REGISTER_SERIAL_DIALOG_COMMAND_ALIAS: (args, debug) => {
		return new REGISTER_SERIAL_DIALOG_COMMAND_ALIAS(args, debug);
	},
	UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS: (args, debug) => {
		return new UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS(args, debug);
	},
	SET_SERIAL_DIALOG_COMMAND_VISIBILITY: (args, debug) => {
		return new SET_SERIAL_DIALOG_COMMAND_VISIBILITY(args, debug);
	},
	CHECK_ENTITY_NAME: (args, debug) => new CHECK_ENTITY_NAME(args, debug),
	CHECK_ENTITY_X: (args, debug) => new CHECK_ENTITY_X(args, debug),
	CHECK_ENTITY_Y: (args, debug) => new CHECK_ENTITY_Y(args, debug),
	CHECK_ENTITY_INTERACT_SCRIPT: (args, debug) => {
		return new CHECK_ENTITY_INTERACT_SCRIPT(args, debug);
	},
	CHECK_ENTITY_TICK_SCRIPT: (args, debug) => new CHECK_ENTITY_TICK_SCRIPT(args, debug),
	CHECK_ENTITY_LOOK_SCRIPT: (args, debug) => new CHECK_ENTITY_LOOK_SCRIPT(args, debug),
	CHECK_ENTITY_TYPE: (args, debug) => new CHECK_ENTITY_TYPE(args, debug),
	CHECK_ENTITY_PRIMARY_ID: (args, debug) => new CHECK_ENTITY_PRIMARY_ID(args, debug),
	CHECK_ENTITY_SECONDARY_ID: (args, debug) => new CHECK_ENTITY_SECONDARY_ID(args, debug),
	CHECK_ENTITY_PRIMARY_ID_TYPE: (args, debug) => {
		return new CHECK_ENTITY_PRIMARY_ID_TYPE(args, debug);
	},
	CHECK_ENTITY_CURRENT_ANIMATION: (args, debug) => {
		return new CHECK_ENTITY_CURRENT_ANIMATION(args, debug);
	},
	CHECK_ENTITY_CURRENT_FRAME: (args, debug) => new CHECK_ENTITY_CURRENT_FRAME(args, debug),
	CHECK_ENTITY_DIRECTION: (args, debug) => new CHECK_ENTITY_DIRECTION(args, debug),
	CHECK_ENTITY_GLITCHED: (args, debug) => new CHECK_ENTITY_GLITCHED(args, debug),
	CHECK_ENTITY_PATH: (args, debug) => new CHECK_ENTITY_PATH(args, debug),
	CHECK_SAVE_FLAG: (args, debug) => new CHECK_SAVE_FLAG(args, debug),
	CHECK_IF_ENTITY_IS_IN_GEOMETRY: (args, debug) => {
		return new CHECK_IF_ENTITY_IS_IN_GEOMETRY(args, debug);
	},
	CHECK_FOR_BUTTON_PRESS: (args, debug) => new CHECK_FOR_BUTTON_PRESS(args, debug),
	CHECK_FOR_BUTTON_STATE: (args, debug) => new CHECK_FOR_BUTTON_STATE(args, debug),
	CHECK_WARP_STATE: (args, debug) => new CHECK_WARP_STATE(args, debug),
	CHECK_VARIABLE: (args, debug) => new CHECK_VARIABLE(args, debug),
	CHECK_VARIABLES: (args, debug) => new CHECK_VARIABLES(args, debug),
	CHECK_MAP: (args, debug) => new CHECK_MAP(args, debug),
	CHECK_BLE_FLAG: (args, debug) => new CHECK_BLE_FLAG(args, debug),
	CHECK_DIALOG_OPEN: (args, debug) => new CHECK_DIALOG_OPEN(args, debug),
	CHECK_SERIAL_DIALOG_OPEN: (args, debug) => new CHECK_SERIAL_DIALOG_OPEN(args, debug),
	CHECK_DEBUG_MODE: (args, debug) => new CHECK_DEBUG_MODE(args, debug),
	ARRAY_LOG: (args, debug) => new ARRAY_LOG(args, debug),
	ARRAY_NEW: (args, debug) => new ARRAY_NEW(args, debug),
	ARRAY_DELETE: (args, debug) => new ARRAY_DELETE(args, debug),
	ARRAY_LENGTH_INTO_VARIABLE: (args, debug) => new ARRAY_LENGTH_INTO_VARIABLE(args, debug),
	ARRAY_WRITE_INTO_INDEX_FROM_VALUE: (args, debug) => {
		return new ARRAY_WRITE_INTO_INDEX_FROM_VALUE(args, debug);
	},
	ARRAY_WRITE_INTO_INDEX_FROM_VARIABLE: (args, debug) => {
		return new ARRAY_WRITE_INTO_INDEX_FROM_VARIABLE(args, debug);
	},
	ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VALUE: (args, debug) => {
		return new ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VALUE(args, debug);
	},
	ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VARIABLE: (args, debug) => {
		return new ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VARIABLE(args, debug);
	},
	ARRAY_READ_FROM_INDEX_INTO_VARIABLE: (args, debug) => {
		return new ARRAY_READ_FROM_INDEX_INTO_VARIABLE(args, debug);
	},
	ARRAY_READ_FROM_VARIABLE_INDEX_INTO_VARIABLE: (args, debug) => {
		return new ARRAY_READ_FROM_VARIABLE_INDEX_INTO_VARIABLE(args, debug);
	},
	ARRAY_PUSH_FROM_VALUE: (args, debug) => new ARRAY_PUSH_FROM_VALUE(args, debug),
	ARRAY_PUSH_FROM_VARIABLE: (args, debug) => new ARRAY_PUSH_FROM_VARIABLE(args, debug),
	ARRAY_PUSH_LEFT_FROM_VALUE: (args, debug) => new ARRAY_PUSH_LEFT_FROM_VALUE(args, debug),
	ARRAY_PUSH_LEFT_FROM_VARIABLE: (args, debug) => new ARRAY_PUSH_LEFT_FROM_VARIABLE(args, debug),
	ARRAY_SLICE: (args, debug) => new ARRAY_SLICE(args, debug),
	ARRAY_SLICE_BY_VARIABLE: (args, debug) => new ARRAY_SLICE_BY_VARIABLE(args, debug),
	ARRAY_SLICE_TWICE: (args, debug) => new ARRAY_SLICE_TWICE(args, debug),
	ARRAY_SLICE_TWICE_BY_VARIABLE: (args, debug) => new ARRAY_SLICE_TWICE_BY_VARIABLE(args, debug),
	ARRAY_POP_INTO_VARIABLE: (args, debug) => new ARRAY_POP_INTO_VARIABLE(args, debug),
	ARRAY_POP_LEFT_INTO_VARIABLE: (args, debug) => new ARRAY_POP_LEFT_INTO_VARIABLE(args, debug),
	ARRAY_REVERSE: (args, debug) => new ARRAY_REVERSE(args, debug),
	ARRAY_SORT: (args, debug) => new ARRAY_SORT(args, debug),
};

// more nuanced!???!

const tryString = (v: unknown, label?: string, debug?: MathlangLocation) => {
	if (debug) return coerceToString(debug, v, label);
	return breakIfNotString(v);
};

const tryStringOrStringArray = (v: unknown, label?: string, debug?: MathlangLocation) => {
	if (Array.isArray(v)) {
		return v.map((w, i) => {
			const innerLabel = label ? label + `[${i}]` : label;
			return tryString(w, innerLabel, debug);
		});
	}
	if (debug) return coerceToString(debug, v, label);
	return breakIfNotString(v);
};

const tryNumber = (v: unknown, label?: string, debug?: MathlangLocation) => {
	if (debug) return coerceToNumber(debug, v, label);
	return breakIfNotNumber(v);
};

const tryStringOrNumber = (v: unknown, label?: string, debug?: MathlangLocation) => {
	if (typeof v === 'number') return v;
	if (typeof v === 'string') return v;
	if (debug) {
		if (label) {
			debug.f.newError(
				new MathlangMessage([debug], 'value wrong type', `${label} is not a number`),
			);
		}
		return debug.node.text;
	}
	return breakIfNotStringOrNumber(v);
};

const tryBool = (v: unknown, label?: string, debug?: MathlangLocation) => {
	if (debug) return coerceToBool(debug, v, label);
	return breakIfNotBool(v);
};
