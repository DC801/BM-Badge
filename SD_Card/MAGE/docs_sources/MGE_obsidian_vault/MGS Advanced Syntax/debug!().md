# `debug!()`

[[Advanced MGS Natlang Syntax]] for [[Scripts (MGS)|MGS Natlang scripts]].

For quick logging, you can use `debug!()` to generate [[terminal]] output that will only print when [[Debug Mode]] is on.

Thus:

```mgs
scriptName {
  debug!("Debug mode GO!")
}
```

becomes

```mgs
scriptName {
  if (debug mode is on) {
    show serial dialog {"Debug mode GO!"}
  }
}
```

The allowed contents of `debug!()` are the same as the allowed contents of a [[serial dialog block]].