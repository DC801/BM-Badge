# todo:

- [x] Add tile flipping to render function
- [x] Entities
	- [x] Determine which entity should be player character on map load
- [x] Handle player input
- [x] Add entity render ordering by coordinate of bottom edge
- [x] Add support for entity animation timing
	- [x] Make an array of uint16s that just hold the current frame for entities; it doesn't need to be hackable, just stateful
	- [x] Reset
- [x] Port over the sdl_toy_0 button & LED state emulation
	- [x] Start rendering the background graphic
	- [x] Collect the Button coordinates
	- [x] Render the Buttons
	- [x] Collect the LED coordinates
	- [x] Render the LEDs
	- [x] Handle all inputs for the buttons
	- [x] Toggle the button renderable states when buttons are down
	- [x] Toggle the LED/Boolean values when the buttons are pressed
- [x] Generate a bunch of different WAV files of different sample rates for Dovid
- [ ] Port over the Hex Editor
	- [x] Build Monaco 9 as an AdaGFXFont because we need a good monospace font
	- [x] Start rendering the text for the byte grid
	- [x] Render byte selection cursor behind the text
	- [x] Arrows navigate cursor on byte grid when hex editor is open
	- [x] Pass states of currently selected byte to the LEDs
	- [x] Build the entity RAM <-> uint8_t array mapper/typecasting?
	- [x] Build hex ops handler functions
	- [x] Trigger swap of hex ops enum
	- [x] Build hex bit handler functions
	- [x] Trigger hex bit handler to change value of bits on selected byte
	- [ ] Build MEM button handler functions
	- [ ] Trigger swap/set of MEM... position?
	- [x] Add ability to offset visible page of RAM by pages
	- [x] Render something on screen to see which RAM PAGE you're on
	- [x] Add PAGE handler; Hold page + arrows to jump pages of bytes?
	- [ ] Start adding error handling for when indexing outside of supported types ROM data
- [x] Move functions for reading from the ROM into `mage_rom.cpp`
- [ ] Create some `get_*_by_index` functions for reading from ROM
	- [ ] These should return nullptr if not found
	- [ ] Things that call these should check for null and have a fallback
	- [x] get_entity_type_by_index
	- [ ] get_entity_by_index
	- [ ] get_map_by_index
	- [x] get_tileset_by_index
	- [x] get_image_by_index
	- [ ] get_animation_by_index
	- [ ] get_animation_direction_by_index_and_direction
- [ ] In the ROM header, the first u4 should be the length of the header
	- [ ] In Mage init, Read header up to that length, then parse it
- [ ] Make a list of some C functions we want scripts to be able to call
- [ ] Decide on a common script function signature
- [ ] Define an encoding format for scripts
- [ ] Ability to specify which font is used in a dialog
	- [ ] There can be a puzzle where changing the font to smaller makes all of a message readable
- [ ] Music/SFX encoding in the binary asset encoder
- [ ] Script system
	- [ ] Binary Encoder parts
	- [ ] Scripts
		- [ ] What is a script?
			- [ ] It's a length + sequence of Actions
		- [ ] Map
			- [ ] onLoad(uint16_t scriptId); //called once when the map loads
			- [ ] onTick(uint16_t scriptId); //called every tick
			- [ ] onInteract(uint16_t scriptId); //called only when the player interacts if no entity is nearby?
		- [ ] Entity
			- [ ] onTick(uint16_t scriptId); //called every tick
			- [ ] onInteract(uint16_t scriptId); //called when the player interacts with the entity
	- [ ] Actions
		- [ ] load_map_by_index(uint8_t mapId);
		- [ ] run_script(uint16_t scriptId);
		- [ ] switch_renderable_font(uint8_t index);
		- [ ] shake_screen(uint8_t amplitutde, uint8_t freq, uint16_t duration);
		- [ ] show_dialog(uint16_t dialogIndex);
		- [ ] check_current_entity_byte(uint8_t offset, uint16_t successScriptIndex, uint8_t expectedValue);
		- [ ] check_save_flag(uint8_t offset, uint16_t successScriptIndex, bool expectedValue);
		- [ ] move_entity_to(uint16_t x, uint16_t y);
		- [ ] move_entity_on_path(uint16_t entityIndex, uint16_t pathIndex);
		- [ ] set_interact_script(uint8_t targetEntityIndex, uint16_t scriptId);
		- [ ] set_player_movable(bool moveable);
		- [ ] play_skit(uint16_t skitIndex);
		- [ ] set_byte(uint16_t offset, uint8_t);
		- [ ] camera_set(uint16_t, uint16_t);
		- [ ] camera_pan(uint16_t xStart, uint16_t yStart, uint16_t xDest, uint16_t yDest, uint16_t duration);
		- [ ] highlight_hax_cell(uint16_t offset);
		- [ ] unlock_hax_cell(uint8_t offset);
		- [ ] lock_hax_cell(uint8_t offset);
		- [ ] check_if_entity_is_in_geometry(uint8_t entityId, uint16_t geometryId, uint16_t successScriptIndex);
		- [ ] change_entity_type(uint8_t targetEntityId, uint16_t primaryId, uint16_t secondaryId, uint8_t primaryType);
		- [ ] compare_entity_name(uint8_t targetEntityId, uint16_t successScriptIndex, uint32_t stringAddr)
- [ ] Geometry
	- [ ] circle(uint16_t x, uint16_t y, uint8_t radius)
		- [ ] inside_circle(point, circle) collision detection function
	- [ ] rect(uint16_t x, uint16_t y, uint16_t width, uint16_t height)
		- [ ] inside_rect(point, rect) collision detection function
	- [ ] poly(uint8_t count, count x points[])
		- [ ] inside_poly(point, poly) collision detection function
	- [ ] point(uint16_t x, uint16_t y)
		- no collision, just may be used as an arg?

## Quests on the Village Quest Board
- [ ] Save Timmy From The well
	- Someone should point out that Timmy could always fly, and could have flown himself out of the well.
	- Perhaps he is an Eye Faerie.
- [ ] Village Elder wants you to paint a fence
	- Change the hackable bytes on 5 fence entities watching for value change
- [ ] Wax on, Wax off
	- ???
- [ ] Fix Bender's shiny metal ass
	- There's a Bender with a chunk taken our of his shiny metal ass
- [ ] Bring Milk to the door of the Serial Dungeon, it gets soggy and you can get in
- [ ] Un-hack the old lady's husband
	- [ ] Starts as a sheep, then un-hacked to be a person
	- [ ] When un-hacked, triggers a secondary quest available on next map load:
	- [ ] Turn the old lady's husband back into a sheep, she liked him better that way
- [ ] Unravel the Ethernet Tumbleweed
	- [ ] Follow up with Yagoth on the details for this
- [ ] Rake in the Lake
- [ ] Get the Fountain Flowing Again
- [ ] "I really hate that statue, please hide it in the lake."
- [ ] Put the 4 escaped sheep back in the pen


### Some possible pseudo-code on the "Save Timmy From The well" scenario
```json
{
	"scripts": {
		"town_init": [
			{
				"name": "run_script",
				"value": "check_if_player_has_saved_timmy_from_the_well"
			},
			{
				"name": "run_script",
				"value": "check_if_player_has_done_some_other_thing"
			}
		],
		"check_if_player_has_saved_timmy_from_the_well": [
			{
				"name": "check_save_flag",
				"bit": 20,
				"expected_value": 1,
				"success_script": "move_timmy_to_house"
			}
		],
		"move_timmy_to_house": [
			{
				"name": "move_entity_to",
				"target_entity": "Timmy",
				"value": [120, 450]
			},
			{
				"name": "set_interact_script",
				"target_entity": "Timmy",
				"script": "thanks_for_saving_me_bro"
			}
		],
		"check_if_not_in_well": [
			{
				"name": "check_if_entity_is_in_geometry",
				"entity": "Timmy",
				"geometry": "out_of_well_polygon",
				"success_script": "you_saved_timmy"
			}
		],
		"you_saved_timmy": [
			{
				"name": "show_dialog",
				"value": "dialog-you_just_saved_my_life_bro"
			}
		],
		"pls_save_timmy": [
			{
				"name": "show_dialog",
				"value": "dialog-pls_save_timmy"
			}
		]
	},
	"maps": {
		"town_map": {
			"on_init": "town_init",
			"on_tick": "town_tick",
			"entities": [
				{
					"name": "Timmy",
					"x": 0,
					"y": 0,
					"on_tick": "check_if_not_in_well",
					"on_interact": "pls_save_timmy"
				}
			]
		}
	}
}
```
