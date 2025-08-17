import { compareTexts } from './parser-tests.ts';

const getLabelRegistery = (lines: string[]): Record<string, number> => {
	const registry: Record<string, number> = {};
	lines.forEach((line, i) => {
		const labelMatch = line.trim().match(/^([^/]+):$/);
		if (labelMatch) {
			const label = labelMatch[1];
			if (registry[label] !== undefined) {
				throw new Error('label already registered: ' + label);
			}
			registry[label] = i;
		}
	});
	return registry;
};

type LineAnalysis = {
	type: LineAnalysisTypes;
	line: string;
	value: number | string;
};
type LineAnalysisTypes =
	| 'if-then-goto-script'
	| 'if-then-goto-label'
	| 'if-then-goto-index'
	| 'goto-script'
	| 'goto-label'
	| 'goto-index'
	| 'comment'
	| 'load-map'
	| 'label'
	| 'line';
const analyzeLine = (_line: string): LineAnalysis => {
	const line = _line.trim();
	// take off RHS comments
	const ifGotoScript = line.match(/(if.+then) goto( script)? "(.+)";$/);
	if (ifGotoScript) {
		return {
			type: 'if-then-goto-script',
			line: ifGotoScript[1],
			value: `goto script "${ifGotoScript[3]}";`,
		};
	}
	const ifGotoLabel = line.match(/(if.+then) goto label (.+);$/);
	if (ifGotoLabel) {
		return {
			type: 'if-then-goto-label',
			line: ifGotoLabel[1],
			value: ifGotoLabel[2],
		};
	}
	const ifGotoIndex = line.match(/(if.+then) goto index (\d+);$/);
	if (ifGotoIndex) {
		return {
			type: 'if-then-goto-index',
			line: ifGotoIndex[1],
			value: Number(ifGotoIndex[2]),
		};
	}
	const gotoScript = line.match(/goto script "(.+)";$/);
	if (gotoScript) {
		return {
			type: 'goto-script',
			line: 'goto script',
			value: gotoScript[1],
		};
	}
	const gotoLabel = line.match(/^goto label (.+);$/);
	if (gotoLabel) {
		return {
			type: 'goto-label',
			line: line,
			value: gotoLabel[1],
		};
	}
	const gotoIndex = line.match(/^goto index (\d+);$/);
	if (gotoIndex) {
		return {
			type: 'goto-index',
			line: 'goto',
			value: Number(gotoIndex[1]),
		};
	}
	const comment = line.match(/^\/\/\s*(.+)$/);
	if (comment) {
		return {
			type: 'comment',
			line: line,
			value: comment[1],
		};
	}
	const label = line.match(/^(.+?):$/);
	if (label) {
		return {
			type: 'label',
			line: line,
			value: label[1],
		};
	}
	const load = line.match(/^load map (.+);$/);
	if (load) {
		return {
			type: 'load-map',
			line: line,
			value: load[1],
		};
	}
	const sanitizedLine = line.replace(/(-|:)\d+:\d+";/, '-XX";');
	return {
		type: 'line',
		line: line,
		value: sanitizedLine,
	};
};

const calculateRejoins = (lines: string[], registry: Record<string, number>): Set<number> => {
	const rejoins: Set<number> = new Set();
	lines.forEach((line, i) => {
		const analysis = analyzeLine(line);
		if (analysis.type.startsWith('if-then-goto')) {
			if (lines[i + 1]) {
				rejoins.add(i + 1);
			}
		}
		if (analysis.type.endsWith('goto-index')) {
			rejoins.add(Number(analysis.value));
		} else if (analysis.type.endsWith('goto-label')) {
			rejoins.add(Number(registry[analysis.value]));
			// } else if (analysis.type === 'label') {
			// 	rejoins.add(i);
		}
	});
	return rejoins;
};

type AdventureSegment = {
	from: number;
	tos: number[];
	lines: string[];
	condition?: string;
};

type AdventureCrawlState = {
	lines: string[];
	froms: Record<string, AdventureSegment>;
	tos: Record<string, AdventureSegment[]>;
	seenStarts: Set<number>;
	labelRegistry: Record<string, number>;
	rejoins: Set<number>;
};

// ユウキリンリン　ゲンキハツラツ :P
const advanceAdventure = (
	lines: string[],
	from: number,
	cs: AdventureCrawlState,
): AdventureSegment[] => {
	let pos = from;
	const ret: AdventureSegment = {
		from,
		tos: [],
		lines: [],
	};
	const allSegments: AdventureSegment[] = [];
	while (pos < lines.length) {
		// if we hit a rejoin boundary, start new segment
		if (from !== pos && cs.rejoins.has(pos)) {
			ret.tos = [pos];
			break;
		}
		const analysis = analyzeLine(lines[pos]);
		if (analysis.type === 'comment' || analysis.type === 'label') {
			pos += 1;
			continue;
		}
		if (analysis.type === 'line') {
			ret.lines.push(analysis.line);
			pos += 1;
			continue;
		}
		if (analysis.type === 'goto-index') {
			pos = Number(analysis.value);
			continue;
		}
		if (analysis.type === 'goto-label') {
			pos = cs.labelRegistry[analysis.value];
			continue;
		}
		if (analysis.type === 'goto-script') {
			ret.lines.push(String(analysis.line));
			ret.tos = [lines.length];
			break;
		}
		if (analysis.type === 'load-map') {
			ret.lines.push(analysis.line);
			ret.tos = [lines.length];
			break;
		}
		if (analysis.type === 'if-then-goto-index') {
			const branchTo = Number(analysis.value);
			ret.lines.push(analysis.line);
			ret.tos = [pos + 1, branchTo];
			break;
		}
		if (analysis.type === 'if-then-goto-label') {
			const branchTo = cs.labelRegistry[analysis.value];
			ret.lines.push(analysis.line);
			ret.tos = [pos + 1, branchTo];
			break;
		}
		if (analysis.type === 'if-then-goto-script') {
			const branchTo = pos + 0.5;
			ret.lines.push(analysis.line);
			ret.tos = [pos + 1, branchTo];
			cs.seenStarts.add(branchTo);
			allSegments.push({
				from: branchTo,
				tos: [lines.length],
				lines: ['goto script'],
			});
			break;
		}
		console.log('BREAK');
	}
	if (pos >= lines.length) {
		ret.tos.push(lines.length);
	}
	allSegments.push(ret);
	return allSegments;
};

const startAdventure = (text: string): AdventureCrawlState => {
	const lines = text
		.split('\n')
		.map((v) => {
			return v.trim().replace(/[-:]\d+:\d+";$/, '-XX";');
		})
		.filter((v) => !v.startsWith('//'));
	if (lines[lines.length - 1] === '}') {
		lines.shift();
		lines.pop();
	}
	const queue = [0];
	const labelRegistry = getLabelRegistery(lines);
	const cs: AdventureCrawlState = {
		lines,
		froms: {},
		tos: {},
		seenStarts: new Set([0, lines.length]),
		labelRegistry: getLabelRegistery(lines),
		rejoins: calculateRejoins(lines, labelRegistry),
	};
	const segments: AdventureSegment[] = [];
	while (queue.length) {
		const curr = queue.shift();
		if (curr === undefined) throw new Error('adventure queue shift() failure');
		const newSegments = advanceAdventure(lines, curr, cs);
		newSegments.forEach((segment) => {
			segments.push(segment);
			segment.tos.forEach((to) => {
				if (!cs.seenStarts.has(to)) {
					cs.seenStarts.add(to);
					queue.push(to);
				}
			});
		});
	}
	segments.forEach((segment) => {
		cs.froms[segment.from] = segment;
		segment.tos.forEach((to) => {
			cs.tos[to] = cs.tos[to] || [];
			cs.tos[to].push(segment);
		});
	});
	return cs;
};

type FastForwardResult = {
	type: 'branch' | 'end';
	tos: number[];
	seen: string[];
	condition?: string;
};
const fastForward = (cs: AdventureCrawlState, start: number): FastForwardResult => {
	let pos = start;
	const seen: string[] = [];
	while (pos < cs.lines.length) {
		const curr = cs.froms[pos];
		seen.push(...curr.lines);
		if (curr.tos.length === 2) {
			return {
				type: 'branch',
				tos: curr.tos,
				seen,
				condition: seen.pop(),
			};
		} else {
			pos = curr.tos[0];
		}
	}
	return {
		type: 'end',
		tos: [],
		seen,
	};
};

const invertCondition = (condition: string): string => {
	const equals = condition.match(/^if (.+) == (.+) then$/);
	if (equals) {
		return `if ${equals[1]} != ${equals[2]} then`;
	}
	const bang = condition.match(/^if !(.+) then$/);
	if (bang) {
		return `if ${bang[1]} then`;
	}
	const plain = condition.match(/^if ([_a-zA-Z0-9]+) then$/);
	if (plain) {
		return `if !${plain[1]} then`;
	}
	const quotes = condition.match(/^if "(.+)" then$/);
	if (quotes) {
		return `if !"${quotes[1]}" then`;
	}
	const greaterThan = condition.match(/^if (.+) > (.+) then$/);
	if (greaterThan) {
		return `if ${greaterThan[1]} <= ${greaterThan[2]} then`;
	}
	const greaterThanEq = condition.match(/^if (.+) >= (.+) then$/);
	if (greaterThanEq) {
		return `if ${greaterThanEq[1]} < ${greaterThanEq[2]} then`;
	}
	const lessThan = condition.match(/^if (.+) < (.+) then$/);
	if (lessThan) {
		return `if ${lessThan[1]} >= ${lessThan[2]} then`;
	}
	const lessThanEq = condition.match(/^if (.+) <= (.+) then$/);
	if (lessThanEq) {
		return `if ${lessThanEq[1]} > ${lessThanEq[2]} then`;
	}
	const multiWordBool = condition.match(/^if (.+) then$/);
	if (multiWordBool) {
		return `if !${multiWordBool[1]} then`;
	}
	throw new Error('inversion not implemented for string: ' + condition);
};

// The "been to" Set is which crossroads you've touched.
// They don't necessarily have a result yet, so they
// should be kept separate from the result cache.
const compareFrom = (
	scriptName: string,
	oldCS: AdventureCrawlState,
	newCS: AdventureCrawlState,
	oldStart: number,
	newStart: number,
	oldCache: Record<string, boolean>,
	newCache: Record<string, boolean>,
	oldSeen: string[],
	newSeen: string[],
	oldBeenTo: Set<number>,
	newBeenTo: Set<number>,
): boolean => {
	// If either crossroad is known to be false beyond, hand it back up.
	if (oldCache[oldStart] === false) return false;
	if (newCache[newStart] === false) return false;

	// If both crossroads are known to be true beyond, hand it back up.
	if (oldCache[oldStart] === true && newCache[newStart]) return true;
	// Shouldn't have only one of them being true, but break just in case.
	if (oldCache[oldStart] === true) throw new Error('lopsided true');
	if (newCache[newStart] === true) throw new Error('lopsided true');

	// If these crossroad are ones we've touched before,
	// but there's no result yet, it's an infinite loop,
	// like in a `for` loop. This counts as a termination.
	if (oldBeenTo.has(oldStart) && newBeenTo.has(newStart)) {
		return true;
	}

	// We're officially evaluating these crossroads now.
	oldBeenTo.add(oldStart);
	newBeenTo.add(newStart);

	// Look ahead to the next crossroads.
	const oldFF: FastForwardResult = fastForward(oldCS, oldStart);
	const newFF: FastForwardResult = fastForward(newCS, newStart);
	// Add the next batch of actions to what we've seen.
	oldSeen.push(...oldFF.seen);
	newSeen.push(...newFF.seen);

	// If our collected actions don't match, it's false.
	const result = oldSeen.join('\n') === newSeen.join('\n');
	if (result === false) {
		oldCache[oldStart] = false;
		newCache[newStart] = false;
		const compared = compareTexts(
			oldSeen.join('\n'),
			newSeen.join('\n'),
			'',
			`script "${scriptName}"`,
		);
		console.log('\t' + compared.message);
		if (compared.lengthDiff) {
			console.log('\t' + compared.lengthDiff.join('\n'));
		} else {
			compared.lines?.forEach((line) => {
				console.log('\t' + line.diff.diff);
			});
		}
		return false;
	}

	// If the next crossroads' types don't match, it's false.
	if (oldFF.type !== newFF.type) {
		oldCache[oldStart] = false;
		newCache[newStart] = false;
		return false;
	}

	// If it's terminating here, we win.
	if (oldFF.type === 'end') {
		return true;
	}

	if (oldFF.condition === undefined) throw new Error('Condition missing in old branch');
	if (newFF.condition === undefined) throw new Error('Condition missing in new branch');
	if (oldFF.condition !== newFF.condition) {
		const newInverted = invertCondition(newFF.condition);
		if (oldFF.condition === newInverted) {
			newFF.tos.reverse();
			newFF.condition = newInverted;
		} else {
			return false;
		}
	}
	oldSeen.push(oldFF.condition);
	newSeen.push(newFF.condition);

	// Otherwise compare each branch now.
	const left = compareFrom(
		scriptName,
		oldCS,
		newCS,
		oldFF.tos[0],
		newFF.tos[0],
		oldCache,
		newCache,
		oldSeen,
		newSeen,
		oldBeenTo,
		newBeenTo,
	);
	const right = compareFrom(
		scriptName,
		oldCS,
		newCS,
		oldFF.tos[1],
		newFF.tos[1],
		oldCache,
		newCache,
		oldSeen,
		newSeen,
		oldBeenTo,
		newBeenTo,
	);
	// If they're both good, we're good.
	return left === true && right === true;
};

/*
const oldScriptText = `
	"rand" ?= 3;
	if "rand" == 2 then goto label bodyStart_ZIGZAG_4975;
	if "rand" == 1 then goto label bodyStart_ZIGZAG_5020;
	wait 4000ms;
	goto label LABEL_f5055;
	bodyStart_ZIGZAG_4975:
	wait 2000ms;
	goto label LABEL_f5055;
	bodyStart_ZIGZAG_5020:
	wait 3000ms;
	goto label LABEL_f5055;
	LABEL_f5055:
`;

const newScriptText = `
	"rand" ?= 3;
	if "rand" == 2 then goto label if_true_1322;
	if "rand" == 1 then goto label if_true_1323;
	wait 4000ms;
	goto label rendezvous_1321;
	if_true_1323:
	wait 3000ms;
	goto label rendezvous_1321;
	if_true_1322:
	wait 2000ms;
	rendezvous_1321:
	end_of_script_1324:
`;
const newScriptRegistry = {
	if_true_1323: 5,
	if_true_1322: 8,
	rendezvous_1321: 10,
	end_of_script_1324: 11,
};

const newScriptRejoins = new Set([0, 2, 3, 5, 8, 12]);

const newCS = startAdventure(newScriptText.trim().split('\n'));
const oldCS = startAdventure(oldScriptText.trim().split('\n'));
console.log(newCS);
console.log(oldCS);

const compared = compareFrom(oldCS, newCS, 0, 0, {}, {}, [], []);
console.log(compared);
*/
// const newScriptLines = [
// 	/*0*/ `"rand" ?= 3;`,
// 	/*1*/ `if "rand" == 2 then goto label if_true_1322;`,
// 	/*2*/ `if "rand" == 1 then goto label if_true_1323;`,
// 	/*3*/ `wait 4000ms;`,
// 	/*4*/ `goto label rendezvous_1321;`,
// 	/*5*/ `if_true_1323:`,
// 	/*6*/ `wait 3000ms;`,
// 	/*7*/ `goto label rendezvous_1321;`,
// 	/*8*/ `if_true_1322:`,
// 	/*9*/ `wait 2000ms;`,
// 	/*10*/ `rendezvous_1321:`,
// 	/*11*/ `end_of_script_1324:`,
// ];

export const compareNonlinearScripts = (
	oldText: string,
	newText: string,
	scriptName: string,
): boolean => {
	const oldCS = startAdventure(oldText);
	const newCS = startAdventure(newText);
	return compareFrom(scriptName, oldCS, newCS, 0, 0, {}, {}, [], [], new Set(), new Set());
};
