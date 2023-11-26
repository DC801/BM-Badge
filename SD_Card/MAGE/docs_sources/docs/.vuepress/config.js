import { defineUserConfig } from 'vuepress'
import { defaultTheme } from '@vuepress/theme-default'
import { shikiPlugin } from '@vuepress/plugin-shiki'
import { readFileSync } from "fs"

console.log('shikiPlugin', shikiPlugin)

const myGrammar = JSON.parse(readFileSync("mgs.tmLanguage.json"))
const myLanguage = {
  id: "MageGameScript",
  scopeName: 'source.mgs',
  grammar: myGrammar,
  aliases: ['mgs'],
}
const jsonGrammar = JSON.parse(readFileSync("node_modules/shiki/languages/json.tmLanguage.json"))
const jsonLanguage = {
  id: "JSON",
  scopeName: 'source.json',
  grammar: jsonGrammar,
  aliases: ['json'],
}

export default defineUserConfig({
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
      langs: [ myLanguage, jsonLanguage ],
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
          {
            text: "Filesystem",
            collapsible: true,
            children: [
              "/getting_started/mage_folder.md",
              "/getting_started/scenario_source_files.md",
              '/structure/scenario.json.md',
              '/structure/portraits.json.md',
              '/structure/entity_types.json.md',
              '/structure/maps.json.md',
            ]
          },
        ]
      },
      {
        text: "Tilesets",
        collapsible : true,
        children: [
          '/tilesets.md',
          "/tilesets/creating_a_tileset_json_file.md",
          "/tilesets/animations.md",
          "/tilesets/tile_collisions.md",
        ]
      },
      {
        text: "Maps",
        collapsible : true,
        children: [
          '/maps.md',
          '/maps/map_loads.md',
          '/maps/map_properties.md',
          '/maps/vector_objects.md',
          '/maps/coordinate_overflow.md',
        ]
      },
      {
        text: "Entities",
        collapsible : true,
        children: [
          '/entities.md',
          '/entities/entity_properties.md',
          {
            text: "Entity Types",
            collapsible : true,
            children: [
              '/entities/entity_types.md',
              '/entities/tile_entity.md',
              '/entities/null_entity.md',
              '/entities/animation_entity.md',
              '/entities/character_entity.md',
            ]
          },
          {
            text: "Relative Entity References",
            collapsible : true,
            children: [
              '/entities/relative_entity_references.md',
              '/entities/PLAYER.md',
              '/entities/SELF.md',
            ]
          },
        ]
      },
      {
        text: "Dialogs",
        collapsible : true,
        children: [
          {
            text: "Dialogs",
            collapsible : true,
            children: [
              '/dialogs.md',
              '/dialogs/dialog_properties.md',
              '/dialogs/multiple_choice_dialogs_json.md',
              '/dialogs/dialogs_json.md',
            ],
          },
          {
            text: "Serial Dialogs",
            collapsible : true,
            children: [
              '/dialogs/serial_dialogs.md',
              '/dialogs/serial_dialog_properties.md',
              '/dialogs/serial_dialog_options_json.md',
              '/dialogs/serial_dialogs_json.md',
            ]
          }
        ]
      },
      {
        text: "Scripts",
        collapsible : true,
        children: [
          '/scripts.md',
          '/scripts/scripts_json.md',
          '/scripts/comments_json.md',
          '/scripts/null_script.md',
          {
            text: "Script Slots",
            collapsible : true,
            children: [
              '/scripts/script_slots.md',
              '/scripts/on_interact.md',
              '/scripts/on_tick.md',
              '/scripts/on_load.md',
              '/scripts/on_look.md',
            ]
          },
          {
            text: "Variable Types",
            collapsible : true,
            children: [
              '/scripts/variable_types.md',
              '/scripts/warp_state.md',
              '/scripts/integer_variables.md',
              '/scripts/save_flags.md',
              '/scripts/printing_current_values.md',
              '/scripts/save_data.md',
            ]
          },
          {
            text: "Enums",
            collapsible : true,
            children: [
              '/structure/enums.md',
              '/structure/button_ids.md',
              '/structure/led_ids.md',
              '/structure/operations.md',
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
        text: "MGS",
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
              '/mgs/block.md',
              '/mgs/dialog_settings_block.md',
              '/mgs/dialog_settings_target_block.md',
              '/mgs/serial_dialog_settings_block.md',
              '/mgs/script_block.md',
              '/mgs/dialog_block.md',
              '/mgs/serial_dialog_block.md',
            ]
          },
          {
            text: "Scripts",
            collapsible : true,
            children: [
              '/mgs/scripts_mgs.md',
              '/mgs/combination_block.md',
              '/mgs/comments_mgs.md',
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
              '/mgs/dialog_example_mgs.md',
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
              '/mgs/serial_dialog_example_mgs.md',
              '/mgs/serial_styles.md',
            ]
          },
          {
            text: "Variables",
            collapsible : true,
            children: [
              '/mgs/variables_mgs.md',
              '/mgs/variables/bareword.md',
              '/mgs/variables/boolean.md',
              '/mgs/variables/color.md',
              '/mgs/variables/distance.md',
              '/mgs/variables/duration.md',
              '/mgs/variables/number.md',
              '/mgs/variables/operator.md',
              '/mgs/variables/quantity.md',
              '/mgs/variables/quoted_string.md',
              '/mgs/variables/string.md',
            ]
          },
          {
            text: "Advanced",
            collapsible : true,
            children: [
              '/mgs/advanced_mgs_natlang_syntax.md',
              '/mgs/advanced_syntax/labels.md',
              '/mgs/advanced_syntax/return.md',
              '/mgs/advanced_syntax/while_and_for.md',
              '/mgs/advanced_syntax/if_and_else.md',
              '/mgs/advanced_syntax/macros.md',
              '/mgs/advanced_syntax/const_.md',
              '/mgs/advanced_syntax/debug_.md',
              '/mgs/advanced_syntax/include_.md',
            ]
          },
        ]
      },
      {
        text: "Technical",
        collapsible : true,
        children: [
          {
            text: "Encoder",
            collapsible : true,
            children: [
              '/encoder/mge_encoder.md',
              '/encoder/cli_encoder.md',
              '/encoder/web_encoder.md',
              '/encoder/entity_management_system.md',
            ]
          },
          {
            text: "Hardware",
            collapsible : true,
            children: [
              '/hardware/hex_editor.md',
              '/hardware/terminal.md',
              '/hardware/commands.md',
              '/hardware/web_build.md',
              '/hardware/desktop_build.md',
              '/hardware/updating_the_hardware.md',
            ]
          },
          {
            text: "Debug",
            collapsible : true,
            children: [
              '/debug/debug_tools.md',
              '/debug/vector_view.md',
              '/debug/debug_mode.md',
              '/debug/mge_encoder_console.md',
              '/debug/inspecting_with_the_web_encoder.md',
              '/debug/kaitai.md',
            ]
          }
        ]
      },
    ]
  }),
})
