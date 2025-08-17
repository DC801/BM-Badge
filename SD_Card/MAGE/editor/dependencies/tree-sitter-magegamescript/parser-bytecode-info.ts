import { Node as TreeSitterNode } from 'web-tree-sitter';
import {
	AnyNode,
	GotoLabel,
	CommentNode,
	MathlangLocation,
	CheckSaveFlag,
} from './parser-types.ts';
import { type GenericObj } from './parser-actions.ts';
import { FileState } from './parser-file.ts';
import { inverseOpMap, simpleBranchMaker } from './parser-utilities.ts';

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
	clone() {
		const fn = actionConstructorLookup[this.action];
		if (!fn) throw new Error('no action constructor for ' + this.action);
		return fn(this);
	}
	print() {
		return `json[${JSON.stringify(this, null, '\t')}]`;
	}
	static fromArgs(args: unknown) {
		if (typeof args !== 'object' || args === null) {
			throw new Error('cannot make Action from non-object');
		}
		const actionName = breakIfNotString((args as Action).action);
		if (actionConstructorLookup[actionName]) {
			return actionConstructorLookup[actionName](args);
		}
	}
}

// ---------------------------------- SUPER TYPES ---------------------------------- \\

export class CheckAction extends Action {
	comment?: string;
	success_script?: string;
	label?: string;
	jump_index?: number | string;
	expected_bool: boolean;
	constructor() {
		super();
		this.expected_bool = true;
	}
	getBool() {
		return this.expected_bool;
	}
	invert() {
		this.expected_bool = !this.expected_bool;
		return this;
	}
}

export class BoolGetableAction extends CheckAction {}
export class StringCheckableAction extends CheckAction {
	constructor() {
		super();
	}
	updateProp(prop: string) {
		this.comment = prop;
		throw new Error(`the parent method shouldn't be used`);
		// just making the red squiggles go away; todo learn best practices
	}
}
export class NumberComparisonAction extends CheckAction {
	constructor() {
		super();
	}
	updateProp(prop: boolean) {
		// to make squiggles go away; not used
		this.expected_bool = prop;
	}
}
export class NumberCheckableEqualityAction extends CheckAction {
	constructor() {
		super();
	}
	updateProp(prop: string | number) {
		// to make squiggles go away; not used
		this.jump_index = prop;
	}
}

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
export const printEntityFieldEquality = (v, param, value: number | string): string => {
	const lhs = `${printEntityIdentifier(v.entity)} ${param}`;
	return v.expected_bool
		? printCheckAction(v, `${lhs} == ${value}`, false)
		: printCheckAction(v, `${lhs} != ${value}`, false);
};

// ---------------------------------- ACTUAL BYTECODE JSON ---------------------------------- \\

// Todo: might not need the "debug" stuff; if actual action, errors would be reported at generation.
// No need to keep tree sitter nodes around, perhaps?

// not in encoder, but in old-style output
export class NULL_ACTION extends Action {
	action: 'NULL_ACTION';
	constructor() {
		super();
		this.action = 'NULL_ACTION';
	}
	print() {
		return `// NULL_ACTION`;
	}
}
export class LABEL extends Action {
	action: 'LABEL';
	value: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'LABEL';
		this.value = breakIfNotString(args.value);
	}
	print() {
		return `${sanitizeLabel(this.value)}:`;
	}
}
export class RUN_SCRIPT extends Action {
	action: 'RUN_SCRIPT';
	script: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'RUN_SCRIPT';
		this.script = breakIfNotString(args.script);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'BLOCKING_DELAY';
		this.duration = breakIfNotNumber(args.duration);
	}
	print() {
		return `block ${printDuration(this.duration)};`;
	}
}
export class NON_BLOCKING_DELAY extends Action {
	action: 'NON_BLOCKING_DELAY';
	duration: number;
	constructor(args: GenericObj) {
		super();
		this.action = 'NON_BLOCKING_DELAY';
		this.duration = breakIfNotNumber(args.duration);
	}
	print() {
		return `wait ${printDuration(this.duration)};`;
	}
}
export class SET_ENTITY_NAME extends Action {
	action: 'SET_ENTITY_NAME';
	entity: string;
	string: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_NAME';
		this.entity = breakIfNotString(args.entity);
		this.string = breakIfNotString(args.string);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_X';
		this.entity = breakIfNotString(args.entity);
		this.u2_value = breakIfNotNumber(args.u2_value);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_Y';
		this.entity = breakIfNotString(args.entity);
		this.u2_value = breakIfNotNumber(args.u2_value);
	}
	static quick(entity: string, u2_value: number) {
		return new SET_ENTITY_Y({ entity, u2_value });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} y = ${this.u2_value};`;
	}
}
export class SET_ENTITY_INTERACT_SCRIPT extends Action {
	action: 'SET_ENTITY_INTERACT_SCRIPT';
	entity: string;
	script: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_INTERACT_SCRIPT';
		this.entity = breakIfNotString(args.entity);
		this.script = breakIfNotString(args.script);
	}
	static quick(entity: string, script: string) {
		return new SET_ENTITY_INTERACT_SCRIPT({ entity, script });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} on_interact = "${this.script}";`;
	}
}
export class SET_ENTITY_TICK_SCRIPT extends Action {
	action: 'SET_ENTITY_TICK_SCRIPT';
	entity: string;
	script: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_TICK_SCRIPT';
		this.entity = breakIfNotString(args.entity);
		this.script = breakIfNotString(args.script);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_TYPE';
		this.entity = breakIfNotString(args.entity);
		this.entity_type = breakIfNotString(args.entity_type);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_PRIMARY_ID';
		this.entity = breakIfNotString(args.entity);
		this.u2_value = breakIfNotNumber(args.u2_value);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_SECONDARY_ID';
		this.entity = breakIfNotString(args.entity);
		this.u2_value = breakIfNotNumber(args.u2_value);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_PRIMARY_ID_TYPE';
		this.entity = breakIfNotString(args.entity);
		this.byte_value = breakIfNotNumber(args.byte_value);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_CURRENT_ANIMATION';
		this.entity = breakIfNotString(args.entity);
		this.byte_value = breakIfNotNumber(args.byte_value);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_CURRENT_FRAME';
		this.entity = breakIfNotString(args.entity);
		this.byte_value = breakIfNotNumber(args.byte_value);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_DIRECTION_RELATIVE';
		this.entity = breakIfNotString(args.entity);
		this.relative_direction = breakIfNotNumber(args.relative_direction);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_DIRECTION';
		this.entity = breakIfNotString(args.entity);
		this.direction = breakIfNotString(args.direction);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_DIRECTION_TARGET_ENTITY';
		this.entity = breakIfNotString(args.entity);
		this.target_entity = breakIfNotString(args.target_entity);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_DIRECTION_TARGET_GEOMETRY';
		this.entity = breakIfNotString(args.entity);
		this.target_geometry = breakIfNotString(args.target_geometry);
	}
	static quick(entity: string, target_geometry: string) {
		return new SET_ENTITY_DIRECTION_TARGET_GEOMETRY({ entity, target_geometry });
	}
	print() {
		return `${printEntityIdentifier(this.entity)} direction = ${printGeometry(this.target_geometry)};`;
	}
}
export class SET_ENTITY_GLITCHED extends Action {
	action: 'SET_ENTITY_GLITCHED';
	entity: string;
	bool_value: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_GLITCHED';
		this.entity = breakIfNotString(args.entity);
		this.bool_value = breakIfNotBool(args.bool_value);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_PATH';
		this.entity = breakIfNotString(args.entity);
		this.geometry = breakIfNotString(args.geometry);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'COPY_SCRIPT';
		this.script = breakIfNotString(args.script);
		if (args.search_and_replace) {
			const search_and_replace = {};
			Object.entries(args.search_and_replace).forEach(([k, v]) => {
				if (typeof k === 'string' && typeof v === 'string') search_and_replace[k] = v;
			});
			this.search_and_replace = search_and_replace;
		}
	}
	static quick(script: string) {
		return new COPY_SCRIPT({ script });
	}
	print() {
		if (!this.search_and_replace) {
			return `copy!("${this.script}")`;
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
export class SET_SAVE_FLAG extends Action {
	action: 'SET_SAVE_FLAG';
	save_flag: string;
	bool_value: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_SAVE_FLAG';
		this.save_flag = breakIfNotString(args.save_flag);
		this.bool_value = breakIfNotBool(args.bool_value);
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
	static toFlag(
		f: FileState,
		node: TreeSitterNode,
		save_flag: string,
		source: string,
		invert?: boolean,
	) {
		const actionIfTrue = SET_SAVE_FLAG.toValue(save_flag, true);
		const actionIfFalse = SET_SAVE_FLAG.toValue(save_flag, false);
		const debug = new MathlangLocation(f, node);
		return simpleBranchMaker(
			f,
			node,
			CheckSaveFlag.quick(debug, source, !invert),
			[actionIfTrue],
			[actionIfFalse],
		);
	}
	print() {
		return printSetBoolAction(this, `"${this.save_flag}"`);
	}
}
export class SET_PLAYER_CONTROL extends Action {
	action: 'SET_PLAYER_CONTROL';
	bool_value: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_PLAYER_CONTROL';
		this.bool_value = breakIfNotBool(args.bool_value);
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
export class SET_MAP_TICK_SCRIPT extends Action {
	action: 'SET_MAP_TICK_SCRIPT';
	script: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_MAP_TICK_SCRIPT';
		this.script = breakIfNotString(args.script);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_HEX_CURSOR_LOCATION';
		this.address = breakIfNotNumber(args.address);
	}
	// todo print?
}
export class SET_WARP_STATE extends Action {
	action: 'SET_WARP_STATE';
	string: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_WARP_STATE';
		this.string = breakIfNotString(args.string);
	}
	print() {
		return `warp_state = "${this.string}";`;
	}
}
export class SET_HEX_EDITOR_STATE extends Action {
	action: 'SET_HEX_EDITOR_STATE';
	bool_value: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_HEX_EDITOR_STATE';
		this.bool_value = breakIfNotBool(args.bool_value);
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
export class SET_HEX_EDITOR_DIALOG_MODE extends Action {
	action: 'SET_HEX_EDITOR_DIALOG_MODE';
	bool_value: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_HEX_EDITOR_DIALOG_MODE';
		this.bool_value = breakIfNotBool(args.bool_value);
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
export class SET_HEX_EDITOR_CONTROL extends Action {
	action: 'SET_HEX_EDITOR_CONTROL';
	bool_value: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_HEX_EDITOR_CONTROL';
		this.bool_value = breakIfNotBool(args.bool_value);
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
export class SET_HEX_EDITOR_CONTROL_CLIPBOARD extends Action {
	action: 'SET_HEX_EDITOR_CONTROL_CLIPBOARD';
	bool_value: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_HEX_EDITOR_CONTROL_CLIPBOARD';
		this.bool_value = breakIfNotBool(args.bool_value);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'LOAD_MAP';
		this.map = breakIfNotString(args.map);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SHOW_DIALOG';
		this.dialog = breakIfNotString(args.dialog);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'PLAY_ENTITY_ANIMATION';
		this.entity = breakIfNotString(args.entity);
		this.animation = breakIfNotNumber(args.animation);
		this.play_count = breakIfNotNumber(args.play_count);
	}
	print() {
		return `${printEntityIdentifier(this.entity)} animation -> ${this.animation} ${this.play_count}x;`;
	}
}
export class TELEPORT_ENTITY_TO_GEOMETRY extends Action {
	action: 'TELEPORT_ENTITY_TO_GEOMETRY';
	geometry: string;
	entity: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'TELEPORT_ENTITY_TO_GEOMETRY';
		this.entity = breakIfNotString(args.entity);
		this.geometry = breakIfNotString(args.geometry);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'WALK_ENTITY_TO_GEOMETRY';
		this.geometry = breakIfNotString(args.geometry);
		this.entity = breakIfNotString(args.entity);
		this.duration = breakIfNotNumber(args.duration);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'WALK_ENTITY_ALONG_GEOMETRY';
		this.geometry = breakIfNotString(args.geometry);
		this.entity = breakIfNotString(args.entity);
		this.duration = breakIfNotNumber(args.duration);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'LOOP_ENTITY_ALONG_GEOMETRY';
		this.geometry = breakIfNotString(args.geometry);
		this.entity = breakIfNotString(args.entity);
		this.duration = breakIfNotNumber(args.duration);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_CAMERA_TO_FOLLOW_ENTITY';
		this.entity = breakIfNotString(args.entity);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'TELEPORT_CAMERA_TO_GEOMETRY';
		this.geometry = breakIfNotString(args.geometry);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'PAN_CAMERA_TO_ENTITY';
		this.entity = breakIfNotString(args.entity);
		this.duration = breakIfNotNumber(args.duration);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'PAN_CAMERA_TO_GEOMETRY';
		this.geometry = breakIfNotString(args.geometry);
		this.duration = breakIfNotNumber(args.duration);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'PAN_CAMERA_ALONG_GEOMETRY';
		this.geometry = breakIfNotString(args.geometry);
		this.duration = breakIfNotNumber(args.duration);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'LOOP_CAMERA_ALONG_GEOMETRY';
		this.geometry = breakIfNotString(args.geometry);
		this.duration = breakIfNotNumber(args.duration);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_SCREEN_SHAKE';
		this.duration = breakIfNotNumber(args.duration);
		this.frequency = breakIfNotNumber(args.frequency);
		this.amplitude = breakIfNotNumber(args.amplitude);
	}
	print() {
		return `camera shake -> ${this.frequency}ms ${this.amplitude}px over ${printDuration(this.duration)};`;
	}
}
export class SCREEN_FADE_OUT extends Action {
	action: 'SCREEN_FADE_OUT';
	duration: number;
	color: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'SCREEN_FADE_OUT';
		this.duration = breakIfNotNumber(args.duration);
		this.color = breakIfNotString(args.color);
	}
	print() {
		return `camera fade out -> ${this.color} over ${printDuration(this.duration)};`;
	}
}
export class SCREEN_FADE_IN extends Action {
	action: 'SCREEN_FADE_IN';
	duration: number;
	color: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'SCREEN_FADE_IN';
		this.duration = breakIfNotNumber(args.duration);
		this.color = breakIfNotString(args.color);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'MUTATE_VARIABLE';
		this.variable = breakIfNotString(args.variable);
		this.operation = breakIfNotString(args.operation);
		this.value = breakIfNotNumber(args.value);
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
	print() {
		return `"${this.variable}" ${stringIntoOpMap[this.operation]}= ${this.value};`;
	}
}
export class MUTATE_VARIABLES extends Action {
	action: 'MUTATE_VARIABLES';
	variable: string;
	operation: string;
	source: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'MUTATE_VARIABLES';
		this.variable = breakIfNotString(args.variable);
		this.operation = breakIfNotString(args.operation);
		this.source = breakIfNotString(args.source);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'COPY_VARIABLE';
		this.variable = breakIfNotString(args.variable);
		this.entity = breakIfNotString(args.entity);
		this.field = breakIfNotString(args.field);
		this.inbound = breakIfNotBool(args.inbound);
	}
	static intoField(variable: string, entity: string, field: string) {
		return new COPY_VARIABLE({ entity, field, inbound: false, variable });
	}
	static intoVariable(entity: string, field: string, variable: string) {
		return new COPY_VARIABLE({ entity, field, inbound: true, variable });
	}
	print() {
		return this.inbound
			? `"${this.variable}" = ${printEntityIdentifier(this.entity)} ${this.field};`
			: `${printEntityIdentifier(this.entity)} ${this.field} = "${this.variable}";`;
	}
}
export class SLOT_SAVE extends Action {
	action: 'SLOT_SAVE';
	constructor() {
		super();
		this.action = 'SLOT_SAVE';
	}
	print() {
		return `save slot;`;
	}
}
export class SLOT_LOAD extends Action {
	action: 'SLOT_LOAD';
	slot: number;
	constructor(args: GenericObj) {
		super();
		this.action = 'SLOT_LOAD';
		this.slot = breakIfNotNumber(args.slot);
	}
	print() {
		return `load slot ${this.slot};`;
	}
}
export class SLOT_ERASE extends Action {
	action: 'SLOT_ERASE';
	slot: number;
	constructor(args: GenericObj) {
		super();
		this.action = 'SLOT_ERASE';
		this.slot = breakIfNotNumber(args.slot);
	}
	print() {
		return `erase slot ${this.slot};`;
	}
}
export class SET_CONNECT_SERIAL_DIALOG extends Action {
	action: 'SET_CONNECT_SERIAL_DIALOG';
	serial_dialog: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_CONNECT_SERIAL_DIALOG';
		this.serial_dialog = breakIfNotString(args.serial_dialog);
	}
	print() {
		return `serial_connect = "${this.serial_dialog}";`;
	}
}
export class SHOW_SERIAL_DIALOG extends Action {
	action: 'SHOW_SERIAL_DIALOG';
	serial_dialog: string;
	disable_newline?: boolean; // might be absent on old stuff
	constructor(args: GenericObj) {
		super();
		this.action = 'SHOW_SERIAL_DIALOG';
		this.serial_dialog = breakIfNotString(args.serial_dialog);
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
export class SET_MAP_LOOK_SCRIPT extends Action {
	action: 'SET_MAP_LOOK_SCRIPT';
	script: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_MAP_LOOK_SCRIPT';
		this.script = breakIfNotString(args.script);
	}
	static quick(script: string) {
		return new SET_MAP_LOOK_SCRIPT({ script });
	}
	print() {
		return `map on_look = "${this.script}";`;
	}
}
export class SET_ENTITY_LOOK_SCRIPT extends Action {
	action: 'SET_ENTITY_LOOK_SCRIPT';
	script: string;
	entity: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_LOOK_SCRIPT';
		this.script = breakIfNotString(args.script);
		this.entity = breakIfNotString(args.entity);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_TELEPORT_ENABLED';
		this.bool_value = breakIfNotBool(args.bool_value);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_BLE_FLAG';
		this.ble_flag = breakIfNotString(args.ble_flag);
		this.bool_value = breakIfNotBool(args.bool_value);
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
export class SET_SERIAL_DIALOG_CONTROL extends Action {
	action: 'SET_SERIAL_DIALOG_CONTROL';
	bool_value: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_SERIAL_DIALOG_CONTROL';
		this.bool_value = breakIfNotBool(args.bool_value);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'REGISTER_SERIAL_DIALOG_COMMAND';
		this.command = breakIfNotString(args.command);
		this.script = breakIfNotString(args.script);
		if (args.is_fail) this.is_fail = true;
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
	constructor(args: GenericObj) {
		super();
		this.action = 'REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT';
		this.command = breakIfNotString(args.command);
		this.script = breakIfNotString(args.script);
		this.argument = breakIfNotString(args.argument);
	}
	print() {
		return `command "${this.command}" + "${this.argument}" = "${this.script}";`;
	}
}
export class UNREGISTER_SERIAL_DIALOG_COMMAND extends Action {
	action: 'UNREGISTER_SERIAL_DIALOG_COMMAND';
	command: string;
	is_fail?: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'UNREGISTER_SERIAL_DIALOG_COMMAND';
		this.command = breakIfNotString(args.command);
		if (args.is_fail !== undefined) {
			this.is_fail = breakIfNotBool(args.is_fail);
		}
	}
	print() {
		return `delete command "${this.command}";`;
	}
}
export class UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT extends Action {
	action: 'UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT';
	command: string;
	argument: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT';
		this.command = breakIfNotString(args.command);
		this.argument = breakIfNotString(args.argument);
	}
	print() {
		return `delete command "${this.command}" + "${this.argument}";`;
	}
}
export class SET_ENTITY_MOVEMENT_RELATIVE extends Action {
	action: 'SET_ENTITY_MOVEMENT_RELATIVE';
	relative_direction: number;
	entity: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_ENTITY_MOVEMENT_RELATIVE';
		this.relative_direction = breakIfNotNumber(args.relative_direction);
		this.entity = breakIfNotString(args.entity);
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
	constructor() {
		super();
		this.action = 'CLOSE_DIALOG';
	}
	print() {
		return `close dialog;`;
	}
}
export class CLOSE_SERIAL_DIALOG extends Action {
	action: 'CLOSE_SERIAL_DIALOG';
	constructor() {
		super();
		this.action = 'CLOSE_SERIAL_DIALOG';
	}
	print() {
		return `close serial_dialog;`;
	}
}
export class SET_LIGHTS_CONTROL extends Action {
	action: 'SET_LIGHTS_CONTROL';
	enabled: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_LIGHTS_CONTROL';
		this.enabled = breakIfNotBool(args.enabled);
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
export class SET_LIGHTS_STATE extends Action {
	action: 'SET_LIGHTS_STATE';
	lights: string | string[];
	enabled: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_LIGHTS_STATE';
		this.enabled = breakIfNotBool(args.enabled);
		this.lights = breakIfNotStringOrStringArray(args.lights);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'GOTO_ACTION_INDEX';
		this.action_index = breakIfNotStringOrNumber(args.action_index);
	}
	static quick(action_index: string | number) {
		return new GOTO_ACTION_INDEX({ action_index });
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
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_SCRIPT_PAUSE';
		this.entity = breakIfNotString(args.entity);
		this.script_slot = breakIfNotString(args.script_slot);
		this.bool_value = breakIfNotBool(args.bool_value);
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
	constructor(args: GenericObj) {
		super();
		this.action = 'REGISTER_SERIAL_DIALOG_COMMAND_ALIAS';
		this.command = breakIfNotString(args.command);
		this.alias = breakIfNotString(args.alias);
	}
	print() {
		return `alias "${this.alias}" = "${this.command}";`;
	}
}
export class UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS extends Action {
	action: 'UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS';
	alias: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS';
		this.alias = breakIfNotString(args.alias);
	}
	print() {
		return `delete alias "${this.alias}";`;
	}
}
export class SET_SERIAL_DIALOG_COMMAND_VISIBILITY extends Action {
	action: 'SET_SERIAL_DIALOG_COMMAND_VISIBILITY';
	command: string;
	is_visible: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'SET_SERIAL_DIALOG_COMMAND_VISIBILITY';
		this.command = breakIfNotString(args.command);
		this.is_visible = breakIfNotBool(args.is_visible);
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

export class CHECK_ENTITY_NAME extends StringCheckableAction {
	action: 'CHECK_ENTITY_NAME';
	entity: string;
	string: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_NAME';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.string = breakIfNotString(args.string);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'name', `"${this.string}"`);
	}
}
export class CHECK_ENTITY_X extends NumberCheckableEqualityAction {
	action: 'CHECK_ENTITY_X';
	entity: string;
	expected_u2: number;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_X';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.expected_u2 = breakIfNotNumber(args.expected_u2);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'x', this.expected_u2);
	}
}
export class CHECK_ENTITY_Y extends NumberCheckableEqualityAction {
	action: 'CHECK_ENTITY_Y';
	entity: string;
	expected_u2: number;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_Y';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.expected_u2 = breakIfNotNumber(args.expected_u2);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'y', this.expected_u2);
	}
}
export class CHECK_ENTITY_INTERACT_SCRIPT extends StringCheckableAction {
	action: 'CHECK_ENTITY_INTERACT_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_INTERACT_SCRIPT';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.expected_script = breakIfNotString(args.expected_script);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'on_interact', `"${this.expected_script}"`);
	}
}
export class CHECK_ENTITY_TICK_SCRIPT extends StringCheckableAction {
	action: 'CHECK_ENTITY_TICK_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_TICK_SCRIPT';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.expected_script = breakIfNotString(args.expected_script);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'on_tick', `"${this.expected_script}"`);
	}
}
export class CHECK_ENTITY_LOOK_SCRIPT extends StringCheckableAction {
	action: 'CHECK_ENTITY_LOOK_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_LOOK_SCRIPT';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.expected_script = breakIfNotString(args.expected_script);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'on_look', `"${this.expected_script}"`);
	}
}
export class CHECK_ENTITY_TYPE extends StringCheckableAction {
	action: 'CHECK_ENTITY_TYPE';
	entity: string;
	entity_type: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_TYPE';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.entity_type = breakIfNotString(args.entity_type);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'type', `"${this.entity_type}"`);
	}
}
export class CHECK_ENTITY_PRIMARY_ID extends NumberCheckableEqualityAction {
	action: 'CHECK_ENTITY_PRIMARY_ID';
	entity: string;
	expected_u2: number;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_PRIMARY_ID';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.expected_u2 = breakIfNotNumber(args.expected_u2);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'primary_id', this.expected_u2);
	}
}
export class CHECK_ENTITY_SECONDARY_ID extends NumberCheckableEqualityAction {
	action: 'CHECK_ENTITY_SECONDARY_ID';
	entity: string;
	expected_u2: number;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_SECONDARY_ID';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.expected_u2 = breakIfNotNumber(args.expected_u2);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'secondary_id', this.expected_u2);
	}
}
export class CHECK_ENTITY_PRIMARY_ID_TYPE extends NumberCheckableEqualityAction {
	action: 'CHECK_ENTITY_PRIMARY_ID_TYPE';
	entity: string;
	expected_byte: number;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_PRIMARY_ID_TYPE';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.expected_byte = breakIfNotNumber(args.expected_byte);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'primary_id_type', this.expected_byte);
	}
}
export class CHECK_ENTITY_CURRENT_ANIMATION extends NumberCheckableEqualityAction {
	action: 'CHECK_ENTITY_CURRENT_ANIMATION';
	entity: string;
	expected_byte: number;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_CURRENT_ANIMATION';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.expected_byte = breakIfNotNumber(args.expected_byte);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'current_animation', this.expected_byte);
	}
}
export class CHECK_ENTITY_CURRENT_FRAME extends NumberCheckableEqualityAction {
	action: 'CHECK_ENTITY_CURRENT_FRAME';
	entity: string;
	expected_byte: number;
	expected_bool: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_CURRENT_FRAME';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.expected_byte = breakIfNotNumber(args.expected_byte);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'animation_frame', this.expected_byte);
	}
}
export class CHECK_ENTITY_DIRECTION extends StringCheckableAction {
	action: 'CHECK_ENTITY_DIRECTION';
	entity: string;
	direction: string; // north, south, east, west
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_DIRECTION';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.direction = breakIfNotString(args.direction);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'direction', `${this.direction}`);
	}
}
export class CHECK_ENTITY_GLITCHED extends BoolGetableAction {
	action: 'CHECK_ENTITY_GLITCHED';
	entity: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_GLITCHED';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.expected_bool = breakIfNotBool(args.expected_bool);
	}
	static quick(entity: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_ENTITY_GLITCHED({ entity, expected_bool });
	}
	print() {
		return printCheckAction(this, `${printEntityIdentifier(this.entity)} glitched`, true);
	}
}
export class CHECK_ENTITY_PATH extends StringCheckableAction {
	action: 'CHECK_ENTITY_PATH';
	geometry: string;
	entity: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_ENTITY_PATH';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.entity = breakIfNotString(args.entity);
		this.geometry = breakIfNotString(args.geometry);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
		return printEntityFieldEquality(this, 'path', `"${this.geometry}"`);
	}
}
export class CHECK_SAVE_FLAG extends BoolGetableAction {
	action: 'CHECK_SAVE_FLAG';
	save_flag: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_SAVE_FLAG';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.save_flag = breakIfNotString(args.save_flag);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
export class CHECK_IF_ENTITY_IS_IN_GEOMETRY extends BoolGetableAction {
	action: 'CHECK_IF_ENTITY_IS_IN_GEOMETRY';
	geometry: string;
	entity: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_IF_ENTITY_IS_IN_GEOMETRY';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.geometry = breakIfNotString(args.geometry);
		this.entity = breakIfNotString(args.entity);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
export class CHECK_FOR_BUTTON_PRESS extends BoolGetableAction {
	action: 'CHECK_FOR_BUTTON_PRESS';
	button_id: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_FOR_BUTTON_PRESS';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.button_id = breakIfNotString(args.button_id);
		this.expected_bool = breakIfNotBool(args.expected_bool);
	}
	static quick(button_id: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_FOR_BUTTON_PRESS({ button_id, expected_bool });
	}
	print() {
		return printCheckAction(this, `button ${this.button_id} pressed`, true);
	}
}
export class CHECK_FOR_BUTTON_STATE extends BoolGetableAction {
	action: 'CHECK_FOR_BUTTON_STATE';
	button_id: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_FOR_BUTTON_STATE';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.button_id = breakIfNotString(args.button_id);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
export class CHECK_WARP_STATE extends StringCheckableAction {
	action: 'CHECK_WARP_STATE';
	string: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_WARP_STATE';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.string = breakIfNotString(args.string);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
export class CHECK_VARIABLE extends NumberComparisonAction {
	action: 'CHECK_VARIABLE';
	variable: string;
	comparison: string;
	value: number;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_VARIABLE';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.variable = breakIfNotString(args.variable);
		this.comparison = breakIfNotString(args.comparison);
		this.value = breakIfNotNumber(args.value);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
	print() {
		const op = this.expected_bool ? this.comparison : inverseOpMap[this.comparison];
		return printCheckAction(this, `"${this.variable}" ${op} ${this.value}`, false);
	}
}
export class CHECK_VARIABLES extends NumberComparisonAction {
	action: 'CHECK_VARIABLES';
	variable: string;
	comparison: string;
	source: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_VARIABLES';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.variable = breakIfNotString(args.variable);
		this.comparison = breakIfNotString(args.comparison);
		this.source = breakIfNotString(args.source);
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
	print() {
		const op = this.expected_bool ? this.comparison : inverseOpMap[this.comparison];
		return printCheckAction(this, `"${this.variable}" ${op} "${this.source}"`, false);
	}
}
export class CHECK_MAP extends StringCheckableAction {
	// TODO: is this even in the engine? O.o
	action: 'CHECK_MAP';
	map: string;
	expected_bool: boolean;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_MAP';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.map = breakIfNotString(args.map);
		this.expected_bool = breakIfNotBool(args.expected_bool);
	}
	updateProp(value: string) {
		this.map = value;
	}
	getProp() {
		return this.map;
	}
	// todo print fn?
}
export class CHECK_BLE_FLAG extends StringCheckableAction {
	action: 'CHECK_BLE_FLAG';
	ble_flag: string;
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_BLE_FLAG';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.ble_flag = breakIfNotString(args.ble_flag);
		this.expected_bool = breakIfNotBool(args.expected_bool);
	}
	updateProp(value: string) {
		this.ble_flag = value;
	}
	getProp() {
		return this.ble_flag;
	}
	// todo print fn?
}
export class CHECK_DIALOG_OPEN extends BoolGetableAction {
	action: 'CHECK_DIALOG_OPEN';
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_DIALOG_OPEN';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.expected_bool = breakIfNotBool(args.expected_bool);
	}
	static quick(provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_DIALOG_OPEN({ expected_bool });
	}
	print() {
		return printCheckAction(this, `dialog ${this.expected_bool ? 'open' : 'closed'}`, false);
	}
}
export class CHECK_SERIAL_DIALOG_OPEN extends BoolGetableAction {
	action: 'CHECK_SERIAL_DIALOG_OPEN';
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_SERIAL_DIALOG_OPEN';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.expected_bool = breakIfNotBool(args.expected_bool);
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
export class CHECK_DEBUG_MODE extends BoolGetableAction {
	action: 'CHECK_DEBUG_MODE';
	constructor(args: GenericObj) {
		super();
		this.action = 'CHECK_DEBUG_MODE';
		if (args.success_script) {
			this.success_script = breakIfNotString(args.success_script);
		} else if (args.label) {
			this.label = breakIfNotString(args.label);
		} else if (args.jump_index) {
			this.jump_index = breakIfNotStringOrNumber(args.jump_index);
		}
		this.expected_bool = breakIfNotBool(args.expected_bool);
	}
	static quick(provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CHECK_DEBUG_MODE({ expected_bool });
	}
	print() {
		return printCheckAction(this, 'debug_mode', true);
	}
}

export type ActionSetEntityInt =
	| SET_ENTITY_X
	| SET_ENTITY_Y
	| SET_ENTITY_PRIMARY_ID
	| SET_ENTITY_SECONDARY_ID
	| SET_ENTITY_PRIMARY_ID_TYPE
	| SET_ENTITY_CURRENT_ANIMATION
	| SET_ENTITY_CURRENT_FRAME
	| SET_ENTITY_MOVEMENT_RELATIVE
	| SET_ENTITY_DIRECTION_RELATIVE;

export type ActionSetBool =
	| SET_ENTITY_GLITCHED
	| SET_LIGHTS_STATE
	| SET_PLAYER_CONTROL
	| SET_LIGHTS_CONTROL
	| SET_HEX_EDITOR_STATE
	| SET_HEX_EDITOR_DIALOG_MODE
	| SET_HEX_EDITOR_CONTROL
	| SET_HEX_EDITOR_CONTROL_CLIPBOARD
	| SET_SERIAL_DIALOG_CONTROL
	| SET_SAVE_FLAG;

export type ActionSetPosition =
	| TELEPORT_ENTITY_TO_GEOMETRY
	| TELEPORT_CAMERA_TO_GEOMETRY
	| SET_CAMERA_TO_FOLLOW_ENTITY;

export type ActionSetDirection =
	| SET_ENTITY_DIRECTION
	| SET_ENTITY_DIRECTION_TARGET_GEOMETRY
	| SET_ENTITY_DIRECTION_TARGET_ENTITY;

export type ActionSetScript =
	| SET_MAP_TICK_SCRIPT
	| SET_MAP_LOOK_SCRIPT
	| SET_ENTITY_TICK_SCRIPT
	| SET_ENTITY_INTERACT_SCRIPT
	| SET_ENTITY_LOOK_SCRIPT;

export type ActionMoveOverTime =
	| LOOP_CAMERA_ALONG_GEOMETRY
	| PAN_CAMERA_ALONG_GEOMETRY
	| PAN_CAMERA_TO_GEOMETRY
	| PAN_CAMERA_TO_ENTITY
	| LOOP_ENTITY_ALONG_GEOMETRY
	| WALK_ENTITY_ALONG_GEOMETRY
	| WALK_ENTITY_TO_GEOMETRY;

export type ActionSetEntityString = SET_ENTITY_NAME | SET_ENTITY_TYPE | SET_ENTITY_PATH;

const breakIfNotStringOrStringArray = (v: unknown): string | string[] => {
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

export const actionConstructorLookup = {
	NULL_ACTION: () => new NULL_ACTION(),
	COPY_SCRIPT: (args: GenericObj) => new COPY_SCRIPT(args),
	LABEL: (args: GenericObj) => new LABEL(args),
	RUN_SCRIPT: (args: GenericObj) => new RUN_SCRIPT(args),
	BLOCKING_DELAY: (args: GenericObj) => new BLOCKING_DELAY(args),
	NON_BLOCKING_DELAY: (args: GenericObj) => new NON_BLOCKING_DELAY(args),
	UNREGISTER_SERIAL_DIALOG_COMMAND: (args: GenericObj) => {
		return new UNREGISTER_SERIAL_DIALOG_COMMAND(args);
	},
	UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT: (args: GenericObj) => {
		return new UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT(args);
	},
	SET_ENTITY_NAME: (args: GenericObj) => new SET_ENTITY_NAME(args),
	SET_ENTITY_X: (args: GenericObj) => new SET_ENTITY_X(args),
	SET_ENTITY_Y: (args: GenericObj) => new SET_ENTITY_Y(args),
	SET_ENTITY_INTERACT_SCRIPT: (args: GenericObj) => new SET_ENTITY_INTERACT_SCRIPT(args),
	SET_ENTITY_TICK_SCRIPT: (args: GenericObj) => new SET_ENTITY_TICK_SCRIPT(args),
	SET_ENTITY_TYPE: (args: GenericObj) => new SET_ENTITY_TYPE(args),
	SET_ENTITY_PRIMARY_ID: (args: GenericObj) => new SET_ENTITY_PRIMARY_ID(args),
	SET_ENTITY_SECONDARY_ID: (args: GenericObj) => new SET_ENTITY_SECONDARY_ID(args),
	SET_ENTITY_PRIMARY_ID_TYPE: (args: GenericObj) => new SET_ENTITY_PRIMARY_ID_TYPE(args),
	SET_ENTITY_CURRENT_ANIMATION: (args: GenericObj) => {
		return new SET_ENTITY_CURRENT_ANIMATION(args);
	},
	SET_ENTITY_CURRENT_FRAME: (args: GenericObj) => new SET_ENTITY_CURRENT_FRAME(args),
	SET_ENTITY_DIRECTION: (args: GenericObj) => new SET_ENTITY_DIRECTION(args),
	SET_ENTITY_DIRECTION_RELATIVE: (args: GenericObj) => {
		return new SET_ENTITY_DIRECTION_RELATIVE(args);
	},
	SET_ENTITY_DIRECTION_TARGET_ENTITY: (args: GenericObj) => {
		return new SET_ENTITY_DIRECTION_TARGET_ENTITY(args);
	},
	SET_ENTITY_DIRECTION_TARGET_GEOMETRY: (args: GenericObj) => {
		return new SET_ENTITY_DIRECTION_TARGET_GEOMETRY(args);
	},
	SET_ENTITY_GLITCHED: (args: GenericObj) => new SET_ENTITY_GLITCHED(args),
	SET_ENTITY_PATH: (args: GenericObj) => new SET_ENTITY_PATH(args),
	SET_SAVE_FLAG: (args: GenericObj) => new SET_SAVE_FLAG(args),
	SET_PLAYER_CONTROL: (args: GenericObj) => new SET_PLAYER_CONTROL(args),
	SET_MAP_TICK_SCRIPT: (args: GenericObj) => new SET_MAP_TICK_SCRIPT(args),
	SET_HEX_CURSOR_LOCATION: (args: GenericObj) => new SET_HEX_CURSOR_LOCATION(args),
	SET_WARP_STATE: (args: GenericObj) => new SET_WARP_STATE(args),
	SET_HEX_EDITOR_STATE: (args: GenericObj) => new SET_HEX_EDITOR_STATE(args),
	SET_HEX_EDITOR_DIALOG_MODE: (args: GenericObj) => new SET_HEX_EDITOR_DIALOG_MODE(args),
	SET_HEX_EDITOR_CONTROL: (args: GenericObj) => new SET_HEX_EDITOR_CONTROL(args),
	SET_HEX_EDITOR_CONTROL_CLIPBOARD: (args: GenericObj) => {
		return new SET_HEX_EDITOR_CONTROL_CLIPBOARD(args);
	},
	LOAD_MAP: (args: GenericObj) => new LOAD_MAP(args),
	SHOW_DIALOG: (args: GenericObj) => new SHOW_DIALOG(args),
	PLAY_ENTITY_ANIMATION: (args: GenericObj) => new PLAY_ENTITY_ANIMATION(args),
	TELEPORT_ENTITY_TO_GEOMETRY: (args: GenericObj) => new TELEPORT_ENTITY_TO_GEOMETRY(args),
	WALK_ENTITY_TO_GEOMETRY: (args: GenericObj) => new WALK_ENTITY_TO_GEOMETRY(args),
	WALK_ENTITY_ALONG_GEOMETRY: (args: GenericObj) => new WALK_ENTITY_ALONG_GEOMETRY(args),
	LOOP_ENTITY_ALONG_GEOMETRY: (args: GenericObj) => new LOOP_ENTITY_ALONG_GEOMETRY(args),
	SET_CAMERA_TO_FOLLOW_ENTITY: (args: GenericObj) => new SET_CAMERA_TO_FOLLOW_ENTITY(args),
	TELEPORT_CAMERA_TO_GEOMETRY: (args: GenericObj) => new TELEPORT_CAMERA_TO_GEOMETRY(args),
	PAN_CAMERA_TO_ENTITY: (args: GenericObj) => new PAN_CAMERA_TO_ENTITY(args),
	PAN_CAMERA_TO_GEOMETRY: (args: GenericObj) => new PAN_CAMERA_TO_GEOMETRY(args),
	PAN_CAMERA_ALONG_GEOMETRY: (args: GenericObj) => new PAN_CAMERA_ALONG_GEOMETRY(args),
	LOOP_CAMERA_ALONG_GEOMETRY: (args: GenericObj) => new LOOP_CAMERA_ALONG_GEOMETRY(args),
	SET_SCREEN_SHAKE: (args: GenericObj) => new SET_SCREEN_SHAKE(args),
	SCREEN_FADE_OUT: (args: GenericObj) => new SCREEN_FADE_OUT(args),
	SCREEN_FADE_IN: (args: GenericObj) => new SCREEN_FADE_IN(args),
	MUTATE_VARIABLE: (args: GenericObj) => new MUTATE_VARIABLE(args),
	MUTATE_VARIABLES: (args: GenericObj) => new MUTATE_VARIABLES(args),
	COPY_VARIABLE: (args: GenericObj) => new COPY_VARIABLE(args),
	SLOT_SAVE: () => new SLOT_SAVE(),
	SLOT_LOAD: (args: GenericObj) => new SLOT_LOAD(args),
	SLOT_ERASE: (args: GenericObj) => new SLOT_ERASE(args),
	SET_CONNECT_SERIAL_DIALOG: (args: GenericObj) => new SET_CONNECT_SERIAL_DIALOG(args),
	SHOW_SERIAL_DIALOG: (args: GenericObj) => new SHOW_SERIAL_DIALOG(args),
	SET_MAP_LOOK_SCRIPT: (args: GenericObj) => new SET_MAP_LOOK_SCRIPT(args),
	SET_ENTITY_LOOK_SCRIPT: (args: GenericObj) => new SET_ENTITY_LOOK_SCRIPT(args),
	SET_TELEPORT_ENABLED: (args: GenericObj) => new SET_TELEPORT_ENABLED(args),
	SET_BLE_FLAG: (args: GenericObj) => new SET_BLE_FLAG(args),
	SET_SERIAL_DIALOG_CONTROL: (args: GenericObj) => new SET_SERIAL_DIALOG_CONTROL(args),
	REGISTER_SERIAL_DIALOG_COMMAND: (args: GenericObj) => {
		return new REGISTER_SERIAL_DIALOG_COMMAND(args);
	},
	REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT: (args: GenericObj) => {
		return new REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT(args);
	},
	SET_ENTITY_MOVEMENT_RELATIVE: (args: GenericObj) => {
		return new SET_ENTITY_MOVEMENT_RELATIVE(args);
	},
	CLOSE_DIALOG: () => new CLOSE_DIALOG(),
	CLOSE_SERIAL_DIALOG: () => new CLOSE_SERIAL_DIALOG(),
	SET_LIGHTS_CONTROL: (args: GenericObj) => new SET_LIGHTS_CONTROL(args),
	SET_LIGHTS_STATE: (args: GenericObj) => new SET_LIGHTS_STATE(args),
	GOTO_ACTION_INDEX: (args: GenericObj) => new GOTO_ACTION_INDEX(args),
	SET_SCRIPT_PAUSE: (args: GenericObj) => new SET_SCRIPT_PAUSE(args),
	REGISTER_SERIAL_DIALOG_COMMAND_ALIAS: (args: GenericObj) => {
		return new REGISTER_SERIAL_DIALOG_COMMAND_ALIAS(args);
	},
	UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS: (args: GenericObj) => {
		return new UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS(args);
	},
	SET_SERIAL_DIALOG_COMMAND_VISIBILITY: (args: GenericObj) => {
		return new SET_SERIAL_DIALOG_COMMAND_VISIBILITY(args);
	},
	CHECK_ENTITY_NAME: (args: GenericObj) => new CHECK_ENTITY_NAME(args),
	CHECK_ENTITY_X: (args: GenericObj) => new CHECK_ENTITY_X(args),
	CHECK_ENTITY_Y: (args: GenericObj) => new CHECK_ENTITY_Y(args),
	CHECK_ENTITY_INTERACT_SCRIPT: (args: GenericObj) => {
		return new CHECK_ENTITY_INTERACT_SCRIPT(args);
	},
	CHECK_ENTITY_TICK_SCRIPT: (args: GenericObj) => new CHECK_ENTITY_TICK_SCRIPT(args),
	CHECK_ENTITY_LOOK_SCRIPT: (args: GenericObj) => new CHECK_ENTITY_LOOK_SCRIPT(args),
	CHECK_ENTITY_TYPE: (args: GenericObj) => new CHECK_ENTITY_TYPE(args),
	CHECK_ENTITY_PRIMARY_ID: (args: GenericObj) => new CHECK_ENTITY_PRIMARY_ID(args),
	CHECK_ENTITY_SECONDARY_ID: (args: GenericObj) => new CHECK_ENTITY_SECONDARY_ID(args),
	CHECK_ENTITY_PRIMARY_ID_TYPE: (args: GenericObj) => {
		return new CHECK_ENTITY_PRIMARY_ID_TYPE(args);
	},
	CHECK_ENTITY_CURRENT_ANIMATION: (args: GenericObj) => {
		return new CHECK_ENTITY_CURRENT_ANIMATION(args);
	},
	CHECK_ENTITY_CURRENT_FRAME: (args: GenericObj) => new CHECK_ENTITY_CURRENT_FRAME(args),
	CHECK_ENTITY_DIRECTION: (args: GenericObj) => new CHECK_ENTITY_DIRECTION(args),
	CHECK_ENTITY_GLITCHED: (args: GenericObj) => new CHECK_ENTITY_GLITCHED(args),
	CHECK_ENTITY_PATH: (args: GenericObj) => new CHECK_ENTITY_PATH(args),
	CHECK_SAVE_FLAG: (args: GenericObj) => new CHECK_SAVE_FLAG(args),
	CHECK_IF_ENTITY_IS_IN_GEOMETRY: (args: GenericObj) => {
		return new CHECK_IF_ENTITY_IS_IN_GEOMETRY(args);
	},
	CHECK_FOR_BUTTON_PRESS: (args: GenericObj) => new CHECK_FOR_BUTTON_PRESS(args),
	CHECK_FOR_BUTTON_STATE: (args: GenericObj) => new CHECK_FOR_BUTTON_STATE(args),
	CHECK_WARP_STATE: (args: GenericObj) => new CHECK_WARP_STATE(args),
	CHECK_VARIABLE: (args: GenericObj) => new CHECK_VARIABLE(args),
	CHECK_VARIABLES: (args: GenericObj) => new CHECK_VARIABLES(args),
	CHECK_MAP: (args: GenericObj) => new CHECK_MAP(args),
	CHECK_BLE_FLAG: (args: GenericObj) => new CHECK_BLE_FLAG(args),
	CHECK_DIALOG_OPEN: (args: GenericObj) => new CHECK_DIALOG_OPEN(args),
	CHECK_SERIAL_DIALOG_OPEN: (args: GenericObj) => new CHECK_SERIAL_DIALOG_OPEN(args),
	CHECK_DEBUG_MODE: (args: GenericObj) => new CHECK_DEBUG_MODE(args),
};
