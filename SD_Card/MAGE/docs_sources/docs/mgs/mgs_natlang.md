# MGS Natlang

Introducing "MageGameScript Natlang" — a simplified approach to writing game content for the DC801 Black Mage Game Engine (MGE).

```mgs
// example script
on_load-wopr {
  turn player control off;
  walk entity "%PLAYER%" along geometry walkline over 600ms;
  wait 400ms;
  turn player control on;
  show dialog {
    PLAYER "Whoa! It looks like I found some kind of back door."
  }
  set flag backdoor-found to true;
}
```

MGS Natlang is a "natural" language meant to be easy to read and write. It consists of phrases that correlate to the shape of JSON required by the [encoder](../encoder), plus QOL syntax like [`if`/`else`](advanced_syntax#if-and-else) and [define-in-place dialogs](../mgs/dialog_block#show-dialog-block).

All MGS files are turned into JSON by the [encoder](../encoder). Unlike JSON [script files](../scripts) and [dialog files](../dialogs), you don't need to declare MGS files in the game's [`scenario.json`](../mage_folder#scenario-json); all MGS files inside [`scenario_source_files`](../mage_folder#scenario_source_files) will be imported.

## Syntax Features

1. White space agnostic.
  - The syntax coloring might break if you are very creative with line breaks, but it should still parse correctly.
2. Many strings can be unquoted or quoted freely.
  - Double (`"`) or single (`'`) quotes are both fine. (Though a #potentialchange is making double quotes mandatory, and possibly using the single quotes for something else. Best stick with double quotes for now.)
  - Anything with a space or any unusual character *must* be wrapped in quotes.
3. Some words are optional, and can be included either to increase logical clarity or omitted to decrease word density. E.g. the following two patterns are equivalent phrases:
  - `goto script scriptName;`
  - `goto scriptName;`
4. Certain [MGS Natlang variables](../mgs/variables_mgs) can be formatted in multiple, human-friendly ways, e.g.
  - Duration: `1000ms` or `1s` or `1000`
  - Quantity: `once` or `1x` or `1`

## MGS Natlang vs JSON

### JSON Script

```json
{
  "cutscene": [
    {
      "action": "SET_PLAYER_CONTROL",
      "bool_value": false
    },
    {
      "action": "WALK_ENTITY_ALONG_GEOMETRY",
      "entity": "%PLAYER%",
      "geometry": "approach-desk",
      "duration": 600
    },
    {
      "action": "NON_BLOCKING_DELAY",
      "duration": 400
    },
    {
      "action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
      "entity": "Trekkie",
      "target_entity": "%PLAYER%"
    },
    {
      "action": "SHOW_DIALOG",
      "dialog": "cutscene-dialog"
    }
  ]
}
```

While relatively human readable, the above is difficult to write in practice.

- It's bulky enough that you can't have very much scripting logic on your screen at once.
- It's easy to lose track of what you're doing as you must constantly reference named scripts and dialogs (and serial dialogs) in different files back and forth.
- JSON cannot be commented, so it's inconvenient to leave yourself supplementary information, such as the contents of a dialog you're referencing when scripting a cutscene.
- The parameters for MGE actions are not uniform, so it's easy to forget or confuse parameters if you're not copying and pasting actions from nearby.

### MGS Natlang Script

```mgs
cutscene {
  turn player control off;
  walk entity "%PLAYER%" along geometry approach-desk over 600ms;
  wait 400ms;
  turn entity Trekkie toward entity "%PLAYER%";
  show dialog cutscene-dialog;
}
```

This is far more approachable — more compact, and the nested relationship of the script and its actions is far easier to see at a glance. Human-friendly grammar constructions (e.g. `is inside` vs `is not inside`) makes it much easier to follow script branching logic.

### JSON Dialog

```json
{
  "cutscene-dialog": [
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

### MGS Natlang Dialog

```mgs
settings for dialog {
  default { alignment BL }
  label PLAYER { entity "%PLAYER%" alignment BR }
}
```

With MGS Natlang, you can create presets for common dialog settings (see above), after which, the dialogs themselves become very lightweight:

```mgs
dialog cutscene-dialog {
  Trekkie
  "Me want to wish you a happy birthday, %PLAYER%."

  PLAYER
  "Aww, gee, thanks, Farmer %Trekkie%!"
}
```

### MGS Natlang (Combined)

However, where MGS Natlang really shines is in combining both script data and dialog data together:

```mgs
settings for dialog {
  default { alignment BL }
  label PLAYER { entity "%PLAYER%" alignment BR }
}
cutscene {
  turn player control off;
  walk entity "%PLAYER%" along geometry approach-desk over 600ms;
  turn entity Trekkie toward entity "%PLAYER%";
  show dialog {
    Trekkie "Me want to wish you a happy birthday, %PLAYER%."
    PLAYER "Aww, gee, thanks, Farmer %Trekkie%!"
  }
}
```

Now a dialog's content is no longer separated from its context. The dialog no longer needs a name, either, unless another script needs to refer to it, too.

## Syntax Colors

A syntax coloring grammar (tmLanguage) for [MGS Natlang](../mgs/mgs_natlang) is in development here: [github.com/alamedyang/magegamescript-syntax-highlighting](https://github.com/alamedyang/magegamescript-syntax-highlighting)

Syntax colors in this documentation were made possible by [shiki](https://v2.vuepress.vuejs.org/reference/plugin/shiki.html), a TextMate grammar plugin for VuePress.


### Visual Studio Code

When you open an MGS file, VSCode will offer a [marketplace extension](https://marketplace.visualstudio.com/items?itemName=goat-and-bird.magegamescript-colors) for it.( Alternatively, search for "MageGameScript Colors" in the Visual Studio Code extensions marketplace.)

After installing the extension, all MGS files will have syntax coloring. VSCode will update the extension automatically whenever a new version comes out.

### Sublime Text

Visit the syntax colors repo above (or clone it locally), then find the `mgs.tmLanguage` file in the `syntaxes` folder. Move this file to wherever Sublime Text wants its coloring grammars in your operating system. After this, you can select MageGameScript under View > Syntax to style the text in your MGS files.

You will have to update the `mgs.tmLanguage` manually by repeating the above process when a new version is released.

### TextMate

A `tmbundle` version of the above grammar has been quickly prepared (as of Nov 2023), but may not have feature parity, is not automatically generated, and it is not bundled with the repo yet. Ask the DC801 badge game devs if you want a preview copy to try.

### IntelliJ

IntelliJ has a plugin, available by default, to install TextMate bundles. Acquire the `tmbundle` as explained above, and follow IntelliJ's documentation to install it.

### Other IDEs

Many other IDEs will accept TextMate grammars, but you will have to find and follow your IDE's specific instructions.

## Revisions

The Natlang source code is kept within the DC801 black mage game repo, at the path `SD_Card/MAGE/editor/dependencies/natlang-parser/`

Natlang is under active development, and the grammar may be updated — sometimes dramatically — in tandem with the badge game source code. The Natlang parser will inform you when it has encountered a syntax error, but always be prepared to consult the documentation (which is generated procedurally based on the current syntax definitions) when writing something!