# Entity Properties

#updateme

This is the standard "hackable" data for entities in the DC801 black mage game. You can set all these properties with Tiled or with scripts from within the MGE.

## Standard

These are default properties provided by Tiled. They're found in the top half of the Properties view.

**Name** — In the MGE, names are limited to 12 ASCII characters.

**Class** (formerly **Type**) — For character entities, this is the `entity_type`, or the name of the character entity as defined by [`entity_types.json`](mage_folder#entity_types-json). This should be automatically assigned by Tiled when you place a character entity on the map. (All tiles on the entity tileset must first have their Type property set to the correct `entity_type` name.)

**X** and **Y** position — You don't need to change these directly if you don't want to, since you can simply place or move entities on the map within Tiled itself.

**Direction** — This is the cardinal direction the character entity is facing. This is handled by placing the desired animation tile (and therefore the correct direction) of the target character entity on the map. Left and right can be flipped by taking a side-facing animation tile and checking the **Flipping > Horizontal** checkbox in the Properties view.

Note that horizontally flipping a front or back-facing character entity will make it appear horizontally flipped within Tiled, but in the MGE this will turn the entity around 180º.

## Custom

These properties must be manually added. To add one, first click the plus at the bottom of the Properties view, and set the property type (bool, float, object, string, etc.). Once added, you can assign a value to them just like any of the standard ones.

**[`on_tick`](script_slots#on-tick) (string)** — This identifies the script that is run for that entity every game tick. Note that `on_tick` scripts loop when finished, so don't assign a script you wouldn't want to run forever.

::: tip Best Practice
If you don't want an entity to have an `on_tick` script, you can leave this property blank, or avoid adding it altogether. It's useful to set an entity's `on_tick` script to [null_script](scripts#null_script) if the entity will be given a specific `on_tick` by another script later in the game. This way, it's clear that the entity's `on_tick` slot is "reserved," and you won't accidentally give it an `on_tick` script that will be overwritten later.
:::

**[`on_interact`](script_slots#on-interact) (string)** — This identifies the script that is run when the player interacts with the entity. Overwhelmingly, this will be the start of the entity's dialog tree.

**[`on_look`](script_slots#on-look) (string)** — This identifies the script that is run when the player interacts with the entity using the [terminal](terminal) via `look at %ENTITY_NAME%`.

**`primary_id_type`**, **`primary_id`**, and **`secondary_id`** are also available to entities, but you need not assign these properties explicitly within Tiled, since they are determined by the identity of the tile you are placing on the map. (See: [entity types](entity_types))

**`current_animation` (int)** — This lets you set the specific animation for character entities. (`0` is the idle, and will play by default.)

**`current_frame` (int)** — This lets you start an entity's animation at an arbitrary frame. This is useful for staggering entities with identical animation timings.

**`is_glitched` (bool)** — This gets written into a render flag on the "direction" byte. If checked, the entity will appear to be scrambled and glitchy within the MGE.

**`is_debug` (bool)** — This indicates whether the entity is hidden when [debug mode](debug_tools#debug-mode) is off. (While this can be toggled in the hex editor within BMG2020, in practice it will not actually affect anything in-game, as the map is reloaded afresh when debug mode is toggled.)

**`path` (object)** — You can use this property to assign a vector object to an entity. It's primarily used for self-referential reasons: so that you can give multiple entities the same script to walk along a path and have each walk along their own path. (Set the target `geometry` to `%ENTITY_PATH%` in such scripts.)

## Player

The player entity only has one unique property:

**`is_player` (bool)** — This is the entity the player will control within the map. There should be only one such entity per map. (If there is more than one, the encoder will throw an error.)

Without an `is_player` entity:

1. The camera will be positioned with its top-left corner aligned with the top-left corner of the map's coordinate space.
2. The left joystick will control the camera movement.
	- Holding `X` (the run button) will make the camera move faster.
3. The hex editor can still be engaged.
4. Vector view can still be toggled (`XOR` + `MEM0`, or `F1` + `F5` on desktop).
5. [Map loads](map_loads) work, but the camera will remain wherever it was last positioned. (It will not be reset to what is described in #1.)
6. Dialogs referencing the player entity will use a random portrait and the name `MISSING: 253`.
7. Actions targeting the player entity will generally do nothing.
	- If you want to change the player's name via an action (e.g. in your game's main menu), this means you must have an `is_player` entity somewhere on the map.
