# `const!()`

[[Advanced MGS Natlang Syntax]].

This macro emulates compile-time constants. Its main purpose is to help you avoid "magic numbers" in your [[scripts]] by allowing you to define a [[number]], [[string]], or [[boolean]] in a single place, even if you need to use it multiple times.

The macro literally replaces each constant with the token collected during its original value assignment.

These constants are *not* meant to be used as variables for in-game logic, as the game will never see the constant as a variable at all, but will only see the token captured by the macro. To emphasize this point, you cannot change the value of a constant once you've defined it. If you find yourself wanting to do this, you probably want to be using a [[Integer Variables|variable]] instead.

Inside the above parentheses can be any number of constant assignments:

```
[CONST_NAME] = [VALUE]
```

- `CONST_NAME`: `$` + [[bareword]] (e.g. `$varName`)
- `VALUE`: any [[Variables (MGS)|variable]] whatsoever, e.g. any [[number]], [[string]], [[bareword]], [[duration]], etc.

Keep in mind that `$` is also used in this documentation's [[MGS Natlang]] "dictionary" syntax (e.g. `wait $duration`), but that is a different usage, as those variables are to be replaced by values of that variable type (e.g. `wait 100ms`), whereas these constants will appear in the final MGS file literally in the form `$_`.

#### Example

```mgs
const!(
  $field = x
  $bigNumber = 9001
  $hamburgers = "Steamed Toast"
)

testScript {
  set entity $hamburgers $field to $bigNumber;
}
```

After the macro does its work, the script `testScript` instead will read:

```mgs
testScript {
  set entity "Steamed Toast" x to 9001;
}
```

The above is what the MGS Natlang syntax parser will actually parse. Syntax errors (if any) will be caught at that point and not before; the macro literally doesn't care what the underlying syntax is.

#### Limitations

- `const!()` registers and replaces tokens; it does not find-and-replace arbitrary strings. For this reason, you will not be able to use constants inside a [quoted string](#quoted-string), since a quoted string *in its entirety* counts as a single token.
- In addition, this macro only captures single tokens; you cannot use a constant to represent multiple tokens, e.g. `const!($parade = 76 trombones);` will result in a syntax error.
