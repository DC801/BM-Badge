# Variables (MGS)

In this documentation's example syntax for [[MGS Natlang]], variables are marked with `$`. Whatever is put in place of the variable in the example syntax is the variable's **value**.

For the example syntax `entity $string`:

```
entity Alice       // var value = "Alice"
entity Bob         // var value = "Bob"
entity Charlie     // var value = "Charlie"
entity "Tom Honks" // var value = "Tom Honks"
```

A variable's **value** is what populates the meat of the JSON output, but its **type** affects how each word is validated against patterns in the MGS Natlang syntax tree, and in most cases will also affect how the word may be formatted in the natlang.

This documentation uses two formats to indicate a variable, each with a `$` at the front:

- `$type`
	- e.g. `$string` (which means any valid [[String]])
- `$label:type`
	- e.g. `$scriptName:string` (which means any valid [[String]], and also it will be used as a script name)

The variable's label for most purposes doesn't matter much except as a hint as to the variable's purpose, especially if there are multiple variables in the natlang phrase. (It does matter when trying to analyze the JSON output, however.)

## Variable Decay

A special property of variable types is "decay" — this means a variable of a specific type may satisfy a variable's requirement for a different type.

Example #1: an action that wants a duration (syntax `wait $duration`)

```
testScript1 {
  wait 150ms; // "duration" = ok
  wait 150;   // "number" is fine, too
              //   (decays to "duration")
}
```

Example #2: an action that wants a number (syntax: `load slot $number`)

```
testScript2 {
  load slot 1;    // "number" = ok
  load slot 1ms;  // "duration" won't work!
}
```

In most cases, human intuition is enough to predict whether a variable can decay into another type. (And most things can decay into a [[Bareword]], e.g. `true` and `1000ms`.)

Most important to keep in mind is that a variable wanting to be a [[String]] will be satisfied by either a [[Bareword]] string or a [[Quoted String]], but barewords and quoted strings cannot be substituted for each other.

## Types and Examples

Note that all numbers must be whole numbers and, unless indicated otherwise, must be positive.

- [[Duration]]: `1000ms`
- [[Distance]]: `32px`
- [[Quantity]]: `10x`
- [[Number]]: `9001`
- [[Color]]: `#FFDDBB`
- [[Boolean]]: `true`
- [[Operator]]: `+`
- [[Bareword]]: `Bob`
- [[Quoted String]]: `"Bob Austin"`
- [[String]]: `BobAustin`

## Enums

Some action variables will be of a generic [[MGS Natlang]] type (such as [[String]]) but the action itself will only be satisfied by a value from a limited set of words. In such cases, invalid values are reported by the MGE encoder.

See: [[Enums]]