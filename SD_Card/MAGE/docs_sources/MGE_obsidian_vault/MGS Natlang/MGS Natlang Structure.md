# MGS Natlang Structure

Because [[MGS Natlang]] is fairly white space agnostic, formatting is flexible.

```mgs
// all these are equally valid:

scriptName {show dialog{Bob "Hello World!"}}

scriptName2 {
  show dialog { Bob "Hello World!" }
}

scriptName3 {
  show dialog {
    Bob
    "Hello World!"
  }
}
```

(For the sake of brevity, example syntax will be given with as few line breaks as possible!)

## Basic Structure

Commonly, Natlang syntax involves declarations followed by matching pairs of brackets:

- [[Block|Blocks]]: `BLOCK {}`
- [[Macros]]: `MACRO!()`
	- These are often quality-of-life expansion or substitution procedures.

Free form phrases often have a known size, such as actions within a script block (with limited numbers of possible arrangements) or dialog parameters (which always appear in pairs). In such cases, terminating characters or brackets are not used.

However, due to an increasing desire for complex syntax parsing, terminating or separating characters being gradually introduced. As of late 2023, this is limited to semicolons (`;`) being used to mark the end of an action:

- Actions: `ACTION;`

## Variables

See: [[Variables (MGS)]]

MGS Natlang variables are more strict (and nuanced) than the JSON/JavaScript equivalents. For example, in some cases, a [[bareword]] string may be required when the JSON version might have accepted any type of JS string.

In all "dictionary" syntax definitions in this document, words in parentheses are optional, and words starting with dollar signs are [[Variables (MGS)|MGS Natlang variables]].

## Comments

See: [[Comments (MGS)]]
