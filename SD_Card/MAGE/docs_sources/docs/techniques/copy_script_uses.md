# COPY_SCRIPT Uses

[`COPY_SCRIPT`](../actions/COPY_SCRIPT) is one of the most powerful [actions](../actions) in the Mage Game Engine (MGE).

This is an action provided for pure convenience and is actually not used by the MGE at all — the [MGE encoder](../encoder/mge_encoder) literally copies the actions contained in the [script](../scripts) being copied and inserts them into the script containing the `COPY_SCRIPT` action. And it does this recursively, meaning a script copied with `COPY_SCRIPT` can contain the action `COPY_SCRIPT` on and on.

NOTE: `COPY_SCRIPT` can trigger an infinite loop in the encoder if it tries to copy a script that copies the script trying to copy it. Try to keep this from happening.

## Abstracting Behavior

In all things programming, don't write something identical several times. Instead write it once and use it several times. (This is the closest thing we currently have to functions!)

In the MGE2020, the shepherd nervously looks back and forth twice when giving his backstory. A simplified depiction, using [MGS Natlang](../mgs/mgs_natlang):

```mgs{5-13,17-25}
show_dialog-shepherd-backstory {
	// ...
	show dialog {}

	turn player control off;
	wait 200ms;
	rotate entity "%SELF%" 1;
	wait 500ms;
	rotate entity "%SELF%" -2;
	wait 500ms;
	rotate entity "%SELF%" 1;
	wait 200ms;
	turn player control on;

	show dialog {}

	turn player control off;
	wait 200ms;
	rotate entity "%SELF%" 1;
	wait 500ms;
	rotate entity "%SELF%" -2;
	wait 500ms;
	rotate entity "%SELF%" 1;
	wait 200ms;
	turn player control on;

	show dialog {}
}
```

With copy script, this instead becomes:

```mgs{4,6,9}
show_dialog-shepherd-backstory {
	// ...
	show dialog {}
	copy turn-right-and-left;
	show dialog {}
	copy turn-right-and-left;
	show dialog {}
}
turn-right-and-left {
	turn player control off;
	wait 200ms;
	rotate entity "%SELF%" 1;
	wait 500ms;
	rotate entity "%SELF%" -2;
	wait 500ms;
	rotate entity "%SELF%" 1;
	wait 200ms;
	turn player control on;
}
```

This makes the shepherd's choreography much easier to write and understand.

Another advantage is that timing or choreography can be tuned in one place instead of every time the sequence occurs.

### Human Readability

Even when a small sequence of actions is only used once, abstracting it into a separate script that does what it says it does (e.g. `walk-elders-to-door`) can still make choreography much easier to manage, particularly in long [cutscenes](cutscenes).

The sequence need not be long for this technique to be effective.

In the BMG2020, we have a script called `face-player`, which turns the entity ([`%SELF%`](../entities/SELF)) toward the player entity ([`%PLAYER%`](../entities/PLAYER)). This behavior only requires one action, so in this case using `COPY_SCRIPT` won't reduce the number of actions within the script, but it does change it into a form that's easier for a human being to parse.

### Daisy Chaining Long Sequences

For long sequences, it can help to build each segment of dialog and/or choreography one at a time and then daisy chain them when you know each segment is working as intended.

While you might add a [`RUN_SCRIPT`](../actions/RUN_SCRIPT) to the end of each segment to link them to the next, you might also have a separate script that uses `COPY_SCRIPT` for each segment in sequence. This allows the segments to remain independent in case you need to trigger a single segment on its own. (Plus it allows you to use a single segment multiple times.)
