# `include!()`

[[Advanced MGS Natlang Syntax]].

This macro will copy and past the plaintext contents of the named [[MGS Natlang|MGS]] file (the path of the file doesn't matter) into place. Line breaks are changed into spaces to make the line numbers consistent with the original file.

This is recursive, so be careful.

This is best used for common settings, such as the [[dialog settings target block|player dialog label]].

```mgs
include!("header.mgs")
```
