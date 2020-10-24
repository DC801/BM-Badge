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
- [x] Port over the Hex Editor
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
	- [x] Build MEM button handler functions
	- [x] Add ability to offset visible page of RAM by pages
	- [x] Render something on screen to see which RAM PAGE you're on
	- [x] Add PAGE handler; Hold page + arrows to jump pages of bytes?
	- [x] Start adding error handling for when indexing outside of supported types ROM data
- [x] Move functions for reading from the ROM into `mage_rom.cpp`
- [x] Create some `get_*_by_index` functions for validating hackable datas
	- [x] getValidEntityId
	- [x] getValidMapId
	- [x] getValidPrimaryIdType
	- [x] getValidTilesetId
	- [x] getValidTileId
	- [x] getValidAnimationId
	- [x] getValidAnimationFrame
	- [x] getValidEntityTypeId
	- [x] getValidEntityTypeAnimationId
	- [x] getValidEntityTypeDirection
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
			- [ ] We'll need a 'script stack' to handle scripts that call other scripts and allow returning to the original script and continuing down the list of actions.
			- [ ] Scripts shouldn't be able to be called when the player has opened the hex editor, but scripts should be able to open the hex editor when called from elsewhere.
		- [ ] Map
			- [ ] onLoad(uint16_t scriptId); //called once when the map loads
			- [ ] onTick(uint16_t scriptId); //called every tick
			- [ ] onInteract(uint16_t scriptId); //called only when the player interacts if no entity is nearby?
		- [ ] Entity
			- [ ] onTick(uint16_t scriptId); //called every tick
			- [ ] onInteract(uint16_t scriptId); //called when the player interacts with the entity
	- [ ] Actions
		- [ ] Logic and Flow Actions: (We'll need a cap on how many of these deep we can go from a main script to prevent using too much RAM with nested scripts)
			- [ ] addScriptToStack(uint16_t scriptId, uint8_t currentScriptActionIndex);
			- [ ] checkEntityByte(uint8_t entityId, uint8_t offset, uint16_t successScriptIndex, uint8_t expectedValue);
			- [ ] checkSaveFlag(uint8_t saveFlagOffset, uint16_t successScriptIndex, bool expectedValue);
			- [ ] checkIfEntityIsInGeometry(uint8_t entityId, uint16_t geometryId, uint16_t successScriptIndex);
			- [ ] compareEntityName(uint8_t targetEntityId, uint16_t successScriptIndex, uint32_t stringAddr);
			- [ ] runScript(uint16_t scriptId);
			- [ ] playSkit(uint16_t skitIndex);
			- [ ] checkDialogResponse(uint16_t dialogId, uint16_t successfulScriptIndex);
		- [ ] Game State Effecting Actions:
			- [ ] setEntityByte(uint8_t entityId, uint8_t offset, uint8_t newValue);
			- [ ] setSaveFlag(uint8_t saveFlagOffset, bool newValue);
			- [ ] setPlayerMovable(bool moveable);
			- [ ] setEntityInteractScript(uint8_t entityId, uint16_t scriptId);
			- [ ] setEntityTickScript(uint8_t entityId, uint16_t scriptId);
			- [ ] changeEntityType(uint8_t targetEntityId, uint16_t primaryId, uint16_t secondaryId, uint8_t primaryType);
			- [ ] pauseGameState(bool pauseState); //this will stop the entire MageGameLoop() from happening until set to false
		- [ ] Game Display changing actions:
			- [ ] loadMapByIndex(uint8_t mapId);
			- [ ] screenShake(uint8_t amplitutde, uint8_t freq, uint16_t duration);
			- [ ] screenFadeOut(uint16_t color, uint16_t duration); //should set a flag to keep the screen faded out until a screenFadeIn is called.
			- [ ] screenFadeIn(uint16_6 color, uint16_t duration);
			- [ ] showDialog(uint16_t dialogId);
			- [ ] switchRenderableFont(uint8_t fontId);
			- [ ] moveEntityTo(uint16_t x, uint16_t y);
			- [ ] moveEntityAlongPath(uint16_t entityId, uint16_t pathIndex);
			- [ ] cameraSet(uint16_t, uint16_t);
			- [ ] cameraPan(uint16_t xStart, uint16_t yStart, uint16_t xDest, uint16_t yDest, uint16_t duration);
			- [ ] setHexEditorState(bool state);
			- [ ] highlightHaxCell(uint16_t offset);
			- [ ] unlockHaxCell(uint8_t cellOffset);
			- [ ] lockHaxCell(uint8_t cellOffset);
- [ ] Geometry
	- [ ] circle(uint16_t x, uint16_t y, uint8_t radius)
		- [ ] inside_circle(point, circle) collision detection function
	- [ ] rect(point, uint16_t width, uint16_t height)
		- [ ] inside_rect(point, rect) collision detection function
	- [ ] poly(uint8_t count, x points[count])
		- [ ] inside_poly(point, poly) collision detection function
	- [ ] point(uint16_t x, uint16_t y)
		- no collision, just may be used as an arg?
- [ ] Dialog Data Type Ideas
	- [ ] Display Name (we may want to show names like '???' or 'Old Man' until we know who they are. After we know them we can use an entity's name, hacks and all.)
		- [ ] Can use string substitution to let us know when to use hacked entity name, vs a set name. 
		- [ ] Something Like %%EntityId.001%% gets replaced with the hacked name, and all other strings display as written. 
			- [ ] Substitution string needs to be 16 characters long to make sure it won't push other bits of the dialog off the end of a line when putting in haxed names.
		- [ ] We'd need a way to encode a specific entityId into it when generating the binary file, though. It'd be map dependent as well.
	- [ ] The actual text to display, probably with line breaks hard coded in to keep things simple.
	- [ ] byte to encode position (i.e. is the text on the top or bottom of the screen, is the portrait on the left or right side of the screen, etc.).
	- [ ] tilesetId and tileId for the portrait picture.
	- [ ] display font.
	- [ ] Player responses to dialog may be desired:
			- [ ] Assuming pop-up happens while dialog is still active:
				- [ ] select from a list of options
				- [ ] enter a numerical code
				- [ ] enter an alphanumeric code (put on-screen keyboard over dialog? Cycle through all letter options like arcade name entry?)
		- [ ] new script and/or dialog to call depending on player response

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
