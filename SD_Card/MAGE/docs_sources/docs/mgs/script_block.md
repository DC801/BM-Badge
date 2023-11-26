# Script Block

To define an [MGS Natlang](mgs/mgs_natlang) [script](scripts), start a new [block](mgs/block) at the root level:

```mgs
script $string {}
// or
$string {}
```

If the word `script` is absent, any [string](mgs/variables/string) (other than `dialog`, `settings` etc.) will be interpreted as the script name.

These blocks must occur on the root level.

**Block contents**: any number of [actions](actions), [labels](mgs/advanced_syntax/labels), or [combination blocks](mgs/combination_block) in the order they are to be executed in-game.
