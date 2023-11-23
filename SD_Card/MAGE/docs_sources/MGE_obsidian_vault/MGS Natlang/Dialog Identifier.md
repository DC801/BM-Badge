# Dialog Identifier

NOTE: This syntax is used for [[MGS Natlang]] [[Dialogs (MGS)|dialogs]], not [[Dialogs (JSON)|JSON dialogs]].

The **dialog identifier** identifies the "speaker" of the [[Dialog Messages (MGS)]] that immediately follow. For most cases, this will be a specific entity (with option #1 or #2), though you could also build up a dialog from its component pieces instead (with option #3).

The three options:

1. `$bareword`
	- The [[bareword]] identifier refers to a dialog label within a [[dialog settings block]].
		- If no dialog label is found, this is assumed to be an entity name instead. This usage also provides the entity name as an `entity` [[Dialog Parameters (MGS)|parameter]] for the dialog.
		- Entity names with spaces or other special characters are not eligible for this usage.
	- REMINDER: A [[quoted string]] is NOT allowed here! This string *must* be a [[bareword]]!
2. `entity $string`
	- [[String]]: an entity's given name (i.e. the entity's name within the Tiled map).
	- This usage also provides the entity name as an `entity` [[Dialog Parameters (MGS)|parameter]] for the dialog.
	- The entities [[%PLAYER%]] and [[%SELF%]] must use this pattern (and not the bareword pattern) because they contain special characters. As this can be cumbersome, it's probably best to set up a [[dialog settings target block|dialog settings]] label for them so you can use a bareword as an identifier instead.
3. `name $string`
	- [[String]]: the dialog's display name.
	- This usage also provides a `name` [[Dialog Parameters (MGS)|parameter]] for the dialog.
	- If you don't want a name displayed, use an empty quoted string (`name ""`).

## Example

See: [[Dialog Example (MGS)]]
