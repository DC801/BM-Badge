# Variables (MGS)

In this documentation's example syntax for [MGS Natlang](../mgs/mgs_natlang), variables are marked with `$`. Whatever is put in place of the variable in the example syntax is the variable's **value**.

For the example syntax `entity $string`:

```
entity Alice       // var value = "Alice"
entity Bob         // var value = "Bob"
entity Charlie     // var value = "Charlie"
entity "Tom Honks" // var value = "Tom Honks"
```

A variable's **value** is what populates the meat of the JSON output, but its **type** affects how each word is validated against patterns in the MGS Natlang syntax tree, and in most cases will also affect how the word may be formatted in the natlang.

This documentation uses two formats to indicate a variable, each with a `$` at the front:

- `$TYPE`
	- e.g. `$string` (which means any valid [string](../mgs/variables/string))
- `$LABEL:TYPE`
	- e.g. `$scriptName:string` (which means any valid [string](../mgs/variables/string), and also it will be used as a script name)

The variable's label for most purposes doesn't matter much except as a hint as to the variable's purpose, especially if there are multiple variables in the natlang phrase. (It does matter when trying to analyze the JSON output, however.)

## Variable Decay

A special property of variable types is "decay" — this means a variable of a specific type may satisfy a variable's requirement for a different type.

Example #1: an action that wants a duration (syntax `wait $duration`)

```mgs
testScript1 {
  wait 150ms; // "duration" = ok
  wait 150;   // "number" is fine, too
              //   (decays to "duration")
}
```

Example #2: an action that wants a number (syntax: `load slot $number`)

```mgs
testScript2 {
  load slot 1;    // "number" = ok
  load slot 1ms;  // "duration" won't work!
}
```

In most cases, human intuition is enough to predict whether a variable can decay into another type. (And most things can decay into a [bareword](../mgs/variables/bareword), e.g. `true` and `1000ms`.)

Most important to keep in mind is that a variable wanting to be a [string](../mgs/variables/string) will be satisfied by either a [bareword](../mgs/variables/bareword) string or a [quoted string](../mgs/variables/quoted_string), but barewords and quoted strings cannot be substituted for each other.

## Types and Examples

Note that all numbers must be whole numbers and, unless indicated otherwise, must be positive.

- [Duration](../mgs/variables/duration): `1000ms`
- [Distance](../mgs/variables/distance): `32px`
- [Quantity](../mgs/variables/quantity): `10x`
- [Number](../mgs/variables/number): `9001`
- [Color](../mgs/variables/color): `#FFDDBB`
- [Boolean](../mgs/variables/boolean): `true`
- [Operator](../mgs/variables/operator): `+`
- [Bareword](../mgs/variables/bareword): `Bob`
- [Quoted String](../mgs/variables/quoted_string): `"Bob Austin"`
- [String](../mgs/variables/string): `BobAustin`

## Enums

Some action variables will be of a generic [MGS Natlang](../mgs/mgs_natlang) type (such as [string](../mgs/variables/string)) but the action itself will only be satisfied by a value from a limited set of words. In such cases, invalid values are reported by the MGE encoder.

See: [Enums](../structure/enums)
