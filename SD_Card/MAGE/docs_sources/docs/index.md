# Mage Game Engine (MGE) Content Creation Guide

Content creation guide for the "Mage Game Engine" (MGE), and other information for working with the "Black Mage" game for DC801's party badge (BMG2020).

## Getting Started

- [What You'll Need](getting_started/what_youll_need)
- [MAGE Folder](getting_started/mage_folder)
	- [scenario_source_files](scenario_source_files)
	- [scenario.json](structure/scenario.json)
	- [portraits.json](structure/portraits.json)
	- [entity_types.json](structure/entity_types.json)
	- [maps.json](structure/maps.json)
- [General Process](getting_started/general_process)

## [Tilesets](tilesets)

- [Creating a Tileset JSON File](tilesets/creating_a_tileset_json_file)
- [Animations](tilesets/animations)
- [Tile Collisions](tilesets/tile_collisions)

## [Maps](maps)

- [Map Loads](maps/map_loads)
- [Map Properties](maps/map_properties)
- [Vector Objects](maps/vector_objects)
- [Coordinate Overflow](maps/coordinate_overflow)

## [Entities](Entities)

- [Entity Types](Entity Types)
	- [Tile Entity](entities/tile_entity)
		- [Null Entity](entities/null_entity)
	- [Animation Entity](entities/animation_entity)
	- [Character Entity](entities/character_entity)
- [Entity Properties](entities/entity_properties)
- [Relative Entity References](entities/relative_entity_references)
	- [%PLAYER%](entities/PLAYER)
	- [%SELF%](entities/SELF)

## [Dialogs](dialogs)

- [Dialog Properties](dialogs/dialog_properties)
- [Multiple Choice Dialogs (JSON)](dialogs/multiple_choice_dialogs_json)
- [Dialogs (JSON)](dialogs/dialogs_json)

## [Scripts](Scripts)

- [Script Slots](scripts/script_slots)
	- [on_interact](scripts/on_interact)
	- [on_tick](scripts/on_tick)
	- [on_load](scripts/on_load)
	- [on_look](scripts/on_look)
- [null_script](scripts/null_script)
- [Variable Types](scripts/variable_types)
	- [warp_state](scripts/warp_state)
	- [Integer Variables](scripts/integer_variables)
	- [Save Flags](scripts/save_flags)
	- [Printing Current Values](scripts/printing_current_values)
- [Comments (JSON)](scripts/comments_json)
- [Scripts (JSON)](scripts/scripts_json)
- [Scripting Techniques](techniques/scripting_techniques)
	- [Actors](techniques/actors)
	- [Coordinate Considerations](techniques/coordinate_considerations)
	- [COPY_SCRIPT Uses](techniques/copy_script_uses)
	- [Cutscenes](techniques/cutscenes)
	- [Doors](techniques/doors)
	- [Handlers](techniques/handlers)
	- [Hiding an Entity](techniques/hiding_an_entity)
	- [Map Initialization Scripts](techniques/map_initialization_scripts)
	- [One Script, Multiple Behaviors](techniques/one_script_multiple_behaviors)
	- [Spawn Points](techniques/spawn_points)

## Actions

- [Action Dictionary](Actions)

## Finishing

- [MGE Encoder](encoder/mge_encoder)
	- [Web Encoder](encoder/web_encoder)
	- [CLI Encoder](encoder/cli_encoder)
- [Updating the Hardware](hardware/updating_the_hardware)

## [Debug Tools](debug/debug_tools)

- [Vector View](debug/vector_view)
- [Debug Mode](debug/debug_mode)
- [MGE Encoder Console](debug/mge_encoder_console)
- [Inspecting with the Web Encoder](debug/inspecting_with_the_web_encoder)
 