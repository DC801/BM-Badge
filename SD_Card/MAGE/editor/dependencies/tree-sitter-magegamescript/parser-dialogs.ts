import { Node as TreeSitterNode } from 'web-tree-sitter';
import { ansiTags as ansi } from './parser-utilities.ts';
import { FileState } from './parser-file.ts';
import {
	Dialog,
	SerialDialog,
	type DialogInfo,
	type DialogSettings,
	type SerialDialogInfo,
	type SerialDialogSettings,
	DialogOption,
	MathlangLocation,
} from './parser-types.ts';

const DIALOG_WRAP = 42;
const SERIAL_DIALOG_WRAP = 80;

// Linux-sempai says use only red, or red and cyan, and don't use the others; you have no idea whether they're using a dark or light theme, or what their theme is like and some colors WILL NOT show up, depending.

const tagsToAnsiEscapes = (str: string): string => {
	let ret = str;
	Object.entries(ansi).forEach(([k, v]) => {
		// TODO: what if you want to actually print <r>?
		// Do this again but ignoring escaped chars
		const reg = new RegExp(`<${k}>`, 'g');
		ret = ret.replace(reg, v);
	});
	return ret;
};

const countCharLength = (str: string): number => {
	let length = 0;
	let remainder = str;
	while (remainder.length) {
		const percents = remainder.match(/^%.*%/); // entity name
		if (percents) {
			length += 12;
			remainder = remainder.slice(percents[0].length);
			continue;
		}
		const dollars = remainder.match(/^\$.*\$/); // variable (int) value
		if (dollars) {
			length += 5;
			remainder = remainder.slice(dollars[0].length);
			continue;
		}
		const esc = remainder.match(/^\\./);
		if (esc) {
			length += 1;
			remainder = remainder.slice(2);
			continue;
		}
		const ansi = remainder.match(/^\u001B\[\d+m/);
		if (ansi) {
			length += 0;
			remainder = remainder.slice(ansi[0].length);
			continue;
		}
		// TODO: maybe don't do this part; probably slow
		const canPrint = remainder.match(/^[-!"#$%&'()*+,./0-9:;<>=?@A-Z\[\]\\^_`a-z{}|~]+/);
		if (canPrint) {
			length += 1;
			remainder = remainder.slice(1);
			continue;
		}
		length += 0;
		remainder = remainder.slice(1);
	}
	return length;
};

const wrapText = (origStr: string, wrap: number, doAnsiWrapBodge: boolean = false): string => {
	// todo: hyphenated words?
	let str = origStr
		.replace(/\\n/g, '\n')
		.replace(/\\t/g, '\t')
		.replace(/\\"/g, '\"')
		.replace(/\\\\/g, '\\')
		.replace(/[“”]/g, '"')
		.replace(/[‘’]/g, "'")
		.replace(/…/g, '...')
		.replace(/—/g, '--') // emdash
		.replace(/–/g, '-'); // endash
	if (wrap === 0) {
		return str;
	} else {
		str = str.replace(/\t/g, '    ');
	}
	const result: string[] = [];
	str.split('\n').forEach((line) => {
		const chunkRegExp = new RegExp(/(?<spaces>[ ]*|^)(?<word>[^ ]+|$)/g);
		let insert = '';
		let insertLength = 0;
		let chunk = chunkRegExp.exec(line);
		while (chunk?.[0] !== '') {
			if (!chunk) break;
			const spaces = chunk.groups?.spaces;
			const word = chunk.groups?.word;
			if (spaces === undefined || word === undefined) {
				throw new Error('empty text wrap segment in: ' + line);
			}
			const spacesLength = spaces.length;
			const wordLength = countCharLength(word);
			const potentialLength = insertLength + wordLength + spacesLength;
			if (potentialLength <= wrap || insert === '') {
				insert += spaces + word;
				insertLength += wordLength + spacesLength;
			} else {
				result.push(insert);
				insertLength = wordLength;
				insert = word;
			}
			chunk = chunkRegExp.exec(line);
		}
		result.push(insert);
	});
	const bodged = doAnsiWrapBodge ? ansiWrapBodge(result) : result;
	return bodged.join('\n');
};

// This is for the web build, which does not carry over ansi styles when things are wrapped
const ansiWrapBodge = (arr: string[]): string[] => {
	let wrappedTags = new Set();
	const bodged = arr.map((line) => {
		const prevTags = wrappedTags.size ? [...wrappedTags].join('') : '';
		let pos = 0;
		while (pos < line.length) {
			if (line[pos] !== '\u001B') {
				pos += 1;
				continue;
			}
			if (line.slice(pos + 1).startsWith('[0m')) {
				wrappedTags = new Set();
				pos += 4;
				continue;
			}
			const suffix = line.slice(pos + 1).match(/\[\d+m/);
			if (suffix) {
				const tag = line[pos] + suffix;
				wrappedTags.add(tag);
				pos += tag.length;
				continue;
			}
			pos += 1;
		}
		return prevTags + line;
	});
	return bodged;
};

export const buildSerialDialogFromInfo = (
	f: FileState,
	node: TreeSitterNode,
	info: SerialDialogInfo,
): SerialDialog => {
	const serialDialogSettings: SerialDialogSettings = {
		wrap: SERIAL_DIALOG_WRAP,
		...(f.settings.serial || {}), // global settings
		...info.settings, // local settings
	};
	const serialDialog: Record<string, unknown> = {
		messages: [],
	};
	serialDialog.messages = info.messages
		.map(tagsToAnsiEscapes)
		.map((message: string) => wrapText(message, serialDialogSettings.wrap as number, true));
	if (info.options.length > 0) {
		const firstOptionType = info.options[0].optionType;
		serialDialog[firstOptionType] = info.options;
		const warnNodes: MathlangLocation[] = [];
		info.options.forEach((option) => {
			if (option.optionType === 'options') {
				option.label = tagsToAnsiEscapes(option.label);
			}
			option.label = wrapText(option.label, serialDialogSettings.wrap || SERIAL_DIALOG_WRAP);
			if (option.optionType !== firstOptionType) {
				const node = option.debug.node.firstChild;
				if (!node) throw new Error('serial dialog had no first option node');
				warnNodes.push({ node, fileName: f.fileName });
			}
		});
		if (warnNodes.length > 0) {
			f.p.newWarning({
				locations: warnNodes,
				message: `serial dialog option types mismatch; first type (${firstOptionType}) will be used`,
			});
		}
	}
	return new SerialDialog(new MathlangLocation(f, node), serialDialog);
};

const longerAlignments: Record<string, string> = {
	BL: 'BOTTOM_LEFT',
	TL: 'TOP_LEFT',
	BR: 'BOTTOM_RIGHT',
	TR: 'TOP_RIGHT',
};

export const buildDialogFromInfo = (
	f: FileState,
	node: TreeSitterNode,
	info: DialogInfo,
	messageNodes: (TreeSitterNode | null)[],
): Dialog => {
	const ident = info.identifier;
	let found = false;
	let specificSettings: DialogSettings = {};
	if (ident.type === 'label') {
		const settingsLookup = f.settings.label[ident.value];
		if (settingsLookup) {
			specificSettings = settingsLookup;
		} else {
			specificSettings = {
				...f.settings.entity[ident.value],
				entity: ident.value,
			};
		}
		found = true;
	} else if (ident.type === 'name') {
		specificSettings.name = ident.value;
		found = true;
	}
	if (!found || ident.type === 'entity') {
		specificSettings = f.settings.entity[ident.value] || {};
		specificSettings.entity = ident.value;
	}
	const dialogSettings = {
		wrap: DIALOG_WRAP,
		alignment: 'BOTTOM_LEFT',
		...f.settings.default, // global default settings
		...specificSettings, // global specific settings
		...info.settings, // local specific settings
	};
	const expandedAbbreviation = longerAlignments[dialogSettings.alignment];
	if (expandedAbbreviation) {
		dialogSettings.alignment = expandedAbbreviation;
	}
	const dialog = {
		...dialogSettings,
		mathlang: 'dialog',
		messages: [],
		options: [],
	};
	let options: DialogOption[] = [];
	// this needs to be outside to get the actual wrap value btw:
	const messages = info.messages.map((message: string) => wrapText(message, dialogSettings.wrap));
	if (info.options.length > 0) {
		options = info.options;
		options.forEach((option, i) => {
			if (options?.[i]) {
				options[i].label = wrapText(option.label, 0);
			}
		});
	}
	const lastIndex = messages.length - 1;
	messages.forEach((message, i) => {
		const targetSize = lastIndex === i && dialog.options.length > 0 ? 1 : 5;
		const splitMessage: string[] = message.split('\n');
		if (splitMessage.length > targetSize) {
			let warningMessage = `dialog messages longer than 5 lines will wrap off the bottom`;
			if (lastIndex === i && dialog.options) {
				warningMessage = `messages before dialog options will collide if more than 1 line`;
			}
			if (!messageNodes[i]) throw new Error('no associated node for message at index' + i);
			f.p.newWarning({
				locations: [{ node: messageNodes[i], fileName: f.fileName }],
				message: warningMessage,
				footer:
					`When wrapped:\n` +
					splitMessage
						.map((v, i, arr) => {
							let row: number | string = i + 1;
							if (arr.length > 9) {
								row = row < 10 ? '0' + row : row;
							}
							let ret = `${row}> ${v}`;
							if (i >= targetSize) {
								ret = ansi.r + `(x) ` + ret + ansi.reset;
							} else {
								ret = `    ` + ret;
							}
							return ret;
						})
						.join('\n'),
			});
		}
	});
	return new Dialog(new MathlangLocation(f, node), {
		messages,
		options,
		settings: dialogSettings,
	});
};
