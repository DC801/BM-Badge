# Serial Dialog Options (MGS)

NOTE: This syntax is used for [[MGS Natlang]] [[Serial Dialogs (MGS)|serial dialogs]], not [[Serial Dialogs (JSON)|JSON serial dialogs]].

Two choices:

- Numbered option (multiple choice):
	- `# $label:quotedString : (goto) (script) $script:string`
	- Each **label** will appear as part of a numbered list in the serial console.
	- These labels (and only these) may be [[serial styles|styled]].
	- The player cannot proceed until they enter a valid number, at which point the game will jump to the corresponding script. That means this type of option will *always* result in a script jump.
- Free response:
	- `_ $label:quotedString : (goto) (script) $script:string`
	- The **label** indicates what the player must type for the game to jump to the indicated script.
	- There is no explicit prompt for these options, but upon reaching the free response portion of the serial dialog, the player can type whatever they want into the serial console.
	- An invalid response will fall through, i.e. the script will continue executing actions further below. Therefore, only a *valid* response will result in a script jump.
	- The user's response is case insensitive. (The label `"CAT"` will match the user input of `cat`.)

Behaviors in common between the two:

- A single serial dialog can only use *one* of these two types.
	- The parser will interpret all options within the block using the type of the first option.
- Unlike [[Dialog Options (MGS)|dialog options]], the option count for serial dialogs is unlimited.
- The **label** *must* be wrapped in [[Quoted String|quotes]].
- The words `goto` and `script` are optional. Any [[string]] given after the `:` (other than `goto` and `script`) is assumed to be the script name.

## Example

See: [[Serial Dialog Example (MGS)]]