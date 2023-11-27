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

## Overview

MGS Natlang is a "natural" language meant to be easy to read and write. It consists of phrases that correlate to the shape of JSON required by the MGE encoder, plus QOL syntax like `if`/`else` and [define-in-place dialogs](../mgs/show_dialog_block).

All MGS files are turned into JSON by the [MGE encoder](../encoder/mge_encoder). Unlike [JSON script files](../scripts/scripts_json) and [JSON dialog files](../dialogs/dialogs_json), you don't need to declare MGS files in the game's [`scenario.json`](../structure/scenario.json); all MGS files inside [`scenario_source_files`](../getting_started/scenario_source_files) will be imported.

See: [MGS Natlang vs JSON](../mgs/mgs_natlang_vs_json)

### Always in Progress

The Natlang source code is kept within the DC801 black mage game repo, under `SD_Card/MAGE/editor/dependencies/natlang-parser/`

Natlang is under active development, and the grammar may be updated — sometimes dramatically — in tandem with the badge game source code. The Natlang parser will inform you when it has encountered a syntax error, but always be prepared to consult the documentation (which is generated procedurally based on the current syntax definitions) when writing something!

### Syntax Features

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

### IDE Support

We have provided syntax colors for a variety of text editors an IDEs, but particularly for Visual Studio Code. See: [Syntax Colors](../mgs/syntax_colors)

A language server for Visual Studio Code is on the horizon.

## In-Depth Info

- [MGS Natlang Structure](../mgs/mgs_natlang_structure)
- [Block](../mgs/block)
- [Combination Block](../mgs/combination_block)
- [Advanced MGS Natlang Syntax](../mgs/advanced_mgs_natlang_syntax)
