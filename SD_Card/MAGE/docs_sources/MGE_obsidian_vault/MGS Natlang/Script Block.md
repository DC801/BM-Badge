# Script Block

To define an [[MGS Natlang]] [[scripts|script]], start a new [[Block|block]] at the root level:

```mgs
script $string {}
// or
$string {}
```

If the word `script` is absent, any [[String]] (other than `dialog`, `settings` etc.) will be interpreted as the script name.

These blocks must occur on the root level.

**Block contents**: any number of [[actions]], [[labels]], or [[Combination Block|combination blocks]] in the order they are to be executed in-game.
