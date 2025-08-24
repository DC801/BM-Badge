import { Node as TreeSitterNode } from 'web-tree-sitter';
import { FileState } from './parser-file.ts';
import * as ACTION from './parser-bytecode-info.ts';
import {
	dropTemporary,
	inverseOpMap,
	latestTemporary,
	newTemporary,
	quickTemporary,
	simpleBranchMaker,
} from './parser-utilities.ts';
import { type GenericObj } from './parser-actions.ts';
import { coerceToString, mandatoryChildForField } from './parser-capture.ts';

/*

AnyNode
- must have clone()
	- if any of the props are AnyNode[] or AnyNode, they must also be cloned
- some have print()

Todo(?)
- Make certain classes have "every array is one of me and die break if not" methods?

*/

export class AnyNode {
	clone() {
		if (this instanceof MathlangNode) return this.clone();
		return ACTION.Action.fromArgs(this);
	}
}
export class MathlangNode extends AnyNode {
	mathlang: string;
	args: GenericObj;
	debug: MathlangLocation;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.debug = debug;
		this.args = args;
	}
	print() {
		return `// MATHLANG: ${this.mathlang}`;
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
		if (args.comment) this.comment = ACTION.breakIfNotString(args.comment);
	}
	static quick(f: FileState, node: TreeSitterNode) {
		return new MathlangLocation({ f, node });
	}
	clone() {
		return new MathlangLocation(this.args);
	}
}

export type MathlangMessageType =
	// general
	| 'syntax error'
	| 'unexpected token'
	| 'missing token' // can be warning, not error (e.g. missing ';')
	| 'missing file'

	// these are phrased this way because the order of definition doesn't matter
	// (there isn't an "original," so we can't say "already defined")
	| 'duplicate script'
	| 'duplicate dialog'
	| 'duplicate serial dialog'

	// these are ordered, so there is definitely an "original"
	| 'undefined fn'
	| 'fn already defined'
	| 'duplicate fn arg'
	| 'not enough fn args'
	| 'undefined constant'
	| 'constant already defined'

	| 'mismatched spread lengths'
	| 'unsupported entity field'
	| 'misordered params'

	| 'invalid JSON action'
	| 'invalid fn arg'
	| 'invalid operator' // warning, not error
	| 'invalid constant value'
	| 'invalid action param combination'
	| `invalid entity script slot`
	| `invalid map script slot`;
export const isMathlangMessageType = (v: string): v is MathlangMessageType => {
	if (v === 'syntax error') return true;
	if (v === 'unexpected token') return true;
	if (v === 'missing token') return true;
	if (v === 'missing file') return true;
	if (v === 'mismatched spread lengths') return true;
	if (v === 'unsupported entity field') return true;
	if (v === 'invalid JSON action') return true;
	if (v === 'misordered params') return true;
	if (v === 'constant already defined') return true;
	if (v === 'fn already defined') return true;
	if (v === 'undefined constant') return true;
	if (v === 'not enough fn args') return true;
	if (v === 'duplicate fn arg') return true;
	if (v === 'undefined fn') return true;
	if (v === 'invalid fn arg') return true;
	if (v === 'invalid operator') return true;
	if (v === 'invalid constant value') return true;
	if (v === 'invalid action param combination') return true;
	if (v === `invalid entity script slot`) return true;
	if (v === `invalid map script slot`) return true;
	return false;
};
export class MathlangMessage {
	locations: MathlangLocation[];
	message: string;
	type: MathlangMessageType;
	footer?: string;
	constructor(locations: MathlangLocation[], type: string, message: string, footer?: string) {
		this.locations = locations;
		this.message = message;
		if (footer) this.footer = footer;
		if (!isMathlangMessageType(type)) throw new Error('invalid error type');
		this.type = type;
	}
}

const truncate = (s: string, n: number): string => {
	const orig = s.replace(/\n/g, ' ');
	return s.length > n + 3 ? orig.slice(0, n) + '...' : orig;
};

export class FunctionDefinition extends MathlangNode {
	mathlang: 'function_definition';
	name: string;
	params: string[];
	paramNodes: TreeSitterNode[];
	bodyNode: TreeSitterNode;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'function_definition';
		this.name = ACTION.breakIfNotString(args.name);
		if (!Array.isArray(args.params)) {
			throw new Error('must be string array');
		}
		this.params = args.params.map(ACTION.breakIfNotString);
		if (!Array.isArray(args.paramNodes)) {
			throw new Error('must be array');
		}
		if (!args.paramNodes.every((v) => v instanceof TreeSitterNode)) {
			throw new Error('Not TS Nodes');
		}
		this.paramNodes = args.paramNodes;
		if (!(args.bodyNode instanceof TreeSitterNode)) {
			throw new Error('Not TS Node');
		}
		this.bodyNode = args.bodyNode;
	}
	clone() {
		return new FunctionDefinition(this.debug.clone(), this.args);
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
}

// ------------------------------ SETTINGS ------------------------------ \\

export class AddDialogSettings extends MathlangNode {
	mathlang: 'add_dialog_settings';
	targets: AddDialogSettingsTarget[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'add_dialog_settings';
		if (
			!args.targets ||
			!Array.isArray(args.targets) ||
			!args.targets.every((v) => v instanceof AddDialogSettingsTarget)
		) {
			throw new Error('AddDialogSettings not given valid AddDialogSettingsTarget[]');
		}
		this.targets = args.targets;
	}
	clone() {
		const clonedTargets = this.targets.map((v) => v.clone());
		return new AddDialogSettings(this.debug.clone(), { ...this.args, targets: clonedTargets });
	}
	static quick(debug: MathlangLocation, targets: AddDialogSettingsTarget[]) {
		return new AddDialogSettings(debug, { targets });
	}
}

export class AddDialogSettingsTarget extends MathlangNode {
	mathlang: 'add_dialog_settings_target';
	type: string;
	parameters: DialogParameter[];
	target?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'add_dialog_settings_target';
		if (
			!args.parameters ||
			!Array.isArray(args.parameters) ||
			!args.parameters.every((v) => v instanceof DialogParameter)
		) {
			throw new Error('AddDialogSettingsTarget not given valid DialogParameter[]');
		}
		this.type = ACTION.breakIfNotString(args.type);
		this.parameters = args.parameters;
		if (typeof args.target === 'string') this.target = args.target;
	}
	clone() {
		const clonedParameters = this.parameters.map((v) => v.clone());
		return new AddDialogSettingsTarget(this.debug.clone(), {
			...this.args,
			parameters: clonedParameters,
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
	static coerceAll(array: unknown[]) {
		if (!array.every((v) => v instanceof AddDialogSettingsTarget)) {
			throw new Error('not every item in array is AddDialogSettingsTarget');
		}
		return array;
	}
}

export class AddSerialDialogSettings extends MathlangNode {
	mathlang: 'add_serial_dialog_settings';
	parameters: SerialDialogParameter[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'add_serial_dialog_settings';
		if (
			!args.parameters ||
			!Array.isArray(args.parameters) ||
			!args.parameters.every((v) => v instanceof SerialDialogParameter)
		) {
			throw new Error('AddSerialDialogSettings not given valid SerialDialogParameter[]');
		}
		this.parameters = args.parameters;
	}
	clone() {
		const newParams = this.parameters.map((v) => v.clone());
		return new AddSerialDialogSettings(this.debug.clone(), {
			...this.args,
			parameters: newParams,
		});
	}
	static quick(debug: MathlangLocation, parameters: SerialDialogParameter[]) {
		return new AddSerialDialogSettings(debug, {
			parameters,
		});
	}
}

// ------------------------------ CONTROL ------------------------------ \\

export class ReturnStatement extends MathlangNode {
	mathlang: 'return_statement';
	constructor(debug: MathlangLocation) {
		super(debug, {});
		this.mathlang = 'return_statement';
	}
	clone() {
		return new ReturnStatement(this.debug.clone());
	}
	static quick(debug: MathlangLocation) {
		return new ReturnStatement(debug);
	}
}
export class ContinueStatement extends MathlangNode {
	mathlang: 'continue_statement';
	constructor(debug: MathlangLocation) {
		super(debug, {});
		this.mathlang = 'continue_statement';
	}
	clone() {
		return new ReturnStatement(this.debug.clone());
	}
	static quick(debug: MathlangLocation) {
		return new ContinueStatement(debug);
	}
}
export class BreakStatement extends MathlangNode {
	mathlang: 'break_statement';
	constructor(debug: MathlangLocation) {
		super(debug, {});
		this.mathlang = 'break_statement';
	}
	clone() {
		return new ReturnStatement(this.debug.clone());
	}
	static quick(debug: MathlangLocation) {
		return new BreakStatement(debug);
	}
}

export class GotoLabel extends MathlangNode {
	mathlang: 'goto_label';
	label: string;
	comment?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'goto_label';
		this.label = ACTION.breakIfNotString(args.label);
		if (typeof args.comment === 'string') this.comment = args.comment;
	}
	clone() {
		return new GotoLabel(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, label: string) {
		return new GotoLabel(debug, { label });
	}
	print() {
		return `${ACTION.printGotoSegment(this)};`;
	}
}

// ------------------------------ DIALOG ------------------------------ \\

export class DialogDefinition extends MathlangNode {
	mathlang: 'dialog_definition';
	dialogName: string;
	dialogs: Dialog[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		if (
			!args.dialogs ||
			!Array.isArray(args.dialogs) ||
			!args.dialogs.every((v) => v instanceof Dialog)
		) {
			throw new Error('DialogDefinition not given valid Dialog[]');
		}
		this.mathlang = 'dialog_definition';
		this.dialogName = ACTION.breakIfNotString(args.dialogName);
		this.dialogs = args.dialogs;
	}
	clone() {
		const clonedDialogs = this.dialogs.map((v) => v.clone());
		return new DialogDefinition(this.debug.clone(), { ...this.args, dialogs: clonedDialogs });
	}
	static quick(debug: MathlangLocation, dialogName: string, dialogs: Dialog[]) {
		return new DialogDefinition(debug, { dialogName, dialogs });
	}
	print() {
		const truncated = truncate(this.dialogs[0].messages[0], 40);
		return `// auto dialog: "${truncated}"`;
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

export class DialogParameter extends MathlangNode {
	mathlang: 'dialog_parameter';
	property: string;
	value: MGSPrimitive;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'dialog_parameter';
		this.property = ACTION.breakIfNotString(args.property);
		this.value = ACTION.breakIfNotStringOrNumber(args.value);
	}
	clone() {
		return new DialogParameter(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, property: string, value: string | number) {
		return new DialogParameter(debug, { property, value });
	}
	static coerceAll(array: unknown[]) {
		if (!array.every((v) => v instanceof DialogParameter)) {
			throw new Error('not every item in array is DialogParameter');
		}
		return array;
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

	mathlang: 'dialog';

	messages: string[];
	response_type?: 'SELECT_FROM_SHORT_LIST';
	options?: DialogOption[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'dialog';
		if (
			!args.messages ||
			!Array.isArray(args.messages) ||
			!args.messages.every((v) => typeof v === 'string')
		) {
			throw new Error('Dialog not given valid messages:string[]');
		}
		if (args.options && Array.isArray(args.options)) {
			if (args.options.length && args.options.every((v) => v instanceof DialogOption)) {
				this.options = args.options;
				this.response_type = 'SELECT_FROM_SHORT_LIST';
			}
		}
		this.messages = args.messages;
		if (typeof args.settings === 'object' && args.settings !== null) {
			Object.entries(args.settings).forEach(([k, v]) => {
				this[k] = v; // todo: this is a little bit of trust, eh?
			});
		}
	}
	clone() {
		const newArgs = { ...this.args };
		if (this.options) {
			newArgs.options = this.options.map((v) => v.clone());
		}
		return new Dialog(this.debug.clone(), newArgs);
	}
	static coerceAll(array: unknown[]) {
		if (!array.every((v) => v instanceof Dialog)) {
			throw new Error('not every item in array is Dialog');
		}
		return array;
	}
}

export type DialogInfo = {
	identifier: DialogIdentifier;
	settings: DialogSettings;
	messages: string[];
	options: DialogOption[];
};

export class DialogIdentifier extends MathlangNode {
	mathlang: 'dialog_identifier';
	type: DialogIdentifierType;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'dialog_identifier';
		if (args.type !== 'label' && args.type !== 'entity' && args.type !== 'name') {
			throw new Error('invalid DialogIdentifier type');
		}
		this.type = args.type;
		this.value = ACTION.breakIfNotString(args.value);
	}
	clone() {
		return new DialogIdentifier(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new DialogIdentifier(debug, { type, value });
	}
	static coerce(v: unknown) {
		if (!(v instanceof DialogIdentifier)) {
			throw new Error('not DialogIdentifier');
		}
		return v;
	}
}
type DialogIdentifierType = 'label' | 'entity' | 'name';

export class DialogOption extends MathlangNode {
	mathlang: 'dialog_option';
	label: string;
	script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'dialog_option';
		this.label = ACTION.breakIfNotString(args.label);
		this.script = ACTION.breakIfNotString(args.script);
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
	static coerceAll(array: unknown[]) {
		if (!array.every((v) => v instanceof DialogOption)) {
			throw new Error('not every item in array is DialogOption');
		}
		return array;
	}
}

// ------------------------------ SERIAL DIALOG ------------------------------ \\

export class SerialDialogDefinition extends MathlangNode {
	mathlang: 'serial_dialog_definition';
	dialogName: string;
	serialDialog: SerialDialog;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'serial_dialog_definition';
		if (!(args.serialDialog instanceof SerialDialog)) {
			throw new Error('SerialDialogDefinition not given valid SerialDialog');
		}
		this.dialogName = ACTION.breakIfNotString(args.dialogName);
		this.serialDialog = args.serialDialog;
	}
	clone() {
		const newArgs = { ...this.args };
		newArgs.serialDialog = this.serialDialog.clone();
		return new SerialDialogDefinition(this.debug.clone(), newArgs);
	}
	static quick(debug: MathlangLocation, dialogName: string, serialDialog: SerialDialog) {
		return new SerialDialogDefinition(debug, { dialogName, serialDialog });
	}
	print() {
		const truncated = truncate(this.serialDialog.messages[0], 40);
		return `// auto serial_dialog: "${truncated}"`;
	}
}

export type SerialDialogSettings = {
	wrap?: number;
};

export class SerialDialogParameter extends MathlangNode {
	mathlang: 'serial_dialog_parameter';
	property: string;
	value: MGSPrimitive;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'serial_dialog_parameter';
		this.property = ACTION.breakIfNotString(args.property);
		this.value = ACTION.breakIfNotStringOrNumber(args.value);
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
	static coerceAll(array: unknown[]) {
		if (!array.every((v) => v instanceof SerialDialogParameter)) {
			throw new Error('not every item in array is SerialDialogParameter');
		}
		return array;
	}
}

export class SerialDialog extends MathlangNode {
	mathlang: 'serial_dialog';
	messages: string[];
	options?: SerialDialogOption[];
	text_options?: SerialDialogOption[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'serial_dialog';
		if (
			!args.messages ||
			!Array.isArray(args.messages) ||
			!args.messages.every((v) => typeof v === 'string')
		) {
			throw new Error('Dialog not given valid messages:string[]');
		}
		this.messages = args.messages;
		if (args.options && Array.isArray(args.options)) {
			if (args.options.length && args.options.every((v) => v instanceof SerialDialogOption)) {
				this.options = args.options;
			}
		}
		if (args.text_options && Array.isArray(args.text_options)) {
			if (
				args.text_options.length &&
				args.text_options.every((v) => v instanceof SerialDialogOption)
			) {
				this.text_options = args.text_options;
			}
		}
	}
	clone() {
		const newArgs = { ...this.args };
		if (this.options) {
			newArgs.options = this.options.map((v) => v.clone());
		}
		if (this.text_options) {
			newArgs.text_options = this.text_options.map((v) => v.clone());
		}
		return new SerialDialog(this.debug.clone(), newArgs);
	}
	static coerce(v: unknown) {
		if (!(v instanceof SerialDialog)) {
			throw new Error('not SerialDialog');
		}
		return v;
	}
}

export type SerialDialogInfo = {
	settings: SerialDialogSettings;
	messages: string[];
	options: SerialDialogOption[];
};

export type SerialOptionType = 'text_options' | 'options';
export class SerialDialogOption extends MathlangNode {
	mathlang: 'serial_dialog_option';
	optionType: SerialOptionType;
	label: string;
	script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'serial_dialog_option';
		if (args.optionType !== 'text_options' && args.optionType !== 'options') {
			throw new Error('invalid option type ' + args.optionType);
		}
		this.optionType = args.optionType;
		this.label = ACTION.breakIfNotString(args.label);
		this.script = ACTION.breakIfNotString(args.script);
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
	static coerceAll(array: unknown[]) {
		if (!array.every((v) => v instanceof SerialDialogOption)) {
			throw new Error('not every item in array is SerialDialogOption');
		}
		return array;
	}
}
// ------------------------------ ONE-OFFS ------------------------------ \\

export class IncludeNode extends MathlangNode {
	mathlang: 'include_macro';
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'include_macro';
		this.value = ACTION.breakIfNotString(args.value);
	}
	clone() {
		return new IncludeNode(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, value: string) {
		return new IncludeNode(debug, { value });
	}
}

export class ConstantDefinition extends MathlangNode {
	mathlang: 'constant_assignment';
	label: string;
	value: string | BoolLiteral | number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'constant_assignment';
		if (!isMGSPrimitive(args.value)) throw new Error('not primitive');
		this.label = ACTION.breakIfNotString(args.label);
		this.value = args.value;
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
}

export class ScriptDefinition extends MathlangNode {
	mathlang: 'script_definition';
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
		this.mathlang = 'script_definition';
		this.scriptName = ACTION.breakIfNotString(args.scriptName);
		if (typeof args.prePrint === 'string') this.prePrint = args.prePrint;
		if (typeof args.testPrint === 'string') this.testPrint = args.testPrint;
		if (typeof args.printed === 'string') this.printed = args.printed;
		if (args.rawNodes) {
			if (
				!Array.isArray(args.rawNodes) ||
				!args.rawNodes.every((v) => v instanceof AnyNode)
			) {
				throw new Error('ScriptDefinition not given valid rawNodes:AnyNode[]');
			} else {
				this.rawNodes = args.rawNodes;
			}
		}
		if (args.preActions) {
			if (
				!Array.isArray(args.preActions) ||
				!args.preActions.every((v) => v instanceof AnyNode)
			) {
				throw new Error('ScriptDefinition not given valid preActions:AnyNode[]');
			} else {
				this.preBakingActions = args.preActions;
			}
		}
		if (
			!args.actions ||
			!Array.isArray(args.actions) ||
			!args.actions.every((v) => v instanceof AnyNode)
		) {
			throw new Error('ScriptDefinition not given valid actions:AnyNode[]');
		}

		this.actions = args.actions;
		if (args.copyScriptResolved) this.copyScriptResolved = true;
	}
	clone() {
		const cloned = new ScriptDefinition(this.debug.clone(), this.args);
		cloned.actions = this.actions.map((v) => v.clone());
		if (this.rawNodes) {
			cloned.rawNodes = this.rawNodes.map((v) => v.clone());
		}
		if (this.preBakingActions) {
			cloned.preBakingActions = this.preBakingActions.map((v) => v.clone());
		}
		return cloned;
	}
	static quick(debug: MathlangLocation, scriptName: string, actions: AnyNode[]) {
		return new ScriptDefinition(debug, { scriptName, actions });
	}
}

export class CommentNode extends MathlangNode {
	mathlang: 'comment';
	comment: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'comment';
		this.comment = ACTION.breakIfNotString(args.comment);
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
	mathlang: 'label_definition';
	label: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'label_definition';
		this.label = ACTION.breakIfNotString(args.label);
	}
	clone() {
		return new LabelDefinition(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, label: string) {
		return new LabelDefinition(debug, { label });
	}
	print() {
		return `${ACTION.sanitizeLabel(this.label)}:`;
	}
}

export class JSONLiteral extends MathlangNode {
	mathlang: 'json_literal';
	json: [JSON];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'json_literal';
		if (!Array.isArray(args.json)) throw new Error('need array');
		try {
			this.json = JSON.parse(JSON.stringify(args.json));
		} catch {
			throw new Error('failed to parse JSON in JSONLiteral constructor');
		}
	}
	clone() {
		return new JSONLiteral(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, json: [JSON]) {
		return new JSONLiteral(debug, { json });
	}
}

export class CopyMacro extends MathlangNode {
	mathlang: 'copy_script';
	script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'copy_script';
		this.script = ACTION.breakIfNotString(args.script);
	}
	clone() {
		return new CopyMacro(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, script: string) {
		return new CopyMacro(debug, { script });
	}
	print() {
		return `"${this.script}"()`;
	}
}

// needs to be one unit of thing for reasons, but still contain than one thing
export class MathlangSequence extends MathlangNode {
	mathlang: 'sequence';
	type: string;
	steps: AnyNode[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'sequence';
		if (
			!args.steps ||
			!Array.isArray(args.steps) ||
			!args.steps.every((v) => v instanceof AnyNode)
		) {
			throw new Error('MathlangSequence not given valid AnyNode[]');
		}
		this.type = String(args.type) || 'unspecified sequence type';
		this.steps = args.steps;

		if (!(this.steps[0] instanceof CommentNode)) {
			// TODO: the condition might catch other, non-sequence comments tho?
			const innerComment = debug.node.text.replace(/[\n\s\t]+/g, ' ');
			const comment = `${args.type}: ${innerComment}`;
			const mathlangComment = CommentNode.quick(debug, comment);
			this.steps.unshift(mathlangComment);
		}

		const flatSteps: AnyNode[] = [];
		this.steps.forEach((v) => {
			if (v instanceof MathlangSequence) {
				flatSteps.push(...v.steps);
			} else {
				flatSteps.push(v);
			}
		});
		this.steps = flatSteps;
	}
	clone() {
		const newArgs = { ...this.args };
		newArgs.steps = this.steps.map((v) => v.clone());
		return new MathlangSequence(this.debug.clone(), newArgs);
	}
	static quick(debug: MathlangLocation, steps: AnyNode[], type?: string) {
		return new MathlangSequence(debug, { steps, type });
	}
}

// ------------------------------ INT EXPRESSIONS ------------------------------ \\

// TODO: The RNG operation should use macro syntax to be put into IntExpressions, instead of being limited to the ?= operator (probably RNG!(), though pick something that can't be confused with rand!())

export class IntExpression extends MathlangNode {}

export class IntBinaryExpression extends IntExpression {
	mathlang: 'int_binary_expression';
	lhs: IntExpression;
	rhs: IntExpression;
	op: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'int_binary_expression';
		if (!(args.lhs instanceof IntExpression)) {
			throw new Error('IntBinaryExpression LHS not IntExpression');
		}
		if (!(args.rhs instanceof IntExpression)) {
			throw new Error('IntBinaryExpression RHS not IntExpression');
		}
		this.lhs = args.lhs;
		this.rhs = args.rhs;
		this.op = ACTION.breakIfNotString(args.op);
	}
	clone() {
		const newArgs = { ...this.args };
		newArgs.lhs = this.lhs.clone();
		newArgs.rhs = this.rhs.clone();
		return new IntBinaryExpression(this.debug.clone(), newArgs);
	}
	static coerce(v: unknown) {
		if (!(v instanceof IntBinaryExpression)) {
			throw new Error('not IntBinaryExpression');
		}
		return v;
	}
	toStepsFromSteps(steps: AnyNode[]) {
		const temp = latestTemporary();
		const lhs = this.lhs;
		const op = this.op;
		const rhs = this.rhs;
		if (lhs instanceof IdentifierLiteral) {
			steps.push(ACTION.MUTATE_VARIABLES.set(lhs.debug, temp, lhs.source));
		} else if (lhs instanceof NumberLiteral) {
			steps.push(ACTION.MUTATE_VARIABLE.set(temp, lhs.value));
		} else if (lhs instanceof EntityIntField) {
			steps.push(ACTION.COPY_VARIABLE.intoVariable(lhs.entity, lhs.field, temp));
		} else if (lhs instanceof RNGSingle) {
			steps.push(ACTION.MUTATE_VARIABLE.change(lhs.debug, temp, lhs.value, '?'));
		} else if (lhs instanceof RNGPair) {
			steps.push(
				ACTION.MUTATE_VARIABLE.change(lhs.debug, temp, lhs.value, '?'),
				ACTION.MUTATE_VARIABLE.change(lhs.debug, temp, lhs.add, '+'),
			);
		} else if (lhs instanceof IntBinaryExpression) {
			// can use the same temporary since it's the lhs and we're going LTR
			lhs.toStepsFromSteps(steps);
		}
		if (rhs instanceof IdentifierLiteral) {
			steps.push(ACTION.MUTATE_VARIABLES.change(temp, rhs.source, op));
		} else if (rhs instanceof NumberLiteral) {
			if (invisibleMath(op, rhs.value)) {
				// invisible == *1 or +0
			} else {
				steps.push(ACTION.MUTATE_VARIABLE.change(rhs.debug, temp, rhs.value, op));
			}
		} else if (rhs instanceof EntityIntField) {
			const quickTemp = quickTemporary();
			steps.push(
				ACTION.COPY_VARIABLE.intoVariable(rhs.entity, rhs.field, quickTemp),
				ACTION.MUTATE_VARIABLES.change(temp, quickTemp, op),
			);
		} else if (rhs instanceof RNGSingle) {
			const quickTemp = quickTemporary();
			steps.push(
				ACTION.MUTATE_VARIABLE.change(rhs.debug, quickTemp, rhs.value, '?'),
				ACTION.MUTATE_VARIABLES.change(temp, quickTemp, op),
			);
		} else if (rhs instanceof RNGPair) {
			const quickTemp = quickTemporary();
			steps.push(
				ACTION.MUTATE_VARIABLE.change(rhs.debug, quickTemp, rhs.value, '?'),
				ACTION.MUTATE_VARIABLE.change(rhs.debug, quickTemp, rhs.add, '+'),
				ACTION.MUTATE_VARIABLES.change(temp, quickTemp, op),
			);
		} else if (rhs instanceof IntBinaryExpression) {
			const newTemp = newTemporary();
			rhs.toStepsFromSteps(steps);
			steps.push(ACTION.MUTATE_VARIABLES.change(temp, newTemp, op));
			dropTemporary();
		}
		return steps;
	}
	assignToVar(destinationVar: string) {
		newTemporary(destinationVar); // the inside uses latestTemporary()
		const steps = this.toStepsFromSteps([]);
		dropTemporary();
		return new MathlangSequence(this.debug, {
			steps,
			type: 'IntBinaryExpression.toSequence',
		});
	}
}

const invisibleMath = (op: string, operand: number): boolean => {
	if (op === '+' && operand === 0) return true;
	if (op === '-' && operand === 0) return true;
	if (op === '*' && operand === 1) return true;
	if (op === '/' && operand === 1) return true;
	return false;
};

export class IntUnit extends IntExpression {
	static fromAny(debug: MathlangLocation, v: unknown) {
		if (v instanceof IntBinaryExpression) return v;
		if (v instanceof IntGetable) return v;
		if (
			debug.node instanceof TreeSitterNode &&
			debug.node.grammarType === 'CONSTANT' &&
			typeof v !== 'string' &&
			typeof v !== 'number'
		) {
			if (!debug.f) throw new Error('missing f');
			v = coerceToString(debug.f, debug.node, v, 'constant');
		}
		if (typeof v === 'number') {
			return NumberLiteral.quick(debug, v);
		}
		if (typeof v === 'string') {
			return IdentifierLiteral.quick(debug, v);
		}
		throw new Error('invalid IntUnit');
	}
}

export class NumberLiteral extends IntUnit {
	value: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = ACTION.breakIfNotNumber(args.value);
	}
	clone() {
		return new NumberLiteral(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, value: number) {
		return new NumberLiteral(debug, { value });
	}
}
export class IntGetable extends IntUnit {
	mathlang: 'int_getable';
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'int_getable';
	}
	assignToVar(variable: string) {
		return ACTION.Action.fromArgs({ ...this, variable });
	}
}
export class IdentifierLiteral extends IntGetable {
	source: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.source = ACTION.breakIfNotString(args.source);
	}
	clone() {
		return new IdentifierLiteral(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, source: string) {
		return new IdentifierLiteral(debug, { source });
	}
}
export class EntityIntField extends IntGetable {
	entity: string;
	field: string;
	inbound: false;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.inbound = false;
		this.entity = ACTION.breakIfNotString(args.entity);
		this.field = ACTION.breakIfNotString(args.field);
	}
	clone() {
		return new EntityIntField(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, entity: string, field: string) {
		return new EntityIntField(debug, { entity, field });
	}
	static coerce(v: unknown) {
		if (!(v instanceof EntityIntField)) {
			throw new Error('not EntityIntField');
		}
		return v;
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
			const f = this.debug.f;
			const node = this.debug.node;
			const propertyNode = mandatoryChildForField(f, node, 'property');
			f.quickError(
				propertyNode,
				'unsupported entity field',
				`this property is not supported in boolean expressions`,
			);
		}
		throw new Error('could not format number_checkable_equality');
	}
}
export class RNGSingle extends IntGetable {
	value: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.value = ACTION.breakIfNotNumber(args.value);
	}
	clone() {
		return new RNGSingle(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, value: number) {
		return new RNGSingle(debug, { value });
	}
	assignToVar(destinationVar: string) {
		return ACTION.MUTATE_VARIABLE.change(this.debug, destinationVar, this.value, '?');
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
	clone() {
		return new RNGPair(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, value: number, add: number) {
		return new RNGPair(debug, { value, add });
	}
	toSteps(destinationVar: string) {
		return [
			ACTION.MUTATE_VARIABLE.change(this.debug, destinationVar, this.value, '?'),
			ACTION.MUTATE_VARIABLE.change(this.debug, destinationVar, this.add, '+'),
		];
	}
	assignToVar(destinationVar: string) {
		return new MathlangSequence(this.debug, {
			steps: this.toSteps(destinationVar),
			type: `RNGPair.toSequence`,
		});
	}
}

// ------------------------------ BOOL EXPRESSIONS ------------------------------ \\

export class BoolExpression extends MathlangNode {
	invert() {
		console.error('the children should be doing this, not me');
		return this;
	}
	static coerce(v: unknown) {
		if (!(v instanceof BoolExpression)) {
			throw new Error('not BoolExpression');
		}
		return v;
	}
	// TODO: See which bits of this are duplicate (check individual toSteps() fns)
	toSteps(ifLabel: string) {
		const debug = this.debug;
		if (this instanceof BoolLiteral && this.value === true) {
			return [GotoLabel.quick(debug, ifLabel)];
		} else if (this instanceof BoolLiteral && this.value === false) {
			return [];
		}
		if (typeof this === 'string') {
			return [
				new ACTION.CHECK_SAVE_FLAG({
					save_flag: this,
					expected_bool: true,
					label: ifLabel,
				}),
			];
		}
		if (this instanceof BoolGetable || this instanceof BoolComparison) {
			return [ACTION.Action.fromArgs({ ...this, label: ifLabel })];
		}
		if (!(this instanceof BoolBinaryExpression)) {
			throw new Error('expansion for condition not yet implemented');
		}
		const op = this.op;
		const lhs = this.lhs;
		const rhs = this.rhs;
		if (typeof lhs === 'number' || typeof rhs === 'number') {
			throw new Error('LHS or RHS not a number');
		}
		if (op === '||') {
			return [...lhs.toSteps(ifLabel), ...rhs.toSteps(ifLabel)];
		}
		if (op === '&&') {
			// basically nesting the ifs
			if (!debug.f) throw new Error('should have an f?');
			const suffix = debug.f.p.advanceGotoSuffix();
			const secondIfTrueLabel = `if true #${suffix}`;
			const secondRendezvousLabel = `rendezvous #${suffix}`;
			return [
				...lhs.toSteps(secondIfTrueLabel),
				GotoLabel.quick(debug, secondRendezvousLabel),
				new LabelDefinition(debug, { label: secondIfTrueLabel }),
				...rhs.toSteps(ifLabel),
				new LabelDefinition(debug, { label: secondRendezvousLabel }),
			];
		}
		if (op !== '==' && op !== '!=') {
			throw new Error('expected == or !==, found ' + op);
		}
		// Cannot directly compare bools. Must branch on if they are both true, or both false
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
	assignToVar(destinationVar: string): AnyNode {
		const lhsAction = ACTION.SET_SAVE_FLAG.toValue(destinationVar, true);
		return this.assignToSetBool(lhsAction);
	}
	assignToSetBool(setBool: ACTION.ActionSetBool): AnyNode {
		const f = this.debug.f;
		const node = this.debug.node;
		// player glitched = self glitched;
		// ->
		// if (self glitched) { player glitched = true; } else { player glitched = false; }
		const cloneIfFalse = setBool.clone();
		cloneIfFalse.invert();
		if (this instanceof ACTION.BoolGetableAction || this instanceof BoolComparison) {
			return simpleBranchMaker(f, node, this, [setBool], [cloneIfFalse]);
		}

		return simpleBranchMaker(f, this.debug?.node || node, this, [setBool], [cloneIfFalse]);
	}
}

export class BoolComparisonSequence extends BoolExpression {
	mathlang: 'bool_expression_sequence';
	steps: AnyNode[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'bool_expression_sequence';
		if (!Array.isArray(args.steps)) {
			throw new Error('should be array');
		}
		if (!args.steps.every((v) => v instanceof AnyNode)) {
			throw new Error('should all be AnyNode');
		}
		this.steps = args.steps;
	}
	clone() {
		const newArgs = { ...this.args };
		newArgs.steps = this.steps.map((v) => v.clone());
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
	static quick(debug: MathlangLocation, steps: AnyNode[]) {
		return new BoolComparisonSequence(debug, {
			steps,
		});
	}
	toSteps(ifLabel: string) {
		const final = this.getFinalStep();
		const newFinal = ACTION.Action.fromArgs({ ...final, label: ifLabel });
		this.steps[this.steps.length - 1] = newFinal;
		return this.steps;
	}
}

export class BoolUnit extends BoolExpression {}

export class BoolLiteral extends BoolUnit {
	mathlang: 'bool_literal';
	value: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'bool_literal';
		this.value = ACTION.breakIfNotBool(args.value);
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
}

export class BoolComparison extends BoolExpression {
	action: string;
	expected_bool: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
}

export class BoolBinaryExpression extends BoolExpression {
	mathlang: 'bool_binary_expression';
	lhs: BoolExpression;
	rhs: BoolExpression;
	op: string;
	lhsNode: TreeSitterNode;
	rhsNode: TreeSitterNode;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'bool_binary_expression';
		if (!(args.lhs instanceof BoolExpression)) throw new Error('not BoolExpression');
		if (!(args.rhs instanceof BoolExpression)) throw new Error('not BoolExpression');
		if (!(args.lhsNode instanceof TreeSitterNode)) throw new Error('not TSNode');
		if (!(args.rhsNode instanceof TreeSitterNode)) throw new Error('not TSNode');
		this.op = ACTION.breakIfNotString(args.op);
		this.lhs = args.lhs;
		this.rhs = args.rhs;
		this.lhsNode = args.lhsNode;
		this.rhsNode = args.rhsNode;
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
}

// ------------------------------ INTERMEDIATES ------------------------------ \\

// For things that are otherwise actions, they will be missing their destinations until it's time to make them a real Action

// --------------- BOOL GETABLE

export class BoolGetable extends BoolUnit {
	action: string;
	mathlang: 'bool_getable';
	comment?: string;
	expected_bool: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'bool_getable';
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
}
export class CheckEntityGlitched extends BoolGetable {
	action: 'CHECK_ENTITY_GLITCHED';
	entity: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_GLITCHED';
		this.entity = ACTION.breakIfNotString(args.entity);
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
}
export class CheckSaveFlag extends BoolGetable {
	action: 'CHECK_SAVE_FLAG';
	save_flag: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_SAVE_FLAG';
		this.save_flag = ACTION.breakIfNotString(args.save_flag);
	}
	clone() {
		return new CheckSaveFlag(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, save_flag: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckSaveFlag(debug, { save_flag, expected_bool });
	}
}
export class CheckIfEntityIsInGeometry extends BoolGetable {
	action: 'CHECK_IF_ENTITY_IS_IN_GEOMETRY';
	geometry: string;
	entity: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_IF_ENTITY_IS_IN_GEOMETRY';
		this.geometry = ACTION.breakIfNotString(args.geometry);
		this.entity = ACTION.breakIfNotString(args.entity);
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
}
export class CheckForButtonPress extends BoolGetable {
	action: 'CHECK_FOR_BUTTON_PRESS';
	button_id: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_FOR_BUTTON_PRESS';
		this.button_id = ACTION.breakIfNotString(args.button_id);
	}
	clone() {
		return new CheckForButtonPress(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, button_id: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckForButtonPress(debug, { button_id, expected_bool });
	}
}
export class CheckForButtonState extends BoolGetable {
	action: 'CHECK_FOR_BUTTON_STATE';
	button_id: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_FOR_BUTTON_STATE';
		this.button_id = ACTION.breakIfNotString(args.button_id);
	}
	clone() {
		return new CheckForButtonState(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, button_id: string, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckForButtonState(debug, { button_id, expected_bool });
	}
}
export class CheckDialogOpen extends BoolGetable {
	action: 'CHECK_DIALOG_OPEN';
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_DIALOG_OPEN';
	}
	clone() {
		return new CheckDialogOpen(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckDialogOpen(debug, { expected_bool });
	}
}
export class CheckSerialDialogOpen extends BoolGetable {
	action: 'CHECK_SERIAL_DIALOG_OPEN';
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_SERIAL_DIALOG_OPEN';
	}
	clone() {
		return new CheckSerialDialogOpen(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckSerialDialogOpen(debug, { expected_bool });
	}
}
export class CheckDebugMode extends BoolGetable {
	action: 'CHECK_DEBUG_MODE';
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_DEBUG_MODE';
	}
	clone() {
		return new CheckDebugMode(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, provided_bool?: boolean) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
		return new CheckDebugMode(debug, { expected_bool });
	}
}

// --------------- STRING CHECKABLE

export class StringCheckable extends BoolComparison {
	mathlang: 'string_checkable';
	comment?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'string_checkable';
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
}

export class CheckEntityName extends StringCheckable {
	action: 'CHECK_ENTITY_NAME';
	entity: string;
	string: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_NAME';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.string = ACTION.breakIfNotString(args.string);
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
}
export class CheckEntityInteractScript extends StringCheckable {
	action: 'CHECK_ENTITY_INTERACT_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_INTERACT_SCRIPT';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.expected_script = ACTION.breakIfNotString(args.expected_script);
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
}
export class CheckEntityTickScript extends StringCheckable {
	action: 'CHECK_ENTITY_TICK_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_TICK_SCRIPT';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.expected_script = ACTION.breakIfNotString(args.expected_script);
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
}
export class CheckEntityLookScript extends StringCheckable {
	action: 'CHECK_ENTITY_LOOK_SCRIPT';
	entity: string;
	expected_script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_LOOK_SCRIPT';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.expected_script = ACTION.breakIfNotString(args.expected_script);
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
}
export class CheckEntityType extends StringCheckable {
	action: 'CHECK_ENTITY_TYPE';
	entity: string;
	entity_type: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_TYPE';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.entity_type = ACTION.breakIfNotString(args.entity_type);
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
}
export class CheckEntityDirection extends StringCheckable {
	action: 'CHECK_ENTITY_DIRECTION';
	entity: string;
	direction: string; // north, south, east, west
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_DIRECTION';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.direction = ACTION.breakIfNotString(args.direction);
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
}
export class CheckEntityPath extends StringCheckable {
	action: 'CHECK_ENTITY_PATH';
	geometry: string;
	entity: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_PATH';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.geometry = ACTION.breakIfNotString(args.geometry);
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
}
export class CheckWarpState extends StringCheckable {
	action: 'CHECK_WARP_STATE';
	string: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_WARP_STATE';
		this.string = ACTION.breakIfNotString(args.string);
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
}
export class CheckMap extends StringCheckable {
	// TODO: is this even in the engine? O.o
	action: 'CHECK_MAP';
	map: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_MAP';
		this.map = ACTION.breakIfNotString(args.map);
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
}
export class CheckBLEFlag extends StringCheckable {
	// or this?
	action: 'CHECK_BLE_FLAG';
	ble_flag: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_BLE_FLAG';
		this.ble_flag = ACTION.breakIfNotString(args.ble_flag);
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
}

// --------------- NUMBER COMPARISON

export class NumberComparison extends BoolComparison {
	mathlang: 'number_comparison';
	comment?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'number_comparison';
		this.expected_bool = true;
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
		this.variable = ACTION.breakIfNotString(args.variable);
		this.comparison = ACTION.breakIfNotString(args.comparison);
		this.value = ACTION.breakIfNotNumber(args.value);
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
}
export class CheckVariables extends NumberComparison {
	action: 'CHECK_VARIABLES';
	variable: string;
	comparison: string;
	source: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_VARIABLES';
		this.variable = ACTION.breakIfNotString(args.variable);
		this.comparison = ACTION.breakIfNotString(args.comparison);
		this.source = ACTION.breakIfNotString(args.source);
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
}

// --------------- NUMBER CHECKABLE EQUALITY

export class NumberCheckableEquality extends BoolComparison {
	mathlang: 'number_checkable_equality';
	comment?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'number_checkable_equality';
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
}
export class CheckEntityX extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_X';
	entity: string;
	expected_u2: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_X';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.expected_u2 = ACTION.breakIfNotNumber(args.expected_u2);
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
}
export class CheckEntityY extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_Y';
	entity: string;
	expected_u2: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_Y';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.expected_u2 = ACTION.breakIfNotNumber(args.expected_u2);
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
}
export class CheckEntityPrimaryID extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_PRIMARY_ID';
	entity: string;
	expected_u2: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_PRIMARY_ID';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.expected_u2 = ACTION.breakIfNotNumber(args.expected_u2);
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
}
export class CheckEntitySecondaryID extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_SECONDARY_ID';
	entity: string;
	expected_u2: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_SECONDARY_ID';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.expected_u2 = ACTION.breakIfNotNumber(args.expected_u2);
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
}
export class CheckEntityPrimaryIDType extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_PRIMARY_ID_TYPE';
	entity: string;
	expected_byte: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_PRIMARY_ID_TYPE';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.expected_byte = ACTION.breakIfNotNumber(args.expected_byte);
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
}
export class CheckEntityCurrentAnimation extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_CURRENT_ANIMATION';
	entity: string;
	expected_byte: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_CURRENT_ANIMATION';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.expected_byte = ACTION.breakIfNotNumber(args.expected_byte);
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
}
export class CheckEntityCurrentFrame extends NumberCheckableEquality {
	action: 'CHECK_ENTITY_CURRENT_FRAME';
	entity: string;
	expected_byte: number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_CURRENT_FRAME';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.expected_byte = ACTION.breakIfNotNumber(args.expected_byte);
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
}

// --------------- BOOL SETABLE
// TODO make like the rest? or?

export class BoolSetable extends MathlangNode {
	mathlang: 'bool_setable';
	type: string;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'bool_setable';
		this.value = ACTION.breakIfNotString(args.value);
		this.type = ACTION.breakIfNotString(args.type);
	}
	clone() {
		return new BoolSetable(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new BoolSetable(debug, { type, value });
	}
	static coerce(v: unknown) {
		if (!(v instanceof BoolSetable)) {
			throw new Error('not BoolSetable');
		}
		return v;
	}
}
export class MovableIdentifier extends MathlangNode {
	mathlang: 'movable_identifier';
	type: string;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'movable_identifier';
		this.value = ACTION.breakIfNotString(args.value);
		this.type = ACTION.breakIfNotString(args.type);
	}
	clone() {
		return new MovableIdentifier(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new MovableIdentifier(debug, { type, value });
	}
	static coerce(v: unknown) {
		if (!(v instanceof MovableIdentifier)) {
			throw new Error('not MovableIdentifier');
		}
		return v;
	}
}
export class CoordinateIdentifier extends MathlangNode {
	mathlang: 'coordinate_identifier';
	type: string;
	value: string;
	polygonType?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'coordinate_identifier';
		this.value = ACTION.breakIfNotString(args.value);
		this.type = ACTION.breakIfNotString(args.type);
		if (args.polygonType) this.polygonType = ACTION.breakIfNotString(args.polygonType);
	}
	clone() {
		return new CoordinateIdentifier(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string, polygonType?: string) {
		return new CoordinateIdentifier(debug, { type, value, polygonType });
	}
	static coerce(v: unknown) {
		if (!(v instanceof CoordinateIdentifier)) {
			throw new Error('not CoordinateIdentifier');
		}
		return v;
	}
}
export class DirectionTarget extends MathlangNode {
	mathlang: 'direction_target';
	type: string;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'direction_target';
		this.value = ACTION.breakIfNotString(args.value);
		this.type = ACTION.breakIfNotString(args.type);
	}
	clone() {
		return new DirectionTarget(this.debug.clone(), this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new DirectionTarget(debug, { type, value });
	}
	static coerce(v: unknown) {
		if (!(v instanceof DirectionTarget)) {
			throw new Error('not DirectionTarget');
		}
		return v;
	}
}
