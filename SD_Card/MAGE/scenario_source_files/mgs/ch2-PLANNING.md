# Chapter 2 planning

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
- In the web serial console, a styled section of text loses its styles after a newline character. As a workaround, reapply the style at the beginning of the first word that lost its styles.
