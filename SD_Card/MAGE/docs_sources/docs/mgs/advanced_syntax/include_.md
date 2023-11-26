# `include!()`

[Advanced MGS Natlang Syntax](mgs/advanced_mgs_natlang_syntax).

This macro will copy and past the plaintext contents of the named [MGS](mgs/mgs_natlang) file (the path of the file doesn't matter) into place. Line breaks are changed into spaces to make the line numbers consistent with the original file.

This is recursive, so be careful.

This is best used for common settings, such as the [player dialog label](mgs/dialog_settings_target_block).

```mgs
include!("header.mgs")
```
