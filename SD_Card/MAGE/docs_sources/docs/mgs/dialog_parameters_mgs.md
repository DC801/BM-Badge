# Dialog Parameters (MGS)

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

Dialog parameters are a [dialog property](../dialogs#properties) and value pair. Multiple dialog parameters can occur back-to-back in a single [dialog](../mgs/dialogs_mgs) or a [dialog settings target block](../mgs/dialog_settings_target_block).

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
 