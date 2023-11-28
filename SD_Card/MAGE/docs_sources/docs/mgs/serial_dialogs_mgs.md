# Serial Dialogs (MGS)

In [MGS Natlang](../mgs/mgs_natlang), **serial dialogs** are found within [serial dialog blocks](../mgs/serial_dialog_block) and related [combination blocks](../mgs/blocks#combination-blocks).

Serial dialogs contain text meant to be shown via the serial console [terminal](../terminal). They are called serial "dialogs" because they are similar to [dialogs](../dialogs) in many respects, but they are made up of text alone (as opposed to being accompanied by images and labels) and needn't be used for dialog specifically.

```mgs
serial dialog serialDialogName { "Serial dialogs go here!" }
//or
script {
  show serial dialog serialDialogName { "Serial dialogs go here!" }
  //or
  show serial dialog { "Serial dialogs go here!" }

  //secret serial dialog!
  debug!("I am also a serial dialog!")
}
```

## Structure

1. [Serial dialog parameter](#serial-dialog-parameters): 0+
2. [Serial dialog message](#serial-dialog-messages): 1+
3. [Serial dialog option](#serial-dialog-options): 0+

NOTE: unlike with conventional [dialogs](dialogs_mgs), serial dialog blocks cannot contain more than one serial dialog. In other words, inside a serial dialog block, no parameters can be given after a serial message, and nothing can come after a serial option (except more options).

## Serial Dialog Parameters

```mgs{2}
serial dialog sample {
  wrap messages to 60
  "Hey, can anyone hear me? Hello?"
  # "Yes, I can hear you." : goto script sampleYes
  # "What did you say?" : goto script sampleNo
}
```

Serial dialog parameters are a [serial dialog property](../serial_dialogs#properties) and value pair. Multiple serial dialog parameters can occur back-to-back in a single [MGS Natlang serial dialog](../mgs/serial_dialogs_mgs) or a [serial dialog settings block](../mgs/serial_dialog_settings_block).

- `wrap (messages) (to) $number`.
	- [Number](../mgs/variables_mgs#number): the number of chars to auto wrap the contents of serial dialog messages.
	- 80 is default.

(Yeah, there's only one parameter for the moment!)

## Serial Dialog Messages

```mgs{3}
serial dialog sample {
  wrap messages to 60
  "Hey, can anyone hear me? Hello?"
  # "Yes, I can hear you." : goto script sampleYes
  # "What did you say?" : goto script sampleNo
}
```

A serial dialog message is any [quoted string](../mgs/variables_mgs#quoted-string).

- To maximize compatibility, best to limit these to ASCII characters.
- Each message is printed on its own line.
- Some characters must be escaped in the message body, such as double quote (`\"`) (depending on the quotes you're using to wrap these).
	- `\t` (tabs) are auto-converted to four spaces.
	- `\n` (new lines) are honored, but since text is wrapped automatically, don't worry about hard wrapping your messages unless you want to put line breaks in arbitrary places.
- Word processor "smart" characters such as ellipses (…), emdashes (—), and smart quotes (“”) are auto converted to ASCII equivalents (`...`) (`--`) (`"`).
- These messages may be given ANSI [styles](#serial_styles). Use the built-in styling syntax for best results.

## Serial Dialog Options

- A single serial dialog can only use one of the two types of option (multiple choice or free response).
	- The parser will interpret all options within the block using the type of the first option.
- Unlike [dialog options](dialogs_mgs#dialog-options), the option count for serial dialogs is unlimited.
- The **label** *must* be wrapped in [quotes](../mgs/variables_mgs#quoted-string).
- The words `goto` and `script` are optional. Any [string](../mgs/variables_mgs#string) given after the `:` (other than `goto` and `script`) is assumed to be the script name.

### Multiple Choice

```
# $label:quotedString : (goto) (script) $script:string
```

Each **label** will appear as part of a numbered list in the serial console. These labels (and only these) may be [styled](#serial_styles).

The player cannot proceed until they enter a valid number, at which point the game will jump to the corresponding script. Failure results in a repeat of the same serial dialog again. That means this type of option will *always* result in a script jump.


```mgs{4-5}
serial dialog sample {
  wrap messages to 60
  "Hey, can anyone hear me? Hello?"
  # "Yes, I can hear you." : goto script sampleYes
  # "What did you say?" : goto script sampleNo
}
```

The above example becomes:

```
Hey, can anyone hear me? Hello?
    0: Yes, I can hear you.
    1: What did you say?

>_
```

### Free Response

```
_ $label:quotedString : (goto) (script) $script:string
```

The **label** indicates what the player must type for the game to jump to the indicated script.

There is no explicit prompt for these options, but upon reaching the free response portion of the serial dialog, the player can type whatever they want into the serial console.

An invalid response will fall through, i.e. the script will continue executing actions further below. Therefore, only a *valid* response will result in a script jump.

The user's response is case insensitive. (The label `"CAT"` will match the user input of `cat`.)

```mgs{6-7}
exampleScript {
  show serial dialog {
    "When you arrive at the Sphinx,"
    "it speaks in a slow, monotone voice:"
    "WHEN DO THE FLYING TOASTERS COME OUT?"
    _ "after dark" : goto script sphinxSuccess
    _ "before dark" : goto script sphinxWTF
  }
}
```

The above example becomes:

```
When you arrive at the Sphinx,
it speaks in a slow, monotone voice:
WHEN DO THE FLYING TOASTERS COME OUT?

>_
```

## Serial Styles

A unique feature of [serial dialog](../mgs/serial_dialogs_mgs) [messages](../mgs/serial_dialogs_mgs#serial-dialog-messages) and [serial options](../mgs/serial_dialogs_mgs#serial-dialog-options) is styling. Styles, implemented with ANSI escape codes, are turned on and off with tags enclosed in `<` and `>` ([MGS Natlang](mgs_natlang) only — you'll have to lookup the escape codes yourself otherwise).

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

::: tip Workaround
The web build of the game currently styles serial output one line at a time, and so styling may be dropped after a line break. As a workaround, manually insert your style tags again before the word that was wrapped.
:::
