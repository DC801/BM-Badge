# Serial Styles

Styling for [MGS Natlang](../mgs/mgs_natlang) [serial dialog](../mgs/serial_dialogs_mgs) [messages](../mgs/serial_dialog_messages_mgs).

A unique feature of [serial dialog](../mgs/serial_dialogs_mgs) [messages](../mgs/serial_dialog_messages_mgs) and [serial options](../mgs/serial_dialog_options_mgs) is styling. Styles, implemented with ANSI escape codes, are turned on and off with tags enclosed in `<` and `>`.

(Also note that `<bell>`, though not styling, is also available. This will ring the terminal bell.)

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

## Example

```mgs
serial dialog grandpaRambling {
  "That doll is <r>evil</>, I tells ya! <r><bold>EVIL</>!!"
}
```

> That doll is <span style="color:#b00;">evil</span>, I tells ya! <span style="color:#f33;font-weight:bold;">EVIL</span>!!

You can also add styles one at a time, and they will accumulate:

```mgs
serial dialog accumulation {
  "plain text <r>red text <bold>add bold <bg-b>add blue background</> clear all"
}
```

> plain text <span style="color:#b00;">add red </span><span style="color:#f33;font-weight:bold;">add bold </span><span style="color:#f33;font-weight:bold;background-color:#00b">add blue background</span> clear all

The user's color theme affects how styles appear in their serial console, and not all styles are implemented in all themes (or consoles). We therefore recommend using styles for optional flavor only, and not to impart gameplay-critical information.

::: warning WORKAROUND
The web build of the game currently styles serial output one line at a time, and so styling may be dropped after a line break. As a workaround, manually insert your style tags again before the word that was wrapped.
:::
