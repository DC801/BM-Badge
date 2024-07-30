# USB dungeon serial "map" (ideas)

```
Nethack-like
-------------------------------
|  /----\      -      CASTLE  |
|  |....|     /.\        MAP  |
|  ------   /.....\           |
|           -------           |
|            |...|   -------  |
|   -----    |...|   |.....|  |
|  /.....\   |...|   -------  |
|  \...../   |...|    |...|   |
|   -----    -------------|   |
|   |...|    |...|........|   |
|   -----------------------   |
|   |........|...|            |
|   |---------------          |
|          |...@...|          |
|          ---------          |
-------------------------------

 /----\      -
 | 99 |     / \
 ------   / 14  \
          -------  -------
  -----    |   |   |33|34|
 /     \   |13 |   -------
 \ 23  /   |   |    |32 |
  -----    --------------
  |22 |    |12 |    31  |
  |----------------------
  |   21   |11 |
  |---------------
         |   1   |
         ---------
```

## ROOMS

The room name (re: warping or other serial labelling) is what is contained within backtics.

The following lists concern physical appearance (including the actual spritesheets), physical placement, and basic tile and vector plumbing.

### Entrance

1. `Castle entrance`
	- [x] Cutscene: Enter the room for the first time (not needed)
	- [~] Entity: XA - intercom with XB (outside) and XC in room 99
		- [ ] Redo This sprite? Perhaps Super Mario RPG type thing, where it's like actually modeled in 3D
	- [~] Entity: Wizard - installs OS onto mainframe when it's finished
		- [x] Needs side sprites
		- [ ] Wizard hat and cape sprite version
	- [x] Mainframe enclosure
	- [x] Save floppy
	- [~] SET: the inside equiv. of a front porch; spartan; this room precedes even a coat rack or the like

### Admin Branch

11. `Castle hallway front`
	- [x] Cutscene: Enter the room for the first time
	- [x] Inventory item: monitor
	- [x] Entity: Kuro (a crow)
	- [x] SET: more a proper foyer; grandiose, welcoming, but nothing specific happening in terms of personnel stations or equipment
12. `Castle hallway back`
	- [x] Cutscene: Enter the room for the first time
	- [x] Inventory item: needle (from phonograph)
	- [x] Entity: Concierge (super nice suit, but like it's some kind of a scraggly werewolf)
	- [x] Entity: mid-90s tall black stereo system (one of those big CD changer / cassette deck thingies)
	- [x] SET: the "human" half of the foyer, logistically speaking
		- [x] Concierge desk with guestbook
	- [x] PUZZLE NEEDED: use the serial terminal to fix the damaged digital entertainment system (which plays muzak in the foyer)
13. `Throne room`
	- [x] Cutscene: Enter the room for the first time
	- [x] Inventory item: goldfish (cpu part 1) (see below)
	- [x] Entity: Goldfish (the regent in the king's absence)
	- [x] Entity: Sebastian (a red lizard wizard; a "Jafar" type)
	- [x] Entity: Templeton (a giant blue slime; bumbling/flustered)
	- [x] SET: the throne room: over the top, gilded and extravagantly furnished, and way bigger than it needs to be
		- [x] Closed version of USB door (north version)
14. `King Gibson's bedroom`
	- [~] Cutscene: Enter the room for the first time
	- [x] Inventory item: clock
	- [x] Entity: King Gibson
	- [x] SET: old-timey king's bedroom
		- [x] Four poster bed
		- [x] Grandfather clock
		- [x] Wardrobes or whatever idk
		- [x] Closed version of USB door (south version)
		- [x] Keypad (from below?)
	- [x] PUZZLE NEEDED: use the serial terminal to fix the keypad

### Industrial Area

21. `Workshop`
	- [~] Cutscene: Enter the room for the first time
	- [x] Inventory item: abacus (CPU part 2)
	- [x] Entity: Goose (with ribbon)
		- [ ] Should be involved with one of the puzzle items
	- [x] Entity: Jean-Paul - human-sized cockatiel; buds with Frankie
	- [x] Entity: Frankie - androgynous, Homestar Runner shirt-wearing tinkerer; buds with Jean-Paul
	- [x] SET: work room for fixing and making hardware (both old timey castle type hardware *and* computer type hardware); disheveled, but not hopelessly so (everything is sort of in the right place, it's just all out at the moment)
22. `Server room`
	- [ ] Cutscene: Enter the room for the first time
	- [x] Inventory item: powersupply
	- [x] Entity: Scuzzy - generic conversation about the similarities between rooms in a building and components inside a computer
	- [x] Entity: C.K. Watt - gives you the power supply because it's extra
	- [x] SET: More cleanroom looking than the workshop
		- [x] Racks of machines
		- [x] Some computer buildery stuff (more computer, less electronics?)
23. `Power plant`
	- [x] Cutscene: Enter the room for the first time (not necessary)
	- [x] Inventory item: heatsink
	- [x] Entity: Tracy - generic engineer
	- [x] Entity: Rocco - to trade you the heat sink for a can of Cactus Cooler
	- [x] Entity: Helvetica - succubus, but you wouldn't know it from how she was acting; consummate professional engineer
	- [x] SET: Aiming for geothermal; whatever would sell that re: appearance

### Food

31. `Grand hall`
	- [x] Cutscene: Enter the room for the first time (not necessary)
	- [x] Inventory item: keyboard (keytar from the band)
	- [x] Entity: Simon - a band member from 1023 MB; challenges player to Simon says, and gives the keytar in the event of a loss
		- [x] Still needs keytar position sprites for the mage
	- [x] Entity: Theodore - a band member from 1023 MB
	- [x] Entity: Alvin - a band member from 1023 MB
	- [x] SET: A kind of a lounge area for sophisticated entertainment and dining space for a modest crowd
		- [x] Cocktail tables and stools
		- [x] Stage with band instruments (band: 1023 MB)
		- [x] ~~Copy Pasta bar (some booze, some small entrees)~~ Actually now just a table with bottles and cups (presumably stationed by an employee during events, not actually self serve)
32. `Castle kitchen`
	- [x] Cutscene: Enter the room for the first time (not necessary)
	- [x] Inventory item: ramchips (giant Doritos-esque bag of chips)
	- [x] Entity: Samson - a medium-sized golden bug; child of Gloria
	- [x] Entity: Gloria - a large golden beetle; fusses over child Samson
	- [x] Entity: Sea Moss - a huge stone golem covered in barnacles etc.; helps direct you to Cactus Cooler; helps you acquire RAM chips
	- [ ] Tom Servo, sw corner of bottom room
		- [ ] Needs sprite
	- [x] SET: Some dining space, but more of an employee snack room kind of vibe
		- [x] Moderate-sized kitchen
		- [x] Vending machine
		- [x] Snack room ish tables/chairs
33. `Hydroponics room`
	- [x] Cutscene: Enter the room for the first time
	- [x] Inventory item: mouse (no graphics necessary)
	- [x] Entity: Gregory - a cat chef
		- [x] Needs cat chef spritesheet (currently a stand-in entity)
	- [x] SET: Hydroponics area, with vegetables growing in individual plastic(?) bins, stacked to the ceiling
34. `Castle pantry`
	- [x] Cutscene: Enter the room for the first time (not necessary)
	- [x] Inventory item: plate (harddrive part 2)
	- [x] Entity: Clara - someone who can help you measure and calibrate the spin of a "plate" (for a HD)
	- [x] SET: Larder-ish, wine-cellar-ish, pantry-ish.
	- [x] PUZZLE NEEDED: use the serial terminal to do Towers of Hanoi

### The End

99. `Lambda's lab` (teleport only)
	- [x] Cutscene: Enter the room for the first time
	- [x] Inventory item: Mainframe OS
	- [x] Entity: Lambda
	- [x] Entity: XC: intercom with XB (outside the castle?) and XA in room 1
	- [x] SET: Very lived in, untidy; housing a shut-in

### Town

- `Town`
- `Bakery`
- `Greenhouse`
- `Library`
- `RTFM room` (aka `inner sanctum`)
- `Mage house`
- `Bob's club`
- `Bob's club basement`
- `Beatrice's house`
- `Smith's house`
- `WOPR room` (secret room)

## ZONES

```
 0-------------------------------
 1|  /----\      -      CASTLE  |    99        14
 2|  |.@?.|     /.\        MAP  |    99        14
 3|  ------   /..@?.\           |    99        14
 4|           -------           |          13  14
 5|            |...|   -------  |          13              33  34
 6|   -----    |.@.|   |?@|@?|  |      23  13              33  34
 7|  /..@..\   |.?.|   -------  |      23  13          32  33  34
 8|  \..?../   |...|    |.@.|   |      23  13          32
 9|   -----    --------------   |  22  23  13  12  31  32
10|   |.@?|    |.@?|...@.?..|   |  22          12  31
11|   -----------------------   |  22  21  11  12  31
12|   |...@.?..|.@?|            |      21  11
13|   ----------------          |      21  11
14|          |...@...|          |          1
15|          ---------          |
16-------------------------------

with doors as pluses:
 0-------------------------------
 1|  /----\      -      CASTLE  |    99        14
 2|  |.@?.|     /.\        MAP  |    99        14
 3|  ------   /..@?.\           |    99        14
 4|           ---+---           |          13  14
 5|            |...|   -------  |          13              33  34
 6|   -----    |.@.|   |?@|@?|  |      23  13              33  34
 7|  /..@..\   |.?.|   --+-+--  |      23  13          32  33  34
 8|  \..?../   |...|    |.@.|   |      23  13          32
 9|   --+--    --+--------+--   |  22  23  13  12  31  32
10|   |.@?|    |.@?+...@.?..|   |  22          12  31
11|   --+--------+-----------   |  22  21  11  12  31
12|   |...@.?..+.@?|            |      21  11
13|   -----------+----          |      21  11
14|          |...@...|          |          1
15|          ----+----          |
16-------------------------------
```

## STORY PROGRESSION

(Only numbered items count as story flags)

Choose which "round" with the `ch2-storyflag-round` variable. Checkboxes refer to script scaffolding (the exact convos may be still unwritten); see `ch2-PLANNING.md` for the sprites checklist.

In debug mode, you can use the command `storyflag` to set this arbitrarily for testing purposes.

### Plot

Plot points implemented:

- INTRO (`ch2-storyflag-round` = 0)
	- [x] Picking up the artifact from a sliding door cubby on the side of the wall: door opens, player character moves over there, turns to get it, then maybe door closes again (so we can reuse that temp entity)
	- [x] Intro to Lambda
		- [x] Connecting the artifact
		- [x] Intro to artifact
	- [x] Installation Wizard
		- [x] Introduction
		- [x] Waiting for completion
	- Starting item: enclosure/motherboard (room 1)

- FIRST ROUND: normal (`ch2-storyflag-round` = 1)
	- [x] (1.) `monitor` (room 11)
	- [x] (2.) `heatsink` (room 23)
		- [x] The power plant guys need a substitute cooling source if you are to take their heatsink
		- [x] `cactuscooler` (Bob's club)
	- [x] (3.) `powersupply` (room 22)
	- [x] Bert secret cutscene happens when all of the above are done
	- [x] Lambda gives next round of the parts list

- SECOND ROUND: abstract (`ch2-storyflag-round` = 2)
	- [x] (4.) `keyboard` (keytar) (room 31)
	- [x] (5.) `mouse` (rodent) (room 33)
	- [x] (6.) `harddrive`
		- [x] `plate` (dinner plate) (room 34)
			- [x] Run several plates through some kind of serial minigame, currently a tower of Hanoi puzzle
		- [x] `needle` (phonograph needle) (room 12)
			- [x] Fix the existing speakers so they can use the digital media system, rather than the phonograph
	- [x] Bert "any messages yet?" convo happens when all of the above are done
	- [x] Lambda gives next round of the parts list

- THIRD ROUND: desperate (`ch2-storyflag-round` = 3)
	- [x] (7.) `ramchips` (bag of Doritos) (room 32)
	- [x] (8.) `clock` (grandfather clock) (room 14)
		- [~] Talk to Gibson; get him and his staff to reconcile
			- They each think the others are ignoring them, but in fact the door intercom no longer works and the door is broken. (Sometimes lack of connection is due to misunderstandings, not due to malice or lack of capability)
			- What happened was:
				- They had a fight about something
				- King stormed off into bedroom
				- Earthquake
				- King was waiting for them to be all like "OH NO, YOUR MAJESTY, ARE YOU ALIVE?" and they said nothing, so he thinks they're having a coup
				- Staff thinks:
					- Sebastian (lizard wizard) thinks they should have a coup; that Gibson is being irresponsible and childish and has abandoned them (focus on ignoring the king)
					- Templeton (slime) thinks the king might be injured and they should rescue him (focus on King)
					- The Aurelius (goldfish; current regent) thinking about the civilians
			- [x] Use the terminal to repair the intercom and get them talking again
				- [x] Password in the floors of each room: will spell AUTHENTICATE
			- [x] The King should return to the throne room
				- [x] After which the king and his staff reconcile
				- [x] And after which the goldfish agrees to go with you
	- [x] (9.) `cpu`
		- [x] `goldfish` (same goldfish sprite as bedroom) (room 13)
			- [x] The goldfish nobly sacrifices itself, but not before the King returns
		- [x] `abacus` (room 21)
			- [x] Should need to go into town for something: the manual for Frankie's scientific calculator (HP35s)
			- [x] Manual needs sprite
	- [x] Lambda shows you how to `warp` and invites you to room #99 

- FINAL ROUND: software (`ch2-storyflag-round` = 4)
	- [x] Lambda talks to you in person
	- [x] (10.) `mainframeos` (room 99) (might be handled differently from other items)
	- [~] Cutscene: OS installation wizard
		- [ ] Should need to go into town for an ethernet cable -- ("Oh, crud! I need to pull some dependencies... This is your last errand, I promise! Go get a spare cable from Trekkie, would you?")
	- [~] "You did it" cutscene
	- [~] Credits

- AFTERWARD (`ch2-storyflag-round` = 5)
	- [x] Post-credits sequence: Alfonso mentions one of the Big Bad's powers that most people don't know about
	- [~] Go about the overworld now

### Village elder locations

ALL DONE!

- INTRO (`ch2-storyflag-round` = 0)
	- [x] All outside castle entrance
	- [x] All encouraging you
- FIRST ROUND: normal (`ch2-storyflag-round` = 1)
	- [x] Alfonso: in the library, getting distracted by random books on accident
	- [x] Jackob: in the library, in a staring contest with the goose
	- [x] Bert: in the inner sanctum, looking for the book they lost
	- Bert visits you
- SECOND ROUND: abstract (`ch2-storyflag-round` = 2)
	- [x] Alfonso: talking to Verthandi
	- [x] Jackob: in the bakery, shopping for fresh bread
- THIRD ROUND: desperate (`ch2-storyflag-round` = 3)
	- [x] Jackob in inner sanctum, worried about the time you are taking
	- [x] Alfonso in inner sanctum, worried about Bert
- FINAL ROUND: software (`ch2-storyflag-round` = 4)
	- [x] Jackob/Alfonso waiting outside
	- [x] Jackob/Alfonso urging you to finish
- AFTERWARD (`ch2-storyflag-round` = 5)
	- [x] In the main square
	- [x] Mention how you can have a break now
		- [x] If you haven't beaten part 1, Jackob invites you to do so now

### Villager dialog

They should move around a bit between all these story flags, though chunking them to the following four categories is fine (rather than the six above)

- INTRO (`ch2-storyflag-round` = 0)
	- [ ] Villagers direct you to western dungeon (castle)
- FIRST ROUND: normal (`ch2-storyflag-round` <= 2)
	- [ ] Villagers ask how things are going
- THIRD ROUND: desperate (`ch2-storyflag-round` <= 4)
	- [ ] Player asks villages about Bert; they haven't seen him
- AFTERWARD (`ch2-storyflag-round` <= 5)
	- [ ] Speculate on next location: software!

Use this template:

```
if (variable ch2-storyflag-round is 0) {
	show dialog {
	// hint at western dungeon
	}
} else if (variable ch2-storyflag-round is <= 2) {
	show dialog {
	// asks how things are going
	}
} else if (variable ch2-storyflag-round is <= 4) {
	show dialog {
	// player asks after Bert; entity hasn't seen him
	}
} else {
	show dialog {
	// congratulate player for winning; speculate on next dungeon
	}
}
```

Villagers:

- [x] Baker (bakery) (only says something generic)
- [x] Guardian Bob (not required; dialog is quest related)
- [x] Trekkie (greenhouse)
- [x] Timmy (library)
- [x] Uncle Zappy (home)
- [x] Aunt Zippy (home)
- [ ] Beatrice (Beatrice's house)
	- [ ] Should be focued on reconciling with Delmar (reforging their connections) 
	- (this should be possible after storyflag 3, so the shepherd's dialog still makes sense)
- [ ] Delmar (sheep's pen, sulking)
- [x] Smith (Smith's house)
- [x] Kid (Smith's house)
- [x] Marta (overworld)
- [x] Verthandi (overworld)
- [ ] Hamster (overworld)
	- [ ] Pick another spot for him
- [ ] Cleo (with white cat) (overworld)
- [ ] Clomper
	- [ ] Needs sprite
- [x] Yabbo Mongo (overworld; says something generic)

Entities not being used right now: (maybe use them?)

- [ ] Ssen
	- [ ] I haven't played Earthbound; find something clever to do wtih him
- [ ] Bender
	- [ ] Think of somewhere else he should be hanging out
- [ ] Town goose
	- [ ] Should still be around
	- [x] Does the rake easter egg still work? (No)
	- [x] (Should it?) (YES)
- [ ] Max Swagger
	- [ ] Should be able to go inside the building
	- [ ] Interior should be very bare; furnishings are still being worked on
	- [ ] Max Swagger should explain his sky-high ambitions for the interior, confidently deflecting concerns that not much seems to have been done yet
	- [ ] Should maybe have instructions or tips for the blinky art board

### Lambda conversations

- [ ] Ask about people
	- [ ] Everyone in the castle should be possible, but make two versions: one before you've been in that room, and one after (Do this very last, after other cutscenes are done)

### Scripts needed for story items

ALL DONE! (Probably)

For each item: (Copy existing pattern wherever these are found)

1. Put entity on a map (`ENTITY`) and set `on_interact` = `ch2-touch-ITEM`
2. In file `ch2/ch2-admin.mgs`:
	1. Script `command-inventory` — Add serial dialog `\tITEM` display check (using flag `ch2-carrying-ITEM`)
	2. Script `ch2-count-flags` — Add tally logic check (using flag `ch2-installed-ITEM`)
	3. Script `ch2-interact-mainframe` — Add installation dialog (using flags `ch2-installed-ITEM` and `ch2-carrying-ITEM`)
3. In script file for the map room:
	1. Room's `on_load` — Add entity hide behavior (using flags `ch2-installed-ITEM` and `ch2-carrying-ITEM`)
	2. Make script `ch2-hide-ITEM`
		- `teleport entity ENTITY to geometry hiding-spot`
		- `set entity ENTITY name to " "`
	3. Make script `ch2-touch-ITEM`
		- (Copy existing pattern)
	4. Make script `ch2-install-ITEM`
		- `set flag ch2-carrying-ITEM to false`
		- `set flag ch2-installed-ITEM to true`
	5. Make script `look-ITEM`
4. In file `ch2/ch2-serial-toot.mgs`
	1. Make serial dialog `ch2-describe-ITEM`
	2. Add a new substep to script `ch2-toot-step-5X`
5. In file `commands/command-parts.mgs`
	1. Make script `ch2-describe-ITEM`: `show serial dialog ch2-describe-ITEM`
	2. Make script `command-parts-ITEM` (copy an existing)
	3. Add to `command-parts` (using flag `ch2-installed-ITEM` and `ch2-carrying-ITEM`)
	4. Add to script `command-parts-q` (if multiple words, add a no-spaces option, too)

Other notes:

- `ch2-hide-X` concerns moving the entity itself around the physical game map; `ch2-pickup-X` and `ch2-install-X` concern setting flags to make the item appear on the ASCII serial map, serial inventory list, etc.

## Puzzles to implement

(Also see the brainstorming far below)

- [ ] Clicking the buttons on the sides of the screen to interact with Sea Moss' vending machine
	- [ ] Sea Moss gives some excuse about how his fingers are too big to press the buttons himself (he still inserts the money though)
	- [ ] Disable serial; enable afterward (so the player doesn't try anything weird to the cutscene state)
	- [ ] Vending machine closeup screen: just the part where it's the buttons and the segment display for whatever numbers you chose
		- Q. What happens if you choose the wrong one?
			- Proposal: Sea Moss quips something funny about that item, maybe some kind of tech snack pun, but then invalidates that choice and is like "Seriously, though, I'm not made of cash! Let's try the real choice please?"
		- Q. What buttons are normally there on a vending machine? Letters? Numbers?
		- Q. The badge's buttons are on the sides of the screen. Is there a button layout where it would be obvious what button does what?
- [x] Finished: Simon says
- [x] Finished: hot-cold game (mousegame)
- [x] Finished: word search (uses terminal for display/input)
- [ ] Potential: pipe puzzle a la System's Twilight
- [ ] Potential: Lost Woods puzzle!
	- Each castle room as a note somewhere, like 4-L. These are the instructions for the lost woods thing
	- Not a note! It's the traces on the ground, each room a different letter and number:

Other things:

- [ ] Regular full computer desktop: (Atari ST? System 6?)

### Lost woods

Room count: 12 rooms (not counting 99)

```
#####   #####          ===>     ##### U #####          ===>     #$##?   ?####
#####   #####          ===>     #####   #####          ===>     ?##$#   ###$#
#####   #####          ===>     #####   #####          ===>     #$###   #$###
      @                ===>     L     @     R          ===>           @      
#####   #####          ===>     #####   #####          ===>     ##$##   ?##$#
#####   #####          ===>     #####   #####          ===>     #$###   #$#?#
#####   #####          ===>     ##### D #####          ===>     ###?#   ##$##


#$##?   ?####
?##$#   ###$#
#$###   #$###
      @      
##$##   ?##$#
#$###   #$#?#
###?#   ##$##


#####   #####           #####   #####           #############           #####   #####
#####   #####           #####   #####           #############           #####   #####
#####   #####           #####   #####           #############           #####   #####
      @ #####           ##### @                       @                       @      
#####   #####           #####   #####           #####   #####           #############
#####   #####           #####   #####           #####   #####           #############
#####   #####           #####   #####           #####   #####           #############

#############           #####   #####           #####   #####           #############           #####   #####           #############
#############           #####   #####           #####   #####           #############           #####   #####           #############
#############           #####   #####           #####   #####           #############           #####   #####           #############
      @ #####                 @ #####           ##### @                 ##### @                 ##### @ #####                 @      
#####   #####           #############           #############           #####   #####           #####   #####           #############
#####   #####           #############           #############           #####   #####           #####   #####           #############
#####   #####           #############           #############           #####   #####           #####   #####           #############
```

## Puzzle Mechanics

### Serial terminal: things we can do 

1. Multiple choice question
	- Integer answer only, 0+, depending on how many options there are
	- Invalid answers result in the original serial dialog (script?) running again
2. Free response question
	- Invalid answers result in a fallthrough in the original script that "called" the serial dialog
3. Arbitrary commands
	- Registered and deregistered as a script action
	- The command itself is a single word; additional "arguments" are registered separately; a "failure" script can be registered, as well, where an invalid argument is attempted

### Serial terminal: things we can't do

- Apart from arbitrary sizes of white space (just space?), which is used to split the input string, no further string processing can be done; all matches must be EXACT (case insensitive)
- Game logic largely consists of integer variables and boolean story flags, so emulating a real computer system is possible but unfeasible

#### Goals / issues

- "Free response" questions are underutilized
	- [ ] Somebody SOMEWHERE should need the answer `AFTER DARK` for the question `When do the flying toasters come out?`
		- It's a bit obscure for a main game puzzle though

## Educational Angles (Brainstorming again)

BRAINSTORMING: In terms of the player accidentally learning something about CS:

### What we use terminals for IRL

- Run a CLI program (technically this is everything)
	- Internal commands: `echo`, `cd`
	- External command: staring a new program and it's using that thread now (unless told otherwise etc.)
- Change obscure settings in a config file (which lacks a GUI)
- Log into another computer and do stuff over there
- Changing the status of the shell session at that moment: e.g. `cd`
- Run a shell script for specific things you need to do a lot at arbitrary times

### Installing Linux

- Things to do:
	- Boot from whatever boot media (Lambda uses CRTs and old beige computers, so should this be CD...?)
	- Format the drive
	- Install the OS
		- What options are common?
	- Pick a username
	- Set a password
	- Install applications/utilities that weren't included (usually gradually, as you realize you need them)
- What can go wrong?
	- (The GNUs can get out)
	- Format the drive wrong
- Goals:
	- Installation "cutscene" shouldn't take more than like 2 minutes
	- Should not be annoying or boring to people used to the real process, but not overwhelming for people who have never even seen this kind of thing before
	- Should have pretend dummy "installing X" text
		- Note that we can't do ANSI cursor maneuvering! Every new message is just spit out on a new line after the previous one.
	- Can (probably should) have coaching from the raccoon "Wizard" on the badge screen via standard dialogs, telling you the specific things to type into the console
	- Something can go wrong with the installation process (if so, only once) but it shouldn't derail things too hard. Make sure the player understands that small complications are normal and there are ways to recover from them.
- Questions:
	- What if the player tries to do a real Linux thing that wasn't in the script?
		- Should the Wizard intercept this? Like "Whoa, hold on now. Let's just try to get that thing working first!" ? (The problem with that angle is that the player then might anticipate actually being able to do that stuff later.)
	- If we can't emulate a Linux installation process very exactly, would it be better to do something slightly off the wall?
		- Better to be silly or punny than to approach accuracy incompletely?
		- Can this still be educational?
	- We had the player acquire a monitor, so should we expect some kind of DE appear on the screen at the end?
		- Proposal: the monitor hangs out by the enclosure, so maybe it comes on, and then the whole badge screen (cinematically) turns into a default desktop, perhaps complete with slowly-loading interface elements (like maybe the desktop icons take a second to appear), before the normal overworld is shown again.
			- Possible issue: you don't get to actually use a mouse?
			- Or maybe the joystick can move a "mouse" around? But then what happens if the player wants to "click" on something?

### Things unique to the badge itself

We should take advantage of the badge hardware itself, especially since hex editing can't be done inside the castle at first.

- Listening to arbitraty button presses. This includes the "hax" capacitive button (PCB hat)
	- Using the buttons as arbitrary multiple-choice menus (4 lights on either side of the screen, 8 total)
		- Pro: for multiple-choice dialogs, if you want to navigate more than a few options, you need to use 1/4 of the options for "back" and another for "next" -- meaning you only see 2 options per screen! Being able to choose 8 at once instead of 4 actually means triple the options can be seen at once! (6 + "back" + "next")
		- Con: This means the map itself must contain option text, which then must be managed; therefore, adding additional items will always be difficult (maybe do this very last, if doing it at all)
- Hex editor lights
	- Bling: lights flash in a pattern
		- E.g.
			- Circle around the screen
			- Back and forth along the bottom
			- Falling down (or up) the sides
			- One (or all) blinking on and off
		- Con: limited to game frame rate
		- Con: needs 1 `on_tick` script slot; if the script is reused (such as a circular pattern for a generic warping script), that means each map must have an entity by the same name managing this (The player's `on_tick` is already being used! Or could the player's `on_tick` do the original stuff PLUS the lights?)
	- [x] Progress bar: along the bottom of the screen, 8 lights max.
- In combination:
	- [x] Turning a light on or off depending on a button press (that is, using the button's light to indicate that the button was pressed)
	- [x] Simon says type game
- Complications:
	- Light (and button) alignment with screen will be slightly different between real badges and the web
	- Button presses aren't strictly super responsive

## Other stuff

- Do the red-bow goose a favor
	- Should be plot-blocking (unavoidable)
	- Should leave the goose in your debt
	- Should feel like a throwaway moment
- Setting up the mainframe's networking
- Mainframe needs software bodging because the hardware is so janky
- [ ] Multiple-choice fall through should be more thought out -- which bits get repeated again, e.g. draw spacer?
- [ ] Put collision on the debris at the doors
- [ ] Characters in the rooms post-game can be freed?
	- [~] Debris-less versions of rooms?
	- [~] Doors work?
- [~] Redo menu save management
	- [ ] "Manage slots" rather than "save to current" and "load arbitrary"
	- [x] Make it so "new game" isn't the first option -- so people mashing `A` won't erase their save by accident
- [x] Load correct map on game start (depending on what chapter; currently they all load to town)
- [ ] Old dudes need better excuse for not coming along; can't the player make a backdoor for them to come in?
- [ ] You should be able to ask the wizard for Bert messages (currently he ignores the question, and Lambda has `any messages` behavior)
- [ ] `Look` should list items you can pick up
- [ ] `plover` should trigger an Easter egg
- [ ] `xyzzy` (ditto the above)
- [ ] Second thing to do in town?
	- Motherboard?
	- Book from library?
	- Sound card
	- Water for water cooler
	- bread from the bakery (a breadboard)
	- network card from Trekkie
	- ethernet cable from Trekkie!
		- you could pick either one, and that's the one that goes away?
		- or Trekkie says you can't use the tumbleweed one, since it's all borked
		- put it in step 4: software, because you realize you need some software drivers
- If the player has to leave to go to town once in every story round, they're more likely to see changes in town!
- Little hacks you can do in town, not for the story, but for funsies -- misleading or satisfying?
	- Straighten out tangled ethernettle before Trekkie will let you take one?
- Some kind of hardware that can only talk to you with how its lights are blinking (which ones, what pattern)
- Game feature: type a thing, have something in the world react
- Type a keypad (using the terminal) to get door(s) working?
- Twisty turny: https://en.wikiquote.org/wiki/Colossal_Cave_Adventure (different variations)
- Multiple choice riddles!!!!! (After dark!!!!)
- Reference IP over avian carriers
- Log Forge (Log4J according to the Hacker Jeopardy guy)
- The "Linq River" (or "Linq Lake")
- Any Homestar Runner reference in ch2?
