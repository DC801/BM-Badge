import { Node as TreeSitterNode } from 'web-tree-sitter';
import { FileState } from './parser-file.ts';
import * as ACTION from './parser-bytecode-info.ts';
import {
	dropTemporary,
	inverseOpMap,
	latestTemporary,
	newTemporary,
	quickTemporary,
} from './parser-utilities.ts';
import { type GenericObj } from './parser-actions.ts';
import { coerceToString } from './parser-capture.ts';

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
	clone() {
		return this.constructor(MathlangNode);
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
	f?: FileState;
	node: TreeSitterNode;
	fileName: string;
	comment?: string;
	constructor(f: FileState, node: TreeSitterNode, comment?: string) {
		this.f = f;
		this.fileName = f.fileName;
		this.node = node;
		if (comment) this.comment = comment;
	}
}
export class MathlangMessage {
	locations: MathlangLocation[];
	message: string;
	footer?: string;
}

const truncate = (s: string, n: number): string => {
	const orig = s.replace(/\n/g, ' ');
	return s.length > n + 3 ? orig.slice(0, n) + '...' : orig;
};

// ------------------------------ SETTINGS ------------------------------ \\

export class AddDialogSettings extends MathlangNode {
	mathlang: 'add_dialog_settings';
	args: GenericObj;
	debug: MathlangLocation;
	targets: AddDialogSettingsTarget[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		if (
			!args.targets ||
			!Array.isArray(args.targets) ||
			!args.targets.every((v) => v instanceof AddDialogSettingsTarget)
		) {
			throw new Error('AddDialogSettings not given valid AddDialogSettingsTarget[]');
		}
		this.args = args;
		this.debug = debug;
		this.mathlang = 'add_dialog_settings';
		this.targets = args.targets;
	}
	clone() {
		return new AddDialogSettings(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, targets: AddDialogSettingsTarget[]) {
		return new AddDialogSettings(debug, { targets });
	}
}

export class AddDialogSettingsTarget extends MathlangNode {
	mathlang: 'add_dialog_settings_target';
	args: GenericObj;
	type: string;
	debug: MathlangLocation;
	parameters: DialogParameter[];
	target?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		if (
			!args.parameters ||
			!Array.isArray(args.parameters) ||
			!args.parameters.every((v) => v instanceof DialogParameter)
		) {
			throw new Error('AddDialogSettingsTarget not given valid DialogParameter[]');
		}
		this.args = args;
		this.debug = debug;
		this.mathlang = 'add_dialog_settings_target';
		this.type = ACTION.breakIfNotString(args.type);
		this.parameters = args.parameters;
		if (typeof args.target === 'string') this.target = args.target;
	}
	clone() {
		return new AddDialogSettingsTarget(this.debug, this.args);
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
}

export class AddSerialDialogSettings extends MathlangNode {
	mathlang: 'add_serial_dialog_settings';
	args: GenericObj;
	parameters: SerialDialogParameter[];
	debug: MathlangLocation;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		if (
			!args.parameters ||
			!Array.isArray(args.parameters) ||
			!args.parameters.every((v) => v instanceof SerialDialogParameter)
		) {
			throw new Error('AddSerialDialogSettings not given valid SerialDialogParameter[]');
		}
		this.args = args;
		this.debug = debug;
		this.mathlang = 'add_serial_dialog_settings';
		this.parameters = args.parameters;
	}
	clone() {
		return new AddSerialDialogSettings(this.debug, this.args);
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
	args: GenericObj;
	debug: MathlangLocation;
	constructor(debug: MathlangLocation) {
		super();
		this.args = {};
		this.debug = debug;
		this.mathlang = 'return_statement';
	}
	clone() {
		return new ReturnStatement(this.debug);
	}
}
export class ContinueStatement extends MathlangNode {
	mathlang: 'continue_statement';
	args: GenericObj;
	debug: MathlangLocation;
	constructor(debug: MathlangLocation) {
		super();
		this.args = {};
		this.debug = debug;
		this.mathlang = 'continue_statement';
	}
	clone() {
		return new ContinueStatement(this.debug);
	}
}
export class BreakStatement extends MathlangNode {
	mathlang: 'break_statement';
	args: GenericObj;
	debug: MathlangLocation;
	constructor(debug: MathlangLocation) {
		super();
		this.args = {};
		this.debug = debug;
		this.mathlang = 'break_statement';
	}
	clone() {
		return new BreakStatement(this.debug);
	}
}

export class GotoLabel extends MathlangNode {
	mathlang: 'goto_label';
	debug: MathlangLocation;
	args: GenericObj;
	label: string;
	comment?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'goto_label';
		this.label = ACTION.breakIfNotString(args.label);
		if (typeof args.comment === 'string') this.comment = args.comment;
	}
	clone() {
		return new GotoLabel(this.debug, this.args);
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
	args: GenericObj;
	debug: MathlangLocation;
	dialogName: string;
	dialogs: Dialog[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		if (
			!args.dialogs ||
			!Array.isArray(args.dialogs) ||
			!args.dialogs.every((v) => v instanceof Dialog)
		) {
			throw new Error('DialogDefinition not given valid Dialog[]');
		}
		this.args = args;
		this.debug = debug;
		this.mathlang = 'dialog_definition';
		this.dialogName = ACTION.breakIfNotString(args.dialogName);
		this.dialogs = args.dialogs;
	}
	clone() {
		return new DialogDefinition(this.debug, this.args);
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
	args: GenericObj;
	debug: MathlangLocation;
	property: string;
	value: MGSPrimitive;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'dialog_parameter';
		this.property = ACTION.breakIfNotString(args.property);
		this.value = ACTION.breakIfNotStringOrNumber(args.value);
	}
	clone() {
		return new DialogParameter(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, property: string, value: string | number) {
		return new DialogParameter(debug, { property, value });
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
	debug: MathlangLocation;
	args: GenericObj;

	messages: string[];
	response_type?: 'SELECT_FROM_SHORT_LIST';
	options?: DialogOption[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
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
		this.mathlang = 'dialog';
		this.args = args;
		this.debug = debug;
		this.messages = args.messages;
		if (typeof args.settings === 'object' && args.settings !== null) {
			Object.entries(args.settings).forEach(([k, v]) => {
				this[k] = v; // todo: this is a little bit of trust, eh?
			});
		}
	}
	clone() {
		return new DialogParameter(this.debug, this.args);
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
	args: GenericObj;
	debug: MathlangLocation;
	type: DialogIdentifierType;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		if (args.type !== 'label' && args.type !== 'entity' && args.type !== 'name') {
			throw new Error('invalid DialogIdentifier type');
		}
		this.args = args;
		this.debug = debug;
		this.mathlang = 'dialog_identifier';
		this.type = args.type;
		this.value = ACTION.breakIfNotString(args.value);
	}
	clone() {
		return new DialogIdentifier(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new DialogIdentifier(debug, { type, value });
	}
}
type DialogIdentifierType = 'label' | 'entity' | 'name';

export class DialogOption extends MathlangNode {
	mathlang: 'dialog_option';
	args: GenericObj;
	debug: MathlangLocation;
	label: string;
	script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'dialog_option';
		this.label = ACTION.breakIfNotString(args.label);
		this.script = ACTION.breakIfNotString(args.script);
	}
	clone() {
		return new DialogOption(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, label: string, script: string) {
		return new DialogOption(debug, {
			label,
			script,
		});
	}
}

// ------------------------------ SERIAL DIALOG ------------------------------ \\

export class SerialDialogDefinition extends MathlangNode {
	mathlang: 'serial_dialog_definition';
	args: GenericObj;
	debug: MathlangLocation;
	dialogName: string;
	serialDialog: SerialDialog;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		if (!(args.serialDialog instanceof SerialDialog)) {
			throw new Error('SerialDialogDefinition not given valid SerialDialog');
		}
		this.args = args;
		this.debug = debug;
		this.mathlang = 'serial_dialog_definition';
		this.dialogName = ACTION.breakIfNotString(args.dialogName);
		this.serialDialog = args.serialDialog;
	}
	clone() {
		return new SerialDialogDefinition(this.debug, this.args);
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
	debug: MathlangLocation;
	args: GenericObj;
	property: string;
	value: MGSPrimitive;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'serial_dialog_parameter';
		this.property = ACTION.breakIfNotString(args.property);
		this.value = ACTION.breakIfNotStringOrNumber(args.value);
	}
	clone() {
		return new SerialDialogParameter(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, property: string, value: string | number) {
		return new SerialDialogParameter(debug, { property, value });
	}
}

export class SerialDialog extends MathlangNode {
	mathlang: 'serial_dialog';
	debug: MathlangLocation;
	args: GenericObj;

	messages: string[];
	options?: SerialDialogOption[];
	text_options?: SerialDialogOption[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		if (
			!args.messages ||
			!Array.isArray(args.messages) ||
			!args.messages.every((v) => typeof v === 'string')
		) {
			throw new Error('Dialog not given valid messages:string[]');
		}
		this.args = args;
		this.debug = debug;
		this.mathlang = 'serial_dialog';
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
		return new SerialDialog(this.debug, this.args);
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
	args: GenericObj;
	debug: MathlangLocation;
	optionType: SerialOptionType;
	label: string;
	script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		if (args.optionType !== 'text_options' && args.optionType !== 'options') {
			throw new Error('invalid option type ' + args.optionType);
		}
		this.args = args;
		this.debug = debug;
		this.mathlang = 'serial_dialog_option';
		this.optionType = args.optionType;
		this.label = ACTION.breakIfNotString(args.label);
		this.script = ACTION.breakIfNotString(args.script);
	}
	clone() {
		return new SerialDialogOption(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, optionType: string, label: string, script: string) {
		return new SerialDialogOption(debug, {
			optionType,
			label,
			script,
		});
	}
}
// ------------------------------ ONE-OFFS ------------------------------ \\

export class IncludeNode extends MathlangNode {
	mathlang: 'include_macro';
	args: GenericObj;
	debug: MathlangLocation;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'include_macro';
		this.value = ACTION.breakIfNotString(args.value);
	}
	clone() {
		return new IncludeNode(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, value: string) {
		return new IncludeNode(debug, { value });
	}
}

export class ConstantDefinition extends MathlangNode {
	mathlang: 'constant_assignment';
	args: GenericObj;
	debug: MathlangLocation;
	label: string;
	value: string | BoolLiteral | number;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		if (!isMGSPrimitive(args.value)) throw new Error('not primitive');
		this.args = args;
		this.debug = debug;
		this.mathlang = 'constant_assignment';
		this.label = ACTION.breakIfNotString(args.label);
		this.value = args.value;
	}
	clone() {
		return new ConstantDefinition(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, label: string, value: string | BoolLiteral | number) {
		return new ConstantDefinition(debug, { label, value });
	}
}

export class ScriptDefinition extends MathlangNode {
	mathlang: 'script_definition';
	args: GenericObj;
	debug: MathlangLocation;
	scriptName: string;
	prePrint?: string;
	testPrint?: string;
	printed?: string;
	rawNodes?: AnyNode[];
	actions: AnyNode[];
	preActions?: AnyNode[];
	copyScriptResolved?: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
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
				this.preActions = args.preActions;
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
		const cloned = new ScriptDefinition(this.debug, this.args);
		cloned.actions = cloned.actions.map((v) => v.clone());
		if (cloned.rawNodes) {
			cloned.rawNodes = cloned.rawNodes.map((v) => v.clone());
		}
		if (cloned.preActions) {
			cloned.preActions = cloned.preActions.map((v) => v.clone());
		}
		return cloned;
	}
}

export class CommentNode extends MathlangNode {
	mathlang: 'comment';
	debug: MathlangLocation;
	args: GenericObj;
	comment: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'comment';
		this.comment = ACTION.breakIfNotString(args.comment);
	}
	clone() {
		return new CommentNode(this.debug, this.args);
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
	debug: MathlangLocation;
	args: GenericObj;
	label: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'label_definition';
		this.label = ACTION.breakIfNotString(args.label);
	}
	clone() {
		return new LabelDefinition(this.debug, this.args);
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
	debug: MathlangLocation;
	args: GenericObj;
	json: [JSON];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'json_literal';
		if (!Array.isArray(args.json)) throw new Error('need array');
		this.json = JSON.parse(JSON.stringify(args.json));
	}
	clone() {
		return new JSONLiteral(this.debug, this.args);
	}
}

export class CopyMacro extends MathlangNode {
	mathlang: 'copy_script';
	debug: MathlangLocation;
	args: GenericObj;
	script: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'copy_script';
		this.script = ACTION.breakIfNotString(args.script);
	}
	clone() {
		return new CopyMacro(this.debug, this.args);
	}
	print() {
		return `copy!("${this.script}")`;
	}
}

// needs to be one unit of thing for reasons, but still contain than one thing
export class MathlangSequence extends MathlangNode {
	mathlang: 'sequence';
	debug: MathlangLocation;
	args: GenericObj;
	type: string;
	steps: AnyNode[];
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'sequence';
		if (
			!args.steps ||
			!Array.isArray(args.steps) ||
			!args.steps.every((v) => v instanceof AnyNode)
		) {
			throw new Error('MathlangSequence not given valid AnyNode[]');
		}
		this.type = ACTION.breakIfNotString(args.type);
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
		return new MathlangSequence(this.debug, this.args);
	}
}

// ------------------------------ INT EXPRESSIONS ------------------------------ \\

// TODO: The RNG operation should use macro syntax to be put into IntExpressions, instead of being limited to the ?= operator (probably RNG!(), though pick something that can't be confused with rand!())

export class IntExpression extends MathlangNode {
	mathlang: string;
	debug: MathlangLocation;
	args: GenericObj;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
	}
}

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
		return new IntBinaryExpression(this.debug, this.args);
	}
	flatten(steps: AnyNode[]) {
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
		} else if (lhs instanceof IntBinaryExpression) {
			// can use the same temporary since it's the lhs and we're going LTR
			lhs.flatten(steps);
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
		} else if (rhs instanceof IntBinaryExpression) {
			const newTemp = newTemporary();
			rhs.flatten(steps);
			steps.push(ACTION.MUTATE_VARIABLES.change(temp, newTemp, op));
			dropTemporary();
		}
		return steps;
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
		if (v instanceof EntityIntField) return v;
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
	static quick(debug: MathlangLocation, value: number) {
		return new NumberLiteral(debug, { value });
	}
	clone() {
		return new NumberLiteral(this.debug, this.args);
	}
}
export class IntGetable extends IntUnit {
	mathlang: 'int_getable';
	debug: MathlangLocation;
	args: GenericObj;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.mathlang = 'int_getable';
		this.args = args;
		this.debug = debug;
	}
	storeInVariable(variable: string) {
		return ACTION.Action.fromArgs({ ...this, variable });
	}
	clone() {
		return new IntGetable(this.debug, this.args);
	}
}
export class IdentifierLiteral extends IntGetable {
	source: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.source = ACTION.breakIfNotString(args.source);
	}
	static quick(debug: MathlangLocation, source: string) {
		return new IdentifierLiteral(debug, { source });
	}
	clone() {
		return new IdentifierLiteral(this.debug, this.args);
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
	static quick(debug: MathlangLocation, entity: string, field: string) {
		return new EntityIntField(debug, { entity, field });
	}
	clone() {
		return new EntityIntField(this.debug, this.args);
	}
}

// ------------------------------ BOOL EXPRESSIONS ------------------------------ \\

export class BoolExpression extends MathlangNode {
	invert() {
		console.error('the children should be doing this, not me');
		return this;
	}
	flatten(ifLabel: string) {
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
			return [...lhs.flatten(ifLabel), ...rhs.flatten(ifLabel)];
		}
		if (op === '&&') {
			// basically nesting the ifs
			if (!debug.f) throw new Error('should have an f?');
			const suffix = debug.f.p.advanceGotoSuffix();
			const secondIfTrueLabel = `if true #${suffix}`;
			const secondRendezvousLabel = `rendezvous #${suffix}`;
			return [
				...lhs.flatten(secondIfTrueLabel),
				GotoLabel.quick(debug, secondRendezvousLabel),
				new LabelDefinition(debug, { label: secondIfTrueLabel }),
				...rhs.flatten(ifLabel),
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
		return expandAs.flatten(ifLabel);
	}
}

export class BoolUnit extends BoolExpression {}

export class BoolLiteral extends BoolUnit {
	mathlang: 'bool_literal';
	debug: MathlangLocation;
	args: GenericObj;
	value: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'bool_literal';
		this.value = ACTION.breakIfNotBool(args.value);
	}
	static quick(debug: MathlangLocation, value: boolean) {
		return new BoolLiteral(debug, { value });
	}
	invert() {
		this.value = !this.value;
		return this;
	}
}

export class BoolComparison extends BoolExpression {
	action: string;
	expected_bool: boolean;
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
	debug: MathlangLocation;
	args: GenericObj;
	lhs: BoolExpression;
	rhs: BoolExpression;
	op: string;
	lhsNode: TreeSitterNode;
	rhsNode: TreeSitterNode;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
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
		return new BoolBinaryExpression(this.debug, this.args);
	}
	invert() {
		if (this.op === '||' || this.op === '&&') {
			if (typeof this.lhs === 'number' || typeof this.rhs === 'number') {
				throw new Error('|| or && for a number??');
			}
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
	args: GenericObj;
	debug: MathlangLocation;
	comment?: string;
	expected_bool: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.mathlang = 'bool_getable';
		this.debug = debug;
		this.args = args;
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'string_checkable';
		this.expected_bool = true;
	}
	updateProp(_: string) {
		throw new Error(`Parent should not be trying to change its string property (value ${_})`);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
	}
	updateProp(value: string) {
		this.direction = value;
	}
	getProp() {
		return this.direction;
	}
	static quick(
		debug: MathlangLocation,
		entity: string,
		direction: string,
		provided_bool?: boolean,
	) {
		const expected_bool = provided_bool === undefined ? true : provided_bool;
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
	expected_bool: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_MAP';
		this.map = ACTION.breakIfNotString(args.map);
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		super();
		this.args = args;
		this.debug = debug;
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
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'number_checkable_equality';
	}
	updateProp(_: number) {
		throw new Error(`Parent should not be trying to change its number property (value ${_})`);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
	expected_bool: boolean;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super(debug, args);
		this.action = 'CHECK_ENTITY_CURRENT_FRAME';
		this.entity = ACTION.breakIfNotString(args.entity);
		this.expected_byte = ACTION.breakIfNotNumber(args.expected_byte);
		this.expected_bool = ACTION.breakIfNotBool(args.expected_bool);
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
	debug: MathlangLocation;
	args: GenericObj;
	type: string;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'bool_setable';
		this.value = ACTION.breakIfNotString(args.value);
		this.type = ACTION.breakIfNotString(args.type);
	}
	clone() {
		return new BoolSetable(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new BoolSetable(debug, { type, value });
	}
}
export class MovableIdentifier extends MathlangNode {
	mathlang: 'movable_identifier';
	debug: MathlangLocation;
	args: GenericObj;
	type: string;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'movable_identifier';
		this.value = ACTION.breakIfNotString(args.value);
		this.type = ACTION.breakIfNotString(args.type);
	}
	clone() {
		return new MovableIdentifier(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new MovableIdentifier(debug, { type, value });
	}
}
export class CoordinateIdentifier extends MathlangNode {
	mathlang: 'coordinate_identifier';
	debug: MathlangLocation;
	args: GenericObj;
	type: string;
	value: string;
	polygonType?: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'coordinate_identifier';
		this.value = ACTION.breakIfNotString(args.value);
		this.type = ACTION.breakIfNotString(args.type);
		if (args.polygonType) this.polygonType = ACTION.breakIfNotString(args.polygonType);
	}
	clone() {
		return new CoordinateIdentifier(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string, polygonType?: string) {
		return new CoordinateIdentifier(debug, { type, value, polygonType });
	}
}
export class DirectionTarget extends MathlangNode {
	mathlang: 'direction_target';
	debug: MathlangLocation;
	args: GenericObj;
	type: string;
	value: string;
	constructor(debug: MathlangLocation, args: GenericObj) {
		super();
		this.args = args;
		this.debug = debug;
		this.mathlang = 'direction_target';
		this.value = ACTION.breakIfNotString(args.value);
		this.type = ACTION.breakIfNotString(args.type);
	}
	clone() {
		return new DirectionTarget(this.debug, this.args);
	}
	static quick(debug: MathlangLocation, type: string, value: string) {
		return new DirectionTarget(debug, { type, value });
	}
}
// --------------------- Mathlang Nodes with labels --------------------- \\

export type NodeWithLabel = GotoLabel | ACTION.CheckAction;

export const doesNodeHaveLabelToChangeToIndex = (v: unknown): v is NodeWithLabel => {
	if (v instanceof GotoLabel && v.label) return true;
	if (v instanceof ACTION.CheckAction && v.label) return true;
	return false;
};
