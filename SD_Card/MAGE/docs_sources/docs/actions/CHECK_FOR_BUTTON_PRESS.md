# CHECK_FOR_BUTTON_PRESS

Checks whether a button was actively pressed down that game tick.

That is, the game keeps track of button state changes each game tick, and this action detects whether the target button had a change of state from *not pressed* to *pressed* that game tick. If the target button was *already pressed* when this action runs, this action will not result in a script branch.

To instead check the button's state (regardless of whether that state has changed) see [CHECK_FOR_BUTTON_STATE](../actions/CHECK_FOR_BUTTON_STATE).

NOTE: The button states are reset when a [new map is loaded](../maps/map_loads). If listening for a button press in the new map, this action may very will trigger immediately, even if the button was held down through the map load.

See [button IDs](../structure/button_ids) for a list of valid button values.

## Example JSON

```json
{
  "action": "CHECK_FOR_BUTTON_PRESS",
  "button_id": "SQUARE",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_FOR_BUTTON_PRESS",
  "button_id": "SQUARE",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax#if-and-else) condition statement, e.g.

```mgs
script {
  if (button SQUARE) {}
}
```

### Examples

```mgs
script {
  if button SQUARE then goto successScript;
  if button SQUARE then goto index 12;
  if button SQUARE then goto label labelName;
  if not button SQUARE then goto successScript;
  if not button SQUARE then goto index 12;
  if not button SQUARE then goto label labelName;
}
```

### Dictionary entries

```
if button $button_id:bareword
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if button $button_id:bareword
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if button $button_id:bareword
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if not button $button_id:bareword
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if not button $button_id:bareword
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if not button $button_id:bareword
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
