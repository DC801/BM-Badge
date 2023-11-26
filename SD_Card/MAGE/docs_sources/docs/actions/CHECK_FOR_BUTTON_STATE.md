# CHECK_FOR_BUTTON_STATE

Checks the specific status (pressed or not pressed) of a specific button at that moment.

If checking for whether a button is newly pressed, see [CHECK_FOR_BUTTON_PRESS](../actions/CHECK_FOR_BUTTON_PRESS).

## Example JSON

```json
{
  "action": "CHECK_FOR_BUTTON_STATE",
  "button_id": "SQUARE",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_FOR_BUTTON_STATE",
  "button_id": "SQUARE",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

```mgs
script {
  if (button SQUARE is currently pressed) {}
}
```

### Examples

```mgs
script {
  if button SQUARE is currently pressed then goto successScript;
  if button SQUARE is currently pressed then goto index 12;
  if button SQUARE is currently pressed then goto label labelName;
  if button SQUARE is not currently pressed then goto successScript;
  if button SQUARE is not currently pressed then goto index 12;
  if button SQUARE is not currently pressed then goto label labelName;
}
```

### Dictionary entries

```
if button $button_id:bareword is currently pressed
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if button $button_id:bareword is currently pressed
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if button $button_id:bareword is currently pressed
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if button $button_id:bareword is not currently pressed
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if button $button_id:bareword is not currently pressed
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if button $button_id:bareword is not currently pressed
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```

---

Back to [Actions](../actions)
