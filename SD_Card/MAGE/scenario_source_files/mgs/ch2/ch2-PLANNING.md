# Chapter 2 planning

## Non-assets and scripting things we need

- [ ] Stories about building computers! I.e.
	- What you like: what you get out of it personally, which bits are easy to do, which bits are the most fun
	- What you dislike: what kinds of things goes wrong, specific horror stories, which bits are a pain to do
- [ ] Your soldering setup
	- What equipment do you have?
	- Is it always set up and left out, or do only get it out when you have a project?
	- Do you have a "quick job" vs "pull out all the stops" range of stuff you use?
	- How are things physically positioned on the desk? (Extra credit for an actual photo of everything laid out)
	- Any piece of equipment you might see on someone else's desk that makes you go "Oh, that person does some serious soldering"?
- [ ] How to set up a serial connection (COMPREHENSIVE PLZ)
	- [ ] Windows
		- Are there several ways of doing it?
		- If so, is there a clear leader for best way, or easiest for beginners?
		- Does the process vary based on which specific version you're on?
	- [ ] Linux
		- Is the hardware interface always the same, no matter the distro?
		- Any traps or workarounds for weird setups?
	- [ ] Mac (I think we've got it?)

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

- [x] Lambda
- [x] King Gibson
- [ ] Cat Cook
- [x] Castle goose (red bow)
- [x] Sea Moss
- [x] Trash panda ("Wizard")
- [x] Welder ("Rocco")
- [ ] Better Exa sprite
- [ ] Misc other humanoid NPCs (as many as possible)

### Sets and doodads

- [x] Vending machine
- [~] Band instruments
- [x] Normal walls/floor (vaguely circuit-like)
- [x] Throne room ~~(resembles Admiral's Gibson renders)~~
- [ ] Geothermal power plant
- [ ] Old timey-bedroom
- [ ] Blacksmith / workshop
- [ ] Server room
- [ ] Kitchen
- [x] Hydroponics
- [ ] Pantry
- [x] Messy computer lab (tiny)
- [~] Collapsed rocks (blocking doorways + incidental fallen rocks)

## Serial dialogs styles

- Before printing a fresh message to the serial console, show the serial dialog "spacer" -- this is currently a line break, a bunch of hyphens, and another line break. This makes it obvious where a new serial message begins.
- Empty serial messages must contain a single space or they will be ignored.

### Character conversations

- Identify speakers with `<color>SPEAKERNAME:</>` before their actual dialog message.
	- For `<color>`, use the speaker's color symbol (see below)
- Separate multiple speakers with an empty line.
- Additional paragraphs spoken by the same speaker should be indented with `\t`.
- Put an empty line between the last paragraph of dialog and a user input prompt.

### `on_look` scripts

See below for color choices.

#### Rooms

```mgs
look-ch2-roomname {
	show serial dialog spacer
	show serial dialog {
		"You looked around the <c>NAME OF ROOM</>."
		"\t(description goes here)"
		"\t(extra paragraphs should also be tabbed, but try to avoid a lot of short paragraphs)"
		" "
	}
}
```

The extra line break at the end is only needed for places, since the exit list will follow the room's `on_look` script.

#### Entities

```mgs
look-ch2-roomname {
	show serial dialog spacer
	show serial dialog {
		"You looked at <m>%EntityName%</>."
		// "You looked at the <m>%EntityName%</>." // for objects
		"\t(description goes here)"
		"\t(extra paragraphs should also be tabbed, but try to avoid a lot of short paragraphs)"
	}
}
```

Note the relative entity name for the label (i.e. wrapped in `%`s).

### Ansi Colors

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
		- Any other person, really
	- Red:
		- The Big Bad
		- Anything unambiguously evil
	- Cyan:
		- The player (the color of mage's robe)
		- Inline serial commands (these should also be all caps)
		- Any calls to action for the player, akin to the above
		- The castle rooms (ch2 dungeon) (?)
			- Only the warp names are colored?
- In the web serial console, a styled section of text loses its styles after a newline character. As a workaround, reapply the style at the beginning of the first word that lost its styles.
- Currently, in the web build, the bell character is printed! (Like, as a boxy character, inline with other text.) Keep that in mind...
