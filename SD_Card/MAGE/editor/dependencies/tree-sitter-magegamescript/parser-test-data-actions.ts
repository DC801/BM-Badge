import { RETURN } from './parser-utilities.ts';

export const actionTests = {
	broken_action_test: {
		input: [
			`json[
				{
					"action": "ARRAY_PUSH_FROM_VARIABLE",
					"variable": "array_var_test",
					"array_name": "arr"
				}
			]`,
		],
		expected: [`"arr".push("array_var_test");`],
	},
	keyword_as_variable_name: {
		input: [`"if" = 10;`],
		expected: [`"if" = 10;`],
	},
	keyword_as_entity_name: {
		input: [`entity if on_tick = null_script;`],
		expected: [`entity if on_tick = null_script;`],
	},
	script_def_in_spread: {
		input: [`command ["T", "TIPS"] = hanoi_help { hanoi_draw_help = true; };`],
		expected: [`command "T" = "hanoi_help;`, `command "TIPS" = "hanoi_help;`],
	},
	array_map_read_value: {
		input: [`varName = arrayName.map(($n) { return $n + 1; })[0];`],
		expected: [
			`__TEMP_0 = 0;`,
			`__TEMP_1 = arrayName.length();`,
			`map_condition_*A*:`,
			`if "__TEMP_0" < "__TEMP_1" then goto label map_body_*D*;`,
			`goto label map_break_*B*;`,
			`map_body_*D*:`,
			`__TEMP_2 = arrayName[__TEMP_0];`,
			`__TEMP_3 = __TEMP_2;`,
			`__TEMP_3 +`,
			`= 1;`,
			`${RETURN} = __TEMP_3;`,
			`end_of_script_***:`,
			`__TEMPORARY_ARRAY_.push(${RETURN});`,
			`${RETURN} = 0;`,
			`map_continue_*C*:`,
			`__TEMP_0 +`,
			`= 1;`,
			`goto label map_condition_*A*;`,
			`map_break_*B*:`,
			`varName = __TEMPORARY_ARRAY_[0];`,
		],
	},
	array_for_each_chain: {
		pre: `fn addToSum ($n) { sum += $n; }`,
		input: [`sum = 0;`, `array a = b.sort().reverse().for_each(addToSum);`],
		expected: [
			// should be the same as the lambda version
			`sum = 0;`,
			`b.sort();`,
			`b.reverse();`,
			`__TEMP_0 = 0;`,
			`__TEMP_1 = b.length();`,
			`for_each_condition_*A*:`,
			`if "__TEMP_0" < "__TEMP_1" then goto label for_each_body_*D*;`,
			`goto label for_each_break_*B*;`,
			`for_each_body_*D*:`,
			`__TEMP_2 = b[__TEMP_0];`,
			`sum += __TEMP_2;`,
			`end_of_script_***:`,
			`for_each_continue_*C*:`,
			`__TEMP_0 +`,
			`= 1;`,
			`goto label for_each_condition_*A*;`,
			`for_each_break_*B*:`,
		],
	},
	array_for_each_identifier: {
		pre: `fn accumulateSum ($n) { sum += $n; }`,
		input: [`sum = 0;`, `array a = b.for_each(accumulateSum);`],
		expected: [
			// should be the same as the lambda version
			`sum = 0;`,
			`__TEMP_0 = 0;`,
			`__TEMP_1 = b.length();`,
			`for_each_condition_*A*:`,
			`if "__TEMP_0" < "__TEMP_1" then goto label for_each_body_*D*;`,
			`goto label for_each_break_*B*;`,
			`for_each_body_*D*:`,
			`__TEMP_2 = b[__TEMP_0];`,
			`sum += __TEMP_2;`,
			`end_of_script_***:`,
			`for_each_continue_*C*:`,
			`__TEMP_0 +`,
			`= 1;`,
			`goto label for_each_condition_*A*;`,
			`for_each_break_*B*:`,
		],
	},
	array_for_each_lambda: {
		input: [`sum = 0;`, `array a = b.for_each(($n) { sum += $n; });`],
		expected: [
			`sum = 0;`,
			`__TEMP_0 = 0;`, // i = 0;
			`__TEMP_1 = b.length();`, // length = b.length();
			`for_each_condition_*A*:`,
			`if "__TEMP_0" < "__TEMP_1" then goto label for_each_body_*D*;`, // (i < length)
			`goto label for_each_break_*B*;`,
			`for_each_body_*D*:`,
			`__TEMP_2 = b[__TEMP_0];`, // curr = b[i];
			`sum += __TEMP_2;`, // sum += curr;
			`end_of_script_***:`,
			`for_each_continue_*C*:`,
			`__TEMP_0 +`, // i += 1;
			`= 1;`,
			`goto label for_each_condition_*A*;`,
			`for_each_break_*B*:`,
		],
	},
	array_map_identifier: {
		pre: `fn doThing ($n) { return $n + 1; }`,
		input: [`a = b.map(doThing);`],
		expected: [
			// should be same as lambda version
			`array a = [];`,
			`__TEMP_0 = 0;`,
			`__TEMP_1 = b.length();`,
			`map_condition_*A*:`,
			`if "__TEMP_0" < "__TEMP_1" then goto label map_body_*D*;`,
			`goto label map_break_*B*;`,
			`map_body_*D*:`,
			`__TEMP_2 = b[__TEMP_0];`,
			`__TEMP_3 = __TEMP_2;`,
			`__TEMP_3 +`,
			`= 1;`,
			`${RETURN} = __TEMP_3;`,
			`end_of_script_***:`,
			`a.push(${RETURN});`,
			`${RETURN} = 0;`,
			`map_continue_*C*:`,
			`__TEMP_0 +`,
			`= 1;`,
			`goto label map_condition_*A*;`,
			`map_break_*B*:`,
		],
	},
	array_map_lambda: {
		input: [`array a = b.map(($n) { return $n + 1; });`],
		expected: [
			`array a = [];`,
			`__TEMP_0 = 0;`, // i = 0;
			`__TEMP_1 = b.length();`, // length = b.length();
			`map_condition_*A*:`,
			`if "__TEMP_0" < "__TEMP_1" then goto label map_body_*D*;`, // (i < length)
			`goto label map_break_*B*;`,
			`map_body_*D*:`,
			`__TEMP_2 = b[__TEMP_0];`, // curr = b[i];
			`__TEMP_3 = __TEMP_2;`, // tempvar = curr;
			`__TEMP_3 +`, // tempvar += 1;
			`= 1;`,
			`${RETURN} = __TEMP_3;`, // RETURN = tempvar;
			`end_of_script_***:`,
			`a.push(${RETURN});`, // ≈ c.push(RETURN);
			`${RETURN} = 0;`, // RETURN = 0;
			`map_continue_*C*:`,
			`__TEMP_0 +`, // i += 1;
			`= 1;`,
			`goto label map_condition_*A*;`,
			`map_break_*B*:`,
		],
	},
	array_write_exp: {
		input: [
			`a[0] = player x + 10;`,
			`b[two] = player y + 100;`,
			`c[10 + player x] = 99;`,
			`d[one + player y] = two + 3;`,
		],
		expected: [
			`__TEMP_0 = player x;`,
			`__TEMP_0 += 10;`,
			`a[0] = __TEMP_0;`,
			`__TEMP_0 = player y;`,
			`__TEMP_0 += 100;`,
			`b[two] = __TEMP_0;`,
			`__TEMP_0 = 10;`,
			`__TEMP_1 = player x;`,
			`__TEMP_0 += __TEMP_1;`,
			`c[__TEMP_0] = 99;`,
			`__TEMP_0 = one;`,
			`__TEMP_1 = player y;`,
			`__TEMP_0 += __TEMP_1;`,
			`__TEMP_1 = two;`,
			`__TEMP_1 += 3;`,
			`d[__TEMP_0] = __TEMP_1;`,
		],
	},
	array_write: {
		input: [
			//WIP
			`a[0] = 0;`,
			`b[one] = 1;`,
			`b[2] = two;`,
			`b[three] = threeee;`,
		],
		expected: [
			//WIP
			`a[0] = 0;`,
			`b[one] = 1;`,
			`b[2] = two;`,
			`b[three] = threeee;`,
		],
	},
	array_read: {
		input: [
			`varName1 = a[0];`,
			`varName2 = b[variableIndex];`,
			`varName3 = c[intExpVar + 10];`,
			`varName4 = d[player x + e[1000]];`,
		],
		expected: [
			`varName1 = a[0];`,
			`varName2 = b[variableIndex];`,
			`__TEMP_0 = intExpVar;`,
			`__TEMP_0 += 10;`,
			`varName3 = c[__TEMP_0];`,
			`__TEMP_0 = player x;`,
			`__TEMP_1 = e[1000];`,
			`__TEMP_0 += __TEMP_1;`,
			`varName4 = d[__TEMP_0];`,
		],
	},
	array_pop_and_length: {
		input: [
			`a.pop();`,
			`varName1 = b.pop();`,
			`varName2 = c.length();`,
			`varName3 = d.pop() + 10;`,
			`varName4 = e.pop_left() + player x;`,
		],
		expected: [
			`__RETURN_ = a.pop();`,
			`__RETURN_ = 0;`,
			`varName1 = b.pop();`,
			`varName2 = c.length();`,
			`varName3 = d.pop();`,
			`varName3 += 10;`,
			`varName4 = e.pop_left();`,
			`__TEMP_0 = player x;`,
			`varName4 += __TEMP_0;`,
		],
	},
	array_push: {
		input: [
			`c.push(one);`,
			`d.push(2);`,
			`e.push_left(three);`,
			`f.push_left(4);`,
			`g.push_left(player x + 999);`,
		],
		expected: [
			`c.push(one);`,
			`__RETURN_ = 0;`,
			`d.push(2);`,
			`__RETURN_ = 0;`,
			`e.push_left(three);`,
			`__RETURN_ = 0;`,
			`f.push_left(4);`,
			`__RETURN_ = 0;`,
			`__TEMP_0 = player x;`,
			`__TEMP_0 += 999;`,
			`g.push_left(__TEMP_0);`,
			`__RETURN_ = 0;`,
		],
	},
	array_slices_expressions: {
		input: [
			`array a = b.slice(player x + 10);`,
			`array c = d.slice(player x + 10, player y - 10);`,
		],
		expected: [
			`array a = [];`,
			`__TEMP_0 = player x;`,
			`__TEMP_0 += 10;`,
			`a = b.slice(__TEMP_0);`,
			`array c = [];`,
			`__TEMP_0 = player x;`,
			`__TEMP_0 += 10;`,
			`__TEMP_1 = player y;`,
			`__TEMP_1 -= 10;`,
			`c = d.slice(__TEMP_0, __TEMP_1);`,
		],
	},
	array_slices_strings: {
		input: [
			`array a = b.slice(zero);`,
			`array c = d.slice(one, two);`,
			`array e = f.slice(three, 4);`,
			`array g = h.slice(5, six);`,
		],
		expected: [
			`array a = [];`,
			`a = b.slice(zero);`,
			`array c = [];`,
			`c = d.slice(one, two);`,
			`array e = [];`,
			`__TEMP_0 = 4;`,
			`e = f.slice(three, __TEMP_0);`,
			`array g = [];`,
			`__TEMP_0 = 5;`,
			`g = h.slice(__TEMP_0, six);`,
		],
	},
	array_slices_numbers: {
		input: [
			`array a = b.slice();`,
			`array c = d.slice(0);`,
			`array e = f.slice(1);`,
			`array g = h.slice(2,3);`,
		],
		expected: [
			`array a = [];`,
			`a = b.slice();`,
			`array c = [];`,
			`c = d.slice();`,
			`array e = [];`,
			`e = f.slice(1);`,
			`array g = [];`,
			`g = h.slice(2, 3);`,
		],
	},
	new_array_with_method_chain: {
		input: [
			`array a = b.slice();`,
			`array c = d.sort().slice();`,
			`array e = f.slice().reverse();`,
			`array g = h.sort().slice().reverse();`,
			`array x = y.slice().sort().slice(4).reverse();`,
		],
		expected: [
			`array a = [];`,
			`a = b.slice();`,

			`array c = [];`,
			`d.sort();`,
			`c = d.slice();`,

			`array e = [];`,
			`e = f.slice();`,
			`e.reverse();`,

			`array g = [];`,
			`h.sort();`,
			`g = h.slice();`,
			`g.reverse();`,

			`array x = [];`,
			`x = y.slice();`,
			`x.sort();`,
			`x = x.slice(4);`,
			`x.reverse();`,
		],
	},
	new_array_with_initial_values: {
		input: [
			`array a = [];`,
			`array b = [1,2,3];`,
			`array c = [4,5,six];`,
			`array d = [7,8,nine+10];`,
		],
		expected: [
			`array a = [];`,
			`array b = [];`,
			`b.push(1);`,
			`b.push(2);`,
			`b.push(3);`,
			`array c = [];`,
			`c.push(4);`,
			`c.push(5);`,
			`c.push(six);`,
			`array d = [];`,
			`d.push(7);`,
			`d.push(8);`,
			`__TEMP_0 = nine;`,
			`__TEMP_0 += 10;`,
			`d.push(__TEMP_0);`,
		],
	},
	array_basic: {
		input: [`print array a;`, `delete array b;`],
		expected: [`print array a;`, `delete array b;`],
	},
	json_arbitrary: {
		input: [`json[{ "action": "NEW_ACTION", "entity": "%PLAYER%"}]`],
		expected: [`json[{`, `"action": "NEW_ACTION",`, `"entity": "%PLAYER%"`, `}]`],
	},
	fn_recursive: {
		pre: `
		fn get_diff_x ($e1, $e2) {
			if (entity $e1 x > entity $e2 x) {
				return entity $e1 x - entity $e2 x;
			} else {
				return entity $e2 x - entity $e1 x;
			}
		}
		fn get_diff_y ($e1, $e2) {
			if (entity $e1 y > entity $e2 y) {
				return entity $e1 y - entity $e2 y;
			} else {
				return entity $e2 y - entity $e1 y;
			}
		}
		fn get_manhattan_distance ($e1, $e2) {
			return get_diff_x($e1, $e2) + get_diff_y($e1, $e2);
		}`,
		input: [`mousegame_manhattan = get_manhattan_distance("%PLAYER%", Mouse);`],
		expected: [
			`"__TEMP_1" = player x;`,
			`"__TEMP_2" = entity "Mouse" x;`,
			`if "__TEMP_1" > "__TEMP_2" then goto label if_true_*A*;`,
			`"__TEMP_1" = entity "Mouse" x;`,
			`"__TEMP_2" = player x;`,
			`"__TEMP_1" -`,
			`= "__TEMP_2";`,
			`"__RETURN_" = "__TEMP_1";`,
			`goto label end_of_script_*C*;`,
			`goto label if_chain_rendezvous_*D*;`,
			`if_true_*A*:`,
			`"__TEMP_1" = player x;`,
			`"__TEMP_2" = entity "Mouse" x;`,
			`"__TEMP_1" -`,
			`= "__TEMP_2";`,
			`"__RETURN_" = "__TEMP_1";`,
			`goto label end_of_script_*C*;`,
			`if_chain_rendezvous_*D*:`,
			`end_of_script_*C*:`,
			`"__TEMP_0" = "__RETURN_";`,
			`"__RETURN_" = 0;`,
			`"__TEMP_2" = player y;`,
			`"__TEMP_3" = entity "Mouse" y;`,
			`if "__TEMP_2" > "__TEMP_3" then goto label if_true_*B*;`,
			`"__TEMP_2" = entity "Mouse" y;`,
			`"__TEMP_3" = player y;`,
			`"__TEMP_2" -`,
			`= "__TEMP_3";`,
			`"__RETURN_" = "__TEMP_2";`,
			`goto label end_of_script_*E*;`,
			`goto label if_chain_rendezvous_*F*;`,
			`if_true_*B*:`,
			`"__TEMP_2" = player y;`,
			`"__TEMP_3" = entity "Mouse" y;`,
			`"__TEMP_2" -`,
			`= "__TEMP_3";`,
			`"__RETURN_" = "__TEMP_2";`,
			`goto label end_of_script_*E*;`,
			`if_chain_rendezvous_*F*:`,
			`end_of_script_*E*:`,
			`"__TEMP_1" = "__RETURN_";`,
			`"__RETURN_" = 0;`,
			`"__TEMP_0" +`,
			`= "__TEMP_1";`,
			`"__RETURN_" = "__TEMP_0";`,
			`end_of_script_*G*:`,
			`"mousegame_manhattan" = "__RETURN_";`,
			`"__RETURN_" = 0;`,
		],
	},
	fn_basic: {
		pre: `
			waiting ($number) {
				wait $number;
			}
			teleportNextTo ($teleportee, $target, $waitTime) {
				entity $teleportee position = entity $target position;
				entity $teleportee x += 20;
				entity $teleportee direction = south;
				waiting($waitTime)
			}
			teleportAliceToBob {
				teleportNextTo(Alice, Bob, 50)
				teleportNextTo(Charlie, Denise, 40)
			}
		`,
		input: [
			// linter stop
			`teleportNextTo(Alice, Bob, 50)`,
			`teleportNextTo(Charlie, Denise, 40)`,
		],
		expected: [
			`"__TEMP_0" = entity "Bob" x;`,
			`entity "Alice" x = "__TEMP_0";`,
			`"__TEMP_0" = entity "Bob" y;`,
			`entity "Alice" y = "__TEMP_0";`,
			`"__TEMP_0" = entity "Alice" x;`,
			`"__TEMP_0" += 20;`,
			`entity "Alice" x = "__TEMP_0";`,
			`entity "Alice" direction = "south";`,
			`wait 50ms;`,
			`end_of_script_***:`,
			`end_of_script_***:`,
			`"__TEMP_0" = entity "Denise" x;`,
			`entity "Charlie" x = "__TEMP_0";`,
			`"__TEMP_0" = entity "Denise" y;`,
			`entity "Charlie" y = "__TEMP_0";`,
			`"__TEMP_0" = entity "Charlie" x;`,
			`"__TEMP_0" += 20;`,
			`entity "Charlie" x = "__TEMP_0";`,
			`entity "Charlie" direction = "south";`,
			`wait 40ms;`,
			`end_of_script_***:`,
			`end_of_script_***:`,
		],
	},
	return_binary_expression: {
		input: [`return player y + 100;`],
		expected: [
			// redundant but guarantees expressions don't collide
			`"__TEMP_0" = player y;`,
			`"__TEMP_0" += 100;`,
			`${RETURN} = "__TEMP_0";`,
		],
	},
	return_rng_alt: {
		input: [`return RNG!(3) + 100;`],
		expected: [
			// linter srsly
			`"__TEMP_0" ?= 3;`,
			`"__TEMP_0" += 100;`,
			`${RETURN} = "__TEMP_0";`,
		],
	},
	return_rng_pair: {
		input: [`return RNG!(1,=3);`],
		expected: [`"__TEMP_0 ?= 3;`, `"__TEMP_0 += 1;`, `${RETURN} = "__TEMP_0";`],
	},
	return_rng_single: {
		input: [`return RNG!(2);`],
		expected: [`"__TEMP_0" ?= 2;`, `${RETURN} = "__TEMP_0";`],
	},
	return_int_getable: {
		input: [`return player x;`],
		expected: [`"__TEMP_0" = player x;`, `${RETURN} = "__TEMP_0";`],
	},
	return_var: {
		input: [`return varName;`],
		expected: [`${RETURN} = "varName";`],
	},
	return_int: {
		input: [`return 7;`],
		expected: [`${RETURN} = 7;`],
	},
	int_getable_comparison: {
		input: [
			//WIP
			`if (player x < 100) { wait 10; }`,
			`if (player x < self x) { wait 100; }`,
		],
		expected: [
			// WIP
			`"__TEMP_0" = player x;`,
			`if "__TEMP_0" < 100 then goto label *A*`,
			`goto label *B*`,
			`*A*:`,
			`wait 10ms;`,
			`*B*:`,
			`"__TEMP_0" = player x;`,
			`"__TEMP_1" = self x;`,
			`if "__TEMP_0" < "__TEMP_1" then goto label *C*`,
			`goto label *D*`,
			`*C*:`,
			`wait 100ms;`,
			`*D*:`,
		],
	},
	entity_int_field_assignment: {
		input: [
			`player x = self x;`,
			`player x = varName;`,
			`player x = 0;`,
			`player x = self x + 100;`,
		],
		expected: [
			`"__TEMP_0" = self x;`,
			`player x = "__TEMP_0";`,
			`player x = varName;`,
			`player x = 0;`,
			`"__TEMP_0" = self x;`,
			`"__TEMP_0" += 100;`,
			`player x = "__TEMP_0";`,
		],
	},
	mainframe_watchbox: {
		input: [
			`if (player intersects geometry "mainframe-watchbox") {`,
			`	// :3 -- empty body!`,
			`} else if (player intersects geometry "mainframe-watchdonut") {`,
			`	player position -> geometry "mainframe-look-spot" origin over 300ms;`,
			`} else {`,
			`	player position -> geometry "mainframe-look-spot" origin over 500ms;`,
			`}`,
		],
		expected: [
			`if player intersects geometry "mainframe-watchbox" then goto label *A*;`,
			`if player intersects geometry "mainframe-watchdonut" then goto label *B*;`,
			`player position -> geometry "mainframe-look-spot" origin over 500ms;`,
			`goto label *C*;`,
			`*B*:`,
			`player position -> geometry "mainframe-look-spot" origin over 300ms;`,
			`goto label *C*;`,
			`*A*:`,
			`*C*:`,
			``,
		],
	},
	simple_copy: {
		input: ['wait 1;', 'no_arg_actions()', 'wait 2;'],
		expected: [
			'wait 1ms;',
			'save slot;',
			'close dialog;',
			'close serial_dialog;',
			'end_of_script_***',
			'wait 2ms;',
		],
	},
	if_single: {
		input: [
			'asdf:',
			'if debug_mode then goto script destinationScript;',
			'if debug_mode then goto destinationScript;',
			'if debug_mode then goto label asdf;',
			'if debug_mode then goto index 99;',
			'if true then goto index 99;',
			'if false then goto index 99;',
			'if 6 < 7 then goto index 99;',
			'if intName < 7 then goto index 99;',
			'if !debug_mode then goto index 99;',
			'if player glitched then goto index 99;',
			'if !player glitched then goto index 99;',
			'if player intersects geometry stick then goto index 99;',
			'if !player intersects geometry stick then goto index 99;',
			'if dialog open then goto index 99;',
			'if !dialog open then goto index 99;', // I'll allow it (preventing it is hard)
			'if serial_dialog open then goto index 99;',
			'if !serial_dialog open then goto index 99;', // I'll allow it
			'if button HAX pressed then goto index 99;',
			'if !button HAX pressed then goto index 99;',
			'if button HAX up then goto index 99;',
			'if button HAX down then goto index 99;',
			'if !button HAX up then goto index 99;', // I'll allow it
			'if !button HAX down then goto index 99;', // I'll allow it
		],
		expected: [
			'asdf:',
			'if debug_mode then goto script destinationScript;',
			'if debug_mode then goto script destinationScript;',
			'if debug_mode then goto label asdf;',
			'if debug_mode then goto index 99;',
			'goto index 99;',
			// (skip)
			'goto index 99;',
			'if "intName" < 7 then goto index 99;',
			'if !debug_mode then goto index 99;',
			'if player glitched then goto index 99;',
			'if !player glitched then goto index 99;',
			'if player intersects geometry "stick" then goto index 99;',
			'if !player intersects geometry "stick" then goto index 99;',
			'if dialog open then goto index 99;',
			'if dialog closed then goto index 99;',
			'if serial_dialog open then goto index 99;',
			'if serial_dialog closed then goto index 99;',
			'if button HAX pressed then goto index 99;',
			'if !button HAX pressed then goto index 99;',
			'if button HAX up then goto index 99;',
			'if button HAX down then goto index 99;',
			'if button HAX down then goto index 99;',
			'if button HAX up then goto index 99;',
		],
	},
	no_arg_actions: {
		input: [
			// SLOT_SAVE
			'save slot;',
			// CLOSE_DIALOG
			'close dialog;',
			// CLOSE_SERIAL_DIALOG
			'close serial_dialog;',
		],
	},
	simple_actions: {
		input: [
			// BLOCKING_DELAY
			'wait 1000ms;',
			// NON_BLOCKING_DELAY
			'block 999ms;',
			// SLOT_LOAD
			'load slot 0;',
			// SLOT_ERASE
			'erase slot 0;',
			// LOAD_MAP
			'load map goatMap;',
		],
	},
	SET_SCRIPT_PAUSE: {
		input: [
			// SET_SCRIPT_PAUSE
			'pause player on_look;',
			'pause self on_look;',
			'pause entity Bob on_look;',
			'pause entity "Bob" on_look;',
			'unpause player on_look;',
			'unpause self on_look;',
			'unpause entity Bob on_look;',
			'unpause entity "Bob" on_look;',
			'pause player on_interact;',
			'pause self on_interact;',
			'pause entity Bob on_interact;',
			'pause entity "Bob" on_interact;',
			'unpause player on_interact;',
			'unpause self on_interact;',
			'unpause entity Bob on_interact;',
			'unpause entity "Bob" on_interact;',
			'pause player on_tick;',
			'pause self on_tick;',
			'pause entity Bob on_tick;',
			'pause entity "Bob" on_tick;',
			'unpause player on_tick;',
			'unpause self on_tick;',
			'unpause entity Bob on_tick;',
			'unpause entity "Bob" on_tick;',
			'pause map on_tick;',
			'unpause map on_tick;',
			'pause map on_load;',
			'unpause map on_load;',
			'pause map on_command;',
			'unpause map on_command;',
		],
	},
	commands_and_aliases: {
		input: [
			// REGISTER_SERIAL_DIALOG_COMMAND
			'command callGoat = goatScript;',
			'command callGoat fail = goatScript;',
			// UNREGISTER_SERIAL_DIALOG_COMMAND
			'delete command callGoat fail;',
			'delete command callGoat;',
			// REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT
			'command callGoat + billy = billyScript;',
			// UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT
			'delete command callGoat + billy;',
			// REGISTER_SERIAL_DIALOG_COMMAND_ALIAS
			'alias g = callGoat;',
			// UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS
			'delete alias g;',
			// SET_SERIAL_DIALOG_COMMAND_VISIBILITY
			'hide command callGoat;',
			'unhide command callGoat;',
		],
	},
	set_position: {
		input: [
			// SET_CAMERA_TO_FOLLOW_ENTITY
			'camera = player position;',
			// TELEPORT_CAMERA_TO_GEOMETRY
			'camera = geometry stick;',
			// TELEPORT_ENTITY_TO_GEOMETRY
			'player position = geometry stick;',
			// SET_ENTITY_DIRECTION_TARGET_ENTITY
			'self direction = player;',
			'entity Bender direction = player;',
			'player direction = player;',
			'player direction = self;',
			'self direction = self;',
			'entity Bender direction = self;',
			'player direction = entity Bob;',
			'self direction = entity Bob;',
			'entity Bender direction = entity Bob;',
			// SET_ENTITY_DIRECTION_TARGET_GEOMETRY
			'player direction = geometry stick;',
			'self direction = geometry stick;',
			'entity Bender direction = geometry stick;',
		],
	},
	set_position_over_time: {
		input: [
			// WALK_ENTITY_TO_GEOMETRY
			'player position -> geometry stick origin over 1ms;',
			'self position -> geometry stick origin over 1ms;',
			'entity Oscar position -> geometry stick origin over 1ms;',
			// WALK_ENTITY_ALONG_GEOMETRY
			'player position -> geometry stick length over 1ms;',
			'self position -> geometry stick length over 1ms;',
			'entity Oscar position -> geometry stick length over 1ms;',
			// LOOP_ENTITY_ALONG_GEOMETRY
			'player position -> geometry stick length over 1ms forever;',
			'self position -> geometry stick length over 1ms forever;',
			'entity Oscar position -> geometry stick length over 1ms forever;',
			// PAN_CAMERA_TO_ENTITY
			'camera -> player position over 1ms;',
			'camera -> self position over 1ms;',
			'camera -> entity Bob position over 1ms;',
			// PAN_CAMERA_TO_GEOMETRY
			'camera -> geometry stick origin over 1ms;',
			// PAN_CAMERA_ALONG_GEOMETRY
			'camera -> geometry stick length over 1ms;',
			// LOOP_CAMERA_ALONG_GEOMETRY
			'camera -> geometry stick length over 1ms forever;',
		],
	},
	other_do_over_time: {
		input: [
			// SET_SCREEN_SHAKE
			'camera shake -> 20ms 50px over 100ms;',
			// SCREEN_FADE_IN
			'camera fade in -> #000000 over 100ms;',
			// SCREEN_FADE_OUT
			'camera fade out -> #FFFFFF over 100ms;',
			// PLAY_ENTITY_ANIMATION
			'player animation -> 0 4x;',
			'self animation -> 0 4x;',
			'entity George animation -> 0 4x;',
		],
	},
	simpleTranslations: {
		input: [
			// seconds -> milliseconds
			`wait 1s;`,
			// color words -> hex
			'camera fade in -> white over 1s;',
			'camera fade in -> black over 1s;',
			'camera fade in -> red over 1s;',
			'camera fade in -> green over 1s;',
			'camera fade in -> blue over 1s;',
			'camera fade in -> magenta over 1s;',
			'camera fade in -> cyan over 1s;',
			'camera fade in -> yellow over 1s;',
			'camera fade in -> #ABC over 1;',
			'camera fade in -> #def over 1;',
			// counts
			'player animation -> 0 once;',
			'player animation -> 0 twice;',
			'player animation -> 0 thrice;',
			// pix -> px
			'camera shake -> 2s 50pix over 1000;',
		],
		expected: [
			`wait 1000ms;`,
			'camera fade in -> #FFFFFF over 1000ms;',
			'camera fade in -> #000000 over 1000ms;',
			'camera fade in -> #FF0000 over 1000ms;',
			'camera fade in -> #00FF00 over 1000ms;',
			'camera fade in -> #0000FF over 1000ms;',
			'camera fade in -> #FF00FF over 1000ms;',
			'camera fade in -> #00FFFF over 1000ms;',
			'camera fade in -> #FFFF00 over 1000ms;',
			'camera fade in -> #AABBCC over 1ms;',
			'camera fade in -> #ddeeff over 1ms;',
			'player animation -> 0 1x;',
			'player animation -> 0 2x;',
			'player animation -> 0 3x;',
			'camera shake -> 2000ms 50px over 1000ms;',
		],
	},
	set_string: {
		input: [
			// SET_WARP_STATE
			'warp_state = goat;',
			// SET_ENTITY_NAME
			'player name = goat;',
			'self name = goat;',
			'entity Billy name = goat;',
			// SET_ENTITY_TYPE
			'player type = goat;',
			'self type = goat;',
			'entity Billy type = goat;',
			// SET_ENTITY_PATH
			'player path = goat;',
			'self path = goat;',
			'entity Billy path = goat;',
			// SET_ENTITY_DIRECTION
			'player direction = north;',
			'self direction = north;',
			'entity Billy direction = north;',
			// SET_ENTITY_LOOK_SCRIPT
			'player on_look = goatScript;',
			'self on_look = goatScript;',
			'entity Billy on_look = goatScript;',
			// SET_ENTITY_INTERACT_SCRIPT
			'player on_interact = goatScript;',
			'self on_interact = goatScript;',
			'entity Billy on_interact = goatScript;',
			// SET_ENTITY_TICK_SCRIPT
			'player on_tick = goatScript;',
			'self on_tick = goatScript;',
			'entity Billy on_tick = goatScript;',
			// SET_MAP_TICK_SCRIPT
			'map on_tick = goatScript;',
		],
	},
	set_bool_exp_ok: {
		input: [
			// SET_SAVE_FLAG
			'flagName = true;',
			// SET_HEX_EDITOR_STATE
			'hex_editor = true;',
			// SET_HEX_EDITOR_DIALOG_MODE
			'hex_dialog_mode = true;',
			// SET_HEX_EDITOR_CONTROL
			'hex_control = true;',
			// SET_HEX_EDITOR_CONTROL_CLIPBOARD
			'hex_clipboard = false;',
			// SET_SERIAL_DIALOG_CONTROL
			'serial_control = false;',
			// SET_PLAYER_CONTROL
			'player_control = false;',
			// SET_LIGHTS_CONTROL
			'lights_control = false;',
			// SET_LIGHTS_STATE
			'light MEM1 = true;',
			// SET_ENTITY_GLITCHED
			'entity Bob glitched = false;',
		],
	},
	set_bool_exp_ok_translations: {
		input: [
			'flagName = true;',
			'hex_editor = on;',
			'hex_dialog_mode = down;',
			'hex_control = open;',
			'hex_clipboard = false;',
			'serial_control = off;',
			'player_control = up;',
			'lights_control = closed;',
			'light MEM1 = on;',
			'entity Bob glitched = true;',
		],
		expected: [
			'flagName = true;',
			'hex_editor = true;',
			'hex_dialog_mode = true;',
			'hex_control = true;',
			'hex_clipboard = false;',
			'serial_control = false;',
			'player_control = false;',
			'lights_control = false;',
			'light MEM1 = true;',
			'entity Bob glitched = true;',
		],
	},
	bool_exp_branch_debug_mode: {
		input: [
			// CHECK_DEBUG_MODE
			'entity Bob glitched = debug_mode;',
			'entity Bob glitched = !debug_mode;',
			'entity Bob glitched = !(debug_mode);',
		],
		expected: [
			'if debug_mode then goto label if_*A*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity Bob glitched = true;',
			'rendezvous_*AA*:',

			'if !debug_mode then goto label if_*B*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity Bob glitched = true;',
			'rendezvous_*BB*:',

			'if !debug_mode then goto label if_*C*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity Bob glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	bool_exp_branch_dialog_open: {
		input: [
			// CHECK_DIALOG_OPEN
			'entity Bob glitched = dialog open;',
			'entity Bob glitched = !dialog open;',
			'entity Bob glitched = !(dialog open);',
			'entity Bob glitched = dialog closed;',
			'entity Bob glitched = !dialog closed;',
			'entity Bob glitched = !(dialog closed);',
		],
		expected: [
			'if dialog open then goto label if_*A*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity Bob glitched = true;',
			'rendezvous_*AA*:',

			'if dialog closed then goto label if_*B*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity Bob glitched = true;',
			'rendezvous_*BB*:',

			'if dialog closed then goto label if_*C*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity Bob glitched = true;',
			'rendezvous_*CC*:',

			'if dialog closed then goto label if_*D*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*DD*;',
			'if_*D*:',
			'entity Bob glitched = true;',
			'rendezvous_*DD*:',

			'if dialog open then goto label if_*E*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*EE*;',
			'if_*E*:',
			'entity Bob glitched = true;',
			'rendezvous_*EE*:',

			'if dialog open then goto label if_*F*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*FF*;',
			'if_*F*:',
			'entity Bob glitched = true;',
			'rendezvous_*FF*:',
		],
	},
	bool_exp_branch_serial_dialog_open: {
		input: [
			// CHECK_SERIAL_DIALOG_OPEN
			'entity Bob glitched = serial_dialog open;',
			'entity Bob glitched = !serial_dialog open;',
			'entity Bob glitched = !(serial_dialog open);',
			'entity Bob glitched = serial_dialog closed;',
			'entity Bob glitched = !serial_dialog closed;',
			'entity Bob glitched = !(serial_dialog closed);',
		],
		expected: [
			'if serial_dialog open then goto label if_*A*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity Bob glitched = true;',
			'rendezvous_*AA*:',

			'if serial_dialog closed then goto label if_*B*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity Bob glitched = true;',
			'rendezvous_*BB*:',

			'if serial_dialog closed then goto label if_*C*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity Bob glitched = true;',
			'rendezvous_*CC*:',

			'if serial_dialog closed then goto label if_*D*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*DD*;',
			'if_*D*:',
			'entity Bob glitched = true;',
			'rendezvous_*DD*:',

			'if serial_dialog open then goto label if_*E*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*EE*;',
			'if_*E*:',
			'entity Bob glitched = true;',
			'rendezvous_*EE*:',

			'if serial_dialog open then goto label if_*F*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*FF*;',
			'if_*F*:',
			'entity Bob glitched = true;',
			'rendezvous_*FF*:',
		],
	},
	bool_exp_branch_check_flag: {
		input: [
			// CHECK_SAVE_FLAG
			'entity Bob glitched = flagName;',
			'entity Bob glitched = !flagName;',
			'entity Bob glitched = !(flagName);',
		],
		expected: [
			'if "flagName" then goto label if_*A*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity Bob glitched = true;',
			'rendezvous_*AA*:',

			'if !"flagName" then goto label if_*B*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity Bob glitched = true;',
			'rendezvous_*BB*:',

			'if !"flagName" then goto label if_*C*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity Bob glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	bool_exp_branch_button_press: {
		input: [
			// CHECK_FOR_BUTTON_PRESS
			'entity Bob glitched = button MEM1 pressed;',
			'entity Bob glitched = !button MEM1 pressed;',
			'entity Bob glitched = !(button MEM1 pressed);',
		],
		expected: [
			'if button MEM1 pressed then goto label if_*A*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity Bob glitched = true;',
			'rendezvous_*AA*:',

			'if !button MEM1 pressed then goto label if_*B*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity Bob glitched = true;',
			'rendezvous_*BB*:',

			'if !button MEM1 pressed then goto label if_*C*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity Bob glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	bool_exp_branch_button_state: {
		input: [
			// CHECK_FOR_BUTTON_STATE
			'entity Bob glitched = button MEM1 down;',
			'entity Bob glitched = !button MEM1 down;',
			'entity Bob glitched = !(button MEM1 down);',
			'entity Bob glitched = button MEM1 up;',
			'entity Bob glitched = !button MEM1 up;',
			'entity Bob glitched = !(button MEM1 up);',
		],
		expected: [
			'if button MEM1 down then goto label if_*A*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity Bob glitched = true;',
			'rendezvous_*AA*:',

			'if button MEM1 up then goto label if_*B*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity Bob glitched = true;',
			'rendezvous_*BB*:',

			'if button MEM1 up then goto label if_*C*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity Bob glitched = true;',
			'rendezvous_*CC*:',

			'if button MEM1 up then goto label if_*D*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*DD*;',
			'if_*D*:',
			'entity Bob glitched = true;',
			'rendezvous_*DD*:',

			'if button MEM1 down then goto label if_*E*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*EE*;',
			'if_*E*:',
			'entity Bob glitched = true;',
			'rendezvous_*EE*:',

			'if button MEM1 down then goto label if_*F*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*FF*;',
			'if_*F*:',
			'entity Bob glitched = true;',
			'rendezvous_*FF*:',
		],
	},
	bool_exp_branch_intersects: {
		input: [
			// CHECK_IF_ENTITY_IS_IN_GEOMETRY
			'entity Bob glitched = player intersects geometry BOX;',
			'entity Bob glitched = !player intersects geometry BOX;',
			'entity Bob glitched = !(player intersects geometry BOX);',
		],
		expected: [
			'if player intersects geometry "BOX" then goto label if_*A*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity Bob glitched = true;',
			'rendezvous_*AA*:',

			'if !player intersects geometry "BOX" then goto label if_*B*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity Bob glitched = true;',
			'rendezvous_*BB*:',

			'if !player intersects geometry "BOX" then goto label if_*C*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity Bob glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	bool_exp_branch_glitched: {
		input: [
			// CHECK_ENTITY_GLITCHED
			'entity Bob glitched = player glitched;',
			'entity Bob glitched = !player glitched;',
			'entity Bob glitched = !(player glitched);',
		],
		expected: [
			'if player glitched then goto label if_*A*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity Bob glitched = true;',
			'rendezvous_*AA*:',

			'if !player glitched then goto label if_*B*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity Bob glitched = true;',
			'rendezvous_*BB*:',

			'if !player glitched then goto label if_*C*;',
			'entity Bob glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity Bob glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	bool_exp_simple_or: {
		input: ['entity Bob glitched = debug_mode || isGoatGrumpy;'],
		expected: [
			'if debug_mode then goto label if_***;',
			'if "isGoatGrumpy" then goto label if_***;',
			'entity Bob glitched = false;',
			'goto label rendezvous_***;',
			'if_***:',
			'entity Bob glitched = true;',
			'rendezvous_***:',
		],
	},
	bool_exp_simple_and: {
		input: ['entity Bob glitched = debug_mode && isGoatGrumpy;'],
		expected: [
			'if debug_mode then goto label if_true_*A*;',
			'goto label rendezvous_*A*;',
			'if_true_*A*:',
			'if "isGoatGrumpy" then goto label if_true_*B*;',
			'rendezvous_*A*:',
			"entity 'Bob' glitched = false;",
			'goto label rendezvous_*Y*;',
			'if_true_*B*:',
			"entity 'Bob' glitched = true;",
			'rendezvous_*Y*:',
		],
	},
	bool_exp_invert_or: {
		input: ['entity Bob glitched = !(debug_mode || isGoatGrumpy);'],
		expected: [
			'if !debug_mode then goto label if_true_*A*;',
			'goto label rendezvous_*A*;',
			'if_true_*A*:',
			'if !"isGoatGrumpy" then goto label if_true_*B*;',
			'rendezvous_*A*:',
			"entity 'Bob' glitched = false;",
			'goto label rendezvous_*Y*;',
			'if_true_*B*:',
			"entity 'Bob' glitched = true;",
			'rendezvous_*Y*:',
		],
	},
	bool_exp_invert_and: {
		input: ['entity Bob glitched = !(debug_mode && isGoatGrumpy);'],
		expected: [
			'if !debug_mode then goto label if_true_*A*;',
			'if !"isGoatGrumpy" then goto label if_true_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*Y*;',
			'if_true_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*Y*:',
		],
	},
	set_int_exp_not_ok: {
		input: [
			// SET_ENTITY_X
			'player x = 1;',
			// SET_ENTITY_Y
			'player y = 1;',
			// SET_ENTITY_PRIMARY_ID
			'player primary_id = 1;',
			// SET_ENTITY_SECONDARY_ID
			'player secondary_id = 1;',
			// SET_ENTITY_PRIMARY_ID_TYPE
			'player primary_id_type = 1;',
			// SET_ENTITY_CURRENT_ANIMATION
			'player current_animation = 1;',
			// SET_ENTITY_CURRENT_FRAME
			'player animation_frame = 1;',
			// SET_ENTITY_MOVEMENT_RELATIVE
			'player strafe = 1;',
			// SET_ENTITY_DIRECTION_RELATIVE
			// TODO: ??????????????
		],
	},
	set_int_exp_ok: {
		input: [
			// MUTATE_VARIABLE
			'"goatCount" = 0;',

			// COPY_VARIABLE
			'"goatCount" = player x;',
			'player y = "goatCount";',
		],
	},
	int_exp_chain_literal_getable: {
		input: ['goatCount = 1 + player x;'],
		expected: ['goatCount = 1;', '*A* = player x;', 'goatCount += *A*;'],
	},
	int_exp_chain_getable_getable: {
		input: ['goatCount = player y + player x;'],
		expected: [
			'"goatCount" = player y;',
			'*A* = player x;',
			'"goatCount" += *A*;',
			// '*A* = player y;',
			// '*B* = player x;',
			// '*A* += *B*;',
			// '"goatCount" = *A*;',
		],
	},
	int_exp_chain_literal_getable_mult: {
		input: ['goatCount = 1 + player x * 99;'],
		expected: ['"goatCount = 1;', '*A* = player x;', '*A* *= 99;', '"goatCount += *B*;'],
	},
	int_exp_chain_literal_getable_mult_parens: {
		input: ['goatCount = (1 + player x) * 99;'],
		expected: [
			'"goatCount" = 1;',
			'*A* = player x;',
			'"goatCount" += *A*;',
			'"goatCount" *= 99;',
		],
	},
	ambiguous_bool_single_invert: {
		input: ['goatCount = !notAmbiguous;'],
		expected: [
			'if !"notAmbiguous" then goto label if_***;',
			'"goatCount" = false;',
			'goto label rendezvous_***;',
			'if_***:',
			'"goatCount" = true;',
			'rendezvous_***:',
		],
	},
	ambiguous_bool_disambiguate: {
		input: ['goatCount = !!notAmbiguous;'],
		expected: [
			'if "notAmbiguous" then goto label if_***;',
			'"goatCount" = false;',
			'goto label rendezvous_***;',
			'if_***:',
			'"goatCount" = true;',
			'rendezvous_***:',
		],
	},
	int_expression_invert_comparison_lt: {
		input: ['entity Bob glitched = intName < 6;', 'entity Bob glitched = !(intName < 6);'],
		expected: [
			'if "intName" < 6 then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if "intName" >= 6 then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BV*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*VB*:',
		],
	},
	int_expression_invert_comparison_lteq: {
		input: ['entity Bob glitched = intName <= 6;', 'entity Bob glitched = !(intName <= 6);'],
		expected: [
			'if "intName" <= 6 then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if "intName" > 6 then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',
		],
	},
	int_expression_invert_comparison_gt: {
		input: ['entity Bob glitched = intName > 6;', 'entity Bob glitched = !(intName > 6);'],
		expected: [
			'if "intName" > 6 then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if "intName" <= 6 then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',
		],
	},
	int_expression_invert_comparison_gteq: {
		input: ['entity Bob glitched = intName >= 6;', 'entity Bob glitched = !(intName >= 6);'],
		expected: [
			'if "intName" >= 6 then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if "intName" < 6 then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',
		],
	},
	int_expression_invert_comparison_eq: {
		input: ['entity Bob glitched = intName == 6;', 'entity Bob glitched = !(intName == 6);'],
		expected: [
			'if "intName" == 6 then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if "intName" != 6 then goto label if_*C*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	int_expression_invert_comparison_noteq: {
		input: ['entity Bob glitched = intName != 6;', 'entity Bob glitched = !(intName != 6);'],
		expected: [
			'if "intName" != 6 then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',

			'if "intName" == 6 then goto label if_*D*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*DD*;',
			'if_*D*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*DD*:',
		],
	},
	branch_on_string_equality_warp_state: {
		input: [
			'entity Bob glitched = warp_state == "landing";',
			'entity Bob glitched = !(warp_state == "landing");',
			'entity Bob glitched = warp_state != "landing";',
		],
		expected: [
			'if warp_state == "landing" then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if warp_state != "landing" then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',

			'if warp_state != "landing" then goto label if_*C*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	branch_on_string_equality_name: {
		input: [
			'entity Bob glitched = player name == goat;',
			'entity Bob glitched = !(player name == goat);',
			'entity Bob glitched = player name != goat;',
		],
		expected: [
			'if player name == "goat" then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if player name != "goat" then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',

			'if player name != "goat" then goto label if_*C*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	branch_on_string_equality_type: {
		input: [
			'entity Bob glitched = player type == goat;',
			'entity Bob glitched = !(player type == goat);',
			'entity Bob glitched = player type != goat;',
		],
		expected: [
			'if player type == "goat" then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if player type != "goat" then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',

			'if player type != "goat" then goto label if_*C*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	branch_on_string_equality_interact: {
		input: [
			'entity Bob glitched = player on_interact == goat;',
			'entity Bob glitched = !(player on_interact == goat);',
			'entity Bob glitched = player on_interact != goat;',
		],
		expected: [
			'if player on_interact == "goat" then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if player on_interact != "goat" then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',

			'if player on_interact != "goat" then goto label if_*C*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	branch_on_string_equality_tick: {
		input: [
			'entity Bob glitched = player on_tick == goat;',
			'entity Bob glitched = !(player on_tick == goat);',
			'entity Bob glitched = player on_tick != goat;',
		],
		expected: [
			'if player on_tick == "goat" then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if player on_tick != "goat" then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',

			'if player on_tick != "goat" then goto label if_*C*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	branch_on_string_equality_look: {
		input: [
			'entity Bob glitched = player on_look == goat;',
			'entity Bob glitched = !(player on_look == goat);',
			'entity Bob glitched = player on_look != goat;',
		],
		expected: [
			'if player on_look == "goat" then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if player on_look != "goat" then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',

			'if player on_look != "goat" then goto label if_*C*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	branch_on_string_equality_direction: {
		input: [
			'entity Bob glitched = player direction == north;',
			'entity Bob glitched = !(player direction == east);',
			'entity Bob glitched = player direction != south;',
		],
		expected: [
			'if player direction == north then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if player direction != east then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',

			'if player direction != south then goto label if_*C*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	branch_on_string_equality_path: {
		input: [
			'entity Bob glitched = player path == longWalk;',
			'entity Bob glitched = !(player path == longWalk);',
			'entity Bob glitched = player path != longWalk;',
		],
		expected: [
			'if player path == "longWalk" then goto label if_*A*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*AA*;',
			'if_*A*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*AA*:',

			'if player path != "longWalk" then goto label if_*B*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*BB*;',
			'if_*B*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*BB*:',

			'if player path != "longWalk" then goto label if_*C*;',
			'entity "Bob" glitched = false;',
			'goto label rendezvous_*CC*;',
			'if_*C*:',
			'entity "Bob" glitched = true;',
			'rendezvous_*CC*:',
		],
	},
	while_simple: {
		input: ['while (player glitched) { wait 1; }'],
		expected: [
			'while_condition_***:',
			'if player glitched then goto label while_body_***;',
			'goto label while_break_***;',
			'while_body_***:',
			'wait 1ms;',
			'while_continue_***:',
			'goto label while_condition_***;',
			'while_break_***:',
		],
	},
	number_comparison: {
		input: ['player_control = 7 < 5;', 'player_control = 7 == 7;', 'player_control = 7 != 5;'],
		expected: ['player_control = false;', 'player_control = true;', 'player_control = true;'],
	},
	spread_simple: {
		input: ['wait [1ms, 2ms];', '[player x, self y] = [10, intName];'],
		expected: ['wait 1ms;', 'wait 2ms;', 'player x = 10;', 'self y = intName;'],
	},
	rand_simple: {
		input: [
			'rand!(',
			'	wait [1ms, 2ms];',
			'	close dialog;',
			'	[player x, self y] = [10, intName];',
			')',
		],
		expected: [
			'"__TEMP_0" ?= 2;',
			'if "__TEMP_0" == 0 then goto label if_*A*;',
			'if "__TEMP_0" == 1 then goto label if_*B*;',
			'goto label rand_macro_rendezvous_*C*;',
			'if_*B*:',
			'wait 2ms;',
			'close dialog',
			'self y = intName;',
			'goto label rand_macro_rendezvous_*C*;',
			'if_*A*:',
			'wait 1ms;',
			'close dialog',
			'player x = 10;',
			'rand_macro_rendezvous_*C*:',
		],
	},
	silence_warning_bodge: {
		input: [
			'intName = intName2+0;',
			'intName = intName2-0;',
			'intName = intName2*1;',
			'intName = intName2/1;',
		],
		expected: [
			'"intName" = "intName2";',
			'"intName" = "intName2";',
			'"intName" = "intName2";',
			'"intName" = "intName2";',
		],
	},
};
