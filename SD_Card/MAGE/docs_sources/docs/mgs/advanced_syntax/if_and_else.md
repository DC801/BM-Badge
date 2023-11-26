# If and Else

[Advanced MGS Natlang Syntax](mgs/advanced_mgs_natlang_syntax) for [MGS Natlang scripts](mgs/scripts_mgs).

```
if ( CONDITION ) { BEHAVIOR/BODY }
```

- The `if` **condition** is wrapped with parentheses, and the `if` **body** is wrapped with curly braces.
- The `if` body may contain additional `if`s.
- Normal actions can occur before and after the `if`.
- Actions that occur after the zigzag will happen regardless of whether the `if` condition is met.

`if` statements can be followed by `else if` and `else` in the standard manner, wherein the script logic will take one of many mutually-exclusive paths.

```
if ( CONDITION ) { BEHAVIOR/BODY }
else if ( CONDITION ) { BEHAVIOR/BODY }
else { BEHAVIOR/BODY }

// or, more commonly:

if ( CONDITION ) {
  BODY
} else if ( CONDITION ) {
  BODY
} else {
  BODY
}
```

- If an `if` or `else if` condition is met, no other conditions in that chain is checked.
- `else` defines behavior that happens if none of the above `if` or `else if` conditions are met.
- Any number of `else if`s is allowed, but only one `else` is allowed.
- Shared behavior will resume after an `else` body or after the last `else if` body.

Remember: An `if` and `else if` is *not* equivalent to two `if`s!

## Compound conditions

Multiple conditions can be checked at the same time with `||` (boolean OR), which indicates that *any* of the given conditions can be true for the branching behavior to occur:

```
  if ( condition-A || condition-B ) {
    behavior-AB
  }
```

The equivalent boolean AND (`&&`) is not implemented, however. If you need an AND, you will need to invert the conditions and use OR:

```
// NOT ALLOWED:

if ( you have money && the game is for sale ) {
  buy the game
} else {
  don't buy the game
}

// INSTEAD:

if ( you don't have money || the game is not for sale ) {
  don't buy the game
} else {
  buy the game
}
```
