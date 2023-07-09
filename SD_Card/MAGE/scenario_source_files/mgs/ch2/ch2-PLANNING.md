# Chapter 2 planning

## Story themes

- Chapter 2: Connections
	- Connecting past to future: sending ideas into the future, building long term communities, remembering lessons learned in the past
	- Connecting rooms to each other: building larger projects with cooperation, building/fixing infrastructure
	- Connecting people: allowing people to hear each other, build relationships; humans as social animals; networking leads to finding mentors and opportunities
	- The cost of isolation vs the cost of exposing oneself to bad actors
	- Connecting hardware: hardware is made up of smaller pieces, and many fixes are only a matter of connecting something to something else
	- AT THE END: Lambda is reconnected
- Chapter 3: Knowledge
	- Benefits of education
	- Learning to navigate the gray area rather than take a black and white answer at face value
	- Learning about one's environment
	- Leaning toolsets, how to best use everyday tools
	- Secrets to protect the vulnerable vs secrets to manipulate the vulnerable

## Sprite wishlist

- [ ] Invisible dialog skin but with white arrow instead of pink (for birthday cake cutscene)

### Inventory items

- [x] `monitor`
- [ ] `heatsink`
	- [x] `cactuscooler`
- [x] `powersupply`
- [x] `keyboard` (keytar)
- [ ] `mouse` (rodent)
- [ ] `harddrive`
	- [x] `plate` (dinner plate)
	- [ ] `needle` (phonograph needle)
- [x] `ramchips` (bag of Doritos)
- [x] `clock` (grandfather clock)
- [ ] `cpu`
	- [x] `goldfish` (same sprite as bedroom?)
	- [x] `abacus`

### NPCs

- [ ] Lambda
- [ ] King Gibson
- [ ] Cat Cook
- [x] Castle goose (red bow)
- [x] Sea Moss
- [x] Trash panda ("Wizard")
- [x] Welder ("Rocco")
- [ ] Better Exa sprite
- [ ] Misc other humanoid NPCs

### Sets and doodads

- [ ] Vending machine
- [ ] Band instruments
- [ ] Normal walls/floor (vaguely circuit-like)
- [ ] Throne room (resembles Admiral's Gibson renders)
- [ ] Geothermal power plant
- [ ] Old timey-bedroom
- [ ] Blacksmith / workshop
- [ ] Server room
- [ ] Kitchen
- [ ] Hydroponics
- [ ] Pantry
- [ ] Messy computer lab (tiny)
- [ ] Collapsed rocks (blocking doorways + incidental fallen rocks)

## Serial dialogs styles

- Before printing a fresh message to the serial console, show the serial dialog "spacer" -- this is currently a line break, a bunch of hyphens, and another line break. This makes it obvious where a new serial message begins.
- Empty serial messages must contain a single space or they will be ignored.

### Character conversations

- Identify speakers with `<color>SPEAKERNAME:</>` before their actual dialog message.
	- For `<color>`, use the speaker's color symbol (see below)
- Separate multiple speakers with an empty line.
- Additional paragraphs spoken by the same speaker should be indented with `\t`.
- Put an empty line between the last paragraph of dialog and a user input prompt.

### Colors

- We can't know whether the user has a dark theme or a light theme, nor can we guarantee that all colors will be equally visible in their particular theme. Therefore, when needing arbitrary colors, prioritize them in this order:
	- Cyan/magenta (best)
	- Green/red
	- Blue/yellow (avoid)
	- Black/white (strong avoid)
- Do not use colors alone to convey information; if color coding something, also use other cues (capitalization, offsetting a word with with punctuation, etc.)
- Avoid using green/red as a point of contrast.
- Avoid using background colors or the "dim" style, since these are not as widely supported.
- Color symbols in ch2:
	- Magenta:
		- The village elders (the color of their robes)
		- Lambda
	- Red:
		- The Big Bad
		- Anything unambiguously evil
	- Cyan:
		- The player (the color of mage's robe)
		- Inline serial commands (these should also be all caps)
		- Any calls to action for the player
		- The castle rooms (ch2 dungeon) (?)
			- Only the warp names are colored?
- In the web serial console, a styled section of text loses its styles after a newline character. As a workaround, reapply the style at the beginning of the first word that lost its styles.
