A simplified approach to writing game content for the DC801 Black Mage Game Engine (MGE).

- The MGE encoder itself still needs its input in the form of JSON; however, exporting MGS Natlang to JSON is straightforward.
- A syntax coloring grammar is in development:
	- original: `mgs.tmLanguage.json` (JSON)
	- for Sublime Text: `mgs.tmLanguage` (XML)
	- for Visual Studio Code: `magegamescript-colors.vsix` (VSCode plugin)

![Syntax color sample](docs-images/syntax-color-sample.png)

## MGS Natlang vs JSON

### Original script JSON:

```json
{
	"on_tick-greenhouse": [
		{
			"action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
			"entity": "%PLAYER%",
			"geometry": "door-greenhouse",
			"success_script": "leave-greenhouse",
			"expected_bool": true
		},
		{
			"action": "COPY_SCRIPT",
			"script": "ethernettle-uproot-check",
			"comment": "some kind of comment"
		}
	]
}
```

While relatively human readable, the above is difficult to write in practice.

- It's bulky enough that you can't have very much scripting logic on your screen at once.
- It's easy to lose track of what you're doing as you must constantly reference named scripts and dialogs (and serial dialogs) in different files back and forth.
- JSON cannot be commented, so it's inconvenient to leave yourself supplementary information, such as the contents of a dialog you're referencing when scripting a cutscene in a script file.
- The parameters for MGE actions are not highly uniform, so it's easy to forget or confuse parameters if you're not copying and pasting actions from nearby.

### MGS Natlang (script):

```
on_tick-greenhouse {
	if entity "%PLAYER%" is inside geometry door-greenhouse
		then goto leave-greenhouse
	copy script ethernettle-uproot-check // some kind of comment
}
```

Apart from the fact that the MGS Natlang won't receive any syntax coloring by default, this is more approachable.

It's more compact, and the nested relationship of the script and its actions is far easier to see at a glance. Human-friendly grammar constructions (e.g. `is inside` vs `is not inside`) makes it much easier to follow script branching logic.

The syntax is flexible:

- White space agnostic.
- Many strings can be unquoted or quoted freely (though anything with a space or any unusual character *must* be wrapped in quotes). Double or single quotes are both fine.
- Many words are optional, and can be included either to increase logical clarity or omitted to decrease word density, e.g. `goto script scriptName` vs `goto scriptName`.
- Certain variables can be formatted in multiple, human-friendly ways, e.g.
	- duration: `1000ms` or `1s` or `1000`
	- quantity: `once` or `1x` or `1`

### Original dialog JSON

```json
{
	"exampleDialogName": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "Trekkie",
			"messages": [
				"Me want to wish you a happy birthday,\n%PLAYER%."
			]
		},
		{
			"alignment": "BOTTOM_RIGHT",
			"entity": "%PLAYER%",
			"messages": [
				"Aww, gee, thanks, Farmer\n%Trekkie%!"
			]
		}
	]
}
```

Dialog JSON is more uniform than script JSON is, but its information density is even worse.

### MGS Natlang (dialog):

```
settings for dialog {
	defaults {
		alignment BL
	}
	parameters for label PLAYER {
		entity "%PLAYER%"
		alignment BR
	}
}
```

With MGS Natlang, you can create presets for common dialog settings. As a result, the dialogs themselves are very lightweight, making it effortless to read and write large swaths of them:

```
dialog exampleDialogName {
	Trekkie
	"Me want to wish you a happy birthday, %PLAYER%."

	PLAYER
	"Aww, gee, thanks, Farmer %Trekkie%!"
}
```

And since MGS Natlang is whitespace agnostic, it can become as compact as you want:

```
dialog exampleDialog2 {
	PLAYER "Neat."
}
```

or even

```
dialog exampleDialog2 { PLAYER "Neat." }
```

### MGS Natlang (combined):

However, where MGS Natlang really shines is in combining both script data and dialog data together:

```
settings for dialog {
	parameters for label PLAYER {
		entity "%PLAYER%"
		alignment BR
	}
}
show_dialog-wopr-backdoor {
	set player control to off
	walk entity "%PLAYER%" along geometry wopr-walkin over 600ms
	wait 400ms
	set player control to on
	show dialog {
		PLAYER "Whoa! It looks like I found some kind of back door."
	}
	set flag backdoor-found to true
}
```

Now the dialog's content is no longer separated from its context. The dialog no longer needs a name, either, unless another script needs to refer to it, too.

## MGS Natlang block structure

MGS Natlang currently has several types of blocks, each with their block contents enclosed in a pair of matching curly braces:

```
<BLOCK DECLARATION> { <BLOCK BODY> }
```

Some block types can (or must) be nested within others, but blocks cannot be nested arbitrarily.

Unless otherwise marked, assume all entries in the following list are allowed in any quantity (including zero). Numbered items must be given in exactly that order, but all other items can occur in any order within their parent block.

### Nesting structure

- **dialog settings block**
	- **dialog settings target block**
		- **dialog parameter**
- **dialog block**
	- **dialog**
		1. **dialog identifier** (exactly 1)
		2. **dialog parameter**
		3. **dialog message** (at least 1)
		4. **dialog option**
- **script block**
	- **action**
	- **show dialog block**
		- **dialog**
			1. **dialog identifier** (exactly 1)
			2. **dialog parameter**
			3. **dialog message** (at least 1)
			4. **dialog option**

## Block types

In the following definitions, words in parentheses are optional, and words starting with dollar signs are variables. (See [MGS Natlang variables](#mgs-natlang-variables) for how to interpret variables in these MGS Natlang definitions.)

### Dialog settings block

- **Parent block:** none
- **Block body:**  any number of [dialog settings target blocks](#dialog-settings-target-block) (in any order)
- **Syntax:** `settings (for) dialog {}`

Dialog settings are applied to dialogs in order as the parser encounters them; a dialog settings block partway down the file will affect only the dialogs afterward, and none before.

New settings will override old settings, entity settings will override global settings, and label settings will override entity settings [verify this]. (Parameters given in a dialog's body will override any other settings, however.)

### Dialog settings target block

- **Parent block:** [dialog settings block](#dialog-settings-block)
- **Block body:** any number of [dialog parameters](#dialog-parameters) (in any order)
- **Syntax**: `(parameters) (for) <TARGET> {}`

Several choices for `TARGET`:

- `(global) default(s)`
	- Describes the default behavior for all dialogs in the same MGS Natlang file.
	- Of all MGE dialog parameters, only `alignment` is 100% required, so this is a good parameter to include at the global level.
- `entity $entityName:string`
	- Describes the default dialog settings for **$entityName**.
- `label $labelName:bareword`
	- Defines a dialog identifier shortcut or alias to a specific set of settings.
	- **$labelName** *must* be a bareword.
	- Dialog labels only exist in MGS Natlang (not the MGE itself), and they do not apply to other entity references (such as the target of an action).

#### Example dialog settings target block:

```
parameters for label PLAYER {
	entity "%PLAYER%"
	alignment BR
}
```

This is a common use case for dialog settings, after which dialog messages for the player character can be identified with `PLAYER` instead of `entity "%PLAYER%"`.

#### Dialog parameters

- **Parent block:** [dialog settings target block](#dialog-settings-target-block) or [dialog block](#dialog-block)
- **Syntax:** any of the following:
	- `entity $value:string`
		- **$value**: the "given name" of the entity (i.e. the entity's name on the Tiled map). (Wrapping this name in `%`s is entirely unnecessary and will in fact confuse the MGE encoder.)
			- Can be `%PLAYER%` or `%SELF%`, however.
		- A dialog can inherit a `name` and a `portrait` if given an `entity` parameter. (The entity must be a "character entity" for a portrait to be inherited.)
		- The inherited `name` is a relative reference; the dialog display name will be whatever that entity's name is at that moment.
	- `name $value:string`
		- **$value**: a fixed string (max 12 ASCII chars) that the dialog will always display, regardless of any entity's status. For a relative name instead, wrap a specific entity's name in `%`s.
			- Can be `%PLAYER%` or `%SELF%`.
		- Overrides names inherited via the `entity` parameter.
		- **A dialog name of some sort is required, either via this parameter or the `entity` parameter.**
	- `portrait $value:string`
		- **$value**: the name of a MGE portrait.
		- Overrides portraits inherited via the `entity` parameter.
	- `alignment $value:string`
		- **$value**: one of the following:
			- `TR` (or `TOP_RIGHT`)
			- `BR` (or `BOTTOM_RIGHT`)
			- `TL` (or `TOP_LEFT`)
			- `BL` (or `BOTTOM_LEFT`) (default)
	- `border_tileset $value:string`
		- **$value**: the name of a MGE tileset.
		- The default is used if none is provided.
	- `emote $value:number`
		- **$value**: the id of the "emote" in that entity's entry in `portraits.json`.
		- The default emote (`0`) will display if not specified.
	- `wrap messages (to) $value:number`
		- **$value**: the number of chars to auto wrap the contents of dialog messages.
		- 42 is default.
		- Words wrapped in `$`s (variables) will always count as 5 chars, and words wrapped in `%`s (entity names) will always count as 12 chars.
	- `wrap options (to) $value:number`
		- [options don't wrap so why did I include this? lol]

### Dialog block

For dialog blocks that can be nested inside scripts, see [show dialog block](#show-dialog-block).

- **Parent block:** none
- **Block body:** any number of [dialogs](#dialogs), in the order they are to be seen in-game
- **Syntax:** `dialog $dialogName:string {}`

As these dialog blocks don't have any baked-in context, a **$dialogName** is required.

### Dialog

- **Parent block:** [dialog block](#dialog-block) or [show dialog block](#show-dialog-block)
- **Syntax:** in order:

1. `<DIALOG IDENTIFIER>` exactly 1
2. `<DIALOG PARAMETER>` 0+
3. `<DIALOG MESSAGE>` 1+
4. `<DIALOG OPTION>` 0-4x

#### **Dialog identifier**:

One of the following:

- `$value:bareword`
	- If there is no label by this **$value**, it is assumed to be an entity name. (Entity names with spaces or other special characters are not eligible for being used this way.)
	- NOTE: A quoted string is NOT allowed here!
- `entity $value:string`
	- **$value**: an entity's given name. (This also provides the entity name as an `entity` parameter for the dialog.) Can be wrapped in quotes or left bare.
	- `%PLAYER%` and `%SELF%` must use this pattern because they contain special characters. As this can be cumbersome, it's probably best to set up a dialog label for them so you can use a bareword for an identifier instead.
- `name $value:string`
	- **$value**: the dialog's display name. This also provides a `name` parameter for the dialog. Can be wrapped in quotes or left bare.

#### **Dialog parameter**:

See: [dialog parameters](#dialog-parameters)

#### **Dialog message**:

Any quoted string.

- Each message is a new "text screen" in the game.
- Only ASCII characters will be displayed.
- Insert a relative entity name by wrapping it in `%`s.
	- `%PLAYER%` and `%SELF%` are also allowed.
- Insert the value of a variable by wrapping its name in `$`s.
- Some characters must be escaped in the message body, such as double quote: `\"`
	- `\t` (tabs) are auto-converted to four spaces.
	- `\n` (new lines) are honored, but since text is wrapped automatically, don't worry about explicitly hard wrapping your messages unless you want to force the new lines to specific places.
	- `%` and `$` are printable characters unless used in pairs (within a single line), in which case the only way to print them is to escape them (e.g. `\%`).
- Word processor "smart" characters such as ellipses (…) or emdashes (—) are auto converted to ASCII equivalents (`...`) (`--`).

#### **Dialog option**

Syntax: `> $label:quotedString : (goto) (script) $script:string`

- You may have up to 4 dialog options per dialog.
- As each of these "branches" results in a script `goto`, no dialog messages afterward will be seen. Therefore, dialog options must come last within the dialog.
- The **$label** is what will be shown to the player. As the cursor (approximated with `>`) takes up some room, assume you will only have 39 characters instead of the usual 42.
	- The label behaves like dialog messages in terms of inserting variables (with `$` or `%`), escaped characters, etc.
	- Must be wrapped in quotes.
- In the MGE, dialog options are displayed underneath the final dialog message. Therefore, the last dialog message before any options should consist of a single line of no more than 42 characters.

#### **Example dialog block**

```
dialog exampleDialog {
	Bob
	"So I heard about this club...."

	Bob
	alignment BR
	"Oh, no. Don't you start."

	Bob
	"No, no, I swear! Hear me out!"
	> "Fine. What club?"
		: goto bobContinueScript
	> "(walk away)"
		: goto bobLeaveScript
	> "(smack %Bob% with a rubber chicken)"
		: goto bobNoveltyScript
}
```

### Script block

- **Parent block:** none
- **Block body:** any number of [actions](#actions) in the order they are to be executed in-game
	- some of these may be [show dialog blocks](#show-dialog-block)

See the [action dictionary](#action-dictionary) far below for detailed information on all non-SHOW_DIALOG actions.

### Show dialog block

- **Parent block:** [script block](#script-block)
- **Block body:** any number of [dialogs](#dialog), in the order they are to be seen in-game

(NOTE: because this dialog definition is doubling up as a "show dialog" script action, the word "show" is required for both.)

- `show dialog ($dialogName:string) {}`
	- **$dialogName** is unnecessary, but allowed if desired.
		- Internally, the JSON still requires a dialog name, but the MGS Natlang translator generates one based on the file name and line number if no dialog name is provided. For authors writing content in MGS Natlang exclusively, this will be entirely invisible.
		- Omitting dialog names for one-offs is recommended to keep things clean.
- `show dialog $dialog:string`
	- This syntax allows you to "call" a dialog without having to define it in place.
	- These dialogs may be defined elsewhere in the file (even further down) or in another file entirely. The MGE encoder, which sees all scripts and all dialogs at the same time, will be able to tell you if you're using "show dialog" for a dialog that hasn't been defined anywhere.
	- For these, it's perhaps best to leave a comment reminding you which dialog it is.

### Show serial dialog block

Serial dialog blocks will behave similarly to dialog blocks. (They are not yet fully implemented in MGS Natlang.)

### Comments

MGS Natlang also supports two kinds of comments, which can appear anywhere in the file and inside any block.

#### Inline comment

```
testScript {
	wait 1000ms
	wait 1000ms // inline comment
}
```

This is the only time that line breaks are syntactic in MGS Natlang — inline comments start with a double forward slash and end either with a line break or the end of the document.
	
The JSON to MGS Natlang translator will take extraneous properties from actions and the like and turn them into inline comments automatically.

#### Block comment

```
/*
Block comment:
Everything inside is a comment!
The lexer ignores it all! WHEEE
*/
```

Unfortunately, as the lexer ignores comments, there is no method of translating comments from MGS Natlang into "comments" in JSON.

## MGS Natlang variables

A variable's value is what populates the meat of the JSON output, but its type affects how each word is validated against patterns in the MGS Natlang syntax tree, and in most cases will also affect how the word may be formatted in the natlang.

The format for this documentation is `$` + variable name + `:` + type name.

The variable's name for most purposes doesn't matter much when writing MGS Natlang, except as a hint as to the variable's purpose. (It does matter when trying to analyze the JSON output, however.)

### Variable decay

A special property of variable types is "decay" — this means a variable of a specific type may satisfy a variable's requirement for a different type.

```
// action that wants a duration
testScript1 {
	wait 150ms // "duration" = ok
	wait 150   // "number" is fine, too (decays to "duration")
}

// action that wants a number
testScript2 {
	load slot 1   // "number" = ok
	load slot 1ms // "duration" won't work!
}
```

In most cases, human intuition is enough to predict whether a variable can decay into another type.

Most important to keep in mind is that a variable wanting to be a `string` will be satisfied by either a `bareword` string or a `quotedString` string, but `bareword`s and `quotedString`s cannot be substituted for each other.

### Variable types and examples

Note that all numbers must be whole numbers.

- `duration`
	- `1000ms`, `1s`
	- Seconds are translated into milliseconds automatically.
- `distance`
	- `32px`, `128pix`
- `quantity`
	- `1x`, `10x`
	- The barewords `once`, `twice`, and `thrice` also count as `quantity`.
	- Note that the `x` comes after the number, not before.
- `number`
	- `-1`, `100`
	- These may be negative.
- `color`
	- `#FFF`, `#FFDDEE`
	- Some bare color names will also work, e.g. `black` or `white`.
- `boolean`:
	- `true`, `yes`, `on`, `open`
	- `false`, `no`, `off`, `close`
	- Some actions will prefer specific pairs of booleans when being translated from JSON, but when translating the other way, any of the above words will work.
		- e.g. `set player control open` = `set player control on`
- `operator`
	- An exhaustive list:
		- equal sign: `=`
		- plus: `+`
		- hyphen: `-`
			- If a `-` is directly before a number, the number will become negative. Be sure to put a space between a `-` and a number if you want the `-` to be interpreted as an operator.
		- asterisk: `*`
		- forward slash: `/`
		- percent sign: `%`
		- question mark: `?`
		- curly braces: `{` and `}` (for block boundaries)
	- Actions that call for an operator will also accept the corresponding bare words `SET`, `ADD` etc.
- `bareword`
	- These are limited to alphanumberic characters plus a handful of others:
		- hyphen: `-`
		- underscore: `_`
		- period: `.`
		- dollar sign: `$`
		- pound: `#`
	- Cannot start with hyphen (`-`).
	- `barewords` will count as `quotedStrings` if wrapped in quotes.
- `quotedString`
	- These can be just about anything as long as it's wrapped in a matching pair of double quotes (`"`) or single quotes (`'`).
		- (It's Javascript under the hood. Be kind!)
	- Quotes and certain other characters must be escaped (`\"`) inside a `quotedString`.

### General types, limited values

Some action variables will be of a generic MGS Natlang type (such as `string`) but the action itself will only be satisfied by a value from a limited set of words.

In addition, some values are only valid depending on what other game data has been defined, such as entity names, map names, or script names.

In such cases, invalid values are reported by the MGE encoder, not the MGS Natlang parser.

#### Button IDS

For actions that check the button state.

NOTE: We found that the joystick clicks were aggressive on the hardware, and would trigger at what felt like arbitrary times. While the engine is capable of detecting these clicks, we recommend not using them.

- `MEM0`
- `MEM1`
- `MEM2`
- `MEM3`
- `BIT128`
- `BIT64`
- `BIT32`
- `BIT16`
- `BIT8`
- `BIT4`
- `BIT2`
- `BIT1`
- `XOR`
- `ADD`
- `SUB`
- `PAGE`
- `LJOY_CENTER`
- `LJOY_UP`
- `LJOY_DOWN`
- `LJOY_LEFT`
- `LJOY_RIGHT`
- `RJOY_CENTER`
- `RJOY_UP`
- `RJOY_DOWN`
- `RJOY_LEFT`
- `RJOY_RIGHT`
- `TRIANGLE`
- `X` or `CROSS`
- `O` or `CIRCLE`
- `SQUARE`
- `HAX` (capacitive touch button on the PCB)
- `ANY`

#### Operations

Used with "mutate variable" actions.

- `=` or `SET` — sets a variable to the value given
- `+` or `ADD` — addition
- `-` or `SUB` — subtraction
- `*` or `MUL` — multiplication
- `/` or `DIV` — integer division
- `%` or `MOD` — modulo (remainder)
- `?` or `RNG` — sets a variable to a random value between 0 and the value given (minus one)

#### Entity animations

The int value for entity animations:

- `0` = idle animation
- `1` = walk animation
- `2` = action animation
- `3`+ = any subsequent animations the entity might have

## Action dictionary

These dictionary entires use the default JSON action parameter names, e.g. `entity` for an entity's name.

Some of these patterns may also have some hidden parameters built in to the phrasing, such as "is" and "is not" incorporating the action parameter `expected_bool`. These will be noted when they occur.

As a reminder, words in parentheses are optional. For example, the dictionary pattern:

```
set entity $entity:string tick_script (to) $string:string 
```

will be satisfied by either of the following:

```
set entity "Entity Name" tick_script to scriptName
set entity "Entity Name" tick_script scriptName
```