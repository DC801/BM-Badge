import { Node as TreeSitterNode } from 'web-tree-sitter';
import { FileState, type FunctionStackEntry } from './parser-file.ts';
import * as ACTION from './parser-bytecode-info.ts';
import {
	autoIdentifierName,
	doAutoBreakContinue,
	dropTemporary,
	flattenAndDoAutoReturn,
	flattenNodes,
	inverseOpMap,
	newTemporary,
	RETURN,
	simpleBranchMaker,
} from './parser-utilities.ts';
import { type GenericObj } from './parser-actions.ts';
import {
	coerceToString,
	handleNamedChildren,
	mandatoryChildForField,
	mandatoryLastChild,
} from './parser-capture.ts';
import { handleNode } from './parser-node.ts';

// All print() methods on MathlangNodes are as if they were to be encountered in a grammatically valid MGS script

export class AnyNode {
	isIdenticalTo(that: unknown): boolean {
		if (this instanceof ACTION.Action || this instanceof MathlangNode) {
			return this.isIdenticalTo(that);
		}
		throw new Error('ACTIONS DO NOT MATCH???');
	}
	clone(): AnyNode {
		if (this instanceof MathlangNode) return this.clone();
		return ACTION.Action.fromArgs(this);
	}
	static breakIfNotAll(arr: unknown) {
		if (!Array.isArray(arr)) {
			throw new Error('AnyNode[] not an Array');
		}
		if (!arr.every((v) => v instanceof AnyNode)) {
			throw new Error('not every item in array is AnyNode');
		}
		return arr;
	}
	static cloneAll(steps: AnyNode[]) {
		return steps.map((v) => v.clone());
	}
	print() {
		return `// unknown AnyNode`;
	}
}
export class MathlangNode extends AnyNode {
	args: GenericObj;
	debug: MathlangLocation;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.debug = debug;
		this.args = args;
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof MathlangNode)) return false;
		const setOfKeys = new Set([...Object.keys(this.args), ...Object.keys(that.args)]);
		const keys = [...setOfKeys];
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const thisV = this.args[key];
			const thatV = that.args[key];
			if (thisV instanceof AnyNode) {
				if (!thisV.isIdenticalTo(thatV)) return false;
			}
			if (this.args[key] !== that.args[key]) return false;
		}
		return true;
	}
	static breakIfNotAll(arr: unknown) {
		if (!Array.isArray(arr)) {
			throw new Error('MathlangNode[] not an Array');
		}
		if (!arr.every((v) => v instanceof MathlangNode)) {
			throw new Error('not every item in array is MathlangNode');
		}
		return arr;
	}
	print() {
		return `// unknown MathlangNode`;
	}
}

export type MGSPrimitive = string | BoolLiteral | number;
export const isMGSPrimitive = (v: unknown): v is MGSPrimitive => {
	if (typeof v === 'string') return true;
	if (typeof v === 'number') return true;
	if (typeof v === 'boolean' || v instanceof BoolLiteral) return true;
	return false;
};

export class MathlangLocation {
	args: GenericObj;
	f: FileState;
	node: TreeSitterNode;
	fileName: string;
	comment?: string;
	constructor(args: GenericObj) {
		this.args = args;
		if (!(args.f instanceof FileState)) {
			throw new Error('f not FileState');
		}
		if (!(args.node instanceof TreeSitterNode)) {
			throw new Error('node not TreeSitterNode');
		}
		this.f = args.f;
		this.fileName = args.f.fileName;
		this.node = args.node;
		if (args.comment) {
			this.comment = ACTION.breakIfNotString(args.comment);
		}
	}
	static quick(f: FileState, node: TreeSitterNode) {
		return new MathlangLocation({ f, node });
	}
	clone() {
		return new MathlangLocation(this.args);
	}
	using(newNode: TreeSitterNode) {
		return MathlangLocation.quick(this.f, newNode);
	}
	isIdenticalTo(that: MathlangLocation) {
		if (this.fileName !== that.fileName) return false;
		if (this.node === that.node) return true;
		if (
			this.node.startIndex === that.node.startIndex &&
			this.node.endIndex === that.node.endIndex
		) {
			return true;
		}
		return false;
	}
	quickError(type: MathlangMessageType, message: string, footer?: string) {
		this.f.quickError(this.node, type, message, footer);
	}
	quickWarning(type: MathlangMessageType, message: string, footer?: string) {
		this.f.quickWarning(this.node, type, message, footer);
	}
}

// error types and a generic followup message
// todo: make the message optional, and use the fallback message if absent
const mathlangMessageTypes: Record<string, string> = {
	// general
	'syntax error': 'unknown syntax error',
	'unexpected token': 'unexpected token',
	'missing token': 'expected token not found', // can be warning, not error (e.g. missing ';')
	'missing file': 'this file could not be found in this project',
	'missing script': 'script not found',

	// these are phrased this way because the order of definition doesn't matter
	// (there isn't an "original," so we can't say "already defined")
	'duplicate script': 'script by this name has already been defined in this project',
	'duplicate dialog': 'dialog by this name has already been defined in this project',
	'duplicate serial dialog':
		'serial dialog by this name has already been defined in this project',

	// these are ordered, so there is definitely an "original"
	'undefined fn': 'function has not yet been defined in this file scope',
	'fn already defined': 'function already defined in this file scope',
	'undefined constant': 'constant has not yet been defined in this file scope',
	'constant already defined': 'cannot redefine constant in the same file scope',

	// fns
	'duplicate fn arg': 'cannot use the same fn argument multiple times',
	'too many fn args': 'function call uses more args than were passed',
	'not enough fn args': 'function requires more arguments than was provided',
	'invalid fn arg':
		'fn args must be constants (beginning with $) in a fn definition, and MGS primitive values in a fn call',
	'recursive fn call': `fns cannot call themselves (call stacks aren't real`,

	// actions
	'mismatched spread lengths': 'spreads must have the same count of items within each context',
	'unsupported entity field': 'this entity field is not supported in this action',
	'misordered params': 'invalid param order',
	'invalid action': 'malformed action object',
	'invalid action param combination': 'this action cannot have this combination of params',
	'invalid entity script slot':
		'entities can only have "on_tick", "on_interact", and "on_look" scripts',
	'value wrong type': 'provided value not the necessary type',

	// arrays
	'array method on non-array':
		'previous method does not return an array; cannot call array method afterward',
	'array does not return value':
		'this array method chain does not return an int value; 0 will be used',

	// misc
	'return value not stored': 'did you mean to discard the return value?', // warning
	'invalid JSON action': 'malformed action JSON',
	'invalid operator': 'use != and ==, not !== or ===', // warning, not error
	'invalid constant value': 'constant value not an MGS primitive',
	'ambiguous identifiers': 'will be interpreted as ints; coerce RHS to bools with "!!"',
	'serial dialog option mismatch': 'the first option type will be used',
	'dialog too long':
		'dialog will wrap off the bottom of the dialog frame (or into dialog options)',
	'recursive include': 'include recursion not allowed',
	'recursive copy_script': 'copy_script recursion not allowed',
};

export type MathlangMessageType = keyof typeof mathlangMessageTypes;
export const isMathlangMessageType = (v: string): v is MathlangMessageType => {
	return !!mathlangMessageTypes[v];
};

export class MathlangMessage {
	locations: MathlangLocation[];
	type: MathlangMessageType;
	message: string;
	footer?: string;
	constructor(locations: MathlangLocation[], type: string, message?: string, footer?: string) {
		this.locations = locations;
		if (!isMathlangMessageType(type)) throw new Error('invalid error type: ' + type);
		this.type = type;
		this.message = message || mathlangMessageTypes[this.type];
		if (footer) this.footer = footer;
	}
}

const truncate = (s: string, n: number): string => {
	const orig = s.replace(/\n/g, ' ');
	return s.length > n + 3 ? orig.slice(0, n) + '...' : orig;
};

export class FunctionDefinition extends MathlangNode {
	name: string;
	params: string[];
	paramNodes: TreeSitterNode[];
	bodyNode: TreeSitterNode;
	callCount: 0;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.name = coerceToString(debug, args.name);
		this.params = ACTION.breakIfNotStringArray(args.params);
		this.paramNodes = ACTION.breakIfNotTSNodeArray(args.paramNodes);
		this.bodyNode = ACTION.breakIfNotTSNode(args.bodyNode);
		this.callCount = 0;
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof FunctionDefinition)) return false;
		if (this.name !== that.name) return false;
		if (JSON.stringify(this.params) !== JSON.stringify(that.params)) return false;
		if (this.bodyNode !== that.bodyNode) return false;
		if (this.paramNodes.length !== that.paramNodes.length) return false;
		for (let i = 0; i < this.paramNodes.length; i++) {
			if (this.paramNodes[i] !== that.paramNodes[i]) return false;
		}
		return true;
	}
	clone() {
		return new FunctionDefinition(this.debug.clone(), {
			...this.args,
			params: this.params.slice(),
			paramNodes: this.paramNodes.slice(),
		});
	}
	static quick(
		debug: MathlangLocation,
		name: string,
		params: string[],
		paramNodes: TreeSitterNode[],
		bodyNode: TreeSitterNode,
	) {
		return new FunctionDefinition(debug, { name, params, paramNodes, bodyNode });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof FunctionDefinition)) {
			throw new Error('not FunctionDefinition');
		}
		return v;
	}
	static coerce(debug: MathlangLocation, v: unknown) {
		if (v instanceof FunctionDefinition) return v;
		return FunctionDefinition.placeholder(debug);
	}
	static placeholder(debug: MathlangLocation) {
		return FunctionDefinition.quick(
			debug,
			'PLACEHOLDER-' + autoIdentifierName(debug),
			[],
			[],
			debug.node,
		);
	}
	print() {
		return `// FunctionDefinition: "${this.name}"`;
	}
}

// ------------------------------ SETTINGS ------------------------------ \\

export class AddDialogSettings extends MathlangNode {
	targets: AddDialogSettingsTarget[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.targets = AddDialogSettingsTarget.breakIfNotAll(args.targets);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof AddDialogSettings)) return false;
		if (this.targets.length !== that.targets.length) return false;
		for (let i = 0; i < this.targets.length; i++) {
			if (!this.targets[i].isIdenticalTo(that.targets[i])) return false;
		}
		return true;
	}
	clone() {
		const targets = AnyNode.cloneAll(this.targets);
		return new AddDialogSettings(this.debug.clone(), { ...this.args, targets });
	}
	static quick(debug: MathlangLocation, targets: AddDialogSettingsTarget[]) {
		return new AddDialogSettings(debug, { targets });
	}
	print() {
		return [`// AddDialogSettings:`, ...this.targets.map((v) => v.print())].join('\n');
	}
}

export class AddDialogSettingsTarget extends MathlangNode {
	type: string;
	parameters: DialogParameter[];
	target?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.type = coerceToString(debug, args.type);
		this.parameters = DialogParameter.breakIfNotAll(args.parameters);
		if (typeof args.target === 'string') this.target = args.target;
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof AddDialogSettingsTarget)) return false;
		if (this.type !== that.type) return false;
		if (this.parameters.length !== that.parameters.length) return false;
		for (let i = 0; i < this.parameters.length; i++) {
			if (!this.parameters[i].isIdenticalTo(that.parameters[i])) return false;
		}
		if (this.target !== that.target) return false;
		return true;
	}
	clone() {
		const parameters = AnyNode.cloneAll(this.parameters);
		return new AddDialogSettingsTarget(this.debug.clone(), {
			...this.args,
			parameters,
		});
	}
	static quick(
		debug: MathlangLocation,
		type: string,
		parameters: DialogParameter[],
		target?: string,
	) {
		return new AddDialogSettingsTarget(debug, {
			type,
			parameters,
			target,
		});
	}
	static breakIfNotAll(arr: unknown) {
		if (!Array.isArray(arr)) {
			throw new Error('AddDialogSettingsTarget[] not an Array');
		}
		if (!arr.every((v) => v instanceof AddDialogSettingsTarget)) {
			throw new Error('not every item in array is AddDialogSettingsTarget');
		}
		return arr;
	}
	print() {
		const header = `// AddDialogSettingsTarget: ${this.type}${this.target ? ', ' + this.target : ''}`;
		return [header, this.parameters.map((v) => v.print())].join('\n');
	}
}

export class AddSerialDialogSettings extends MathlangNode {
	parameters: SerialDialogParameter[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.parameters = SerialDialogParameter.breakIfNotAll(args.parameters);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof AddSerialDialogSettings)) return false;
		if (this.parameters.length !== that.parameters.length) return false;
		for (let i = 0; i < this.parameters.length; i++) {
			if (!this.parameters[i].isIdenticalTo(that.parameters[i])) return false;
		}
		return true;
	}
	clone() {
		const parameters = AnyNode.cloneAll(this.parameters);
		return new AddSerialDialogSettings(this.debug.clone(), {
			...this.args,
			parameters,
		});
	}
	static quick(debug: MathlangLocation, parameters: SerialDialogParameter[]) {
		return new AddSerialDialogSettings(debug, {
			parameters,
		});
	}
	print() {
		return [`// AddSerialDialogSettings:`, this.parameters.map((v) => v.print())].join('\n');
	}
}

// ------------------------------ CONTROL ------------------------------ \\

export class ReturnStatement extends MathlangNode {
	constructor(debug: MathlangLocation) {
		super(debug, {});
	}
	isIdenticalTo(that: unknown) {
		return that instanceof ReturnStatement;
	}
	clone() {
		return new ReturnStatement(this.debug.clone());
	}
	static quick(debug: MathlangLocation) {
		return new ReturnStatement(debug);
	}
	print() {
		return `return;`;
	}
}
export class ContinueStatement extends MathlangNode {
	constructor(debug: MathlangLocation) {
		super(debug, {});
	}
	isIdenticalTo(that: unknown) {
		return that instanceof ContinueStatement;
	}
	clone() {
		return new ReturnStatement(this.debug.clone());
	}
	static quick(debug: MathlangLocation) {
		return new ContinueStatement(debug);
	}
	print() {
		return `continue;`;
	}
}
export class BreakStatement extends MathlangNode {
	constructor(debug: MathlangLocation) {
		super(debug, {});
	}
	isIdenticalTo(that: unknown) {
		return that instanceof BreakStatement;
	}
	clone() {
		return new ReturnStatement(this.debug.clone());
	}
	static quick(debug: MathlangLocation) {
		return new BreakStatement(debug);
	}
	print() {
		return `break;`;
	}
}

export class GotoLabel extends MathlangNode {
	label: string;
	comment?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.label = coerceToString(debug, args.label);
		if (typeof args.comment === 'string') this.comment = args.comment;
	}
	isIdenticalTo(that: MathlangNode) {
		if (!(that instanceof GotoLabel)) return false;
		if (this.label !== that.label) return false;
		if (this.comment !== that.comment) return false;
		return true;
	}
	clone() {
		return new GotoLabel(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, label: string) {
		return new GotoLabel(debug, { label });
	}
	ifLabelAddSuffix(suffix: string) {
		this.label += suffix;
		return this;
	}
	print() {
		return `${ACTION.printGotoSegment(this)};`;
	}
}

// ------------------------------ DIALOG ------------------------------ \\

export class DialogDefinition extends MathlangNode {
	dialogName: string;
	dialogs: Dialog[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.dialogName = coerceToString(debug, args.dialogName);
		this.dialogs = Dialog.breakIfNotAll(args.dialogs);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof DialogDefinition)) return false;
		if (this.dialogName !== that.dialogName) return false;
		if (this.dialogs.length !== that.dialogs.length) return false;
		for (let i = 0; i < this.dialogs.length; i++) {
			if (!this.dialogs[i].isIdenticalTo(that.dialogs[i])) return false;
		}
		return true;
	}
	clone() {
		const dialogs = AnyNode.cloneAll(this.dialogs);
		return new DialogDefinition(this.debug.clone(), { ...this.args, dialogs });
	}
	static quick(debug: MathlangLocation, dialogName: string, dialogs: AnyNode[]) {
		return new DialogDefinition(debug, { dialogName, dialogs });
	}
	print() {
		const truncated = truncate(this.dialogs[0].messages[0], 40);
		return `// DialogDefinition: "${truncated}"`;
	}
}
export type DialogSettings = {
	wrap?: number;
	emote?: number;
	entity?: string;
	name?: string;
	portrait?: string;
	alignment?: string;
	border_tileset?: string;
};
export type DialogSettingsKeyString =
	| 'entity'
	| 'name'
	| 'portrait'
	| 'alignment'
	| 'border_tileset';
export type DialogSettingsKeyNumber = 'wrap' | 'emote';
export const isDialogSettingsKeyString = (str: string): str is DialogSettingsKeyString => {
	if (str === 'entity') return true;
	if (str === 'name') return true;
	if (str === 'portrait') return true;
	if (str === 'alignment') return true;
	if (str === 'border_tileset') return true;
	return false;
};
export const isDialogSettingsKeyNumber = (str: string): str is DialogSettingsKeyNumber => {
	if (str === 'wrap') return true;
	if (str === 'emote') return true;
	return false;
};
export const addParamToDialogSettings = (
	settings: DialogSettings | Dialog,
	k: string,
	_v: unknown,
) => {
	const v = _v instanceof BoolLiteral ? _v.value : _v;
	if (isDialogSettingsKeyString(k) && typeof v == 'string') {
		settings[k] = v;
	} else if (isDialogSettingsKeyNumber(k) && typeof v == 'number') {
		settings[k] = v;
	} else {
		throw new Error('something borked');
	}
	return settings;
};

export class DialogParameter extends MathlangNode {
	property: string;
	value: MGSPrimitive;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.property = coerceToString(debug, args.property);
		this.value = ACTION.breakIfNotStringOrNumber(args.value);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof DialogParameter)) return false;
		if (this.property !== that.property) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		return new DialogParameter(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, property: string, value: string | number) {
		return new DialogParameter(debug, { property, value });
	}
	static breakIfNotAll(arr: unknown) {
		if (!Array.isArray(arr)) {
			throw new Error('DialogParameter[] not an Array');
		}
		if (!arr.every((v) => v instanceof DialogParameter)) {
			throw new Error('not every item in array is DialogParameter');
		}
		return arr;
	}
	print() {
		return `// DialogParameter: ${this.property} = ${this.value}`;
	}
}

export class Dialog extends MathlangNode {
	wrap?: number;
	emote?: number;
	entity?: string;
	name?: string;
	portrait?: string;
	alignment?: string;
	border_tileset?: string;

	messages: string[];
	response_type?: 'SELECT_FROM_SHORT_LIST';
	options?: DialogOption[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		if (args.options && Array.isArray(args.options)) {
			if (args.options.length && args.options.every((v) => v instanceof DialogOption)) {
				this.options = args.options;
				this.response_type = 'SELECT_FROM_SHORT_LIST';
			}
		}
		this.messages = ACTION.breakIfNotStringArray(args.messages);
		if (typeof args.settings === 'object' && args.settings !== null) {
			Object.entries(args.settings).forEach(([k, v]) => {
				addParamToDialogSettings(this, k, v);
			});
		}
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof Dialog)) return false;
		if (this.wrap !== that.wrap) return false;
		if (this.emote !== that.emote) return false;
		if (this.entity !== that.entity) return false;
		if (this.name !== that.name) return false;
		if (this.portrait !== that.portrait) return false;
		if (this.alignment !== that.alignment) return false;
		if (this.border_tileset !== that.border_tileset) return false;
		if (JSON.stringify(this.messages) !== JSON.stringify(that.messages)) return false;
		if (this.response_type !== that.response_type) return false;
		if (this.options && !that.options) return false;
		if (!this.options && that.options) return false;
		if (this.options && that.options) {
			if (this.options.length !== that.options.length) return false;
			for (let i = 0; i < this.options.length; i++) {
				if (!this.options[i].isIdenticalTo(that.options[i])) return false;
			}
		}
		return true;
	}
	clone() {
		const newArgs = { ...this.args };
		if (this.options) {
			newArgs.options = AnyNode.cloneAll(this.options);
		}
		newArgs.messages = this.messages.slice();
		return new Dialog(this.debug.clone(), newArgs);
	}
	static breakIfNotAll(arr: unknown) {
		if (!Array.isArray(arr)) {
			throw new Error('Dialog[] not an Array');
		}
		if (!arr.every((v) => v instanceof Dialog)) {
			throw new Error('not every item in array is Dialog');
		}
		return arr;
	}
	print() {
		return [
			`// Dialog: entity "${this.entity || ''}", name "${this.name || ''}"`,
			`// "${truncate(this.messages[0], 40)}"`,
			...(this.options?.map((v) => v.print()) || []),
		].join('\n');
	}
}

export type DialogInfo = {
	identifier: DialogIdentifier;
	settings: DialogSettings;
	messages: string[];
	options: DialogOption[];
};

export class DialogIdentifier extends MathlangNode {
	type: DialogIdentifierType;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		if (args.type !== 'label' && args.type !== 'entity' && args.type !== 'name') {
			throw new Error('invalid DialogIdentifier type');
		}
		this.type = args.type;
		this.value = coerceToString(debug, args.value);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof DialogIdentifier)) return false;
		if (this.type !== that.type) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		return new DialogIdentifier(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new DialogIdentifier(debug, { type, value });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof DialogIdentifier)) {
			throw new Error('not DialogIdentifier');
		}
		return v;
	}
	print() {
		return `// DialogIdentifier: ${this.type} "${this.value}"`;
	}
}
type DialogIdentifierType = 'label' | 'entity' | 'name';

export class DialogOption extends MathlangNode {
	label: string;
	script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.label = coerceToString(debug, args.label);
		this.script = coerceToString(debug, args.script);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof DialogOption)) return false;
		if (this.label !== that.label) return false;
		if (this.script !== that.script) return false;
		return true;
	}
	clone() {
		return new DialogOption(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, label: string, script: string) {
		return new DialogOption(debug, {
			label,
			script,
		});
	}
	static breakIfNotAll(arr: unknown) {
		if (!Array.isArray(arr)) {
			throw new Error('DialogOption[] not an Array');
		}
		if (!arr.every((v) => v instanceof DialogOption)) {
			throw new Error('not every item in array is DialogOption');
		}
		return arr;
	}
	print() {
		return `// > "${this.label}" = script "${this.script}"`;
	}
}

// ------------------------------ SERIAL DIALOG ------------------------------ \\

export class SerialDialogDefinition extends MathlangNode {
	dialogName: string;
	serialDialog: SerialDialog;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		if (!(args.serialDialog instanceof SerialDialog)) {
			throw new Error('SerialDialogDefinition not given valid SerialDialog');
		}
		this.dialogName = coerceToString(debug, args.dialogName);
		this.serialDialog = args.serialDialog;
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof SerialDialogDefinition)) return false;
		if (this.dialogName !== that.dialogName) return false;
		if (!this.serialDialog.isIdenticalTo(that.serialDialog)) return false;
		return true;
	}
	clone() {
		const newArgs = { ...this.args };
		newArgs.serialDialog = this.serialDialog.clone();
		return new SerialDialogDefinition(this.debug.clone(), newArgs);
	}
	static quick(debug: MathlangLocation, dialogName: string, serialDialog: AnyNode) {
		// AnyNode is okay since the constructor coerces it
		return new SerialDialogDefinition(debug, { dialogName, serialDialog });
	}
	print() {
		return `// SerialDialogDefinition: "${this.dialogName}"`;
	}
}

export type SerialDialogSettings = {
	wrap?: number;
};

export type SerialDialogSettingsKey = keyof SerialDialogSettings;

export const isSerialDialogSettingsKey = (str: string): str is SerialDialogSettingsKey => {
	if (str === 'wrap') return true;
	return false;
};
// Make this look like the dialog ones if you need to add string params
export const addParamToSerialDialogSettings = (
	settings: SerialDialogSettings,
	k: string,
	_v: unknown,
) => {
	const v = _v instanceof BoolLiteral ? _v.value : _v;
	if (isSerialDialogSettingsKey(k) && typeof v == 'number') {
		settings[k] = v;
	} else {
		throw new Error('something borked');
	}
	return settings;
};

export class SerialDialogParameter extends MathlangNode {
	property: string;
	value: MGSPrimitive;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.property = coerceToString(debug, args.property);
		this.value = ACTION.breakIfNotStringOrNumber(args.value);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof SerialDialogParameter)) return false;
		if (this.property !== that.property) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		const newArgs = { ...this.args };
		if (this.value instanceof BoolLiteral) {
			newArgs.value = this.value.clone();
		}
		return new SerialDialogParameter(this.debug.clone(), newArgs);
	}
	static quick(debug: MathlangLocation, property: string, value: string | number) {
		return new SerialDialogParameter(debug, { property, value });
	}
	static breakIfNotAll(arr: unknown) {
		if (!Array.isArray(arr)) {
			throw new Error('SerialDialogParameter[] not an Array');
		}
		if (!arr.every((v) => v instanceof SerialDialogParameter)) {
			throw new Error('not every item in array is SerialDialogParameter');
		}
		return arr;
	}
	print() {
		return `// SerialDialogParameter: ${this.property} = ${this.value}`;
	}
}

export class SerialDialog extends MathlangNode {
	messages: string[];
	options?: SerialDialogOption[];
	text_options?: SerialDialogOption[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.messages = ACTION.breakIfNotStringArray(args.messages);
		if (args.options) {
			this.options = SerialDialogOption.breakIfNotAll(args.options);
		}
		if (args.text_options) {
			this.text_options = SerialDialogOption.breakIfNotAll(args.text_options);
		}
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof SerialDialog)) return false;
		if (this.options && !that.options) return false;
		if (!this.options && that.options) return false;
		if (this.options && that.options) {
			if (this.options.length !== that.options.length) return false;
			for (let i = 0; i < this.options.length; i++) {
				if (!this.options[i].isIdenticalTo(that.options[i])) return false;
			}
		}
		if (this.text_options && !that.text_options) return false;
		if (!this.text_options && that.text_options) return false;
		if (this.text_options && that.text_options) {
			if (this.text_options.length !== that.text_options.length) return false;
			for (let i = 0; i < this.text_options.length; i++) {
				if (!this.text_options[i].isIdenticalTo(that.text_options[i])) return false;
			}
		}
		return true;
	}
	clone() {
		const newArgs = { ...this.args };
		if (this.options) {
			newArgs.options = AnyNode.cloneAll(this.options);
		}
		if (this.text_options) {
			newArgs.text_options = AnyNode.cloneAll(this.text_options);
		}
		newArgs.messages = this.messages.slice();
		return new SerialDialog(this.debug.clone(), newArgs);
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof SerialDialog)) {
			throw new Error('not SerialDialog');
		}
		return v;
	}
	print() {
		const truncated = truncate(this.messages[0], 40);
		return [
			`// SerialDialog: "${truncated}"`,
			...(this.options || []).map((v) => v.print()),
			...(this.text_options || []).map((v) => v.print()),
		].join('\n');
	}
}

export type SerialDialogInfo = {
	settings: SerialDialogSettings;
	messages: string[];
	options: SerialDialogOption[];
};

export type SerialOptionType = 'text_options' | 'options';
export class SerialDialogOption extends MathlangNode {
	optionType: SerialOptionType;
	label: string;
	script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		if (args.optionType !== 'text_options' && args.optionType !== 'options') {
			throw new Error('invalid option type ' + args.optionType);
		}
		this.optionType = args.optionType;
		this.label = coerceToString(debug, args.label);
		this.script = coerceToString(debug, args.script);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof SerialDialogOption)) return false;
		if (this.optionType !== that.optionType) return false;
		if (this.label !== that.label) return false;
		if (this.script !== that.script) return false;
		return true;
	}
	clone() {
		return new SerialDialogOption(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, optionType: string, label: string, script: string) {
		return new SerialDialogOption(debug, {
			optionType,
			label,
			script,
		});
	}
	static breakIfNotAll(arr: unknown) {
		if (!Array.isArray(arr)) {
			throw new Error('SerialDialogOption[] not an Array');
		}
		if (!arr.every((v) => v instanceof SerialDialogOption)) {
			throw new Error('not every item in array is SerialDialogOption');
		}
		return arr;
	}
	print() {
		return `// ${this.optionType} "${this.label}" = script "${this.script}"`;
	}
}
// ------------------------------ ONE-OFFS ------------------------------ \\

export class IncludeNode extends MathlangNode {
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = coerceToString(debug, args.value);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof IncludeNode)) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		return new IncludeNode(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, value: string) {
		return new IncludeNode(debug, { value });
	}
	print() {
		return `include "${this.value}";`;
	}
}

export class ConstantDefinition extends MathlangNode {
	label: string;
	value: string | BoolLiteral | number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		if (!isMGSPrimitive(args.value)) throw new Error('not primitive');
		this.label = coerceToString(debug, args.label);
		this.value = args.value;
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ConstantDefinition)) return false;
		if (this.label !== that.label) return false;
		if (this.value !== that.value) return false; // TODO: add a thing to actually compare these
		return true;
	}
	clone() {
		const newArgs = { ...this.args };
		if (this.value instanceof BoolLiteral) {
			newArgs.value = this.value.clone();
		}
		return new ConstantDefinition(this.debug.clone(), newArgs);
	}
	static quick(debug: MathlangLocation, label: string, value: string | BoolLiteral | number) {
		return new ConstantDefinition(debug, { label, value });
	}
	print() {
		return `${this.label} = ${this.value};`;
	}
}

export class ScriptDefinition extends MathlangNode {
	scriptName: string;
	prePrint?: string;
	testPrint?: string;
	printed?: string;
	rawNodes?: AnyNode[];
	actions: AnyNode[];
	preBakingActions?: AnyNode[];
	copyScriptResolved?: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.scriptName = coerceToString(debug, args.scriptName);
		if (typeof args.prePrint === 'string') this.prePrint = args.prePrint;
		if (typeof args.testPrint === 'string') this.testPrint = args.testPrint;
		if (typeof args.printed === 'string') this.printed = args.printed;
		if (args.rawNodes) {
			this.rawNodes = AnyNode.breakIfNotAll(args.rawNodes);
		}
		if (args.preActions) {
			this.preBakingActions = AnyNode.breakIfNotAll(args.preActions);
		}
		this.actions = AnyNode.breakIfNotAll(args.actions);
		if (args.copyScriptResolved) this.copyScriptResolved = true;
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ScriptDefinition)) return false;
		if (this.scriptName !== that.scriptName) return false;
		if (this.actions.length !== that.actions.length) return false;
		for (let i = 0; i < this.actions.length; i++) {
			if (!this.actions[i].isIdenticalTo(that.actions[i])) return false;
		}
		return true;
	}
	getScript() {
		return this.scriptName;
	}
	setScript(script: string) {
		this.scriptName = script;
	}
	clone() {
		const cloned = new ScriptDefinition(this.debug.clone(), this.args);
		cloned.actions = AnyNode.cloneAll(this.actions);
		if (this.rawNodes) {
			cloned.rawNodes = AnyNode.cloneAll(this.rawNodes);
		}
		if (this.preBakingActions) {
			cloned.preBakingActions = AnyNode.cloneAll(this.preBakingActions);
		}
		return cloned;
	}
	static quick(debug: MathlangLocation, scriptName: string, actions: AnyNode[]) {
		return new ScriptDefinition(debug, { scriptName, actions });
	}
	static processAndMake(debug: MathlangLocation, scriptName: string, blockNode: TreeSitterNode) {
		const rawActions = handleNode(debug.using(blockNode));
		const actions = flattenAndDoAutoReturn(debug.using(blockNode), rawActions);
		return ScriptDefinition.quick(debug, scriptName, actions);
	}
	print() {
		return `// ScriptDefinition: "${this.scriptName}"`;
	}
}

export class CommentNode extends MathlangNode {
	comment: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.comment = coerceToString(debug, args.comment);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CommentNode)) return false;
		if (this.comment !== that.comment) return false;
		return true;
	}
	clone() {
		return new CommentNode(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, comment: string) {
		return new CommentNode(debug, { comment });
	}
	print() {
		const truncated = truncate(this.comment, 70);
		return `// ${truncated}`;
	}
}

export class LabelDefinition extends MathlangNode {
	label: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.label = coerceToString(debug, args.label);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof LabelDefinition)) return false;
		if (this.label !== that.label) return false;
		return true;
	}
	clone() {
		return new LabelDefinition(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, label: string) {
		return new LabelDefinition(debug, { label });
	}
	ifLabelAddSuffix(suffix: string) {
		this.label += suffix;
		return this;
	}
	print() {
		return `${ACTION.sanitizeLabel(this.label)}:`;
	}
}

export class JSONLiteral extends MathlangNode {
	json: AnyNode[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		if (!Array.isArray(args.json)) {
			throw new Error('JSON literal needs to be an array');
		}
		const sanitized = args.json.map((v) => {
			if (v instanceof AnyNode) {
				return v;
			}
			return ACTION.Action.fromArgs(v, debug);
		});
		this.json = AnyNode.breakIfNotAll(sanitized);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof JSONLiteral)) return false;
		if (this.json.length !== that.json.length) return false;
		for (let i = 0; i < this.json.length; i++) {
			if (!this.json[i].isIdenticalTo(that.json[i])) return false;
		}
		return true;
	}
	clone() {
		return new JSONLiteral(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, json: AnyNode[]) {
		return new JSONLiteral(debug, { json });
	}
	print() {
		return `json${JSON.stringify(this.json, null, '  ')}`;
	}
}

export class CopyMacro extends MathlangNode {
	script: string;
	search_and_replace?: Record<string, string>;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.script = coerceToString(debug, args.script);
		if (
			args.search_and_replace &&
			typeof args.search_and_replace === 'object' &&
			Object.keys(args.search_and_replace).length > 0
		) {
			const search_and_replace: Record<string, string> = {};
			Object.entries(args.search_and_replace).forEach(([k, v]) => {
				search_and_replace[k] = v;
			});
			this.search_and_replace = search_and_replace;
		}
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CopyMacro)) return false;
		if (this.script !== that.script) return false;
		if (this.search_and_replace && !that.search_and_replace) return false;
		if (!this.search_and_replace && that.search_and_replace) return false;
		if (this.search_and_replace && that.search_and_replace) {
			const keys: string[] = [
				...new Set([
					...Object.keys(this.search_and_replace),
					...Object.keys(that.search_and_replace),
				]),
			];
			for (let i = 0; i < keys.length; i++) {
				const key_i = keys[i];
				if (this.search_and_replace[key_i] !== that.search_and_replace[key_i]) {
					return false;
				}
			}
		}
		return true;
	}
	getScript() {
		return this.script;
	}
	setScript(script: string) {
		this.script = script;
	}
	clone() {
		return new CopyMacro(this.debug.clone(), this.args);
	}
	static quick(
		debug: MathlangLocation,
		script: string,
		search_and_replace: Record<string, string> = {},
	) {
		return new CopyMacro(debug, { script, search_and_replace });
	}
	print() {
		return `"${this.script}"()`;
	}
}

// needs to be one unit of thing for reasons, but still contain than one thing
export class MathlangSequence extends MathlangNode {
	type: string;
	steps: AnyNode[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.type = String(args.type) || 'unspecified sequence type';
		this.steps = AnyNode.breakIfNotAll(args.steps);
		if (!(this.steps[0] instanceof CommentNode)) {
			// TODO: the condition might catch other, non-sequence comments tho?
			const innerComment = debug.node.text.replace(/[\n\s\t]+/g, ' ');
			const comment = `${args.type}: ${innerComment}`;
			const mathlangComment = CommentNode.quick(debug, comment);
			this.steps.unshift(mathlangComment);
		}
		this.steps = flattenNodes(this.steps);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof MathlangSequence)) return false;
		if (this.type !== that.type) return false;
		if (this.steps.length !== that.steps.length) return false;
		for (let i = 0; i < this.steps.length; i++) {
			if (!this.steps[i].isIdenticalTo(that.steps[i])) return false;
		}
		return true;
	}
	clone() {
		const newArgs = { ...this.args };
		newArgs.steps = AnyNode.cloneAll(this.steps);
		return new MathlangSequence(this.debug.clone(), newArgs);
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof MathlangSequence)) {
			throw new Error('not MathlangSequence');
		}
		return v;
	}
	static quick(debug: MathlangLocation, steps: AnyNode[], type?: string) {
		return new MathlangSequence(debug, { steps, type });
	}
	static orSingle = (debug: MathlangLocation, steps: AnyNode[], type: string): AnyNode => {
		if (steps.length === 0) {
			throw new Error('empty MathlangSequence steps for ' + type);
		}
		if (steps.length === 1) return steps[0];
		return MathlangSequence.quick(debug, steps, type);
	};
	print() {
		return this.steps.map((v) => v.print()).join('\n');
	}
}

// ------------------------------ INT EXPRESSIONS ------------------------------ \\

export class IntExpression extends MathlangNode {
	static breakIfNot(v: unknown) {
		if (!(v instanceof IntExpression)) {
			throw new Error('not IntExpression');
		}
		return v;
	}
	toSteps(destinationVar: string): AnyNode[] {
		// USE THE CHILDREN
		return this.toSteps(destinationVar);
	}
	assignToVar(destinationVar: string): AnyNode {
		// USE THE CHILDREN
		return this.assignToVar(destinationVar);
	}
	expPrint() {
		return `(unknown IntExpression)`;
	}
	print() {
		return `// IntExpression: ${this.expPrint()}`;
	}
}

export class IntBinaryExpression extends IntExpression {
	lhs: IntExpression;
	rhs: IntExpression;
	op: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.lhs = IntExpression.breakIfNot(args.lhs);
		this.rhs = IntExpression.breakIfNot(args.rhs);
		this.op = coerceToString(debug, args.op);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof IntBinaryExpression)) return false;
		if (!this.lhs.isIdenticalTo(this.lhs)) return false;
		if (!this.rhs.isIdenticalTo(this.rhs)) return false;
		if (this.op !== that.op) return false;
		return true;
	}
	clone() {
		const newArgs = { ...this.args };
		newArgs.lhs = this.lhs.clone();
		newArgs.rhs = this.rhs.clone();
		return new IntBinaryExpression(this.debug.clone(), newArgs);
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof IntBinaryExpression)) {
			throw new Error('not IntBinaryExpression');
		}
		return v;
	}
	toSteps(destinationVar: string): AnyNode[] {
		const steps: AnyNode[] = [];
		const lhs = this.lhs;
		const op = this.op;
		const rhs = this.rhs;

		// set up the LHS
		if (lhs instanceof IntUnit) {
			steps.push(...lhs.toSteps(destinationVar));
		} else if (lhs instanceof IntBinaryExpression) {
			// can use the same temporary since it's the lhs and we're going LTR
			steps.push(...lhs.toSteps(destinationVar));
		}

		// do the RHS
		if (
			rhs instanceof IntBinaryExpression ||
			rhs instanceof FnCall ||
			rhs instanceof FnCallReturnValue
		) {
			const newTemp = newTemporary();
			steps.push(...rhs.toSteps(newTemp));
			steps.push(ACTION.MUTATE_VARIABLES.change(destinationVar, newTemp, op));
			dropTemporary();
		} else if (rhs instanceof IntUnit) {
			steps.push(...rhs.toStepsWithOp(destinationVar, op));
		}
		return steps;
	}
	assignToVar(destinationVar: string) {
		newTemporary(destinationVar);
		const steps = this.toSteps(destinationVar);
		dropTemporary();
		return MathlangSequence.quick(this.debug, steps, 'IntBinaryExpression.assignToVar');
	}
	expPrint() {
		return `(${this.lhs.expPrint()} ${this.op} ${this.rhs.expPrint()})`;
	}
	print() {
		return `// IntBinaryExpression: ${this.expPrint()}`;
	}
}

export class IntUnit extends IntExpression {
	static fromAny(debug: MathlangLocation, v: unknown) {
		if (v instanceof IntBinaryExpression) return v;
		if (v instanceof IntGetable) return v;
		if (v instanceof ArrayMethodChain) {
			return ArrayValueLookup.quick(debug, v);
		}
		if (
			debug.node.grammarType === 'CONSTANT' &&
			typeof v !== 'string' &&
			typeof v !== 'number'
		) {
			v = coerceToString(debug, v, 'constant');
		}
		if (typeof v === 'number') {
			return NumberLiteral.quick(debug, v);
		}
		if (typeof v === 'string') {
			return IdentifierLiteral.quick(debug, v);
		}
		throw new Error('invalid IntUnit');
	}
	toSteps(destinationVar: string): AnyNode[] {
		// TODO: I think this shouldn't be being used?
		return [this.assignToVar(destinationVar)];
	}
	assignToVar(variable: string): AnyNode {
		// TODO: I think this shouldn't be being used?
		return ACTION.Action.fromArgs({ ...this, variable });
	}
	toStepsWithOp(destinationVar: string, op: string) {
		const temp = newTemporary();
		const steps = [
			...this.toSteps(temp),
			ACTION.MUTATE_VARIABLES.change(destinationVar, temp, op),
		];
		dropTemporary();
		return steps;
	}
	assignToVarWithOp(destinationVar: string, op: string): AnyNode {
		return MathlangSequence.quick(
			this.debug,
			this.toStepsWithOp(destinationVar, op),
			`from IntGetable.assignToVarWithOp`,
		);
	}
	expPrint() {
		return `(unknown IntUnit)`;
	}
	print() {
		return `// IntUnit: ${this.expPrint()}`;
	}
}

export class NumberLiteral extends IntUnit {
	value: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = ACTION.breakIfNotNumber(args.value);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof NumberLiteral)) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		return new NumberLiteral(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, value: number) {
		return new NumberLiteral(debug, { value });
	}
	toSteps(destinationVar: string): AnyNode[] {
		return [this.assignToVar(destinationVar)];
	}
	assignToVar(destinationVar: string): AnyNode {
		return ACTION.MUTATE_VARIABLE.set(destinationVar, this.value);
	}
	toStepsWithOp(destinationVar: string, op: string): AnyNode[] {
		return [this.assignToVarWithOp(destinationVar, op)];
	}
	assignToVarWithOp(destinationVar: string, op: string): AnyNode {
		return ACTION.MUTATE_VARIABLE.change(this.debug, destinationVar, this.value, op);
	}
	expPrint() {
		return `${this.value}`;
	}
	print() {
		return `// NumberLiteral: ${this.expPrint()}`;
	}
}
export class IntGetable extends IntUnit {
	expPrint() {
		return `(unknown IntGetable)`;
	}
	print() {
		return `// IntGetable: ${this.expPrint()}`;
	}
}
export class IdentifierLiteral extends IntGetable {
	source: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.source = coerceToString(debug, args.source);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof IdentifierLiteral)) return false;
		if (this.source !== that.source) return false;
		return true;
	}
	clone() {
		return new IdentifierLiteral(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, source: string) {
		return new IdentifierLiteral(debug, { source });
	}
	toSteps(destinationVar: string): AnyNode[] {
		return [this.assignToVar(destinationVar)];
	}
	assignToVar(destinationVar: string): AnyNode {
		return ACTION.MUTATE_VARIABLES.set(this.debug, destinationVar, this.source);
	}
	toStepsWithOp(destinationVar: string, op: string): AnyNode[] {
		return [this.assignToVarWithOp(destinationVar, op)];
	}
	assignToVarWithOp(destinationVar: string, op: string): AnyNode {
		return ACTION.MUTATE_VARIABLES.change(destinationVar, this.source, op);
	}
	expPrint() {
		return `"${this.source}"`;
	}
	print() {
		return `// IdentifierLiteral: "${this.expPrint()}"`;
	}
}
export class EntityIntField extends IntGetable {
	entity: string;
	field: string;
	inbound: false;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.inbound = false;
		this.entity = coerceToString(debug, args.entity);
		this.field = coerceToString(debug, args.field);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof EntityIntField)) return false;
		if (this.entity !== that.entity) return false;
		if (this.field !== that.field) return false;
		if (this.inbound !== that.inbound) return false;
		return true;
	}
	clone() {
		return new EntityIntField(this.debug.clone(), this.args);
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof EntityIntField)) {
			throw new Error('not EntityIntField');
		}
		return v;
	}
	static quick(debug: MathlangLocation, entity: string, field: string) {
		return new EntityIntField(debug, { entity, field });
	}
	toSteps(destinationVar: string): AnyNode[] {
		return [this.assignToVar(destinationVar)];
	}
	assignToVar(variable: string): AnyNode {
		return ACTION.COPY_VARIABLE.intoVariable(this.entity, this.field, variable);
	}
	setToVariable(variable: string): AnyNode {
		return ACTION.COPY_VARIABLE.intoField(variable, this.entity, this.field);
	}
	setToNumber(value: number) {
		if (this.field === 'x') {
			return ACTION.SET_ENTITY_X.quick(this.entity, value);
		}
		if (this.field === 'y') {
			return ACTION.SET_ENTITY_Y.quick(this.entity, value);
		}
		if (this.field === 'primary_id') {
			return ACTION.SET_ENTITY_PRIMARY_ID.quick(this.entity, value);
		}
		if (this.field === 'secondary_id') {
			return ACTION.SET_ENTITY_SECONDARY_ID.quick(this.entity, value);
		}
		if (this.field === 'primary_id_type') {
			return ACTION.SET_ENTITY_PRIMARY_ID_TYPE.quick(this.entity, value);
		}
		if (this.field === 'current_animation') {
			return ACTION.SET_ENTITY_CURRENT_ANIMATION.quick(this.entity, value);
		}
		if (this.field === 'animation_frame') {
			return ACTION.SET_ENTITY_CURRENT_FRAME.quick(this.entity, value);
		}
		if (this.field === 'strafe') {
			return ACTION.SET_ENTITY_MOVEMENT_RELATIVE.quick(this.entity, value);
		}
		if (this.field === 'relative_direction') {
			return ACTION.SET_ENTITY_DIRECTION_RELATIVE.quick(this.entity, value);
		}
		throw new Error('unreachable');
	}
	intoNumberCheckableEquality() {
		const entity = this.entity;
		const field = this.field;
		const debug = this.debug;
		if (field === 'x') {
			return CheckEntityX.quick(debug, entity, NaN);
		} else if (field === 'y') {
			return CheckEntityY.quick(debug, entity, NaN);
		} else if (field === 'primary_id') {
			return CheckEntityPrimaryID.quick(debug, entity, NaN);
		} else if (field === 'secondary_id') {
			return CheckEntitySecondaryID.quick(debug, entity, NaN);
		} else if (field === 'primary_id_type') {
			return CheckEntityPrimaryIDType.quick(debug, entity, NaN);
		} else if (field === 'current_animation') {
			return CheckEntityCurrentAnimation.quick(debug, entity, NaN);
		} else if (field === 'animation_frame') {
			return CheckEntityCurrentFrame.quick(debug, entity, NaN);
		} else if (field === 'strafe') {
			const propertyNode = mandatoryChildForField(debug, 'property');
			debug
				.using(propertyNode)
				.quickError(
					'unsupported entity field',
					`this property is not supported in boolean expressions`,
				);
		}
		throw new Error('could not format number_checkable_equality');
	}
	expPrint() {
		return `${printEntityName(this.entity)} ${this.field}`;
	}
	print() {
		return `// EntityIntField: ${this.expPrint()}`;
	}
}
export class RNGSingle extends IntGetable {
	value: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = ACTION.breakIfNotNumber(args.value);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof RNGSingle)) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		return new RNGSingle(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, value: number) {
		return new RNGSingle(debug, { value });
	}
	toSteps(destinationVar: string): AnyNode[] {
		return [this.assignToVar(destinationVar)];
	}
	assignToVar(destinationVar: string): AnyNode {
		return ACTION.MUTATE_VARIABLE.change(this.debug, destinationVar, this.value, '?');
	}
	expPrint() {
		return `RNG!(${this.value})`;
	}
	print() {
		return `${this.expPrint()}`;
	}
}
export class RNGPair extends IntGetable {
	value: number;
	add: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = ACTION.breakIfNotNumber(args.value);
		this.add = ACTION.breakIfNotNumber(args.add);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof RNGPair)) return false;
		if (this.value !== that.value) return false;
		if (this.add !== that.add) return false;
		return true;
	}
	clone() {
		return new RNGPair(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, value: number, add: number) {
		return new RNGPair(debug, { value, add });
	}
	toSteps(destinationVar: string): AnyNode[] {
		return [
			ACTION.MUTATE_VARIABLE.change(this.debug, destinationVar, this.value, '?'),
			ACTION.MUTATE_VARIABLE.change(this.debug, destinationVar, this.add, '+'),
		];
	}
	assignToVar(destinationVar: string): AnyNode {
		return MathlangSequence.quick(
			this.debug,
			this.toSteps(destinationVar),
			`RNGPair.toSequence`,
		);
	}
	expPrint() {
		return `RNG!(${this.add}, =${this.value - 1})`;
	}
	print() {
		return `${this.expPrint()}`;
	}
}
export class FnCall extends IntGetable {
	identifier: string;
	type: 'script' | 'fn';
	rawBody: TreeSitterNode;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.identifier = coerceToString(debug, args.identifier);
		if (!(args.rawBody instanceof TreeSitterNode)) {
			throw new Error('should be TreeSitterNode');
		}
		this.rawBody = args.rawBody;
		const type = coerceToString(debug, args.type);
		if (type === 'script' || type === 'fn') {
			this.type = type;
		} else {
			throw new Error('invalid Fn type ' + type);
		}
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof FnCall)) return false;
		if (this.identifier !== that.identifier) return false;
		if (this.type !== that.type) return false;
		if (this.rawBody !== that.rawBody) return false;
		return true;
	}
	clone() {
		return new FnCall(this.debug.clone(), this.args);
	}
	static quick(
		debug: MathlangLocation,
		identifier: string,
		type: string,
		rawBody: TreeSitterNode,
	) {
		return new FnCall(debug, { identifier, type, rawBody });
	}
	bake(): FnCallReturnValue {
		const steps = handleNode(this.debug.using(this.rawBody));
		return FnCallReturnValue.quick(this.debug, this.identifier, 'fn', flattenNodes(steps));
	}
	toSteps(destinationVar: string): AnyNode[] {
		const baked = this.bake();
		return baked.toSteps(destinationVar);
	}
	assignToVar(destinationVar: string): AnyNode {
		return MathlangSequence.quick(
			this.debug,
			this.toSteps(destinationVar),
			`from FnCall (${this.type} "${this.identifier}")`,
		);
	}
	expPrint() {
		return `${this.identifier}()`;
	} // todo: how to put in args?
	print() {
		return `${this.expPrint()}`;
	}
}
export class FnCallReturnValue extends IntGetable {
	steps: AnyNode[];
	identifier: string;
	type: 'script' | 'fn';
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.identifier = coerceToString(debug, args.identifier);
		this.steps = AnyNode.breakIfNotAll(args.steps);
		const type = coerceToString(debug, args.type);
		if (type === 'script' || type === 'fn') {
			this.type = type;
		} else {
			throw new Error('invalid Fn type ' + type);
		}
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof FnCallReturnValue)) return false;
		if (this.identifier !== that.identifier) return false;
		if (this.type !== that.type) return false;
		if (this.steps.length !== that.steps.length) return false;
		for (let i = 0; i < this.steps.length; i++) {
			if (!this.steps[i].isIdenticalTo(that.steps[i])) return false;
		}
		return true;
	}
	clone() {
		return new FnCallReturnValue(this.debug.clone(), this.args);
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof FnCallReturnValue)) {
			throw new Error('not FnCallReturnValue');
		}
		return v;
	}
	static quick(debug: MathlangLocation, identifier: string, type: string, steps: AnyNode[]) {
		return new FnCallReturnValue(debug, { identifier, type, steps });
	}
	toSteps(destinationVar: string): AnyNode[] {
		const assign = ACTION.MUTATE_VARIABLES.set(this.debug, destinationVar, RETURN);
		// so wrong values don't live in the return "register" (todo: is this helpful?)
		const reset = ACTION.MUTATE_VARIABLE.set(RETURN, 0);
		return [...this.steps, assign, reset];
	}
	assignToVar(destinationVar: string): AnyNode {
		return MathlangSequence.quick(
			this.debug,
			this.toSteps(destinationVar),
			`from FnCallReturnValue (${this.type} "${this.identifier}")`,
		);
	}
	expPrint() {
		return `${this.identifier}()`;
	} // todo: how to put in args?
	print() {
		return `${this.expPrint()}`;
	}
}
export class ArrayValueLookup extends IntGetable {
	chain: ArrayMethodChain;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.chain = ArrayMethodChain.breakIfNot(args.chain);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArrayValueLookup)) return false;
		if (!this.chain.isIdenticalTo(that.chain)) return false;
		return true;
	}
	clone() {
		return new ArrayValueLookup(this.debug.clone(), this.args);
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayValueLookup)) {
			throw new Error('not ArrayLookup');
		}
		return v;
	}
	static quick(debug: MathlangLocation, chain: ArrayMethodChain) {
		return new ArrayValueLookup(debug, { chain });
	}
	toSteps(destinationVar: string): AnyNode[] {
		return this.chain.toSteps(destinationVar);
	}
	assignToVar(destinationVar: string): AnyNode {
		return MathlangSequence.quick(
			this.debug,
			this.toSteps(destinationVar),
			`from ArrayValueLookup (${this.chain.identifier}[??])`,
		);
	}
	expPrint() {
		return `${this.chain.identifier}[??]`; // WON'T WORK
	}
	print() {
		return `${this.expPrint()}`;
	}
}

// ------------------------------ BOOL EXPRESSIONS ------------------------------ \\

export class BoolExpression extends MathlangNode {
	invert() {
		console.error('the children should be doing this, not me');
		return this;
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof BoolExpression)) {
			throw new Error('not BoolExpression');
		}
		return v;
	}
	toSteps(ifLabel: string): AnyNode[] {
		// break if not a known thing
		if (!(this instanceof BoolExpression)) {
			throw new Error(`this BoolExpression.toSteps not implemented (ifLabel ${ifLabel})`);
		}
		// TODO: how am I supposed to be doing this?
		return this.toSteps(ifLabel);
	}
	assignToVar(destinationVar: string): AnyNode {
		const lhsAction = ACTION.SET_SAVE_FLAG.toValue(destinationVar, true);
		return this.assignToSetBool(lhsAction);
	}
	assignToSetBool(setBool: ACTION.ActionSetBool): AnyNode {
		// player glitched = self glitched;
		// ->
		// if (self glitched) { player glitched = true; } else { player glitched = false; }
		const cloneIfFalse = setBool.clone();
		if (!(cloneIfFalse instanceof ACTION.ActionSetBool)) {
			throw new Error('unreachable');
		}
		cloneIfFalse.invert();
		const steps = simpleBranchMaker(this.debug, this, [setBool], [cloneIfFalse]);
		return MathlangSequence.quick(this.debug, steps, 'BoolExpression.assignToSetBool');
	}
	expPrint() {
		return `(unknown BoolExpression)`;
	}
	print() {
		return `// BoolExpression: ${this.expPrint()}`;
	}
}

export class BoolComparisonSequence extends BoolExpression {
	type?: string;
	steps: AnyNode[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		if (typeof args.type === 'string') this.type = args.type;
		this.steps = AnyNode.breakIfNotAll(args.steps);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof BoolComparisonSequence)) return false;
		if (this.type !== that.type) return false;
		if (this.steps.length !== that.steps.length) return false;
		for (let i = 0; i < this.steps.length; i++) {
			if (!this.steps[i].isIdenticalTo(that.steps[i])) return false;
		}
		return true;
	}
	clone() {
		const newArgs = { ...this.args };
		newArgs.steps = AnyNode.cloneAll(this.steps);
		return new BoolComparisonSequence(this.debug.clone(), newArgs);
	}
	getFinalStep() {
		const final = this.steps[this.steps.length - 1];
		if (final instanceof BoolComparison) {
			return final;
		}
		throw new Error('the last one shoudl be a bool expression');
	}
	invert() {
		const final = this.getFinalStep();
		final.expected_bool = !final.expected_bool;
		return this;
	}
	static quick(debug: MathlangLocation, steps: AnyNode[], type?: string) {
		return new BoolComparisonSequence(debug, { steps, type });
	}
	static orSingle = (debug: MathlangLocation, steps: AnyNode[], type: string): AnyNode => {
		if (steps.length === 0) {
			throw new Error('empty BoolComparisonSequence steps for ' + type);
		}
		if (steps.length === 1) return steps[0];
		return BoolComparisonSequence.quick(debug, steps, type);
	};
	toSteps(ifLabel: string) {
		const final = this.getFinalStep();
		const newFinal = ACTION.Action.fromArgs({ ...final, label: ifLabel });
		this.steps[this.steps.length - 1] = newFinal;
		return this.steps;
	}
	expPrint() {
		return `(complicated BoolComparisonSequence)`;
	}
	print() {
		return this.steps.map((v) => v.print()).join('\n');
	}
}

export class BoolUnit extends BoolExpression {
	expPrint() {
		return `(unknown BoolUnit)`;
	}
	print() {
		return `// BoolUnit: ${this.expPrint()}`;
	}
}

export class BoolLiteral extends BoolUnit {
	value: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = ACTION.breakIfNotBool(args.value);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof BoolLiteral)) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		return new BoolLiteral(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, value: boolean) {
		return new BoolLiteral(debug, { value });
	}
	invert() {
		this.value = !this.value;
		return this;
	}
	assignToVar(destinationVar: string): AnyNode {
		return ACTION.SET_SAVE_FLAG.toValue(destinationVar, this.value);
	}
	assignToSetBool(setBool: ACTION.ActionSetBool): AnyNode {
		setBool.updateProp(this.value);
		return setBool;
	}
	toSteps(ifLabel: string) {
		return this.value ? [GotoLabel.quick(this.debug, ifLabel)] : [];
	}
	expPrint() {
		return `${this.value}`;
	}
	print() {
		return `// BoolLiteral: ${this.expPrint()}`;
	}
}

export class BoolComparison extends BoolExpression {
	action: string;
	expected_bool: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'THE CHILD SHOULD OVERRIDE THIS';
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof BoolComparison)) return false;
		if (this.action !== that.action) return false;
		if (this.expected_bool !== that.expected_bool) return false;
		return true;
	}
	invert() {
		this.expected_bool = !this.expected_bool;
		return this;
	}
	getBool() {
		return this.expected_bool;
	}
	toAction(args: GenericObj) {
		return ACTION.Action.fromArgs({ ...this, ...args });
	}
	toDestinationLabel(label: string) {
		return this.toAction({ label });
	}
	toSteps(label: string): AnyNode[] {
		return [this.toDestinationLabel(label)];
	}
	expPrint() {
		return `(unknown BoolComparison)`;
	}
	print() {
		return `// BoolComparison: ${this.expPrint()}`;
	}
}

export class BoolBinaryExpression extends BoolExpression {
	lhs: BoolExpression;
	rhs: BoolExpression;
	op: string;
	lhsNode: TreeSitterNode;
	rhsNode: TreeSitterNode;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		if (!(args.lhs instanceof BoolExpression)) throw new Error('not BoolExpression');
		if (!(args.rhs instanceof BoolExpression)) throw new Error('not BoolExpression');
		if (!(args.lhsNode instanceof TreeSitterNode)) throw new Error('not TSNode');
		if (!(args.rhsNode instanceof TreeSitterNode)) throw new Error('not TSNode');
		this.op = coerceToString(debug, args.op);
		this.lhs = args.lhs;
		this.rhs = args.rhs;
		this.lhsNode = args.lhsNode;
		this.rhsNode = args.rhsNode;
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof BoolBinaryExpression)) return false;
		if (!this.lhs.isIdenticalTo(that.lhs)) return false;
		if (!this.rhs.isIdenticalTo(that.rhs)) return false;
		if (this.op !== that.op) return false;
		if (this.lhsNode !== that.lhsNode) return false;
		if (this.rhsNode !== that.rhsNode) return false;
		return true;
	}
	clone() {
		const newArgs = { ...this.args };
		newArgs.lhs = this.lhs.clone();
		newArgs.rhs = this.rhs.clone();
		return new BoolBinaryExpression(this.debug.clone(), newArgs);
	}
	invert() {
		if (this.op === '||' || this.op === '&&') {
			this.lhs = this.lhs.invert();
			this.rhs = this.rhs.invert();
		}
		this.op = inverseOpMap[this.op];
		return this;
	}
	toSteps(ifLabel: string): AnyNode[] {
		const debug = this.debug;
		const op = this.op;
		const lhs = this.lhs;
		const rhs = this.rhs;

		if (op === '||') {
			return [...lhs.toSteps(ifLabel), ...rhs.toSteps(ifLabel)];
		}
		if (op === '&&') {
			// basically nesting the ifs
			const suffix = debug.f.p.advanceGotoSuffix();
			const secondIfTrueLabel = `if true #${suffix}`;
			const secondRendezvousLabel = `rendezvous #${suffix}`;
			return [
				...lhs.toSteps(secondIfTrueLabel),
				GotoLabel.quick(debug, secondRendezvousLabel),
				LabelDefinition.quick(debug, secondIfTrueLabel),
				...rhs.toSteps(ifLabel),
				LabelDefinition.quick(debug, secondRendezvousLabel),
			];
		}

		if (op !== '==' && op !== '!=') {
			throw new Error('expected == or !==, found ' + op);
		}

		// Cannot directly compare save flags. Must branch on if they are both true, or both false
		const expandAs = new BoolBinaryExpression(debug, {
			op: '||',
			lhs: new BoolBinaryExpression(lhs.debug, {
				op: '&&',
				lhs,
				rhs,
				lhsNode: this.lhsNode,
				rhsNode: this.rhsNode,
			}),
			rhs: new BoolBinaryExpression(rhs.debug, {
				op: '&&',
				lhs: lhs.invert(),
				rhs: rhs.invert(),
				lhsNode: this.lhsNode,
				rhsNode: this.rhsNode,
			}),
			lhsNode: this.lhsNode,
			rhsNode: this.rhsNode,
		});
		return expandAs.toSteps(ifLabel);
	}
	expPrint() {
		return `(${this.lhs.expPrint()} ${this.op} ${this.rhs.expPrint()})`;
	}
	print() {
		return `// BoolBinaryExpression: ${this.expPrint()}`;
	}
}

// ------------------------------ INTERMEDIATES ------------------------------ \\

// For things that are otherwise actions, they will be missing their destinations until it's time to make them a real Action

// --------------- BOOL GETABLE

export class BoolGetable extends BoolUnit {
	action: string;
	comment?: string;
	expected_bool: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'THE CHILD SHOULD OVERRIDE THIS';
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof BoolGetable)) return false;
		if (this.action !== that.action) return false;
		if (this.comment !== that.comment) return false;
		if (this.expected_bool !== that.expected_bool) return false;
		return true;
	}
	getBool() {
		return this.expected_bool;
	}
	invert() {
		this.expected_bool = !this.expected_bool;
		return this;
	}
	toAction(args: GenericObj) {
		return ACTION.Action.fromArgs({ ...this, ...args });
	}
	toDestinationLabel(label: string) {
		return this.toAction({ label });
	}
	toSteps(label: string) {
		return [this.toDestinationLabel(label)];
	}
	expPrint() {
		return `(unknown BoolGetable)`;
	}
	print() {
		return `// BoolGetable: ${this.expPrint()}`;
	}
}
export class CheckEntityGlitched extends BoolGetable {
	action: 'CHECK_ENTITY_GLITCHED';
	entity: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_GLITCHED';
		this.entity = coerceToString(debug, args.entity);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityGlitched)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		return true;
	}
	clone() {
		return new CheckEntityGlitched(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, entity: string, provided_bool?: boolean) {
		return new CheckEntityGlitched(debug, {
			entity,
			expected_bool: provided_bool === undefined ? true : provided_bool,
		});
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} glitched`
			: `!${printEntityName(this.entity)} glitched`;
	}
	print() {
		return `// CheckEntityGlitched: ${this.expPrint()}`;
	}
}
export class CheckSaveFlag extends BoolGetable {
	action: 'CHECK_SAVE_FLAG';
	save_flag: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_SAVE_FLAG';
		this.save_flag = coerceToString(debug, args.save_flag);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckSaveFlag)) return false;
		// if (this.action !== that.action) return false;
		if (this.save_flag !== that.save_flag) return false;
		return true;
	}
	clone() {
		return new CheckSaveFlag(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, save_flag: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckSaveFlag(debug, { save_flag, expected_bool });
	}
	expPrint() {
		return this.expected_bool ? `${this.save_flag}` : `!${this.save_flag}`;
	}
	print() {
		return `// CheckSaveFlag: ${this.expPrint()}`;
	}
}
export class CheckIfEntityIsInGeometry extends BoolGetable {
	action: 'CHECK_IF_ENTITY_IS_IN_GEOMETRY';
	geometry: string;
	entity: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_IF_ENTITY_IS_IN_GEOMETRY';
		this.geometry = coerceToString(debug, args.geometry);
		this.entity = coerceToString(debug, args.entity);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckIfEntityIsInGeometry)) return false;
		// if (this.action !== that.action) return false;
		if (this.geometry !== that.geometry) return false;
		if (this.entity !== that.entity) return false;
		return true;
	}
	clone() {
		return new CheckIfEntityIsInGeometry(this.debug.clone(), this.args);
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		geometry: string,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckIfEntityIsInGeometry(debug, {
			entity,
			geometry,
			expected_bool,
		});
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} intersects geometry "${this.geometry}"`
			: `!${printEntityName(this.entity)} intersects geometry "${this.geometry}"`;
	}
	print() {
		return `// CheckIfEntityIsInGeometry: ${this.expPrint()}`;
	}
}
export class CheckForButtonPress extends BoolGetable {
	action: 'CHECK_FOR_BUTTON_PRESS';
	button_id: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_FOR_BUTTON_PRESS';
		this.button_id = coerceToString(debug, args.button_id);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckForButtonPress)) return false;
		// if (this.action !== that.action) return false;
		if (this.button_id !== that.button_id) return false;
		return true;
	}
	clone() {
		return new CheckForButtonPress(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, button_id: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckForButtonPress(debug, { button_id, expected_bool });
	}
	expPrint() {
		return this.expected_bool
			? `button ${this.button_id} pressed`
			: `!button ${this.button_id} pressed`;
	}
	print() {
		return `// CheckForButtonPress: ${this.expPrint()}`;
	}
}
export class CheckForButtonState extends BoolGetable {
	action: 'CHECK_FOR_BUTTON_STATE';
	button_id: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_FOR_BUTTON_STATE';
		this.button_id = coerceToString(debug, args.button_id);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckForButtonState)) return false;
		// if (this.action !== that.action) return false;
		if (this.button_id !== that.button_id) return false;
		return true;
	}
	clone() {
		return new CheckForButtonState(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, button_id: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckForButtonState(debug, { button_id, expected_bool });
	}
	expPrint() {
		return this.expected_bool ? `button ${this.button_id} down` : `button ${this.button_id} up`;
	}
	print() {
		return `// CheckForButtonState: ${this.expPrint()}`;
	}
}
export class CheckDialogOpen extends BoolGetable {
	action: 'CHECK_DIALOG_OPEN';
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_DIALOG_OPEN';
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckDialogOpen)) return false;
		// if (this.action !== that.action) return false;
		return true;
	}
	clone() {
		return new CheckDialogOpen(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckDialogOpen(debug, { expected_bool });
	}
	expPrint() {
		return this.expected_bool ? `dialog open` : `dialog closed`;
	}
	print() {
		return `// CheckDialogOpen`;
	}
}
export class CheckSerialDialogOpen extends BoolGetable {
	action: 'CHECK_SERIAL_DIALOG_OPEN';
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_SERIAL_DIALOG_OPEN';
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckSerialDialogOpen)) return false;
		// if (this.action !== that.action) return false;
		return true;
	}
	clone() {
		return new CheckSerialDialogOpen(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckSerialDialogOpen(debug, { expected_bool });
	}
	expPrint() {
		return this.expected_bool ? `serial_dialog open` : `serial_dialog closed`;
	}
	print() {
		return `// CheckSerialDialogOpen`;
	}
}
export class CheckDebugMode extends BoolGetable {
	action: 'CHECK_DEBUG_MODE';
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_DEBUG_MODE';
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckDebugMode)) return false;
		if (this.action !== that.action) return false;
		return true;
	}
	clone() {
		return new CheckDebugMode(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckDebugMode(debug, { expected_bool });
	}
	expPrint() {
		return this.expected_bool ? `debug_mode` : `!debug_mode`;
	}
	print() {
		return `// CheckDebugMode`;
	}
}

// --------------- STRING CHECKABLE

export class StringCheckable extends BoolComparison {
	comment?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
	}
	updateProp(_: string) {
		// todo do I need this?
		throw new Error(`Parent should not be trying to change its string property (value ${_})`);
	}
	addDetails(string: string, op: string) {
		if (op !== '==' && op !== '!=') {
			throw new Error('expected == or !==, found ' + op);
		}
		this.updateProp(string);
		this.expected_bool = op === '==';
		return this;
	}
	expPrint() {
		return `(unknown StringCheckable)`;
	}
	print() {
		return `// StringCheckable: ${this.expPrint()}`;
	}
}

export class CheckEntityName extends StringCheckable {
	action: 'CHECK_ENTITY_NAME';
	entity: string;
	string: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_NAME';
		this.entity = coerceToString(debug, args.entity);
		this.string = coerceToString(debug, args.string);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityName)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.string !== that.string) return false;
		return true;
	}
	clone() {
		return new CheckEntityName(this.debug.clone(), this.args);
	}
	updateProp(value: string) {
		this.string = value;
	}
	getProp() {
		return this.string;
	}
	static quick(debug: MathlangLocation, entity: string, string: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityName(debug, {
			entity,
			string,
			expected_bool,
		});
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} name == "${this.string}"`
			: `${printEntityName(this.entity)} name != "${this.string}"`;
	}
	print() {
		return `// CheckEntityName: ${this.expPrint()}`;
	}
}
export class CheckEntityInteractScript extends StringCheckable {
	action: 'CHECK_ENTITY_INTERACT_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_INTERACT_SCRIPT';
		this.entity = coerceToString(debug, args.entity);
		this.expected_script = coerceToString(debug, args.expected_script);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityInteractScript)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.expected_script !== that.expected_script) return false;
		return true;
	}
	clone() {
		return new CheckEntityInteractScript(this.debug.clone(), this.args);
	}
	updateProp(value: string) {
		this.expected_script = value;
	}
	getProp() {
		return this.expected_script;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		expected_script: string,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityInteractScript(debug, {
			entity,
			expected_script,
			expected_bool,
		});
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} on_interact == "${this.expected_script}"`
			: `${printEntityName(this.entity)} on_interact != "${this.expected_script}"`;
	}
	print() {
		return `// CheckEntityInteractScript: ${this.expPrint()}`;
	}
}
export class CheckEntityTickScript extends StringCheckable {
	action: 'CHECK_ENTITY_TICK_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_TICK_SCRIPT';
		this.entity = coerceToString(debug, args.entity);
		this.expected_script = coerceToString(debug, args.expected_script);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityTickScript)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.expected_script !== that.expected_script) return false;
		return true;
	}
	clone() {
		return new CheckEntityTickScript(this.debug.clone(), this.args);
	}
	updateProp(value: string) {
		this.expected_script = value;
	}
	getProp() {
		return this.expected_script;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		expected_script: string,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityTickScript(debug, {
			entity,
			expected_script,
			expected_bool,
		});
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} on_tick == "${this.expected_script}"`
			: `${printEntityName(this.entity)} on_tick != "${this.expected_script}"`;
	}
	print() {
		return `// CheckEntityTickScript: ${this.expPrint()}`;
	}
}
export class CheckEntityLookScript extends StringCheckable {
	action: 'CHECK_ENTITY_LOOK_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_LOOK_SCRIPT';
		this.entity = coerceToString(debug, args.entity);
		this.expected_script = coerceToString(debug, args.expected_script);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityTickScript)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.expected_script !== that.expected_script) return false;
		return true;
	}
	clone() {
		return new CheckEntityLookScript(this.debug.clone(), this.args);
	}
	updateProp(value: string) {
		this.expected_script = value;
	}
	getProp() {
		return this.expected_script;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		expected_script: string,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityLookScript(debug, {
			entity,
			expected_script,
			expected_bool,
		});
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} on_look == "${this.expected_script}"`
			: `${printEntityName(this.entity)} on_look != "${this.expected_script}"`;
	}
	print() {
		return `// CheckEntityLookScript: ${this.expPrint()}`;
	}
}
export class CheckEntityType extends StringCheckable {
	action: 'CHECK_ENTITY_TYPE';
	entity: string;
	entity_type: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_TYPE';
		this.entity = coerceToString(debug, args.entity);
		this.entity_type = coerceToString(debug, args.entity_type);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityType)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.entity_type !== that.entity_type) return false;
		return true;
	}
	clone() {
		return new CheckEntityType(this.debug.clone(), this.args);
	}
	updateProp(value: string) {
		this.entity_type = value;
	}
	getProp() {
		return this.entity_type;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		entity_type: string,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityType(debug, { entity, entity_type, expected_bool });
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} type == "${this.entity_type}"`
			: `${printEntityName(this.entity)} type != "${this.entity_type}"`;
	}
	print() {
		return `// CheckEntityType: ${this.expPrint()}`;
	}
}
export class CheckEntityDirection extends StringCheckable {
	action: 'CHECK_ENTITY_DIRECTION';
	entity: string;
	direction: string; // north, south, east, west
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_DIRECTION';
		this.entity = coerceToString(debug, args.entity);
		this.direction = coerceToString(debug, args.direction);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityDirection)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.direction !== that.direction) return false;
		return true;
	}
	clone() {
		return new CheckEntityDirection(this.debug.clone(), this.args);
	}
	updateProp(value: string) {
		this.direction = value;
	}
	getProp() {
		return this.direction;
	}
	static quick(debug: MathlangLocation, entity: string, direction: string, op: string) {
		if (op !== '==' && op !== '!=') {
			throw new Error('expected == or !==, found ' + op);
		}
		const expected_bool = op === '==';
		return new CheckEntityDirection(debug, { entity, direction, expected_bool });
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} direction == ${this.direction}`
			: `${printEntityName(this.entity)} direction != ${this.direction}`;
	}
	print() {
		return `// CheckEntityDirection: ${this.expPrint()}`;
	}
}
export class CheckEntityPath extends StringCheckable {
	action: 'CHECK_ENTITY_PATH';
	geometry: string;
	entity: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_PATH';
		this.entity = coerceToString(debug, args.entity);
		this.geometry = coerceToString(debug, args.geometry);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityPath)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.geometry !== that.geometry) return false;
		return true;
	}
	clone() {
		return new CheckEntityPath(this.debug.clone(), this.args);
	}
	updateProp(value: string) {
		this.geometry = value;
	}
	getProp() {
		return this.geometry;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		geometry: string,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityPath(debug, { entity, geometry, expected_bool });
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} path == geometry "${this.geometry}"`
			: `${printEntityName(this.entity)} path != geometry "${this.geometry}"`;
	}
	print() {
		return `// CheckEntityPath: ${this.expPrint()}`;
	}
}
export class CheckWarpState extends StringCheckable {
	action: 'CHECK_WARP_STATE';
	string: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_WARP_STATE';
		this.string = coerceToString(debug, args.string);
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckWarpState)) return false;
		// if (this.action !== that.action) return false;
		if (this.string !== that.string) return false;
		return true;
	}
	clone() {
		return new CheckWarpState(this.debug.clone(), this.args);
	}
	updateProp(value: string) {
		this.string = value;
	}
	getProp() {
		return this.string;
	}
	static quick(debug: MathlangLocation, string: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckWarpState(debug, { string, expected_bool });
	}
	expPrint() {
		return this.expected_bool
			? `warp_state == "${this.string}"`
			: `warp_state != "${this.string}"`;
	}
	print() {
		return `// CheckWarpState: ${this.expPrint()}`;
	}
}
export class CheckMap extends StringCheckable {
	// TODO: is this even in the engine? O.o
	action: 'CHECK_MAP';
	map: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_MAP';
		this.map = coerceToString(debug, args.map);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckMap)) return false;
		// if (this.action !== that.action) return false;
		if (this.map !== that.map) return false;
		return true;
	}
	clone() {
		return new CheckMap(this.debug.clone(), this.args);
	}
	updateProp(value: string) {
		this.map = value;
	}
	getProp() {
		return this.map;
	}
	expPrint() {
		return this.expected_bool ? `map == "${this.map}"` : `map != "${this.map}"`;
	}
	print() {
		return `// CheckMap: ${this.expPrint()}`;
	}
}
export class CheckBLEFlag extends StringCheckable {
	// or this?
	action: 'CHECK_BLE_FLAG';
	ble_flag: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_BLE_FLAG';
		this.ble_flag = coerceToString(debug, args.ble_flag);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckBLEFlag)) return false;
		// if (this.action !== that.action) return false;
		if (this.ble_flag !== that.ble_flag) return false;
		return true;
	}
	clone() {
		return new CheckBLEFlag(this.debug.clone(), this.args);
	}
	updateProp(value: string) {
		this.ble_flag = value;
	}
	getProp() {
		return this.ble_flag;
	}
	expPrint() {
		return this.expected_bool
			? `ble_flag == "${this.ble_flag}"`
			: `ble_flag != "${this.ble_flag}"`;
	}
	print() {
		return `// CheckBLEFlag: ${this.expPrint()}`;
	}
}

// --------------- NUMBER COMPARISON

export class NumberComparison extends BoolComparison {
	comment?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.expected_bool = true;
	}
	expPrint() {
		return `(unknown NumberComparison)`;
	}
	print() {
		return `// NumberComparison: ${this.expPrint()}`;
	}
}

export class CheckVariable extends NumberComparison {
	action: 'CHECK_VARIABLE';
	variable: string;
	comparison: string;
	value: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_VARIABLE';
		this.variable = coerceToString(debug, args.variable);
		this.comparison = coerceToString(debug, args.comparison);
		this.value = ACTION.breakIfNotNumber(args.value);
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckVariable)) return false;
		// if (this.action !== that.action) return false;
		if (this.variable !== that.variable) return false;
		if (this.comparison !== that.comparison) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		return new CheckVariable(this.debug.clone(), this.args);
	}
	static quick(
		debug: MathlangLocation,
		variable: string,
		value: number,
		comparison: string,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckVariable(debug, {
			variable,
			value,
			comparison,
			expected_bool,
		});
	}
	expPrint() {
		return this.expected_bool
			? `"${this.variable}" ${this.comparison} ${this.value}`
			: `"${this.variable}" ${inverseOpMap[this.comparison]} ${this.value}`;
	}
	print() {
		return `// CheckVariable: ${this.expPrint()}`;
	}
}
export class CheckVariables extends NumberComparison {
	action: 'CHECK_VARIABLES';
	variable: string;
	comparison: string;
	source: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_VARIABLES';
		this.variable = coerceToString(debug, args.variable);
		this.comparison = coerceToString(debug, args.comparison);
		this.source = coerceToString(debug, args.source);
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckVariables)) return false;
		// if (this.action !== that.action) return false;
		if (this.variable !== that.variable) return false;
		if (this.comparison !== that.comparison) return false;
		if (this.source !== that.source) return false;
		return true;
	}
	clone() {
		return new CheckVariables(this.debug.clone(), this.args);
	}
	static quick(
		debug: MathlangLocation,
		variable: string,
		source: string,
		comparison: string,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckVariables(debug, {
			variable,
			source,
			comparison,
			expected_bool,
		});
	}
	expPrint() {
		return this.expected_bool
			? `"${this.variable}" ${this.comparison} ${this.source}`
			: `"${this.variable}" ${inverseOpMap[this.comparison]} ${this.source}`;
	}
	print() {
		return `// CheckVariables: ${this.expPrint()}`;
	}
}

// --------------- NUMBER CHECKABLE EQUALITY

export class NumberCheckableEquality extends BoolComparison {
	comment?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
	}
	updateProp(_: number) {
		// TODO: how to deal with this? Does this one need this because of the following method?
		throw new Error(`Parent should not be trying to change its number property (value ${_})`);
	}
	finalizeValues(number: number, op: string) {
		this.updateProp(number);
		this.expected_bool = op === '==';
		return this;
	}
	expPrint() {
		return `(unknown NumberCheckableEquality)`;
	}
	print() {
		return `// NumberCheckableEquality: ${this.expPrint()}`;
	}
}
export class CheckEntityX extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_X';
	entity: string;
	expected_u2: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_X';
		this.entity = coerceToString(debug, args.entity);
		this.expected_u2 = ACTION.breakIfNotNumber(args.expected_u2);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityX)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.expected_u2 !== that.expected_u2) return false;
		return true;
	}
	clone() {
		return new CheckEntityX(this.debug.clone(), this.args);
	}
	updateProp(value: number) {
		this.expected_u2 = value;
	}
	getProp() {
		return this.expected_u2;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		expected_u2: number,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityX(debug, { entity, expected_u2, expected_bool });
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} x == ${this.expected_u2}`
			: `${printEntityName(this.entity)} x != ${this.expected_u2}`;
	}
	print() {
		return `// CheckEntityX: ${this.expPrint()}`;
	}
}
export class CheckEntityY extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_Y';
	entity: string;
	expected_u2: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_Y';
		this.entity = coerceToString(debug, args.entity);
		this.expected_u2 = ACTION.breakIfNotNumber(args.expected_u2);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityY)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.expected_u2 !== that.expected_u2) return false;
		return true;
	}
	clone() {
		return new CheckEntityY(this.debug.clone(), this.args);
	}
	updateProp(value: number) {
		this.expected_u2 = value;
	}
	getProp() {
		return this.expected_u2;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		expected_u2: number,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityY(debug, { entity, expected_u2, expected_bool });
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} y == ${this.expected_u2}`
			: `${printEntityName(this.entity)} y != ${this.expected_u2}`;
	}
	print() {
		return `// CheckEntityY: ${this.expPrint()}`;
	}
}
export class CheckEntityPrimaryID extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_PRIMARY_ID';
	entity: string;
	expected_u2: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_PRIMARY_ID';
		this.entity = coerceToString(debug, args.entity);
		this.expected_u2 = ACTION.breakIfNotNumber(args.expected_u2);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityPrimaryID)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.expected_u2 !== that.expected_u2) return false;
		return true;
	}
	clone() {
		return new CheckEntityPrimaryID(this.debug.clone(), this.args);
	}
	updateProp(value: number) {
		this.expected_u2 = value;
	}
	getProp() {
		return this.expected_u2;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		expected_u2: number,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityPrimaryID(debug, { entity, expected_u2, expected_bool });
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} primary_id == ${this.expected_u2}`
			: `${printEntityName(this.entity)} primary_id != ${this.expected_u2}`;
	}
	print() {
		return `// CheckEntityPrimaryID: ${this.expPrint()}`;
	}
}
export class CheckEntitySecondaryID extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_SECONDARY_ID';
	entity: string;
	expected_u2: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_SECONDARY_ID';
		this.entity = coerceToString(debug, args.entity);
		this.expected_u2 = ACTION.breakIfNotNumber(args.expected_u2);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntitySecondaryID)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.expected_u2 !== that.expected_u2) return false;
		return true;
	}
	clone() {
		return new CheckEntitySecondaryID(this.debug.clone(), this.args);
	}
	updateProp(value: number) {
		this.expected_u2 = value;
	}
	getProp() {
		return this.expected_u2;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		expected_u2: number,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntitySecondaryID(debug, { entity, expected_u2, expected_bool });
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} secondary_id == ${this.expected_u2}`
			: `${printEntityName(this.entity)} secondary_id != ${this.expected_u2}`;
	}
	print() {
		return `// CheckEntitySecondaryID: ${this.expPrint()}`;
	}
}
export class CheckEntityPrimaryIDType extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_PRIMARY_ID_TYPE';
	entity: string;
	expected_byte: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_PRIMARY_ID_TYPE';
		this.entity = coerceToString(debug, args.entity);
		this.expected_byte = ACTION.breakIfNotNumber(args.expected_byte);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityPrimaryIDType)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.expected_byte !== that.expected_byte) return false;
		return true;
	}
	clone() {
		return new CheckEntityPrimaryIDType(this.debug.clone(), this.args);
	}
	updateProp(value: number) {
		this.expected_byte = value;
	}
	getProp() {
		return this.expected_byte;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		expected_byte: number,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityPrimaryIDType(debug, {
			entity,
			expected_byte,
			expected_bool,
		});
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} primary_id_type == ${this.expected_byte}`
			: `${printEntityName(this.entity)} primary_id_type != ${this.expected_byte}`;
	}
	print() {
		return `// CheckEntityPrimaryIDType: ${this.expPrint()}`;
	}
}
export class CheckEntityCurrentAnimation extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_CURRENT_ANIMATION';
	entity: string;
	expected_byte: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_CURRENT_ANIMATION';
		this.entity = coerceToString(debug, args.entity);
		this.expected_byte = ACTION.breakIfNotNumber(args.expected_byte);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityCurrentAnimation)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.expected_byte !== that.expected_byte) return false;
		return true;
	}
	clone() {
		return new CheckEntityCurrentAnimation(this.debug.clone(), this.args);
	}
	updateProp(value: number) {
		this.expected_byte = value;
	}
	getProp() {
		return this.expected_byte;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		expected_byte: number,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityCurrentAnimation(debug, {
			entity,
			expected_byte,
			expected_bool,
		});
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} current_animation == ${this.expected_byte}`
			: `${printEntityName(this.entity)} current_animation != ${this.expected_byte}`;
	}
	print() {
		return `// CheckEntityCurrentAnimation: ${this.expPrint()}`;
	}
}
export class CheckEntityCurrentFrame extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_CURRENT_FRAME';
	entity: string;
	expected_byte: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_CURRENT_FRAME';
		this.entity = coerceToString(debug, args.entity);
		this.expected_byte = ACTION.breakIfNotNumber(args.expected_byte);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CheckEntityCurrentFrame)) return false;
		// if (this.action !== that.action) return false;
		if (this.entity !== that.entity) return false;
		if (this.expected_byte !== that.expected_byte) return false;
		return true;
	}
	clone() {
		return new CheckEntityCurrentFrame(this.debug.clone(), this.args);
	}
	updateProp(value: number) {
		this.expected_byte = value;
	}
	getProp() {
		return this.expected_byte;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		expected_byte: number,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckEntityCurrentFrame(debug, {
			entity,
			expected_byte,
			expected_bool,
		});
	}
	expPrint() {
		return this.expected_bool
			? `${printEntityName(this.entity)} animation_frame == ${this.expected_byte}`
			: `${printEntityName(this.entity)} animation_frame != ${this.expected_byte}`;
	}
	print() {
		return `// CheckEntityCurrentFrame: ${this.expPrint()}`;
	}
}

// --------------- BOOL SETABLE

export class BoolSetable extends MathlangNode {
	type: string;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = coerceToString(debug, args.value);
		this.type = coerceToString(debug, args.type);
	}
	clone() {
		return new BoolSetable(this.debug.clone(), this.args);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof BoolSetable)) return false;
		if (this.type !== that.type) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new BoolSetable(debug, { type, value });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof BoolSetable)) {
			throw new Error('not BoolSetable');
		}
		return v;
	}
	expPrint() {
		return `(unknown BoolSetable)`;
	}
	print() {
		return `// BoolSetable: ${this.expPrint()}`;
	}
}
export class MovableIdentifier extends MathlangNode {
	type: string;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = coerceToString(debug, args.value);
		this.type = coerceToString(debug, args.type);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof MovableIdentifier)) return false;
		if (this.type !== that.type) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		return new MovableIdentifier(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new MovableIdentifier(debug, { type, value });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof MovableIdentifier)) {
			throw new Error('not MovableIdentifier');
		}
		return v;
	}
	expPrint() {
		return this.type === 'camera' ? 'camera' : printEntityName(this.value);
	}
	print() {
		return `// MovableIdentifier`;
	}
}
export class CoordinateIdentifier extends MathlangNode {
	type: string;
	value: string;
	polygonType?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = coerceToString(debug, args.value);
		this.type = coerceToString(debug, args.type);
		if (args.polygonType) this.polygonType = coerceToString(debug, args.polygonType);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof CoordinateIdentifier)) return false;
		if (this.type !== that.type) return false;
		if (this.value !== that.value) return false;
		if (this.polygonType !== that.polygonType) return false;
		return true;
	}
	clone() {
		return new CoordinateIdentifier(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string, polygonType?: string) {
		return new CoordinateIdentifier(debug, { type, value, polygonType });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof CoordinateIdentifier)) {
			throw new Error('not CoordinateIdentifier');
		}
		return v;
	}
	expPrint() {
		if (this.type === 'geometry') {
			return `geometry "${this.value}" ${this.polygonType}`;
		} else {
			return printEntityName(this.value);
		}
	}
	print() {
		return `// CoordinateIdentifier: ${this.expPrint()}`;
	}
}
export class DirectionTarget extends MathlangNode {
	type: string;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = coerceToString(debug, args.value);
		this.type = coerceToString(debug, args.type);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof DirectionTarget)) return false;
		if (this.type !== that.type) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		return new DirectionTarget(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new DirectionTarget(debug, { type, value });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof DirectionTarget)) {
			throw new Error('not DirectionTarget');
		}
		return v;
	}
	expPrint() {
		if (this.type === 'nsew') return this.value;
		if (this.type === 'geometry') return `geometry "${this.value}"`;
		if (this.type === 'entity') return printEntityName(this.value);
	}
	print() {
		return `// DirectionTarget`;
	}
}

// --------------- ARRAYS

export class ArrayMethodChain extends MathlangNode {
	identifier: string;
	return_type: 'array' | 'value' | 'none';
	chain: ArrayMethod[];
	final: ArrayMethod;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.identifier = coerceToString(debug, args.identifier);
		const chain = ArrayMethod.breakIfNotAll(args.chain);
		this.return_type = 'array';
		this.chain = [];
		this.final = chain[chain.length - 1];
		// to see if the "return type" changes anywhere within the chain (?)
		// and ascertain the "return type" broadly
		for (let i = 0; i < chain.length; i++) {
			const curr = chain[i];
			if (curr instanceof ArrayMethodReturningValue) {
				if (this.return_type === 'array') {
					this.return_type = 'value';
				} else {
					debug
						.using(curr.debug.node)
						.quickError(
							'array method on non-array',
							'previous method returns an integer value; cannot call array method afterward',
						);
					this.final = curr;
					break;
				}
			} else if (curr instanceof ArrayMethodReturningNothing) {
				if (this.return_type === 'array') {
					this.return_type = 'none';
				} else {
					debug
						.using(curr.debug.node)
						.quickError(
							'array method on non-array',
							'previous method returns nothing; cannot call array method afterward',
						);
					this.final = curr;
					break;
				}
			}
			this.chain.push(chain[i]); // to use the orig Sequence if any
		}
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArrayMethodChain)) return false;
		if (this.identifier !== that.identifier) return false;
		if (this.return_type !== that.return_type) return false;
		if (this.chain.length !== that.chain.length) return false;
		for (let i = 0; i < this.chain.length; i++) {
			if (!this.chain[i].isIdenticalTo(that.chain[i])) return false;
		}
		if (!this.final.isIdenticalTo(that.final)) return false;
		return true;
	}
	clone() {
		return new ArrayMethodChain(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, identifier: string, chain: ArrayMethod[]) {
		return new ArrayMethodChain(debug, { identifier, chain });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayMethodChain)) {
			throw new Error('not ArrayMethodChain');
		}
		return v;
	}
	// POSSIBLY REDO
	toSteps(destination: string) {
		const steps: AnyNode[] = [];
		let currArray = this.identifier;
		let currArrayIsTemp = false;
		this.chain.forEach((method) => {
			if (method instanceof ArrayMethodReturningNothing) {
				steps.push(...method.toSteps(currArray));
			} else if (method instanceof ArrayMethodReturningValue) {
				steps.push(...method.toSteps(currArray, destination));
			} else if (method instanceof ArraySliceMethod || method instanceof ArrayMap) {
				// the first temporary array made this way will need to be cleaned up at the end
				const newTemporary = method.debug.f.p.newTempArray(); // wasteful sometimes, but this way there's no edge cases (the result is uniform)
				steps.push(ACTION.ARRAY_NEW.quick(newTemporary));
				steps.push(...method.toSteps(currArray, newTemporary));
				if (currArrayIsTemp) {
					steps.push(ACTION.ARRAY_SLICE.quick(newTemporary, currArray, 0));
					steps.push(ACTION.ARRAY_DELETE.quick(newTemporary));
					// eventually change to:
					// steps.push(ACTION.ARRAY_RENAME.quick(newTemporary, currArray));
					method.debug.f.p.dropTempArray();
				} else {
					currArray = newTemporary;
					currArrayIsTemp = true;
				}
			} else if (method instanceof ArrayMethodReturningArray) {
				steps.push(...method.toSteps(currArray, destination));
			} else {
				throw new Error('unknown array method type');
			}
		});
		// cleaning up the first temporary array
		if (currArrayIsTemp) {
			const currTemp = this.debug.f.p.currTempArray();
			if (this.return_type === 'array') {
				steps.push(ACTION.ARRAY_SLICE.quick(currTemp, destination, 0));
				steps.push(ACTION.ARRAY_DELETE.quick(currTemp));
				// eventually change to:
				// steps.push(ACTION.ARRAY_RENAME.quick(currTemp, destination))
			} else {
				steps.push(ACTION.ARRAY_DELETE.quick(currTemp));
			}
			this.debug.f.p.dropTempArray();
		}
		return steps;
	}
	assignToArray(destinationArray: string) {
		if (this.return_type !== 'array') {
			this.debug.quickError('syntax error', 'this array expression does not return an array');
		}
		return MathlangSequence.orSingle(
			this.debug,
			this.toSteps(destinationArray),
			'ArrayMethodChain.assignToArray',
		);
	}
	assignToVar(destinationVar: string) {
		if (this.return_type !== 'value') {
			this.debug.quickError(
				'syntax error',
				'this array expression does not return an integer value',
			);
		}
		return MathlangSequence.orSingle(
			this.debug,
			this.toSteps(destinationVar),
			'ArrayMethodChain.assignToVar',
		);
	}
	doToArray(workingArray: string) {
		return MathlangSequence.orSingle(
			this.debug,
			this.toSteps(workingArray),
			'ArrayMethodChain.doToArray',
		);
	}
	expPrint() {
		return this.identifier + this.chain.map((v) => v.print());
	}
	print() {
		return this.expPrint();
	}
}

export class ArrayMethod extends MathlangNode {
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayMethod)) {
			throw new Error('not ArrayMethod');
		}
		return v;
	}
	static breakIfNotAll(arr: unknown) {
		if (!Array.isArray(arr)) {
			throw new Error('ArrayMethod[] not an Array');
		}
		if (!arr.every((v) => v instanceof ArrayMethod)) {
			throw new Error('not every item in array is ArrayMethod');
		}
		return arr;
	}
}

// returns an array
export class ArrayMethodReturningArray extends ArrayMethod {
	toSteps(sourceArray: string, destinationArray: string): AnyNode[] {
		throw new Error('children should be doing this:' + sourceArray + destinationArray);
	}
	assignToArray(sourceArray: string, destinationArray: string): AnyNode {
		throw new Error('children should be doing this:' + sourceArray + destinationArray);
	}
}

export class ArrayMap extends ArrayMethodReturningArray {
	fn: FunctionDefinition;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.fn = FunctionDefinition.breakIfNot(args.fn);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArrayMap)) return false;
		return this.fn.isIdenticalTo(that.fn);
	}
	clone() {
		return new ArrayMap(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, fn: FunctionDefinition) {
		return new ArrayMap(debug, { fn });
	}
	toSteps(sourceArray: string, destinationArray: string) {
		return mapOrForEachBuilder(this, sourceArray, destinationArray);
	}
	assignToArray(sourceArray: string, destinationArray: string): AnyNode {
		const steps = this.toSteps(sourceArray, destinationArray);
		return MathlangSequence.quick(this.debug, steps, 'ArrayMap');
	}
}

export class ArraySliceMethod extends ArrayMethodReturningArray {}
export class ArraySliceByNumber extends ArraySliceMethod {
	index_start: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.index_start = ACTION.breakIfNotNumber(args.index_start);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArraySliceByNumber)) return false;
		if (this.index_start !== that.index_start) return false;
		return true;
	}
	clone() {
		return new ArraySliceByNumber(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, index_start: number) {
		return new ArraySliceByNumber(debug, { index_start });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArraySliceByNumber)) {
			throw new Error('not ArraySliceByNumber');
		}
		return v;
	}
	toSteps(sourceArray: string, destinationArray: string) {
		return [this.assignToArray(sourceArray, destinationArray)];
	}
	assignToArray(sourceArray: string, destinationArray: string): AnyNode {
		return ACTION.ARRAY_SLICE.quick(sourceArray, destinationArray, this.index_start);
	}
	expPrint() {
		return `.slice(${this.index_start || ''})`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArraySliceTwiceByNumber extends ArraySliceMethod {
	index_start: number;
	index_end: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.index_start = ACTION.breakIfNotNumber(args.index_start);
		this.index_end = ACTION.breakIfNotNumber(args.index_end);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArraySliceTwiceByNumber)) return false;
		if (this.index_start !== that.index_start) return false;
		if (this.index_end !== that.index_end) return false;
		return true;
	}
	clone() {
		return new ArraySliceTwiceByNumber(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, index_start: number, index_end: number) {
		return new ArraySliceTwiceByNumber(debug, { index_start, index_end });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArraySliceTwiceByNumber)) {
			throw new Error('not ArraySliceTwiceByNumber');
		}
		return v;
	}
	toSteps(sourceArray: string, destinationArray: string) {
		return [this.assignToArray(sourceArray, destinationArray)];
	}
	assignToArray(sourceArray: string, destinationArray: string): AnyNode {
		return ACTION.ARRAY_SLICE_TWICE.quick(
			sourceArray,
			destinationArray,
			this.index_start,
			this.index_end,
		);
	}
	expPrint() {
		return `.slice(${this.index_start}, ${this.index_end})`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArraySliceByVariable extends ArraySliceMethod {
	variable_start: string;
	steps: AnyNode[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.variable_start = coerceToString(debug, args.variable_start);
		this.steps = AnyNode.breakIfNotAll(args.steps);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArraySliceByVariable)) return false;
		if (this.variable_start !== that.variable_start) return false;
		if (this.steps.length !== that.steps.length) return false;
		for (let i = 0; i < this.steps.length; i++) {
			if (!this.steps[i].isIdenticalTo(that.steps[i])) return false;
		}
		return true;
	}
	clone() {
		return new ArraySliceByVariable(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, steps: AnyNode[], variable_start: string) {
		return new ArraySliceByVariable(debug, { steps, variable_start });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArraySliceByVariable)) {
			throw new Error('not ArraySliceByVariable');
		}
		return v;
	}
	toSteps(sourceArray: string, destinationArray: string) {
		return [this.assignToArray(sourceArray, destinationArray)];
	}
	assignToArray(destinationArray: string, sourceArray: string): AnyNode {
		return MathlangSequence.orSingle(
			this.debug,
			[
				...this.steps,
				ACTION.ARRAY_SLICE_BY_VARIABLE.quick(
					destinationArray,
					sourceArray,
					this.variable_start,
				),
			],
			'ArraySliceByVariable.assignToVar',
		);
	}
	expPrint() {
		return `.slice("${this.variable_start}")`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArraySliceTwiceByVariable extends ArraySliceMethod {
	variable_start: string;
	variable_end: string;
	steps: AnyNode[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.variable_start = coerceToString(debug, args.variable_start);
		this.variable_end = coerceToString(debug, args.variable_end);
		this.steps = AnyNode.breakIfNotAll(args.steps);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArraySliceTwiceByVariable)) return false;
		if (this.variable_start !== that.variable_start) return false;
		if (this.variable_end !== that.variable_end) return false;
		if (this.steps.length !== that.steps.length) return false;
		for (let i = 0; i < this.steps.length; i++) {
			if (!this.steps[i].isIdenticalTo(that.steps[i])) return false;
		}
		return true;
	}
	clone() {
		return new ArraySliceTwiceByVariable(this.debug.clone(), this.args);
	}
	static quick(
		debug: MathlangLocation,
		steps: AnyNode[],
		variable_start: string,
		variable_end: string,
	) {
		return new ArraySliceTwiceByVariable(debug, { steps, variable_start, variable_end });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArraySliceTwiceByVariable)) {
			throw new Error('not ArraySliceTwiceByVariable');
		}
		return v;
	}
	toSteps(sourceArray: string, destinationArray: string) {
		return [this.assignToArray(sourceArray, destinationArray)];
	}
	assignToArray(destinationArray: string, sourceArray: string): AnyNode {
		return MathlangSequence.orSingle(
			this.debug,
			[
				...this.steps,
				ACTION.ARRAY_SLICE_TWICE_BY_VARIABLE.quick(
					destinationArray,
					sourceArray,
					this.variable_start,
					this.variable_end,
				),
			],
			'ArraySliceTwiceByVariable.assignToVar',
		);
	}
	expPrint() {
		return `.slice("${this.variable_start}", "${this.variable_end})`;
	}
	print() {
		return this.expPrint();
	}
}

export class ArraySort extends ArrayMethodReturningArray {
	isIdenticalTo(that: unknown) {
		return that instanceof ArraySort;
	}
	clone() {
		return new ArraySort(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation) {
		return new ArraySort(debug, {});
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArraySort)) {
			throw new Error('not ArraySort');
		}
		return v;
	}
	toSteps(array: string) {
		return [this.assignToVar(array)];
	}
	assignToVar(array: string): AnyNode {
		return ACTION.ARRAY_SORT.quick(array);
	}
	expPrint() {
		return `.sort()`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArrayReverse extends ArrayMethodReturningArray {
	isIdenticalTo(that: unknown) {
		return that instanceof ArrayReverse;
	}
	clone() {
		return new ArrayReverse(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation) {
		return new ArrayReverse(debug, {});
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayReverse)) {
			throw new Error('not ArrayReverse');
		}
		return v;
	}
	toSteps(array: string) {
		return [this.assignToVar(array)];
	}
	assignToVar(array: string): AnyNode {
		return ACTION.ARRAY_REVERSE.quick(array);
	}
	expPrint() {
		return `.reverse()`;
	}
	print() {
		return this.expPrint();
	}
}

// returns a value
export class ArrayMethodReturningValue extends ArrayMethod {
	toSteps(array: string, destinationVar: string): AnyNode[] {
		throw new Error(
			`children should be putting value from array ${array} into var ${destinationVar}`,
		);
	}
	assignToVar(array: string, destinationVar: string): AnyNode {
		throw new Error(
			`children should be putting value from array ${array} into var ${destinationVar}`,
		);
	}
}

export class ArrayLength extends ArrayMethodReturningValue {
	isIdenticalTo(that: unknown) {
		return that instanceof ArrayLength;
	}
	clone() {
		return new ArrayLength(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation) {
		return new ArrayLength(debug, {});
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayLength)) {
			throw new Error('not ArrayLength');
		}
		return v;
	}
	toSteps(array: string, destinationVar: string) {
		return [this.assignToVar(array, destinationVar)];
	}
	assignToVar(array: string, destinationVar: string) {
		return ACTION.ARRAY_LENGTH_INTO_VARIABLE.quick(array, destinationVar);
	}
	expPrint() {
		return `.length()`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArrayReadFromIndex extends ArrayMethodReturningValue {
	index: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.index = ACTION.breakIfNotNumber(args.index);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArrayReadFromIndex)) return false;
		if (this.index !== that.index) return false;
		return true;
	}
	clone() {
		return new ArrayReadFromIndex(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, index: number) {
		return new ArrayReadFromIndex(debug, { index });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayReadFromIndex)) {
			throw new Error('not ArrayReadFromIndex');
		}
		return v;
	}
	toSteps(array: string, destinationVar: string) {
		return [this.assignToVar(array, destinationVar)];
	}
	assignToVar(array: string, destinationVar: string) {
		return ACTION.ARRAY_READ_FROM_INDEX_INTO_VARIABLE.quick(array, this.index, destinationVar);
	}
	expPrint() {
		return `[${this.index}]`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArrayReadFromVariableIndex extends ArrayMethodReturningValue {
	variable_index: string;
	steps?: AnyNode[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.variable_index = coerceToString(debug, args.variable_index);
		if (args.steps) {
			this.steps = AnyNode.breakIfNotAll(args.steps);
		}
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArrayReadFromVariableIndex)) return false;
		if (this.variable_index !== that.variable_index) return false;
		if (this.steps && !that.steps) return false;
		if (!this.steps && that.steps) return false;
		if (this.steps && that.steps) {
			if (this.steps.length !== that.steps.length) return false;
			for (let i = 0; i < this.steps.length; i++) {
				if (!this.steps[i].isIdenticalTo(that.steps[i])) return false;
			}
		}
		return true;
	}
	clone() {
		return new ArrayReadFromVariableIndex(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, variable_index: string, steps?: AnyNode[]) {
		return new ArrayReadFromVariableIndex(debug, { variable_index, steps });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayReadFromVariableIndex)) {
			throw new Error('not ArrayReadFromVariableIndex');
		}
		return v;
	}
	toSteps(array: string, destinationVar: string) {
		const action = ACTION.ARRAY_READ_FROM_VARIABLE_INDEX_INTO_VARIABLE.quick(
			array,
			this.variable_index,
			destinationVar,
		);
		const steps: AnyNode[] = this.steps ? this.steps : [];
		steps.push(action);
		return steps;
	}
	assignToVar(array: string, destinationVar: string): AnyNode {
		const steps = this.toSteps(array, destinationVar);
		return MathlangSequence.orSingle(
			this.debug,
			steps,
			'ArrayReadFromVariableIndex.assignToVar',
		);
	}
	expPrint() {
		// I think this part won't work... (todo)
		return `["${this.variable_index}"]`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArrayPop extends ArrayMethodReturningValue {
	isIdenticalTo(that: unknown) {
		return that instanceof ArrayPop;
	}
	clone() {
		return new ArrayPop(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation) {
		return new ArrayPop(debug, {});
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayPop)) {
			throw new Error('not ArrayPop');
		}
		return v;
	}
	toSteps(array: string, destinationVar: string) {
		return [this.assignToVar(array, destinationVar)];
	}
	assignToVar(array: string, destinationVar: string) {
		return ACTION.ARRAY_POP_INTO_VARIABLE.quick(array, destinationVar);
	}
	expPrint() {
		return `.pop()`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArrayPopLeft extends ArrayMethodReturningValue {
	isIdenticalTo(that: unknown) {
		return that instanceof ArrayPop;
	}
	clone() {
		return new ArrayPopLeft(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation) {
		return new ArrayPopLeft(debug, {});
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayPopLeft)) {
			throw new Error('not ArrayPopLeft');
		}
		return v;
	}
	toSteps(array: string, destinationVar: string) {
		return [this.assignToVar(array, destinationVar)];
	}
	assignToVar(array: string, destinationVar: string) {
		return ACTION.ARRAY_POP_LEFT_INTO_VARIABLE.quick(array, destinationVar);
	}
	expPrint() {
		return `.pop_left()`;
	}
	print() {
		return this.expPrint();
	}
}

// returns nothing (in our case)
export class ArrayMethodReturningNothing extends ArrayMethod {
	toSteps(workingArray: string): AnyNode[] {
		throw new Error('children should be doing this to ' + workingArray);
	}
	doToArray(workingArray: string): AnyNode {
		throw new Error('children should be doing this to ' + workingArray);
	}
}

export class ArrayPushValue extends ArrayMethodReturningNothing {
	value: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = ACTION.breakIfNotNumber(args.value);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArrayPushValue)) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		return new ArrayPushValue(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, value: number) {
		return new ArrayPushValue(debug, { value });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayPushValue)) {
			throw new Error('not ArrayPushValue');
		}
		return v;
	}
	toSteps(workingArray: string) {
		return [this.doToArray(workingArray)];
	}
	doToArray(workingArray: string): AnyNode {
		return ACTION.ARRAY_PUSH_FROM_VALUE.quick(workingArray, this.value);
	}
	expPrint() {
		return `.push(${this.value})`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArrayPushVariable extends ArrayMethodReturningNothing {
	variable: string;
	steps?: AnyNode[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.variable = coerceToString(debug, args.variable);
		if (args.steps) {
			this.steps = AnyNode.breakIfNotAll(args.steps);
		}
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArrayPushVariable)) return false;
		if (this.variable !== that.variable) return false;
		if (this.steps && !that.steps) return false;
		if (!this.steps && that.steps) return false;
		if (this.steps && that.steps) {
			if (this.steps.length !== that.steps.length) return false;
			for (let i = 0; i < this.steps.length; i++) {
				if (!this.steps[i].isIdenticalTo(that.steps[i])) return false;
			}
		}
		return true;
	}
	clone() {
		return new ArrayPushVariable(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, variable: string, steps?: AnyNode[]) {
		return new ArrayPushVariable(debug, { variable, steps });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayPushVariable)) {
			throw new Error('not ArrayPushVariable');
		}
		return v;
	}
	toSteps(workingArray: string) {
		const action = ACTION.ARRAY_PUSH_FROM_VARIABLE.quick(workingArray, this.variable);
		const steps: AnyNode[] = this.steps ? this.steps : [];
		steps.push(action);
		return steps;
	}
	doToArray(workingArray: string): AnyNode {
		const steps = this.toSteps(workingArray);
		return MathlangSequence.orSingle(this.debug, steps, 'ArrayPushVariable.doToArray');
	}
	expPrint() {
		// I think this part won't work... (todo)
		return `.push("${this.variable}")`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArrayPushLeftValue extends ArrayMethodReturningNothing {
	value: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = ACTION.breakIfNotNumber(args.value);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArrayPushLeftValue)) return false;
		if (this.value !== that.value) return false;
		return true;
	}
	clone() {
		return new ArrayPushLeftValue(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, value: number) {
		return new ArrayPushLeftValue(debug, { value });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayPushLeftValue)) {
			throw new Error('not ArrayPushLeftValue');
		}
		return v;
	}
	toSteps(workingArray: string) {
		return [this.doToArray(workingArray)];
	}
	doToArray(workingArray: string): AnyNode {
		return ACTION.ARRAY_PUSH_LEFT_FROM_VALUE.quick(workingArray, this.value);
	}
	expPrint() {
		return `.push_left(${this.value})`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArrayPushLeftVariable extends ArrayMethodReturningNothing {
	variable: string;
	steps?: AnyNode[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.variable = coerceToString(debug, args.variable);
		if (args.steps) {
			this.steps = AnyNode.breakIfNotAll(args.steps);
		}
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArrayPushLeftVariable)) return false;
		if (this.variable !== that.variable) return false;
		if (this.steps && !that.steps) return false;
		if (!this.steps && that.steps) return false;
		if (this.steps && that.steps) {
			if (this.steps.length !== that.steps.length) return false;
			for (let i = 0; i < this.steps.length; i++) {
				if (!this.steps[i].isIdenticalTo(that.steps[i])) return false;
			}
		}
		return true;
	}
	clone() {
		return new ArrayPushLeftVariable(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, variable: string, steps?: AnyNode[]) {
		return new ArrayPushLeftVariable(debug, { variable, steps });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayPushLeftVariable)) {
			throw new Error('not ArrayPushLeftVariable');
		}
		return v;
	}
	toSteps(workingArray: string) {
		const action = ACTION.ARRAY_PUSH_LEFT_FROM_VARIABLE.quick(workingArray, this.variable);
		const steps: AnyNode[] = this.steps ? this.steps : [];
		steps.push(action);
		return steps;
	}
	doToArray(workingArray: string): AnyNode {
		const steps = this.toSteps(workingArray);
		return MathlangSequence.orSingle(this.debug, steps, 'ArrayPushLeftVariable.doToArray');
	}
	expPrint() {
		// I think this part won't work... (todo)
		return `.push_left("${this.variable}")`;
	}
	print() {
		return this.expPrint();
	}
}
export class ArrayWriteToIndex extends MathlangNode {
	array_name: string;
	exp_index: IntExpression;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.array_name = coerceToString(debug, args.array_name);
		this.exp_index = IntExpression.breakIfNot(args.exp_index);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArrayWriteToIndex)) return false;
		if (this.array_name !== that.array_name) return false;
		if (this.exp_index !== that.exp_index) return false;
		return true;
	}
	clone() {
		return new ArrayWriteToIndex(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, array_name: string, exp_index: IntExpression) {
		return new ArrayWriteToIndex(debug, { array_name, exp_index });
	}
	static breakIfNot(v: unknown) {
		if (!(v instanceof ArrayWriteToIndex)) {
			throw new Error('not ArrayWriteToIndex');
		}
		return v;
	}
	expPrint() {
		// what to do? (todo)
		return `???`;
	}
	print() {
		return this.expPrint();
	}
}

export class ArrayForEach extends ArrayMethodReturningNothing {
	fn: FunctionDefinition;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.fn = FunctionDefinition.breakIfNot(args.fn);
	}
	isIdenticalTo(that: unknown) {
		if (!(that instanceof ArrayForEach)) return false;
		if (this.fn !== that.fn) return false;
		return true;
	}
	clone() {
		return new ArrayForEach(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, fn: FunctionDefinition) {
		return new ArrayForEach(debug, { fn });
	}
	toSteps(sourceArray: string) {
		return mapOrForEachBuilder(this, sourceArray);
	}
	assignToArray(sourceArray: string): AnyNode {
		const steps = this.toSteps(sourceArray);
		return MathlangSequence.quick(this.debug, steps, 'ArrayForEach');
	}
}

// --------------- LOCAL UTILITIES

const printEntityName = (entity: string) => {
	if (entity === '%PLAYER%') return 'player';
	if (entity === '%SELF%') return 'self';
	return `entity "${entity}"`;
};

const mapOrForEachBuilder = (
	method: ArrayMap | ArrayForEach,
	sourceArray: string,
	destinationArray?: string,
): AnyNode[] => {
	const debug = method.debug;

	// built-in vars
	const i = newTemporary();
	const length = newTemporary();
	const curr = newTemporary();

	// make local const registry based on what we were passed for this call
	const localConstants: FunctionStackEntry = {
		consts: {},
		debug: debug,
	};
	// first arg: the loop value
	// TODO: given how this is set up, is this not required?
	const currArg = method.fn.params[0];
	if (currArg !== undefined) {
		const valueArgNode = method.fn.paramNodes[0];
		localConstants.consts[currArg] = ConstantDefinition.quick(
			debug.using(valueArgNode),
			currArg,
			curr,
		);
	}
	// second arg: the index of the loop (i)
	const indexArg = method.fn.params[1];
	if (indexArg !== undefined) {
		const indexArgNode = method.fn.paramNodes[1];
		localConstants.consts[indexArg] = ConstantDefinition.quick(
			debug.using(indexArgNode),
			indexArg,
			i,
		);
	}
	// third arg: the name of the array we're working on (so you can .length() etc)
	const arrayArg = method.fn.params[2];
	if (arrayArg !== undefined) {
		const arrayArgNode = method.fn.paramNodes[1];
		localConstants.consts[arrayArg] = ConstantDefinition.quick(
			debug.using(arrayArgNode),
			arrayArg,
			sourceArray,
		);
	}

	// add const registry to top of fn stack
	const stack: FunctionStackEntry[] = debug.f.currFunction;
	stack.unshift(localConstants);

	// and NOW we handle the fn body (with our newly-registered consts poised to be inserted)
	const rawBody = handleNamedChildren(debug.using(method.fn.bodyNode));

	// bake it like a script body
	const body = [
		// `curr = array[i];`
		...ArrayReadFromVariableIndex.quick(debug, i).toSteps(sourceArray, curr),
		// and the rest
		...flattenAndDoAutoReturn(debug, rawBody),
	];
	if (method instanceof ArrayMap) {
		if (destinationArray === undefined) {
			throw new Error('need destinationArray');
		}
		body.push(
			// `destinationArray.push(__RETURN_);`
			ACTION.ARRAY_PUSH_FROM_VARIABLE.quick(destinationArray, RETURN),
			// `__RETURN_ = 0;`
			ACTION.MUTATE_VARIABLE.set(RETURN, 0),
		);
	}

	const initialize = [
		// `i = 0;`
		ACTION.MUTATE_VARIABLE.set(i, 0),
		// `length = sourceArray.length();`
		ACTION.ARRAY_LENGTH_INTO_VARIABLE.quick(sourceArray, length),
	];
	const increment = [
		// `i += 1;`
		ACTION.MUTATE_VARIABLE.change(debug, i, 1, '+'),
	];
	const steps = forLoopMaker(
		debug,
		initialize,
		CheckVariables.quick(debug, i, length, '<'),
		body,
		increment,
		method instanceof ArrayMap ? 'map' : 'for_each',
	);

	dropTemporary(); // curr
	dropTemporary(); // length
	dropTemporary(); // i

	// we're done with the args for this call; remove them from the fn stack
	stack.shift();
	return steps;
};

export const forLoopMaker = (
	debug: MathlangLocation,
	initializeSteps: AnyNode[],
	rawCondition: BoolExpression,
	bodySteps: AnyNode[],
	incrementerSteps: AnyNode[],
	prefix: string = 'for',
) => {
	const n = debug.f.p.advanceGotoSuffix();
	const conditionL = `${prefix} condition #${n}`;
	const bodyL = `${prefix} body #${n}`;
	const breakL = `${prefix} break #${n}`;
	const continueL = `${prefix} continue #${n}`;
	const lastN = mandatoryLastChild(debug);

	const conditionSteps: AnyNode[] = rawCondition.toSteps(bodyL);
	const bodyStepsFlat = doAutoBreakContinue(bodySteps, continueL, breakL);

	const steps = [
		// INITIALIZE
		...initializeSteps,

		// CHECK CONDITION
		LabelDefinition.quick(debug, conditionL),
		...conditionSteps,
		GotoLabel.quick(debug, breakL),

		// DO BODY
		LabelDefinition.quick(debug, bodyL),
		...bodyStepsFlat,

		// CONTINUE?
		LabelDefinition.quick(debug, continueL),
		...incrementerSteps,
		GotoLabel.quick(debug, conditionL),

		// END
		LabelDefinition.quick(debug.using(lastN), breakL),
	];
	return steps;
};
