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
- [x] Make a list of some C functions we want scripts to be able to call
- [x] Decide on a common script function signature
- [ ] Define an encoding format for scripts
- [ ] Ability to specify which font is used in a dialog
	- [ ] There can be a puzzle where changing the font to smaller makes all of a message readable
- [ ] Music/SFX encoding in the binary asset encoder
- [ ] Script system
	- [ ] Binary Encoder parts
	- [ ] Scripts
		- [ ] What is a script?
			- [ ] It's a length + sequence of Actions
			- [ ] Scripts shouldn't be able to be called when the player has opened the hex editor, but scripts should be able to open the hex editor when called from elsewhere.
			- [ ] We'll need entity-based state variables to track pathing and other transient values between ticks.
		- [ ] Map
			- [ ] onMapLoad(uint16_t scriptId); //called once when the map loads
			- [ ] onMapTick(uint16_t scriptId); //called every tick, used for doors, other static events when moving around map.
		- [ ] Entity
			- [ ] onEntityTick(uint16_t scriptId, uint8_t entityId); //called every tick, entityId is the entity calling that script.
			- [ ] onEntityInteract(uint16_t scriptId); //called when the player interacts with the entity
	- [ ] Actions
		- [ ] Logic and Flow Actions: (We'll need a cap on how many of these deep we can go from a main script to prevent using too much RAM with nested scripts)
			- [ ] checkEntityByte(uint8_t entityId, uint8_t offset, uint8_t expectedValue, uint16_t successScriptId);
			- [ ] checkSaveFlag(uint8_t saveFlagOffset, bool expectedValue, uint16_t successScriptId);
			- [ ] checkIfEntityIsInGeometry(uint8_t entityId, uint16_t geometryId, bool expectedValue, uint16_t successScriptId);
			- [ ] checkForButtonPress(uint8_t buttonId, uint16_t successScriptId); //KEYBOARD_KEY:: enum value
			- [ ] checkForButtonState(uint8_t buttonId, bool expectedValue, uint16_t successScriptId); //KEYBOARD_KEY:: enum value
			- [ ] runScript(uint16_t scriptId);
			- [ ] compareEntityName(uint8_t targetEntityId, uint16_t stringId, uint16_t successScriptId);
			- [ ] delay(uint32_t ms); //blocking delay for script timing
			- [ ] nonBlockingDelay(uint32_t ms); //allows game loop to continue and then continues a script
			- [ ] setPauseState(bool pauseState); //this will stop the entire MageGameLoop() from happening until set to false
		- [ ] Game State Effecting Actions:
			- [ ] setEntityByte(uint8_t entityId, uint8_t offset, uint8_t newValue);
			- [ ] setSaveFlag(uint8_t saveFlagOffset, bool newValue);
			- [ ] setPlayerControl(bool playerHasControl);
			- [ ] setEntityInteractScript(uint8_t entityId, uint16_t scriptId);
			- [ ] setEntityTickScript(uint8_t entityId, uint16_t scriptId);
			- [ ] setMapTickScript(uint16_t scriptId);
			- [ ] setEntityType(uint8_t targetEntityId, uint16_t primaryId, uint16_t secondaryId, uint8_t primaryType);
			- [ ] setHexCursorLocation(uint16_t offset);
			- [ ] setHexBit(uint8_t bitmask, bool state);
			- [ ] unlockHaxCell(uint8_t cellOffset);
			- [ ] lockHaxCell(uint8_t cellOffset);
		- [ ] Game Display changing actions:
			- [ ] loadMap(uint16_t mapId);
			- [ ] screenShake(uint8_t amplitutde, uint8_t freq, uint16_t duration);
			- [ ] screenFadeOut(uint16_t color, uint32_t duration);
			- [ ] screenFadeIn(uint16_6 color, uint32_t duration);
			- [ ] showDialog(uint16_t dialogId);
			- [ ] switchRenderableFont(uint8_t fontId);
			- [ ] moveEntityToGeometry(uint8_t entityId, uint16_t geometryId);
			- [ ] moveEntityAlongGeometry(uint8_t entityId, uint16_t geometryId, uint32_t duration);
			- [ ] loopEntityAlongGeometry(uint8_t entityId, uint16_t geometryId, uint32_t duration);
			- [ ] moveCameraToGeometry(uint16_t geometryId);
			- [ ] moveCameraAlongGeometry(uint16_t geometryId, uint32_t duration);
			- [ ] loopCameraAlongGeometry(uint16_t geometryId, uint32_t duration);
			- [ ] setEntityDirection(uint8_t entityId, uint8_t direction);
			- [ ] setHexEditorState(bool state);
			- [ ] setHexEditorDialogMode(bool state);
- [ ] Geometry
	- [ ] circle(uint16_t x, uint16_t y, uint8_t radius)
		- [ ] inside_circle(point, circle) collision detection function
	- [ ] rect(point, uint16_t width, uint16_t height)
		- [ ] inside_rect(point, rect) collision detection function
	- [ ] polygon(uint8_t count, x points[count])
		- [ ] inside_poly(point, poly) collision detection function
	- [ ] polyline(uint8_t count, x points[count])
	- [ ] point(uint16_t x, uint16_t y)
		- no collision, just may be used as an arg?
- [ ] Dialog Data Type Ideas
	- [ ] Display Name - either stringId, or entityId
	- [ ] The actual text to display, probably with line breaks hard coded in to keep things simple.
	- [ ] byte to encode position (i.e. is the text on the top or bottom of the screen, is the portrait on the left or right side of the screen, should we display a portrait at all?, etc.).
		- [ ] flags for position encoding byte:
			- [ ] Top of Bottom
			- [ ] Portrait on or off
			- [ ] portrait left or right
			- [ ] use local name or entityId
	- [ ] tilesetId and tileId for the portrait picture.
	- [ ] display font.
	- [ ] voice sound Id
	- [ ] response TypeId:
		- [ ] NO_RESPONSE = 0
		- [ ] SELECT_FROM_LIST = 1
		- [ ] ENTER_NUMBER = 2
		- [ ] ENTER_ALPHANUMERIC = 3
		- [ ] etc...
	- [ ] Player responses to dialog may be desired:
		- [ ] Assuming pop-up happens while dialog is still active:
			- [ ] select from a list of options
			- [ ] enter a numerical code
			- [ ] enter an alphanumeric code (put on-screen keyboard over dialog? Cycle through all letter options like arcade name entry?)
		- [ ] new script and/or dialog to call depending on player response
- [ ] Strings
	- [ ] uint16_t Length
	- [ ] char array with null termination Length bytes long

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

### In which Tim tries to make a Hex editor tutorial script:

Tutorial synopsis:
-Script-1
	-setPlayerMovable(false)
	-Interact with someone or something to start the tutorial.
		-Entity OnInteract()
		-playSound()
	-Player now has ring 0.
		-SetSaveFlag()
	-Player spins around and is teleported to a new level of darkness.
		-playSound()
		-moveEntityTo()
		-setEntityDirection()
		-screenFadeOut()
		-loadMap()
	-Otamatonani Appears.
		-playSound()
		-moveEntityAlongPath()
	-Otamatonavi speaks:
		-showDialog()
			-'blah blah blah, I'ma teach you how to use the power of ring 0 to change the world around you!'
		-showDialog()
			-'First you need to learn how to hax the planet! You just need to grab your hat and concentrate.'
	-Otamatone now waits for player to touch their hat.
		-clearDialog()
		-setEntityTickScript(otamatonavi, script-2)
		-SetPlayerMovable(true)

-Script-2
	-checkForButtonPress(hax key, Script-3)

-Script 3
	-setPlayerMovable(false)
	-sethexEditorState(true)
	-setHexEditorDialogState(true)
	-setHexCursor(0)
	-Otamatonavi speaks:
		-showDialog() (need to hide portrait)
			-Excellent work! Now you're able to see the state of all the entities in the world!
		-showDialog() with response:
			-Do you want me to explain how the hex editor works?
				-Yes, Script 5
				-No, Script 4

Script 4
	-Otamanavi Speaks:
		-Alright then, you're free to hack away. If you set byte 0x1d to 170, I'll let you out of this void!
	-Close dialog, close hack interface, return player control, etc. 
	setEntityTickScript(Script 7)
	setEntityOnInteractScript(Script 6)


Script 5
	Otamanavi Speaks:
			-You may notice that some of the bytes are a different color. 
			-That's because you are able to sense your own bytes.
			-Now let me explain the hacking interface.
			-The cursor will move when you use the directional buttons below, like so.
	-show cursor moving to hackable box:
		-setHexCursor(1)
		-delay(20)
		...
		-setHexCursor(28)
	-Otamanavi Speaks:
		-showDialog()
			-You see how these values are easy for you to read? That means you can hack them!
			-To hack them you just use those bit buttons you've got there.
			-I'll show you what happens to this byte when I press each button...
	-Show bit lights blinking for a bit, and how the number changes.
		-setHexBit(BIT_1, true)
		-delay(500)
		...
		-setHexBit(BIT_8, true)
		-Delay(500)
		...
		-SetHexBit(BIT_128, true)
	-Otamatonavi speaks:
		-As you can see, the value of this cell changes based on the state of the lights!
		-You can change any bit in the current byte using the bit buttons
		-Now you try it! I'll let you ouf ot this void if you set byte 1d to be 170	.
	-callScript(Script 4)

Script 6
	-Otamatonavi Speaks:
		-If you set byte 0x1d to 170, I'll let you out of this void!

Script 7
	-checkByte(1d, Script 8, 170)

Script 8
	-Send the player back to the village...


```js
var scenario = {
	"scripts": {
		"hex_tutorial":[
			{
				"action": "
			}
		]
	}
    "dialogs": {
        "hex_editor_tutorial": [
            {
                "name": "Tutorial",
                "tileset": "MissingNo",
                "tileId": 5,
                "avatar_position": "left", // left, right
                "dialog_position": "top", // top, bottom
                "text": "You can use your arrows to position the text cursor",
                "before_display_script": "open_hex_editor_and_highlight_cell_0",
                "after_display_script": "open_hex_editor_and_highlight_cell_0"
            }
        ]
    }
}
'''

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
