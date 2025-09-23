export type ErrorTest = {
	testText: string;
	expectedWarnings: string[];
	expectedErrors: string[];
};
export const errorTests: Record<string, ErrorTest> = {
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
	// TODO doesn't work
	// invalid_arg_type: {
	// 	testText: `fn invalid_arg(4) {}`,
	// 	expectedWarnings: [],
	// 	expectedErrors: ['invalid fn arg'],
	// },
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
		expectedErrors: ['undefined constant'],
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
	// TODO doesn't work
	// missing_semicolon: {
	// 	testText: `_ { wait 99 }`,
	// 	expectedWarnings: ['missing token'],
	// 	expectedErrors: [],
	// },
};
