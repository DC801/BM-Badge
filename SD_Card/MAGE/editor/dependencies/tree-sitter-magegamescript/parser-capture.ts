import { Node as TreeSitterNode } from 'web-tree-sitter';
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
	ScriptDefinition,
	FnCall,
	ArrayMethodChain,
	ArrayMethod,
	ArrayReverse,
	ArraySort,
	ArraySliceByNumber,
	ArraySliceTwiceByNumber,
	ArraySliceByVariable,
	ArraySliceTwiceByVariable,
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
import { handleNode } from './parser-node.ts';
import { MUTATE_VARIABLE } from './parser-bytecode-info.ts';

export type Capture = number | string | boolean | AnyNode;

// TODO: remove null from node here
export const handleCapture = (debug: MathlangLocation): Capture | Capture[] => {
	const grammarType = debug.node.grammarType;
	debugLog(`-->> Capturing: ${grammarType}`);
	if (grammarType.endsWith('_expansion')) {
		// fwiw, cannot become recursive according to the grammar (1 level deep only)
		return namedChildren(debug)
			.filter((v) => v !== null)
			.map((v) => handleCapture(debug.using(v)))
			.flat();
	}
	// swap out values of compile-time constants
	if (grammarType === 'CONSTANT') {
		const lookup =
			debug.f.currFunction[0]?.[debug.node.text] || debug.f.constants[debug.node.text];
		if (lookup === undefined) {
			debug.quickError('undefined constant', `constant ${debug.node.text} is undefined`);
		}
		return lookup?.value !== undefined ? lookup?.value : debug.node.text;
	}
	// do the thing
	const fn = captureFns[grammarType];
	if (!fn) throw new Error(`no function found for grammar type ${grammarType}`);
	return fn(debug);
};

const captureFns: Record<string, (debug: MathlangLocation) => AnyNode | Capture | Capture[]> = {
	BOOL: (debug): BoolLiteral => {
		const text = debug.node.text;
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
	BAREWORD: (debug): string => debug.node.text,
	QUOTED_STRING: (debug): string => debug.node.text.slice(1, -1),
	NUMBER: (debug): number => Number(debug.node.text),
	DURATION: (debug): number => {
		const suffix = optionalTextForField(debug, 'suffix');
		const int = textForField(debug, 'NUMBER');
		let n = parseInt(int);
		if (suffix === 's') n *= 1000;
		return n;
	},
	DISTANCE: (debug): number => parseInt(debug.node.text),
	QUANTITY: (debug): number => {
		if (debug.node.childCount === 0) {
			if (debug.node.text === 'once') return 1;
			if (debug.node.text === 'twice') return 2;
			if (debug.node.text === 'thrice') return 3;
		}
		const int = textForField(debug, 'NUMBER');
		const n = parseInt(int);
		return n;
	},
	COLOR: (debug): string => {
		const node = debug.node;
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
	CONSTANT: (debug): string => debug.node.text,
	AND: (debug): string => debug.node.text,
	OR: (debug): string => debug.node.text,
	'!': (debug): string => debug.node.text,
	BANG: (debug): string => debug.node.text,
	MUL_DIV_MOD: (debug): string => debug.node.text,
	ADD_SUB: (debug): string => debug.node.text,
	EQUALITY: (debug): string => {
		const op = debug.node.text;
		if (op === '===') {
			debug.quickWarning('invalid operator', `use '==', not '==='`);
			return '==';
		}
		if (op === '!==') {
			debug.quickWarning('invalid operator', `use '!=', not '!=='`);
			return '!=';
		}
		return op;
	},
	COMPARISON: (debug): string => {
		const op = debug.node.text;
		if (op === '===') {
			debug.quickWarning('invalid operator', `use '==', not '==='`);
			return '==';
		}
		if (op === '!==') {
			debug.quickWarning('invalid operator', `use '!=', not '!=='`);
			return '!=';
		}
		return op;
	},
	op_equals: (debug): string => debug.node.text[0],
	plus_minus_equals: (debug): string => debug.node.text,
	forever: () => true,
	nsew: (debug) => debug.node.text,
	entity_or_map_identifier: (debug): string => {
		const type = optionalTextForField(debug, 'type');
		return type === 'map' ? '%MAP%' : extractEntityName(debug);
	},
	entity_identifier: (debug): string => extractEntityName(debug),
	movable_identifier: (debug): MovableIdentifier => {
		const type = optionalTextForField(debug, 'type');
		if (type === 'camera') {
			return MovableIdentifier.quick(debug, 'camera', 'camera');
		} else {
			const value = extractEntityName(debug);
			return MovableIdentifier.quick(debug, 'entity', value);
		}
	},
	dialog_identifier: (debug): DialogIdentifier => {
		const label = optionalTextForField(debug, 'label');
		if (label) {
			return DialogIdentifier.quick(debug, 'label', label);
		}
		const type = textForField(debug, 'type');
		if (type !== 'label' && type !== 'entity' && type !== 'name') {
			throw new Error('invalid dialog identifier type: ' + type);
		}
		const value = stringCaptureForField(debug, 'value');
		return DialogIdentifier.quick(debug, type, value);
	},
	dialog_parameter: (debug): DialogParameter => {
		const property = textForField(debug, 'property');
		const value = stringOrNumberCaptureForField(debug, 'value');
		return DialogParameter.quick(debug, property, value);
	},
	serial_dialog_parameter: (debug): SerialDialogParameter => {
		const property = textForField(debug, 'property');
		const value = stringOrNumberCaptureForField(debug, 'value');
		return SerialDialogParameter.quick(debug, property, value);
	},
	coordinate_identifier: (debug): CoordinateIdentifier => {
		const type = optionalTextForField(debug, 'type');
		const polygonType = optionalTextForField(debug, 'polygon_type');
		if (type === 'entity_path') {
			return CoordinateIdentifier.quick(debug, 'geometry', '%ENTITY_PATH%', polygonType);
		}
		if (type === 'geometry') {
			const value = stringCaptureForField(debug, 'geometry');
			return CoordinateIdentifier.quick(debug, 'geometry', value, polygonType);
		}
		return CoordinateIdentifier.quick(debug, 'entity', extractEntityName(debug));
	},
	bool_setable: (debug): BoolSetable => {
		const type = optionalTextForField(debug, 'type');
		if (!type) {
			const value = stringCaptureForField(debug, 'flag');
			return BoolSetable.quick(debug, 'save_flag', value);
		}
		if (type === 'glitched') {
			const value = stringCaptureForField(debug, 'entity_identifier');
			return BoolSetable.quick(debug, 'entity', value);
		}
		if (type === 'light') {
			const value = stringCaptureForField(debug, 'light');
			return BoolSetable.quick(debug, 'light', value);
		}
		return BoolSetable.quick(debug, type, '');
	},
	int_binary_expression: (debug): IntBinaryExpression => {
		const rhsNode = mandatoryChildForField(debug, 'rhs');
		const lhsNode = mandatoryChildForField(debug, 'lhs');
		const op = stringCaptureForField(debug, 'operator');
		let rhs = handleCapture(debug.using(rhsNode));
		let lhs = handleCapture(debug.using(lhsNode));
		if (!(lhs instanceof IntBinaryExpression)) {
			lhs = IntUnit.fromAny(debug.using(lhsNode), lhs);
		}
		if (!(rhs instanceof IntBinaryExpression)) {
			rhs = IntUnit.fromAny(debug.using(rhsNode), rhs);
		}
		return new IntBinaryExpression(debug, { lhs, rhs, op });
	},
	bool_binary_expression: (debug) => {
		const rhsNode = mandatoryChildForField(debug, 'rhs');
		const lhsNode = mandatoryChildForField(debug, 'lhs');
		const op = stringCaptureForField(debug, 'operator');
		let rhs = handleCapture(debug.using(rhsNode));
		let lhs = handleCapture(debug.using(lhsNode));
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
	bool_grouping: (debug): BoolExpression => {
		const capture = captureForField(debug, 'inner');
		if (typeof capture === 'boolean') {
			return BoolLiteral.quick(debug, capture);
		}
		if (typeof capture === 'string') {
			return CheckSaveFlag.quick(debug, capture);
		}
		if (capture instanceof BoolExpression) return capture;
		throw new Error('bool_grouping capture did not yield BoolExpression');
	},
	bool_unary_expression: (debug): BoolExpression => {
		const op = stringCaptureForField(debug, 'operator');
		if (op !== '!') throw new Error('captured unknown unary operator: ' + op);
		const capture = captureForField(debug, 'operand');
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
	int_getable: (debug) => {
		const rngNode = optionalChildForField(debug, 'rng');
		if (rngNode) {
			return handleCapture(debug.using(rngNode));
		}
		const fnNode = optionalChildForField(debug, 'fn_call');
		if (fnNode) {
			const fn = stringCaptureForField(debug.using(fnNode), 'name');
			return FnCall.quick(debug, fn, 'fn', fnNode);
		}
		// TODO: unbake this
		const copyNode = optionalChildForField(debug, 'copy_macro');
		if (copyNode) {
			const handled = handleNode(debug.using(copyNode))[0];
			if (!(handled instanceof AnyNode)) throw new Error('no');
			const scriptName = stringCaptureForField(debug.using(copyNode), 'script');
			return FnCallReturnValue.quick(debug, scriptName, 'script', flattenNodes([handled]));
		}
		const entity = stringCaptureForField(debug, 'entity_identifier');
		const field = textForField(debug, 'property');
		return EntityIntField.quick(debug, entity, field);
	},
	bool_getable: (debug) => {
		const type = optionalTextForField(debug, 'type');
		if (type === 'flag') {
			return CheckSaveFlag.quick(debug, stringCaptureForField(debug, 'value'));
		} else if (type === 'debug_mode') {
			return CheckDebugMode.quick(debug);
		} else if (type === 'glitched') {
			return CheckEntityGlitched.quick(
				debug,
				stringCaptureForField(debug, 'entity_identifier'),
			);
		} else if (type === 'intersects') {
			return CheckIfEntityIsInGeometry.quick(
				debug,
				stringCaptureForField(debug, 'entity_identifier'),
				stringCaptureForField(debug, 'geometry_identifier'),
			);
		} else if (type === 'dialog' || type === 'serial_dialog') {
			const state = optionalTextForField(debug, 'value');
			if (type === 'dialog') {
				return CheckDialogOpen.quick(debug, state === 'open');
			} else {
				return CheckSerialDialogOpen.quick(debug, state === 'open');
			}
		} else if (type === 'button') {
			const button_id = stringCaptureForField(debug, 'button');
			const stateNode = mandatoryChildForField(debug, 'state');
			if (stateNode.text === 'pressed') {
				return CheckForButtonPress.quick(debug, button_id);
			} else {
				const state = handleCapture(debug.using(stateNode));
				return CheckForButtonState.quick(
					debug,
					button_id,
					coerceToBool(debug, state, 'button state'),
				);
			}
		}
		throw new Error('failed to capture bool_getable');
	},
	string_checkable: (debug) => {
		const entity = optionalStringCaptureForField(debug, 'entity_identifier');
		if (entity === null) {
			const type = optionalTextForField(debug, 'type');
			if (type === 'warp_state') {
				return CheckWarpState.quick(debug, '');
			} else {
				throw new Error(
					`unidentifiable non-entity string_checkable: capturing type ${type}`,
				);
			}
		}
		const property = textForField(debug, 'property');
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
	geometry_identifier: (debug): string => {
		const type = optionalTextForField(debug, 'type');
		if (type === 'entity_path') {
			return '%ENTITY_PATH%';
		}
		return stringCaptureForField(debug, 'geometry');
	},
	entity_direction: (debug): string => {
		return stringCaptureForField(debug, 'entity_identifier');
	},
	bool_comparison: (debug) => {
		const lhsNode = mandatoryChildForField(debug, 'lhs');
		const rhsNode = mandatoryChildForField(debug, 'rhs');
		const op = stringCaptureForField(debug, 'operator');
		let lhs = handleCapture(debug.using(lhsNode));
		let rhs = handleCapture(debug.using(rhsNode));

		// SIMPLE CASES

		// entity Bob direction == north
		if (lhsNode.grammarType === 'entity_direction') {
			const entity = stringCaptureForField(debug.using(lhsNode), 'entity_identifier');
			const nsew = coerceToString(debug, rhs, 'bool_comparison entity_direction string');
			return CheckEntityDirection.quick(debug, entity, nsew, op);
		}
		// north == entity Bob direction
		if (rhsNode.grammarType === 'entity_direction') {
			const entity = stringCaptureForField(debug.using(rhsNode), 'entity_identifier');
			const nsew = coerceToString(debug, lhs, 'bool_comparison entity_direction string');
			return CheckEntityDirection.quick(debug, entity, nsew, op);
		}

		// entity Bob name == "Super Bob"
		if (lhs instanceof StringCheckable) {
			const string = coerceToString(debug, rhs, 'bool_comparison string_checkable string');
			return lhs.addDetails(string, op);
		}
		// "Super Bob" == entity Bob name
		if (rhs instanceof StringCheckable) {
			const string = coerceToString(debug, lhs, 'bool_comparison string_checkable string');
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
		return BoolComparisonSequence.orSingle(debug, steps, 'bool_comparison');
	},
	int_setable: (debug) => {
		const entity = stringCaptureForField(debug, 'entity_identifier');
		const field = textForField(debug, 'property');
		return EntityIntField.quick(debug, entity, field);
	},
	int_grouping: (debug): IntExpression => {
		const capture = handleCapture(debug.using(namedChildren(debug)[0]));
		if (capture instanceof IntExpression) return capture;
		throw new Error('captured int_grouping did not produce IntExpression');
	},
	int_rng: (debug) => {
		let value = optionalNumberCaptureForField(debug, 'value');
		const inclusive = optionalTextForField(debug, 'inclusive');
		if (value !== null) {
			if (inclusive) {
				value += 1;
			}
			return RNGSingle.quick(debug, value);
		}
		let min = numberCaptureForField(debug, 'min');
		let max = numberCaptureForField(debug, 'max');
		if (min > max) {
			debug.quickWarning('misordered params', 'min must be less than max');
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
	direction_target: (debug) => {
		const direction = optionalTextForField(debug, 'nsew');
		if (direction) {
			return DirectionTarget.quick(debug, 'nsew', direction);
		}
		const target_geometry = optionalStringCaptureForField(debug, 'geometry');
		if (target_geometry) {
			return DirectionTarget.quick(debug, 'geometry', target_geometry);
		}
		const target_entity = optionalStringCaptureForField(debug, 'entity');
		if (target_entity) {
			return DirectionTarget.quick(debug, 'entity', target_entity);
		}
		throw new Error('could not capture direction_target');
	},
	set_entity_string_field: (debug): string => debug.node.text,
	script_literal: (debug) => {
		let scriptName = '';
		let blockNode = optionalChildForField(debug, 'bare_definition');
		if (!blockNode) {
			const useNode = mandatoryChildForField(debug, 'named_definition');
			blockNode = mandatoryChildForField(debug.using(useNode), 'script_block');
			scriptName = stringCaptureForField(debug.using(useNode), 'script_name');
		} else {
			scriptName = autoIdentifierName(debug);
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
	array_with_array_methods: (debug) => {
		const name = stringCaptureForField(debug, 'name');
		const handledMethods = capturesForField(debug, 'array_method');
		return ArrayMethodChain.quick(debug, name, ArrayMethod.breakIfNotAll(handledMethods));
	},
	// array_method_map: (debug) => {},
	array_method_sort: (debug) => new ArraySort(debug, {}),
	array_method_reverse: (debug) => new ArrayReverse(debug, {}),
	array_method_slice: (debug) => {
		const steps: AnyNode[] = [];
		const argsRaw = childrenForField(debug, 'arg');
		let temporariesUsed = 0;
		const args = argsRaw.map((rawArg) => {
			const arg = handleCapture(debug.using(rawArg));
			if (typeof arg === 'string') return arg;
			if (typeof arg === 'number') return arg;
			if (arg instanceof IntExpression) {
				temporariesUsed += 1;
				const temp = newTemporary();
				steps.push(...arg.toSteps(temp));
				return temp;
			}
			throw new Error('unsupported slice index type');
		});
		if (args.length === 0) args.push(0);
		if (args.every(v=>typeof v === 'number')) {
			if (args.length === 1) {
				return ArraySliceByNumber.quick(debug, args[0]);
			} else {
				return ArraySliceTwiceByNumber.quick(debug, args[0], args[1]);
			}
		}
		const stringArgs = args.map(v=>{
			if (typeof v === 'number') {
				const temp = newTemporary();
				temporariesUsed += 1;
				steps.push(MUTATE_VARIABLE.set(temp, v));
				return temp;
			}
			return v;
		})
		let ret = ArraySliceByVariable.quick(debug, steps, stringArgs[0]);
		if (stringArgs.length === 2) {
			ret = ArraySliceTwiceByVariable.quick(debug, steps, stringArgs[0], stringArgs[1]);
		}
		for (let i = temporariesUsed; i < 0; i--) {
			dropTemporary();
		}
		return ret;
	},
};

const extractEntityName = (debug: MathlangLocation): string => {
	const type = optionalTextForField(debug, 'type');
	if (type === 'self') return '%SELF%';
	if (type === 'player') return '%PLAYER%';
	if (type !== 'entity') throw new Error('Entity identifier not an entity?');
	return stringCaptureForField(debug, 'entity');
};

// ------------------------- VERY COMMON NODE HANDLING BEHAVIORS

// Every time a new node is found, check its children for errors.
// Thus, we should use these basic functions for the guts of the rest

// Get 0-1 child by name -> TreeSitterNode | null
export const optionalChildForField = (
	debug: MathlangLocation,
	fieldName: string,
): TreeSitterNode | null => {
	const child = debug.node.childForFieldName(fieldName);
	if (child === null) return null;
	reportMissingChildNodes(debug.using(child));
	reportErrorNodes(debug.using(child));
	return child;
};

// Get 1 child by name or die trying -> TreeSitterNode
export const mandatoryChildForField = (
	debug: MathlangLocation,
	fieldName: string,
): TreeSitterNode => {
	const child = optionalChildForField(debug, fieldName);
	if (child === null) throw new Error('missing child for field name ' + fieldName);
	return child;
};

// Get 0+ children by name -> TreeSitterNode[]
export const childrenForField = (debug: MathlangLocation, fieldName: string): TreeSitterNode[] => {
	const children = debug.node.childrenForFieldName(fieldName);
	return children
		.filter((v) => v !== null)
		.map((v) => {
			reportMissingChildNodes(debug.using(v));
			reportErrorNodes(debug.using(v));
			return v;
		})
		.flat();
};

// Get 0+ children with any name at all -> TreeSitterNode[]
export const namedChildren = (debug: MathlangLocation): TreeSitterNode[] => {
	return debug.node.namedChildren
		.filter((v) => v !== null)
		.map((v) => {
			reportMissingChildNodes(debug.using(v));
			reportErrorNodes(debug.using(v));
			return v;
		})
		.flat();
};

// Get last child or die trying -> TreeSitterNode
export const mandatoryLastChild = (debug: MathlangLocation): TreeSitterNode => {
	const lastChild = optionalLastChild(debug);
	if (!lastChild) throw new Error('no last child');
	return lastChild;
};

// Get 0-1 last child -> TreeSitterNode | null
export const optionalLastChild = (debug: MathlangLocation): TreeSitterNode | null => {
	const lastChild = debug.node.lastChild;
	if (!lastChild) return null;
	reportMissingChildNodes(debug.using(lastChild));
	reportErrorNodes(debug.using(lastChild));
	return lastChild;
};

// Get AND process 0+ children with any name at all -> AnyNode[]
export const handleNamedChildren = (debug: MathlangLocation): AnyNode[] => {
	const children = namedChildren(debug);
	return children.map((v) => handleNode(debug.using(v))).flat();
};

// Get AND process last child or die trying -> AnyNode
export const handleLastChild = (debug: MathlangLocation): AnyNode[] => {
	const lastChildNode = mandatoryLastChild(debug);
	return handleNode(debug.using(lastChildNode));
};

// More specific:

// Get AND process (into nodes) 0+ children by name -> AnyNode[]
export const handleChildrenForField = (debug: MathlangLocation, fieldName: string): AnyNode[] => {
	const children = childrenForField(debug, fieldName);
	return children.map((v) => handleNode(debug.using(v))).flat();
};

// Get AND process (into captures) 1 string child by name or die trying -> string
export const stringCaptureForField = (debug: MathlangLocation, fieldName: string): string => {
	const captureNode = mandatoryChildForField(debug, fieldName);
	const capture = handleCapture(debug.using(captureNode));
	if (typeof capture === 'string') return capture;
	throw new Error(`capture from field ${fieldName} not a string`);
};

// Get AND process (into captures) 0-1 string child by name -> string | null
export const optionalStringCaptureForField = (
	debug: MathlangLocation,
	fieldName: string,
): string | null => {
	const captureNode = optionalChildForField(debug, fieldName);
	if (!captureNode) return null;
	const capture = handleCapture(debug.using(captureNode));
	if (typeof capture === 'string') return capture;
	throw new Error(`capture from field ${fieldName} not a string`);
};

// Get AND process (into captures) 1 string/number child by name or die trying -> string | number
export const stringOrNumberCaptureForField = (
	debug: MathlangLocation,
	fieldName: string,
): string | number => {
	const captureNode = mandatoryChildForField(debug, fieldName);
	const capture = handleCapture(debug.using(captureNode));
	if (typeof capture === 'string' || typeof capture === 'number') return capture;
	throw new Error(`capture from field ${fieldName} not a string or number`);
};

// Get AND process (into captures) 1 number child by name or die trying -> number
export const numberCaptureForField = (debug: MathlangLocation, fieldName: string): number => {
	const captureNode = mandatoryChildForField(debug, fieldName);
	const capture = handleCapture(debug.using(captureNode));
	if (typeof capture === 'number') return capture;
	throw new Error(`capture from field ${fieldName} not a number`);
};

// Get AND process (into captures) 0-1 number child by name -> number | null
export const optionalNumberCaptureForField = (
	debug: MathlangLocation,
	fieldName: string,
): number | null => {
	const captureNode = optionalChildForField(debug, fieldName);
	if (!captureNode) return null;
	const capture = handleCapture(debug.using(captureNode));
	if (typeof capture === 'number') return capture;
	throw new Error(`capture from field ${fieldName} not a number`);
};

// Get AND process (into captures) 0-1 children -> Capture | Capture[] | undefined
export const captureForField = (
	debug: MathlangLocation,
	fieldName: string,
): Capture | Capture[] | undefined => {
	const captureNode = optionalChildForField(debug, fieldName);
	if (!captureNode) return undefined;
	return handleCapture(debug.using(captureNode));
};

// Get AND process (into captures) 0+ children -> Capture | Capture[] | undefined
export const capturesForField = (debug: MathlangLocation, fieldName: string): Capture[] => {
	return childrenForField(debug, fieldName)
		.map((v) => handleCapture(debug.using(v)))
		.flat();
};

// Get AND process (into raw text) 0-1 children -> string | undefined
export const optionalTextForField = (
	debug: MathlangLocation,
	fieldName: string,
): string | undefined => {
	const captureNode = optionalChildForField(debug, fieldName);
	if (!captureNode) return undefined;
	return captureNode.text;
};

// Get AND process (into raw text) 1 children or die trying -> string
export const textForField = (debug: MathlangLocation, fieldName: string): string => {
	const captureNode = mandatoryChildForField(debug, fieldName);
	return captureNode.text;
};

// The following will also report constant assignments if they are the source the incongruity
// This is for things that can gracefully become the thing in the event of a problem
// It is NOT for things that we're 100% sure is the thing for other reasons (i.e. it wouldn't
// have matched at the grammar level otherwise) but just want to give a guarantee to TS

// Gracefully force the value into being a string (do not die if incongruous)
export const coerceToString = (debug: MathlangLocation, v: unknown, label?: string): string => {
	if (typeof v === 'string') return v;
	const locations = [debug];
	if (debug.f.constants[debug.node.text]) {
		locations.unshift(debug.f.constants[debug.node.text].debug);
	}
	if (label) {
		debug.f.newError(
			new MathlangMessage(locations, 'value wrong type', `${label} is not a string`),
		);
	} else {
		debug.f.newError(new MathlangMessage(locations, 'value wrong type', `value not a string`));
	}
	return '';
};

// Gracefully force the value into being a number (do not die if incongruous)
export const coerceToNumber = (debug: MathlangLocation, v: unknown, label?: string): number => {
	if (typeof v === 'number') return v;
	const locations = [debug];
	if (debug.f.constants[debug.node.text]) {
		locations.unshift(debug.f.constants[debug.node.text].debug);
	}
	if (label) {
		debug.f.newError(
			new MathlangMessage(locations, 'value wrong type', `${label} is not a number`),
		);
	} else {
		debug.f.newError(new MathlangMessage(locations, 'value wrong type', `value not a number`));
	}
	return NaN;
};

// Gracefully force the value into being a boolean (do not die if incongruous)
export const coerceToBool = (debug: MathlangLocation, v: unknown, label?: string): boolean => {
	if (v instanceof BoolLiteral) {
		return v.value;
	}
	if (typeof v === 'boolean') return v;
	const locations = [debug];
	if (debug.f.constants[debug.node.text]) {
		locations.unshift(debug.f.constants[debug.node.text].debug);
	}
	if (label) {
		debug.f.newError(
			new MathlangMessage(locations, 'value wrong type', `${label} is not a boolean`),
		);
	} else {
		debug.f.newError(new MathlangMessage(locations, 'value wrong type', `value not a boolean`));
	}
	return false;
};
