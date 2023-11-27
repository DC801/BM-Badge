# CHECK_WARP_STATE

Checks whether the [warp state string](../scripts/variables#warp_state) is a specific value.

## Example JSON

```json
{
  "action": "CHECK_WARP_STATE",
  "expected_bool": true,
  "string": "some kind of string",
  "success_script": "successScript"
},
{
  "action": "CHECK_WARP_STATE",
  "expected_bool": true,
  "jump_index": 12,
  "string": "some kind of string"
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax#if-and-else) condition statement, e.g.

```mgs
script {
  if (warp state is "some kind of string") {}
}
```

### Examples

```mgs
script {
  if warp state is "some kind of string" then goto successScript;
  if warp state is "some kind of string" then goto index 12;
  if warp state is "some kind of string" then goto label labelName;
  if warp state is not "some kind of string" then goto successScript;
  if warp state is not "some kind of string" then goto index 12;
  if warp state is not "some kind of string" then goto label labelName;
}
```

### Dictionary entries

```
if warp state is $string:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if warp state is $string:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if warp state is $string:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if warp state is not $string:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if warp state is not $string:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if warp state is not $string:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
