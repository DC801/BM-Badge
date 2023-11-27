# Serial Dialog Options (MGS)

NOTE: This syntax is used for [MGS Natlang](../mgs/mgs_natlang) [serial dialogs](../mgs/serial_dialogs_mgs), not [JSON serial dialogs](../dialogs/serial_dialogs_json).

```mgs{4-5}
serial dialog sample {
  wrap messages to 60
  "Hey, can anyone hear me? Hello?"
  # "Yes, I can hear you." : goto script sampleYes
  # "What did you say?" : goto script sampleNo
}
```

Two choices:

## Multiple Choice (numbered option)

```
# $label:quotedString : (goto) (script) $script:string
```

Each **label** will appear as part of a numbered list in the serial console. These labels (and only these) may be [styled](../mgs/serial_styles).

The player cannot proceed until they enter a valid number, at which point the game will jump to the corresponding script. Failure results in a repeat of the same serial dialog again. That means this type of option will *always* result in a script jump.

:::details Example
```mgs{5-7}
exampleScript {
  show serial dialog {
    "You are confronted by three potions!"
    "Which do you choose to drink?"
    # "The red one" : goto script drink-potion-red
    # "The blue one" : goto script drink-potion-blue
    # "Start a barfight to avoid this mess" : goto script drink-potion-renegade
  }
}
```
:::

## Free Response

```
_ $label:quotedString : (goto) (script) $script:string
```

The **label** indicates what the player must type for the game to jump to the indicated script.

There is no explicit prompt for these options, but upon reaching the free response portion of the serial dialog, the player can type whatever they want into the serial console.

An invalid response will fall through, i.e. the script will continue executing actions further below. Therefore, only a *valid* response will result in a script jump.

The user's response is case insensitive. (The label `"CAT"` will match the user input of `cat`.)

:::details Example
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
:::

## Behaviors in Common

- A single serial dialog can only use *one* of these two types.
	- The parser will interpret all options within the block using the type of the first option.
- Unlike [dialog options](../mgs/dialog_options_mgs), the option count for serial dialogs is unlimited.
- The **label** *must* be wrapped in [quotes](../mgs/variables_mgs#quoted-string).
- The words `goto` and `script` are optional. Any [string](../mgs/variables_mgs#string) given after the `:` (other than `goto` and `script`) is assumed to be the script name.
