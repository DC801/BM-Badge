# Comparators

[Enums](enums.md) used with certain `CHECK_` [actions](../actions). (See: [Conditional Gotos](../actions/conditional_gotos.md))

symbol | meaning
---|---
`<`  | less than
`<=` | less than or equal to
`==` | equal to
`>=` | greater than or equal to
`>`  | greater than

There is no `!=` comparator as far as the JSON is concerned. To invert a `==`, set the `expected_bool` to `false`.
