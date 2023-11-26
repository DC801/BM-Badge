# CHECK_SAVE_FLAG

Checks one of the [save flags](../scripts/save_flags) (booleans).

## Example JSON

```json
{
  "action": "CHECK_SAVE_FLAG",
  "expected_bool": true,
  "save_flag": "saveFlagName",
  "success_script": "successScript"
},
{
  "action": "CHECK_SAVE_FLAG",
  "expected_bool": true,
  "jump_index": 12,
  "save_flag": "saveFlagName"
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

```mgs
script {
  if (flag saveFlagName is true) {}
}
```

### Examples

```mgs
script {
  if flag saveFlagName is true then goto successScript;
  if flag saveFlagName is true then goto index 12;
  if flag saveFlagName is true then goto label labelName;
}
```

### Dictionary entries

```
if flag $save_flag:string is $expected_bool:boolean
    then goto (script) $success_script:string (;)

if flag $save_flag:string is $expected_bool:boolean
    then goto index $jump_index:number (;)

if flag $save_flag:string is $expected_bool:boolean
    then goto label $jump_index:bareword (;)
```

---

Back to [Actions](../actions)
