# Labels

Advanced [[MGS Natlang]] syntax (specifically for [[Scripts (MGS)|MGS Natlang scripts]]).

A label is a destination for conditional (or non-conditional) jumps inside the [[scripts|script]] that is currently running. A label linker converts these into absolute index jumps after [[COPY_SCRIPT]] is expanded but before the JSON becomes [[MGE Encoder|encoded]] into binary data.

The syntax is a [[Bareword]] followed by a colon (`:`).

```mgs
exampleScript {
  show serial dialog { "One..." }
  show serial dialog { "Two..." }
  goto label four
  show serial dialog { "Three..." }
  four:
  show serial dialog { "Four... wait, did I skip one?" }
}
```

The above will print:

```
One...
Two...
Four... wait, did I skip one?
```
