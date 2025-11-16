import { Node as TreeSitterNode } from 'web-tree-sitter';
import {
	Action,
	CheckAction,
	COPY_SCRIPT,
	REGISTER_SERIAL_DIALOG_COMMAND,
	REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT,
	RUN_SCRIPT,
	ActionSetScript,
} from './parser-bytecode-info.ts';
import {
	MathlangLocation,
	AnyNode,
	BoolExpression,
	MathlangMessage,
	LabelDefinition,
	MathlangSequence,
	GotoLabel,
	MathlangNode,
	CheckSaveFlag,
	FnCallReturnValue,
	BoolComparisonSequence,
	JSONLiteral,
	ReturnStatement,
	ContinueStatement,
	BreakStatement,
	FnCall,
	ScriptDefinition,
	CopyMacro,
	DialogDefinition,
	SerialDialogDefinition,
} from './parser-types.ts';
import { type FileMap } from './parser-project.ts';
import {
	handleCapture,
	handleNamedChildren,
	mandatoryChildForField,
	mandatoryLastChild,
} from './parser-capture.ts';

export const verbose = false;
export const debugLog = (message: string) => {
	if (verbose) console.log(message);
};
export const ansiTags: Record<string, string> = {
	// styles
	bold: '\u001B[1m', // aka bright
	dim: '\u001B[2m', // aka dim
	'/': '\u001B[0m',
	reset: '\u001B[0m', // reset all styles
	// fg colors
	k: '\u001B[30m',
	black: '\u001B[30m',
	r: '\u001B[31m',
	red: '\u001B[31m',
	g: '\u001B[32m',
	green: '\u001B[32m',
	y: '\u001B[33m',
	yellow: '\u001B[33m',
	b: '\u001B[34m',
	blue: '\u001B[34m',
	m: '\u001B[35m',
	magenta: '\u001B[35m',
	c: '\u001B[36m',
	cyan: '\u001B[36m',
	w: '\u001B[37m',
	white: '\u001B[37m',
	// bg colors
	'bg-k': '\u001B[40m',
	'bg-black': '\u001B[40m',
	'bg-r': '\u001B[41m',
	'bg-red': '\u001B[41m',
	'bg-g': '\u001B[42m',
	'bg-green': '\u001B[42m',
	'bg-y': '\u001B[43m',
	'bg-yellow': '\u001B[43m',
	'bg-b': '\u001B[44m',
	'bg-blue': '\u001B[44m',
	'bg-m': '\u001B[45m',
	'bg-magenta': '\u001B[45m',
	'bg-c': '\u001B[46m',
	'bg-cyan': '\u001B[46m',
	'bg-w': '\u001B[47m',
	'bg-white': '\u001B[47m',
	// non-color-related
	bell: '',
};

// ------------------------ PRINTING ------------------------ //

export const printAction = (v: AnyNode): string => {
	if (v instanceof Action) return v.print();
	if (v instanceof MathlangNode) return v.print();
	throw new Error('unhandled print case');
};

export const printScript = (scriptName: string, actions: AnyNode[]): string => {
	const printedActions = actions
		.map(printAction)
		.filter((v) => v !== undefined)
		.map((v) => {
			return v
				.split('\n')
				.map((v) => `\t${v}`)
				.join('\n');
		});
	const ret = [`"${scriptName}" {`, ...printedActions, '}'];
	return ret.join('\n');
};

// ------------------------ TEMPORARY VARIABLE MANAGEMENT ------------------------ //

const TEMP = '__TEMP_';
const temporaries: string[] = [];
let temporaryStep = 0;
export const newTemporary = (value?: string): string => {
	if (temporaries.length === 0 && value !== undefined) {
		temporaries.unshift(value);
	} else {
		temporaries.unshift(TEMP + temporaryStep);
		temporaryStep += 1;
	}
	return temporaries[0] || '';
};
export const dropTemporary = (): string => {
	temporaryStep -= 1;
	temporaryStep = temporaryStep < 0 ? 0 : temporaryStep;
	return temporaries.shift() || '';
};
export const quickTemporary = (): string => {
	newTemporary();
	return dropTemporary();
};

// Not the count as such, but just the current suffix
export const temporaryCount = (): number => temporaryStep;
export const realignTemp = (temp: string) => {
	const oldTemp = parseInt(temp.replace(TEMP, ''));
	const newTemp = temporaryStep + oldTemp;
	return TEMP + newTemp;
};

export const RETURN = '__RETURN_';

// ------------------------ GENERIC ------------------------ //

export const inverseOpMap: Record<string, string> = {
	'<': '>=',
	'<=': '>',
	'>=': '<',
	'>': '<=',
	'==': '!=',
	'!=': '==',
	'&&': '||',
	'||': '&&',
};
export const reportMissingChildNodes = (debug: MathlangLocation): TreeSitterNode[] => {
	const missingNodes = debug.node.children
		.filter((v) => v !== null)
		.filter((child) => child?.isMissing);
	missingNodes.forEach((missingChild) => {
		debugLog('Missing child found: ' + missingChild.text);
		debug
			.using(missingChild)
			.quickWarning('missing token', `expected token: ${missingChild.type}`);
	});
	return missingNodes;
};
export const reportErrorNodes = (debug: MathlangLocation): TreeSitterNode[] => {
	const errorNodes = debug.node.children
		.filter((v) => v !== null)
		.filter((child) => child.type === 'ERROR');
	errorNodes.forEach((errorNode) => {
		debugLog('Error child found: ' + errorNode.text);
		debug.using(errorNode).quickError('syntax error', 'unknown tree-sitter parse error');
	});
	return errorNodes;
};

const printableLocation = (fileMap: FileMap, location: MathlangLocation): string => {
	const fileName = location.fileName || '';
	const fileText = fileMap[fileName].fileText;
	const allLines = fileText.split('\n');
	const row = location.node.startPosition.row;
	const col = location.node.startPosition.column;
	const endRow = location.node.endPosition.row;
	const endCol = location.node.endPosition.column;
	const line = allLines[row].replace(/\t/g, ' ');
	const squigglySize = row === endRow ? endCol - col : allLines[row].length - col;
	const arrow = '~'.repeat(col) + '^'.repeat(squigglySize);
	const message = `╓-${fileName} ${row}:${col}\n` + '║ ' + `${line}\n` + '╙~' + arrow;
	return message;
};

export const printableMessage = (fileMap: FileMap, prefix: string, v: MathlangMessage): string => {
	let message =
		`${prefix}: ${v.message}\n` +
		v.locations
			.map((location) => {
				return printableLocation(fileMap, location);
			})
			.join('\n');
	if (v.footer) {
		message += '\n' + v.footer;
	}
	return message + '\n';
};

export const autoIdentifierName = (debug: MathlangLocation): string => {
	return (
		debug.fileName + '-' + debug.node.startPosition.row + ':' + debug.node.startPosition.column
	);
};

// ------------------------ SEQUENCES ------------------------ //

export const flattenNodes = (rawActions: AnyNode[]): AnyNode[] => {
	const actions: AnyNode[] = [];
	rawActions.forEach((raw) => {
		if (raw instanceof FnCall) {
			const baked = raw.bake();
			baked.steps.forEach((step) => actions.push(step));
		} else if (
			raw instanceof MathlangSequence ||
			raw instanceof BoolComparisonSequence ||
			raw instanceof FnCallReturnValue
		) {
			raw.steps.forEach((step) => actions.push(step));
		} else if (raw instanceof JSONLiteral) {
			raw.json.forEach((v) => {
				actions.push(v);
			});
		} else {
			actions.push(raw);
		}
	});
	return actions;
};

export const flattenAndDoAutoReturn = (debug: MathlangLocation, origSteps: AnyNode[]) => {
	// flatten/incorporate any sequences
	const steps = flattenNodes(origSteps);
	// add auto return label at the end
	const label = 'end of script ' + debug.f.p.advanceGotoSuffix();
	const fakeReturnNode = mandatoryLastChild(debug);
	const autoReturnLabelDefinition = LabelDefinition.quick(debug.using(fakeReturnNode), label);
	steps.push(autoReturnLabelDefinition);

	// change all return statements to goto labels for the "auto return" label
	steps.forEach((action, i) => {
		if (action instanceof ReturnStatement) {
			const labelDebug = debug.using(action.debug.node);
			steps[i] = GotoLabel.quick(labelDebug, label);
		}
	});
	return steps;
};

export const doAutoBreakContinue = (steps: AnyNode[], continueL: string, breakL: string) => {
	return steps.map((v) => {
		if (v instanceof ContinueStatement) return GotoLabel.quick(v.debug, continueL);
		if (v instanceof BreakStatement) return GotoLabel.quick(v.debug, breakL);
		return v;
	});
};

// ------------------------ CONDITIONS ------------------------ //

export const simpleBranchMaker = (
	debug: MathlangLocation,
	condition: BoolExpression,
	trueBlock: AnyNode[],
	falseBlock: AnyNode[],
): AnyNode[] => {
	const n = debug.f.p.advanceGotoSuffix();
	const ifLabel = `if true #${n}`;
	const rendezvousLabel = `rendezvous #${n}`;
	const steps = [
		...condition.toSteps(ifLabel),
		...falseBlock,
		GotoLabel.quick(debug, rendezvousLabel),
		LabelDefinition.quick(debug, ifLabel),
		...trueBlock,
		LabelDefinition.quick(debug, rendezvousLabel),
	];
	return steps;
};

export class ConditionalBlock {
	condition: BoolExpression;
	conditionNode: TreeSitterNode;
	body: AnyNode[];
	bodyNode: TreeSitterNode;
	debug: MathlangLocation;
	// TODO: make constructor build from processed parts, and move this to its own method that processes it from the base node
	constructor(debug: MathlangLocation) {
		this.debug = debug;
		this.conditionNode = mandatoryChildForField(debug, 'condition');
		// TODO this should not be handled this way! make uniform
		// Find other cases, too? node handling should be done in one place so it can report errors
		// ^^ IDK what these comments mean, but prob this should be on some class instead of here
		let condition = handleCapture(debug.using(this.conditionNode));
		if (typeof condition === 'string') condition = CheckSaveFlag.quick(debug, condition);
		this.condition = BoolExpression.breakIfNot(condition);
		this.bodyNode = mandatoryChildForField(debug, 'body');
		this.body = handleNamedChildren(debug.using(this.bodyNode));
	}
}

export const ifChainMaker = (
	debug: MathlangLocation,
	iffs: ConditionalBlock[],
	elseBody: AnyNode[],
	label: string,
): AnyNode[] => {
	const rendezvousL: string = label + ` rendezvous #${debug.f.p.advanceGotoSuffix()}`;
	const steps: AnyNode[] = [];
	const bottomSteps: AnyNode[] = [];

	iffs.forEach((iff) => {
		const ifL = `if true #${debug.f.p.advanceGotoSuffix()}`;
		// add top half
		steps.push(...iff.condition.toSteps(ifL));
		// add bottom half
		const bottomInsert: AnyNode[] = [
			LabelDefinition.quick(debug, ifL),
			...iff.body,
			GotoLabel.quick(debug.using(iff.bodyNode), rendezvousL),
		];
		bottomSteps.unshift(...bottomInsert);
	});

	steps.push(...elseBody);
	steps.push(GotoLabel.quick(debug, rendezvousL));
	const combined = steps.concat(bottomSteps);
	combined.push(LabelDefinition.quick(debug, rendezvousL));
	return combined;
};

export const simplifyLabelGotos = (actions: AnyNode[]): AnyNode[] => {
	// A goto label followed by the same label definition can be removed
	for (let i = 0; i < actions.length; i++) {
		const action = actions[i];
		const next = actions[i + 1];
		if (
			action instanceof GotoLabel &&
			next instanceof LabelDefinition &&
			next.label === action.label
		) {
			actions.splice(i, 1);
			// can jump over the next one (no need to i--) because it's not being handled now
			// You don't need to do remove the label, even for those with zero uses,
			// because labels are going to be removed anyway
		}
	}

	// If a label definition is followed by a goto for a different label,
	// then the previous label registration can be replaced with following goto value
	const labelDefThenDifferentGotoLabel: Record<string, string> = {};
	actions.forEach((action: AnyNode, i: number) => {
		if (action instanceof LabelDefinition) {
			const next = actions[i + 1];
			if (next instanceof GotoLabel) {
				labelDefThenDifferentGotoLabel[action.label] = next.label;
			}
		}
	});
	actions.forEach((action: AnyNode) => {
		if (action instanceof GotoLabel) {
			const alias = labelDefThenDifferentGotoLabel[action.label];
			if (alias) {
				action.label = alias;
			}
		}
	});
	return actions;
};

export const updateScriptName = (v: AnyNode, oldName: string, newName: string) => {
	if (v instanceof ScriptDefinition) {
		if (v.scriptName === oldName) {
			v.scriptName = newName;
		}
	}
	if (v instanceof CheckAction) {
		if (v.getScript() === oldName) {
			v.setScript(newName);
		}
	} else if (
		v instanceof CopyMacro ||
		v instanceof COPY_SCRIPT ||
		v instanceof RUN_SCRIPT ||
		v instanceof REGISTER_SERIAL_DIALOG_COMMAND ||
		v instanceof REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT ||
		v instanceof ActionSetScript
	) {
		if (v.script === oldName) {
			v.script = newName;
		}
	} else if (v instanceof DialogDefinition) {
		v.dialogs.forEach((dialog) => {
			(dialog.options || []).forEach((option) => {
				if (option.script === oldName) {
					option.script = newName;
				}
			});
		});
	} else if (v instanceof SerialDialogDefinition) {
		(v.serialDialog.options || []).forEach((option) => {
			if (option.script === oldName) {
				option.script = newName;
			}
		});
	}
};
