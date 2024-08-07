# Actors

You might want an [entity](../entities) to appear as another for a time. Let's call the repurposed entity the **actor** and the part they are playing their **costume**.

You might do this so that an entity can have a surprise cameo, or to reduce your entity count on the [map](../maps) in general.

::: details Examples
For the BMG2020, we used actors several times on the main map because we had already hit the entity budget (32 at the time; 64 now).

**Walking to the lodge cutscene**: Helga played the part of Uncle Zappy, and Ram played the part of Aunt Zippy.

**Earthquake cutscene**: Helga played the part of Trekkie, and Ram played the part of Beatrice.
:::

This works best if done between [map](../maps) loads or camera teleports — but it should definitely only be done when you can guarantee the player won't see the actor's "costume change" or notice the original entity has gone missing.

A [map load](../map_loads) will restore the actor to its original state, and is a fast way of cleaning up a cutscene with a lot of actors. Otherwise, you'll have to set up another costume change to restore the actor to its original state.

On the other hand, if you want an entity's costume change to be permanent (e.g. a wanderer leaves town in an early cutscene, but new vendor moves into a shop later in the game), you'll need a [save flag](../variables#save-flags) and the map's [`on_load`](../script_slots#on-load) to [manage this](../techniques/chains_of_small_checks). Best might be to make the actor's default state the one that is needed for the most map loads.

## Using an Actor

To do a costume change, set the actor's properties to the target costume:
1. [entity_type](../entity_types#character-entity) name — new appearance (costume)
2. X and Y coordinates — best done via teleporting to a vector object
3. [`on_interact`](../script_slots#on-interact) script slot — optional; unnecessary for cutscene-only cameos
4. [`on_tick`](../script_slots#on-tick) script slot — optional; unnecessary for cutscene-only cameos
5. [`on_look`](../script_slots#on-look) script slot — optional; unnecessary for cutscene-only cameos
6. `name` — will allow the actor to be labeled correctly in the hex editor and in dialog message labels

When doing choreography involving the actor, use the actor's original name (not the costume's name) in your actions' arguments. This includes dialog messages using the `entity` property. It helps to leave comments to remind yourself that an actor is acting. (See: [Comments](../comments), [MGS Natlang Structure#Comments](../mgs/mgs_natlang_structure#comments))

To reset the actor, either:

1. Load a map. (The next load will use the actor's default state.)
2. Set the actor's properties to what they originally were:
	1. [entity_type](../entity_types#character-entity) name
	2. X and Y coordinates (e.g. teleporting to a vector object)
	3. [`on_interact`](../script_slots#on-interact) script slot (if changed)
	4. [`on_tick`](../script_slots#on-tick) script slot (if changed)
	5. [`on_look`](../script_slots#on-look) script slot (if changed)
	6. `name`
