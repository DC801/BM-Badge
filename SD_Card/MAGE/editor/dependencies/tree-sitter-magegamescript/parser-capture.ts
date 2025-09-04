import { Node as TreeSitterNode } from 'web-tree-sitter';
import { BoolGetableAction, StringCheckableAction } from './parser-bytecode-info.ts';
import {
	MathlangLocation,
	BoolBinaryExpression,
	BoolExpression,
	BoolSetable,
	CoordinateIdentifier,
	DialogIdentifier,
	DialogParameter,
	IntBinaryExpression,
	MovableIdentifier,
	SerialDialogParameter,
	AnyNode,
	DirectionTarget,
	BoolLiteral,
	CheckSaveFlag,
	CheckDebugMode,
	CheckEntityGlitched,
	CheckIfEntityIsInGeometry,
	CheckDialogOpen,
	CheckSerialDialogOpen,
	CheckForButtonPress,
	CheckForButtonState,
	CheckWarpState,
	CheckEntityTickScript,
	CheckEntityLookScript,
	CheckEntityType,
	CheckEntityPath,
	CheckEntityName,
	CheckEntityInteractScript,
	CheckVariables,
	CheckVariable,
	CheckEntityDirection,
	StringCheckable,
	EntityIntField,
	IntExpression,
	IntUnit,
	RNGSingle,
	RNGPair,
	BoolComparisonSequence,
	MathlangMessage,
	FnCallReturnValue,
	MathlangSequence,
	ScriptDefinition,
} from './parser-types.ts';
import {
	debugLog,
	reportMissingChildNodes,
	reportErrorNodes,
	inverseOpMap,
	newTemporary,
	dropTemporary,
	flattenNodes,
	autoIdentifierName,
} from './parser-utilities.ts';
import { FileState } from './parser-file.ts';
import { handleNode } from './parser-node.ts';

export type Capture = number | string | AnyNode;

// TODO: remove null from node here
export const handleCapture = (f: FileState, node: TreeSitterNode | null): Capture | Capture[] => {
	if (!node) throw new Error('null node');
	const grammarType = node.grammarType;
	debugLog(`-->> Capturing: ${grammarType}`);
	if (grammarType.endsWith('_expansion')) {
		// fwiw, cannot become recursive according to the grammar (1 level deep only)
		return namedChildren(f, node)
			.filter((v) => v !== null)
			.map((v) => handleCapture(f, v))
			.flat();
	}
	// swap out values of compile-time constants
	if (grammarType === 'CONSTANT') {
		const lookup = f.currFunction[0]?.[node.text] || f.constants[node.text];
		if (lookup === undefined) {
			f.quickError(node, 'undefined constant', `constant ${node.text} is undefined`);
		}
		return lookup?.value !== undefined ? lookup?.value : node.text;
	}
	// do the thing
	const fn = captureFns[grammarType];
	if (!fn) throw new Error(`no function found for grammar type ${grammarType}`);
	return fn(f, node);
};

const captureFns = {
	BOOL: (f: FileState, node: TreeSitterNode): BoolLiteral => {
		const debug = MathlangLocation.quick(f, node);
		const text = node.text;
		if (text === 'true') return BoolLiteral.quick(debug, true);
		if (text === 'false') return BoolLiteral.quick(debug, false);
		if (text === 'on') return BoolLiteral.quick(debug, true);
		if (text === 'off') return BoolLiteral.quick(debug, false);
		if (text === 'open') return BoolLiteral.quick(debug, true);
		if (text === 'closed') return BoolLiteral.quick(debug, false);
		if (text === 'down') return BoolLiteral.quick(debug, true);
		if (text === 'up') return BoolLiteral.quick(debug, false);
		throw new Error('bool capture text not one of the mathlang bools');
	},
	BAREWORD: (f: FileState, node: TreeSitterNode): string => node.text,
	QUOTED_STRING: (f: FileState, node: TreeSitterNode): string => node.text.slice(1, -1),
	NUMBER: (f: FileState, node: TreeSitterNode): number => Number(node.text),
	DURATION: (f: FileState, node: TreeSitterNode): number => {
		const suffix = optionalTextForField(f, node, 'suffix');
		const int = textForField(f, node, 'NUMBER');
		let n = parseInt(int);
		if (suffix === 's') n *= 1000;
		return n;
	},
	DISTANCE: (f: FileState, node: TreeSitterNode): number => parseInt(node.text),
	QUANTITY: (f: FileState, node: TreeSitterNode): number => {
		if (node.childCount === 0) {
			if (node.text === 'once') return 1;
			if (node.text === 'twice') return 2;
			if (node.text === 'thrice') return 3;
		}
		const int = textForField(f, node, 'NUMBER');
		const n = parseInt(int);
		return n;
	},
	COLOR: (f: FileState, node: TreeSitterNode): string => {
		if (node.childCount === 0) {
			if (node.text === 'white') return '#FFFFFF';
			if (node.text === 'black') return '#000000';
			if (node.text === 'red') return '#FF0000';
			if (node.text === 'green') return '#00FF00';
			if (node.text === 'blue') return '#0000FF';
			if (node.text === 'magenta') return '#FF00FF';
			if (node.text === 'cyan') return '#00FFFF';
			if (node.text === 'yellow') return '#FFFF00';
		}
		if (node.text.length === 4) {
			const a = node.text[1];
			const b = node.text[2];
			const c = node.text[3];
			return `#${a}${a}${b}${b}${c}${c}`;
		}
		return node.text;
	},
	CONSTANT: (f: FileState, node: TreeSitterNode): string => node.text,
	AND: (f: FileState, node: TreeSitterNode): string => node.text,
	OR: (f: FileState, node: TreeSitterNode): string => node.text,
	'!': (f: FileState, node: TreeSitterNode): string => node.text,
	BANG: (f: FileState, node: TreeSitterNode): string => node.text,
	MUL_DIV_MOD: (f: FileState, node: TreeSitterNode): string => node.text,
	ADD_SUB: (f: FileState, node: TreeSitterNode): string => node.text,
	EQUALITY: (f: FileState, node: TreeSitterNode): string => {
		const op = node.text;
		if (op === '===') {
			f.quickWarning(node, 'invalid operator', `use '==', not '==='`);
			return '==';
		}
		if (op === '!==') {
			f.quickWarning(node, 'invalid operator', `use '!=', not '!=='`);
			return '!=';
		}
		return op;
	},
	COMPARISON: (f: FileState, node: TreeSitterNode): string => {
		const op = node.text;
		if (op === '===') {
			f.quickWarning(node, 'invalid operator', `use '==', not '==='`);
			return '==';
		}
		if (op === '!==') {
			f.quickWarning(node, 'invalid operator', `use '!=', not '!=='`);
			return '!=';
		}
		return op;
	},
	op_equals: (f: FileState, node: TreeSitterNode): string => node.text[0],
	plus_minus_equals: (f: FileState, node: TreeSitterNode): string => node.text,
	forever: () => true,
	nsew: (f: FileState, node: TreeSitterNode) => node.text,
	entity_or_map_identifier: (f: FileState, node: TreeSitterNode): string => {
		const type = optionalTextForField(f, node, 'type');
		return type === 'map' ? '%MAP%' : extractEntityName(f, node);
	},
	entity_identifier: (f: FileState, node: TreeSitterNode): string => extractEntityName(f, node),
	movable_identifier: (f: FileState, node: TreeSitterNode): MovableIdentifier => {
		const debug = MathlangLocation.quick(f, node);
		const type = optionalTextForField(f, node, 'type');
		if (type === 'camera') {
			return MovableIdentifier.quick(debug, 'camera', 'camera');
		} else {
			const value = extractEntityName(f, node);
			return MovableIdentifier.quick(debug, 'entity', value);
		}
	},
	dialog_identifier: (f: FileState, node: TreeSitterNode): DialogIdentifier => {
		const debug = MathlangLocation.quick(f, node);
		const label = optionalTextForField(f, node, 'label');
		if (label) {
			return DialogIdentifier.quick(debug, 'label', label);
		}
		const type = textForField(f, node, 'type');
		if (type !== 'label' && type !== 'entity' && type !== 'name') {
			throw new Error('invalid dialog identifier type: ' + type);
		}
		const value = stringCaptureForField(f, node, 'value');
		return DialogIdentifier.quick(debug, type, value);
	},
	dialog_parameter: (f: FileState, node: TreeSitterNode): DialogParameter => {
		const debug = MathlangLocation.quick(f, node);
		const property = textForField(f, node, 'property');
		const value = stringOrNumberCaptureForField(f, node, 'value');
		return DialogParameter.quick(debug, property, value);
	},
	serial_dialog_parameter: (f: FileState, node: TreeSitterNode): SerialDialogParameter => {
		const debug = MathlangLocation.quick(f, node);
		const property = textForField(f, node, 'property');
		const value = stringOrNumberCaptureForField(f, node, 'value');
		return SerialDialogParameter.quick(debug, property, value);
	},
	coordinate_identifier: (f: FileState, node: TreeSitterNode): CoordinateIdentifier => {
		const debug = MathlangLocation.quick(f, node);
		const type = optionalTextForField(f, node, 'type');
		const polygonType = optionalTextForField(f, node, 'polygon_type');
		if (type === 'entity_path') {
			return CoordinateIdentifier.quick(debug, 'geometry', '%ENTITY_PATH%', polygonType);
		}
		if (type === 'geometry') {
			const value = stringCaptureForField(f, node, 'geometry');
			return CoordinateIdentifier.quick(debug, 'geometry', value, polygonType);
		}
		return CoordinateIdentifier.quick(debug, 'entity', extractEntityName(f, node));
	},
	bool_setable: (f: FileState, node: TreeSitterNode): BoolSetable => {
		const debug = MathlangLocation.quick(f, node);
		const type = optionalTextForField(f, node, 'type');
		if (!type) {
			const value = stringCaptureForField(f, node, 'flag');
			return BoolSetable.quick(debug, 'save_flag', value);
		}
		if (type === 'glitched') {
			const value = stringCaptureForField(f, node, 'entity_identifier');
			return BoolSetable.quick(debug, 'entity', value);
		}
		if (type === 'light') {
			const value = stringCaptureForField(f, node, 'light');
			return BoolSetable.quick(debug, 'light', value);
		}
		return BoolSetable.quick(debug, type, '');
	},
	int_binary_expression: (f: FileState, node: TreeSitterNode): IntBinaryExpression => {
		const debug = MathlangLocation.quick(f, node);
		const rhsNode = mandatoryChildForField(f, node, 'rhs');
		const lhsNode = mandatoryChildForField(f, node, 'lhs');
		const op = stringCaptureForField(f, node, 'operator');
		let rhs = handleCapture(f, rhsNode);
		let lhs = handleCapture(f, lhsNode);
		if (!(lhs instanceof IntBinaryExpression)) {
			lhs = IntUnit.fromAny(debug.using(lhsNode), lhs);
		}
		if (!(rhs instanceof IntBinaryExpression)) {
			rhs = IntUnit.fromAny(debug.using(rhsNode), rhs);
		}
		return new IntBinaryExpression(debug, { lhs, rhs, op });
	},
	bool_binary_expression: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const rhsNode = mandatoryChildForField(f, node, 'rhs');
		const lhsNode = mandatoryChildForField(f, node, 'lhs');
		const op = stringCaptureForField(f, node, 'operator');
		let rhs = handleCapture(f, rhsNode);
		let lhs = handleCapture(f, lhsNode);
		if (typeof lhs === 'string') {
			lhs = CheckSaveFlag.quick(debug, lhs);
		}
		if (typeof rhs === 'string') {
			rhs = CheckSaveFlag.quick(debug, rhs);
		}
		if (lhs instanceof BoolExpression && rhs instanceof BoolExpression) {
			return new BoolBinaryExpression(debug, {
				lhs,
				lhsNode,
				rhs,
				rhsNode,
				op,
			});
		}
		throw new Error('invalid LHS and RHS combo for captured bool binary expression');
	},
	bool_grouping: (f: FileState, node: TreeSitterNode): BoolExpression => {
		const debug = MathlangLocation.quick(f, node);
		const capture = captureForField(f, node, 'inner');
		if (typeof capture === 'boolean') {
			return BoolLiteral.quick(debug, capture);
		}
		if (typeof capture === 'string') {
			return CheckSaveFlag.quick(debug, capture);
		}
		if (capture instanceof BoolExpression) return capture;
		throw new Error('bool_grouping capture did not yield BoolExpression');
	},
	bool_unary_expression: (f: FileState, node: TreeSitterNode): BoolExpression => {
		const debug = MathlangLocation.quick(f, node);
		const op = stringCaptureForField(f, node, 'operator');
		if (op !== '!') throw new Error('captured unknown unary operator: ' + op);
		const capture = captureForField(f, node, 'operand');
		if (typeof capture === 'boolean') {
			return BoolLiteral.quick(debug, !capture);
		}
		if (typeof capture === 'string') {
			return CheckSaveFlag.quick(debug, capture).invert();
		}
		if (capture instanceof BoolExpression) {
			let toInvert = capture;
			if (toInvert instanceof BoolBinaryExpression) {
				toInvert = toInvert.clone();
			}
			return toInvert.invert();
		}
		throw new Error('bool_unary_expression capture did not yield BoolExpression');
	},
	int_getable: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const rngNode = optionalChildForField(f, node, 'rng');
		if (rngNode) {
			return handleCapture(f, rngNode);
		}
		const fnNode = optionalChildForField(f, node, 'fn_call');
		if (fnNode) {
			const sequence = MathlangSequence.coerce(handleNode(f, fnNode));
			const fn = stringCaptureForField(f, fnNode, 'name');
			return FnCallReturnValue.quick(debug, fn, 'fn', flattenNodes(f, sequence.steps));
		}
		const copyNode = optionalChildForField(f, node, 'copy_macro');
		if (copyNode) {
			const handled = handleNode(f, copyNode)[0];
			if (!(handled instanceof AnyNode)) throw new Error('no');
			const scriptName = stringCaptureForField(f, copyNode, 'script');
			return FnCallReturnValue.quick(debug, scriptName, 'script', flattenNodes(f, [handled]));
		}
		const entity = stringCaptureForField(f, node, 'entity_identifier');
		const field = textForField(f, node, 'property');
		return EntityIntField.quick(debug, entity, field);
	},
	bool_getable: (f: FileState, node: TreeSitterNode): BoolGetableAction => {
		const debug = MathlangLocation.quick(f, node);
		const type = optionalTextForField(f, node, 'type');
		if (type === 'flag') {
			return CheckSaveFlag.quick(debug, stringCaptureForField(f, node, 'value'));
		} else if (type === 'debug_mode') {
			return CheckDebugMode.quick(debug);
		} else if (type === 'glitched') {
			return CheckEntityGlitched.quick(
				debug,
				stringCaptureForField(f, node, 'entity_identifier'),
			);
		} else if (type === 'intersects') {
			return CheckIfEntityIsInGeometry.quick(
				debug,
				stringCaptureForField(f, node, 'entity_identifier'),
				stringCaptureForField(f, node, 'geometry_identifier'),
			);
		} else if (type === 'dialog' || type === 'serial_dialog') {
			const state = optionalTextForField(f, node, 'value');
			if (type === 'dialog') {
				return CheckDialogOpen.quick(debug, state === 'open');
			} else {
				return CheckSerialDialogOpen.quick(debug, state === 'open');
			}
		} else if (type === 'button') {
			const button_id = stringCaptureForField(f, node, 'button');
			const stateNode = mandatoryChildForField(f, node, 'state');
			if (stateNode.text === 'pressed') {
				return CheckForButtonPress.quick(debug, button_id);
			} else {
				const state = handleCapture(f, stateNode);
				return CheckForButtonState.quick(
					debug,
					button_id,
					coerceToBool(f, node, state, 'button state'),
				);
			}
		}
		throw new Error('failed to capture bool_getable');
	},
	string_checkable: (f: FileState, node: TreeSitterNode): StringCheckableAction => {
		const debug = MathlangLocation.quick(f, node);
		const entity = optionalStringCaptureForField(f, node, 'entity_identifier');
		if (entity === null) {
			const type = optionalTextForField(f, node, 'type');
			if (type === 'warp_state') {
				return CheckWarpState.quick(debug, '');
			} else {
				throw new Error(
					`unidentifiable non-entity string_checkable: capturing type ${type}`,
				);
			}
		}
		const property = textForField(f, node, 'property');
		if (property === 'on_tick') {
			return CheckEntityTickScript.quick(debug, entity, '');
		} else if (property === 'on_look') {
			return CheckEntityLookScript.quick(debug, entity, '');
		} else if (property === 'on_interact') {
			return CheckEntityInteractScript.quick(debug, entity, '');
		} else if (property === 'name') {
			return CheckEntityName.quick(debug, entity, '');
		} else if (property === 'path') {
			return CheckEntityPath.quick(debug, entity, '');
		} else if (property === 'type') {
			return CheckEntityType.quick(debug, entity, '');
		}
		throw new Error(`could not capture entity string_checkable`);
	},
	geometry_identifier: (f: FileState, node: TreeSitterNode): string => {
		const type = optionalTextForField(f, node, 'type');
		if (type === 'entity_path') {
			return '%ENTITY_PATH%';
		}
		return stringCaptureForField(f, node, 'geometry');
	},
	entity_direction: (f: FileState, node: TreeSitterNode): string => {
		return stringCaptureForField(f, node, 'entity_identifier');
	},
	bool_comparison: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const lhsNode = mandatoryChildForField(f, node, 'lhs');
		const rhsNode = mandatoryChildForField(f, node, 'rhs');
		const op = stringCaptureForField(f, node, 'operator');
		let lhs = handleCapture(f, lhsNode);
		let rhs = handleCapture(f, rhsNode);

		// SIMPLE CASES

		// entity Bob direction == north
		if (lhsNode.grammarType === 'entity_direction') {
			const entity = stringCaptureForField(f, lhsNode, 'entity_identifier');
			const nsew = coerceToString(f, node, rhs, 'bool_comparison entity_direction string');
			return CheckEntityDirection.quick(debug, entity, nsew, op);
		}
		// north == entity Bob direction
		if (rhsNode.grammarType === 'entity_direction') {
			const entity = stringCaptureForField(f, rhsNode, 'entity_identifier');
			const nsew = coerceToString(f, node, lhs, 'bool_comparison entity_direction string');
			return CheckEntityDirection.quick(debug, entity, nsew, op);
		}

		// entity Bob name == "Super Bob"
		if (lhs instanceof StringCheckable) {
			const string = coerceToString(f, node, rhs, 'bool_comparison string_checkable string');
			return lhs.addDetails(string, op);
		}
		// "Super Bob" == entity Bob name
		if (rhs instanceof StringCheckable) {
			const string = coerceToString(f, node, lhs, 'bool_comparison string_checkable string');
			return rhs.addDetails(string, op);
		}

		// COMPLEX CASES

		const steps: AnyNode[] = [];

		const tempLHS = newTemporary();
		const tempRHS = newTemporary();

		// entity Bob x == 7
		if (lhs instanceof EntityIntField) {
			if ((op === '==' || op === '!=') && typeof rhs === 'number') {
				// simple after all
				const numberCheckableEquality = lhs.intoNumberCheckableEquality();
				dropTemporary();
				dropTemporary();
				return numberCheckableEquality.finalizeValues(rhs, op);
			} else {
				// complex actually
				steps.push(...lhs.toSteps(tempLHS));
				lhs = tempLHS;
			}
		}
		// 7 == entity Bob x
		if (rhs instanceof EntityIntField) {
			if ((op === '==' || op === '!=') && typeof lhs === 'number') {
				// simple after all
				const numberCheckableEquality = rhs.intoNumberCheckableEquality();
				dropTemporary();
				dropTemporary();
				return numberCheckableEquality.finalizeValues(lhs, op);
			} else {
				// complex actually
				steps.push(...rhs.toSteps(tempRHS));
				rhs = tempRHS;
			}
		}

		// Fill out steps so we can eval the expressions as temporaries
		if (lhs instanceof IntUnit) {
			steps.push(...lhs.toSteps(tempLHS));
			lhs = tempLHS;
		}
		if (rhs instanceof IntUnit) {
			steps.push(...rhs.toSteps(tempRHS));
			rhs = tempRHS;
		}

		// Compare temporaries/numbers
		if (typeof lhs === 'string') {
			if (typeof rhs === 'string') {
				// varName1 > varName2
				steps.push(CheckVariables.quick(debug, lhs, rhs, op));
			} else if (typeof rhs === 'number') {
				// varName > 255
				steps.push(CheckVariable.quick(debug, lhs, rhs, op));
			}
		} else if (typeof lhs === 'number') {
			if (typeof rhs === 'string') {
				// 255 > varName
				steps.push(CheckVariable.quick(debug, rhs, lhs, inverseOpMap[op]));
			} else if (typeof rhs === 'number') {
				// 255 > 0
				// BAKE IT
				if (op === '<') steps.push(BoolLiteral.quick(debug, lhs < rhs));
				else if (op === '<=') steps.push(BoolLiteral.quick(debug, lhs <= rhs));
				else if (op === '>') steps.push(BoolLiteral.quick(debug, lhs > rhs));
				else if (op === '>=') steps.push(BoolLiteral.quick(debug, lhs >= rhs));
				else if (op === '==') steps.push(BoolLiteral.quick(debug, lhs == rhs));
				else if (op === '!=') steps.push(BoolLiteral.quick(debug, lhs != rhs));
				else throw new Error(`invalid op in captured bool comparison: ${op}`);
			}
		}
		dropTemporary();
		dropTemporary();
		return BoolComparisonSequence.orSingle(f, node, steps, 'bool_comparison');
	},
	int_setable: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const entity = stringCaptureForField(f, node, 'entity_identifier');
		const field = textForField(f, node, 'property');
		return EntityIntField.quick(debug, entity, field);
	},
	int_grouping: (f: FileState, node: TreeSitterNode): IntExpression => {
		const capture = handleCapture(f, namedChildren(f, node)[0]);
		if (capture instanceof IntExpression) return capture;
		throw new Error('captured int_grouping did not produce IntExpression');
	},
	int_rng: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		let value = optionalNumberCaptureForField(f, node, 'value');
		const inclusive = optionalTextForField(f, node, 'inclusive');
		if (value !== null) {
			if (inclusive) {
				value += 1;
			}
			return RNGSingle.quick(debug, value);
		}
		let min = numberCaptureForField(f, node, 'min');
		let max = numberCaptureForField(f, node, 'max');
		if (min > max) {
			f.quickWarning(node, 'misordered params', 'min must be less than max');
			const switcheroo = min;
			min = max;
			max = switcheroo;
		}
		if (inclusive) {
			max += 1;
		}
		const diff = max - min;
		return RNGPair.quick(debug, diff, min);
	},
	direction_target: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		const direction = optionalTextForField(f, node, 'nsew');
		if (direction) {
			return DirectionTarget.quick(debug, 'nsew', direction);
		}
		const target_geometry = optionalStringCaptureForField(f, node, 'geometry');
		if (target_geometry) {
			return DirectionTarget.quick(debug, 'geometry', target_geometry);
		}
		const target_entity = optionalStringCaptureForField(f, node, 'entity');
		if (target_entity) {
			return DirectionTarget.quick(debug, 'entity', target_entity);
		}
		throw new Error('could not capture direction_target');
	},
	set_entity_string_field: (f: FileState, node: TreeSitterNode): string => node.text,
	script_literal: (f: FileState, node: TreeSitterNode) => {
		const debug = MathlangLocation.quick(f, node);
		let scriptName = '';
		let blockNode = optionalChildForField(f, node, 'bare_definition');
		if (!blockNode) {
			const useNode = mandatoryChildForField(f, node, 'named_definition');
			blockNode = mandatoryChildForField(f, useNode, 'script_block');
			scriptName = stringCaptureForField(f, useNode, 'script_name');
		} else {
			scriptName = autoIdentifierName(f, node);
		}
		const definition = ScriptDefinition.processAndMake(debug, scriptName, blockNode);
		if (definition.actions.length === 1) {
			// must be 1 because the auto "end of script" label adds one
			// but actions.length === 1 means there's nothing else there
			return 'null_script';
		} else {
			return definition;
		}
	},
};

const extractEntityName = (f: FileState, node: TreeSitterNode): string => {
	const type = optionalTextForField(f, node, 'type');
	if (type === 'self') return '%SELF%';
	if (type === 'player') return '%PLAYER%';
	if (type !== 'entity') throw new Error('Entity identifier not an entity?');
	return stringCaptureForField(f, node, 'entity');
};

// ------------------------- VERY COMMON NODE HANDLING BEHAVIORS

// Every time a new node is found, check its children for errors.
// Thus, we should use these 4+ basic functions for the guts of the rest

// Get 0-1 child by name -> TreeSitterNode | null
// Finds missing children / errors and filters out null
export const optionalChildForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): TreeSitterNode | null => {
	const child = node.childForFieldName(fieldName);
	if (child === null) return null;
	reportMissingChildNodes(f, child);
	reportErrorNodes(f, child);
	return child;
};

// Get 1 child by name or die trying -> TreeSitterNode
// Finds missing children / errors and filters out null
export const mandatoryChildForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): TreeSitterNode => {
	const child = optionalChildForField(f, node, fieldName);
	if (child === null) throw new Error('missing child for field name ' + fieldName);
	return child;
};

// Get 0+ children by name -> TreeSitterNode[]
// Finds missing children / errors and filters out null
export const childrenForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): TreeSitterNode[] => {
	const children = node.childrenForFieldName(fieldName);
	return children
		.filter((v) => v !== null)
		.map((v) => {
			reportMissingChildNodes(f, v);
			reportErrorNodes(f, v);
			return v;
		})
		.flat();
};

// Get 0+ children with any name at all -> TreeSitterNode[]
// Finds missing children / errors and filters out null
export const namedChildren = (f: FileState, node: TreeSitterNode): TreeSitterNode[] => {
	return node.namedChildren
		.filter((v) => v !== null)
		.map((v) => {
			reportMissingChildNodes(f, v);
			reportErrorNodes(f, v);
			return v;
		})
		.flat();
};

// Get last child or die trying -> TreeSitterNode
// Finds missing children / errors and filters out null
export const mandatoryLastChild = (f: FileState, node: TreeSitterNode): TreeSitterNode => {
	const lastChild = optionalLastChild(f, node);
	if (!lastChild) throw new Error('no last child');
	return lastChild;
};

// Get last child if any -> TreeSitterNode | null
// Finds missing children / errors and filters out null
export const optionalLastChild = (f: FileState, node: TreeSitterNode): TreeSitterNode | null => {
	const lastChild = node.lastChild;
	if (!lastChild) return null;
	reportMissingChildNodes(f, lastChild);
	reportErrorNodes(f, lastChild);
	return lastChild;
};

// Get AND process 0+ children with any name at all -> AnyNode[]
// Finds missing children / errors and filters out null
export const handleNamedChildren = (f: FileState, node: TreeSitterNode): AnyNode[] => {
	const children = namedChildren(f, node);
	return children.map((v) => handleNode(f, v)).flat();
};

// Get AND process last child or die trying -> AnyNode
// Finds missing children / errors and filters out null
export const handleLastChild = (f: FileState, node: TreeSitterNode): AnyNode[] => {
	const lastChildNode = mandatoryLastChild(f, node);
	return handleNode(f, lastChildNode);
};

// More specific:

// Get AND process 0+ children by name -> AnyNode[]
export const handleChildrenForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): AnyNode[] => {
	const children = childrenForField(f, node, fieldName);
	return children.map((v) => handleNode(f, v)).flat();
};

// Get AND process 1 string child by name or die trying -> string
export const stringCaptureForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): string => {
	const captureNode = mandatoryChildForField(f, node, fieldName);
	const capture = handleCapture(f, captureNode);
	if (typeof capture === 'string') return capture;
	throw new Error(`capture from field ${fieldName} not a string`);
};

// Get AND process 0-1 string child by name -> string | null
export const optionalStringCaptureForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): string | null => {
	const captureNode = optionalChildForField(f, node, fieldName);
	if (!captureNode) return null;
	const capture = handleCapture(f, captureNode);
	if (typeof capture === 'string') return capture;
	throw new Error(`capture from field ${fieldName} not a string`);
};

// Get AND process 1 string/number child by name or die trying -> string | number
export const stringOrNumberCaptureForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): string | number => {
	const captureNode = mandatoryChildForField(f, node, fieldName);
	const capture = handleCapture(f, captureNode);
	if (typeof capture === 'string' || typeof capture === 'number') return capture;
	throw new Error(`capture from field ${fieldName} not a string or number`);
};

// Get AND process 1 number child by name or die trying -> number
export const numberCaptureForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): number => {
	const captureNode = mandatoryChildForField(f, node, fieldName);
	const capture = handleCapture(f, captureNode);
	if (typeof capture === 'number') return capture;
	throw new Error(`capture from field ${fieldName} not a number`);
};

// Get AND process 0-1 number child by name -> number | null
export const optionalNumberCaptureForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): number | null => {
	const captureNode = optionalChildForField(f, node, fieldName);
	if (!captureNode) return null;
	const capture = handleCapture(f, captureNode);
	if (typeof capture === 'number') return capture;
	throw new Error(`capture from field ${fieldName} not a number`);
};

// Get AND process (into captures) 0-1 children -> Capture | Capture[] | undefined
export const captureForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): Capture | Capture[] | undefined => {
	const captureNode = optionalChildForField(f, node, fieldName);
	if (!captureNode) return undefined;
	return handleCapture(f, captureNode);
};

// Get AND process (into captures) 0+ children -> Capture | Capture[] | undefined
export const capturesForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): Capture[] => {
	return childrenForField(f, node, fieldName)
		.map((v) => handleCapture(f, v))
		.flat();
};

// Get AND process (into raw text) 0-1 children -> string | undefined
export const optionalTextForField = (
	f: FileState,
	node: TreeSitterNode,
	fieldName: string,
): string | undefined => {
	const captureNode = optionalChildForField(f, node, fieldName);
	if (!captureNode) return undefined;
	return captureNode.text;
};

// Get AND process (into raw text) 1 children or die trying -> string
export const textForField = (f: FileState, node: TreeSitterNode, fieldName: string): string => {
	const captureNode = mandatoryChildForField(f, node, fieldName);
	return captureNode.text;
};

// The following will also report constant assignemnts if they are the source the incongruity

// Gracefully force the value into being a string (do not die if incongruous)
export const coerceToString = (
	f: FileState,
	node: TreeSitterNode,
	v: unknown,
	label?: string,
): string => {
	if (typeof v === 'string') return v;
	const locations = [MathlangLocation.quick(f, node)];
	if (f.constants[node.text]) {
		locations.unshift(f.constants[node.text].debug);
	}
	if (label) {
		f.newError(new MathlangMessage(locations, 'value wrong type', `${label} is not a string`));
	} else {
		f.newError(new MathlangMessage(locations, 'value wrong type', `value not a string`));
	}
	return '';
};

// Gracefully force the value into being a number (do not die if incongruous)
export const coerceToNumber = (
	f: FileState,
	node: TreeSitterNode,
	v: unknown,
	label?: string,
): number => {
	if (typeof v === 'number') return v;
	const locations = [MathlangLocation.quick(f, node)];
	if (f.constants[node.text]) {
		locations.unshift(f.constants[node.text].debug);
	}
	if (label) {
		f.newError(new MathlangMessage(locations, 'value wrong type', `${label} is not a number`));
	} else {
		f.newError(new MathlangMessage(locations, 'value wrong type', `value not a number`));
	}
	return NaN;
};

// Gracefully force the value into being a boolean (do not die if incongruous)
export const coerceToBool = (
	f: FileState,
	node: TreeSitterNode,
	v: unknown,
	label?: string,
): boolean => {
	if (v instanceof BoolLiteral) {
		return v.value;
	}
	if (typeof v === 'boolean') return v;
	const locations = [MathlangLocation.quick(f, node)];
	if (f.constants[node.text]) {
		locations.unshift(f.constants[node.text].debug);
	}
	if (label) {
		f.newError(new MathlangMessage(locations, 'value wrong type', `${label} is not a boolean`));
	} else {
		f.newError(new MathlangMessage(locations, 'value wrong type', `value not a boolean`));
	}
	return false;
};
