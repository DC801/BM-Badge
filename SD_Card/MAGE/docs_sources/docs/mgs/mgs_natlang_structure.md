---
next: blocks.md
---

# MGS Natlang Structure

Because [MGS Natlang](../mgs/mgs_natlang) is fairly white space agnostic, formatting is flexible.

```mgs
// all these are equally valid:

scriptName{show dialog{Bob "Hello World!"}}

scriptName {
  show dialog { Bob "Hello World!" }
}

scriptName {
  show dialog {
    Bob
    "Hello World!"
  }
}
```

Commonly, Natlang syntax involves declarations followed by matching pairs of brackets:

- [Blocks](../mgs/blocks): `BLOCK {}`
- [Macros](../mgs/advanced_syntax#macros): `MACRO!()`

Free form phrases often have a known size, such as actions within a script block (with limited numbers of possible arrangements) or dialog parameters (which always appear in pairs). In such cases, terminating characters or brackets are not used.

However, due to an increasing desire for complex syntax parsing, terminating or separating characters being gradually introduced. As of late 2023, this is limited to semicolons (`;`) being used to mark the end of an action:

- [Actions](../actions): `ACTION;`

## Variables

See: [Variables (MGS)](../mgs/variables_mgs)

MGS Natlang variables are more strict (and nuanced) than the JSON/JavaScript equivalents. For example, in some cases, a [bareword](../mgs/variables_mgs#bareword) string may be required when the JSON version might have accepted any type of JS string.

In all "dictionary" syntax definitions in this documentation, words in parentheses are optional, and words starting with dollar signs are [MGS Natlang variables](../mgs/variables_mgs).

## Comments

MGS Natlang supports two kinds of comments. Both can appear anywhere in an MGS file and inside any [block](../mgs/blocks).

### Inline comment

```mgs
testScript {
  wait 1000ms;
  wait 1000ms; // inline comment
}
```

This is the only time that line breaks are syntactic in Natlang. Inline comments start with `//` and end either with a line break or the end of the document.

Fun fact: the MGS Natlang translator (JSON -> Natlang) will take [extraneous properties from actions](../comments) and the like and turn them into inline comments automatically.

### Block comment

```mgs
/*
Block comment:
Everything inside is a comment!
The lexer ignores it all! WHEEE
*/
```

Anything between a `/*` and a `*/` is part of the block comment, allowing you to put line breaks and/or extensive text inside a comment.
