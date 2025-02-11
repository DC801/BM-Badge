import { lex } from "./mathlang-lex.mjs"
import { parseFile } from './mathlang-parse.mjs';

const printOKTests = false;
const topTestOnly = false;

// TODO: add 'expected' Set for syntax errors

const patternTests = {
	// set_save_flag: [
	// 	// { name: `set save flag`,
	// 	// 	pattern: `_ {
	// 	// 			storyflagBob = true;
	// 	// 		}`.replace(/[\s\n\t]+/g,' '),
	// 	// 	fileSuccess: true,
	// 	// 	counts: { bodyNodes: [1], nodes: 1, errors: 0, warnings: 0 },
	// 	// 	nodes: [{
	// 	// 		node: "script_definition",
	// 	// 		name: "_",
	// 	// 		body: [
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "SET_SAVE_FLAG",
	// 	// 				save_flag: "storyflagBob",
	// 	// 				bool_value: true,
	// 	// 			}
	// 	// 		]
	// 	// 	}]
	// 	// },
	// ],
	// boolean_assignment: [
	// 	// { name: `basic failures`,
	// 	// 	pattern: `_ {
	// 	// 			player_control = on;
	// 	// 			hex_control =
	// 	// 			hex_clipboard
	// 	// 			debug_mode =;
	// 	// 			lights_control;
	// 	// 		}`.replace(/[\s\n\t]+/g,' '),
	// 	// 	fileSuccess: true,
	// 	// 	counts: { bodyNodes: [3], nodes: 1, errors: 0, warnings: 0 },
	// 	// 	nodes: [{
	// 	// 		node: "script_definition",
	// 	// 		name: "_",
	// 	// 		body: [
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "SET_ENTITY_GLITCHED",
	// 	// 				entity: "Bob",
	// 	// 				bool_value: true,
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "SET_ENTITY_GLITCHED",
	// 	// 				entity: "%PLAYER%",
	// 	// 				bool_value: true,
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "SET_ENTITY_GLITCHED",
	// 	// 				entity: "%SELF%",
	// 	// 				bool_value: true,
	// 	// 			},
	// 	// 		]
	// 	// 	}]
	// 	// },
	// 	// { name: `entity glitched true`,
	// 	// 	pattern: `_ {
	// 	// 			entity Bob glitched = true;
	// 	// 			player glitched = open;
	// 	// 			self glitched = on;
	// 	// 		}`.replace(/[\s\n\t]+/g,' '),
	// 	// 	fileSuccess: true,
	// 	// 	counts: { bodyNodes: [3], nodes: 1, errors: 0, warnings: 0 },
	// 	// 	nodes: [{
	// 	// 		node: "script_definition",
	// 	// 		name: "_",
	// 	// 		body: [
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "SET_ENTITY_GLITCHED",
	// 	// 				entity: "Bob",
	// 	// 				bool_value: true,
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "SET_ENTITY_GLITCHED",
	// 	// 				entity: "%PLAYER%",
	// 	// 				bool_value: true,
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "SET_ENTITY_GLITCHED",
	// 	// 				entity: "%SELF%",
	// 	// 				bool_value: true,
	// 	// 			},
	// 	// 		]
	// 	// 	}]
	// 	// },
	// 	// { name: `entity glitched false`,
	// 	// 	pattern: `_ {
	// 	// 			entity "Bob" glitched = false;
	// 	// 			player glitched = closed;
	// 	// 			self glitched = off;
	// 	// 		}`.replace(/[\s\n\t]+/g,' '),
	// 	// 	fileSuccess: true,
	// 	// 	counts: { bodyNodes: [3], nodes: 1, errors: 0, warnings: 0 },
	// 	// 	nodes: [{
	// 	// 		node: "script_definition",
	// 	// 		name: "_",
	// 	// 		body: [
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "SET_ENTITY_GLITCHED",
	// 	// 				entity: "Bob",
	// 	// 				bool_value: false,
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "SET_ENTITY_GLITCHED",
	// 	// 				entity: "%PLAYER%",
	// 	// 				bool_value: false,
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "SET_ENTITY_GLITCHED",
	// 	// 				entity: "%SELF%",
	// 	// 				bool_value: false,
	// 	// 			},
	// 	// 		]
	// 	// 	}]
	// 	// },
	// ],
	// do_over_time_operator: [
	// 	// { name: `camera over time`,
	// 	// 	pattern: `_ {
	// 	// 			camera -> geometry walkPath origin over 1s;
	// 	// 			camera -> geometry "walkPath" length over 1000ms;
	// 	// 			camera -> geometry walkPath length forever;
	// 	// 			camera -> entity Bob position over 1ms;
	// 	// 		}`.replace(/[\s\n\t]+/g,' '),
	// 	// 	fileSuccess: true,
	// 	// 	counts: { bodyNodes: [4], nodes: 1, errors: 0, warnings: 0 },
	// 	// 	nodes: [{
	// 	// 		node: "script_definition",
	// 	// 		name: "_",
	// 	// 		body: [
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "PAN_CAMERA_TO_GEOMETRY",
	// 	// 				geometry: "walkPath",
	// 	// 				duration: 1000,
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "PAN_CAMERA_ALONG_GEOMETRY",
	// 	// 				geometry: "walkPath",
	// 	// 				duration: 1000,
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "LOOP_CAMERA_ALONG_GEOMETRY",
	// 	// 				geometry: "walkPath",
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "PAN_CAMERA_TO_ENTITY",
	// 	// 				entity: "Bob",
	// 	// 				duration: 1,
	// 	// 			}
	// 	// 		]
	// 	// 	}]
	// 	// },
	// 	// { name: `entity identifier over time`,
	// 	// 	pattern: `_ {
	// 	// 			entity Bob position -> geometry walkPath origin over 1s;
	// 	// 			player position -> geometry "walkPath" length over 1000ms;
	// 	// 			self position -> geometry walkPath length forever;
	// 	// 			entity Bob animation -> 3 twice;
	// 	// 		}`.replace(/[\s\n\t]+/g,' '),
	// 	// 	fileSuccess: true,
	// 	// 	counts: { bodyNodes: [4], nodes: 1, errors: 0, warnings: 0 },
	// 	// 	nodes: [{
	// 	// 		node: "script_definition",
	// 	// 		name: "_",
	// 	// 		body: [
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "WALK_ENTITY_TO_GEOMETRY",
	// 	// 				entity: "Bob",
	// 	// 				geometry: "walkPath",
	// 	// 				duration: 1000,
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "WALK_ENTITY_ALONG_GEOMETRY",
	// 	// 				entity: "%PLAYER%",
	// 	// 				geometry: "walkPath",
	// 	// 				duration: 1000,
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "LOOP_ENTITY_ALONG_GEOMETRY",
	// 	// 				entity: "%SELF%",
	// 	// 				geometry: "walkPath",
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "PLAY_ENTITY_ANIMATION",
	// 	// 				entity: "Bob",
	// 	// 				animation: 3,
	// 	// 				play_count: 2,
	// 	// 			}
	// 	// 		]
	// 	// 	}]
	// 	// },
	// 	// { name: `not over time but similar`,
	// 	// 	pattern: `_ {
	// 	// 			camera position = geometry mapPath;
	// 	// 			camera position = player position;
	// 	// 			entity Bob position = geometry geometryName;
	// 	// 		}`.replace(/[\s\n\t]+/g,' '),
	// 	// 	fileSuccess: true,
	// 	// 	counts: { bodyNodes: [3], nodes: 1, errors: 0, warnings: 0 },
	// 	// 	nodes: [{
	// 	// 		node: "script_definition",
	// 	// 		name: "_",
	// 	// 		body: [
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "TELEPORT_CAMERA_TO_GEOMETRY",
	// 	// 				geometry: "mapPath",
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "SET_CAMERA_TO_FOLLOW_ENTITY",
	// 	// 				entity: "%PLAYER%",
	// 	// 			},
	// 	// 			{
	// 	// 				node: "action",
	// 	// 				action: "TELEPORT_ENTITY_TO_GEOMETRY",
	// 	// 				entity: "Bob",
	// 	// 				geometry: "geometryName",
	// 	// 			},
	// 	// 		]
	// 	// 	}]
	// 	// },
	// ],
	// show_serial_dialog: [
	// 	// { name: 'inline definition vs reference & named vs autonamed',
	// 	// 	pattern: `testScript {
	// 	// 			show serial_dialog YesReferenceNoDefinition;
	// 	// 			show serial_dialog {
	// 	// 				"Defined two nodes above 'testScript'; autonamed"
	// 	// 			};
	// 	// 			show serial_dialog defAndRef {
	// 	// 				"Defined one node above 'testScript'; named 'defAndRef'"
	// 	// 			};
	// 	// 		}`.replace(/[\s\n\t]+/g,' '),
	// 	// 	fileSuccess: true,
	// 	// 	counts: { bodyNodes: [0,0,3], nodes: 3, errors: 0, warnings: 0 },
	// 	// 	nodes: [
	// 	// 		{
	// 	// 			node: "serial_dialog_definition",
	// 	// 			name: "unitTests.mgs:1:78",
	// 	// 			messages: [ "Defined two nodes above 'testScript'; autonamed" ],
	// 	// 		},
	// 	// 		{
	// 	// 			node: "serial_dialog_definition",
	// 	// 			name: "defAndRef",
	// 	// 			messages: [ "Defined one node above 'testScript'; named 'defAndRef'" ],
	// 	// 		},
	// 	// 		{
	// 	// 			node: "script_definition",
	// 	// 			name: "testScript",
	// 	// 			body: [
	// 	// 				{
	// 	// 					node: "action",
	// 	// 					action: "SHOW_SERIAL_DIALOG",
	// 	// 					serial_dialog: "YesReferenceNoDefinition",
	// 	// 				},
	// 	// 				{
	// 	// 					node: "action",
	// 	// 					action: "SHOW_SERIAL_DIALOG",
	// 	// 					serial_dialog: "unitTests.mgs:1:78",
	// 	// 				},
	// 	// 				{
	// 	// 					node: "action",
	// 	// 					action: "SHOW_SERIAL_DIALOG",
	// 	// 					serial_dialog: "defAndRef",
	// 	// 				},
	// 	// 			],
	// 	// 		},
	// 	// 	]
	// 	// },
	// ],
	// show_dialog: [
	// 	// { name: 'inline definition vs reference & named vs autonamed',
	// 	// 	pattern: `testScript {
	// 	// 			show dialog YesReferenceNoDefinition;
	// 	// 			show dialog {
	// 	// 				PLAYER "Defined two nodes above 'testScript'; autonamed"
	// 	// 			};
	// 	// 			show dialog defAndRef {
	// 	// 				PLAYER "Defined one node above 'testScript'; named 'defAndRef'"
	// 	// 			};
	// 	// 		}`.replace(/[\s\n\t]+/g,' '),
	// 	// 	fileSuccess: true,
	// 	// 	counts: { bodyNodes: [0,0,3], nodes: 3, errors: 0, warnings: 0 },
	// 	// 	nodes: [
	// 	// 		{
	// 	// 			node: "dialog_definition",
	// 	// 			name: "unitTests.mgs:1:64",
	// 	// 			dialogs: [{
	// 	// 				node: "dialog",
	// 	// 				messages: [ "Defined two nodes above 'testScript'; autonamed", ],
	// 	// 				identifier: { type: "label", value: "PLAYER" },
	// 	// 			}],
	// 	// 		},
	// 	// 		{
	// 	// 			node: "dialog_definition",
	// 	// 			name: "defAndRef",
	// 	// 			dialogs: [{
	// 	// 				  node: "dialog",
	// 	// 				  messages: [ "Defined one node above 'testScript'; named 'defAndRef'" ],
	// 	// 				  identifier: { type: "label", value: "PLAYER" },
	// 	// 			}],
	// 	// 		},
	// 	// 		{
	// 	// 			node: "script_definition",
	// 	// 			name: "testScript",
	// 	// 			body: [
	// 	// 				{
	// 	// 					node: "action",
	// 	// 					action: "SHOW_DIALOG",
	// 	// 					serial_dialog: "YesReferenceNoDefinition",
	// 	// 				},
	// 	// 				{
	// 	// 					node: "action",
	// 	// 					action: "SHOW_DIALOG",
	// 	// 					serial_dialog: "unitTests.mgs:1:64",
	// 	// 				},
	// 	// 				{
	// 	// 					node: "action",
	// 	// 					action: "SHOW_DIALOG",
	// 	// 					serial_dialog: "defAndRef",
	// 	// 				},
	// 	// 			],
	// 	// 		},
	// 	// 	]
	// 	// },
	// ],
	script_actions: [
		{ name: 'dictionary entry with outside lookup',
			pattern: `_ {
				pause entity Bob on_tick;
				unpause player on_look;
			}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [2], nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "script_literal",
					label: "_",
					body: [
						{
							node: "action",
							action: "SET_SCRIPT_PAUSE",
							bool_value: true,
							script_slot: "on_tick",
							entity: "Bob",
						},
						{
							node: "action",
							action: "SET_SCRIPT_PAUSE",
							bool_value: false,
							script_slot: "on_look",
							entity: "%PLAYER%",
						},
					],
				}
			]
		},
		{ name: 'simple with errors',
			// NOTE: these are separate scripts because the errors accidentally glomp onto each other,
			// e.g. `hide command \n wait` -> "hide command 'wait'" instead of two separate, broken things
			pattern: `_ { hide command walk }
				_ { block "string"; }
				_ { wait }
				_ { unhide command }`,
			fileSuccess: true,
			counts: { bodyNodes: [1,1,1,1], nodes: 4, errors: 4, warnings: 0 },
			nodes: [
				{
					node: "script_literal",
					label: "_",
					body: [{
						node: "action",
						action: "SET_SERIAL_DIALOG_COMMAND_VISIBILITY",
						command: "walk",
						is_visible: false,
						malformed: true,
					}],
				},
				{
					node: "script_literal",
					label: "_",
					body: [{
						node: "action",
						action: "BLOCKING_DELAY",
						duration: undefined,
						malformed: true,
					}],
				},
				{
					node: "script_literal",
					label: "_",
					body: [
					{
						node: "action",
						action: "NON_BLOCKING_DELAY",
						duration: undefined,
						malformed: true,
					}],
				},
				{
					node: "script_literal",
					label: "_",
					body: [{
						node: "action",
						action: "SET_SERIAL_DIALOG_COMMAND_VISIBILITY",
						command: undefined,
						is_visible: true,
						malformed: true,
					}],
				}
			]
		},
		{ name: 'simple',
			pattern: `_ {
				hide command walk;
				unhide command "walk";
				wait 800ms;
				block 1s;
			}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [6], nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "script_literal",
					label: "_",
					body: [
						{ node: "action", action: "SET_SERIAL_DIALOG_COMMAND_VISIBILITY", command: "walk", is_visible: false },
						{ node: "action", action: "SET_SERIAL_DIALOG_COMMAND_VISIBILITY", command: "walk", is_visible: true },
						{ node: "action", action: "NON_BLOCKING_DELAY", duration: 800 },
						{ node: "action", action: "BLOCKING_DELAY", duration: 1000 },
					],
				}
			]
		},
		{ name: 'game flow manip',
			pattern: `_ {
				goto script "mainMenuStart";
				goto index 44;
				goto label outer_loop;
				load map mainMenu;
				load slot 3;
				erase slot 0;
			}`.replace(/[\s\n\t]+/g,' '),
			fileSuccess: true,
			counts: { bodyNodes: [6], nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "script_literal",
					label: "_",
					body: [
						{ node: "action", action: "RUN_SCRIPT", script: "mainMenuStart" },
						{ node: "action", action: "GOTO_ACTION_INDEX", action_index: 44 },
						{ node: "action", action: "GOTO_ACTION_LABEL", label: "outer_loop" },
						{ node: "action", action: "LOAD_MAP", map: "mainMenu" },
						{ node: "action", action: "SLOT_LOAD", slot: 3 },
						{ node: "action", action: "SLOT_ERASE", slot: 0 },
					],
				}
			]
		},
		{ name: 'zero captures',
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
					node: "script_literal",
					label: "_",
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
					node: "script_literal",
					label: "_",
					body: [{
						node: "json_literal",
						value: [
							{
								action: "NEW_ACTION",
								prop1: "string",
								prop2: 100,
								prop3: false,
								prop4: [ "LED_BIT128", "LED_BIT8" ],
								prop5: {
									inner: "This has gone too far!",
									innerAgain: 9001,
								},
							},
						],
					}],
				},
			]
		},
	],
	serial_dialog_definition: [
		{ name: 'double',
			pattern: `serial_dialog test { "Test message!" "Another!"; }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_literal",
					label: "test",
					messages: [ "Test message!", "Another!" ],
				}
			]
		},
		{ name: 'parameters',
			pattern: `serial_dialog test { wrap 80 "Test message!" "Another!"; }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_literal",
					label: "test",
					parameters: [{ property: 'wrap', value: 80 }],
					messages: [ "Test message!", "Another!" ],
				}
			]
		},
		{ name: 'parameters with error at the end',
			pattern: `serial_dialog test { wrap 80 asdf "Test message!" "Another!"; }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_literal",
					malformed: true,
					label: "test",
					parameters: [{ property: 'wrap', value: 80 }],
					messages: [ "Test message!", "Another!" ],
				}
			]
		},
		{ name: 'parameters with error in the middle',
			pattern: `serial_dialog test { wrap 80 asdf wrap 79 "Test message!" "Another!"; }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_literal",
					malformed: true,
					label: "test",
					parameters: [
						{ property: 'wrap', value: 80 },
						{},
						// { property: 'wrap', value: 79 }, // TODO: I want this to be captured, too... :(
					],
					messages: [ "Test message!", "Another!" ],
				}
			]
		},
		{ name: 'options',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ "Fill in" = correctScriptChoice;`
				+`}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "serial_dialog_literal",
					label: "test",
					messages: [ "Test message!", "Another!" ],
					options: [
						{
							optionType: '_',
							label: 'Fill in',
							script: 'correctScriptChoice',
						}
					],
				}
			]
		},
		{ name: 'options mixed types',
			pattern: `serial_dialog test { "Test message!" "Another!"`
				+`_ "Fill in" = correctScriptChoice `
				+`# "number" = wha`
				+`;}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 1 },
			nodes: [
				{
					node: "serial_dialog_literal",
					label: "test",
					messages: [ "Test message!", "Another!" ],
					options: [
						{
							optionType: '_',
							label: 'Fill in',
							script: 'correctScriptChoice',
						},
						{
							optionType: '#',
							label: 'number',
							script: 'wha',
						},
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
					node: "serial_dialog_literal",
					label: "test",
					messages: [ "Test message!", "Another!" ],
					options: [
						{
							optionType: '_',
							label: 'Fill in',
							script: undefined,
						},
					],
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
					node: "serial_dialog_literal",
					label: "test",
					messages: [ "Test message!", "Another!" ],
					options: [
						{
							optionType: '_',
							label: 'Fill in',
							script: undefined,
						},
					],
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
					node: "serial_dialog_literal",
					label: "test",
					messages: [ "Test message!", "Another!" ],
					options: [
						{
							optionType: '_',
							label: undefined,
							script: undefined,
						},
					],
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
					node: "serial_dialog_literal",
					label: "test",
					messages: [ "Test message!", "Another!" ],
					text_options: [{ label: undefined, script: undefined }],
				}
			]
		},
	],
	dialog_definition: [
		{ name: 'options no script',
			pattern: `dialog _ { Bob "Hello?" > "Oh?" = }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_literal",
					label: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifierType: null,
							identifierValue: 'Bob',
							messages: [ "Hello?" ],
							options: [{
								label: 'Oh?',
								script: undefined,
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
					node: "dialog_literal",
					label: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifierType: null,
							identifierValue: 'Bob',
							messages: [ "Hello?" ],
							options: [{
								label: 'Oh?',
								script: undefined,
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
					node: "dialog_literal",
					label: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifierType: null,
							identifierValue: 'Bob',
							messages: [ "Hello?" ],
							options: [{
								label: undefined,
								script: undefined,
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
					node: "dialog_literal",
					label: "_",
					dialogs: [
						{
							node: "dialog",
							malformed: true,
							identifierType: null,
							identifierValue: 'Bob',
							messages: [ "Hello?" ],
							options: [{
								label: undefined,
								script: undefined,
							}],
						},
					]
				}
			]
		},
		{ name: 'options',
			pattern: `dialog _ { Bob "Hello?" > "Oh?" = scriptName; }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "dialog_literal",
					label: "_",
					dialogs: [
						{
							node: "dialog",
							identifierType: null,
							identifierValue: 'Bob',
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
		{ name: 'parameters failure in the middle with linebreaks',
			pattern: `dialog _ {\nBob\nalignment BR\nERRORTOKEN\nwrap 10\n"Hello?";\n}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_literal",
					label: "_",
					dialogs: [
						{
							node: "dialog",
							parameters: [
								{ property: 'alignment', value: 'BR' },
								{},
								{ property: 'wrap', value: 10 },
							],
							identifierType: null,
							identifierValue: 'Bob',
							messages: [ "Hello?" ],
						},
					]
				}
			]
		},
		{ name: 'parameters failure in the middle',
			pattern: `dialog _ { Bob alignment BR ERRORTOKEN wrap 10 "Hello?"; }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_literal",
					label: "_",
					dialogs: [
						{
							node: "dialog",
							parameters: [
								{ property: 'alignment', value: 'BR' },
								{},
								// { property: 'wrap', value: 10 }, // TODO: I want this to be captured, too... :(
							],
							identifierType: null,
							identifierValue: 'Bob',
							messages: [ "Hello?" ],
						},
					]
				}
			]
		},
		{ name: 'parameters failure at the end',
			pattern: `dialog _ { Bob alignment BR ERRORTOKEN "Hello?"; }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: "dialog_literal",
					label: "_",
					dialogs: [
						{
							node: "dialog",
							parameters: [{ property: 'alignment', value: 'BR' }],
							identifierType: null,
							identifierValue: 'Bob',
							messages: [ "Hello?" ],
						},
					]
				}
			]
		},
		{ name: 'parameters',
			pattern: `dialog _ { Bob alignment BR "Hello?"; }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "dialog_literal",
					label: "_",
					dialogs: [
						{
							node: "dialog",
							identifierType: null,
							identifierValue: 'Bob',
							parameters: [{ property: 'alignment', value: 'BR' }],
							messages: [ "Hello?" ],
						},
					]
				}
			]
		},
		{ name: 'double',
			pattern: `dialog greetings {`
				+ `Bob "Hello?" "Is there anyone there?";`
				+ `PLAYER "Oh?" "I heard something!";`
				+ `}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: "dialog_literal",
					label: "greetings",
					dialogs: [
						{
							node: "dialog",
							identifierType: null,
							identifierValue: 'Bob',
							messages: [ "Hello?", "Is there anyone there?" ],
						},
						{
							node: "dialog",
							identifierType: null,
							identifierValue: 'PLAYER',
							messages: [ "Oh?", "I heard something!"],
						}
					]
				}
			]
		},
	],
	add_dialog_settings: [
		{ name: 'error in the middle with newlines',
			pattern: `add dialog settings {\ndefault {\nalignment TR\ndeglaze\nportrait secretSnake\n}\n}`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: 'add_dialog_settings',
					malformed: true,
					targets: [{
						targetType: 'default',
						targetValue: null,
						settings: [
							{ property: 'alignment', value: 'TR' },
							{},
							{ property: 'portrait', value: 'secretSnake' },
						]
					}]
				},
				
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
					targets: [{
						targetType: 'default',
						targetValue: null,
						settings: [
							{ property: 'alignment', value: 'TR' },
							{},
							// { property: 'portrait', value: 'secretSnake' }, // TODO: I want this to be captured, too... :(
						]
					}]
				},
				
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
					targets: [{
						node: 'dialog_settings_target',
						targetType: 'default',
						targetValue: null,
						settings: [
							{ property: 'alignment', value: 'TR' },
						]
					}]
				}
			]
		},
		{ name: 'normal',
			pattern: `add dialog settings { default { alignment TR } }`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: 'add_dialog_settings',
					targets: [{
						node: 'dialog_settings_target',
						targetType: 'default',
						targetValue: null,
						settings: [
							{ property: 'alignment', value: 'TR' },
						]
					}],
				}
			]
		},
	],
	add_serial_dialog_settings: [
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
						{},
						// { property: 'wrap', value: 3 }, // TODO: I want this to be captured, too... :(
					],
				},
				
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
	],
	include_macro: [
		{ name: 'empty',
			pattern: `include`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 }, // should be 1 warning, 0 errors? no state is *broken* broken
			nodes: [
				{
					node: 'include_macro',
					value: null,
					malformed: true
				}
			]
		},
		{ name: 'normal',
			pattern: `include "header.mgs";`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 }, // should be 1 warning, 0 errors? no state is *broken* broken
			nodes: [
				{
					node: 'include_macro',
					value: 'header.mgs',
				}
			]
		},
	],
	constant_assignment: [
		{ name: 'no value',
			pattern: `$trombones = ;`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 1, warnings: 0 },
			nodes: [
				{
					node: 'constant_assignment',
					label: '$trombones',
					value: null,
					malformed: true,
				}
			]
		},
		{ name: 'normal',
			pattern: `$steamedHams = "Hamburgers";`,
			fileSuccess: true,
			counts: { nodes: 1, errors: 0, warnings: 0 },
			nodes: [
				{
					node: 'constant_assignment',
					label: '$steamedHams',
					value: 'Hamburgers'
				}
			]
		},
	],
};

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
		if (origLH[k] === null) {
			const { lh, rh, diff } = simplifyLiteral(origLH[k], origRH[k]);
			sortedLH[k] = lh;
			sortedRH[k] = rh;
			sortedDiff[k] = diff;
		} else if (Array.isArray(origLH[k])) {
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
	const file = parseFile(test.pattern, 'unitTests.mgs');
	if (test.fileSuccess !== file.success) { // I doubt this will happen
		const expected = test.fileSuccess ? 'succeeded' : 'failed';
		const found = file.success ? 'succeeded' : 'failed';
		const message = `Parsing ${ansiRed}${found}${ansiReset}; should have ${ansiYellow}${expected}${ansiReset}`;
		errors.push({ message });
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
			const message = `Found ${ansiRed}${found} ${foundI}${ansiReset}, expected ${ansiYellow}${expected}${ansiReset}`;
			errors.push({ message });
			file[item].forEach(v=>{
				errors.push({message: v.message});
			});
		}
	});
	test.nodes.forEach((expected, i)=>{
		// expected.malformed = !!expected.malformed;
		const found = file.nodes[i];
		if (!found)  {
			return {
				testName: test.name,
				errors: [{ message: `Node missing in real file` }],
				pattern: test.pattern,
			};
		}
		Object.keys(expected).filter(s=>s!=='body').forEach(key=>{
			const {lh, rh, diff} = simplifyValues(expected[key], found[key]);
			const jsonLeft = JSON.stringify(lh, null, '  ');
			const jsonRight = JSON.stringify(rh, null, '  ');
			if (jsonLeft !== jsonRight) {
				if (typeof lh === 'object') {
					const message = `Found ${JSON.stringify(diff, null, '  ')}`
					errors.push({ message });
				} else {
					const message = `Found ${ansiRed}${key}: ${jsonRight}${ansiReset}, expected value ${ansiYellow}${jsonLeft}${ansiReset}`
					errors.push({ message });
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
						const message = `Found nodes[${i}].body[${j}] = ${JSON.stringify(diff, null, '  ')}`
						errors.push({ message });
					} else {
						const message = `Found nodes[${i}].body[${j}] = ${ansiRed}${key}: ${jsonLeft}${ansiReset}, expected value ${ansiYellow}${jsonRight}${ansiReset}`;
						errors.push({ message });
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
let aTestWasPrinted = false;
const printTestResults = (test, testCat, i) => {
	// print header only when it's the first test
	const firstTest = !i;
	if (test.errors.length === 0) {
		if (printOKTests) {
			if (firstTest) console.log(`=== ${testCat} =========>`);
			aTestWasPrinted = true;
			console.log(`${indent}${test.testName} --> OK`);
		}
	} else {
		aTestWasPrinted = true;
		if (firstTest) console.log(`=== ${testCat} =========>`);
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
	const doneTest = doTest(tests[0]);
	printTestResults(doneTest, testCat);
};

if (topTestOnly) {
	topTest();
} else {
	megaTestGamut();
}

if (!aTestWasPrinted) console.log(`======= ALL TESTS OK =======`);

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
