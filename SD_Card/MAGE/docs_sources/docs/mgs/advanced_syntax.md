---
next: ../debug_tools.md
---

# Advanced Syntax

These features are QOL expansions and substitutions that allow [MGS Natlang](../mgs/mgs_natlang) to more closely resemble real programming languages.

None of these features exist in the "real" underlying MGE structure, JSON; if using the JSON to Natlang exporter, none of these features will be present.

## Labels

A **label** is a destination for conditional (or non-conditional) jumps inside the [script](../scripts) that is currently running. A label linker converts these into absolute index jumps after [COPY_SCRIPT](../actions/COPY_SCRIPT) is expanded but before the JSON becomes [encoded](../encoder) into binary data.

The syntax is a [bareword](variables_mgs#bareword) followed by a colon (`:`).

```mgs{6}
exampleScript {
  show serial dialog { "One..." }
  show serial dialog { "Two..." }
  goto label four;
  show serial dialog { "Three..." }
  four:
  show serial dialog { "Four... wait, did I skip one?" }
}
```

The above will print:

```
One...
Two...
Four... wait, did I skip one?
```

## Return

`return` is a keyword that will end the current [script](../scripts) early. (It simply sets the action index past the end of the script, causing it to immediately end.)

This will not prevent [`on_tick`](../script_slots#on-tick) scripts from looping on the next game tick, however; if you want to stop an `on_tick` script for good, you must explicitly [goto](../RUN_SCRIPT) `null_script`.

### Returning a Value

...Sorry, but you can't "return" a value to the script's "caller." (We don't have a call stack!)

If you want to emulate value-returning behavior, you might try assigning a value to a variable as a script's last action, then have another script [COPY_SCRIPT](../actions/COPY_SCRIPT) it and use the variable like normal.

## While and For

`while` and `for` are looping syntax constructions that expand to "[goto](../actions/GOTO_ACTION_INDEX) [label](#labels)" actions.

Special keywords:

- `continue`: This will stop the loop (without finishing the contents of the current loop) and start it again from the top. (`for` loops will still do their increment step after a `continue`, even if the rest of the loop is skipped.)
- `break`: This will abandon all looping behavior, and continue the script below the `while` or `for` body.

Note that if multiple loops are nested, `break` and `continue` will only apply to their own associated loop, and not arbitrary named `while` or `for` loops. (You might try `goto label ___` instead.)

`break` and `continue` must be followed by a semicolon (`;`).

#### While

`while` lets you repeat a segment of code while the condition remains true.

```mgs{2-7}
scriptName {
  while (variable count < 5) {
    show serial dialog {
      "Wow! I've had $count$ sodas today!"
    }
    mutate count + 1;
  }
}
```

#### For

For `for`, the parentheses encloses three sets of words separated by semicolons (`;`):

1. Initial: setting the value of your loop counting variable
2. Condition: the condition under which the body of the `for` is to be executed
3. Increment: changing the value of your loop counting variable

```mgs{3-5}
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
Let's count to 4!
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

## If and Else

An easier way of writing and daisy chaining [conditional gotos](../conditional_gotos):

```
if ( CONDITION ) { BEHAVIOR/BODY }
```

- The `if` **condition** is wrapped with parentheses, and the `if` **body** is wrapped with curly braces.
- The `if` body may contain additional `if`s.
- Normal actions can occur before and after the `if`.
- Actions that occur after the `if`/`else` chain will happen regardless of whether the `if` condition is met.

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

### Compound conditions

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

## Macros

### `include!()`

This macro will copy and paste the plaintext contents of the named [MGS](../mgs/mgs_natlang) file into place. (The path of the file doesn't matter; it just has to be in [`scenario_source_files`](../mage_folder#scenario_source_files) somewhere.) Line breaks are changed into spaces to make the line numbers consistent with the original file.

This is recursive, so be careful.

This is best used for common settings, such as the [player dialog label](../mgs/dialog_settings_target_block).

```mgs
include!("header.mgs")
```

### `const!()`

This macro emulates compile-time constants. Its main purpose is to help you avoid "magic numbers" in your [script](../scripts) by allowing you to define a [number](../variables_mgs#number), [string](../mgs/variables_mgs#string), or [boolean](../mgs/variables_mgs#boolean) in a single place, even if you need to use it multiple times.

The macro literally replaces each constant with the token collected during its original value assignment.

These constants are *not* meant to be used as variables for in-game logic, as the game will never see the constant as a variable at all, but will only see the token captured by the macro. To emphasize this point, you cannot change the value of a constant once you've defined it. If you find yourself wanting to do this, you probably want to be using a [variable](../variables#integer-variables) instead.

Inside the above parentheses can be any number of constant assignments:

```
[CONST_NAME] = [VALUE]
```

- `CONST_NAME`: `$` + [bareword](../mgs/variables_mgs#bareword) (e.g. `$varName`)
- `VALUE`: any [variable](../mgs/variables_mgs) whatsoever, e.g. any [number](../mgs/variables_mgs#number), [string](../mgs/variables_mgs#string), [bareword](../mgs/variables_mgs#bareword), [duration](../mgs/variables_mgs#duration), etc.

Keep in mind that `$` is also used in this documentation's Natlang "dictionary" syntax (e.g. `wait $duration`), but that is a different usage, as those variables are to be replaced by values of that variable type (e.g. `wait 100ms`), whereas these constants will appear in the final MGS file literally in the form `$_`.

To assign such a constant once while using it multiple times throughout your project, combine this with [`include!()`](#include).

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

- `const!()` registers and replaces tokens; it does not find-and-replace arbitrary strings. For this reason, you will not be able to use constants inside a [quoted string](../variables_mgs#quoted-string), since a quoted string *in its entirety* counts as a single token.
- In addition, this macro only captures single tokens; you cannot use a constant to represent multiple tokens, e.g. `const!($parade = 76 trombones);` will result in a syntax error.

### `debug!()`

For quick logging, you can use `debug!()` to generate [terminal](../terminal) output that will only print when [debug mode](../debug_tools#debug-mode) is on. Thus:

```mgs{2}
scriptName {
  debug!("Debug mode GO!")
}
```

becomes

```mgs{2-4}
scriptName {
  if (debug mode is on) {
    show serial dialog {"Debug mode GO!"}
  }
}
```

The allowed contents of `debug!()` are the same as the allowed contents of a [serial dialog block](../mgs/serial_dialog_block).

