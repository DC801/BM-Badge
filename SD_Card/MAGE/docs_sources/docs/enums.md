# Enums

Some [actions](actions) will only be satisfied by a value from a limited set of words. In such cases, invalid values are reported by the [encoder](encoder).

## Button IDs

[Enum](enums) for [actions](actions) that check the button state.

::: warning INFO
We found that the joystick clicks were aggressive on the hardware, and would trigger at what felt like arbitrary times. While the engine is capable of detecting these clicks, we recommend not using them.
:::

- `MEM0`
- `MEM1`
- `MEM2`
- `MEM3`
- `BIT128`
- `BIT64`
- `BIT32`
- `BIT16`
- `BIT8`
- `BIT4`
- `BIT2`
- `BIT1`
- `XOR`
- `ADD`
- `SUB`
- `PAGE`
- `LJOY_CENTER`
- `LJOY_UP`
- `LJOY_DOWN`
- `LJOY_LEFT`
- `LJOY_RIGHT`
- `RJOY_CENTER`
- `RJOY_UP`
- `RJOY_DOWN`
- `RJOY_LEFT`
- `RJOY_RIGHT`
- `TRIANGLE`
- `X` or `CROSS`
- `O` or `CIRCLE`
- `SQUARE`
- `HAX` (capacitive touch button on the PCB)
- `ANY`

## LED IDs

[Enum](enums) for [actions](actions) that involve the badge lights.

- `LED_XOR`
- `LED_ADD`
- `LED_SUB`
- `LED_PAGE`
- `LED_BIT128`
- `LED_BIT64`
- `LED_BIT32`
- `LED_BIT16`
- `LED_BIT8`
- `LED_BIT4`
- `LED_BIT2`
- `LED_BIT1`
- `LED_MEM0`
- `LED_MEM1`
- `LED_MEM2`
- `LED_MEM3`
- `LED_HAX` (capacitive touch button on the PCB)
- `LED_USB`
- `LED_SD`
- `LED_ALL` (will turn on/off *all* the lights)

## Comparators

[Enums](enums) used with certain `CHECK_` [actions](actions). (See: [Conditional Gotos](actions/conditional_gotos)

symbol | meaning
---|---
`<`  | less than
`<=` | less than or equal to
`==` | equal to
`>=` | greater than or equal to
`>`  | greater than

There is no `!=` comparator as far as the JSON is concerned. To invert a `==`, set the `expected_bool` to `false`.

## Operations

[Enums](enums) used with the [MUTATE_VARIABLE](actions/MUTATE_VARIABLE) and [MUTATE_VARIABLES](actions/MUTATE_VARIABLES) [actions](actions).

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
