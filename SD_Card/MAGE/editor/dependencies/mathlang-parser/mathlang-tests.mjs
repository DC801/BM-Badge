import { lex } from "./mathlang-lex.mjs"
import { parseFile } from './mathlang-parse.mjs';

const printIfOK = false;

// remember newlines count as a token, so avoid them
// to make it easier to count them with your eyeballs!
const patternTests = {
	set_save_flag: [
		{ name: `set save flag`,
			pattern: `_ {
					storyflagBob = true;
				}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [1], nodes: 1, errors: 0, warnings: 0 },
			nodes: [{
				node: "script_definition",
				name: "_",
				body: [
					{
						node: "action",
						action: "SET_SAVE_FLAG",
						save_flag: "storyflagBob",
						bool_value: true,
					}
				]
			}]
		},
	],
	boolean_assignment: [
		// { name: `basic failures`,
		// 	pattern: `_ {
		// 			player_control = on;
		// 			hex_control =
		// 			hex_clipboard
		// 			debug_mode =;
		// 			lights_control;
		// 		}`.replace(/[\s\n\t]+/g,' '),
		// 	fileSuccess: true,
		// 	counts: { bodyNodes: [3], nodes: 1, errors: 0, warnings: 0 },
		// 	nodes: [{
		// 		node: "script_definition",
		// 		name: "_",
		// 		body: [
		// 			{
		// 				node: "action",
		// 				action: "SET_ENTITY_GLITCHED",
		// 				entity: "Bob",
		// 				bool_value: true,
		// 			},
		// 			{
		// 				node: "action",
		// 				action: "SET_ENTITY_GLITCHED",
		// 				entity: "%PLAYER%",
		// 				bool_value: true,
		// 			},
		// 			{
		// 				node: "action",
		// 				action: "SET_ENTITY_GLITCHED",
		// 				entity: "%SELF%",
		// 				bool_value: true,
		// 			},
		// 		]
		// 	}]
		// },
		{ name: `entity glitched true`,
			pattern: `_ {
					entity Bob glitched = true;
					player glitched = open;
					self glitched = on;
				}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [3], nodes: 1, errors: 0, warnings: 0 },
			nodes: [{
				node: "script_definition",
				name: "_",
				body: [
					{
						node: "action",
						action: "SET_ENTITY_GLITCHED",
						entity: "Bob",
						bool_value: true,
					},
					{
						node: "action",
						action: "SET_ENTITY_GLITCHED",
						entity: "%PLAYER%",
						bool_value: true,
					},
					{
						node: "action",
						action: "SET_ENTITY_GLITCHED",
						entity: "%SELF%",
						bool_value: true,
					},
				]
			}]
		},
		{ name: `entity glitched false`,
			pattern: `_ {
					entity "Bob" glitched = false;
					player glitched = closed;
					self glitched = off;
				}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [3], nodes: 1, errors: 0, warnings: 0 },
			nodes: [{
				node: "script_definition",
				name: "_",
				body: [
					{
						node: "action",
						action: "SET_ENTITY_GLITCHED",
						entity: "Bob",
						bool_value: false,
					},
					{
						node: "action",
						action: "SET_ENTITY_GLITCHED",
						entity: "%PLAYER%",
						bool_value: false,
					},
					{
						node: "action",
						action: "SET_ENTITY_GLITCHED",
						entity: "%SELF%",
						bool_value: false,
					},
				]
			}]
		},
	],
	do_over_time_operator: [
		{ name: `camera over time`,
			pattern: `_ {
					camera -> geometry walkPath origin over 1s;
					camera -> geometry "walkPath" length over 1000ms;
					camera -> geometry walkPath length forever;
					camera -> entity Bob position over 1ms;
				}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [4], nodes: 1, errors: 0, warnings: 0 },
			nodes: [{
				node: "script_definition",
				name: "_",
				body: [
					{
						node: "action",
						action: "PAN_CAMERA_TO_GEOMETRY",
						geometry: "walkPath",
						duration: 1000,
					},
					{
						node: "action",
						action: "PAN_CAMERA_ALONG_GEOMETRY",
						geometry: "walkPath",
						duration: 1000,
					},
					{
						node: "action",
						action: "LOOP_CAMERA_ALONG_GEOMETRY",
						geometry: "walkPath",
					},
					{
						node: "action",
						action: "PAN_CAMERA_TO_ENTITY",
						entity: "Bob",
						duration: 1,
					}
				]
			}]
		},
		{ name: `entity identifier over time`,
			pattern: `_ {
					entity Bob position -> geometry walkPath origin over 1s;
					player position -> geometry "walkPath" length over 1000ms;
					self position -> geometry walkPath length forever;
					entity Bob animation -> 3 twice;
				}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [4], nodes: 1, errors: 0, warnings: 0 },
			nodes: [{
				node: "script_definition",
				name: "_",
				body: [
					{
						node: "action",
						action: "WALK_ENTITY_TO_GEOMETRY",
						entity: "Bob",
						geometry: "walkPath",
						duration: 1000,
					},
					{
						node: "action",
						action: "WALK_ENTITY_ALONG_GEOMETRY",
						entity: "%PLAYER%",
						geometry: "walkPath",
						duration: 1000,
					},
					{
						node: "action",
						action: "LOOP_ENTITY_ALONG_GEOMETRY",
						entity: "%SELF%",
						geometry: "walkPath",
					},
					{
						node: "action",
						action: "PLAY_ENTITY_ANIMATION",
						entity: "Bob",
						animation: 3,
						play_count: 2,
					}
				]
			}]
		},
		{ name: `not over time but similar`,
			pattern: `_ {
					camera position = geometry mapPath;
					camera position = player position;
					entity Bob position = geometry geometryName;
				}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [3], nodes: 1, errors: 0, warnings: 0 },
			nodes: [{
				node: "script_definition",
				name: "_",
				body: [
					{
						node: "action",
						action: "TELEPORT_CAMERA_TO_GEOMETRY",
						geometry: "mapPath",
					},
					{
						node: "action",
						action: "SET_CAMERA_TO_FOLLOW_ENTITY",
						entity: "%PLAYER%",
					},
					{
						node: "action",
						action: "TELEPORT_ENTITY_TO_GEOMETRY",
						entity: "Bob",
						geometry: "geometryName",
					},
				]
			}]
		},
	],
	show_serial_dialog: [
		{ name: 'inline definition vs reference & named vs autonamed',
			pattern: `testScript {
					show serial_dialog YesReferenceNoDefinition;
					show serial_dialog {
						"Defined two nodes above 'testScript'; autonamed"
					};
					show serial_dialog defAndRef {
						"Defined one node above 'testScript'; named 'defAndRef'"
					};
				}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [0,0,3], nodes: 3, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "unitTests.mgs:1:78",
					messages: [ "Defined two nodes above 'testScript'; autonamed" ],
				},
				{
					node: "serial_dialog_definition",
					name: "defAndRef",
					messages: [ "Defined one node above 'testScript'; named 'defAndRef'" ],
				},
				{
					node: "script_definition",
					name: "testScript",
					body: [
						{
							node: "action",
							action: "SHOW_SERIAL_DIALOG",
							serial_dialog: "YesReferenceNoDefinition",
						},
						{
							node: "action",
							action: "SHOW_SERIAL_DIALOG",
							serial_dialog: "unitTests.mgs:1:78",
						},
						{
							node: "action",
							action: "SHOW_SERIAL_DIALOG",
							serial_dialog: "defAndRef",
						},
					],
				},
			]
		},
	],
	show_dialog: [
		{ name: 'inline definition vs reference & named vs autonamed',
			pattern: `testScript {
					show dialog YesReferenceNoDefinition;
					show dialog {
						PLAYER "Defined two nodes above 'testScript'; autonamed"
					};
					show dialog defAndRef {
						PLAYER "Defined one node above 'testScript'; named 'defAndRef'"
					};
				}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [0,0,3], nodes: 3, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "unitTests.mgs:1:64",
					dialogs: [{
						node: "dialog",
						messages: [ "Defined two nodes above 'testScript'; autonamed", ],
						identifier: { type: "label", value: "PLAYER" },
					}],
				},
				{
					node: "dialog_definition",
					name: "defAndRef",
					dialogs: [{
						  node: "dialog",
						  messages: [ "Defined one node above 'testScript'; named 'defAndRef'" ],
						  identifier: { type: "label", value: "PLAYER" },
					}],
				},
				{
					node: "script_definition",
					name: "testScript",
					body: [
						{
							node: "action",
							action: "SHOW_DIALOG",
							serial_dialog: "YesReferenceNoDefinition",
						},
						{
							node: "action",
							action: "SHOW_DIALOG",
							serial_dialog: "unitTests.mgs:1:64",
						},
						{
							node: "action",
							action: "SHOW_DIALOG",
							serial_dialog: "defAndRef",
						},
					],
				},
			]
		},
	],
	json_literal: [
		{ name: 'gamut of syntax',
			pattern: `_ {
					json![{
						"action": "NEW_ACTION",
						"prop1": "string",
						"prop2": 100,
						"prop3": false,
						"prop4": [ "LED_BIT128", "LED_BIT8" ],
						"prop5": {
							"inner": "This has gone too far!",
							"innerAgain": 9001
						}
					}]
				}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [1], nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "script_definition",
					name: "_",
					body: [{
						node: "action",
						action: "NEW_ACTION",
						prop1: "string",
						prop2: 100,
						prop3: false,
						prop4: [
							"LED_BIT128",
							"LED_BIT8"
						],
						prop5: {
							inner: "This has gone too far!",
							innerAgain: 9001
						},
					}],
				},
			]
		},
	],
	script_actions: [
		{ name: 'dictionary entry with outside lookup',
			pattern: `_ {
				pause entity Bob on_tick;
			}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [1], nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "script_definition",
					name: "_",
					body: [
						{
							node: "action",
							action: "SET_SCRIPT_PAUSE",
							bool_value: true,
							script_slot: "on_tick",
							entity: "Bob",
						},
					],
				}
			]
		},
		{ name: 'game flow manip',
			pattern: `_ {
				goto index 44;
				goto label outer_loop;
				goto script "mainMenuStart";
				load map mainMenu;
				load slot 3;
				erase slot 0;
			}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [6], nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "script_definition",
					name: "_",
					body: [
						{ node: "action", action: "GOTO_ACTION_INDEX", action_index: 44 },
						{ node: "action", action: "GOTO_ACTION_LABEL", label: "outer_loop" },
						{ node: "action", action: "RUN_SCRIPT", script: "mainMenuStart" },
						{ node: "action", action: "LOAD_MAP", map: "mainMenu" },
						{ node: "action", action: "SLOT_LOAD", slot: 3 },
						{ node: "action", action: "SLOT_ERASE", slot: 0 },
					],
				}
			]
		},
		{ name: 'no captures',
			pattern: `_ {
				save slot; 
				close dialog; 
				close serial_dialog;
				return;
			}`.replaceAll('\n',' '),
			fileSuccess: true,
			counts: { bodyNodes: [4], nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "script_definition",
					name: "_",
					body: [
						{ node: "action", action: "SLOT_SAVE" },
						{ node: "action", action: "CLOSE_DIALOG" },
						{ node: "action", action: "CLOSE_SERIAL_DIALOG" },
						{ node: "action", action: "GOTO_ACTION_LABEL", label: "auto return" },
					],
				}
			]
		},
	],
	serial_dialog_definition: [
		{ name: 'double',
			pattern: `serial_dialog test { "Test message!" "Another!" }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
				}
			]
		},
		{ name: 'parameters',
			pattern: `serial_dialog test { wrap 80 "Test message!" "Another!" }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					parameters: [{ property: 'wrap', value: 80 }],
					messages: [ "Test message!", "Another!" ],
				}
			]
		},
		{ name: 'parameters with error at the end',
			pattern: `serial_dialog test { wrap 80 asdf "Test message!" "Another!" }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					malformed: true,
					name: "test",
					parameters: [{ property: 'wrap', value: 80 }],
					messages: [ "Test message!", "Another!" ],
				}
			]
		},
		{ name: 'parameters with error in the middle',
			pattern: `serial_dialog test { wrap 80 asdf wrap 79 "Test message!" "Another!" }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					malformed: true,
					name: "test",
					parameters: [
						{ property: 'wrap', value: 80 },
						{ property: 'wrap', value: 79 },
					],
					messages: [ "Test message!", "Another!" ],
				}
			]
		},
		{ name: 'options',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ "Fill in" = correctScriptChoice`
				+`}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [{ label: 'Fill in', script: 'correctScriptChoice' }],
				}
			]
		},
		{ name: 'options mixed types',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ "Fill in" = correctScriptChoice `
				+`# "number" = wha`
				+`}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 1 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [
						{ label: 'Fill in', script: 'correctScriptChoice' },
						{ label: 'number', script: 'wha' },
					],
				}
			]
		},
		{ name: 'options no script',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ "Fill in" =`
				+`}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [{ label: 'Fill in', script: '' }],
				}
			]
		},
		{ name: 'options no equal sign / script',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ "Fill in"`
				+`}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [{ label: 'Fill in', script: '' }],
				}
			]
		},
		{ name: 'options no label / equal sign / script',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ `
				+`}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [{ label: '', script: '' }],
				}
			]
		},
		{ name: 'options with garbage',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ asdfasdf`
				+`}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_definition",
					name: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [{ label: '', script: '' }],
				}
			]
		},
	],
	dialog_definition: [
		{ name: 'double',
			pattern: `dialog greetings {`
				+ `Bob "Hello?" "Is there anyone there?"`
				+ `PLAYER "Oh?" "I heard something!"`
				+ `}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "greetings",
					dialogs: [
						{
							node: "dialog",
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?", "Is there anyone there?" ],
						},
						{
							node: "dialog",
							identifier: { type: "label", value: "PLAYER" },
							messages: [ "Oh?", "I heard something!"],
						}
					]
				}
			]
		},
		{ name: 'parameters',
			pattern: `dialog _ { Bob alignment BR "Hello?" }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							parameters: [{ property: 'alignment', value: 'BR' }],
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
						},
					]
				}
			]
		},
		{ name: 'parameters failure at the end',
			pattern: `dialog _ { Bob alignment BR ERRORTOKEN "Hello?" }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							parameters: [{ property: 'alignment', value: 'BR' }],
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
						},
					]
				}
			]
		},
		{ name: 'parameters failure in the middle',
			pattern: `dialog _ { Bob alignment BR ERRORTOKEN wrap 10 "Hello?" }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							parameters: [
								{ property: 'alignment', value: 'BR' },
								{ property: 'wrap', value: 10 },
							],
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
						},
					]
				}
			]
		},
		{ name: 'options',
			pattern: `dialog _ { Bob "Hello?" > "Oh?" = scriptName }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
							options: [{
								label: 'Oh?',
								script: 'scriptName'
							}],
						},
					]
				}
			]
		},
		{ name: 'options no script',
			pattern: `dialog _ { Bob "Hello?" > "Oh?" = }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
							options: [{
								label: 'Oh?',
								script: ''
							}],
						},
					]
				}
			]
		},
		{ name: 'options no equal sign / script',
			pattern: `dialog _ { Bob "Hello?" > "Oh?" }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
							options: [{
								label: 'Oh?',
								script: ''
							}],
						},
					]
				}
			]
		},
		{ name: 'options no label / equal sign / script',
			pattern: `dialog _ { Bob "Hello?" > }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
							options: [{
								label: '',
								script: ''
							}],
						},
					]
				}
			]
		},
		{ name: 'options with garbage',
			pattern: `dialog _ { Bob "Hello?" > asdfasdf }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_definition",
					name: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifier: { type: "label", value: "Bob" },
							messages: [ "Hello?" ],
							options: [{
								label: '',
								script: ''
							}],
						},
					]
				}
			]
		},
	],
	add_dialog_settings: [
		{ name: 'normal',
			pattern: `add dialog settings { default { alignment TR } }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: 'add_dialog_settings',
					settings: [{
						targetType: 'default',
						targetValue: '',
						settings: [
							{ property: 'alignment', value: 'TR' },
						]
					}]
				}
			]
		},
		{ name: 'error at the end',
			pattern: `add dialog settings { default { alignment TR demigloss } }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: 'add_dialog_settings',
					malformed: true,
					settings: [{
						targetType: 'default',
						targetValue: '',
						settings: [
							{ property: 'alignment', value: 'TR' },
						]
					}]
				}
			]
		},
		{ name: 'error in the middle',
			pattern: `add dialog settings { default { alignment TR deglaze portrait secretSnake } }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: 'add_dialog_settings',
					malformed: true,
					settings: [{
						targetType: 'default',
						targetValue: '',
						settings: [
							{ property: 'alignment', value: 'TR' },
							{ property: 'portrait', value: 'secretSnake' },
						]
					}]
				},
				
			]
		},
	],
	add_serial_dialog_settings: [
		{ name: 'normal',
			pattern: `add serial_dialog settings { wrap 1 }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: 'add_serial_dialog_settings',
					settings: [{ property: 'wrap', value: 1 }],
				}
			]
		},
		{ name: 'error at the end',
			pattern: `add serial_dialog settings { wrap 1 two }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: 'add_serial_dialog_settings',
					malformed: true,
					settings: [
						{ property: 'wrap', value: 1 }
					],
				}
			]
		},
		{ name: 'error in the middle',
			pattern: `add serial_dialog settings { wrap 1 two wrap 3 }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: 'add_serial_dialog_settings',
					malformed: true,
					settings: [
						{ property: 'wrap', value: 1 },
						{ property: 'wrap', value: 3 },
					],
				},
				
			]
		},
	],
	include_macro: [
		{ name: 'normal',
			pattern: `include!("header.mgs")`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 }, // should be 1 warning, 0 errors? no state is broken
			nodes: [
				{
					node: 'include_macro',
					value: 'header.mgs',
				}
			]
		},
		{ name: 'empty',
			pattern: `include!()`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 }, // should be 1 warning, 0 errors? no state is broken
			nodes: [
				{
					node: 'include_macro',
					value: '',
					malformed: true
				}
			]
		}
	],
	constant_assignment: [
		{ name: 'normal',
			pattern: `$steamedHams = "Hamburgers";`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: 'constant_assignment',
					name: '$steamedHams',
					value: 'Hamburgers'
				}
			]
		},
		{ name: 'no value',
			pattern: `$trombones = ;`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					name: '$trombones',
					value: null,
					malformed: true,
					node: 'constant_assignment',
				}
			]
		},
	],
}
const ansiRed = '\u001b[1;31m';
const ansiYellow = '\u001b[1;33m';
const ansiReset = '\u001b[0m';
const simplifyValues = (lh, rh) => {
	if (lh === null) return simplifyLiteral(lh, rh);
	if (Array.isArray(lh)) return simplifyArrays(lh, rh);
	if (typeof lh === 'object') return simplifyObjects(lh, rh);
	return simplifyLiteral(lh, rh);
}
const simplifyLiteral = (lh, rh) => {
	const red = ansiRed+JSON.stringify(rh)+ansiReset;
	const diff = lh === rh
	? rh
	: red + ` (expected ${ansiYellow}${JSON.stringify(lh)}${ansiReset})`;
	return { lh, rh, diff };
};
const simplifyArrays = (origLH = [], origRH = []) => {
	const newLH = [];
	const newRH = [];
	const newDiffs = [];
	origLH.forEach((left, i)=>{
		const right = origRH[i];
		if (Array.isArray(left)) {
			const { lh, rh, diff } = simplifyArrays(left, right);
			newLH.push(lh);
			newRH.push(rh);
			newDiffs.push(diff);
		} else if (typeof left === 'object') {
			const { lh, rh, diff } = simplifyObjects(left, right);
			newLH.push(lh);
			newRH.push(rh);
			newDiffs.push(diff);
		} else {
			const { lh, rh, diff } = simplifyLiteral(left, right);
			newLH.push(lh);
			newRH.push(rh);
			newDiffs.push(diff);
		}
	});
	return { lh: newLH, rh: newRH, diff: newDiffs };
};
const simplifyObjects = (origLH = {}, origRH = {}) => {
	const sortedLH = {};
	const sortedRH = {};
	const sortedDiff = {};
	Object.keys(origLH).sort().forEach(k=>{
		if (Array.isArray(origLH[k])) {
			const { lh, rh, diff } = simplifyArrays(origLH[k], origRH[k]);
			sortedLH[k] = lh;
			sortedRH[k] = rh;
			sortedDiff[k] = diff;
		} else if (typeof origLH[k] === 'object') {
			const { lh, rh, diff } = simplifyObjects(origLH[k], origRH[k]);
			sortedLH[k] = lh;
			sortedRH[k] = rh;
			sortedDiff[k] = diff;
		} else {
			const { lh, rh, diff } = simplifyLiteral(origLH[k], origRH[k]);
			sortedLH[k] = lh;
			sortedRH[k] = rh;
			sortedDiff[k] = diff;
		}
	});
	return { lh: sortedLH, rh: sortedRH, diff: sortedDiff };
};

const doTest = (test) => {
	const errors = [];
	const lexObject = lex(test.pattern, 'unitTests.mgs');
	const file = parseFile(lexObject, 'unitTests.mgs');
	if (test.fileSuccess !== file.success) { // I doubt this will happen
		const expected = test.fileSuccess ? 'succeeded' : 'failed';
		const found = file.success ? 'succeeded' : 'failed';
		errors.push({
			message: `Parsing ${ansiRed}${found}${ansiReset}; should have ${ansiYellow}${expected}${ansiReset}`,
		});
	}
	['nodes', 'errors', 'warnings'].forEach(item=>{
		const fileCounts = {
			nodes: file.nodes.length,
			warnings: file.warnings.length,
			errors: file.errors.length,
		};
		if (fileCounts[item] !== test.counts[item]) {
			const found = fileCounts[item];
			const foundP = fileCounts[item] !== 1;
			const foundI = foundP ? item : item.replace(/s$/,'');
			const expected = test.counts[item];
			errors.push({
				message: `Found ${ansiRed}${found} ${foundI}${ansiReset}, expected ${ansiYellow}${expected}${ansiReset}`,
			});
			file[item].forEach(v=>{
				errors.push({message: v.printable});
			});
		}
	});
	test.nodes.forEach((expected, i)=>{
		// expected.malformed = !!expected.malformed;
		const found = file.nodes[i];
		Object.keys(expected).filter(s=>s!=='body').forEach(key=>{
			const {lh, rh, diff} = simplifyValues(expected[key], found[key]);
			const jsonLeft = JSON.stringify(lh, null, '  ');
			const jsonRight = JSON.stringify(rh, null, '  ');
			if (jsonLeft !== jsonRight) {
				if (typeof lh === 'object') {
					const message = { message: `Found ${JSON.stringify(diff, null, '  ')}` }
					errors.push(message);
				} else {
					const message = { message: `Found ${ansiRed}${key}: ${jsonLeft}${ansiReset}, expected value ${ansiYellow}${jsonRight}${ansiReset}` };
					errors.push(message);
				}
			}
		});
	});
	if (test.counts.bodyNodes) {
		const foundScriptBodies = file.nodes.map(s=>s.body||[]);
		const expectedScriptBodies = test.nodes.map(s=>s.body||[]);
		expectedScriptBodies.forEach((expectedBody,i)=>{
			const foundBody = foundScriptBodies[i];
			Object.values(expectedBody).forEach((expectedAction, j)=>{
				// expected.malformed = !!expected.malformed;
				const foundAction = foundBody[j];
				const {lh, rh, diff} = simplifyValues(expectedAction, foundAction);
				const jsonLeft = JSON.stringify(lh, null, '  ');
				const jsonRight = JSON.stringify(rh, null, '  ');
				if (jsonLeft !== jsonRight) {
					if (typeof lh === 'object') {
						const message = { message: `Found nodes[${i}].body[${j}] = ${JSON.stringify(diff, null, '  ')}` }
						errors.push(message);
					} else {
						const message = { message: `Found nodes[${i}].body[${j}] = ${ansiRed}${key}: ${jsonLeft}${ansiReset}, expected value ${ansiYellow}${jsonRight}${ansiReset}` };
						errors.push(message);
					}
				}
			});
		});
	}
	return {
		testName: test.name,
		errors,
		pattern: test.pattern,
	};
};
let anyPrinted = false;
const printTestResults = (test, testCat, i) => {
	const printHeader = !i;
	if (test.errors.length === 0) {
		if (printIfOK) {
			if (printHeader) console.log(`=== ${testCat} =========>`);
			anyPrinted = true;
			console.log(`${indent}${test.testName} --> OK`);
		}
	} else {
		anyPrinted = true;
		if (printHeader) console.log(`=== ${testCat} =========>`);
		console.error(`${indent}${test.testName} -->`);
		console.error(indent+indent+'Pattern: `'+test.pattern+'`');
		test.errors.map(error=>{
			error.message = error.message.replaceAll('\\u001b[','\u001b[');
			const print = error.message.split('\n').map(s=>indent+indent+s).join('\n');
			console.error(print);
		});
	}
};
const indent = '    ';
const megaTestGamut = () => {
	Object.entries(patternTests).forEach(([testCat, tests])=>{
		tests.map(doTest).forEach((v, i)=>printTestResults(v, testCat, i));
	});
}

const topTest = () => {
	const [testCat, tests] = Object.entries(patternTests)[0];
	console.log(`=== ${testCat} =========>`);
	const doneTest = doTest(tests[0]);
	printTestResults(doneTest);
};

megaTestGamut();
// topTest();

if (!anyPrinted) console.log(`======= ALL TESTS OK =======`);

// ========================== CONDITION EXPRESSION TESTS

// // !(a || b) // Oh, I can have && now!
// // a=true, b=true = false
// // a=false, b=true = false
// // a=true, b=false = false
// // a=false, b=false = true
// // (a&&b) == !(a||b)
// const testConditionScript = `_ {
// 	if (
// 		(falseFlag || trueFlag || unknownFlag)
// 		&& !debug_mode
// 	) {}
// }`
// const testConditionParseFile = parseFile(lex(testConditionScript), tree, 'testMGSFile.mgs')
// const testConditions = testConditionParseFile.nodes[0].body[1].conditions[0];
// console.log(printCondition(testConditions));
