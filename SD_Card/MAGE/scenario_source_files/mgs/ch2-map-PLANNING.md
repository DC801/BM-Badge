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
12. Back hallway
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
- ITEM: sea moss (CMOS) (?)
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

## STORY FLAGS

Starting item: enclosure/motherboard (room 1)

1. `clock` (grandfather clock) (room 14)
2. `cpu`
	- `goldfish` (room 13)
	- `abacus` (room 21)
3. `heatsink` (room 23)
	- `cactuscooler` (Bob's club)
4. `powersupply` (room 22)
5. `ramchips` (room 32)
6. `hd` (plates) (room 34)
7. `keyboard` (room 31)
8. `mouse` (rodent) (room 33)
9. `monitor` (room ?)
10. `mainframeos` (room 99)
