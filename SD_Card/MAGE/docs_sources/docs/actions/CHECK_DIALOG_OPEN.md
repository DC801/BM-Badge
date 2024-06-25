# CHECK_DIALOG_OPEN

Checks whether a [dialog](../dialogs) is currently open.

## Example JSON

```json
{
  "action": "CHECK_DIALOG_OPEN",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_DIALOG_OPEN",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax#if-and-else) condition statement, e.g.

```mgs
script {
  if (dialog is open) {}
}
```

### Examples

```mgs
script {
  if dialog is open then goto successScript;
  if dialog is open then goto index 12;
  if dialog is open then goto label labelName;
}
```

### Dictionary entries

```
if dialog is $expected_bool:boolean
    then goto (script) $success_script:string (;)

if dialog is $expected_bool:boolean
    then goto index $jump_index:number (;)

if dialog is $expected_bool:boolean
    then goto label $jump_index:bareword (;)
```
