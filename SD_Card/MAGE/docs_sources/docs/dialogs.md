---
tags: [ 'mgs natlang', 'dialog names', 'actions', 'SHOW_DIALOG', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'TOP_LEFT', 'TOP_RIGHT', 'player', 'self', 'given name', 'current name', 'character entity', 'encoder', 'portrait.json', 'text wrap', ]
---

# Dialogs

Dialogs are a visual novel or RPG style dialog system for the screen. These include portrait images, dialog box labels, and dialog messages.

Dialogs do nothing on their own. To show them, you must use the [SHOW_DIALOG](actions/SHOW_DIALOG) action within a [script](scripts).

[Scripts](scripts) running a dialog cannot simultaneously perform other [actions](actions). If an [entity](entities) must change their behavior partway through a dialog, you must split the dialog into multiple pieces and insert those actions between the pieces, or use another [script slot](script_slots) to control the entity's behavior.

Dialog names must be unique throughout the entire game project. (Dialogs written with [MGS Natlang](mgs/mgs_natlang) need not be named; their names are auto generated based on the file and line number when not defined.)

## Properties

Dialogs must, at bare minimum, have `messages`. If no `name` or `entity` is provided (or if the `name` is set to an empty string `""`), no dialog box label will appear.

### `alignment`

`alignment` controls the position of the dialog box and its portrait/label boxes. Valid choices:

- `BOTTOM_LEFT`
- `BOTTOM_RIGHT`
- `TOP_LEFT`
- `TOP_RIGHT`

In [MGS Natlang](mgs/mgs_natlang), these can be abbreviated to `BL`, `TR`, etc.

[MGS Natlang](mgs/mgs_natlang) will use `BOTTOM_LEFT` if this property is not provided. A default can also be set for each MGS file individually using `settings for dialog {}`, or in multiple files when combined with `include!()`.

::: tip Black Mage Game Usage
For the Black Mage Game, dialog alignment should be `BOTTOM_RIGHT` for the player character, and `BOTTOM_LEFT` for everything else. `TOP_LEFT` and `TOP_RIGHT` are only used when an entity is positioned in such a way that it would most likely be obscured by the dialog box itself.

Put `include!("header.mgs")` at the top of new `.mgs` files to include these and other default project settings.
:::

### `entity`

Optional. `entity` refers to a specific entity by its **given name** (the name it was given within Tiled). This is technically optional, but you will almost certainly want to include it.

This property can be any of the following:

1. [`%PLAYER%`](relative_references#player), which refers to the player entity
2. [`%SELF%`](relative_references#self), which refers to the entity running the script
3. the **given name** of an entity (no percent signs)

The MGE will use the referenced entity's [current name](variables#printing-current-values) for the dialog label automatically.

For the `entity` property, you must not use percent signs to refer to entities, or the [encoder](encoder) will give you a message in the vein of `No entity named %Helga% found on map default!` If you don't want to use an entity's [current name](variables#printing-current-values) in the dialog label, you must use the `name` property, which can print a string literally.

If the referenced entity is a [character entity](entity_types#character-entity), the [encoder](encoder) will use [`entity_types.json`](mage_folder#entity_types-json) to automatically determine the portrait image.

### `name`

Optional. `name` provides a string for dialog box label, and if included, it will override any names inherited from `entity` above.

This property can be any of the following:

1. [`%PLAYER%`](relative_references#player), which refers to the player entity
2. [`%SELF%`](relative_references#self), which refers to the entity running the script
3. an arbitrary ASCII string up to 12 characters long
4. the **given name** of an entity, but enclosed in percent signs: `%Entity Name%`

If you use the entity's given name without percent signs, it will behave as a static string #3. This will appear to behave the same as #4 in most cases, but #4 will allow inherited dialog labels to reflect the [entity's name as it currently exists in RAM](variables#printing-current-values) and not the name it was originally assigned.

### `portrait`

Optional.  This is the name of the portrait defined in [`portraits.json`](mage_folder#portraits-json) you want to use for the dialog. This will override any portraits inherited from `entity` above.

If the dialog cannot find a portrait to use (either via `portrait` or `entity`), then the dialog will display no portrait box.

### `border_tileset`

Optional. This is name of the dialog box tileset you want the dialog box to use, if not the default. (Default is the first border tileset listed in [`scenario.json`](mage_folder#scenario-json).) (Or is it the one named "default"? #researchme)

### `emote`

Optional. Allows you to select a specific emote within the entity's entry in [`portraits.json`](mage_folder#portraits-json). The default emote (`0`) will display if not specified. (While emotes can have assigned names, you must use integers to control them here.)

### `messages`

Each dialog message is limited to five rows of 42 ASCII characters. [MGS Natlang](mgs/mgs_natlang) will wrap this text automatically, though you can still hard wrap if you want with `\n`.

If the dialog contains any dialog options, however, the final message is limited to a single line (42 characters).

### `options`

Complicated. See below.

## JSON Structure

::: warning Slightly Deprecated
With the introduction of [MGS Natlang](mgs/mgs_natlang), you need not write dialogs with JSON, but it still may be useful to understand the JSON structure for debugging purposes.
:::

Easiest might be to copy an existing dialog file and make changes to it, particularly if you're not familiar with JSON.

```json
{
  "dialog-name1" : [],
  "dialog-name2" : [],
  "dialog-another-one" : []
}
```

At the top level of the dialog file is the dialog names and their data. Within the arrays (square brackets) above can be any number of dialog objects (curly braces, comma-separated), each with that dialog's properties:

```json
"dialog-name1": [
  {
    "alignment": "BOTTOM_RIGHT",
    "entity": "%PLAYER%",
    "messages": []
  },
  {
    "alignment": "BOTTOM_LEFT",
    "entity": "Sample Entity",
    "messages": []
  }
]
```

There are three dialog properties used in the example above: `alignment`, `entity`, and `messages`. These three are a reasonable minimum.

`messages` is an array containing the strings for the messages themselves (up to 255 total). Multiple messages within the array will be shown on subsequent dialog boxes, so you don't need a whole new dialog object unless something else about the dialog properties must change, such as a new character beginning to speak, or a different emote.

An expanded `messages` entry:

```json
{
  "messages": [
    "What's for dinner?",
    "Memory leek soup!",
    "....",
    "...Nah, just kidding. It's saag paneer."
  ]
}
```

### Options

For a multiple choice prompt, there are additional dialog properties:

```json
{
  "messages": [
    "Would you like to save the game?"
  ],
  "response_type": "SELECT_FROM_SHORT_LIST",
  "options": [
    {
      "label": "Yes",
      "script": "save_game-yes"
    },
    {
      "label": "No",
      "script": "save_game-no"
    }
  ]
}
```

Since there are five rows within the dialog box, you can have up to four `options`. (Any message with options should be limited to one line of 42 characters.)

- **`response_type`** — Currently only `SELECT_FROM_SHORT_LIST` is implemented.
- **`label`** — How the multiple choice option appears within the game. Normally there is room for 42 characters per line, but since the cursor takes up a few columns of space, you should instead plan on no more than 39 characters for these.
- **`script`** — This is the script that runs if the player chooses that option.

### Text Wrapping

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
