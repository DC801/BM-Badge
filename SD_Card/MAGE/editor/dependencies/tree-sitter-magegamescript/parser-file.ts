import { Node as TreeSitterNode } from 'web-tree-sitter';
import { ProjectState } from './parser-project.ts';
import {
	type DialogSettings,
	MathlangMessage,
	type SerialDialogSettings,
	AnyNode,
	type MGSPrimitive,
	MathlangLocation,
	FunctionDefinition,
	ConstantDefinition,
	type MathlangMessageType,
} from './parser-types.ts';
import { ansiTags as ansi } from './parser-utilities.ts';

type Constant = {
	value: MGSPrimitive;
	debug: MathlangLocation;
};
export type FunctionStackEntry = Record<string, ConstantDefinition>;
export type FileStateDialogSettings = {
		default: DialogSettings;
		entity: Record<string, DialogSettings>;
		label: Record<string, DialogSettings>;
		serial: SerialDialogSettings;
	};
export type FileStateDialogSettingsKeys = keyof FileStateDialogSettings;
export class FileState {
	p: ProjectState;
	fileName: string;
	constants: Record<string, Constant>;
	functions: Record<string, FunctionDefinition>;
	currFunction: FunctionStackEntry[];
	undefinedFunctions: Set<string>;
	settings: FileStateDialogSettings;
	nodes: AnyNode[];
	errorCount: number;
	warningCount: number;
	constructor(p: ProjectState, fileName: string) {
		// file crawl state
		this.p = p;
		this.fileName = fileName;

		// compile-time constants,
		// substituted for their registered token value as they are encounted
		this.constants = {};

		// similar, but for copy-and-paste macros (inline functions)
		this.functions = {};
		this.currFunction = [];
		this.undefinedFunctions = new Set();

		// dialog and serial dialog settings, applied to the (s)dialogs as we go
		this.settings = {
			default: {},
			entity: {},
			label: {},
			serial: {},
		};

		// root level nodes, e.g. script definitions, settings definitions
		this.nodes = [];

		// local error/warning counts
		this.errorCount = 0;
		this.warningCount = 0;
	}
	quickError(node: TreeSitterNode, type: MathlangMessageType, message: string, footer?: string) {
		const err = new MathlangMessage(
			[MathlangLocation.quick(this, node)],
			type || 'generic error',
			message,
		);
		if (footer) {
			err.footer = footer;
		}
		this.p.newError(err);
		this.errorCount += 1;
	}
	newError(message: MathlangMessage) {
		this.p.newError(message);
		this.errorCount += 1;
	}
	quickWarning(
		node: TreeSitterNode,
		type: MathlangMessageType,
		message: string,
		footer?: string,
	) {
		const warn = new MathlangMessage(
			[MathlangLocation.quick(this, node)],
			type || 'generic error',
			message,
		);
		if (footer) {
			warn.footer = footer;
		}
		this.p.newWarning(warn);
		this.warningCount += 1;
	}
	newWarning(message: MathlangMessage) {
		this.p.newWarning(message);
		this.warningCount += 1;
	}

	// print the file's parse status
	printableMessageInformation() {
		if (this.errorCount === 0 && this.warningCount === 0) {
			return `(${ansi.green}OK${ansi.reset})`;
		}
		const errMessage = this.errorCount
			? `${ansi.red}${this.errorCount} error${this.errorCount === 1 ? '' : 's'}${ansi.reset}`
			: `0 errors`;
		const warnMessage = this.warningCount
			? `${ansi.yellow}${this.warningCount} warning${this.warningCount === 1 ? '' : 's'}${ansi.reset}`
			: `0 warnings`;
		const ret = [errMessage, warnMessage].join(', ');
		return `(${ret})`;
	}
}
