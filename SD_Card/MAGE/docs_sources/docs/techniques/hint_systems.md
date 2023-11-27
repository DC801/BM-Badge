# Hint Systems

::: warning OUT OF DATE
Be aware that this entry predates [MGS Natlang](../mgs/mgs_natlang.md).
:::

For the BMG2020, we implemented a hints system: whenever a player engaged with an [entity](../entities) involving a quest, a hint was triggered so the entity designated to be the "hint man" could provide a hint for the player.

There were two methods we used to do this, and both are viable. Depending on how many hints (or equivalent behavior) you'll need to manage, you might use either method.

## Save Flag Hints

With this method, there is a separate [save flag](../scripts/variables.md#save-flags) for each hint.

**Triggering a hint**: If the player talks to a quest entity and triggers "backstory" dialog or otherwise engages the entity in a way that indicates they are involved in a quest, set all other hint flags to `false` and set the hint flag for the quest line to `true`.

You should have a separate script for setting all hint flags in the game to `false`. Use [COPY_SCRIPT](../actions/COPY_SCRIPT) to "invoke" that script right before setting the target hint to `true`.

**Clearing a hint**: Once the player has completed a quest line, set the hint flag for the quest line to `false`.

The advantage of this technique is that it's effortless to reset only the target hint. Say, for instance, that the current hint is the "goose" hint but the player triggered the completion of the Bender quest sort of by accident. Bender's wrapup script might set his own hint flag to `false`, but this doesn't interfere with the current hint flag (the goose hint) and so the hint for the goose quest remains `true`.

This technique will likely require maintaining a list of hint flags and being very careful about setting them, since it's possible to have multiple hint flags set to `true` at the same time. And if your "set all hint flags to false" script is incomplete, hints might be left on by accident.

For games with a large number of hints this method can be difficult to debug. Another disadvantage of this technique is its susceptibility to typos, as every hint flag is a string.

For BMG2020 we moved away from this technique because we were setting hint flags *a lot* — every time a hint flag was set, every other hint flag was *also* set. (The reset script set them all to `false`, even if they were already `false`.) We were going to log the [save flags](../scripts/variables.md#save-flags) triggered by play testers to do story timing analytics, but found that hint flags overwhelmed everything.

## Integer Hints

With this method, there is a single [integer variable](../scripts/variables.md#integer-variables) for all hints. Let's call this the "hintiger."

**Triggering a hint**: If the player talks to a quest entity and triggers "backstory" dialog or otherwise engages the entity in a way that indicates they are involved in a quest, set the hintiger to the value associated with that quest line.

**Clearing a hint**: Once the player has completed a quest line, set the hintiger to `0`.

Optionally, first check whether the hintiger is associated with the quest line being solved, and leave the hintiger alone if the current hintiger is for a different quest. (This makes hint deactivation much more complicated — a disadvantage of this technique.)

The biggest advantage is that only one hint can be set at a time. Typos are far less likely for ints than strings, too. It is, however, much harder to tell which hint is which from the value of the int alone (as opposed to strings, which can be much more self explanatory).

### Hint Variations

You might need multiple hints per quest line. For BMG2020, we had several values per quest line depending on what triggered the hint — we used the ones digit to indicate the context of the trigger and the tens (overflowing to the hundreds) digit to indicate which quest line it was. For our game, `2-` meant baker, `-0` meant the hint was triggered by Bert, and `-1` meant the hint was triggered by the entity itself, etc.:

`20` = The player heard about the baker from Bert, which meant the hint man had to only describe where the baker was and something about what he wanted in general.

`21` = The player actually talked to the baker and heard his backstory in person (long form or short form), which meant the hint man had to give a hint about how to solve the problem the baker mentioned verbally.

If we continued with this pattern, we might have used `22` for if the player got partway through the quest and needed a hint about the second half, etc.

Incorporating hint variations will likely require more frequent hint logic checks. For instance, if the current hint is `21` (continuing from the above example) we wouldn't want speaking to Bert to set it to `20`, which is a more basic hint. To prevent this, we might check the relevant backstory [flag](../scripts/variables.md#save-flags) or the current hintiger to decide whether to set it to `20`. This is fairly easy to do in the case of BMG2020 because the tens (and hundreds) digit determine the hint quest line, so we can divide the current hintiger by 10 (after copying it into another [variable](../scripts/variables.md#integer-variables)) to procedurally detect which quest line the hint was for.

### Hintiger Abstraction

Hintigers might count as [magic numbers](https://en.wikipedia.org/wiki/Magic_number_%28programming%29#Unnamed_numerical_constants), which are to be avoided when possible. Solutions include:

#### MGS Natlang Constants

In [MGS Natlang](../mgs/mgs_natlang), the `const!()` macro allows you to define compile-time constants, and was implemented to prevent magic numbers.

You could create a whole list of these constants for all your hints, perhaps in their own MGS file, then use the `include!()` macro to pull that file in to each of your other MGS files.

#### `COPY_SCRIPT`

There is another way to abstract the value of an integer, though: [COPY_SCRIPT](../actions/COPY_SCRIPT). This method does not require [MGS Natlang](../mgs/mgs_natlang); it can be done with JSON alone.

If you make a series of [MUTATE_VARIABLE](../actions/MUTATE_VARIABLE) scripts that set your hintiger to each of the values you need, you can then use [COPY_SCRIPT](../actions/COPY_SCRIPT) alone to control the current value of your hintiger. This way, your integer-hint assignments happen only once (instead of every time the hint needs to be set) and only in one place (instead of spread out between each of the entity's ques tline scripts).

An example pair of scripts to manage Bender's hints:

```JSON
"set-hint-bender-from-bert": [
	{
    "action": "MUTATE_VARIABLE",
    "variable": "hint-tracking",
    "value": 50,
    "operation": "SET"
  }
],
"set-hint-bender": [
  {
    "action": "MUTATE_VARIABLE",
    "variable": "hint-tracking",
    "value": 51,
    "operation": "SET"
  }
]
```

Then, everywhere you need Bender to change the hint to his own quest line, all you will need is a single `COPY_SCRIPT` action, e.g.:

```JSON
{
  "action": "COPY_SCRIPT",
  "script": "set-hint-bender"
}
```
