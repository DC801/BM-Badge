# Script Block

To define an [MGS Natlang](../mgs/mgs_natlang) [script](../scripts), start a new [block](../mgs/block) at the root level:

```
script $string {}
// or
$string {}
```

If the word `script` is absent, any [string](../mgs/variables/string) (other than `dialog`, `settings` etc.) will be interpreted as the script name.

These blocks must occur on the root level.

**Block contents**: any number of [actions](../actions), [labels](../mgs/advanced_syntax/labels), or [combination blocks](../mgs/combination_block) in the order they are to be executed in-game.

## Example

```mgs
exampleScript {
  mutate count = 2;
  dejavu:
  play entity Bob animation 3 twice;
  show dialog {
    Bob "Eh? What's that?"
    PLAYER "I SAID that the goldfish wasn't there!"
    "I've told you $count$ times now!"
  }
  mutate count + 1;
  goto label dejavu;
}
```

