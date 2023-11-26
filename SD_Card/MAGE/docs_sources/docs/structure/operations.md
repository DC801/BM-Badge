# Operations

Used with the [MUTATE_VARIABLE](../actions/MUTATE_VARIABLE) and [MUTATE_VARIABLES](../actions/MUTATE_VARIABLES) [actions](../actions).

- `=` or `SET` — sets a variable to the value given
- `+` or `ADD` — addition
- `-` or `SUB` — subtraction
- `*` or `MUL` — multiplication
- `/` or `DIV` — integer division
- `%` or `MOD` — modulo (remainder)
- `?` or `RNG` — sets a variable to a random value between 0 and the value given minus one
	- Seriously, don't forget to subtract one! If you want a random number between `0` and `9`, you want to put `RNG 10`!
