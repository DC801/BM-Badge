# Dialog Identifier

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

The **dialog identifier** identifies the "speaker" of the [Dialog Messages (MGS)](../mgs/dialog_messages_mgs) that immediately follow. For most cases, this will be a specific entity (with option #1 or #2 below), though you could also build up a dialog from its component pieces instead (with option #3).

The three options:

1. `$bareword`
	- The [bareword](../mgs/variables_mgs#bareword) identifier refers to a dialog label within a [dialog settings block](../mgs/dialog_settings_block).
		- If no dialog label is found, this is assumed to be an entity name instead. This usage also provides the entity name as an `entity` [parameter](../mgs/dialog_parameters_mgs) for the dialog.
		- Entity names with spaces or other special characters are not eligible for this usage.
	- REMINDER: A [quoted string](../mgs/variables_mgs#quoted-string) is NOT allowed here! This string *must* be a [bareword](../mgs/variables_mgs#bareword)!
2. `entity $string`
	- [String](../mgs/variables_mgs#string): an entity's given name (i.e. the entity's name within the Tiled map).
	- This usage also provides the entity name as an `entity` [parameter](../mgs/dialog_parameters_mgs) for the dialog.
	- The entities [`%PLAYER%`](../relative_references#player) and [`%SELF%`](../relative_references#self) must use this pattern (and not the bareword pattern) because they contain special characters. As this can be cumbersome, it's probably best to set up a [dialog settings](../mgs/dialog_settings_target_block) label for them so you can use a bareword as an identifier instead.
3. `name $string`
	- [String](../mgs/variables_mgs#string): the dialog's display name.
	- This usage also provides a `name` [parameter](../mgs/dialog_parameters_mgs) for the dialog.
	- If you don't want a name displayed, use an empty quoted string (`name ""`).
