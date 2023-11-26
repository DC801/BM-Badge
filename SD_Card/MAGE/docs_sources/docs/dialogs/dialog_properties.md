# Dialog Properties

Also see: [Dialogs (JSON)](../dialogs_json), [Dialogs (MGS)](../mgs/dialogs_mgs)

[Dialogs](../dialogs) must, at bare minimum, have `messages`. If no `name` or `entity` is provided (or is set to an empty string `""`), the dialog box label will not appear.

## `alignment`

`alignment` controls the position of the dialog box and its portrait/label boxes. Valid choices:

- `BOTTOM_LEFT`
- `BOTTOM_RIGHT`
- `TOP_LEFT`
- `TOP_RIGHT`

In [MGS Natlang](../mgs/mgs_natlang), these can be abbreviated to `BL`, `TR`, etc.

For the DC801 black mage game, dialog alignment should be `BOTTOM_RIGHT` for the player character, and `BOTTOM_LEFT` for everything else. `TOP_LEFT` and `TOP_RIGHT` are only used when an entity is positioned in such a way that it would most likely be obscured by the dialog box itself.

[MGS Natlang](../mgs/mgs_natlang) will use `BOTTOM_LEFT` if this property is not provided. A default can also be set for each MGS file individually using `settings for dialog {}`, or in multiple files when combined with `include!()`.

## `entity`

Optional. `entity` refers to a specific entity by its **given name** (the name it was given within Tiled). This is technically optional, but you will almost certainly want to include it.

This property can be any of the following:

1. [%PLAYER%](../entities/PLAYER), which refers to the player entity
2. [%SELF%](../entities/SELF), which refers to the entity running the script
3. the **given name** of an entity (no percent signs)

The MGE will use the referenced entity's [current name](../scripts/printing_current_values) for the dialog label automatically.

For the `entity` property, you must not use percent signs to refer to entities, or the [MGE encoder](../encoder/mge_encoder) will give you a message in the vein of `No entity named %Helga% found on map default!` If you don't want to use an entity's [current name](../scripts/printing_current_values) in the dialog label, you must use the `name` property, which can print a string literally.

If the referenced entity is a [character entity](../entities/character_entity), the [MGE Encoder](../encoder/mge_encoder) will use [`entity_types.json`](../structure/entity_types.json) to automatically determine the portrait image.

## `name`

Optional. `name` provides a string for dialog box label, and if included, it will override any names inherited from `entity` above.

This property can be any of the following:

1. [%PLAYER%](../entities/PLAYER), which refers to the player entity
2. [%SELF%](../entities/SELF), which refers to the entity running the script
3. an arbitrary ASCII string up to 12 characters long
4. the **given name** of an entity, but enclosed in percent signs: `%Entity Name%`

If you use the entity's given name without percent signs, it will behave as a static string #3. This will appear to behave the same as #4 in most cases, but #4 will allow inherited dialog labels to reflect the [entity's name as it currently exists in RAM](../scripts/printing_current_values) and not the name it was originally assigned.

## `portrait`

Optional.  This is the name of the portrait defined in [`portraits.json`](../structure/portraits.json) you want to use for the dialog. This will override any portraits inherited from `entity` above.

If the dialog cannot find a portrait to use (either via `portrait` or `entity`), then the dialog will display no portrait box.

## `border_tileset`

Optional. This is name of the dialog box tileset you want the dialog box to use, if not the default. (Default is the first border tileset listed in [`scenario.json`](../structure/scenario.json).)

## `emote`

Optional. Allows you to select a specific emote within the entity's entry in [`portraits.json`](../structure/portraits.json). The default emote (`0`) will display if not specified. (While emotes can have assigned names, you must use intigers to control them here.)

## `messages`

Each dialog message is limited to five rows of 42 ASCII characters. [MGS Natlang](../mgs/mgs_natlang) will wrap this text automatically, though you can hard wrap it wherever you want with `\n`.

### Manual Text Wrapping (JSON)

Excess text will wrap awkwardly off the screen unless wrapped with line breaks (`\n`).

Do not use a space after `\n` unless you want the next line to begin with a space. Therefore, when manually wrapping text, you will likely use `\n` to replace a space character entirely, which can be difficult to read, e.g.:

`"Hey, there! This line is really long and\nwill need to be hard wrapped."`

>Hey, there! This line is really long and<br>
>will need to be hard wrapped.

Smart quotes are not a part of ASCII, nor are ellipses (…), so when copying text written in word processors, please take care to replace any such characters with ASCII equivalents.

To place a double quote within a message, you must type a backslash first: `\"`

Example:

`"That's not what he meant by \"safe,\" is it?"`

>That's not what he meant by "safe," is it?

When using backslash with a special character (like the double quotes above), consider it to be 1 character and not 2 when calculating text wrapping. E.g., the dialog message above is 44 lines in the dialog JSON file, but only 42 characters when displayed in the dialog box, so the message will not need to be hard wrapped.

Many text editors (such as Visual Studio Code) can tell you how many characters you currently have selected, which makes it easy to determine where line breaks should be inserted.
