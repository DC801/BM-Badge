# Operations

[Enums](enums.md) used with the [MUTATE_VARIABLE](../actions/MUTATE_VARIABLE) and [MUTATE_VARIABLES](../actions/MUTATE_VARIABLES) [actions](../actions).

op | meaning
---|---
`SET` | set the variable to that value
`ADD` | add that value to the variable
`SUB` | subtract that value from the variable
`MUL` | multiply that value with the variable
`DIV` | divide that variable by the value (integer division; rounds down to whole number)
`MOD` | apply that modulo to the variable (≈ division remainder)
`RNG` | set that variable to a random number between 0 and 1 + the given value

::: warning
Seriously, don't forget to subtract one when using `RNG`! If you want a random number between `0` and `9`, you want to put `RNG 10`!)
:::
