# Bareword

One of the [[Variables (MGS)|MGS Natlang variable]] types.

These are limited to alphanumberic characters, plus a handful of punctuation:

- hyphen: `-`
- underscore: `_`
- period: `.`
- dollar sign: `$`
- pound: `#`
- exclamation point: `!`

Usage:

- Barewords cannot start with hyphen (`-`).
- If a bareword starts with a dollar sign (`$`), it will be interpreted as a constant by the [[const!()]] macro.
- Barewords will count as [[Quoted String|quoted strings]] if wrapped in quotes, even if the bareword criteria is otherwise met.

Barewords satisfy the requirement for anything that calls for a [[string]].