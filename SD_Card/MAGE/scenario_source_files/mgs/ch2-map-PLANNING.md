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

// ENTRANCE
1. Exa room
	- XA: intercom with XB (outside) and XC in room 99
	- Save floppy
	- ITEM: computer enclosure + motherboard

// MAIN BRANCH
11. Front hallway
	- ITEM: Monitor
12. Back hallway
	- ITEM: phonograph (maybe?)
13. Throne room
	- the royal advisor (a goldfish, ruling in King Gibson's absence)
	- ITEM: goldfish (CPU item 1)
14. King Gibson's bedroom
	- ITEM: grandfather clock

// INDUSTRIAL AREA
21. Blacksmith / workshop area
	- ITEM: abacus (CPU item 2)
	- (will combine goldfish with abacus)
22. Server room
	- ITEM: power supply
23. Geothermal power plant
	- Deliver Cactus Cooler to them to receive ITEM
	- ITEM: Heat sink

// FOOD STUFFS
31. Grand hall
	- Copy Pasta bar
	- Vending machine
	- Rock band
		- ITEM: keyboard (or possibly keytar)
32. Kitchen
	- ITEM: RAM chips (from vending machine)
33. Hydroponics area
	- ITEM: mouse (an actual rodent)
34. Pantry
	- ITEM: SSD/HD (plates)

// THE END
99. Secret room (teleport only)
	- Lambda
	- XC: intercom with XB (outside) and XA in room 1
	- ITEM: mainframe OS

// TOWN
- ITEM: cactus cooler (needed for heat sink)
```

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

Choose which "round" with the `ch2-storyflag-round` variable. Checkboxes refer to script scaffolding (the exact convos may be still unwritten).

- INTRO
	- [x] Intro to Lambda
		- [ ] Connecting the artifact on Windows
		- [ ] Connecting the artifact on MacOS / Linux
		- [x] Connecting the artifact on web
		- [x] Intro to artifact
	- [x] Installation Wizard
		- [x] Introduction
		- [x] Waiting for completion
	- Starting item: enclosure/motherboard (room 1)

- FIRST ROUND: normal
	- [ ] (1.) `monitor` (room 11)
	- [x] (2.) `heatsink` (room 23)
		- [x] `cactuscooler` (Bob's club)
	- [ ] (3.) `powersupply` (room 22)
	- Bert cutscene (happens when 2/3 of the above are done)

- SECOND ROUND: abstract
	- [ ] (4.) `keyboard` (keytar) (room 31)
	- [ ] (5.) `mouse` (rodent) (room 33)
	- [ ] (6.) `harddrive` (dinner plates) (room 34)
		- [ ] `needle` (phonograph needle) (room 12) (maybe?)
	- [x] (7.) `ramchips` (bag of Doritos) (room 32)
	- Bert "any messages yet?" convo happens when 2/4 of the above are done

- THIRD ROUND: desperate
	- [ ] (8.) `clock` (grandfather clock) (room 14)
	- [ ] (9.) `cpu`
		- [ ] `goldfish` (same goldfish sprite as bedroom) (room 13)
		- [ ] `abacus` (room 21)

- FINAL ROUND: software
	- [ ] (10.) `mainframeos` (room 99) (might be handled differently)
		- [ ] Cutscene: OS installation wizard
	- [ ] End cutscene

### Scripts needed

For each item: (Copy existing pattern wherever these are found)

1. Put entity on a map (`ENTITY`) and set `on_interact` = `ch2-touch-ITEM`
2. In file `ch2-admin.mgs`:
	1. Script `ch2-report-inventory` — Add serial dialog `\tITEM` display check (using flag `ch2-carrying-ITEM`)
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
4. In file `ch2-serial-toot.mgs`
	1. Make serial dialog `ch2-describe-ITEM`
	2. Add a new substep to script `ch2-toot-step-5X`
5. In file `ch2-man-tree.mgs`
	1. Make script `ch2-describe-ITEM`: `show serial dialog ch2-describe-ITEM`
	2. Make script `ch2-lambda-parts-ITEM` (copy an existing)
	3. Add to `ch2-lambda-topic-parts` (using flag `ch2-installed-ITEM`)
	4. Add to script `ch2-lambda-topic-parts-q` (if multiple words, add a no-spaces option, too)
