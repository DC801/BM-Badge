## Comments (MGS)

[[MGS Natlang]] supports two kinds of [[comments]]. Both can appear anywhere in an MGS file or inside any [[Block|block]].

### Inline comment

```mgs
testScript {
  wait 1000ms;
  wait 1000ms; // inline comment
}
```

This is the only time that line breaks are syntactic in MGS natlang. Inline comments start with `//` and end either with a line break or the end of the document.

Fun fact: the MGS Natlang translator (JSON -> Natlang) will take extraneous properties from actions and the like and turn them into inline comments automatically.

### Block comment

```mgs
/*
Block comment:
Everything inside is a comment!
The lexer ignores it all! WHEEE
*/
```

Anything between a `/*` and a `*/` is part of the block comment, allowing you to put line breaks and/or extensive text inside a comment.
