# While and For

[[Advanced MGS Natlang Syntax]] for [[Scripts (JSON)|MGS Natlang scripts]].

`while` and `for` are looping syntax constructions that expand to "[[GOTO_ACTION_INDEX|goto]] [[Labels|label]]" actions.

Special keywords:

- `continue`: This will stop the loop (without finishing the contents of the current loop) and start it again from the top. (`for` loops will still do their increment step after a `continue`, even if the rest of the loop is skipped.)
- `break`: This will abandon all looping behavior, and continue the script below the `while` or `for` body.

Note that if multiple loops are nested, `break` and `continue` will only apply to their own associated loop, and not arbitrary named `while` or `for` loops. (You might try `goto label ___` instead.)

`break` and `continue` must be followed by a semicolon (`;`).

#### While

`while` lets you repeat a segment of code while the condition remains true.

```mgs
scriptName {
  while (variable sodas < 5) {
    show serial dialog {
      "Wow! I've had $sodas$ sodas today!"
    }
    mutate sodas + 1;
  }
}
```

#### For

For `for`, the parentheses encloses three sets of words separated by semicolons (`;`):

1. Initial: setting the value of your loop counting variable
2. Condition: the condition under which the body of the `for` is to be executed
3. Increment: changing the value of your loop counting variable

```mgs
script {
  show serial dialog { "Let's count to 4!" }
  for (mutate i = 1; variable i <= 3; mutate i + 1) {
    show serial dialog { "$i$..." }
  }
    show serial dialog { "$i$!" }
}
```

will produce:

```
Lets count to 4!
1...
2...
3...
4!
```

Fun fact: `for` is kind of like `while`, but with extra steps.

```
for (INIT; COND; ITER) {
  BODY
}
```

The above is equivalent to:

```
INIT
while (COND) {
  BODY
  ITER
}
```
