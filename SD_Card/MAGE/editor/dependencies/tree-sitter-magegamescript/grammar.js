/**
 * @file A custom scripting DSL for a custom game engine on a custom PCB
 * @author alamedyang <alamedyang@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
	name: 'magegamescript',
	extras: ($) => [/\s/, $.block_comment, $.line_comment],
	// precedences: $ => [
	// 	[
	// 		'unary',
	// 		'mul_div',
	// 		'add_sub',
	// 		'comparison',
	// 		'equality',
	// 	],
	// ],
	inline: ($) => [
		$.quoted_string,
		$.quoted_string_expandable,
		$.bareword,
		$.bareword_expandable,
		$.STRING,
		$.string,
		$.string_expandable,
		$.number,
		$.number_expandable,
		$.duration,
		$.duration_expandable,
		$.distance,
		$.distance_expandable,
		$.quantity,
		$.quantity_expandable,
		$.color,
		$.color_expandable,
		$.bool,
		$.bool_expandable,
		$.CONSTANT_VALUE,
		$.entity_identifier_expandable,
		$.entity_or_map_identifier_expandable,
		$.movable_identifier_expandable,
		$.coordinate_identifier_expandable,
		$.ambiguous_identifier,
		$.ambiguous_identifier_expandable,
		$.bool_expression_expandable,
		$.int_expression_expandable,
		$.bool_setable_expandable,
		$.int_setable_expandable,
	],
	rules: {
		document: ($) => repeat($._root),

		block_comment: ($) => seq('/*', optional($.comment_text), '*/'),
		comment_text: () => repeat1(token(/.|\n|\r/)),
		line_comment: () => token(repeat1(seq('//', repeat(/[^\n]/)))),

		BOOL: () => token(choice('true', 'false', 'on', 'off', 'open', 'closed', 'up', 'down')),
		BAREWORD: () => token(/[_a-zA-Z][_a-zA-Z0-9]*/),
		QUOTED_STRING: () => token(/"(?:[^"\\]|\\.)*"/),
		STRING: ($) => choice($.QUOTED_STRING, $.BAREWORD),
		NUMBER: () => token(/-?[0-9]+/),
		duration_suffix: () => token.immediate(/m?s/),
		DURATION: ($) =>
			prec.right(
				seq(field('NUMBER', $.NUMBER), optional(field('suffix', $.duration_suffix))),
			),
		distance_suffix: () => token.immediate(/pix|px/),
		DISTANCE: ($) =>
			prec.right(
				seq(field('NUMBER', $.NUMBER), optional(field('suffix', $.distance_suffix))),
			),
		quantity_suffix: () => token.immediate(/x/),
		QUANTITY: ($) =>
			choice(
				token(choice('once', 'twice', 'thrice')),
				prec.right(
					seq(field('NUMBER', $.NUMBER), optional(field('suffix', $.quantity_suffix))),
				),
			),
		COLOR: () => token(/white|black|red|green|blue|magenta|cyan|yellow|#[0-9A-Fa-f]{3,6}/),
		CONSTANT: () => token(/\$[_a-zA-Z0-9]+/),
		CONSTANT_VALUE: ($) =>
			choice(
				$.NUMBER,
				$.DURATION,
				$.DISTANCE,
				$.QUANTITY,
				$.BOOL,
				$.CONSTANT,
				$.COLOR,
				$.QUOTED_STRING,
				$.BAREWORD,
			),

		bool: ($) => choice($.BOOL, $.CONSTANT),
		bool_expandable: ($) => choice($.bool, $.bool_expansion),
		bool_expansion: ($) => seq('[', seq($.bool, repeat(seq(',', $.bool)), optional(',')), ']'),

		bareword: ($) => choice($.BAREWORD, $.CONSTANT),
		bareword_expandable: ($) => choice($.bareword, $.bareword_expansion),
		bareword_expansion: ($) =>
			seq('[', optional(seq($.bareword, repeat(seq(',', $.bareword)), optional(','))), ']'),

		quoted_string: ($) => choice($.QUOTED_STRING, $.CONSTANT),
		quoted_string_expandable: ($) => choice($.quoted_string, $.quoted_string_expansion),
		quoted_string_expansion: ($) =>
			seq(
				'[',
				optional(seq($.quoted_string, repeat(seq(',', $.quoted_string)), optional(','))),
				']',
			),

		string: ($) => choice($.STRING, $.CONSTANT),
		string_expandable: ($) => choice($.string, $.string_expansion),
		string_expansion: ($) =>
			seq('[', optional(seq($.string, repeat(seq(',', $.string)), optional(','))), ']'),

		number: ($) => choice($.NUMBER, $.CONSTANT),
		number_expandable: ($) => choice($.number, $.number_expansion),
		number_expansion: ($) =>
			seq('[', optional(seq($.number, repeat(seq(',', $.number)), optional(','))), ']'),

		duration: ($) => choice($.DURATION, $.CONSTANT),
		duration_expandable: ($) => choice($.duration, $.duration_expansion),
		duration_expansion: ($) =>
			seq('[', seq($.duration, repeat(seq(',', $.duration)), optional(',')), ']'),

		distance: ($) => choice($.DISTANCE, $.CONSTANT),
		distance_expandable: ($) => choice($.distance, $.distance_expansion),
		distance_expansion: ($) =>
			seq('[', optional(seq($.distance, repeat(seq(',', $.distance)), optional(','))), ']'),

		quantity: ($) => choice($.QUANTITY, $.CONSTANT),
		quantity_expandable: ($) => choice($.quantity, $.quantity_expansion),
		quantity_expansion: ($) =>
			seq('[', optional(seq($.quantity, repeat(seq(',', $.quantity)), optional(','))), ']'),

		color: ($) => choice($.COLOR, $.CONSTANT),
		color_expandable: ($) => choice($.color, $.color_expansion),
		color_expansion: ($) =>
			seq('[', optional(seq($.color, repeat(seq(',', $.color)), optional(','))), ']'),

		semicolon: () => token(';'),

		_root: ($) =>
			choice(
				$.script_definition,
				$.constant_assignment,
				$.include_macro,
				$.add_serial_dialog_settings,
				$.serial_dialog_definition,
				$.add_dialog_settings,
				$.dialog_definition,
			),

		include_macro: ($) => seq('include', field('fileName', $.quoted_string), $.semicolon),
		constant_assignment: ($) =>
			seq(
				field('label', $.CONSTANT),
				$.assignment_operator,
				field('value', $.CONSTANT_VALUE),
				$.semicolon,
			),
		add_serial_dialog_settings: ($) =>
			seq(
				'add',
				'serial_dialog',
				'settings',
				'{',
				repeat(field('serial_dialog_parameter', $.serial_dialog_parameter)),
				'}',
			),
		serial_dialog_parameter: ($) =>
			choice(
				seq(
					field('property', 'wrap'), // can add more later
					field('value', $.number),
				),
			),
		add_dialog_settings: ($) =>
			seq('add', 'dialog', 'settings', '{', repeat($.add_dialog_settings_target), '}'),
		add_dialog_settings_target: ($) =>
			seq(
				choice(
					field('type', 'default'),
					seq(field('type', 'label'), field('target', $.bareword)),
					seq(field('type', 'entity'), field('target', $.string)),
				),
				'{',
				repeat(field('dialog_parameter', $.dialog_parameter)),
				'}',
			),
		dialog_parameter: ($) =>
			choice(
				seq(field('property', choice('wrap', 'emote')), field('value', $.number)),
				seq(
					field(
						'property',
						choice('entity', 'name', 'portrait', 'alignment', 'border_tileset'),
					),
					field('value', $.string),
				),
			),
		dialog_definition: ($) => seq('dialog', field('dialog_name', $.string), $._dialog_block),
		_dialog_block: ($) => seq('{', repeat(field('dialog', $.dialog)), '}'),
		dialog: ($) =>
			seq(
				field('dialog_identifier', $.dialog_identifier),
				repeat(field('dialog_parameter', $.dialog_parameter)),
				repeat1(field('message', $.QUOTED_STRING)),
				repeat(field('dialog_option', $.dialog_option)),
			),
		dialog_identifier: ($) =>
			choice(
				seq(field('type', choice('entity', 'name')), field('value', $.STRING)),
				field('label', $.BAREWORD),
			),
		dialog_option: ($) =>
			seq(
				'>',
				field('label', $.QUOTED_STRING),
				$.assignment_operator,
				field('script', $.string),
			),
		serial_dialog_definition: ($) =>
			seq('serial_dialog', field('serial_dialog_name', $.STRING), $._serial_dialog_block),
		_serial_dialog_block: ($) =>
			seq('{', field('serial_dialog', optional($.serial_dialog)), '}'),
		serial_dialog: ($) =>
			seq(
				repeat(field('serial_dialog_parameter', $.serial_dialog_parameter)),
				repeat1(field('serial_message', $.QUOTED_STRING)),
				repeat(field('serial_dialog_option', $.serial_dialog_option)),
			),
		serial_dialog_option: ($) =>
			seq(
				field('option_type', choice('_', '#')),
				field('label', $.QUOTED_STRING),
				$.assignment_operator,
				field('script', $.string),
			),
		script_definition: ($) =>
			seq(
				optional('script'),
				field('script_name', $.STRING),
				field('script_block', $.script_block),
			),
		script_block: ($) => seq('{', repeat($._script_item), '}'),
		_script_item: ($) =>
			choice(
				seq($._action_item, $.semicolon),
				$.rand_macro,
				$.label_definition,
				$.json_literal,
				$.debug_macro,
				$.copy_macro,
				$.if_single,
				$.if_chain,
				$.while_block,
				$.do_while_block,
				$.for_block,
			),

		json_literal: ($) => seq('json', $.json_array),
		json_array: ($) =>
			seq('[', optional(seq($._json_item, repeat(seq(',', $._json_item)))), ']'),
		json_object: ($) =>
			seq(
				'{',
				optional(seq($.json_name_value_pair, repeat(seq(',', $.json_name_value_pair)))),
				'}',
			),
		json_name_value_pair: ($) =>
			seq(field('property', $.QUOTED_STRING), ':', field('value', $._json_item)),
		json_number: () => token(choice('Infinity', '-Infinity', /-?[0-9]+?/)),
		_json_item: ($) =>
			choice(
				$.QUOTED_STRING,
				$.json_number,
				$.json_array,
				$.json_object,
				token('true'),
				token('false'),
				token('null'),
			),

		debug_macro: ($) =>
			seq(
				'debug',
				'!',
				'(',
				choice(
					field('serial_dialog', $.serial_dialog),
					field('serial_dialog_name', $.bareword),
				),
				')',
			),
		copy_macro: ($) => seq('copy', '!', '(', field('script', $.string), ')'),
		rand_macro: ($) => seq('rand', '!', '(', repeat($._script_item), ')'),
		label_definition: ($) => seq(field('label', $.BAREWORD), ':'),

		_action_item: ($) =>
			choice(
				$.action_return_statement,
				$.action_close_dialog,
				$.action_close_serial_dialog,
				$.action_save_slot,
				$.action_load_slot,
				$.action_erase_slot,
				$.action_load_map,
				$.action_run_script,
				$.action_goto_label,
				$.action_goto_index,
				$.action_non_blocking_delay,
				$.action_blocking_delay,
				$.action_show_dialog,
				$.action_show_serial_dialog,
				$.action_concat_serial_dialog,
				$.action_delete_command,
				$.action_delete_command_arg,
				$.action_delete_alias,
				$.action_hide_command,
				$.action_unhide_command,
				$.action_pause_script,
				$.action_unpause_script,
				$.action_camera_shake,
				$.action_camera_fade_in,
				$.action_camera_fade_out,
				$.action_play_entity_animation,
				$.action_move_over_time,
				$.action_set_position,
				$.action_set_ambiguous,
				$.action_set_int,
				$.action_set_bool,
				$.action_set_direction,
				$.action_set_warp_state,
				$.action_set_serial_connect,
				$.action_set_alias,
				$.action_set_command,
				$.action_set_command_fail,
				$.action_set_command_arg,
				$.action_set_entity_string,
				$.action_set_script,
				$.action_op_equals,
				$.action_plus_minus_equals_ables,
			),
		action_break_statement: () => 'break',
		action_continue_statement: () => 'continue',
		action_return_statement: () => 'return',
		action_close_dialog: () => seq('close', 'dialog'),
		action_close_serial_dialog: () => seq('close', 'serial_dialog'),
		action_save_slot: () => seq('save', 'slot'),
		action_load_slot: ($) => seq('load', 'slot', field('slot', $.number_expandable)),
		action_erase_slot: ($) => seq('erase', 'slot', field('slot', $.number_expandable)),
		action_load_map: ($) => seq('load', 'map', field('map', $.string_expandable)),
		action_run_script: ($) => seq('goto', field('script', $.string_expandable)),
		action_goto_label: ($) => seq('goto', 'label', field('label', $.bareword_expandable)),
		action_goto_index: ($) => seq('goto', 'index', field('action_index', $.number_expandable)),
		action_non_blocking_delay: ($) => seq('wait', field('duration', $.duration_expandable)),
		action_blocking_delay: ($) => seq('block', field('duration', $.duration_expandable)),

		action_show_dialog: ($) =>
			seq(
				'show',
				'dialog',
				choice(
					seq(field('dialog_name', $.STRING), $._dialog_block),
					field('dialog_name', $.STRING),
					$._dialog_block,
				),
			),
		action_show_serial_dialog: ($) =>
			seq(
				'show',
				'serial_dialog',
				choice(
					seq(field('serial_dialog_name', $.STRING), $._serial_dialog_block),
					field('serial_dialog_name', $.STRING),
					$._serial_dialog_block,
				),
			),
		action_concat_serial_dialog: ($) =>
			seq(
				'concat',
				'serial_dialog',
				choice(
					seq(field('serial_dialog_name', $.STRING), $._serial_dialog_block),
					field('serial_dialog_name', $.STRING),
					$._serial_dialog_block,
				),
			),

		action_delete_command: ($) =>
			seq('delete', 'command', field('command', $.string_expandable)),
		action_delete_command_arg: ($) =>
			seq(
				'delete',
				'command',
				field('command', $.string_expandable),
				'+',
				field('argument', $.string_expandable),
			),
		action_delete_alias: ($) => seq('delete', 'alias', field('alias', $.string_expandable)),
		action_hide_command: ($) => seq('hide', 'command', field('command', $.string_expandable)),
		action_unhide_command: ($) =>
			seq('unhide', 'command', field('command', $.string_expandable)),

		entity_identifier: ($) =>
			choice(
				field('type', 'player'),
				field('type', 'self'),
				seq(field('type', 'entity'), field('entity', $.string)),
			),
		entity_identifier_expandable: ($) =>
			choice($.entity_identifier, $.entity_identifier_expansion),
		entity_identifier_expansion: ($) =>
			seq(
				'[',
				optional(
					seq($.entity_identifier, repeat(seq(',', $.entity_identifier)), optional(',')),
				),
				']',
			),
		entity_or_map_identifier: ($) =>
			prec(
				1,
				choice(
					field('type', 'map'),
					field('type', 'player'),
					field('type', 'self'),
					seq(field('type', 'entity'), field('entity', $.string)),
				),
			),
		entity_or_map_identifier_expandable: ($) =>
			choice($.entity_or_map_identifier, $.entity_or_map_identifier_expansion),
		entity_or_map_identifier_expansion: ($) =>
			seq(
				'[',
				optional(
					seq(
						$.entity_or_map_identifier,
						repeat(seq(',', $.entity_or_map_identifier)),
						optional(','),
					),
				),
				']',
			),

		action_pause_script: ($) =>
			seq(
				'pause',
				field('entity', $.entity_or_map_identifier_expandable),
				field('script_slot', $.string_expandable),
			),
		action_unpause_script: ($) =>
			seq(
				'unpause',
				field('entity', $.entity_or_map_identifier_expandable),
				field('script_slot', $.string_expandable),
			),

		action_camera_fade_in: ($) =>
			seq(
				'camera',
				'fade',
				'in',
				'->',
				field('color', $.color_expandable),
				'over',
				field('duration', $.duration_expandable),
			),
		action_camera_fade_out: ($) =>
			seq(
				'camera',
				'fade',
				'out',
				'->',
				field('color', $.color_expandable),
				'over',
				field('duration', $.duration_expandable),
			),

		action_camera_shake: ($) =>
			seq(
				'camera',
				'shake',
				'->',
				field('frequency', $.duration_expandable),
				field('amplitude', $.distance_expandable),
				'over',
				field('duration', $.duration_expandable),
			),

		action_play_entity_animation: ($) =>
			seq(
				field('entity', $.entity_identifier_expandable),
				'animation',
				'->',
				field('animation', $.number_expandable),
				field('play_count', $.quantity_expandable),
			),

		geometry_identifier: ($) =>
			choice(
				seq(field('type', 'geometry'), field('geometry', $.string)),
				field('type', 'entity_path'),
			),
		geometry_identifier_expandable: ($) =>
			seq($.geometry_identifier, $.geometry_identifier_expansion),
		geometry_identifier_expansion: ($) =>
			seq(
				'[',
				optional(
					seq(
						$.geometry_identifier,
						repeat(seq(',', $.geometry_identifier)),
						optional(','),
					),
				),
				']',
			),

		movable_identifier: ($) =>
			choice(
				field('type', 'camera'),
				seq(field('type', 'player'), 'position'),
				seq(field('type', 'self'), 'position'),
				seq(field('type', 'entity'), field('entity', $.string), 'position'),
			),
		movable_identifier_expandable: ($) =>
			choice($.movable_identifier, $.movable_identifier_expansion),
		movable_identifier_expansion: ($) =>
			prec(
				1,
				seq(
					'[',
					optional(
						seq(
							$.movable_identifier,
							repeat(seq(',', $.movable_identifier)),
							optional(','),
						),
					),
					']',
				),
			),

		origin: () => 'origin',
		length: () => 'length',
		geometry: () => 'geometry',
		coordinate_identifier: ($) =>
			choice(
				seq(field('type', 'player'), 'position'),
				seq(field('type', 'self'), 'position'),
				seq(field('type', 'entity'), field('entity', $.string), 'position'),
				seq(
					field('type', 'entity_path'),
					optional(
						choice(field('polygon_type', $.origin), field('polygon_type', $.length)),
					),
				),
				seq(
					field('type', $.geometry),
					field('geometry', $.string),
					optional(
						choice(field('polygon_type', $.origin), field('polygon_type', $.length)),
					),
				),
			),
		coordinate_identifier_expandable: ($) =>
			choice($.coordinate_identifier, $.coordinate_identifier_expansion),
		coordinate_identifier_expansion: ($) =>
			prec(
				1,
				seq(
					'[',
					optional(
						seq(
							$.coordinate_identifier,
							repeat(seq(',', $.coordinate_identifier)),
							optional(','),
						),
					),
					']',
				),
			),

		over_time_operator: () => '->',
		forever: () => 'forever',
		action_move_over_time: ($) =>
			seq(
				field('movable', $.movable_identifier_expandable),
				$.over_time_operator,
				field('coordinate', $.coordinate_identifier_expandable),
				'over',
				field('duration', $.duration_expandable),
				optional(field('forever', $.forever)),
			),

		assignment_operator: () => '=',
		action_set_position: ($) =>
			seq(
				field('movable', $.movable_identifier_expandable),
				$.assignment_operator,
				field('coordinate', $.coordinate_identifier_expandable),
			),

		ambiguous_identifier: ($) => prec(2, choice($.STRING, $.CONSTANT)),
		ambiguous_identifier_expandable: ($) =>
			choice($.ambiguous_identifier, $.ambiguous_identifier_expansion),
		ambiguous_identifier_expansion: ($) =>
			seq(
				'[',
				optional(
					seq(
						$.ambiguous_identifier,
						repeat(seq(',', $.ambiguous_identifier)),
						optional(','),
					),
				),
				']',
			),

		action_set_ambiguous: ($) =>
			seq(
				field('lhs', $.ambiguous_identifier_expandable),
				$.assignment_operator,
				field(
					'rhs',
					choice(
						$.int_expression_expandable,
						$.bool_expression_expandable,
						$.ambiguous_identifier_expandable,
					),
				),
			),

		identifier: ($) => $.string,
		AND: () => '&&',
		OR: () => '||',
		BANG: () => '!',
		COMPARISON: () =>
			choice(
				token(prec(1, '>')),
				token(prec(1, '>=')),
				token(prec(1, '<')),
				token(prec(1, '<=')),
				token(prec(1, '==')),
				token(prec(1, '!=')),
			),
		EQUALITY: () => choice('==', '!='),
		_bool_unit: ($) =>
			prec(
				7,
				choice(
					$.BOOL,
					$.CONSTANT,
					$.bool_getable,
					$.bool_unary_expression,
					$.bool_grouping,
					$.STRING,
				),
			),

		bool_grouping: ($) => seq('(', field('inner', $._bool_expression), ')'),
		_bool_expression: ($) => choice($.bool_comparison, $.bool_binary_expression, $._bool_unit),
		bool_expression_expandable: ($) => choice($._bool_expression, $.bool_expression_expansion),
		bool_expression_expansion: ($) =>
			prec(
				1,
				seq(
					'[',
					seq($._bool_expression, repeat(seq(',', $._bool_expression)), optional(',')),
					']',
				),
			),

		bool_unary_expression: ($) =>
			prec.right(6, seq(field('operator', '!'), field('operand', $._bool_unit))),
		bool_binary_expression: ($) =>
			choice(
				// prec.left(5, seq($._expression, field('operator', $.COMPARISON), $._expression)),
				prec.left(
					4,
					seq(
						field('lhs', $._bool_expression),
						field('operator', $.EQUALITY),
						field('rhs', $._bool_expression),
					),
				),
				prec.left(
					3,
					seq(
						field('lhs', $._bool_expression),
						field('operator', $.AND),
						field('rhs', $._bool_expression),
					),
				),
				prec.left(
					2,
					seq(
						field('lhs', $._bool_expression),
						field('operator', $.OR),
						field('rhs', $._bool_expression),
					),
				),
			),
		// can't be expressions, so needs to be a separate thing
		bool_comparison: ($) =>
			choice(
				seq(
					field('lhs', choice($.number, $.string)),
					field('operator', $.COMPARISON),
					field('rhs', choice($.number, $.string)),
				),
				seq(
					field('lhs', $.entity_direction),
					field('operator', $.EQUALITY),
					field('rhs', $.nsew),
				),
				seq(
					field('lhs', $.nsew),
					field('operator', $.EQUALITY),
					field('rhs', $.entity_direction),
				),
				seq(
					field('lhs', $.string_checkable),
					field('operator', $.EQUALITY),
					field('rhs', $.string),
				),
				seq(
					field('lhs', $.string),
					field('operator', $.EQUALITY),
					field('rhs', $.string_checkable),
				),
				seq(
					field('lhs', $.number_checkable_equality),
					field('operator', $.EQUALITY),
					field('rhs', $.number),
				),
				seq(
					field('lhs', $.number),
					field('operator', $.EQUALITY),
					field('rhs', $.number_checkable_equality),
				),
			),
		number_checkable_equality: ($) =>
			prec(
				1,
				seq(
					field('entity_identifier', $.entity_identifier),
					field('property', $.entity_property_int),
				),
			),
		entity_direction: ($) => seq(field('entity_identifier', $.entity_identifier), 'direction'),
		nsew: () => choice('north', 'south', 'east', 'west'),
		string_checkable: ($) =>
			choice(
				seq(
					field('entity_identifier', $.entity_identifier),
					field('property', $.entity_property_string),
				),
				field('type', 'warp_state'),
			),

		action_set_bool: ($) =>
			seq(
				field('lhs', $.bool_setable_expandable),
				$.assignment_operator,
				field('rhs', $.bool_expression_expandable),
			),
		bool_setable: ($) =>
			choice(
				field('type', 'player_control'),
				field('type', 'lights_control'),
				field('type', 'hex_editor'),
				field('type', 'hex_dialog_mode'),
				field('type', 'hex_control'),
				field('type', 'hex_clipboard'),
				field('type', 'serial_control'),
				seq(field('entity_identifier', $.entity_identifier), field('type', 'glitched')),
				seq(field('type', 'light'), field('light', $.string_expandable)),
				seq(optional('flag'), field('flag', $.string)),
			),
		bool_setable_expandable: ($) => prec(1, choice($.bool_setable, $.bool_setable_expansion)),
		bool_setable_expansion: ($) =>
			seq(
				'[',
				optional(seq($.bool_setable, repeat(seq(',', $.bool_setable)), optional(','))),
				']',
			),

		bool_getable: ($) =>
			choice(
				field('type', 'debug_mode'),
				seq(field('entity_identifier', $.entity_identifier), field('type', 'glitched')),
				seq(
					field('entity_identifier', $.entity_identifier),
					field('type', 'intersects'),
					field('geometry_identifier', $.geometry_identifier),
				),
				seq(field('type', 'flag'), field('value', $.string)),
				seq(field('type', 'dialog'), field('value', choice('open', 'closed'))),
				seq(field('type', 'serial_dialog'), field('value', choice('open', 'closed'))),
				seq(
					field('type', 'button'),
					field('button', $.bareword),
					field('state', choice($.bool, 'pressed')),
				),
			),

		MUL_DIV_MOD: () => choice('*', '/', '%'),
		ADD_SUB: () => choice('+', '-'),
		_int_unit: ($) =>
			prec(8, choice($.int_getable, $.int_grouping, $.NUMBER, $.CONSTANT, $.STRING)),

		int_grouping: ($) => seq('(', $._int_expression, ')'),
		_int_expression: ($) => choice($.int_binary_expression, $._int_unit),
		int_expression_expandable: ($) => choice($._int_expression, $.int_expression_expansion),
		int_expression_expansion: ($) =>
			seq(
				'[',
				seq($._int_expression, repeat(seq(',', $._int_expression)), optional(',')),
				']',
			),

		int_binary_expression: ($) =>
			choice(
				prec.left(
					3,
					seq(
						field('lhs', $._int_expression),
						field('operator', $.MUL_DIV_MOD),
						field('rhs', $._int_expression),
					),
				),
				prec.left(
					2,
					seq(
						field('lhs', $._int_expression),
						field('operator', $.ADD_SUB),
						field('rhs', $._int_expression),
					),
				),
			),

		action_set_int: ($) =>
			seq(
				field('lhs', $.int_setable_expandable),
				$.assignment_operator,
				field('rhs', $.int_expression_expandable),
			),
		int_setable: ($) =>
			choice(
				seq(
					field('entity_identifier', $.entity_identifier),
					field('property', $.entity_property_int),
				),
				field('variable', $.string), // replace with vv
				// seq(optional('variable'), field('variable', $.string)),
				// todo turns out this is involved, too
			),
		int_setable_expandable: ($) => prec(1, choice($.int_setable, $.int_setable_expansion)),
		int_setable_expansion: ($) =>
			seq(
				'[',
				optional(seq($.int_setable, repeat(seq(',', $.int_setable)), optional(','))),
				']',
			),
		int_getable: ($) =>
			choice(
				seq(
					field('entity_identifier', $.entity_identifier),
					field('property', $.entity_property_int),
				),
				// seq(optional('variable'), field('variable', $.string)),
				// todo might be kind of involved actually
			),
		simple_bool_unary_expression: ($) =>
			seq(field('operator', '!'), field('operand', $._simple_bool_unit)),
		_simple_bool_unit: ($) => choice($.BOOL, $.CONSTANT, $.bool_getable, $.STRING),
		_simple_condition: ($) =>
			choice($.bool_comparison, $.bool_unary_expression, $._simple_bool_unit),
		if_single: ($) =>
			seq(
				'if',
				field('condition', $._simple_condition),
				'then',
				'goto',
				choice(
					seq(optional('script'), field('script', $.string)),
					seq(field('type', 'index'), field('index', $.number)),
					seq(field('type', 'label'), field('label', $.BAREWORD)),
				),
				$.semicolon,
			),
		if_chain: ($) =>
			seq(
				field('if_block', $.if_block),
				repeat(seq('else', field('if_block', $.if_block))),
				optional(field('else_block', $.else_block)),
			),
		if_block: ($) =>
			seq('if', '(', field('condition', $._condition), ')', field('body', $.script_block)),
		else_block: ($) => seq('else', field('body', $.script_block)),
		_condition: ($) => choice($._bool_expression),
		looping_block: ($) =>
			seq(
				'{',
				repeat(
					choice(
						$._script_item,
						seq($.action_break_statement, $.semicolon),
						seq($.action_continue_statement, $.semicolon),
					),
				),
				'}',
			),
		while_block: ($) =>
			seq(
				'while',
				'(',
				field('condition', $._condition),
				')',
				field('body', $.looping_block),
			),
		do_while_block: ($) =>
			seq(
				'do',
				field('body', $.looping_block),
				'while',
				'(',
				field('condition', $._condition),
				')',
			),
		for_block: ($) =>
			seq(
				'for',
				'(',
				field('initializer', $._action_item),
				$.semicolon,
				field('condition', $._condition),
				$.semicolon,
				field('incrementer', $._action_item),
				')',
				field('body', $.looping_block),
			),

		entity_property_int: () =>
			choice(
				'x',
				'y',
				'primary_id',
				'secondary_id',
				'primary_id_type',
				'current_animation',
				'animation_frame',
				'strafe',
			),
		entity_property_string: () =>
			choice('name', 'type', 'path', 'on_interact', 'on_tick', 'on_look'),
		action_set_warp_state: ($) =>
			seq(
				field('warp_state', 'warp_state'),
				$.assignment_operator,
				field('string', $.string_expandable),
			),
		action_set_serial_connect: ($) =>
			seq(
				field('serial_connect', 'serial_connect'),
				$.assignment_operator,
				field('serial_dialog', $.string_expandable),
			),
		action_set_alias: ($) =>
			seq(
				'alias',
				field('alias', $.string_expandable),
				$.assignment_operator,
				field('command', $.string_expandable),
			),
		action_set_command: ($) =>
			seq(
				'command',
				field('command', $.string_expandable),
				$.assignment_operator,
				field('script', $.string_expandable),
			),
		action_set_command_fail: ($) =>
			seq(
				'command',
				field('command', $.string_expandable),
				'fail',
				$.assignment_operator,
				field('script', $.string_expandable),
			),
		action_set_command_arg: ($) =>
			seq(
				'command',
				field('command', $.string_expandable),
				'+',
				field('argument', $.string_expandable),
				$.assignment_operator,
				field('script', $.string_expandable),
			),
		action_set_direction: ($) =>
			seq(
				field('entity', $.entity_identifier),
				'direction',
				$.assignment_operator,
				field('target', $.direction_target),
			),
		direction_target: ($) =>
			choice(
				field('geometry', $.geometry_identifier),
				field('entity', $.entity_identifier),
				field('nsew', $.nsew),
			),
		action_set_script: ($) =>
			seq(
				field('entity', $.entity_or_map_identifier_expandable),
				field('script_slot', $.string_expandable),
				$.assignment_operator,
				field('script', $.string_expandable),
			),
		op_equals: () => choice('?=', '+=', '-=', '*=', '/=', '%='),
		action_op_equals: ($) =>
			prec(
				1,
				seq(
					field('lhs', choice($.STRING, $.int_setable_expandable)),
					field('operator', $.op_equals),
					field('rhs', $.int_expression_expandable),
				),
			),
		plus_minus_equals: () => choice('+=', '-='),
		action_plus_minus_equals_ables: ($) =>
			seq(
				field('entity', $.entity_identifier_expandable),
				'direction',
				field('operator', $.plus_minus_equals),
				field('value', $.number_expandable),
			),
		action_set_entity_direction: ($) =>
			seq(
				field('entity_direction', $.entity_direction),
				$.assignment_operator,
				field(
					'towards',
					choice(
						field('geometry_identifier', $.geometry_identifier),
						field('entity_identifier', $.entity_identifier),
						field('nsew', $.nsew),
					),
				),
			),
		action_set_entity_string: ($) =>
			seq(
				field('entity', $.entity_identifier_expandable),
				field('field', $.set_entity_string_field),
				$.assignment_operator,
				field('value', $.string_expandable),
			),
		set_entity_string_field: () => choice('name', 'type', 'path'),
	},
});
