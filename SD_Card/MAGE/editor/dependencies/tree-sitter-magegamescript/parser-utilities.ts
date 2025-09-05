import { Node as TreeSitterNode } from 'web-tree-sitter';
import { Action } from './parser-bytecode-info.ts';
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
} from './parser-types.ts';
import { FileState } from './parser-file.ts';
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
export const reportMissingChildNodes = (
	f: FileState,
	node: TreeSitterNode,
): (TreeSitterNode | null)[] => {
	const missingNodes = node.children
		.filter((v) => v !== null)
		.filter((child) => child?.isMissing);
	missingNodes.forEach((missingChild) => {
		f.quickWarning(missingChild, 'missing token', `expected token: ${missingChild.type}`);
	});
	return missingNodes;
};
export const reportErrorNodes = (f: FileState, node: TreeSitterNode): (TreeSitterNode | null)[] => {
	const errorNodes = node.children
		.filter((v) => v !== null)
		.filter((child) => child.type === 'ERROR');
	errorNodes.forEach((errorNode) => {
		f.quickError(errorNode, 'syntax error', '');
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

export const autoIdentifierName = (f: FileState, node: TreeSitterNode): string => {
	return f.fileName + '-' + node.startPosition.row + ':' + node.startPosition.column;
};

// ------------------------ SEQUENCES ------------------------ //

export const flattenNodes = (f: FileState, rawActions: AnyNode[]): AnyNode[] => {
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

export const flattenAndDoAutoReturn = (
	f: FileState,
	node: TreeSitterNode,
	origSteps: AnyNode[],
) => {
	const debug = MathlangLocation.quick(f, node);
	// flatten/incorporate any sequences
	const steps = flattenNodes(f, origSteps);
	// add auto return label at the end
	const label = 'end of script ' + f.p.advanceGotoSuffix();
	const fakeReturnNode = mandatoryLastChild(f, node);
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
	f: FileState,
	node: TreeSitterNode,
	condition: BoolExpression,
	trueBlock: AnyNode[],
	falseBlock: AnyNode[],
): MathlangSequence => {
	const debug = MathlangLocation.quick(f, node);
	const n = f.p.advanceGotoSuffix();
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
	return MathlangSequence.quick(debug, steps, 'simpleBranchMaker');
};

export class ConditionalBlock {
	condition: BoolExpression;
	conditionNode: TreeSitterNode;
	body: AnyNode[];
	bodyNode: TreeSitterNode;
	debug: MathlangLocation;
	// TODO: make constructor build from processed parts, and move this to its own method that processes it from the base node
	constructor(f: FileState, node: TreeSitterNode) {
		const debug = MathlangLocation.quick(f, node);
		this.conditionNode = mandatoryChildForField(f, node, 'condition');
		// TODO this should not be handled this way! make uniform
		// Find other cases, too? node handling should be done in one place so it can report errors
		let condition = handleCapture(f, this.conditionNode);
		if (typeof condition === 'string') condition = CheckSaveFlag.quick(debug, condition);
		this.condition = BoolExpression.coerce(condition);
		this.bodyNode = mandatoryChildForField(f, node, 'body');
		this.body = handleNamedChildren(f, this.bodyNode);
		this.debug = MathlangLocation.quick(f, node);
	}
}

export const ifChainMaker = (
	f: FileState,
	node: TreeSitterNode,
	iffs: ConditionalBlock[],
	elseBody: AnyNode[],
	label: string,
): MathlangSequence => {
	const debug = MathlangLocation.quick(f, node);
	const rendezvousL: string = label + ` rendezvous #${f.p.advanceGotoSuffix()}`;
	const steps: AnyNode[] = [];
	const bottomSteps: AnyNode[] = [];

	iffs.forEach((iff) => {
		const ifL = `if true #${f.p.advanceGotoSuffix()}`;
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
	steps.push(GotoLabel.quick(MathlangLocation.quick(f, node), rendezvousL));
	const combined = steps.concat(bottomSteps);
	combined.push(LabelDefinition.quick(debug, rendezvousL));
	return MathlangSequence.quick(debug, combined, `parser-node: ${label}`);
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
	const labelDefThenDifferentGotoLabel = {}; // Record<string, string>
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
