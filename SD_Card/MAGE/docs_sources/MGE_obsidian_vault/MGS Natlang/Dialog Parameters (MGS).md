# Dialog Parameters (MGS)

NOTE: This syntax is used for [[MGS Natlang]] [[Dialogs (MGS)|dialogs]], not [[Dialogs (JSON)|JSON dialogs]].

Dialog parameters are a [[dialog properties|dialog property]] and value pair. Multiple dialog parameters can occur back-to-back in a single [[Dialogs (MGS)|dialog]] or a [[dialog settings target block]].

- `entity $string`
	- [[String]]: the "given name" of the entity (i.e. the entity's name on the Tiled map). (Wrapping this name in `%`s is unnecessary and will in fact confuse the MGE encoder.)
		- Can be [[%PLAYER%]] or [[%SELF%]].
	- A dialog can inherit a `name` and a `portrait` if given an `entity` parameter.
	- The inherited `name` is a relative reference; the dialog display name will be whatever that entity's name is at that moment.
- `name $string`
	- [[String]]: a fixed string of no more than 12 ASCII characters. For an [[Printing Current Values|entity's current name]] instead, wrap a specific entity's given name in `%`s.
		- Can be [[%PLAYER%]] or [[%SELF%]].
	- Overrides names inherited via the `entity` parameter.
	- If this string is empty (`name ""`), the dialog box label will be absent entirely. (Sometimes you want this!)
- `portrait $string`
	- [[String]]: the name of a MGE portrait.
	- Overrides portraits inherited via the `entity` parameter.
- `alignment $string`
	- [[String]]: one of the following:
		- `TR` (or `TOP_RIGHT`)
		- `BR` (or `BOTTOM_RIGHT`)
		- `TL` (or `TOP_LEFT`)
		- `BL` (or `BOTTOM_LEFT`) (default)
- `border_tileset $string`
	- [[String]]: the name of a MGE tileset.
	- The default tileset is used if none is provided.
- `emote $number`
	- [[Number]]: the id of the "emote" in that entity's entry in `portraits.json`.
	- The default emote (`0`) will display if not specified.
- `wrap messages (to) $number`
	- [[Number]]: the number of chars to auto wrap the contents of dialog messages.
	- 42 is default.

## Example

See: [[Dialog Example (MGS)]]