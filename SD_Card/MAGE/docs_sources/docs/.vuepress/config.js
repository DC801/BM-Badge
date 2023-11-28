import { defineUserConfig } from 'vuepress'
import { defaultTheme } from '@vuepress/theme-default'
import { shikiPlugin } from '@vuepress/plugin-shiki'
import { readFileSync } from "fs"

console.log('shikiPlugin', shikiPlugin)

const myGrammar = JSON.parse(readFileSync("mgs.tmLanguage.json"))
// these have to be manually loaded I guess, since loading a custom one causes all the others to not load at all (?)
const jsonGrammar = JSON.parse(readFileSync("node_modules/shiki/languages/json.tmLanguage.json"))
const javascriptGrammar = JSON.parse(readFileSync("node_modules/shiki/languages/javascript.tmLanguage.json"))
const rustGrammar = JSON.parse(readFileSync("node_modules/shiki/languages/rust.tmLanguage.json"))

export default defineUserConfig({
  base: '/magedocs/',
  lang: 'en-US',
  title: 'Mage Game Engine Documentation',
  description: 'Documentation for the DC801 Black Mage Game Engine',
  markdown: {
    code: {
      lineNumbers: false
    }
  },
  plugins: [
    shikiPlugin({
      langs: [
        {
          id: "MageGameScript", scopeName: 'source.mgs',
          grammar: myGrammar, aliases: ['mgs'],
        },
        {
          id: "JSON", scopeName: 'source.json',
          grammar: jsonGrammar, aliases: ['json'],
        },
        // {
        //   id: "JavaScript", scopeName: 'source.js',
        //   grammar: javascriptGrammar, aliases: ['javascript','js'],
        // },
        // {
        //   id: "Rust", scopeName: 'source.rust',
        //   grammar: rustGrammar, aliases: ['rust'],
        // },
      ],
      theme: 'dark-plus',
    }),
  ],
  theme: defaultTheme({
    contributors: false,
    lastUpdated: false,
    sidebarDepth: 2,
    sidebar: [
      {
        text: "Getting Started",
        collapsible: true,
        children: [
          "/getting_started/what_youll_need.md",
          "/getting_started/mge_vm.md",
          "/getting_started/general_process.md",
		  "/getting_started/mage_folder.md",
        ]
      },
	  {
		text: "Tilesets",
		collapsible : true,
		children: [
		  '/tilesets.md',
		  "/animations.md",
		  '/entity_management_system.md',
		]
	  },
	  {
		text: "Maps",
		collapsible : true,
		children: [
		  '/maps.md',
		  '/map_loads.md',
		  '/map_properties.md',
		  '/vector_objects.md',
		]
	  },
	  {
		text: "Entities",
		collapsible : true,
		children: [
		  '/entities.md',
		  '/entity_types.md',
		  '/entity_properties.md',
		  '/relative_references.md',
		]
	  },{
		text: "Structure",
		collapsible : true,
		children: [
			'/variables.md',
			'/enums.md',
			'/dialogs.md',
			'/serial_dialogs.md',
			'/scripts.md',
			'/script_slots.md',
		]
	  },
		{
			text: "Scripting Techniques",
			collapsible : true,
			children: [
			  '/techniques/scripting_techniques.md',
			  '/techniques/actors.md',
			  '/techniques/coordinate_considerations.md',
			  '/techniques/copy_script_uses.md',
			  '/techniques/cutscenes.md',
			  '/techniques/doors.md',
			  '/techniques/handlers.md',
			  '/techniques/hiding_an_entity.md',
			  '/techniques/hint_systems.md',
			  '/techniques/map_initialization_scripts.md',
			  '/techniques/one_script_multiple_behaviors.md',
			  '/techniques/spawn_points.md',
			  '/techniques/beginnings_middles_and_ends.md',
			  '/techniques/chains_of_small_checks.md',
			  '/techniques/grand_finale_beatrice.md'
			]
		  },
	  {
		text: "Actions",
		collapsible : true,
		children: [
		  '/actions.md',
		  '/actions/conditional_gotos.md',
		  {
			text: "Game Management",
			collapsible : true,
			children: [
			  '/actions/BLOCKING_DELAY',
			  '/actions/NON_BLOCKING_DELAY',
			  '/actions/SET_PLAYER_CONTROL',
			  '/actions/LOAD_MAP',
			  '/actions/SLOT_SAVE',
			  '/actions/SLOT_LOAD',
			  '/actions/SLOT_ERASE',
			  '/actions/SHOW_DIALOG',
			  '/actions/CLOSE_DIALOG',
			  '/actions/SET_LIGHTS_CONTROL',
			  '/actions/SET_LIGHTS_STATE',
			]
		  },
		  {
			text: "Hex Editor",
			collapsible : true,
			children: [
			  '/actions/SET_HEX_EDITOR_STATE',
			  '/actions/SET_HEX_EDITOR_DIALOG_MODE',
			  '/actions/SET_HEX_EDITOR_CONTROL',
			  '/actions/SET_HEX_EDITOR_CONTROL_CLIPBOARD',
			]
		  },
		  {
			text: "Serial Console",
			collapsible : true,
			children: [
			  '/actions/SET_SERIAL_DIALOG_CONTROL',
			  '/actions/SHOW_SERIAL_DIALOG',
			  '/actions/CLOSE_SERIAL_DIALOG',
			  '/actions/SET_CONNECT_SERIAL_DIALOG',
			  '/actions/REGISTER_SERIAL_DIALOG_COMMAND',
			  '/actions/UNREGISTER_SERIAL_DIALOG_COMMAND',
			  '/actions/REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT',
			  '/actions/UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT',
			]
		  },
		  {
			text: "Camera Control",
			collapsible : true,
			children: [
			  '/actions/SET_CAMERA_TO_FOLLOW_ENTITY',
			  '/actions/TELEPORT_CAMERA_TO_GEOMETRY',
			  '/actions/PAN_CAMERA_TO_ENTITY',
			  '/actions/PAN_CAMERA_TO_GEOMETRY',
			  '/actions/PAN_CAMERA_ALONG_GEOMETRY',
			  '/actions/LOOP_CAMERA_ALONG_GEOMETRY',
			  '/actions/SET_SCREEN_SHAKE',
			  '/actions/SCREEN_FADE_OUT',
			  '/actions/SCREEN_FADE_IN',
			]
		  },
		  {
			text: "Script Control",
			collapsible : true,
			children: [
			  '/actions/RUN_SCRIPT',
			  '/actions/GOTO_ACTION_INDEX',
			  '/actions/COPY_SCRIPT',
			  '/actions/SET_MAP_TICK_SCRIPT',
			  '/actions/SET_ENTITY_INTERACT_SCRIPT',
			  '/actions/SET_ENTITY_TICK_SCRIPT',
			  '/actions/SET_ENTITY_LOOK_SCRIPT',
			  '/actions/SET_SCRIPT_PAUSE',
			]
		  },
		  {
			text: "Entity Choreography",
			collapsible : true,
			children: [
			  '/actions/SET_ENTITY_PATH',
			  '/actions/TELEPORT_ENTITY_TO_GEOMETRY',
			  '/actions/WALK_ENTITY_TO_GEOMETRY',
			  '/actions/WALK_ENTITY_ALONG_GEOMETRY',
			  '/actions/LOOP_ENTITY_ALONG_GEOMETRY',
			]
		  },
		  {
			text: "Entity Appearance",
			collapsible : true,
			children: [
			  '/actions/PLAY_ENTITY_ANIMATION',
			  '/actions/SET_ENTITY_CURRENT_ANIMATION',
			  '/actions/SET_ENTITY_CURRENT_FRAME',
			  '/actions/SET_ENTITY_DIRECTION',
			  '/actions/SET_ENTITY_DIRECTION_RELATIVE',
			  '/actions/SET_ENTITY_DIRECTION_TARGET_ENTITY',
			  '/actions/SET_ENTITY_DIRECTION_TARGET_GEOMETRY',
			  '/actions/SET_ENTITY_MOVEMENT_RELATIVE',
			  '/actions/SET_ENTITY_GLITCHED',
			]
		  },
		  {
			text: "Set Entity Properties",
			collapsible : true,
			children: [
			  '/actions/SET_ENTITY_NAME',
			  '/actions/SET_ENTITY_X',
			  '/actions/SET_ENTITY_Y',
			  '/actions/SET_ENTITY_TYPE',
			  '/actions/SET_ENTITY_PRIMARY_ID',
			  '/actions/SET_ENTITY_SECONDARY_ID',
			  '/actions/SET_ENTITY_PRIMARY_ID_TYPE',
			]
		  },
		  {
			text: "Set Variables",
			collapsible : true,
			children: [
			  '/actions/SET_SAVE_FLAG',
			  '/actions/SET_WARP_STATE',
			  '/actions/MUTATE_VARIABLE',
			  '/actions/MUTATE_VARIABLES',
			  '/actions/COPY_VARIABLE',
			]
		  },
		  {
			text: "Check Entity Properties",
			collapsible : true,
			children: [
			  '/actions/CHECK_ENTITY_NAME',
			  '/actions/CHECK_ENTITY_X',
			  '/actions/CHECK_ENTITY_Y',
			  '/actions/CHECK_ENTITY_INTERACT_SCRIPT',
			  '/actions/CHECK_ENTITY_TICK_SCRIPT',
			  '/actions/CHECK_ENTITY_LOOK_SCRIPT',
			  '/actions/CHECK_ENTITY_TYPE',
			  '/actions/CHECK_ENTITY_PRIMARY_ID',
			  '/actions/CHECK_ENTITY_SECONDARY_ID',
			  '/actions/CHECK_ENTITY_PRIMARY_ID_TYPE',
			  '/actions/CHECK_ENTITY_CURRENT_ANIMATION',
			  '/actions/CHECK_ENTITY_CURRENT_FRAME',
			  '/actions/CHECK_ENTITY_DIRECTION',
			  '/actions/CHECK_ENTITY_GLITCHED',
			  '/actions/CHECK_ENTITY_PATH',
			  '/actions/CHECK_IF_ENTITY_IS_IN_GEOMETRY',
			]
		  },
		  {
			text: "Check Variables",
			collapsible : true,
			children: [
			  '/actions/CHECK_VARIABLE',
			  '/actions/CHECK_VARIABLES',
			  '/actions/CHECK_SAVE_FLAG',
			  '/actions/CHECK_FOR_BUTTON_PRESS',
			  '/actions/CHECK_FOR_BUTTON_STATE',
			  '/actions/CHECK_WARP_STATE',
			  '/actions/CHECK_DIALOG_OPEN',
			  '/actions/CHECK_SERIAL_DIALOG_OPEN',
			  '/actions/CHECK_DEBUG_MODE',
			]
		  },
		]
	  },
      {
        text: "MGS Natlang",
        collapsible : true,
        children: [
          '/mgs/mgs_natlang.md',
          '/mgs/mgs_natlang_vs_json.md',
          '/mgs/syntax_colors.md',
          {
            text: "Structure",
            collapsible : true,
            children: [
              '/mgs/mgs_natlang_structure.md',
              '/mgs/variables_mgs.md',
              '/mgs/block.md',
              '/mgs/dialog_settings_block.md',
              '/mgs/dialog_settings_target_block.md',
              '/mgs/serial_dialog_settings_block.md',
              '/mgs/script_block.md',
              '/mgs/dialog_block.md',
              '/mgs/serial_dialog_block.md',
              '/mgs/advanced_syntax.md',
            ]
          },
          {
            text: "Scripts",
            collapsible : true,
            children: [
              '/mgs/scripts_mgs.md',
              '/mgs/combination_block.md',
              '/mgs/show_dialog_block.md',
              '/mgs/show_serial_dialog_block.md',
            ]
          },
          {
            text: "Dialogs",
            collapsible : true,
            children: [
              '/mgs/dialogs_mgs.md',
              '/mgs/dialog_identifier.md',
              '/mgs/dialog_parameters_mgs.md',
              '/mgs/dialog_messages_mgs.md',
              '/mgs/dialog_options_mgs.md',
            ]
          },
          {
            text: "Serial Dialogs",
            collapsible : true,
            children: [
              '/mgs/serial_dialogs_mgs.md',
              '/mgs/serial_dialog_parameters_mgs.md',
              '/mgs/serial_dialog_messages_mgs.md',
              '/mgs/serial_dialog_options_mgs.md',
              '/mgs/serial_styles.md',
            ]
          },
        ]
      },
      {
        text: "Technical",
        collapsible : true,
        children: [
			'/debug_tools.md',
			'/encoder.md',
          {
            text: "Hardware",
            collapsible : true,
            children: [
              '/hex_editor.md',
              '/terminal.md',
              '/commands.md',
              '/web_build.md',
              '/desktop_build.md',
              '/updating_the_hardware.md',
            ]
          },
        ]
      },
    ]
  }),
})
