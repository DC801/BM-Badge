import { Node as TreeSitterNode } from 'web-tree-sitter';
import { Action } from './parser-bytecode-info.ts';
import {
	MathlangLocation,
	AnyNode,
	BoolBinaryExpression,
	BoolComparison,
	BoolExpression,
	MathlangMessage,
	LabelDefinition,
	MathlangSequence,
	GotoLabel,
	MathlangNode,
	CheckSaveFlag,
	BoolGetable,
} from './parser-types.ts';
import { FileState } from './parser-file.ts';
import { type FileMap } from './parser-project.ts';
import {
	handleCapture,
	handleNamedChildren,
	mandatoryChildForFieldName,
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
export const latestTemporary = (): string => temporaries[0];

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
		f.quickError(missingChild, `missing token: ${missingChild.type}`);
	});
	return missingNodes;
};
export const reportErrorNodes = (f: FileState, node: TreeSitterNode): (TreeSitterNode | null)[] => {
	const errorNodes = node.children
		.filter((v) => v !== null)
		.filter((child) => child.type === 'ERROR');
	errorNodes.forEach((errorNode) => {
		f.quickError(errorNode, 'syntax error');
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

// ------------------------ CONDITIONS ------------------------ //

export const simpleBranchMaker = (
	f: FileState,
	node: TreeSitterNode,
	condition: BoolExpression,
	trueBlock: AnyNode[],
	falseBlock: AnyNode[],
): MathlangSequence => {
	const debug = new MathlangLocation(f, node);
	const n = f.p.advanceGotoSuffix();
	const ifLabel = `if true #${n}`;
	const rendezvousLabel = `rendezvous #${n}`;

	let top: AnyNode[] = [];
	if (condition instanceof BoolComparison || condition instanceof BoolGetable) {
		top = [Action.fromArgs({ ...condition, label: ifLabel })];
	} else if (condition instanceof BoolBinaryExpression) {
		top = condition.flatten(ifLabel);
	}

	const steps = [
		...top,
		...falseBlock,
		GotoLabel.quick(debug, rendezvousLabel),
		LabelDefinition.quick(debug, ifLabel),
		...trueBlock,
		LabelDefinition.quick(debug, rendezvousLabel),
	];
	return new MathlangSequence(debug, {
		steps,
		type: 'longerBranchMaker',
	});
};

export class ConditionalBlock {
	condition: BoolExpression;
	conditionNode?: TreeSitterNode;
	body: AnyNode[];
	bodyNode?: TreeSitterNode;
	debug: MathlangLocation;
	constructor(f: FileState, node: TreeSitterNode, type: string) {
		const debug = new MathlangLocation(f, node);
		this.conditionNode = mandatoryChildForFieldName(f, node, 'condition');
		let condition = handleCapture(f, this.conditionNode);
		if (typeof condition === 'string') condition = CheckSaveFlag.quick(debug, condition);
		if (!(condition instanceof BoolExpression)) {
			throw new Error(type + ' condition not BoolExpression');
		}
		this.condition = condition;
		this.bodyNode = mandatoryChildForFieldName(f, node, 'body');
		this.body = handleNamedChildren(f, this.bodyNode);
		this.debug = new MathlangLocation(f, node);
	}
}

export const newElse = (f: FileState, elseNode: TreeSitterNode | null): AnyNode[] => {
	let elseBody: AnyNode[] = [];
	if (elseNode && elseNode.lastChild) {
		elseBody = handleNamedChildren(f, elseNode.lastChild);
	}
	return elseBody;
};

export const ifChainMaker = (
	f: FileState,
	node: TreeSitterNode,
	iffs: ConditionalBlock[],
	elseBody: AnyNode[],
	label: string,
): MathlangSequence => {
	const debug = new MathlangLocation(f, node);
	const rendezvousL: string = label + ` rendezvous #${f.p.advanceGotoSuffix()}`;
	const steps: AnyNode[] = [];
	let bottomSteps: AnyNode[] = [];

	iffs.forEach((iff) => {
		const ifL = `if true #${f.p.advanceGotoSuffix()}`;
		// add top half
		steps.push(...iff.condition.flatten(ifL));
		// add bottom half
		const bottomInsert: AnyNode[] = [
			new LabelDefinition(debug, { label: ifL }),
			...iff.body,
			GotoLabel.quick(new MathlangLocation(f, iff.bodyNode || iff.debug.node), rendezvousL),
		];
		bottomSteps = bottomInsert.concat(bottomSteps);
	});

	steps.push(...elseBody);
	steps.push(GotoLabel.quick(new MathlangLocation(f, node), rendezvousL));
	const combined = steps.concat(bottomSteps);
	combined.push(LabelDefinition.quick(debug, rendezvousL));
	return new MathlangSequence(debug, { steps: combined, type: 'parser-node: ' + label });
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
