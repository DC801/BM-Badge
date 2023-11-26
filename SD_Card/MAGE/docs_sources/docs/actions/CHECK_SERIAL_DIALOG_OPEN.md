# CHECK_SERIAL_DIALOG_OPEN

Checks whether a [serial dialog](../dialogs/serial_dialogs) is currently awaiting user input, such as a [free response question or a multiple choice question](../serial dialog options).

## Example JSON

```json
{
  "action": "CHECK_SERIAL_DIALOG_OPEN",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_SERIAL_DIALOG_OPEN",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

```mgs
script {
  if (serial dialog is open) {}
}
```

### Examples

```mgs
script {
  if serial dialog is open then goto successScript;
  if serial dialog is open then goto index 12;
  if serial dialog is open then goto label labelName;
}
```

### Dictionary entries

```
if serial dialog is $expected_bool:boolean
    then goto (script) $success_script:string (;)

if serial dialog is $expected_bool:boolean
    then goto index $jump_index:number (;)

if serial dialog is $expected_bool:boolean
    then goto label $jump_index:bareword (;)
```

---

Back to [Actions](../actions)
