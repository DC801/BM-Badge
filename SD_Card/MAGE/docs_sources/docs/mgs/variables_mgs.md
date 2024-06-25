---
prev: serial_dialog_block.md
---

# Variables (MGS)

In this documentation's example syntax for [MGS Natlang](../mgs/mgs_natlang), variables are marked with `$`. This documentation uses two formats to indicate a variable, each with a `$` at the front:

- `$TYPE`
	- e.g. `$number` (which means any valid [number](#number))
- `$LABEL:TYPE`
	- e.g. `$jump_index:number` (which means any valid [number](#number), and also the JSON property name for that value is `jump_index`)

You can ignore the label when writing [MGS Natlang](mgs_natlang) most of the time, as the "natural language" context of the rest of the phrase will provide more information about the variable's purpose than the label itself might.

In Natlang at least, variable **types** and **values** are far more important:

For the example syntax `entity $string`:

```
entity Alice       // variable value = "Alice"
entity "Bob"       // variable value = "Bob"
entity "Tom Honks" // variable value = "Tom Honks"
                   // for all, variable type = string
```

A variable's **value** is what populates the meat of the JSON output, but its **type** affects how each word is validated against patterns in the MGS Natlang syntax tree, and in most cases will also affect how the word is allowed to be formatted in the natlang.

## Variable Decay

A special property of variable types is **decay**, which means a variable of a specific type may satisfy a variable's requirement for a different type.

Example #1: an action that wants a duration (syntax `wait $duration`)

```mgs
testScript1 {
  wait 150ms; // "duration" = ok
  wait 150;   // "number" is fine, too
              //   (because it decays to "duration")
}
```

Example #2: an action that wants a number (syntax: `load slot $number`)

```mgs
testScript2 {
  load slot 1;    // "number" = ok
  load slot 1ms;  // "duration" won't work!
}
```

In most cases, human intuition is enough to predict whether a variable can decay into another type. (And most things can decay into a [bareword](#bareword), e.g. `true` and `1000ms`.)

::: tip Most importantly:
A variable wanting to be a [string](#string) will be satisfied by either a [bareword](#bareword) string or a [quoted string](#quoted-string), but a variable wanting to be a bareword specifically cannot be satisfied by a quoted string — and vice versa.
:::

## Types and Examples

Note that all numbers must be whole numbers and, unless indicated otherwise in the action dictionary entry, must be positive.

(It's all JavaScript under the hood. Be kind!)

### Duration

Number + `ms` or `s`

- e.g. `1000ms` or `1s`
- Seconds are translated into milliseconds automatically.

### Distance

Number + `px` or `pix`

- e.g. `32px` or `128pix`

### Quantity

Number + `x`

- e.g. `1x` or `10x`
- The [barewords](#bareword) `once`, `twice`, and `thrice` also count.
- Note that the `x` comes *after* the number, not before!

### Number

Number (positive or negative)

- e.g. `-1` or `100`
- While negative numbers will all validate to the `number` type, not all actions permit negative numbers.
- Variables that can decay to number (duration, distance, quantity) cannot be negative.

### Color

A CSS-style hex color.

- e.g. `#FFF` or `#00EF39`
- Some bare color names will also work, e.g. `black` or `white`.

### Boolean

A binary option.

- True: `true`, `yes`, `on`, `open`
- False: `false`, `no`, `off`, `closed`, `close`

Some actions will prefer specific pairs of booleans when being translated from JSON, but when translating the other way, any of the above words will work. E.g.

- `turn player control open;`
- `turn player control on;`
- `turn player control true;`

(WARNING: This may become stricter someday, so best use the boolean that feels most coherent for the phrase!)

### Operator

NOTE: Tokens are given this type by the lexer if they are straight-up punctuation, but when an action calls for one, it usually wants you to use something from one of the following [enums](../enums):

#### Comparator

See: [Enums#Comparators](../enums#comparators)

symbol | meaning
---|---
`<`  | less than
`<=` | less than or equal to
`==` | equal to
`>=` | greater than or equal to
`>`  | greater than

Not equals (`!=`) is coming but not available yet. Instead, invert the `is` to `is not` in the Natlang phrase. (NOTE: the `is`/`is not` is likely being phased out at some point as a part of a [Natlang revision](mgs_natlang#revisions))

#### Operation

See: [Enums#Operations](../enums#operations)

symbol | op | meaning
---|---|---
`=` | `SET` | set the variable to that value
`+` | `ADD` | add that value to the variable
`-` | `SUB` | subtract that value from the variable
`*` | `MUL` | multiply that value with the variable
`/` | `DIV` | divide that variable by the value (integer division; rounds down to whole number)
`%` | `MOD` | apply that modulo to the variable (≈ division remainder)
`?` | `RNG` | set that variable to a random number between 0 and 1 + the given value

Symbols used in the first column will become the item in the second column when turned into JSON.

Natlang actions that call for an operator will also accept the corresponding bare words `SET`, `ADD` etc. (But maybe not indefinitely….)

### Bareword

These are limited to alphanumeric characters, plus a handful of punctuation:

- hyphen: `-`
- underscore: `_`
- period: `.`
- dollar sign: `$`
- pound: `#`
- exclamation point: `!`

::: warning
Underscores don't count as a word boundary most places, but hyphens do. Therefore, without a language server that can find matching script/dialog/etc. references, finding/renaming/managing scripts/dialogs/etc. can be problematic when they contain hyphens and when they are not wrapped in quotes.
:::

Other info:

- Barewords satisfy the requirement for anything that calls for a [string](#string).
- Barewords cannot start with hyphen (`-`).
- If a bareword starts with a dollar sign (`$`), it will be interpreted as a constant by the [const!()](../mgs/advanced_syntax#const) macro.
- Barewords will count as [quoted strings](#quoted-string) if wrapped in quotes, even if the bareword criteria is otherwise met.

### Quoted String

These can be just about anything as long as it's wrapped in a matching pair of double quotes (`"`) or single quotes (`'`).

Quotes and certain other characters must be escaped (`\"`) inside a quoted string.

Quoted strings satisfy the requirement for anything that calls for a [string](#string).

### String

Any [quoted string](#quoted-string) or [bareword](#bareword).

## Enums

Some action variables will be of a generic [MGS Natlang](../mgs/mgs_natlang) type (such as [string](#string)) but the action itself will only be satisfied by a value from a limited set of words. In such cases, invalid values are reported by the [encoder](../encoder).

See: [Enums](../enums)
