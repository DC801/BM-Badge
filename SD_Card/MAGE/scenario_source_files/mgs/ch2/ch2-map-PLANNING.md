# USB dungeon serial "map" (ideas)

```
Nethack-like
-------------------------------
|  /----\      -       M A P  |
|  |....|     /.\             |
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
  -----    |   |   | 33|*|   *=34
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

### ENTRANCE

1. `Castle entrance`
	- XA: intercom with XB (outside) and XC in room 99
	- Save floppy
	- ITEM: computer enclosure + motherboard

### MAIN BRANCH

11. `Castle hallway front`
	- ITEM: Monitor
12. `Castle hallway back`
	- ITEM: phonograph
13. `Throne room`
	- the royal advisor (a goldfish, ruling in King Gibson's absence)
	- ITEM: goldfish (CPU item 1)
14. `King Gibson's bedroom`
	- ITEM: grandfather clock

### INDUSTRIAL AREA

21. `Workshop`
	- ITEM: abacus (CPU item 2)
	- (will combine goldfish with abacus)
22. `Server room`
	- ITEM: power supply
23. `Power plant` (geothermal)
	- Deliver Cactus Cooler to them to receive ITEM
	- ITEM: Heat sink

### FOOD STUFFS

31. `Grand hall`
	- Copy Pasta bar
	- Vending machine
	- Rock band
		- ITEM: keyboard (or possibly keytar)
32. `Castle kitchen`
	- ITEM: RAM chips (from vending machine)
33. `Hydroponics room`
	- ITEM: mouse (an actual rodent)
34. `Castle pantry`
	- ITEM: SSD/HD (plate)

### THE END

99. `Lambda's lab` (teleport only)
	- Lambda
	- XC: intercom with XB (outside) and XA in room 1
	- ITEM: mainframe OS

### TOWN

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
- `WOPR room`

- ITEM: cactus cooler (needed for heat sink)

## ZONES

```
 0-------------------------------
 1|  /----\      -       M A P  |    99        14
 2|  |.@..|     /.\             |    99        14
 3|  ------   /..@..\           |    99        14
 4|           -------           |          13  14
 5|            |...|   -------  |          13              33  34
 6|   -----    |.@.|   |.@.|@|  |      23  13              33  34
 7|  /..@..\   |...|   -------  |      23  13          32  33  34
 8|  \...../   |...|    |.@.|   |      23  13          32
 9|   -----    --------------   |  22  23  13  12  31  32
10|   |.@.|    |.@.|...@....|   |  22          12  31
11|   -----------------------   |  22  21  11  12  31
12|   |...@....|.@.|            |      21  11
13|   ----------------          |      21  11
14|          |...@...|          |          1
15|          ---------          |
16-------------------------------
```

## STORY PROGRESSION

(Only numbered items count as story flags)

Choose which "round" with the `ch2-storyflag-round` variable. Checkboxes refer to script scaffolding (the exact convos may be still unwritten); see `ch2-PLANNING.md` for the sprites checklist.

### PLOT

- INTRO (`ch2-storyflag-round` = 0)
	- [x] Intro to Lambda
		- [ ] Connecting the artifact on Windows
		- [ ] Connecting the artifact on MacOS / Linux
		- [x] Connecting the artifact on web
		- [x] Intro to artifact
	- [x] Installation Wizard
		- [x] Introduction
		- [x] Waiting for completion
	- Starting item: enclosure/motherboard (room 1)

- FIRST ROUND: normal (`ch2-storyflag-round` = 1)
	- [x] (1.) `monitor` (room 11)
	- [x] (2.) `heatsink` (room 23)
		- [x] `cactuscooler` (Bob's club)
	- [x] (3.) `powersupply` (room 22)
	- [x] Bert secret cutscene happens when all of the above are done
	- [x] Lambda gives next round of the parts list

- SECOND ROUND: abstract (`ch2-storyflag-round` = 2)
	- [x] (4.) `keyboard` (keytar) (room 31)
	- [ ] (5.) `mouse` (rodent) (room 33)
	- [ ] (6.) `harddrive`
		- [x] `plate` (dinner plate) (room 34)
		- [ ] `needle` (phonograph needle) (room 12)
	- [x] (7.) `ramchips` (bag of Doritos) (room 32)
	- [ ] Bert "any messages yet?" convo happens when all of the above are done
	- [ ] Lambda gives next round of the parts list

- THIRD ROUND: desperate (`ch2-storyflag-round` = 3)
	- [ ] (8.) `clock` (grandfather clock) (room 14)
	- [ ] (9.) `cpu`
		- [ ] `goldfish` (same goldfish sprite as bedroom) (room 13)
		- [x] `abacus` (room 21)
	- [ ] Lambda shows you how to `warp` and invites you to room #99 

- FINAL ROUND: software (`ch2-storyflag-round` = 4)
	- [~] Lambda talks to you in person
	- [ ] (10.) `mainframeos` (room 99) (might be handled differently)
	- [ ] Cutscene: OS installation wizard
	- [ ] "You did it" cutscene
	- [ ] Credits

- AFTERWARD (`ch2-storyflag-round` = 5)
	- [ ] Post-credits sequence: Alfonso mentions one of the Big Bad's powers that most people don't know about
	- [ ] Go about the overworld now

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

- INTRO (`ch2-storyflag-round` = 0)
	- [ ] Villagers direct you to western dungeon (castle)
- FIRST ROUND: normal (`ch2-storyflag-round` = 1)
	- [ ] Villagers ask how things are going
- SECOND ROUND: abstract (`ch2-storyflag-round` = 2)
	- (DITTO ABOVE)
- THIRD ROUND: desperate (`ch2-storyflag-round` = 3)
	- [ ] Player asks villages about Bert, they haven't seen him
- FINAL ROUND: software (`ch2-storyflag-round` = 4)
	- (DITTO ABOVE)
- AFTERWARD (`ch2-storyflag-round` = 5)
	- [ ] Speculate on next location: software!

### Scripts needed for story items

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
