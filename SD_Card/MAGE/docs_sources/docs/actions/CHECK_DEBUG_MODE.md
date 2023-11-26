# CHECK_DEBUG_MODE

Checks whether [debug mode](../debug/debug_mode) is currently on.

## Example JSON

```json
{
  "action": "CHECK_DEBUG_MODE",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_DEBUG_MODE",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

```mgs
script {
  if (debug mode is true) {}
}
```

### Examples

```mgs
script {
  if debug mode is true then goto successScript;
  if debug mode is true then goto index 12;
  if debug mode is true then goto label labelName;
}
```

### Dictionary entries

```
if debug mode is $expected_bool:boolean
    then goto (script) $success_script:string (;)

if debug mode is $expected_bool:boolean
    then goto index $jump_index:number (;)

if debug mode is $expected_bool:boolean
    then goto label $jump_index:bareword (;)
```
