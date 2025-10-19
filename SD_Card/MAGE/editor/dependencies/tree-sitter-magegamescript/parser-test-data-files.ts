type TestConstants = {
	debug?: { fileName: string };
	value: number | string | boolean;
};
type TestDialogs = {
	dialogs: Record<string, string | string[] | number>[];
};
export type TestExpected = {
	scripts?: Record<string, string>;
	constants?: Record<string, TestConstants>;
	dialogs?: Record<string, TestDialogs>;
};
type TestFileMapEntry = {
	fileText: string;
	expected: TestExpected;
};
export const fileTests: Record<string, TestFileMapEntry> = {
	'string_in_fn_call.mgs': {
		fileText: `
			fn store_string ($string) { warp_state = $string; }
			string_in_args { store_string("asdf"); }
		`,
		expected: {
			scripts: {
				string_in_args: `"string_in_args" {
					warp_state = "asdf";
				}`,
			},
		},
	},
	'int_exp_in_fn_call.mgs': {
		fileText: `
			fn store_n ($a) { stored = $a*1; }
			int_exp_in_fn_call { store_n(player x + 7) }
		`,
		expected: {
			scripts: {
				int_exp_in_fn_call: `"int_exp_in_fn_call" {
					__TEMP_0 = player x;
					__TEMP_0 += 7;
					stored = __TEMP_0;
				}`,
			},
		},
	},
	'script_def_in_fn_call.mgs': {
		fileText: `
			fn make_command ($commandName, $arg) {
				command $commandName = { wait $arg; };
			}
			script_def_in_fn_call {
				make_command(wait_one, 1)
				make_command(wait_two, 2)
			}
		`,
		expected: {
			scripts: {
				script_def_in_fn_call: `"script_def_in_fn_call" {
					command "wait_one" = "script_def_in_fn_call.mgs-2:27-call1";
					command "wait_two" = "script_def_in_fn_call.mgs-2:27-call2";
				}`,
				'script_def_in_fn_call.mgs-2:27-call1': `"script_def_in_fn_call.mgs-2:27-call1" {
					wait 1ms;
				}`,
				'script_def_in_fn_call.mgs-2:27-call2': `"script_def_in_fn_call.mgs-2:27-call2" {
					wait 2ms;
				}`,
			},
		},
	},
	'fn_call_in_script_def.mgs': {
		fileText: `
			fn do_wait ($arg) { wait $arg; }
			fn_call_in_script_def {
				command wait_one = { do_wait(1) };
				command wait_two = { do_wait(2) };
				command wait_twice = { do_wait(2) do_wait(2) };
			}
		`,
		expected: {
			scripts: {
				fn_call_in_script_def: `"fn_call_in_script_def" {
					command "wait_one" = "fn_call_in_script_def.mgs-3:23";
					command "wait_two" = "fn_call_in_script_def.mgs-4:23";
					command "wait_twice" = "fn_call_in_script_def.mgs-5:25";
				}`,
				'fn_call_in_script_def.mgs-3:23': `"fn_call_in_script_def.mgs-3:23" {
					wait 1ms;
				}`,
				'fn_call_in_script_def.mgs-4:23': `"fn_call_in_script_def.mgs-4:23" {
					wait 2ms;
				}`,
				'fn_call_in_script_def.mgs-5:25': `"fn_call_in_script_def.mgs-5:25" {
					wait 2ms;
					wait 2ms;
				}`,
			},
		},
	},
	'fn_returns.mgs': {
		fileText: `
			addThree ($n) {
				return $n + 3;
			}
			setTallyToThirteen {
				tally = addThree(10);
			}
			getHundred {
				return 100;
			}
			setVarToHundred {
				var = getHundred();
			}
			returnsNothing {
				wait 123;
			}
			invalidReturn {
				random = returnsNothing();
			}
		`,
		expected: {
			scripts: {
				setTallyToThirteen: `"setTallyToThirteen" {
					"__TEMP_0" = 10;
					"__TEMP_0" += 3;
					"__RETURN_" = "__TEMP_0";
					"tally" = "__RETURN_";
					"__RETURN_" = 0;
				}`,
				getHundred: `"getHundred" {
					"__RETURN_" = 100;
				}`,
				setVarToHundred: `"setVarToHundred" {
					"__RETURN_" = 100;
					"var" = "__RETURN_";
					"__RETURN_" = 0;
				}`,
				returnsNothing: `"returnsNothing" {
					wait 123ms;
				}`,
				invalidReturn: `"invalidReturn" {
					wait 123ms;
					"random" = "__RETURN_";
					"__RETURN_" = 0;
				}`,
			},
		},
	},
	'define_constant.mgs': {
		fileText: `
			$magicNumber = 76;
		`,
		expected: {
			scripts: {},
			constants: {
				$magicNumber: {
					debug: { fileName: 'define_constant.mgs' },
					value: 76,
				},
			},
		},
	},
	'constants_include.mgs': {
		fileText: `
			include "define_constant.mgs";
			$trombones = $magicNumber;
			$hamburgers = "steamed hams";
			"used_double_constant" {
				player x = $trombones;
				warp_state = $hamburgers;
			}
		`,
		expected: {
			scripts: {
				used_double_constant: `"used_double_constant" {
					player x = 76;
					warp_state = "steamed hams";
				}`,
			},
			constants: {
				$magicNumber: {
					debug: { fileName: 'header.mgs' },
					value: 76,
				},
				$trombones: {
					debug: { fileName: 'constants_include.mgs' },
					value: 76,
				},
				$hamburgers: {
					debug: { fileName: 'constants_include.mgs' },
					value: 'steamed hams',
				},
			},
		},
	},
	'basic_dialog.mgs': {
		fileText: `dialog "bobIntro" {
			Bob "Well, hi there!"
			Jackob "Oh!"
		}`,
		expected: {
			scripts: {},
			dialogs: {
				bobIntro: {
					dialogs: [
						{
							entity: 'Bob',
							alignment: 'BOTTOM_LEFT',
							messages: ['Well, hi there!'],
						},
						{
							alignment: 'BOTTOM_LEFT',
							entity: 'Jackob',
							messages: ['Oh!'],
						},
					],
				},
			},
		},
	},
	'dialog_wrapping.mgs': {
		fileText: `dialog "wrapBasics" {
			Bob wrap 20
			"12345678901234567890"
			"123456789012\\%4567890"
			"123456789012\\%45678901"
			"123456789012\\% 567890"
			"123456789012\\% 5678901"
			"%12% a b c d e f g h"
			"%1234% a b c d e f g h"
			"%123456% a b c d e f g h"
			"%12345678% a b c d e f g h"
			"%1234567890% a b c d e f g h"
			"$1$ a b c d e f g h"
			"$123$ a b c d e f g h"
			"$12345$ a b c d e f g h"
			"$1234567$ a b c d e f g h"
			"$123456789$ a b c d e f g h"
		}`,
		expected: {
			scripts: {},
			dialogs: {
				wrapBasics: {
					dialogs: [
						{
							entity: 'Bob',
							alignment: 'BOTTOM_LEFT',
							messages: [
								'12345678901234567890',
								'123456789012\\%4567890',
								'123456789012\\%45678901',
								'123456789012\\% 567890',
								'123456789012\\%\n5678901',
								'%12% a b c d\ne f g h',
								'%1234% a b c d\ne f g h',
								'%123456% a b c d\ne f g h',
								'%12345678% a b c d\ne f g h',
								'%1234567890% a b c d\ne f g h',
								'$1$ a b c d e f g\nh',
								'$123$ a b c d e f g\nh',
								'$12345$ a b c d e f g\nh',
								'$1234567$ a b c d e f g\nh',
								'$123456789$ a b c d e f g\nh',
							],
						},
					],
				},
			},
		},
	},
};
