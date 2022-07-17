var fs = require('fs')

var testTokens = [
	[ 'block', '1ms' ],
	[ 'camera', 'follow', 'entity', '"Entity Name"' ],
	[ 'close', 'hex', 'editor' ],
	[ 'open', 'hex', 'editor' ],
	[ 'rotate', 'entity', '"Entity Name"', '1' ],
	[ 'erase', 'slot', '2' ],
	[ 'goto', '"script-to-run"' ],
	[ 'loop', 'entity', '"Entity Name"', 'along', 'geometry', '"geometry-name-loop"', 'over', '1000ms' ],
	[ 'save', 'slot' ],
	[ 'shake', 'camera', '1000ms', '30px', 'for', '4000ms' ],
	[ 'wait', '100000ms' ],
	[ 'walk', 'entity', '"Entity Name"', 'to', 'geometry', '"geometry-name-walk-to"', 'over', '1000ms' ],
	[ 'walk', 'entity', '"Entity Name"', 'along', 'geometry', '"geometry-name-walk-along"', 'over', '1000ms' ],
	[ 'make', 'entity', '"Entity Name"', 'glitched' ],
	[ 'make', 'entity', '"Entity Name"', 'unglitched' ],
	[ 'teleport', 'entity', '"Entity Name"', 'to', 'geometry', '"geometry-name-teleport"' ],
	[ 'teleport', 'camera', 'to', 'geometry', '"geometry-name-to-teleport"' ],
	[ 'turn', 'entity', '"Entity Name"', 'north' ],
	[ 'turn', 'entity', '"Entity Name"', 'toward', 'entity', '"Target Entity"' ],
	[ 'turn', 'entity', '"Entity Name"', 'toward', 'entity', '"target-geometry"' ],
	[ 'pan', 'camera', 'to', 'entity', '"Entity Name"', 'over', '1000ms' ],
	[ 'pan', 'camera', 'to', 'geometry', '"geometry-to-pan-camera"', 'over', '1000ms' ],
	[ 'play', 'entity', '"Entity Name"', 'animation', '0', 'x1' ],
	[ 'fade', 'out', 'camera', 'to', '#FF0000', 'over', '1000ms' ],
	[ 'fade', 'in', 'camera', 'from', '#00FF00', 'over', '1000ms' ],
	[ 'load', 'map', '"super-long-map-name"' ],
	[ 'load', 'slot', '0' ],
	[ 'show', 'dialog', '"super-long-dialog-name"' ],
	[ 'show', 'serial', 'dialog', '"serial-dialog"' ],
	[ 'copy', '"script-to-copy"' ],
	[ 'copy', 'entity', '"Entity Name"', 'x', 'into', 'variable', '"variable-name-inbound"' ],
	[ 'copy', 'entity', '"Entity Name"', 'y', 'from', 'variable', '"variable-name-outbound"' ],
	[ 'mutate', '"variable-name-set"', '=', '5' ],
	[ 'mutate', '"variable-name-add"', '+', '5' ],
	[ 'mutate', '"variable-name-sub"', '-', '5' ],
	[ 'mutate', '"variable-name-div"', '/', '5' ],
	[ 'mutate', '"variable-name-mul"', '*', '5' ],
	[ 'mutate', '"variable-name-mod"', '%', '5' ],
	[ 'mutate', '"variable-name-rng"', '?', '5' ],
	[ 'mutate', '"variable-name-set"', '=', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-add"', '+', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-sub"', '-', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-div"', '/', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-mul"', '*', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-mod"', '%', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-rng"', '?', '"another-variable-name"' ],
	[ 'set', 'map', 'tick', 'script', 'to', '"script-map-tick"' ],
	[ 'set', 'warp', 'state', 'to', '"warp-state-string"' ],
	[ 'set', 'flag', '"save-flag-to-set"', 'to', 'true' ],
	[ 'set', 'flag', '"save-flag-to-set-NOT"', 'to', 'false' ],
	[ 'set', 'player', 'control', 'on' ],
	[ 'set', 'player', 'control', 'off' ],
	[ 'set', 'hex', 'dialog', 'mode', 'on' ],
	[ 'set', 'hex', 'dialog', 'mode', 'off' ],
	[ 'set', 'hex', 'control', 'on' ],
	[ 'set', 'hex', 'control', 'off' ],
	[ 'set', 'hex', 'clipboard', 'on' ],
	[ 'set', 'hex', 'clipboard', 'off' ],
	[ 'set', 'entity', '"Entity Name"', 'name', 'to', '"New Name"' ],
	[ 'set', 'entity', '"Entity Name"', 'x', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'y', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'type', 'to', '"some-kinda-sheep"' ],
	[ 'set', 'entity', '"Entity Name"', 'primaryID', 'to', '1' ],
	[ 'set', 'entity', '"Entity Name"', 'secondaryID', 'to', '2' ],
	[ 'set', 'entity', '"Entity Name"', 'primaryIDtype', 'to', '5' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateA', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateB', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateC', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateD', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateAU2', 'to', '2' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateCU2', 'to', '2' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateAU4', 'to', '4' ],
	[ 'set', 'entity', '"Entity Name"', 'path', 'to', '"geometry-name-entity-path"' ],
	[ 'set', 'entity', '"Entity Name"', 'animation', 'to', '0' ],
	[ 'set', 'entity', '"Entity Name"', 'animationFrame', 'to', '0' ],
	[ 'set', 'entity', '"Entity Name"', 'interactScript', 'to', '"script-entity-interact"' ],
	[ 'set', 'entity', '"Entity Name"', 'tickScript', 'to', '"script-entity-tick"' ],
	[ 'if', 'flag', '"i-am-a-save-flag"', 'is', 'true', 'goto', '"script-do-if-flag-true"' ],
	[ 'if', 'flag', '"i-am-a-save-flag"', 'is', 'false', 'goto', '"script-do-if-flag-false"' ],
	[ 'if', 'button', 'ANY', 'goto', '"script-do-if-button"' ],
	[ 'if', 'button', 'ANY', 'is', 'pressed', 'goto', '"script-do-if-button-state"' ],
	[ 'if', 'button', 'ANY', 'is', 'not', 'pressed', 'goto', '"script-do-if-button-state-NOT"' ],
	[ 'if', 'warp', 'state', 'is', '"warp-state-string"', 'goto', '"script-do-if-warp-state"' ],
	[ 'if', 'warp', 'state', 'is', 'not', '"warp-state-string"', 'goto', '"script-do-if-NOT-warp-state"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', '15', 'goto', '"script-do-if-variable-=="' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', '<', '15', 'goto', '"script-do-if-variable-<"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', 'not', '15', 'goto', '"script-do-if-variable-==-NOT"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', 'not', '<', '15', 'goto', '"script-do-if-variable-<-NOT"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', '"i-am-a-second-variable"', 'goto', '"script-do-if-variable-=="' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', '<', '"i-am-a-second-variable"', 'goto', '"script-do-if-variable-<"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', 'not', '"i-am-a-second-variable"', 'goto', '"script-do-if-variable-==-NOT"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', 'not', '<', '"i-am-a-second-variable"', 'goto', '"script-do-if-variable-<-NOT"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateAU4', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-a-u4"' ],
	[ 'if', 'entity', '"Entity Name"', 'name', 'is', '"Checked Name"', 'goto', '"script-do-if-entity-name"' ],
	[ 'if', 'entity', '"Entity Name"', 'x', 'is', '0', 'goto', '"script-do-if-entity-x"' ],
	[ 'if', 'entity', '"Entity Name"', 'interactScript', 'is', '"name-of-checked-script-interact"', 'goto', '"script-do-if-entity-y"' ],
	[ 'if', 'entity', '"Entity Name"', 'tickScript', 'is', '"name-of-checked-script-tick"', 'goto', '"script-do-if-entity-tick"' ],
	[ 'if', 'entity', '"Entity Name"', 'type', 'is', '"some-kind-of-entity-type"', 'goto', '"script-do-if-entity-type"' ],
	[ 'if', 'entity', '"Entity Name"', 'primaryID', 'is', '16', 'goto', '"script-do-if-entity-primaryid"' ],
	[ 'if', 'entity', '"Entity Name"', 'secondaryID', 'is', '16', 'goto', '"script-do-if-entity-secondaryid"' ],
	[ 'if', 'entity', '"Entity Name"', 'primaryIDtype', 'is', '16', 'goto', '"script-do-if-entity-primaryid-type"' ],
	[ 'if', 'entity', '"Entity Name"', 'animation', 'is', '1', 'goto', '"script-do-if-entity-animation"' ],
	[ 'if', 'entity', '"Entity Name"', 'animationFrame', 'is', '1', 'goto', '"script-do-if-entity-frame"' ],
	[ 'if', 'entity', '"Entity Name"', 'direction', 'is', 'north', 'goto', '"script-do-if-entity-direction"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateA', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-a"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateB', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-b"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateC', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-c"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateD', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-d"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateAU2', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-a-u2"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateCU2', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-c-u2"' ],
	[ 'if', 'entity', '"Entity Name"', 'path', 'is', '"some-kind-of-geometry-name"', 'goto', '"script-do-if-entity-path"' ],
	[ 'if', 'entity', '"Entity Name"', 'name', 'is', 'not', '"Checked Name"', 'goto', '"script-do-if-entity-name"' ],
	[ 'if', 'entity', '"Entity Name"', 'x', 'is', 'not', '0', 'goto', '"script-do-if-entity-x"' ],
	[ 'if', 'entity', '"Entity Name"', 'interactScript', 'is', 'not', '"name-of-checked-script-interact"', 'goto', '"script-do-if-entity-y"' ],
	[ 'if', 'entity', '"Entity Name"', 'tickScript', 'is', 'not', '"name-of-checked-script-tick"', 'goto', '"script-do-if-entity-tick"' ],
	[ 'if', 'entity', '"Entity Name"', 'type', 'is', 'not', '"some-kind-of-entity-type"', 'goto', '"script-do-if-entity-type"' ],
	[ 'if', 'entity', '"Entity Name"', 'primaryID', 'is', 'not', '16', 'goto', '"script-do-if-entity-primaryid"' ],
	[ 'if', 'entity', '"Entity Name"', 'secondaryID', 'is', 'not', '16', 'goto', '"script-do-if-entity-secondaryid"' ],
	[ 'if', 'entity', '"Entity Name"', 'primaryIDtype', 'is', 'not', '16', 'goto', '"script-do-if-entity-primaryid-type"' ],
	[ 'if', 'entity', '"Entity Name"', 'animation', 'is', 'not', '1', 'goto', '"script-do-if-entity-animation"' ],
	[ 'if', 'entity', '"Entity Name"', 'animationFrame', 'is', 'not', '1', 'goto', '"script-do-if-entity-frame"' ],
	[ 'if', 'entity', '"Entity Name"', 'direction', 'is', 'not', 'north', 'goto', '"script-do-if-entity-direction"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateA', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-a"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateB', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-b"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateC', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-c"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateD', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-d"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateAU2', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-a-u2"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateCU2', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-c-u2"' ],
	[ 'if', 'entity', '"Entity Name"', 'path', 'is', 'not', '"some-kind-of-geometry-name"', 'goto', '"script-do-if-entity-path"' ],
	[ 'if', 'entity', '"Entity Name"', 'is', 'glitched', 'goto', '"script-do-if-entity-is-glitched"' ],
	[ 'if', 'entity', '"Entity Name"', 'is', 'inside', 'geometry', '"some-kind-of-geometry-name"', 'goto', '"script-do-if-entity-path-inside"' ],
	[ 'if', 'entity', '"Entity Name"', 'is', 'not', 'glitched', 'goto', '"script-do-if-entity-is-glitched"' ],
	[ 'if', 'entity', '"Entity Name"', 'is', 'not', 'inside', 'geometry', '"some-kind-of-geometry-name"', 'goto', '"script-do-if-entity-path-inside"' ],
];

var testScriptFile = {
	"natlang-UNIQUE": [
		{
			"action": "BLOCKING_DELAY",
			"duration": 1,
		},
		{
			"action": "SET_CAMERA_TO_FOLLOW_ENTITY",
			"entity": "Entity Name",
		},
		{
			"action": "SET_HEX_EDITOR_STATE",
			"bool_value": false,
		},
		{
			"action": "SLOT_ERASE",
			"slot": 2,
		},
		{
			"action": "RUN_SCRIPT",
			"script": "script-to-run",
		},
		{
			"action": "LOOP_ENTITY_ALONG_GEOMETRY",
			"entity": "Entity Name",
			"geometry": "geometry-name-loop",
			"duration": 1000,
		},
		{
			"action": "SET_HEX_EDITOR_STATE",
			"bool_value": true,
		},
		{
			"action": "SET_ENTITY_DIRECTION_RELATIVE",
			"entity": "Entity Name",
			"relative_direction": 1,
		},
		{
			"action": "SLOT_SAVE",
		},
		{
			"action": "SET_SCREEN_SHAKE",
			"frequency": 1000,
			"amplitude": 30,
			"duration": 4000,
		},
		{
			"action": "NON_BLOCKING_DELAY",
			"duration": 100000,
		}
	],
	"natlang-walk": [
		{
			"action": "WALK_ENTITY_TO_GEOMETRY",
			"entity": "Entity Name",
			"geometry": "geometry-name-walk-to",
			"duration": 1000,
		},
		{
			"action": "WALK_ENTITY_ALONG_GEOMETRY",
			"entity": "Entity Name",
			"geometry": "geometry-name-walk-along",
			"duration": 1000,
		}
	],
	"natlang-make": [
		{
			"action": "SET_ENTITY_GLITCHED",
			"entity": "Entity Name",
			"bool_value": true,
		},
		{
			"action": "SET_ENTITY_GLITCHED",
			"entity": "Entity Name",
			"bool_value": false,
		}
	],
	"natlang-teleport": [
		{
			"action": "TELEPORT_ENTITY_TO_GEOMETRY",
			"entity": "Entity Name",
			"geometry": "geometry-name-teleport",
		},
		{
			"action": "TELEPORT_CAMERA_TO_GEOMETRY",
			"geometry": "geometry-name-to-teleport",
		}
	],
	"natlang-turn": [
		{
			"action": "SET_ENTITY_DIRECTION",
			"entity": "Entity Name",
			"direction": "north",
		},
		{
			"action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
			"entity": "Entity Name",
			"target_entity": "Target Entity",
		},
		{
			"action": "SET_ENTITY_DIRECTION_TARGET_GEOMETRY",
			"entity": "Entity Name",
			"target_geometry": "target-geometry",
		},
	],
	"natlang-pan": [
		{
			"action": "PAN_CAMERA_TO_ENTITY",
			"duration": 1000,
			"entity": "Entity Name",
		},
		{
			"action": "PAN_CAMERA_TO_GEOMETRY",
			"duration": 1000,
			"geometry": "geometry-to-pan-camera",
		}
	],
	"natlang-play": [
		{
			"action": "PLAY_ENTITY_ANIMATION",
			"entity": "Entity Name",
			"animation": 0,
			"play_count": 1,
		},
		{
			"action": "PLAY_ENTITY_ANIMATION",
			"entity": "Entity Name",
			"animation": 0,
			"play_count": 2,
		},
	],
	"natlang-fade": [
		{
			"action": "SCREEN_FADE_OUT",
			"duration": 1000,
			"color": "#FF0000",
		},
		{
			"action": "SCREEN_FADE_IN",
			"duration": 1000,
			"color": "#00FF00",
		}
	],
	"natlang-load": [
		{
			"action": "LOAD_MAP",
			"map": "super-long-map-name",
		},
		{
			"action": "SLOT_LOAD",
			"slot": 0,
		}
	],
	"natlang-show": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "super-long-dialog-name",
		},
		{
			"action": "SHOW_SERIAL_DIALOG",
			"serial_dialog": "serial-dialog",
		}
	],
	"natlang-copy": [
		{
			"action": "COPY_SCRIPT",
			"script": "script-to-copy",
		},
		{
			"action": "COPY_VARIABLE",
			"variable": "variable-name-inbound",
			"inbound": true,
			"entity": "Entity Name",
			"field": "x",
		},
		{
			"action": "COPY_VARIABLE",
			"variable": "variable-name-outbound",
			"inbound": false,
			"entity": "Entity Name",
			"field": "y",
		}
	],
	"natlang-mutate": [
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-set",
			"value": 5,
			"operation": "SET",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-add",
			"value": 5,
			"operation": "ADD",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-sub",
			"value": 5,
			"operation": "SUB",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-div",
			"value": 5,
			"operation": "DIV",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-mul",
			"value": 5,
			"operation": "MUL",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-mod",
			"value": 5,
			"operation": "MOD",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-rng",
			"value": 5,
			"operation": "RNG",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-set",
			"source": "another-variable-name",
			"operation": "SET",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-add",
			"source": "another-variable-name",
			"operation": "ADD",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-sub",
			"source": "another-variable-name",
			"operation": "SUB",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-div",
			"source": "another-variable-name",
			"operation": "DIV",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-mul",
			"source": "another-variable-name",
			"operation": "MUL",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-mod",
			"source": "another-variable-name",
			"operation": "MOD",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-rng",
			"source": "another-variable-name",
			"operation": "RNG",
		},
	],
	"natlang-set-UNIQUE": [
		{
			"action": "SET_MAP_TICK_SCRIPT",
			"script": "script-map-tick",
		},
		{
			"action": "SET_WARP_STATE",
			"string": "warp-state-string",
		}
	],
	"natlang-set-flag": [
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "save-flag-to-set",
			"bool_value": true,
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "save-flag-to-set-NOT",
			"bool_value": false,
		}
	],
	"natlang-set-player": [
		{
			"action": "SET_PLAYER_CONTROL",
			"bool_value": true,
		},
		{
			"action": "SET_PLAYER_CONTROL",
			"bool_value": false,
		}
	],
	"natlang-set-hex": [
		{
			"action": "SET_HEX_EDITOR_DIALOG_MODE",
			"bool_value": true,
		},
		{
			"action": "SET_HEX_EDITOR_DIALOG_MODE",
			"bool_value": false,
		},
		{
			"action": "SET_HEX_EDITOR_CONTROL",
			"bool_value": true,
		},
		{
			"action": "SET_HEX_EDITOR_CONTROL",
			"bool_value": false,
		},
		{
			"action": "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
			"bool_value": true,
		},
		{
			"action": "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
			"bool_value": false,
		},
	],
	"natlang-set-entity": [
		{
			"action": "SET_ENTITY_NAME",
			"string": "New Name",
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_X",
			"u2_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_Y",
			"u2_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_TYPE",
			"entity_type": "some-kinda-sheep",
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_PRIMARY_ID",
			"u2_value": 1,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_SECONDARY_ID",
			"u2_value": 2,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_PRIMARY_ID_TYPE",
			"byte_value": 0,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_A",
			"byte_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_B",
			"byte_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_C",
			"byte_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_D",
			"byte_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_A_U2",
			"u2_value": 2,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_C_U2",
			"u2_value": 2,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_A_U4",
			"u4_value": 4,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_PATH",
			"entity": "Entity Name",
			"geometry": "geometry-name-entity-path",
		},
		{
			"action": "SET_ENTITY_CURRENT_ANIMATION",
			"entity": "Entity Name",
			"byte_value": 0,
		},
		{
			"action": "SET_ENTITY_CURRENT_FRAME",
			"entity": "Entity Name",
			"byte_value": 0,
		},
		{
			"action": "SET_ENTITY_INTERACT_SCRIPT",
			"entity": "Entity Name",
			"script": "script-entity-interact",
		},
		{
			"action": "SET_ENTITY_TICK_SCRIPT",
			"entity": "Entity Name",
			"script": "script-entity-tick",
		}
	],
	"natlang-if-flag": [
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "i-am-a-save-flag",
			"expected_bool": true,
			"success_script": "script-do-if-flag-true",
		},
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "i-am-a-save-flag",
			"expected_bool": false,
			"success_script": "script-do-if-flag-false",
		}
	],
	"natlang-if-button": [
		{
			"action": "CHECK_FOR_BUTTON_PRESS",
			"button_id": "ANY",
			"success_script": "script-do-if-button",
		},
		{
			"action": "CHECK_FOR_BUTTON_STATE",
			"button_id": "ANY",
			"expected_bool": true,
			"success_script": "script-do-if-button-state",
		},
		{
			"action": "CHECK_FOR_BUTTON_STATE",
			"button_id": "ANY",
			"expected_bool": false,
			"success_script": "script-do-if-button-state",
		}
	],
	"natlang-if-warp": [
		{
			"action": "CHECK_WARP_STATE",
			"string": "warp-state-string",
			"expected_bool": true,
			"success_script": "script-do-if-warp-state",
		},
		{
			"action": "CHECK_WARP_STATE",
			"string": "warp-state-string",
			"expected_bool": false,
			"success_script": "script-do-if-NOT-warp-state",
		}
	],
	"natlang-if-variable": [
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "==",
			"expected_bool": true,
			"success_script": "script-do-if-variable-==",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "<",
			"expected_bool": true,
			"success_script": "script-do-if-variable-<",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "<=",
			"expected_bool": true,
			"success_script": "script-do-if-variable-<=",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": ">=",
			"expected_bool": true,
			"success_script": "script-do-if-variable->=",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": ">",
			"expected_bool": true,
			"success_script": "script-do-if-variable->",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "==",
			"expected_bool": true,
			"success_script": "script-do-if-variable-==",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "<",
			"expected_bool": true,
			"success_script": "script-do-if-variable-<",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "<=",
			"expected_bool": true,
			"success_script": "script-do-if-variable-<=",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": ">=",
			"expected_bool": true,
			"success_script": "script-do-if-variable->=",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": ">",
			"expected_bool": true,
			"success_script": "script-do-if-variable->",
		}
	],
	"natlang-if-variable-NOT": [
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "==",
			"expected_bool": false,
			"success_script": "script-do-if-variable-==-NOT",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "<",
			"expected_bool": false,
			"success_script": "script-do-if-variable-<-NOT",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "<=",
			"expected_bool": false,
			"success_script": "script-do-if-variable-<=-NOT",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": ">=",
			"expected_bool": false,
			"success_script": "script-do-if-variable->=-NOT",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": ">",
			"expected_bool": false,
			"success_script": "script-do-if-variable->-NOT",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "==",
			"expected_bool": false,
			"success_script": "script-do-if-variable-==-NOT",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "<",
			"expected_bool": false,
			"success_script": "script-do-if-variable-<-NOT",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "<=",
			"expected_bool": false,
			"success_script": "script-do-if-variable-<=-NOT",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": ">=",
			"expected_bool": false,
			"success_script": "script-do-if-variable->=-NOT",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": ">",
			"expected_bool": false,
			"success_script": "script-do-if-variable->-NOT",
		}
	],
	"natlang-if-entity-SPECIAL": [
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_A_U4",
			"success_script": "script-do-if-entity-is-hackable-a-u4",
			"expected_u4": 1,
			"entity": "Entity Name",
			"note": "expected_bool is missing on purpose -- not enough bytes available!",
		},
	],
	"natlang-if-entity": [
		{
			"action": "CHECK_ENTITY_NAME",
			"success_script": "script-do-if-entity-name",
			"string": "Checked Name",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_X",
			"success_script": "script-do-if-entity-x",
			"expected_u2": 0,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_INTERACT_SCRIPT",
			"success_script": "script-do-if-entity-y",
			"expected_script": "name-of-checked-script-interact",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_TICK_SCRIPT",
			"success_script": "script-do-if-entity-tick",
			"expected_script": "name-of-checked-script-tick",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"success_script": "script-do-if-entity-type",
			"entity_type": "some-kind-of-entity-type",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_PRIMARY_ID",
			"success_script": "script-do-if-entity-primaryid",
			"expected_u2": 16,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_SECONDARY_ID",
			"success_script": "script-do-if-entity-secondaryid",
			"expected_u2": 16,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_PRIMARY_ID_TYPE",
			"success_script": "script-do-if-entity-primaryid-type",
			"expected_byte": 16,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_CURRENT_ANIMATION",
			"success_script": "script-do-if-entity-animation",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_CURRENT_FRAME",
			"success_script": "script-do-if-entity-frame",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_DIRECTION",
			"success_script": "script-do-if-entity-direction",
			"direction": "north",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_A",
			"success_script": "script-do-if-entity-is-hackable-a",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_B",
			"success_script": "script-do-if-entity-is-hackable-b",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_C",
			"success_script": "script-do-if-entity-is-hackable-c",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_D",
			"success_script": "script-do-if-entity-is-hackable-d",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_A_U2",
			"success_script": "script-do-if-entity-is-hackable-a-u2",
			"expected_u2": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_C_U2",
			"success_script": "script-do-if-entity-is-hackable-c-u2",
			"expected_u2": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_PATH",
			"success_script": "script-do-if-entity-path",
			"geometry": "some-kind-of-geometry-name",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_GLITCHED",
			"success_script": "script-do-if-entity-is-glitched",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
			"success_script": "script-do-if-entity-path-inside",
			"geometry": "some-kind-of-geometry-name",
			"entity": "Entity Name",
			"expected_bool": true,
		}
	],
	"natlang-if-entity-NOT": [
		{
			"action": "CHECK_ENTITY_NAME",
			"success_script": "script-do-if-entity-name",
			"string": "Checked Name",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_X",
			"success_script": "script-do-if-entity-x",
			"expected_u2": 0,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_INTERACT_SCRIPT",
			"success_script": "script-do-if-entity-y",
			"expected_script": "name-of-checked-script-interact",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_TICK_SCRIPT",
			"success_script": "script-do-if-entity-tick",
			"expected_script": "name-of-checked-script-tick",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"success_script": "script-do-if-entity-type",
			"entity_type": "some-kind-of-entity-type",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_PRIMARY_ID",
			"success_script": "script-do-if-entity-primaryid",
			"expected_u2": 16,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_SECONDARY_ID",
			"success_script": "script-do-if-entity-secondaryid",
			"expected_u2": 16,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_PRIMARY_ID_TYPE",
			"success_script": "script-do-if-entity-primaryid-type",
			"expected_byte": 16,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_CURRENT_ANIMATION",
			"success_script": "script-do-if-entity-animation",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_CURRENT_FRAME",
			"success_script": "script-do-if-entity-frame",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_DIRECTION",
			"success_script": "script-do-if-entity-direction",
			"direction": "north",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_A",
			"success_script": "script-do-if-entity-is-hackable-a",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_B",
			"success_script": "script-do-if-entity-is-hackable-b",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_C",
			"success_script": "script-do-if-entity-is-hackable-c",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_D",
			"success_script": "script-do-if-entity-is-hackable-d",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_A_U2",
			"success_script": "script-do-if-entity-is-hackable-a-u2",
			"expected_u2": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_C_U2",
			"success_script": "script-do-if-entity-is-hackable-c-u2",
			"expected_u2": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_PATH",
			"success_script": "script-do-if-entity-path",
			"geometry": "some-kind-of-geometry-name",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_GLITCHED",
			"success_script": "script-do-if-entity-is-glitched",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
			"success_script": "script-do-if-entity-path-inside",
			"geometry": "some-kind-of-geometry-name",
			"entity": "Entity Name",
			"expected_bool": false,
		}
	]
};

var completeTest = {
	test: [ 'block', '1ms' ],
	expectation: {
		"action": "BLOCKING_DELAY",
		"duration": 1
	},
}

var allTheActions = [
	{
		"action": "BLOCKING_DELAY",
		"duration": 1
	},
	{
		"action": "SET_CAMERA_TO_FOLLOW_ENTITY",
		"entity": "Entity Name"
	},
	{
		"action": "SET_HEX_EDITOR_STATE",
		"bool_value": false
	},
	{
		"action": "SET_HEX_EDITOR_STATE",
		"bool_value": true
	},
	{
		"action": "SET_ENTITY_DIRECTION_RELATIVE",
		"entity": "Entity Name",
		"relative_direction": 1
	},
	{
		"action": "SLOT_ERASE",
		"slot": 2
	},
	{
		"action": "RUN_SCRIPT",
		"script": "script-to-run"
	},
	{
		"action": "LOOP_ENTITY_ALONG_GEOMETRY",
		"entity": "Entity Name",
		"geometry": "geometry-name-loop",
		"duration": 1000
	},
	{
		"action": "SLOT_SAVE"
	},
	{
		"action": "SET_SCREEN_SHAKE",
		"frequency": 1000,
		"amplitude": 30,
		"duration": 4000
	},
	{
		"action": "NON_BLOCKING_DELAY",
		"duration": 100000
	},
	{
		"action": "WALK_ENTITY_TO_GEOMETRY",
		"entity": "Entity Name",
		"geometry": "geometry-name-walk-to",
		"duration": 1000
	},
	{
		"action": "WALK_ENTITY_ALONG_GEOMETRY",
		"entity": "Entity Name",
		"geometry": "geometry-name-walk-along",
		"duration": 1000
	},
	{
		"action": "SET_ENTITY_GLITCHED",
		"entity": "Entity Name",
		"bool_value": true
	},
	{
		"action": "SET_ENTITY_GLITCHED",
		"entity": "Entity Name",
		"bool_value": false
	},
	{
		"action": "TELEPORT_ENTITY_TO_GEOMETRY",
		"entity": "Entity Name",
		"geometry": "geometry-name-teleport"
	},
	{
		"action": "TELEPORT_CAMERA_TO_GEOMETRY",
		"geometry": "geometry-name-to-teleport"
	},
	{
		"action": "SET_ENTITY_DIRECTION",
		"entity": "Entity Name",
		"direction": "north"
	},
	{
		"action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
		"entity": "Entity Name",
		"target_entity": "Target Entity"
	},
	{
		"action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
		"entity": "Entity Name",
		"target_entity": "target-geometry"
	},
	{
		"action": "PAN_CAMERA_TO_ENTITY",
		"entity": "Entity Name",
		"duration": 1000
	},
	{
		"action": "PAN_CAMERA_TO_GEOMETRY",
		"geometry": "geometry-to-pan-camera",
		"duration": 1000
	},
	{
		"action": "PLAY_ENTITY_ANIMATION",
		"entity": "Entity Name",
		"animation": 0,
		"play_count": 1
	},
	{
		"action": "SCREEN_FADE_OUT",
		"color": "#FF0000",
		"duration": 1000
	},
	{
		"action": "SCREEN_FADE_IN",
		"color": "#00FF00",
		"duration": 1000
	},
	{
		"action": "LOAD_MAP",
		"map": "super-long-map-name"
	},
	{
		"action": "SLOT_LOAD",
		"slot": 0
	},
	{
		"action": "SHOW_DIALOG",
		"dialog": "super-long-dialog-name"
	},
	{
		"action": "SHOW_SERIAL_DIALOG",
		"serial_dialog": "serial-dialog"
	},
	{
		"action": "COPY_SCRIPT",
		"script": "script-to-copy"
	},
	{
		"action": "COPY_VARIABLE",
		"entity": "Entity Name",
		"field": "x",
		"inbound": true,
		"variable": "variable-name-inbound"
	},
	{
		"action": "COPY_VARIABLE",
		"entity": "Entity Name",
		"field": "y",
		"inbound": false,
		"variable": "variable-name-outbound"
	},
	{
		"action": "MUTATE_VARIABLE",
		"variable": "variable-name-set",
		"operation": "SET",
		"value": 5
	},
	{
		"action": "MUTATE_VARIABLE",
		"variable": "variable-name-add",
		"operation": "ADD",
		"value": 5
	},
	{
		"action": "MUTATE_VARIABLE",
		"variable": "variable-name-sub",
		"operation": "SUB",
		"value": 5
	},
	{
		"action": "MUTATE_VARIABLE",
		"variable": "variable-name-div",
		"operation": "DIV",
		"value": 5
	},
	{
		"action": "MUTATE_VARIABLE",
		"variable": "variable-name-mul",
		"operation": "MUL",
		"value": 5
	},
	{
		"action": "MUTATE_VARIABLE",
		"variable": "variable-name-mod",
		"operation": "MOD",
		"value": 5
	},
	{
		"action": "MUTATE_VARIABLE",
		"variable": "variable-name-rng",
		"operation": "RNG",
		"value": 5
	},
	{
		"action": "MUTATE_VARIABLES",
		"variable": "variable-name-set",
		"operation": "SET",
		"source": "another-variable-name"
	},
	{
		"action": "MUTATE_VARIABLES",
		"variable": "variable-name-add",
		"operation": "ADD",
		"source": "another-variable-name"
	},
	{
		"action": "MUTATE_VARIABLES",
		"variable": "variable-name-sub",
		"operation": "SUB",
		"source": "another-variable-name"
	},
	{
		"action": "MUTATE_VARIABLES",
		"variable": "variable-name-div",
		"operation": "DIV",
		"source": "another-variable-name"
	},
	{
		"action": "MUTATE_VARIABLES",
		"variable": "variable-name-mul",
		"operation": "MUL",
		"source": "another-variable-name"
	},
	{
		"action": "MUTATE_VARIABLES",
		"variable": "variable-name-mod",
		"operation": "MOD",
		"source": "another-variable-name"
	},
	{
		"action": "MUTATE_VARIABLES",
		"variable": "variable-name-rng",
		"operation": "RNG",
		"source": "another-variable-name"
	},
	{
		"action": "SET_MAP_TICK_SCRIPT",
		"script": "script-map-tick"
	},
	{
		"action": "SET_WARP_STATE",
		"string": "warp-state-string"
	},
	{
		"action": "SET_SAVE_FLAG",
		"save_flag": "save-flag-to-set",
		"bool_value": true
	},
	{
		"action": "SET_SAVE_FLAG",
		"save_flag": "save-flag-to-set-NOT",
		"bool_value": false
	},
	{
		"action": "SET_PLAYER_CONTROL",
		"bool_value": true
	},
	{
		"action": "SET_PLAYER_CONTROL",
		"bool_value": false
	},
	{
		"action": "SET_HEX_EDITOR_DIALOG_MODE",
		"bool_value": true
	},
	{
		"action": "SET_HEX_EDITOR_DIALOG_MODE",
		"bool_value": false
	},
	{
		"action": "SET_HEX_EDITOR_CONTROL",
		"bool_value": true
	},
	{
		"action": "SET_HEX_EDITOR_CONTROL",
		"bool_value": false
	},
	{
		"action": "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
		"bool_value": true
	},
	{
		"action": "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
		"bool_value": false
	},
	{
		"action": "SET_ENTITY_NAME",
		"entity": "Entity Name",
		"string": "New Name"
	},
	{
		"action": "SET_ENTITY_X",
		"entity": "Entity Name",
		"u2_value": 128
	},
	{
		"action": "SET_ENTITY_Y",
		"entity": "Entity Name",
		"u2_value": 128
	},
	{
		"action": "SET_ENTITY_TYPE",
		"entity": "Entity Name",
		"entity_type": "some-kinda-sheep"
	},
	{
		"action": "SET_ENTITY_PRIMARY_ID",
		"entity": "Entity Name",
		"u2_value": 1
	},
	{
		"action": "SET_ENTITY_SECONDARY_ID",
		"entity": "Entity Name",
		"u2_value": 2
	},
	{
		"action": "SET_ENTITY_PRIMARY_ID_TYPE",
		"entity": "Entity Name",
		"byte_value": 5
	},
	{
		"action": "SET_ENTITY_HACKABLE_STATE_A",
		"entity": "Entity Name",
		"byte_value": 128
	},
	{
		"action": "SET_ENTITY_HACKABLE_STATE_B",
		"entity": "Entity Name",
		"byte_value": 128
	},
	{
		"action": "SET_ENTITY_HACKABLE_STATE_C",
		"entity": "Entity Name",
		"byte_value": 128
	},
	{
		"action": "SET_ENTITY_HACKABLE_STATE_D",
		"entity": "Entity Name",
		"byte_value": 128
	},
	{
		"action": "SET_ENTITY_HACKABLE_STATE_A_U2",
		"entity": "Entity Name",
		"u2_value": 2
	},
	{
		"action": "SET_ENTITY_HACKABLE_STATE_C_U2",
		"entity": "Entity Name",
		"u2_value": 2
	},
	{
		"action": "SET_ENTITY_HACKABLE_STATE_A_U4",
		"entity": "Entity Name",
		"u4_value": 4
	},
	{
		"action": "SET_ENTITY_PATH",
		"entity": "Entity Name",
		"geometry": "geometry-name-entity-path"
	},
	{
		"action": "SET_ENTITY_CURRENT_ANIMATION",
		"entity": "Entity Name",
		"byte_value": 0
	},
	{
		"action": "SET_ENTITY_CURRENT_FRAME",
		"entity": "Entity Name",
		"byte_value": 0
	},
	{
		"action": "SET_ENTITY_INTERACT_SCRIPT",
		"entity": "Entity Name",
		"script": "script-entity-interact"
	},
	{
		"action": "SET_ENTITY_TICK_SCRIPT",
		"entity": "Entity Name",
		"script": "script-entity-tick"
	},
	{
		"action": "CHECK_SAVE_FLAG",
		"save_flag": "i-am-a-save-flag",
		"expected_bool": true,
		"success_script": "script-do-if-flag-true"
	},
	{
		"action": "CHECK_SAVE_FLAG",
		"save_flag": "i-am-a-save-flag",
		"expected_bool": false,
		"success_script": "script-do-if-flag-false"
	},
	{
		"action": "CHECK_FOR_BUTTON_PRESS",
		"button_id": "ANY",
		"success_script": "script-do-if-button"
	},
	{
		"action": "CHECK_FOR_BUTTON_STATE",
		"button_id": "ANY",
		"expected_bool": true,
		"success_script": "script-do-if-button-state"
	},
	{
		"action": "CHECK_FOR_BUTTON_STATE",
		"button_id": "ANY",
		"expected_bool": false,
		"success_script": "script-do-if-button-state-NOT"
	},
	{
		"action": "CHECK_WARP_STATE",
		"expected_bool": true,
		"string": "warp-state-string",
		"success_script": "script-do-if-warp-state"
	},
	{
		"action": "CHECK_WARP_STATE",
		"expected_bool": false,
		"string": "warp-state-string",
		"success_script": "script-do-if-NOT-warp-state"
	},
	{
		"action": "CHECK_VARIABLE",
		"expected_bool": true,
		"variable": "i-am-a-variable",
		"comparison": "==",
		"value": 15,
		"success_script": "script-do-if-variable-=="
	},
	{
		"action": "CHECK_VARIABLE",
		"variable": "i-am-a-variable",
		"expected_bool": true,
		"comparison": "<",
		"value": 15,
		"success_script": "script-do-if-variable-<"
	},
	{
		"action": "CHECK_VARIABLE",
		"variable": "i-am-a-variable",
		"comparison": "==",
		"expected_bool": false,
		"value": 15,
		"success_script": "script-do-if-variable-==-NOT"
	},
	{
		"action": "CHECK_VARIABLE",
		"variable": "i-am-a-variable",
		"expected_bool": false,
		"comparison": "<",
		"value": 15,
		"success_script": "script-do-if-variable-<-NOT"
	},
	{
		"action": "CHECK_VARIABLES",
		"expected_bool": true,
		"variable": "i-am-a-variable",
		"comparison": "==",
		"source": "i-am-a-second-variable",
		"success_script": "script-do-if-variable-=="
	},
	{
		"action": "CHECK_VARIABLES",
		"variable": "i-am-a-variable",
		"expected_bool": true,
		"comparison": "<",
		"source": "i-am-a-second-variable",
		"success_script": "script-do-if-variable-<"
	},
	{
		"action": "CHECK_VARIABLES",
		"variable": "i-am-a-variable",
		"comparison": "==",
		"expected_bool": false,
		"source": "i-am-a-second-variable",
		"success_script": "script-do-if-variable-==-NOT"
	},
	{
		"action": "CHECK_VARIABLES",
		"variable": "i-am-a-variable",
		"expected_bool": false,
		"comparison": "<",
		"source": "i-am-a-second-variable",
		"success_script": "script-do-if-variable-<-NOT"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_A_U4",
		"entity": "Entity Name",
		"expected_u4": 1,
		"success_script": "script-do-if-entity-is-hackable-a-u4"
	},
	{
		"action": "CHECK_ENTITY_NAME",
		"entity": "Entity Name",
		"expected_bool": true,
		"string": "Checked Name",
		"success_script": "script-do-if-entity-name"
	},
	{
		"action": "CHECK_ENTITY_X",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_u2": 0,
		"success_script": "script-do-if-entity-x"
	},
	{
		"action": "CHECK_ENTITY_INTERACT_SCRIPT",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_script": "name-of-checked-script-interact",
		"success_script": "script-do-if-entity-y"
	},
	{
		"action": "CHECK_ENTITY_TICK_SCRIPT",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_script": "name-of-checked-script-tick",
		"success_script": "script-do-if-entity-tick"
	},
	{
		"action": "CHECK_ENTITY_TYPE",
		"entity": "Entity Name",
		"expected_bool": true,
		"entity_type": "some-kind-of-entity-type",
		"success_script": "script-do-if-entity-type"
	},
	{
		"action": "CHECK_ENTITY_PRIMARY_ID",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_u2": 16,
		"success_script": "script-do-if-entity-primaryid"
	},
	{
		"action": "CHECK_ENTITY_SECONDARY_ID",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_u2": 16,
		"success_script": "script-do-if-entity-secondaryid"
	},
	{
		"action": "CHECK_ENTITY_PRIMARY_ID_TYPE",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_byte": 16,
		"success_script": "script-do-if-entity-primaryid-type"
	},
	{
		"action": "CHECK_ENTITY_CURRENT_ANIMATION",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-animation"
	},
	{
		"action": "CHECK_ENTITY_CURRENT_FRAME",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-frame"
	},
	{
		"action": "CHECK_ENTITY_DIRECTION",
		"entity": "Entity Name",
		"expected_bool": true,
		"direction": "north",
		"success_script": "script-do-if-entity-direction"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_A",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-is-hackable-a"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_B",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-is-hackable-b"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_C",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-is-hackable-c"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_D",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-is-hackable-d"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_A_U2",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_u2": 1,
		"success_script": "script-do-if-entity-is-hackable-a-u2"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_C_U2",
		"entity": "Entity Name",
		"expected_bool": true,
		"expected_u2": 1,
		"success_script": "script-do-if-entity-is-hackable-c-u2"
	},
	{
		"action": "CHECK_ENTITY_PATH",
		"entity": "Entity Name",
		"expected_bool": true,
		"geometry": "some-kind-of-geometry-name",
		"success_script": "script-do-if-entity-path"
	},
	{
		"action": "CHECK_ENTITY_NAME",
		"entity": "Entity Name",
		"expected_bool": false,
		"string": "Checked Name",
		"success_script": "script-do-if-entity-name"
	},
	{
		"action": "CHECK_ENTITY_X",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_u2": 0,
		"success_script": "script-do-if-entity-x"
	},
	{
		"action": "CHECK_ENTITY_INTERACT_SCRIPT",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_script": "name-of-checked-script-interact",
		"success_script": "script-do-if-entity-y"
	},
	{
		"action": "CHECK_ENTITY_TICK_SCRIPT",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_script": "name-of-checked-script-tick",
		"success_script": "script-do-if-entity-tick"
	},
	{
		"action": "CHECK_ENTITY_TYPE",
		"entity": "Entity Name",
		"expected_bool": false,
		"entity_type": "some-kind-of-entity-type",
		"success_script": "script-do-if-entity-type"
	},
	{
		"action": "CHECK_ENTITY_PRIMARY_ID",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_u2": 16,
		"success_script": "script-do-if-entity-primaryid"
	},
	{
		"action": "CHECK_ENTITY_SECONDARY_ID",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_u2": 16,
		"success_script": "script-do-if-entity-secondaryid"
	},
	{
		"action": "CHECK_ENTITY_PRIMARY_ID_TYPE",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_byte": 16,
		"success_script": "script-do-if-entity-primaryid-type"
	},
	{
		"action": "CHECK_ENTITY_CURRENT_ANIMATION",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-animation"
	},
	{
		"action": "CHECK_ENTITY_CURRENT_FRAME",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-frame"
	},
	{
		"action": "CHECK_ENTITY_DIRECTION",
		"entity": "Entity Name",
		"expected_bool": false,
		"direction": "north",
		"success_script": "script-do-if-entity-direction"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_A",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-is-hackable-a"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_B",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-is-hackable-b"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_C",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-is-hackable-c"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_D",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_byte": 1,
		"success_script": "script-do-if-entity-is-hackable-d"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_A_U2",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_u2": 1,
		"success_script": "script-do-if-entity-is-hackable-a-u2"
	},
	{
		"action": "CHECK_ENTITY_HACKABLE_STATE_C_U2",
		"entity": "Entity Name",
		"expected_bool": false,
		"expected_u2": 1,
		"success_script": "script-do-if-entity-is-hackable-c-u2"
	},
	{
		"action": "CHECK_ENTITY_PATH",
		"entity": "Entity Name",
		"expected_bool": false,
		"geometry": "some-kind-of-geometry-name",
		"success_script": "script-do-if-entity-path"
	},
	{
		"action": "CHECK_ENTITY_GLITCHED",
		"entity": "Entity Name",
		"expected_bool": true,
		"success_script": "script-do-if-entity-is-glitched"
	},
	{
		"action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
		"entity": "Entity Name",
		"expected_bool": true,
		"geometry": "some-kind-of-geometry-name",
		"success_script": "script-do-if-entity-path-inside"
	},
	{
		"action": "CHECK_ENTITY_GLITCHED",
		"entity": "Entity Name",
		"expected_bool": false,
		"success_script": "script-do-if-entity-is-glitched"
	},
	{
		"action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
		"entity": "Entity Name",
		"expected_bool": false,
		"geometry": "some-kind-of-geometry-name",
		"success_script": "script-do-if-entity-path-inside"
	}
];

// Object.values(testScriptFile).forEach(function (script) {
// 	allTheActions = allTheActions.concat(script);
// })



var modules = [
	'../common.js',
	'../scripts.js',
	'../editor-natlang-dictionary.js',
	'../editor-natlang-from-json.js',
	'../editor-natlang-to-json.js',
];

var moduleString = '';

modules.forEach(function (filePath) {
	moduleString += '\n' + fs.readFileSync(`${__dirname}/${filePath}`);
})

eval(moduleString);

describe('MGNL test suite', function () {
	describe('translateTokensToJSON', function () {
		it('Should convert tokens to the expected json objects', function () {
			testTokens.forEach(function (tokens, tokenIndex) {
				var result = translateTokensToJSON.action(tokens)
				expect(result).toStrictEqual(allTheActions[tokenIndex]);
			})
		})
	})
})
