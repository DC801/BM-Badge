# Dialogs (MGS)

In [MGS Natlang](../mgs/mgs_natlang), **dialogs** are found within [dialog blocks](../mgs/dialog_block) and related [combination blocks](../mgs/blocks#combination-blocks).

```mgs
dialog dialogName { SELF "Dialogs go here!" }
//or
script {
  show dialog dialogName { SELF "Dialogs go here!" }
  // or
  show dialog { SELF "Dialogs go here!" }
}
```

## Structure

1. [Dialog identifier](#dialog-identifier): exactly 1
2. [Dialog parameter](#dialog-parameter): 0+
3. [Dialog message](#dialog-message): 1+
4. [Dialog option](#dialog-option): 0-4x

Multiple dialogs can occur back-to-back inside their parent block.

## Dialog Identifier

```mgs{2}
dialog sampleDialog {
  SELF
  alignment BOTTOM_RIGHT
  emote 3
  "Messages..."
  "So many messages!"
  "Don't you think?"
  > "Not really." : goto script sampleScript1
  > "Definitely." : goto script sampleScript2
}
```

The **dialog identifier** identifies the "speaker" of the [dialog messages](#dialog-messages) that immediately follow. For most cases, this will be a specific entity (with option #1 or #2 below), though you could also build up a dialog from its component pieces instead (with option #3).

The three options:

1. `$bareword`
	- The [bareword](../mgs/variables_mgs#bareword) identifier refers to a dialog label within a [dialog settings block](../mgs/dialog_settings_block).
		- If no dialog label is found, this is assumed to be an entity name instead. This usage also provides the entity name as an `entity` [parameter](../mgs/dialogs_mgs#dialog-parameters) for the dialog.
		- Entity names with spaces or other special characters are not eligible for this usage.
	- REMINDER: A [quoted string](../mgs/variables_mgs#quoted-string) is NOT allowed here! This string *must* be a [bareword](../mgs/variables_mgs#bareword)!
2. `entity $string`
	- [String](../mgs/variables_mgs#string): an entity's given name (i.e. the entity's name within the Tiled map).
	- This usage also provides the entity name as an `entity` [parameter](#dialog-parameters) for the dialog.
	- The entities [`%PLAYER%`](../relative_references#player) and [`%SELF%`](../relative_references#self) must use this pattern (and not the bareword pattern) because they contain special characters. As this can be cumbersome, it's probably best to set up a [dialog settings](../mgs/dialog_settings_target_block) label for them so you can use a bareword as an identifier instead.
3. `name $string`
	- [String](../mgs/variables_mgs#string): the dialog's display name.
	- This usage also provides a `name` [parameter](#dialog-parameters) for the dialog.
	- If you don't want a name displayed, use an empty quoted string (`name ""`).

## # Dialog Parameters

```mgs{3-4}
dialog sampleDialog {
  SELF
  alignment BOTTOM_RIGHT
  emote 3
  "Messages..."
  "So many messages!"
  "Don't you think?"
  > "Not really." : goto script sampleScript1
  > "Definitely." : goto script sampleScript2
}
```

Dialog parameters are a [dialog property](../dialogs#properties) and value pair. Multiple dialog parameters can occur back-to-back in a single (show) dialog block or a [dialog settings target block](../mgs/dialog_settings_target_block).

- `entity $string`
	- [String](../mgs/variables_mgs#string): the "given name" of the entity (i.e. the entity's name on the Tiled map). (Wrapping this name in `%`s is unnecessary and will in fact confuse the [encoder](../encoder).)
		- Can be [`%PLAYER%`](../relative_references#player) or [`%SELF%`](../relative_references#self).
	- A dialog can inherit a `name` and a `portrait` if given an `entity` parameter.
	- The inherited `name` is a relative reference; the dialog display name will be whatever that entity's name is at that moment.
- `name $string`
	- [String](../mgs/variables_mgs#string): a fixed string of no more than 12 ASCII characters. For an [entity's current name](../variables#printing-current-values)) instead, wrap a specific entity's given name in `%`s.
		- Can be [`%PLAYER%`](../relative_references#player) or [`%SELF%`](../relative_references#self).
	- Overrides names inherited via the `entity` parameter.
	- If this string is empty (`name ""`), the dialog box label will be absent entirely. (Sometimes you want this!)
- `portrait $string`
	- [String](../mgs/variables_mgs#string): the name of a MGE portrait.
	- Overrides portraits inherited via the `entity` parameter.
- `alignment $string`
	- [String](../mgs/variables_mgs#string): one of the following:
		- `TR` (or `TOP_RIGHT`)
		- `BR` (or `BOTTOM_RIGHT`)
		- `TL` (or `TOP_LEFT`)
		- `BL` (or `BOTTOM_LEFT`) (default)
- `border_tileset $string`
	- [String](../mgs/variables_mgs#string): the name of a MGE tileset.
	- The default tileset is used if none is provided.
- `emote $number`
	- [Number](../variables_mgs#number): the id of the "emote" in that entity's entry in `portraits.json`.
	- The default emote (`0`) will display if not specified.
- `wrap messages (to) $number`
	- [Number](../mgs/variables_mgs#number): the number of chars to auto wrap the contents of dialog messages.
	- 42 is default.

## Dialog Messages

A dialog message is any [quoted string](variables_mgs#quoted-string).

```mgs{5-7}
dialog sampleDialog {
  SELF
  alignment BOTTOM_RIGHT
  emote 3
  "Messages..."
  "So many messages!"
  "Don't you think?"
  > "Not really." : goto script sampleScript1
  > "Definitely." : goto script sampleScript2
}
```

- Each message is a new "text screen" in the game.
- Only ASCII characters will be printed.
- Insert an entity's [current name](../variables#printing-current-values)) by wrapping their given name in `%`s.
	- [`%PLAYER%`](../relative_references#player) and [`%SELF%`](../relative_references#self) are also allowed, which target the player entity or the entity that is running the script, respectively.
	- Words wrapped in `%`s will count as 12 chars when the dialog message is auto-wrapped.
- Insert the current value of a MGE variable by wrapping its name in `$`s.
	- Words wrapped in `$`s will count as 5 chars when the dialog message is auto-wrapped.
- Some characters must be escaped in the message body, such as double quote (`\"`) (for messages wrapped in double quotes).
	- `\t` (tabs) are auto-converted to four spaces.
	- `\n` (new lines) are honored, but since text is wrapped automatically, don't worry about hard wrapping your messages unless you want to put line breaks in arbitrary places.
	- `%` and `$` are printable characters unless [used in pairs](../variables#printing-current-values) within a single line, in which case the only way to print them is to escape them (e.g. `\%`).
- Word processor "smart" characters such as ellipses (…), em dashes (—), and smart quotes (“”) are auto converted to ASCII equivalents (`...`) (`--`) (`"`).

## Dialog Options (MGS)

```mgs{8-9}
dialog sampleDialog {
  SELF
  alignment BOTTOM_RIGHT
  emote 3
  "Messages..."
  "So many messages!"
  "Don't you think?"
  > "Not really." : goto script sampleScript1
  > "Definitely." : goto script sampleScript2
}
```

Syntax:

```
> $label:quotedString : (goto) (script) $script:string
```

- You may have up to 4 dialog options per dialog.
- As each of these "branches" results in a script jump, no dialog messages afterward will be seen. Therefore, dialog options must come last within the dialog.
- The **label** is the text that will be shown to the player. As the cursor (approximated with `>`) takes up some room, assume you will only have 39 characters instead of the usual 42.
	- The label behaves like [dialog messages](#dialog-messages) in terms of inserting variables (with `$` or `%`), escaped characters, etc.
	- **Must** be wrapped in [quotes](../mgs/variables_mgs#quoted-string).
- In the MGE, dialog options are displayed underneath the final dialog message. Therefore, final dialog message (before any options) should consist of a single line of no more than 42 characters.
- The words `goto` and `script` are optional. Any [string](../mgs/variables_mgs#string) given after the `:` (other than `goto` and `script`) is assumed to be the script name.
