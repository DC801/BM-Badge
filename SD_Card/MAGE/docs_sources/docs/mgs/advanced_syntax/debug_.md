# `debug!()`

[Advanced MGS Natlang Syntax](../../mgs/advanced_mgs_natlang_syntax) for [MGS Natlang scripts](../../mgs/scripts_mgs).

For quick logging, you can use `debug!()` to generate [terminal](../../hardware/terminal) output that will only print when [Debug Mode](../../debug/debug_mode) is on.

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

The allowed contents of `debug!()` are the same as the allowed contents of a [serial dialog block](../../mgs/serial_dialog_block).
