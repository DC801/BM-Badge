export type ErrorTest = {
	testText: string;
	expectedWarnings: string[];
	expectedErrors: string[];
};
export const errorTests: Record<string, ErrorTest> = {
	copy_script_recursion_detection: {
		testText: `
			inner { outer(); }
			outer { inner(); }
		`,
		expectedWarnings: [],
		expectedErrors: ['recursive copy_script'],
	},
	fn_call_recursion_detection: {
		testText: `
			fn inner ($n) { outer($n); }
			fn outer ($n) { inner($n); }
			fn_call_recursion_detection { outer("asdf"); }
		`,
		expectedWarnings: [],
		expectedErrors: ['recursive fn call'],
	},
	json_known_action_wrong_param: {
		testText: `_{
			json[{"action":"BLOCKING_DELAY", "ddddduration":100}]
		}`,
		expectedWarnings: [],
		expectedErrors: ['value wrong type'],
	},
	json_trailing_comma_inner: {
		testText: `_{
			json[{"action":"BLOCKING_DELAY", "duration":100,}]
		}`,
		expectedWarnings: [],
		expectedErrors: ['unexpected token'],
	},
	json_trailing_comma: {
		testText: `_{
			json[{"action":"BLOCKING_DELAY", "duration":100},]
		}`,
		expectedWarnings: [],
		expectedErrors: ['unexpected token'],
	},
	wrong_spread_size: {
		testText: `_{
			rand!(wait [1,2,3]; block [1,2];)
		}`,
		expectedWarnings: [],
		expectedErrors: ['mismatched spread lengths'],
	},
	rng_params_wrong_order: {
		testText: `_{ a = RNG!(4, 1); }`,
		expectedWarnings: ['misordered params'],
		expectedErrors: [],
	},
	array_returning_value_not_stored: {
		testText: `_{ c.length(); }`,
		expectedWarnings: ['return value not stored'],
		expectedErrors: [],
	},
	triple_equals: {
		testText: `_{ if (a === b) {} }`,
		expectedWarnings: ['invalid operator'],
		expectedErrors: [],
	},
	invalid_arg_type: {
		testText: `fn invalid_arg(4) {}`,
		expectedWarnings: [],
		expectedErrors: ['invalid fn arg'],
	},
	// too many fn args TODO (warn)
	not_enough_fn_args: {
		testText: `
			fn _($a, $b, $c) {}
			_ { _(1, 2) }
		`,
		expectedWarnings: [],
		expectedErrors: ['not enough fn args'],
	},
	duplicate_fn_arg: {
		testText: `fn _($arg, $arg) {}`,
		expectedWarnings: [],
		expectedErrors: ['duplicate fn arg'],
	},
	dialog_overwrap: {
		testText: `dialog _ {
			Bob wrap 20 "ACK!\n\nA goat! Oh, I guess I need to make sure this thing wraps. Let's see. How many chars can this be?"
		}`,
		expectedWarnings: ['dialog too long'],
		expectedErrors: [],
	},
	duplicate_const: {
		testText: `
			$duplicateConst = 0;
			$duplicateConst = 0;
		`,
		expectedWarnings: [],
		expectedErrors: ['constant already defined'],
	},
	duplicate_fn: {
		testText: `
			fn duplicateFn ($_) {}
			fn duplicateFn ($_) {}
		`,
		expectedWarnings: [],
		expectedErrors: ['fn already defined'],
	},
	duplicate_script: {
		testText: `
			duplicateScript {}
			duplicateScript {}
		`,
		expectedWarnings: [],
		expectedErrors: ['duplicate script'],
	},
	undefined_const: {
		testText: `_ { wait $undefinedConst; }`,
		expectedWarnings: [],
		expectedErrors: ['undefined constant', 'value wrong type'],
	},
	undefined_fn: {
		testText: `_ { undefinedFn($_) }`,
		expectedWarnings: [],
		expectedErrors: ['undefined fn'],
	},
	action_set_ambiguous: {
		testText: `_ { "bothVarsAre" = "ambiguous"; }`,
		expectedWarnings: ['ambiguous identifiers'],
		expectedErrors: [],
	},
	missing_semicolon: {
		testText: `_ { wait 99 }`,
		expectedWarnings: ['missing token'],
		expectedErrors: [],
	},
};
