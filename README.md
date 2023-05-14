# MageGameScript Natlang <!-- This README is automatically generated, NO TOUCHY -->

Introducing "MageGameScript Natlang" — a simplified approach to writing game content for the DC801 Black Mage Game Engine (MGE).

![Syntax color sample, using VSCode's "Dark+" theme](docs-images/syntax-color-sample.png)

## Table of contents

1. [Overview](#overview)
	1. [Syntax Features](#syntax-features)
	2. [Syntax Colors](#syntax-colors)
2. [MGS Natlang vs JSON](#mgs-natlang-vs-json)
	1. [Original script JSON](#original-script-json)
	2. [MGS Natlang (script)](#mgs-natlang-script)
	3. [Original dialog JSON](#original-dialog-json)
	4. [MGS Natlang (dialog)](#mgs-natlang-dialog)
	5. [MGS Natlang (combined)](#mgs-natlang-combined)
3. [Block structure](#block-structure)
	1. [Block quick reference](#block-quick-reference)
	2. [Syntax definitions](#syntax-definitions)
	3. [Dialog settings block](#dialog-settings-block)
	4. [Dialog settings target block](#dialog-settings-target-block)
	5. [Serial dialog settings block](#serial-dialog-settings-block)
	6. [Dialog block](#dialog-block)
	7. [Serial dialog block](#serial-dialog-block)
	8. [Script block](#script-block)
	9. [Combination blocks](#combination-blocks)
		1. [Show dialog block](#show-dialog-block)
		2. [Show serial dialog block](#show-serial-dialog-block)
		3. [Set serial connect message block](#set-serial-connect-message-block)
	10. [Dialog](#dialog)
		1. [Dialog identifier](#dialog-identifier)
		2. [Dialog parameters](#dialog-parameters)
		3. [Dialog message](#dialog-message)
		4. [Dialog option](#dialog-option)
	11. [Serial dialog](#serial-dialog)
		1. [Serial dialog parameters](#serial-dialog-parameters)
		2. [Serial dialog message](#serial-dialog-message)
		3. [Serial dialog option](#serial-dialog-option)
	12. [Comments](#comments)
4. [MGS Natlang variables](#mgs-natlang-variables)
	1. [Variable decay](#variable-decay)
	2. [Variable types and examples](#variable-types-and-examples)
	3. [General types, limited values](#general-types-limited-values)
5. [Macros](#macros)
	1. [Zigzag (`if` / `else`)](#zigzag-if--else)
	2. [`const!`](#const)
6. [Action dictionary](#action-dictionary)
	1. [Actions quick reference](#actions-quick-reference)
	2. [Game management actions](#game-management-actions)
	3. [Hex editor actions](#hex-editor-actions)
	4. [Camera control actions](#camera-control-actions)
	5. [Script control actions](#script-control-actions)
	6. [Entity choreography actions](#entity-choreography-actions)
	7. [Entity appearance actions](#entity-appearance-actions)
	8. [Set entity properties actions](#set-entity-properties-actions)
	9. [Set variables actions](#set-variables-actions)
	10. [Check entity properies actions](#check-entity-properies-actions)
	11. [Check variables actions](#check-variables-actions)

## Overview

MGS Natlang is a "natural" language meant to be easy to read and write.

It consists of phrases that correlate to the shape of JSON required by the MGE encoder. It is not a genuine recursive language, but it is much more flexible and compact than writing the equivalent JSON.

All .mgs files are turned into MGE JSON by the MGE encoder. And unlike script files and dialog files, you don't need to declare .mgs files in the game's `scenario.json`; all .mgs files inside `scenario_source_files` will be imported.

### Syntax Features

1. White space agnostic.
	- The syntax coloring might break if you are very creative with line breaks, but it should still parse correctly.
2. Many strings can be unquoted or quoted freely.
	- Double or single quotes are both fine.
	- Anything with a space or any unusual character *must* be wrapped in quotes.
3. Many words are optional, and can be included either to increase logical clarity or omitted to decrease word density. E.g. the following two patterns are equivalent phrases:
	- `goto script scriptName`
	- `goto scriptName`
4. Certain [MGE variables](#variable-types-and-examples) can be formatted in multiple, human-friendly ways, e.g.
	- Duration: `1000ms` or `1s` or `1000`
	- Quantity: `once` or `1x` or `1`

### Syntax Colors

A syntax coloring grammar (tmLanguage) is in development: https://github.com/alamedyang/magegamescript-syntax-highlighting

#### Visual Studio Code

When you open an .mgs file, VSCode will offer marketplace extensions for it. Alternatively, search for "MageGameScript Colors" in the Visual Studio Code extensions marketplace.

After installing the extension, all .mgs files you open will have syntax coloring.

VSCode will update the extension automatically whenever a new version comes out.

#### Sublime Text

Visit the syntax colors repo above (or clone it locally), then find the `mgs.tmLanguage` file in the `syntaxes` folder. Move this file to wherever Sublime Text wants its coloring grammars in your operating system. After this, you can select MageGameScript under View > Syntax to style the text in your .mgs files.

You will have to update the `mgs.tmLanguage` manually by repeating the above process when a new version is released.

#### Other IDEs

Many other IDEs will accept TextMate grammars, but you will have to find and follow your IDE's specific instructions.

## MGS Natlang vs JSON

### Original script JSON

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
- JSON cannot be commented, so it's inconvenient to leave yourself supplementary information, such as the contents of a dialog you're referencing when scripting a cutscene.
- The parameters for MGE actions are not uniform, so it's easy to forget or confuse parameters if you're not copying and pasting actions from nearby.

### MGS Natlang (script)

```
on_tick-greenhouse {
  if entity "%PLAYER%" is inside geometry door-greenhouse
    then goto leave-greenhouse
  copy script ethernettle-uproot-check
  // some kind of comment
}
```

Apart from the fact that the MGS Natlang won't receive any syntax coloring by default, this is more approachable.

It's more compact, and the nested relationship of the script and its actions is far easier to see at a glance. Human-friendly grammar constructions (e.g. `is inside` vs `is not inside`) makes it much easier to follow script branching logic.

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

### MGS Natlang (dialog)

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

With MGS Natlang, you can create presets for common dialog settings. As a result, the dialogs themselves can be very lightweight, making it effortless to read and write large swaths of them:

```
dialog exampleDialogName {
  Trekkie
  "Me want to wish you a happy birthday, %PLAYER%."

  PLAYER
  "Aww, gee, thanks, Farmer %Trekkie%!"
}
```

And since MGS Natlang is white space agnostic, it can become as compact as you want:

```
dialog exampleDialog2 {
  PLAYER "Neat."
}
```

or even

```
dialog exampleDialog2 { PLAYER "Neat." }
```

### MGS Natlang (combined)

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
    PLAYER
    "Whoa! It looks like I found some kind of back door."
  }
  set flag backdoor-found to true
}
```

Now the dialog's content is no longer separated from its context. The dialog no longer needs a name, either, unless another script needs to refer to it, too.

## Block structure

The contents (body) of each block is enclosed in a pair of matching curly braces:

```
<BLOCK DECLARATION> { <BLOCK BODY> }

// or

<BLOCK DECLARATION> {
  <BLOCK BODY>
}

// etc
```

Some block types can (or must) be nested within others. Note that blocks cannot be nested arbitrarily.

### Block quick reference

Unless otherwise marked, assume all entries in the following lists are allowed in any quantity (including zero). Numbered items must be given in exactly that order, but all other items can occur in any order within their parent block.

#### Global settings

- **[dialog settings block](#dialog-settings-block)**
	- **[dialog settings target block](#dialog-settings-target-block)**
		- **[dialog parameter](#dialog-parameters)**
- **[serial dialog settings block](#serial-dialog-settings-block)**
	- **[serial dialog parameter](#serial-dialog-parameters)**

#### Dialog definitions

- **[dialog block](#dialog-block)**
	- **[dialog](#dialog)**
		1. **[dialog identifier](#dialog-identifier)** (exactly 1)
		2. **[dialog parameter](#dialog-parameters)**
		3. **[dialog message](#dialog-message)** (at least 1)
		4. **[dialog option](#dialog-option)**
- **[serial dialog block](#serial-dialog-block)**
	- **[serial dialog](#serial-dialog)** (exactly 1)
		1. **[serial dialog parameter](#serial-dialog-parameters)**
		2. **[serial dialog message](#serial-dialog-message)** (at least 1)
		3. **[serial dialog option](#serial-dialog-option)**

#### Script definitions

- **[script block](#script-block)**
	- **[action](#actions)**
	- **[combination blocks](#combination-blocks)**

### Syntax definitions

In all syntax definitions in this document, words in parentheses are optional, and words starting with dollar signs are [MGS Natlang variables](#mgs-natlang-variables).

### Dialog settings block

```
settings (for) dialog {}
```

These are a means of defining dialog parameters ahead of time so the dialogs themselves can be very lean.

These blocks must occur on the root level.

**Block contents**: any number of [dialog settings target blocks](#dialog-settings-target-block) in any order.

#### Behavior

Dialog settings are applied to dialogs in order as the parser encounters them; a dialog settings block partway down the file will affect only the dialogs afterward, and none before.

- New settings will override old settings.
	- E.g. if you assign the player the alignment `TOP_RIGHT` and then `BOTTOM_RIGHT` back-to-back, dialogs will use `BOTTOM_RIGHT`.
- Entity settings will override global settings.
	- E.g. if you assign alignment `BOTTOM_LEFT` to the global defaults, and `BOTTOM_RIGHT` to the player entity, dialogs involving the player entity will use `BOTTOM_RIGHT`.
- Label settings will override entity settings.
- Parameters given in a dialog's body will override any other settings, however.

### Dialog settings target block

```
(parameters) (for) <TARGET> {}
```

Several choices for `TARGET`:

- `(global) default(s)`
	- Describes the default behavior for all dialogs in the same MGS Natlang file.
- `entity $string`
	- Describes the default dialog settings for a specific entity.
- `label $bareword`
	- Defines a dialog identifier shortcut or alias to a specific set of settings.
	- The label name *must* be a [bareword](#bareword), not a [quoted string](#quoted-string).
	- Dialog labels only exist in MGS Natlang (not the MGE itself), so they do not apply to other entity references (such as the target of an action).

These blocks occur within [dialog settings blocks](#dialog-settings-block).

**Block contents**: any number of [dialog parameters](#dialog-parameters) in any order.

#### Example

```
parameters for label PLAYER {
  entity "%PLAYER%"
  alignment BR
}
```

This is a common use case for dialog settings, after which you can use `PLAYER` instead of `entity "%PLAYER%"` as a [dialog identifier](#dialog-identifier) for [dialogs](#dialog).

```
dialog test {
  PLAYER "Test dialog message" // with label
}

// vs

dialog test {
  entity "%PLAYER%" "Test dialog message" // without label
}
```

### Serial dialog settings block

```
settings (for) serial dialog {}
```

Use these blocks to set global settings for [serial dialogs](#serial-dialog).

These blocks must occur on the root level.

**Block contents**: any number of [serial dialog parameters](#serial-dialog-parameter) in any order.

#### Behavior

Serial dialog settings are applied to serial dialogs in order as the parser encounters them; a serial dialog settings block partway down the file will affect only the serial dialogs afterward, and none before.

Parameters given in a serial dialog's body will override any other settings, however.

### Dialog block

```
dialog $string {}
```

Dialog blocks allow you to name and populate a game dialog.

As these dialog blocks aren't being defined inside a script body, a dialog name is required. (The name is whatever is given for [string](#string).)

These blocks must occur on the root level.

**Block contents**: any number of [dialogs](#dialogs) in the order they are to be seen in-game.

### Serial dialog block

```
serial dialog $string {}
```

Similar to dialog blocks, serial dialog blocks allow you to name and populate a serial dialog. Serial dialogs are shown in the serial console instead of the badge's physical screen.

Again, these blocks aren't being defined inside a script body, so a serial dialog name is required. (The name is whatever is given for [string](#string).)

These blocks must occur on the root level.

**Block contents**: a single [serial dialog](#serial-dialog).

### Script block

```
(script) $string {}
```

If the word `script` is absent, any [string](#string) (other than `dialog`, `settings` etc.) will be interpreted as the script name.

These blocks must occur on the root level.

**Block contents**: any number of [actions](#actions) or [combination blocks](#combination-blocks) in the order they are to be executed in-game. (See the [action dictionary](#action-dictionary) far below for detailed information on each action.)

### Combination blocks

Inside a [script block](#script-block), some actions can be **combined** with their associated definition block. In other words, you can "call" a [dialog](#dialog) or [serial dialog](#serial-dialog) and define it in place.

For combination blocks of all types, a dialog name ([string](#string)) is optional. Internally, the JSON still requires a dialog name, but if absent, the MGS Natlang translator generates one based on the file name and line number. For authors writing content in MGS Natlang exclusively, this will be invisible. Omitting dialog names is recommended to keep things clean.

#### Show dialog block

```
show dialog ($string) {}
```

Combination of a [dialog block](#dialog-block) and the [`SHOW_DIALOG`](#show_dialog) action.

#### Show serial dialog block

```
show serial dialog ($string) {}
```

Combination of a [serial dialog block](#serial-dialog-block) and the [`SHOW_SERIAL_DIALOG`](#show_serial_dialog) action.

#### Set serial connect message block

```
set serial connect (message) (to) ($string) {}
```

Combination of a [serial dialog block](#serial-dialog-block) and the [`SET_CONNECT_SERIAL_DIALOG`](#set_connect_serial_dialog) action.

### Dialog

Found within [dialog blocks](#dialog-block).

Any number of dialogs can be given back-to-back within their parent block.

#### Dialog contents

1. [Dialog identifier](#dialog-identifier): exactly 1
2. [Dialog parameter](#dialog-parameter): 0+
3. [Dialog message](#dialog-message): 1+
4. [Dialog option](#dialog-option): 0-4x

Multiple dialogs can occur back-to-back inside a single dialog block.

#### Dialog identifier

This identifies the "speaker" of the dialog messages that immediately follow. For most cases, this will be a specific entity (with option #1 or #2), though you could also build up a dialog from its component pieces instead (with option #3).

The three options:

1. `$bareword`
	- The bareword identifier refers to a dialog label within a [dialog settings target block](#dialog-settings-target-block).
		- If no dialog label is found, the bareword value is assumed to be an entity name instead. This usage also provides the entity name as an `entity` [parameter](#dialog-parameter) for the dialog.
		- Entity names with spaces or other special characters are not eligible for this usage.
	- NOTE: A [quoted string](#quoted-string) is NOT allowed here! This string *must* be a [bareword](#bareword)!
2. `entity $string`
	- [string](#string): an entity's given name (i.e. the entity's name within the Tiled map).
	- This usage also provides the entity name as an `entity` [parameter](#dialog-parameter) for the dialog.
	- `%PLAYER%` and `%SELF%` must use this pattern (and not the [bareword](#bareword) pattern) because they contain special characters. As this can be cumbersome, it's probably best to set up a dialog settings label for them so you can use a bareword as an identifier instead.
3. `name $string`
	- [string](#string): the dialog's display name.
	- This usage also provides a `name` [parameter](#dialog-parameter) for the dialog.
	- If you don't want a name displayed, use an empty quoted string (`name ""`).

#### Dialog parameter

Multiple dialog parameters can occur back-to-back.

Syntax for each parameter:

- `entity $string`
	- [String](#string): the "given name" of the entity (i.e. the entity's name on the Tiled map). (Wrapping this name in `%`s is unnecessary and will in fact confuse the MGE encoder.)
		- Can be `%PLAYER%` or `%SELF%`, however.
	- A dialog can inherit a `name` and a `portrait` if given an `entity` parameter. (The entity must be a "character entity" for a portrait to be inherited.)
	- The inherited `name` is a relative reference; the dialog display name will be whatever that entity's name is at that moment.
- `name $string`
	- [String](#string): a fixed string of no more than 12 ASCII characters. For a relative name instead, wrap a specific entity's name in `%`s.
		- Can be `%PLAYER%` or `%SELF%`.
	- Overrides names inherited via the `entity` parameter.
	- If this string is empty (`name ""`), the dialog label will be absent entirely.
- `portrait $string`
	- [String](#string): the name of a MGE portrait.
	- Overrides portraits inherited via the `entity` parameter.
- `alignment $string`
	- [String](#string): one of the following:
		- `TR` (or `TOP_RIGHT`)
		- `BR` (or `BOTTOM_RIGHT`)
		- `TL` (or `TOP_LEFT`)
		- `BL` (or `BOTTOM_LEFT`) (default)
- `border_tileset $string`
	- [String](#string): the name of a MGE tileset.
	- The default tileset is used if none is provided.
- `emote $number`
	- [Number](#number): the id of the "emote" in that entity's entry in `portraits.json`.
	- The default emote (`0`) will display if not specified.
- `wrap messages (to) $number`
	- [Number](#number): the number of chars to auto wrap the contents of dialog messages.
	- 42 is default.

#### Dialog message

Any [quoted string](#quoted-string).

- Each message is a new "text screen" in the game.
- Only ASCII characters will be printed.
- Insert an entity's current name (aka "relative name") by wrapping their given name in `%`s.
	- `%PLAYER%` and `%SELF%` are also allowed, which target the player entity or the entity that is running the script, respectively.
	- Words wrapped in `%`s will count as 12 chars when the dialog message is auto-wrapped.
- Insert the current value of a MGE variable by wrapping its name in `$`s.
	- Words wrapped in `$`s will count as 5 chars when the dialog message is auto-wrapped.
- Some characters must be escaped in the message body, such as double quote: `\"`
	- `\t` (tabs) are auto-converted to four spaces.
	- `\n` (new lines) are honored, but since text is wrapped automatically, don't worry about hard wrapping your messages unless you want to put line breaks in arbitrary places.
	- `%` and `$` are printable characters unless used in pairs within a single line, in which case the only way to print them is to escape them (e.g. `\%`).
- Word processor "smart" characters such as ellipses (…), emdashes (—), and smart quotes (“”) are auto converted to ASCII equivalents (`...`) (`--`) (`"`).

#### Dialog option

```
> $label:quotedString : (goto) (script) $script:string
```

- You may have up to 4 dialog options per dialog.
- As each of these "branches" results in a script `goto`, no dialog messages afterward will be seen. Therefore, any dialog options must come last within the dialog.
- The **label** is what will be shown to the player. As the cursor (approximated with `>`) takes up some room, assume you will only have 39 characters instead of the usual 42.
	- The label behaves like dialog messages in terms of inserting variables (with `$` or `%`), escaped characters, etc.
	- **Must** be wrapped in [quotes](#quoted-string).
- In the MGE, dialog options are displayed underneath the final dialog message. Therefore, the last dialog message before any options should consist of a single line of no more than 42 characters.
- The words `goto` and `script` are optional. Any [string](#string) given after the `:` (other than `goto` and `script`) is assumed to be the script name.

#### Example dialogs

Bringing this all together in an example [dialog block](#dialog-block):

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

Note: white space doesn't matter, so the first option above could very well have been written this way:

```
> "Fine. What club?" : goto bobContinueScript
```

### Serial dialog

Serial dialogs contain text meant to be shown via the serial console. They are called serial "dialogs" because they are similar to [dialogs](#dialog) in many respects, but they are made up of plaintext alone, and needn't be used for dialog specifically.

Found within a [serial dialog block](#serial-dialog-block).

#### Serial dialog contents

1. [Serial dialog parameter](#serial-dialog-parameter): 0+
2. [Serial dialog message](#serial-dialog-message): 1+
3. [Serial dialog option](#serial-dialog-option): 0+

NOTE: unlike with conventional [dialogs](#dialog), serial dialog blocks cannot contain more than one serial dialog. In other words, inside a serial dialog block, no serial parameters can be given after a serial message, and nothing can come after a serial option (except more options).

#### Serial dialog parameter

- `wrap (messages) (to) $number`.
	- [Number](#number): the number of chars to auto wrap the contents of serial dialog messages.
	- 80 is default.

#### Serial dialog message

Any [quoted string](#quoted-string).

- Each message is printed on its own line.
- To maximize compatibility, best to limit these to ASCII characters.
- Some characters must be escaped in the message body, such as double quote: `\"`
	- `\t` (tabs) are auto-converted to four spaces.
	- `\n` (new lines) are honored, but since text is wrapped automatically, don't worry about hard wrapping your messages unless you want to put line breaks in arbitrary places.
- Word processor "smart" characters such as ellipses (…), emdashes (—), and smart quotes (“”) are auto converted to ASCII equivalents (`...`) (`--`) (`"`).
- These messages may be given ANSI [styles](#serial-styles). (Use the built-in styling syntax for best results.)

#### Serial dialog option

Two choices:

1. Numbered option (multiple choice):
	- `# $label:quotedString : (goto) (script) $script:string`
	- Each **label** will appear as part of a numbered list in the serial console.
	- These labels (and only these) may be [styled](#serial-styles).
	- The player cannot proceed until they enter a valid number, at which point the game will jump to the corresponding script. That means this type of option will *always* result in a script jump.
2. Free response:
	- `_ $label:quotedString : (goto) (script) $script:string`
	- The **label** indicates what the player must type for the game to jump to the indicated script.
	- There is no explicit prompt for these options, but upon reaching the free response portion of the serial dialog block, the player can type whatever they want into the serial console.
	- An invalid response will fall through, i.e. the script will continue executing actions further below the serial dialog containing the free response option option(s). Therefore, only a valid response will result in a script jump.
	- The user's response is case insensitive. (The label `"CAT"` will match the user input of `cat`.)

Behaviors in common between the two:

- A single serial dialog can only use *one* of these two types.
	- The parser will interpret all options within the block using the type of the first option.
- Unlike [regular dialog options](#dialog-option), the option count for serial dialogs is not limited.
- The **label** *must* be wrapped in [quotes](#quoted-string).
- The words `goto` and `script` are optional. Any [string](#string) given after the `:` (other than `goto` and `script`) is assumed to be the script name.

#### Serial styles

A unique feature of serial dialog messages and serial numbered options is styling. Styles, implemented with ANSI escape codes, are turned on and off with tags enclosed in `<` and `>`:

- Foreground colors (letter colors)
	- Black: `<k>` or `<black>`
	- Red: `<r>` or `<red>`
	- Green: `<g>` or `<green>`
	- Yellow: `<y>` or `<yellow>`
	- Blue: `<b>` or `<blue>`
	- Magenta: `<m>` or `<magenta>`
	- Cyan: `<c>` or `<cyan>`
	- White: `<w>` or `<white>`
- Background colors
	- Black: `<bg-k>` or `<bg-black>`
	- Red: `<bg-r>` or `<bg-red>`
	- Green: `<bg-g>` or `<bg-green>`
	- Yellow: `<bg-y>` or `<bg-yellow>`
	- Blue: `<bg-b>` or `<bg-blue>`
	- Magenta: `<bg-m>` or `<bg-magenta>`
	- Cyan: `<bg-c>` or `<bg-cyan>`
	- White: `<bg-w>` or `<bg-white>`
- Emphasis
	- Bold: `<bold>` (brighter colors and/or greater font weight)
	- Dim: `<dim>`
- Reset all styles: `</>` or `<reset>`
	- Styles can only be turned off all at once, unfortunately.
	- Styles will stay "on" until you explicitly turn them "off".

Example:

```
serial dialog grandpaRambling {
	"That doll is <r>evil</>, I tells ya! <r><bold>EVIL</>!!"
}
```

(NOTE: Github won't display the colors in the examples below. Sorry....)

> That doll is <span style="color:#b00;">evil</span>, I tells ya! <span style="color:#f33;font-weight:bold;">EVIL</span>!!

You can also add styles one at a time, and they will accumulate:

```
serial dialog accumulation {
	"plain text <r>red text <bold>add bold <bg-b>add blue background</> clear all"
}
```

> plain text <span style="color:#b00;">add red </span><span style="color:#f33;font-weight:bold;">add bold </span><span style="color:#f33;font-weight:bold;background-color:#00b">add blue background</span> clear all

The user's color theme affects how styles appear in their serial console, and not all styles are implemented in all themes (or consoles). We therefore recommend using styles for optional flavor only, and not to impart gameplay-critical information.

NOTE: The web build of the game currently styles serial output one line at a time, and so styling may be dropped after a line break. As a workaround, manually insert your style tags again before the word that was wrapped.

#### Example serial dialog

```
serial dialog sample {
	"Hey, can anyone hear me? Hello?"
	# "Yes, I can hear you." : goto script sampleYes
	# "What did you say?" : goto script sampleNo
}
```

becomes:

```
Hey, can anyone hear me? Hello?
	0: Yes, I can hear you.
	1: What did you say?

>_
```

In the above case, the player is locked out of further action until they give the answer `0` or `1`. Failure results in a repeat of the whole serial dialog.

### Comments

MGS Natlang supports two kinds of comments. Both can appear anywhere in an .mgs file or inside any block.

#### Inline comment

```
testScript {
  wait 1000ms
  wait 1000ms // inline comment
}
```

This is the only time that line breaks are syntactic in MGS Natlang — inline comments start with `//` and end either with a line break or the end of the document.

Fun fact: the MGS Natlang translator (JSON -> Natlang) will take extraneous properties from actions and the like and turn them into inline comments automatically.

#### Block comment

```
/*
Block comment:
Everything inside is a comment!
The lexer ignores it all! WHEEE
*/
```

Anything between a `/*` and a `*/` is part of the block comment, allowing you to put line breaks and/or extensive text inside a comment.

## MGS Natlang variables

In this document's example syntax, variables are marked with `$`. Whatever is put in place of the variable in the example syntax is the variable's **value**.

For the example syntax `entity $string`:

```
entity Alice       // var value = "Alice"
entity Bob         // var value = "Bob"
entity Charlie     // var value = "Charlie"
entity "Tom Honks" // var value = "Tom Honks"
```

A variable's **value** is what populates the meat of the JSON output, but its **type** affects how each word is validated against patterns in the MGS Natlang syntax tree, and in most cases will also affect how the word may be formatted in the natlang.

This documentation uses two formats to indicate a variable, each with a `$` at the front:

- `$type`
	- e.g. `$string` (which means any valid [string](#string))
- `$label:type`
	- e.g. `$scriptName:string` (which means any valid [string](#string), and also it will be used as a script name)

The variable's label for most purposes doesn't matter much except as a hint as to the variable's purpose, especially if there are multiple variables in the natlang phrase. (It does matter when trying to analyze the JSON output, however.)

### Variable decay

A special property of variable types is "decay" — this means a variable of a specific type may satisfy a variable's requirement for a different type.

Example #1: an action that wants a duration (syntax `wait $duration`)

```
testScript1 {
  wait 150ms // "duration" = ok
  wait 150   // "number" is fine, too
             //   (decays to "duration")
}
```

Example #2: an action that wants a number (syntax: `load slot $number`)

```
testScript2 {
  load slot 1    // "number" = ok
  load slot 1ms  // "duration" won't work!
}
```

In most cases, human intuition is enough to predict whether a variable can decay into another type. (And most things can decay into a [bareword](#bareword), e.g. `true` and `1000ms`.)

Most important to keep in mind is that a variable wanting to be a [string](#string) will be satisfied by either a [bareword](#bareword) string or a [quoted string](#quoted-string), but barewords and quoted strings cannot be substituted for each other.

### Variable types and examples

Note that all numbers must be whole numbers and, unless indicated otherwise, must be positive.

#### Duration

Number + `ms` or `s`

- e.g. `1000ms` or `1s`
- Seconds are translated into milliseconds automatically.

#### Distance

Number + `px` or `pix`

- e.g. `32px` or `128pix`

#### Quantity

Number + `x`

- e.g. `1x` or `10x`
- The [bareword](#bareword) `once`, `twice`, and `thrice` also count as `quantity`.
- Note that the `x` comes after the number, not before.

#### Number

Number (positive or negative)

- e.g. `-1` or `100`
- While negative numbers will all validate to the `number` type, not all actions permit negative numbers.

#### Color

A CSS-style hex color.

- e.g. `#FFF` or `#00EF39`
- Some bare color names will also work, e.g. `black` or `white`.

#### Boolean

A binary option.

- True: `true`, `yes`, `on`, `open`
- False: `false`, `no`, `off`, `close`

Some actions will prefer specific pairs of booleans when being translated from JSON, but when translating the other way, any of the above words will work. E.g.

- `set player control open`
- `set player control on`
- `set player control true`

#### Operator

An exhaustive list:

- equal sign: `=`
- plus: `+`
- hyphen: `-`
	- If a `-` is directly before a number, the number will become negative. Be sure to put a space between a `-` and a number if you want the `-` to be interpreted as an operator.
- asterisk: `*`
- forward slash: `/`
- percent sign: `%`
- question mark: `?`
- curly braces: `{` and `}` (for block boundaries)
- parentheses: `(` and `)` (for macros)

Actions that call for an operator will also accept the corresponding bare words `SET`, `ADD` etc.

#### Bareword

These are limited to alphanumberic characters, plus a handful of punctuation:

- hyphen: `-`
- underscore: `_`
- period: `.`
- dollar sign: `$`
- pound: `#`
- exclamation point: `!`

Usage:

- Barewords cannot start with hyphen (`-`).
- If a bareword starts with a dollar sign (`$`), it will be interpreted as a constant by the `const!` macro.
- Barewords will count as quoted strings if wrapped in quotes, even if the bareword criteria is otherwise met.

#### Quoted string

These can be just about anything as long as it's wrapped in a matching pair of double quotes (`"`) or single quotes (`'`). (It's Javascript under the hood. Be kind!)

Quotes and certain other characters must be escaped (`\"`) inside a quoted string.

#### String

Any quoted string or [bareword](#bareword).

### General types, limited values

Some action variables will be of a generic MGS Natlang type (such as [string](#string)) but the action itself will only be satisfied by a value from a limited set of words.

In addition, some values are only valid depending on what other game data has been defined, such as entity names, map names, or script names.

In such cases, invalid values are reported by the MGE encoder.

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
- `?` or `RNG` — sets a variable to a random value between 0 and the value given minus one

#### Entity animations

The int value for entity animations:

- `0` = idle animation
- `1` = walk animation
- `2` = action animation
- `3`+ = any subsequent animations the entity might have

## Macros

Macros are run after the lexer breaks the original file into tokens but before the tokens are parsed and converted into JSON.

Macros are syntax-agnostic, find-and-replace type processes, but they nonetheless offer a great deal of utility.

### Zigzag (`if` / `else`)

The pattern `if`...`then goto` is used for quite a lot of script actions, but this is verbose and clumsy because every single optional or branching script behavior has to be contained in an *entirely separate script*, as does any shared behavior that follows.

For a simple case, wherein we check a condition to determine whether to do some brief, optional behavior, we need three scripts:

```
load_map-castle-1 {
  if flag saw-castle is false then goto script load_map-castle-1a
  goto script load_map-castle-2
}

load_map-castle-1a {
  show dialog {
    PLAYER "Whoa! Look at the size of it!"
  }
  set flag saw-castle to true
  goto script load_map-castle-2
}

load_map-castle-2 {
  show dialog {
    Guard "State your name!"
  }
}
```

This gets tiresome when a map's `on_load` script may need a dozen or more of these optional behaviors back-to-back, or when an entity's `on_interact` script branches three or more layers deep.

Instead, we can use an abstracted `if` / `else` syntax, which this macro will expand into isolated scripts automatically.

Thanks to the zigzag macro, the above scripts could look like this instead:

```
load_map-castle {
  if (flag saw-castle is false) {
    show dialog {
        PLAYER "Whoa! Look at the size of it!"
      }
    set flag saw-castle to true
  }
  show dialog {
    Guard "State your name!"
  }
}
```

The zigzag macro will take this much-shorter script and expand it to resemble the three scripts in the first example, giving each expanded script a name derived from the original.

*Any* action with `if`...`then goto` syntax can use this zigzag syntax instead.

Note that the actions `RUN_SCRIPT` (`goto script $string`) and `LOAD_MAP` (`load map $string`) will cause the current script slot to jump to a different script. In such cases, any in-progress zigzags will be aborted.

#### Consequences and drawbacks

This macro does not understand MGS Natlang syntax at all, and moves tokens around into an expanded form somewhat naively. What's more is that this macro does not create procedural scripts intelligently; it will make empty scripts in certain conditions, e.g. when there's no converging behavior after a zigzag.

Importantly, this abstracted syntax obscures the fact that script jumps are happening, so scripts using zigzags might need special handling:

- Any piece of script behavior that needs to be referenced by an external script cannot be made into a zigzag, as the external script needs a script name to reference, and zigzagging script names (after the first) are procedurally generated.
- If you `COPY_SCRIPT` a script containing any zigzag syntax, only actions from the first script chunk will be copied.
- For `on_interact` scripts that must always start from the top on each attempt and for `on_tick` scripts that must loop indefinitely, you will need to **reset** the script as the very last action if there is **any** zigzagging involved.
	- IMPORTANT: Do not do this with a `goto` (`RUN_SCRIPT`) or it will result in an infinite loop. Instead, manually set the `on_interact` or `on_tick` to the name of original script. This allows the script to finish its "turn" and hand control to other game logic, while still allowing it to start from the correct script when its turn comes again.

Script reset example:

```
example {
  if (flag bob-met is true) {
    show dialog { SELF "I remember you." }
  } else {
    show dialog { SELF "Nice to meet you!" }
    set flag bob-met to true
  }

  show dialog { SELF "How's it going?" }

  // reset here:
  set entity Bob interact_script to example
}
```

If you don't reset in this manner, upon interacting with Bob a second time, he will only say "How's it going?" until the map is reloaded.

#### Syntax

Zigzags always consist of an `if` statement, at bare minimum:

- `if ( <CONDITION> ) { <BEHAVIOR> }`

```
scriptName {
  behavior-1
  if ( condition-A ) {
    behavior-A
  }
  behavior-2
}
```

- The `if` **condition** is wrapped with parentheses, and the `if` **body** is wrapped with curly braces.
- The `if` body may contain additional zigzags.
- Normal actions can occur before and after the `if`.
- Actions that occur after the zigzag will happen regardless of whether the `if` condition is met.

`if` statements can be followed by `else if` and `else` in the standard manner, wherein the script logic will take one of many mutually-exclusive paths.

- `else if ( <CONDITION> ) { <BEHAVIOR> }`
- `else { <BEHAVIOR> }`

```
scriptName {
  behavior-1
  if ( condition-A ) {
    behavior-A
  } else if ( condition-B ) {
    behavior-B
  } else if ( condition-C ) {
    behavior-C
  } else {
    behavior-all-other-conditions
  }
  behavior-2
}
```

- If an `if` or `else if` condition is met, no other conditions from that zigzag chain is checked.
- `else` results in behavior that happens if none of the above `if` or `else if` conditions are met.
- Any number of `else if`s is allowed, but only one `else` is allowed.
- Shared behavior will resume after an `else` statement or after the last `else if` statement.

Remember: An `if` and `else if` is *not* equivalent to two `if`s!

#### Compound conditions

Multiple conditions can be checked at the same time with `||` (boolean OR), which indicates that *any* of the given conditions can be true for the branching behavior to occur:

```
scriptName {
  if ( condition-A || condition-B ) {
    behavior-AB
  }
}
```

The equivalent boolean AND (`&&`) is not implemented, however. If you need an AND, you will need to invert the conditions and use OR:

```
// NOT ALLOWED:

if ( you have money && the game is for sale ) {
  buy the game
} else {
  don't buy the game
}

// INSTEAD:

if ( you don't have money || the game is not for sale ) {
  don't buy the game
} else {
  buy the game
}
```

### `const!`

This macro emulates compile-time constants. Its main purpose is to help you avoid "magic numbers" in your scripts by allowing you to define a [number](#number) or [string](#string) (or whatever) in a single place, even if you need to use it multiple times.

The macro literally replaces each const with the token collected during its original value assignment.

These consts are *not* meant to be used as variables for in-game logic, as the game will never see the const as a variable at all, but will only see the token captured by the macro. To emphasize this point, you cannot change the value of a const once you've defined it. If you find yourself wanting to do this, you probably want to be using a MGE variable instead.

To start declaring constants:

```
const! ()
```

Inside the above parentheses can be any number of constant assignments:

```
<CONST_NAME> = <VALUE>
```

- `CONST_NAME`: `$` + [bareword](#bareword) (e.g. `$varName`)
- `VALUE`: any MGS Natlang variable whatsoever, e.g. any [number](#number), [string](#string), [bareword](#bareword), [duration](#duration), etc.

Keep in mind that `$` is used for [MGS Natlang variables](#mgs-natlang-variables) in his document's example syntax (e.g. `wait $duration`), but that is a different usage, as those variables are to be replaced by values of that variable type (e.g. `wait 100ms`), whereas these constants will appear in the final MGS file literally in the form `$_`.

#### Example

```
const! (
  $field = x
  $bigNumber = 9001
  $hamburgers = "Steamed Toast"
)

testScript {
  set entity $hamburgers $field to $bigNumber
}
```

After the macro does its work, the script `testScript` instead will read:

```
testScript {
  set entity "Steamed Toast" x to 9001
}
```

The above is what the MGS Natlang syntax parser will actually parse. Syntax errors (if any) will be caught at that point and not before; the macro literally doesn't care what the underlying syntax is.

#### Limitations

`const!` registers and replaces tokens; it does not find-and-replace arbitrary strings. For this reason, you will not be able to use consts inside a [quoted string](#quoted-string), since a quoted string *in its entirety* counts as a single token.

In addition, this macro only captures single tokens; you cannot use a const to represent multiple tokens, e.g. `const!($parade = 76 trombones)` will result in a syntax error.

## Action dictionary

These dictionary entries use the default JSON action parameter names, e.g. `entity` for an entity's name (syntax: `entity $entity:string`).

Some of these patterns may also have some hidden parameters built in to the phrasing, such as "is" and "is not" incorporating the JSON action parameter `expected_bool`. These will be noted when they occur.

As a reminder, words in parentheses are optional. For example, the dictionary pattern:

```
set entity $entity:string tick_script (to) $string:string 
```

will be satisfied by either of the following:

```
set entity "Entity Name" tick_script to scriptName
set entity "Entity Name" tick_script scriptName
```

### Actions quick reference

Sample syntax (with sample values) for each action, grouped by category. Click an action name to jump to the full dictionary entry.

#### [Game management](#game-management-actions)

- [BLOCKING_DELAY](#blocking_delay)
	- `block 1000ms`
- [NON_BLOCKING_DELAY](#non_blocking_delay)
	- `wait 400ms`
- [SET_PLAYER_CONTROL](#set_player_control)
	- `set player control to on`
- [LOAD_MAP](#load_map)
	- `load map mapName`
- [SLOT_SAVE](#slot_save)
	- `save slot`
- [SLOT_LOAD](#slot_load)
	- `load slot 2`
- [SLOT_ERASE](#slot_erase)
	- `erase slot 2`
- [SHOW_DIALOG](#show_dialog)
	- `show dialog dialogName`

#### [Hex editor](#hex-editor-actions)

- [SET_HEX_EDITOR_DIALOG_MODE](#set_hex_editor_dialog_mode)
	- `set hex dialog mode to on`
- [SET_HEX_EDITOR_CONTROL](#set_hex_editor_control)
	- `set hex control to on`
- [SET_HEX_EDITOR_CONTROL_CLIPBOARD](#set_hex_editor_control_clipboard)
	- `set hex clipboard to on`

#### [Serial console](#serial-console-actions)

- [SET_SERIAL_DIALOG_CONTROL](#set_serial_dialog_control)
	- `set serial control to on`
- [SHOW_SERIAL_DIALOG](#show_serial_dialog)
	- `show serial dialog serialDialogName`
	- `concat serial dialog serialDialogName`
- [SET_CONNECT_SERIAL_DIALOG](#set_connect_serial_dialog)
	- `set serial connect message to serialDialogName`
- [REGISTER_SERIAL_DIALOG_COMMAND](#register_serial_dialog_command)
	- `register command "map" -> scriptName`
	- `register command "map" fail -> scriptName`
	- `register command "map" failure -> scriptName`
- [UNREGISTER_SERIAL_DIALOG_COMMAND](#unregister_serial_dialog_command)
	- `unregister command "map"`
	- `unregister command "map" fail`
	- `unregister command "map" failure`
- [REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT](#register_serial_dialog_command_argument)
	- `register command "map" + arg "castle" -> scriptName`
- [UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT](#unregister_serial_dialog_command_argument)
	- `unregister command "map" + arg "castle"`

#### [Camera control](#camera-control-actions)

- [SET_CAMERA_TO_FOLLOW_ENTITY](#set_camera_to_follow_entity)
	- `make camera follow entity "Entity Name"`
- [TELEPORT_CAMERA_TO_GEOMETRY](#teleport_camera_to_geometry)
	- `teleport camera to geometry "vector object name"`
- [PAN_CAMERA_TO_ENTITY](#pan_camera_to_entity)
	- `pan camera to entity "Entity Name" over 1000ms`
- [PAN_CAMERA_TO_GEOMETRY](#pan_camera_to_geometry)
	- `pan camera to geometry "vector object name" over 1000ms`
- [PAN_CAMERA_ALONG_GEOMETRY](#pan_camera_along_geometry)
	- `pan camera along geometry "vector object name" over 1000ms`
- [LOOP_CAMERA_ALONG_GEOMETRY](#loop_camera_along_geometry)
	- `loop camera along geometry "vector object name" over 1000ms`
- [SET_SCREEN_SHAKE](#set_screen_shake)
	- `shake camera 200ms 32px for 3s`
- [SCREEN_FADE_OUT](#screen_fade_out)
	- `fade out camera to #000 over 1000ms`
- [SCREEN_FADE_IN](#screen_fade_in)
	- `fade in camera from #000 over 1000ms`

#### [Script control](#script-control-actions)

- [RUN_SCRIPT](#run_script)
	- `goto scriptName`
- [COPY_SCRIPT](#copy_script)
	- `copy scriptName`
- [SET_MAP_TICK_SCRIPT](#set_map_tick_script)
	- `set map tick_script to scriptName`
- [SET_ENTITY_INTERACT_SCRIPT](#set_entity_interact_script)
	- `set entity "Entity Name" on_interact to scriptName`
	- `set entity "Entity Name" interact_script to scriptName`
- [SET_ENTITY_TICK_SCRIPT](#set_entity_tick_script)
	- `set entity "Entity Name" on_tick to scriptName`
	- `set entity "Entity Name" tick_script to scriptName`
- [SET_ENTITY_LOOK_SCRIPT](#set_entity_look_script)
	- `set entity "Entity Name" on_look to scriptName`
	- `set entity "Entity Name" look_script to scriptName`

#### [Entity choreography](#entity-choreography-actions)

- [SET_ENTITY_PATH](#set_entity_path)
	- `set entity "Entity Name" path to "vector object name"`
- [TELEPORT_ENTITY_TO_GEOMETRY](#teleport_entity_to_geometry)
	- `teleport entity "Entity Name" to geometry "vector object name"`
- [WALK_ENTITY_TO_GEOMETRY](#walk_entity_to_geometry)
	- `walk entity "Entity Name" to geometry "vector object name" over 1000ms`
- [WALK_ENTITY_ALONG_GEOMETRY](#walk_entity_along_geometry)
	- `walk entity "Entity Name" along geometry "vector object name" over 1000ms`
- [LOOP_ENTITY_ALONG_GEOMETRY](#loop_entity_along_geometry)
	- `loop entity "Entity Name" along geometry "vector object name" over 1000ms`

#### [Entity appearance](#entity-appearance-actions)

- [PLAY_ENTITY_ANIMATION](#play_entity_animation)
	- `play entity "Entity Name" animation 3 twice`
- [SET_ENTITY_CURRENT_ANIMATION](#set_entity_current_animation)
	- `set entity "Entity Name" animation to 0`
- [SET_ENTITY_CURRENT_FRAME](#set_entity_current_frame)
	- `set entity "Entity Name" animation_frame to 0`
- [SET_ENTITY_DIRECTION](#set_entity_direction)
	- `turn entity "Entity Name" north`
- [SET_ENTITY_DIRECTION_RELATIVE](#set_entity_direction_relative)
	- `rotate entity "Entity Name" 3`
- [SET_ENTITY_DIRECTION_TARGET_ENTITY](#set_entity_direction_target_entity)
	- `turn entity "Entity Name" toward entity "Target Entity"`
- [SET_ENTITY_DIRECTION_TARGET_GEOMETRY](#set_entity_direction_target_geometry)
	- `turn entity "Entity Name" toward geometry "vector object name"`
- [SET_ENTITY_MOVEMENT_RELATIVE](#set_entity_movement_relative)
	- `set entity "Entity Name" relative_direction to 3`
- [SET_ENTITY_GLITCHED](#set_entity_glitched)
	- `make entity "Entity Name" glitched`
	- `make entity "Entity Name" unglitched`

#### [Set entity properties](#set-entity-properties-actions)

- [SET_ENTITY_NAME](#set_entity_name)
	- `set entity "Entity Name" name to "some kind of string"`
- [SET_ENTITY_X](#set_entity_x)
	- `set entity "Entity Name" x to 2`
- [SET_ENTITY_Y](#set_entity_y)
	- `set entity "Entity Name" y to 2`
- [SET_ENTITY_TYPE](#set_entity_type)
	- `set entity "Entity Name" type to old_man`
- [SET_ENTITY_PRIMARY_ID](#set_entity_primary_id)
	- `set entity "Entity Name" primary_id to 2`
- [SET_ENTITY_SECONDARY_ID](#set_entity_secondary_id)
	- `set entity "Entity Name" secondary_id to 2`
- [SET_ENTITY_PRIMARY_ID_TYPE](#set_entity_primary_id_type)
	- `set entity "Entity Name" primary_id_type to 0`

#### [Set variables](#set-variables-actions)

- [SET_SAVE_FLAG](#set_save_flag)
	- `set flag saveFlagName to true`
- [SET_WARP_STATE](#set_warp_state)
	- `set warp state to "some kind of string"`
- [MUTATE_VARIABLE](#mutate_variable)
	- `mutate varName + 1`
- [MUTATE_VARIABLES](#mutate_variables)
	- `mutate varName + otherVar`
- [COPY_VARIABLE](#copy_variable)
	- `copy entity "Entity Name" x into variable varName`
	- `copy variable varName from entity "Entity Name" x`
	- `copy variable varName into entity "Entity Name" x`
	- `copy entity "Entity Name" x from variable varName`

#### Conditional gotos

Consists of actions from the [check entity properies](#check-entity-properies-actions) and [check variables](#check-variables-actions) categories. All "conditions" can be inserted in either of the following patterns:

- Plain action: `if` ... `then goto (script) $success_script:string`
- [Zigzag](#zigzag-if--else) macro: `if (` ... `) { }`

(The example syntax below is the condition part of the pattern alone.)

- [CHECK_ENTITY_NAME](#check_entity_name)
	- `entity "Entity Name" name is "some kind of string"`
	- `entity "Entity Name" name is not "some kind of string"`
- [CHECK_ENTITY_X](#check_entity_x)
	- `entity "Entity Name" x is 32`
	- `entity "Entity Name" x is not 32`
- [CHECK_ENTITY_Y](#check_entity_y)
	- `entity "Entity Name" y is 32`
	- `entity "Entity Name" y is not 32`
- [CHECK_ENTITY_INTERACT_SCRIPT](#check_entity_interact_script)
	- `entity "Entity Name" interact_script is scriptName`
	- `entity "Entity Name" interact_script is not scriptName`
	- `entity "Entity Name" on_interact is scriptName`
	- `entity "Entity Name" on_interact is not scriptName`
- [CHECK_ENTITY_TICK_SCRIPT](#check_entity_tick_script)
	- `entity "Entity Name" tick_script is scriptName`
	- `entity "Entity Name" tick_script is not scriptName`
	- `entity "Entity Name" on_tick is scriptName`
	- `entity "Entity Name" on_tick is not scriptName`
- [CHECK_ENTITY_LOOK_SCRIPT](#check_entity_look_script)
	- `entity "Entity Name" look_script is scriptName`
	- `entity "Entity Name" look_script is not scriptName`
	- `entity "Entity Name" on_look is scriptName`
	- `entity "Entity Name" on_look is not scriptName`
- [CHECK_ENTITY_TYPE](#check_entity_type)
	- `entity "Entity Name" type is old_man`
	- `entity "Entity Name" type is not old_man`
- [CHECK_ENTITY_PRIMARY_ID](#check_entity_primary_id)
	- `entity "Entity Name" primary_id is 32`
	- `entity "Entity Name" primary_id is not 32`
- [CHECK_ENTITY_SECONDARY_ID](#check_entity_secondary_id)
	- `entity "Entity Name" secondary_id is 32`
	- `entity "Entity Name" secondary_id is not 32`
- [CHECK_ENTITY_PRIMARY_ID_TYPE](#check_entity_primary_id_type)
	- `entity "Entity Name" primary_id_type is 2`
	- `entity "Entity Name" primary_id_type is not 2`
- [CHECK_ENTITY_CURRENT_ANIMATION](#check_entity_current_animation)
	- `entity "Entity Name" animation is 2`
	- `entity "Entity Name" animation is not 2`
- [CHECK_ENTITY_CURRENT_FRAME](#check_entity_current_frame)
	- `entity "Entity Name" animation_frame is 2`
	- `entity "Entity Name" animation_frame is not 2`
- [CHECK_ENTITY_DIRECTION](#check_entity_direction)
	- `entity "Entity Name" direction is north`
	- `entity "Entity Name" direction is not north`
- [CHECK_ENTITY_GLITCHED](#check_entity_glitched)
	- `entity "Entity Name" is glitched`
	- `entity "Entity Name" is not glitched`
- [CHECK_ENTITY_PATH](#check_entity_path)
	- `entity "Entity Name" path is "vector object name"`
	- `entity "Entity Name" path is not "vector object name"`
- [CHECK_IF_ENTITY_IS_IN_GEOMETRY](#check_if_entity_is_in_geometry)
	- `entity "Entity Name" is inside geometry "vector object name"`
	- `entity "Entity Name" is not inside geometry "vector object name"`
- [CHECK_VARIABLE](#check_variable)
	- `variable varName is 1`
	- `variable varName is < 1`
	- `variable varName is not 1`
	- `variable varName is not < 1`
- [CHECK_VARIABLES](#check_variables)
	- `variable varName is otherVar`
	- `variable varName is < otherVar`
	- `variable varName is not otherVar`
	- `variable varName is not < otherVar`
- [CHECK_SAVE_FLAG](#check_save_flag)
	- `flag saveFlagName is true`
- [CHECK_FOR_BUTTON_PRESS](#check_for_button_press)
	- `button SQUARE`
- [CHECK_FOR_BUTTON_STATE](#check_for_button_state)
	- `button SQUARE is currently pressed`
	- `button SQUARE is not currently pressed`
- [CHECK_WARP_STATE](#check_warp_state)
	- `warp state is "some kind of string"`
	- `warp state is not "some kind of string"`

### Game management actions

Handle the general state of the game, such as loading maps, timing game actions, enabling and disabling player input, and managing save states.

#### BLOCKING_DELAY

This pauses the entire game, including all other scripts and animations, for the given duration.

As this might make the game appear broken, you should probably use a [non-blocking delay](#non_blocking_delay) instead.

```
block $duration:duration
```

Example: `block 1000ms`

#### NON_BLOCKING_DELAY

This pauses the current script while allowing all other aspects of the game to continue unimpeded.

Use this if you want to pad the actions an entity is performing so they don't all occur on the same game tick.

For cinematic cutscenes, you will almost certainly need to disable [player control](#set_player_control) before using this action, otherwise the player will be able to walk away in the middle. (Don't forget to turn it on again when finished!)

```
wait $duration:duration
```

Example: `wait 400ms`

#### SET_PLAYER_CONTROL

When player control is `on`, the player entity can move around as normal. When `off`, the player entity cannot move, hack, or interact with anything.

This is set to `on` (`true`) by default.

```
set player control (to) $bool_value:boolean
```

Example: `set player control to on`

#### LOAD_MAP

Except for the player's name, all entity properties are reset to their original values when a new map is loaded.

If this action is told to load the current map, the current map will be reset. This behavior is equivalent to pressing XOR + MEM3.

For most normal door behavior, you will probably want to [set the warp state](#set_war_state) before using the this action.

```
load map $map:string
```

Example: `load map mapName`

#### SLOT_SAVE

This action saves the game state into the current slot (the last slot loaded).

It is not possible to write save data into an arbitrary slots, nor is it possible to copy data from one save slot into another.

Things that are saved:

- player name (string)
- `MEM` button offsets (the player can change the `MEM` button mapping)
- current map id (NOTE: this is saved, but not currently used upon load)
- the warp state string
- hex editor clipboard contents (up to 32 bytes)
- save flags (booleans)
- script variables (integers)

```
save slot
```

#### SLOT_LOAD

This brings the save data associated with that slot into RAM.

The slot is set to 0 by default.

```
load slot $slot:number
```

Example: `load slot 2`

#### SLOT_ERASE

This action clears all the save data in the given slot.

```
erase slot $slot:number
```

Example: `erase slot 2`

#### SHOW_DIALOG

Plays the named [dialog](#dialog).

A script cannot execute any other actions until the dialog is entirely finished. To give a cutscene sophisticated choreography, you will need to either split the dialog into multiple pieces or prepare additional scripts to manage concurrent behavior.

While a dialog screen is showing, the player can only advance to the next dialog message or choose a multiple choice option within that dialog (if any); the player cannot hack, interact with another entity, move, etc.

This action is also available as a [combination block](#combination-blocks).

```
show dialog $dialog:string
```

Example: `show dialog dialogName`

### Hex editor actions

Enable or disable player control of specific game features, and otherwise manage the hex editor state.

#### SET_HEX_EDITOR_DIALOG_MODE

When on, this reduces the number of rows in the hex editor, which makes room for dialog boxes. (The portrait image can still cover up hex cells, though.)

NOTE: This action has been disabled in the MGE to prevent accidental soft locks.

```
set hex dialog mode (to) $bool_value:boolean
```

Example: `set hex dialog mode to on`

#### SET_HEX_EDITOR_CONTROL

This action enables or disables player access to to the hex editor. This is on by default.

```
set hex control (to) $bool_value:boolean
```

Example: `set hex control to on`

#### SET_HEX_EDITOR_CONTROL_CLIPBOARD

This action enables or disables the clipboard and copy functionality within the hex editor. This is on by default. (? verify)

```
set hex clipboard (to) $bool_value:boolean
```

Example: `set hex clipboard to on`

### Serial console actions

Manage serial features and create serial output.

#### SET_SERIAL_DIALOG_CONTROL

When `off`, the serial terminal will ignore player input.

This is set to `on` (`true`) by default.

```
set serial control (to) $bool_value:boolean
```

Example: `set serial control to on`

#### SHOW_SERIAL_DIALOG

Outputs the named [serial dialog](#serial-dialog) to a connected serial console.

The `concat` variant omits the newline at the end of each message, which can enable complex serial output using only MGE scripting logic. (Turn off [serial control](#set_serial_dialog_control) first, then turn it back on again when finished.)

This action is also available as a [combination block](#combination-blocks).

```
show serial dialog $serial_dialog:string
	// disable_newline: false
```

```
concat serial dialog $serial_dialog:string
	// disable_newline: true
```

Examples:

- `show serial dialog serialDialogName`
- `concat serial dialog serialDialogName`

#### SET_CONNECT_SERIAL_DIALOG

Sets the serial connection message to the named [serial dialog](#serial-dialog). (The connection message is sent whenever a serial console is newly connected to the badge hardware.)

This action is also available as a [combination block](#combination-blocks).

```
set serial connect (message) (to) $serial_dialog:string
```

Example: `set serial connect message to serialDialogName`

#### REGISTER_SERIAL_DIALOG_COMMAND

Once a command is registered, the player can enter the command into the serial console and the corresponding script will run in a unique serial script slot.

- **Plain variant**: registers the command in general and identifies the script to run when the command is typed without any additional arguments. This variant must be used before *any* arguments can be registered (including `fail`/`failure`).
- **Failure variant**: identifies a script for custom "unknown argument" behavior (in the event the player attempts to use an unregistered argument for this command).

Commands must be a single word.

```
register (command) $command:string -> (script) $script:string
	// is_fail: false
```

```
register (command) $command:string fail -> (script) $script:string
	// is_fail: true
```

```
register (command) $command:string failure -> (script) $script:string
	// is_fail: true
```

Examples:

- `register command "map" -> scriptName`
- `register command "map" fail -> scriptName`
- `register command "map" failure -> scriptName`

#### UNREGISTER_SERIAL_DIALOG_COMMAND

- **Plain variant**: unregisters the given command *and* all registered arguments for that command (if any).
- **Failure variant**: only unregisters the `failure` script; other registered arguments (and the plain command itself) will remain intact.

```
unregister (command) $command:string
	// is_fail: false
```

```
unregister (command) $command:string fail
	// is_fail: true
```

```
unregister (command) $command:string failure
	// is_fail: true
```

Examples:

- `unregister command "map"`
- `unregister command "map" fail`
- `unregister command "map" failure`

#### REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT

This action registers an argument (and a script) for an [already-registered serial command](#register_serial_dialog_command).

Arguments must be a single word.

```
register (command) $command:string + (arg) $argument:string -> (script) $script:string
```

Example: `register command "map" + arg "castle" -> scriptName`

#### UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT

This action unregisters the specified argument from an [already-registered serial command](#register_serial_dialog_command).

```
unregister (command) $command:string + (arg) $argument:string
```

Example: `unregister command "map" + arg "castle"`

### Camera control actions

Manipulate the camera's position or perform tricks like shaking the camera or fading the screen in and out to an arbitrary color.

#### SET_CAMERA_TO_FOLLOW_ENTITY

Sets what the camera is following. (`%PLAYER%` is the default.)

```
make camera follow entity $entity:string
```

Example: `make camera follow entity "Entity Name"`

#### TELEPORT_CAMERA_TO_GEOMETRY

Moves the camera to the first vertex of the specified geometry object.

```
teleport camera to geometry $geometry:string
```

Example: `teleport camera to geometry "vector object name"`

#### PAN_CAMERA_TO_ENTITY

Pans the camera to an entity.

NOTE: if the entity is moving while the camera is coming closer, the camera will speed up or slow down to reach the entity at the correct time.

```
pan camera to entity $entity:string over $duration:duration
```

Example: `pan camera to entity "Entity Name" over 1000ms`

#### PAN_CAMERA_TO_GEOMETRY

Pans the camera to the first vertex of a geometry object.

```
pan camera to geometry $geometry:string over $duration:duration
```

Example: `pan camera to geometry "vector object name" over 1000ms`

#### PAN_CAMERA_ALONG_GEOMETRY

(might not work yet — instead, make a null entity and lock the camera to it)

```
pan camera along geometry $geometry:string over $duration:duration
```

Example: `pan camera along geometry "vector object name" over 1000ms`

#### LOOP_CAMERA_ALONG_GEOMETRY

(might not work yet — instead, make a null entity and lock the camera to it)

```
loop camera along geometry $geometry:string over $duration:duration
```

Example: `loop camera along geometry "vector object name" over 1000ms`

#### SET_SCREEN_SHAKE

Shakes the camera a certain distance (`amplitude`) at a certain speed (`frequency`) and for a certain length of time (`duration`).

```
shake camera $frequency:duration $amplitude:distance for $duration:duration
```

Example: `shake camera 200ms 32px for 3s`

#### SCREEN_FADE_OUT

Fades the screen out to the given color.

Fades are slow on the hardware, so use these sparingly.

```
fade out camera to $color:color over $duration:duration
```

Example: `fade out camera to #000 over 1000ms`

#### SCREEN_FADE_IN

Fades the screen in from the given color.

Fades are slow on the hardware, so use these sparingly.

```
fade in camera from $color:color over $duration:duration
```

Example: `fade in camera from #000 over 1000ms`

### Script control actions

Set a specific `on_tick` or `on_interact` script, run another script, or recursively copy the actions inside another script.

#### RUN_SCRIPT

Abandons the current script and jumps to the named script. In other words, actions provided after a `RUN_SCRIPT` action will not execute. (The MGS Natlang keyword `goto` was chosen to emphasize this.)

The new script runs in the same script slot that called this action.

```
goto (script) $script:string
```

Example: `goto scriptName`

#### COPY_SCRIPT

The MGE encoder literally copies all the actions from the copied `script` and inserts them where `COPY_SCRIPT` is being used. This happens recursively.

```
copy (script) $script:string
```

Example: `copy scriptName`

#### SET_MAP_TICK_SCRIPT

Sets the map's `on_tick` script.

```
set map tick_script (to) $script:string
```

Example: `set map tick_script to scriptName`

#### SET_ENTITY_INTERACT_SCRIPT

Sets an entity's `on_interact` script.

If you use this action to change the script slot that is currently running the action, any actions given afterward may not execute depending on what they are.

Because entity properties are reset when a map is loaded, and because entities retain the last script that was run in their `on_interact` slot, you should restore an entity's original interact script at the end of their interact script tree.

```
set entity $entity:string on_interact (to) $script:string
```

```
set entity $entity:string interact_script (to) $script:string
```

Examples:

- `set entity "Entity Name" on_interact to scriptName`
- `set entity "Entity Name" interact_script to scriptName`

#### SET_ENTITY_TICK_SCRIPT

Sets an entity's `on_tick` script.

```
set entity $entity:string on_tick (to) $script:string
```

```
set entity $entity:string tick_script (to) $script:string
```

Examples:

- `set entity "Entity Name" on_tick to scriptName`
- `set entity "Entity Name" tick_script to scriptName`

#### SET_ENTITY_LOOK_SCRIPT

Sets an entity's `on_look` script.

```
set entity $entity:string on_look (to) $script:string
```

```
set entity $entity:string look_script (to) $script:string
```

Examples:

- `set entity "Entity Name" on_look to scriptName`
- `set entity "Entity Name" look_script to scriptName`

### Entity choreography actions

Move entities around the map using vector objects placed with Tiled.

NOTE: These actions can behave erratically if any of the vertices in the geometry object are subject to coordinate underflow.

#### SET_ENTITY_PATH

This assigns a vector object to an entity. Afterward, the entity can use `%ENTITY_PATH%` to refer to that path. (This assignment can also be done within Tiled.)

```
set entity $entity:string path (to) $geometry:string
```

Example: `set entity "Entity Name" path to "vector object name"`

#### TELEPORT_ENTITY_TO_GEOMETRY

Moves the entity instantly to the first vertex of the specified geometry object (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`).

```
teleport entity $entity:string to geometry $geometry:string
```

Example: `teleport entity "Entity Name" to geometry "vector object name"`

#### WALK_ENTITY_TO_GEOMETRY

Moves the entity in a straight line from its current position to the first vertex of the geometry object named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.

```
walk entity $entity:string to geometry $geometry:string over $duration:duration
```

Example: `walk entity "Entity Name" to geometry "vector object name" over 1000ms`

#### WALK_ENTITY_ALONG_GEOMETRY

Moves the entity along the geometry object named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.

NOTE: Unless you want the entity to teleport to the geometry's origin point, you should probably use [WALK_ENTITY_TO_GEOMETRY](#walk_entity_to_geometry) first.

```
walk entity $entity:string along geometry $geometry:string over $duration:duration
```

Example: `walk entity "Entity Name" along geometry "vector object name" over 1000ms`

#### LOOP_ENTITY_ALONG_GEOMETRY

Moves the entity along the geometry object named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.

This action will loop forever, and cannot terminate on its own; no other action given below this one inside a script will execute after this action begins.

NOTE: Unless you want the entity to teleport to the geometry's origin point, you should probably use [WALK_ENTITY_TO_GEOMETRY](#walk_entity_to_geometry) first.

```
loop entity $entity:string along geometry $geometry:string over $duration:duration
```

Example: `loop entity "Entity Name" along geometry "vector object name" over 1000ms`

### Entity appearance actions

Many of these actions (the ones that don't have an explicit duration) will happen instantly. Therefore if several are used back-to-back, they will all resolve on the same frame. If this is not intended behavior, you should pad them with [non-blocking delay](#non_blocking_delay).

#### PLAY_ENTITY_ANIMATION

The entity will play the given animation the given number of times, and then will return to its default animation.

A script that runs this action will not execute any further actions until the play count has been satisfied.

If an entity is compelled to move around on the map, it will abort this animation playback.

See [entity animations](#entity-animations) for what ids correspond to which animations

```
play entity $entity:string animation $animation:number $play_count:quantity
```

Example: `play entity "Entity Name" animation 3 twice`

#### SET_ENTITY_CURRENT_ANIMATION

The entity will switch to the given animation, which will loop indefinitely.

If an entity is compelled to move around on the map, it will abort this animation playback. When the entity stops moving again, it will revert to its default animation and not the one given by this action.

See [entity animations](#entity-animations) for what ids correspond to which animations

```
set entity $entity:string animation (to) $byte_value:number
```

Example: `set entity "Entity Name" animation to 0`

#### SET_ENTITY_CURRENT_FRAME

Set the frame of the current animation.

This is useful for staggering the animations of entities that have identical animation timings.

```
set entity $entity:string animation_frame (to) $byte_value:number
```

Example: `set entity "Entity Name" animation_frame to 0`

#### SET_ENTITY_DIRECTION

Turns an entity toward the `north`, `south`, `east`, or `west`.

```
turn entity $entity:string $direction:bareword
```

Example: `turn entity "Entity Name" north`

#### SET_ENTITY_DIRECTION_RELATIVE

Turns the entity in 90° increments. Positive numbers are clockwise turns, and negative numbers are counterclockwise turns. (E.g. turn them '2' to flip them around 180°)

This action can be chained with another similar one for complex behaviors. For example, to turn an entity away from the player, you can first set the entity's direction [toward the player](#set_entity_direction_target_entity), then immediately rotate it 2 turns with this action.

```
rotate entity $entity:string $relative_direction:number
```

Example: `rotate entity "Entity Name" 3`

#### SET_ENTITY_DIRECTION_TARGET_ENTITY

Make an entity turn toward another.

```
turn entity $entity:string toward entity $target_entity:string
```

Example: `turn entity "Entity Name" toward entity "Target Entity"`

#### SET_ENTITY_DIRECTION_TARGET_GEOMETRY

Make an entity turn toward a vector geometry on the map.

```
turn entity $entity:string toward geometry $target_geometry:string
```

Example: `turn entity "Entity Name" toward geometry "vector object name"`

#### SET_ENTITY_MOVEMENT_RELATIVE

This adds a rotation to an entity's animations. This is different from turning an entity toward something or someone (see [SET_ENTITY_DIRECTION](#set_entity_direction) and related actions); this action applies a rotation to *all* an entity's animations, including while the entity is in motion. In short, use this action to make an entity walk backwards or strafe (walk sideways).

This number cannot be negative.

```
set entity $entity:string relative_direction (to) $relative_direction:number
```

Example: `set entity "Entity Name" relative_direction to 3`

#### SET_ENTITY_GLITCHED

Set the glitched render flag on an entity.

```
make entity $entity:string glitched
	// bool_value: true
```

```
make entity $entity:string unglitched
	// bool_value: false
```

Examples:

- `make entity "Entity Name" glitched`
- `make entity "Entity Name" unglitched`

### Set entity properties actions

Set a specific property on a specific entity.

#### SET_ENTITY_NAME

Sets an entity's `name`.

```
set entity $entity:string name (to) $string:string
```

Example: `set entity "Entity Name" name to "some kind of string"`

#### SET_ENTITY_X

Sets an entity's `x` coordinate.

In practice, you will likely want to use geometry vectors and teleport actions instead.

```
set entity $entity:string x (to) $u2_value:number
```

Example: `set entity "Entity Name" x to 2`

#### SET_ENTITY_Y

Sets an entity's `y` coordinate.

In practice, you will likely want to use geometry vectors and teleport actions instead.

```
set entity $entity:string y (to) $u2_value:number
```

Example: `set entity "Entity Name" y to 2`

#### SET_ENTITY_TYPE

Sets an entity's `entity_type`.

```
set entity $entity:string type (to) $entity_type:string
```

Example: `set entity "Entity Name" type to old_man`

#### SET_ENTITY_PRIMARY_ID

Sets an entity's `primary_id`.

You will overwhelmingly want to set the `entity_type` by name instead with [SET_ENTITY_TYPE](#set_entity_type).

```
set entity $entity:string primary_id (to) $u2_value:number
```

Example: `set entity "Entity Name" primary_id to 2`

#### SET_ENTITY_SECONDARY_ID

Sets an entity's `secondary_id`.

This action will not be useful unless the entity is a tile entity (`primary_id_type`: 1).

```
set entity $entity:string secondary_id (to) $u2_value:number
```

Example: `set entity "Entity Name" secondary_id to 2`

#### SET_ENTITY_PRIMARY_ID_TYPE

Sets an entity's `primary_id_type`: either (0) tile, (1) animation, or (2) character (sometimes called `entity_type`)

```
set entity $entity:string primary_id_type (to) $byte_value:number
```

Example: `set entity "Entity Name" primary_id_type to 0`

### Set variables actions

Manipulate MGE variables or set them to an arbitrary value.

#### SET_SAVE_FLAG

Set a save flag to `true` or `false`.

```
set flag $save_flag:string (to) $bool_value:boolean
```

Example: `set flag saveFlagName to true`

#### SET_WARP_STATE

Set the warp state string to a specific value.

```
set warp state (to) $string:string
```

Example: `set warp state to "some kind of string"`

#### MUTATE_VARIABLE

Manipulate the value of a specific variable or set it to a new value.

See [operations](#operations).

```
mutate $variable:string $operation:operator $value:number
```

Example: `mutate varName + 1`

#### MUTATE_VARIABLES

Manipulate the value of a specific variable by using the value of another variable.

See [operations](#operations).

```
mutate $variable:string $operation:operator $source:string
```

Example: `mutate varName + otherVar`

#### COPY_VARIABLE

Copies the value of an entity property into a variable or vice versa.

```
copy entity $entity:string $field:bareword into variable $variable:string
	// inbound: true
```

```
copy variable $variable:string from entity $entity:string $field:bareword
	// inbound: true
```

```
copy variable $variable:string into entity $entity:string $field:bareword
	// inbound: false
```

```
copy entity $entity:string $field:bareword from variable $variable:string
	// inbound: false
```

Examples:

- `copy entity "Entity Name" x into variable varName`
- `copy variable varName from entity "Entity Name" x`
- `copy variable varName into entity "Entity Name" x`
- `copy entity "Entity Name" x from variable varName`

### Check entity properties actions

These actions check whether one of an entity's properties matches a specific state. If the condition is met (or not met), then the script will abandon any remaining actions and "goto" to the named script.

You can use `%SELF%` to target the entity running the script and `%PLAYER%` to target the player entity. Otherwise, you must use the entity's given name (its name in Tiled).

#### CHECK_ENTITY_NAME

Checks an entity's current `name`.

```
if entity $entity:string name is $string:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string name is not $string:string
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" name is "some kind of string" then goto successScript`
- `if entity "Entity Name" name is not "some kind of string" then goto successScript`

#### CHECK_ENTITY_X

Checks an entity's `x` coordinate.

```
if entity $entity:string x is $expected_u2:number
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string x is not $expected_u2:number
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" x is 32 then goto successScript`
- `if entity "Entity Name" x is not 32 then goto successScript`

#### CHECK_ENTITY_Y

Checks an entity's `y` coordinate.

```
if entity $entity:string y is $expected_u2:number
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string y is not $expected_u2:number
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" y is 32 then goto successScript`
- `if entity "Entity Name" y is not 32 then goto successScript`

#### CHECK_ENTITY_INTERACT_SCRIPT

Checks an entity's `on_interact` script (by the script's name).

```
if entity $entity:string interact_script is $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string interact_script is not $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: false
```

```
if entity $entity:string on_interact is $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string on_interact is not $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" interact_script is scriptName then goto successScript`
- `if entity "Entity Name" interact_script is not scriptName then goto successScript`
- `if entity "Entity Name" on_interact is scriptName then goto successScript`
- `if entity "Entity Name" on_interact is not scriptName then goto successScript`

#### CHECK_ENTITY_TICK_SCRIPT

Checks an entity's `on_tick` script (by the script's name).

```
if entity $entity:string tick_script is $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string tick_script is not $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: false
```

```
if entity $entity:string on_tick is $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string on_tick is not $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" tick_script is scriptName then goto successScript`
- `if entity "Entity Name" tick_script is not scriptName then goto successScript`
- `if entity "Entity Name" on_tick is scriptName then goto successScript`
- `if entity "Entity Name" on_tick is not scriptName then goto successScript`

#### CHECK_ENTITY_LOOK_SCRIPT

Checks an entity's `on_look` script (by the script's name).

```
if entity $entity:string look_script is $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string look_script is not $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: false
```

```
if entity $entity:string on_look is $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string on_look is not $expected_script:string
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" look_script is scriptName then goto successScript`
- `if entity "Entity Name" look_script is not scriptName then goto successScript`
- `if entity "Entity Name" on_look is scriptName then goto successScript`
- `if entity "Entity Name" on_look is not scriptName then goto successScript`

#### CHECK_ENTITY_TYPE

Checks whether an entity is currently the given `entity_type`.

This action is useful because you can check entity types by name, which is easy and convenient (e.g. check if the entity "Delmar" is the type "old_man"). Otherwise you'd have to use a mix of [CHECK_ENTITY_PRIMARY_ID](#check_entity_primary_id) and [CHECK_ENTITY_PRIMARY_ID_TYPE](#check_entity_primary_it_type) and also know in advance which ints you're checking for.

```
if entity $entity:string type is $entity_type:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string type is not $entity_type:string
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" type is old_man then goto successScript`
- `if entity "Entity Name" type is not old_man then goto successScript`

#### CHECK_ENTITY_PRIMARY_ID

Checks whether an entity has the given `primary_id`.

[CHECK_ENTITY_TYPE](#check_entity_type) is recommended instead.

```
if entity $entity:string primary_id is $expected_u2:number
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string primary_id is not $expected_u2:number
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" primary_id is 32 then goto successScript`
- `if entity "Entity Name" primary_id is not 32 then goto successScript`

#### CHECK_ENTITY_SECONDARY_ID

Checks whether an entity has the given `secondary_id`.

This entity property is only useful on "tile" entities, where the `secondary_id` determines which tile in the tileset is displayed.

Tiles are referenced by their index, starting at the top and going toward the right (0-indexed). Click on the tile within Tiled to see its ID.

```
if entity $entity:string secondary_id is $expected_u2:number
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string secondary_id is not $expected_u2:number
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" secondary_id is 32 then goto successScript`
- `if entity "Entity Name" secondary_id is not 32 then goto successScript`

#### CHECK_ENTITY_PRIMARY_ID_TYPE

Checks an entity's `primary_id_type`: either (0) tile, (1) animation, or (2) character (sometimes called `entity_type`)

```
if entity $entity:string primary_id_type is $expected_byte:number
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string primary_id_type is not $expected_byte:number
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" primary_id_type is 2 then goto successScript`
- `if entity "Entity Name" primary_id_type is not 2 then goto successScript`

#### CHECK_ENTITY_CURRENT_ANIMATION

Checks the id of the entity's current `animation`. (See [entity animations](#entity-animations) for what ids correspond to which animations.)

```
if entity $entity:string animation is $expected_byte:number
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string animation is not $expected_byte:number
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" animation is 2 then goto successScript`
- `if entity "Entity Name" animation is not 2 then goto successScript`

#### CHECK_ENTITY_CURRENT_FRAME

Checks the frame (number) of the entity's current animation.

```
if entity $entity:string animation_frame is $expected_byte:number
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string animation_frame is not $expected_byte:number
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" animation_frame is 2 then goto successScript`
- `if entity "Entity Name" animation_frame is not 2 then goto successScript`

#### CHECK_ENTITY_DIRECTION

Checks whether an entity is facing one of the four cardinal directions: `north`, `south`, `east`, or `west`.

```
if entity $entity:string direction is $direction:bareword
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string direction is not $direction:bareword
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" direction is north then goto successScript`
- `if entity "Entity Name" direction is not north then goto successScript`

#### CHECK_ENTITY_GLITCHED

Checks whether an entity currently has it's "glitched" render flag set.

```
if entity $entity:string is glitched
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string is not glitched
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" is glitched then goto successScript`
- `if entity "Entity Name" is not glitched then goto successScript`

#### CHECK_ENTITY_PATH

Checks the `path` name (geometry) of an entity.

```
if entity $entity:string path is $geometry:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string path is not $geometry:string
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" path is "vector object name" then goto successScript`
- `if entity "Entity Name" path is not "vector object name" then goto successScript`

#### CHECK_IF_ENTITY_IS_IN_GEOMETRY

Checks whether an entity is inside the named geometry.

This action can behave erratically if any of the vertices in the geometry object are subject to coordinate underflow.

```
if entity $entity:string is inside geometry $geometry:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if entity $entity:string is not inside geometry $geometry:string
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if entity "Entity Name" is inside geometry "vector object name" then goto successScript`
- `if entity "Entity Name" is not inside geometry "vector object name" then goto successScript`

### Check variables actions

Check whether one of the MGE variables matches a specific value. If the condition is met (or not met), then the script will abandon any remaining actions and "goto" the named script.

#### CHECK_VARIABLE

Compares the value of a variable against the given value.

`==` is assumed if no operator is given.

```
if variable $variable:string is $value:number
	then goto (script) $success_script:string
	// expected_bool: true
	// comparison: ==
```

```
if variable $variable:string is $comparison:operator $value:number
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if variable $variable:string is not $value:number
	then goto (script) $success_script:string
	// expected_bool: false
	// comparison: ==
```

```
if variable $variable:string is not $comparison:operator $value:number
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if variable varName is 1 then goto successScript`
- `if variable varName is < 1 then goto successScript`
- `if variable varName is not 1 then goto successScript`
- `if variable varName is not < 1 then goto successScript`

#### CHECK_VARIABLES

Compares the value of a variable against another.

`==` is assumed if no operator is given.

```
if variable $variable:string is $source:string
	then goto (script) $success_script:string
	// expected_bool: true
	// comparison: ==
```

```
if variable $variable:string is $comparison:operator $source:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if variable $variable:string is not $source:string
	then goto (script) $success_script:string
	// expected_bool: false
	// comparison: ==
```

```
if variable $variable:string is not $comparison:operator $source:string
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if variable varName is otherVar then goto successScript`
- `if variable varName is < otherVar then goto successScript`
- `if variable varName is not otherVar then goto successScript`
- `if variable varName is not < otherVar then goto successScript`

#### CHECK_SAVE_FLAG

Checks one of the MGE save flags (booleans).

```
if flag $save_flag:string is $expected_bool:boolean
	then goto (script) $success_script:string
```

Example: `if flag saveFlagName is true then goto successScript`

#### CHECK_FOR_BUTTON_PRESS

Checks whether a button was actively pressed down that game tick.

That is, the game keeps track of button state changes each game tick, and this action detects whether the target button had a change of state from *not pressed* to *pressed* that game tick. If the target button was *already pressed* when this action runs, this action will not result in a script branch.

To instead check the button's state (regardless of whether that state has changed) see [CHECK_FOR_BUTTON_STATE](#check_for_button_state).

NOTE: The button states are reset when a new map is loaded. If listening for a button press in the new map, this action may very will trigger immediately, even if the button was held down through the map load.

See [button IDs](#button-ids) for a list of valid button values.

```
if button $button_id:bareword
	then goto (script) $success_script:string
```

Example: `if button SQUARE then goto successScript`

#### CHECK_FOR_BUTTON_STATE

Checks the specific status (pressed or not pressed) of a specific button at that moment.

If checking for whether a button is newly pressed, see [CHECK_FOR_BUTTON_PRESS](#check_for_button_press).

```
if button $button_id:bareword is currently pressed
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if button $button_id:bareword is not currently pressed
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if button SQUARE is currently pressed then goto successScript`
- `if button SQUARE is not currently pressed then goto successScript`

#### CHECK_WARP_STATE

Checks whether the warp state string is a specific value.

```
if warp state is $string:string
	then goto (script) $success_script:string
	// expected_bool: true
```

```
if warp state is not $string:string
	then goto (script) $success_script:string
	// expected_bool: false
```

Examples:

- `if warp state is "some kind of string" then goto successScript`
- `if warp state is not "some kind of string" then goto successScript`

## Further Information

MGS Natlang (and the MGE) is still being developed.

### Contact

If you have questions about the DC801 Black Mage Game Engine or MageGameScript Natlang, please feel free to contact the MGE lead dev, Admiral Potato:
- Discord: AdmiralPotato#6236
- admiral@nuclearpixel.com
