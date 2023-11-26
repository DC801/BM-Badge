# Labels

Advanced [MGS Natlang](../../mgs/mgs_natlang) syntax (specifically for [MGS Natlang scripts](../../mgs/scripts_mgs)).

A label is a destination for conditional (or non-conditional) jumps inside the [script](../../scripts) that is currently running. A label linker converts these into absolute index jumps after [COPY_SCRIPT](../../actions/COPY_SCRIPT) is expanded but before the JSON becomes [encoded](../../encoder/mge_encoder) into binary data.

The syntax is a [Bareword](../../mgs/variables/bareword) followed by a colon (`:`).

```mgs
exampleScript {
  show serial dialog { "One..." }
  show serial dialog { "Two..." }
  goto label four;
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
