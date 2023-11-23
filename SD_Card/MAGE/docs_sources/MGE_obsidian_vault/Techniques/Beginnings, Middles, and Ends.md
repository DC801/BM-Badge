# Beginnings, Middles and Ends

(This is less necessary now that we have [[MGS Natlang]]!)

#updateme

Because an entity's [[on_interact]] script is set to the same thing each time their map is loaded, it is beneficial to describe an entity's behavior assuming that branching logic will always have to be done from scratch in this script. (While you could also set the map's [[on_load]] to change the entity's `on_interact` script based on certain conditions, this is much more frustrating to manage.)

In addition, because the `on_interact` script slot is set to the last script that was run (rather than reverting to its original value when an interaction is finished), you should explicitly set an entity's `on_interact` to its start script at the end of each of its branches.

This means most entities will have the same start behaviors and end behaviors every time they are engaged. And as previously mentioned, anything done repeatedly should be defined once and used many times rather than being defined over and over. This is why branching scripts of sufficient complexity should be split into one of three types: start, branch, or wrapup.

## Start Script

On the map, set this as the entity's `on_interact` property. (E.g. Blacksmith's `on_interact` = `show_dialog-blacksmith-start`) 

If all branches contain the same starting behavior (such as stopping idle actions and/or facing the player before saying various things), those actions should be done at the very top of the start script.

>Actions done in most of the branches (but not all of them) might be included between the start branches' logic checks, but depending on the branching structure, you might instead want to split this shared behavior into its own script and use [[COPY_SCRIPT]] at the beginning of the relevant branches.

If possible, all the root-level branching logic should be done in this script, e.g. checking whether you've heard a character's backstory.

After all the branching logic comes the "default" branch, which is the entity's behavior when none of the branch conditions are met.

> **Best Practice**: If there are other complex actions you want the entity to perform such as saying something or moving around (as with any of the other branches), use the [[RUN_SCRIPT]] action to jump to another script meant for those specific actions rather than including them in the start script. This separates logic from behavior, and makes both much easier to polish and debug. (If the entity behavior is simple it might not be super necessary, but consider doing this if you're having trouble keeping an entity's branches straight.)

> **Advanced Tip**: You might not want the "default" branch to have a separate script for if there's something you don't want the player to arbitrarily induce via hacking (by setting an entity's `on_interact` or `on_tick` script). For example, to make speedrunning your scenario more challenging, you might want to put the end cutscene behind a number of logic checks that detect whether the player has actually played the game, rather than splitting the end cutscene into its own script (which leaves it vulnerable to being arbitrarily triggered).

## Branch Scripts

These are engaged by one of the logic branches in a start script, and they will contain the bulk of dialog and other entity behavior. They in turn might need to branch via logic at some point, which is fine.

If a branch script does not end by running a wrapup script, it should end by resetting the entity's `on_interact` script to the start script. This action should be done last of all because any actions given afterwards might be ignored, depending on what they are.

Again, in most cases, you'll want the entity's "default" behavior to have its own branch script rather than include those behaviors in the end of its start script.

## Wrapup Scripts

The last action of a branch script should be an action resetting that entity's `on_interact` script, if nothing else. Setting a script for running a single action might not make much sense, but if an entity requires two or more actions to wrap up its behavior, it's definitely beneficial to have a separate wrapup script.

For entities involving complex quests, there will probably be at least two sets of wrapup behaviors: one for resetting the entity if their quest wasn't finished, and another for resetting if it was. These two scripts might have shared behavior that you might want to split into a third script, too. Regardless, be sure to **split scripts when you have a specific sequence of actions that are used more than once**.

## Example Entity: Bob

Incorporating the above techniques is an entity named Bob.

Bob wants soda, specifically A&W Cream Soda. There are four behaviors he performs depending on your previous engagement with him and whether you've acquired the soda he wants.

When split into scripts according to the above pattern, his branching looks like this:

![flowchart of Bob's behavior](media/script-bob.png)

This is the barebones version of his behavior. In a real scenario, there likely will be more actions in each of the branch scripts, such as camera pans or turning different directions — though because the dialog is different in each case, a separate branch script is required regardless.

Importantly, splitting Bob's "default" behavior (his backstory) into a separate script results in a standard form for each branch script, which greatly simplifies organization and makes obvious which scripts are start scripts (logic checks + [[RUN_SCRIPT]]), branch scripts (behaviors + `RUN_SCRIPT`), or wrapup scripts (behavior + reset entity interact script).

### Bob's Branching

When interacted with, the entity Bob runs `show_dialog-bob-start` in his `on_interact` slot.

The first action is a common behavior: turning to face the player. Because all branches include this behavior, this action is done before any branching. (`face-player` is a general purpose script that turns the entity running the script toward the player entity, and invoking it with [[COPY_SCRIPT]] means the start script will continue after `COPY_SCRIPT` has happened.)

Next is the check for whether you've finished Bob's questline. If the questline save flag is `true`, the script slot jumps to a different script: `show_dialog-bob-end-s` (the final column) wherein Bob says "Ack, I might be getting a cavity…."

If the questline save flag is instead `false`, the next action in the start script is run, which is a check for whether the player has "acquired" the necessary soda. If the soda save flag is `true` we jump to `show_dialog-bob-end` (the second-to-last column) — and Bob says "Oh, hey! Is that for me?" and the questline save flag is set to `true`. (This branch ignores whether the player has heard his backstory before, so for a more realistic treatment you might have a separate branch within the `show_dialog-bob-end` script to account for a player who hasn't heard the backstory but still has the required soda, where Bob might say something like "Oh, wow! I don't think you know this, but that's my favorite soda!" etc.)

If the soda save flag is `false`, however, the start script continues on to an action to check whether we've heard Bob's backstory. If we have (if the backstory save flag is `true`), we branch to `show_dialog-bob-s` — a script that gives a short/summary version of his start dialog. [Have I been using `-start-s` or just `-s`?]

If the backstory save flag is `false`, the script runs the final action, which uses [[RUN_SCRIPT]] to initiate a jump to the final script branch: `show_dialog-bob-backstory`. (As previously discussed, jumping to a different script for this entity behavior is optional.)

### Bob's Wrapup

At the end of all script branches, [[RUN_SCRIPT]] causes a script jump to the general-purpose wrapup script: `bob-wrapup`. This turns Bob toward the south and resets his interact script so the dialog tree can begin afresh the next time you interact with him.

### Bob's Branching, But Without Structure

If this start-branch-wrapup structure seems excessive, compare Bob's behavior with and without it:

![flowchart of Bob's behavior: strictly-structured on the left (with symmetry and flow that's easy to understand), and unstructured on the right (organic and compact, but unclear)](media/script-bob-compare.png)

On the right is a script tree with the same MGE behavior but with the bare minumum number of branches. While just as functional, it will be harder to maintain if more complexity must be introduced, and it is intuitively less understandable when looking at each piece on its own.

## Run vs Copy Script

As a reminder, [[COPY_SCRIPT]] is good for injecting a bit of shared behavior, whereas [[RUN_SCRIPT]] is used to abandon the current script and jump to another.

For script trees with a start-brach-wrapup structure: when jumping to a branch from a start script, or jumping to a wrapup script from a branch script, you should use `RUN_SCRIPT`.

For this use, `COPY_SCRIPT` will appear to do the same thing `RUN_SCRIPT` does, but in fact it will needlessly increase the size of the encoded game — sometimes much more than you'd think if there are several layers of `COPY_SCRIPT` involved. In addition, `RUN_SCRIPT` immediately indicates visually that the script in question is not the end of a branch, which makes scripts easier to debug.

Therefore, if the last action of an entity's start script or branch script is `COPY_SCRIPT`, there's a good chance it should actually be `RUN_SCRIPT`.

(`COPY_SCRIPT` may be the final action in other types of script, of course.)
