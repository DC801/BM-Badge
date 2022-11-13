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

// MAIN BRANCH
11. Main entrance
	- Someone trapped; needs to go to kitchen
12. Rock slide puzzle
	- must clear the way for person in #11
13. Throne room / reception area
14. King Gibson's bedroom
	- ITEM: phonograph record needle

// INDUSTRIAL AREA
21. Blacksmith / workshop area
22. Server room
23. Geothermal power plant
	- Needs coolant to increase power output (Cactus Cooler?)

// FOOD STUFFS
31. Grand hall
	- Copy Pasta bar
	- Vending machine
	- Rock band
		- ITEM: keyboard
32. Kitchen
33. Hydroponics area
34. Pantry
	- ITEM: mouse
	- ITEM: plates

// THE END
99. Secret room (teleport only)
	- Secret IT man
	- Mainframe backup software
	- XC: intercom with XB (outside) and XA in room 1
```

ZONES

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