# CHECK_VARIABLE

Compares the value of a [variable](../scripts/variables#integer-variables) against the given value.

`==` is assumed if no [operator](../mgs/variables_mgs#operator) is given.

## Example JSON

```json
{
  "action": "CHECK_VARIABLE",
  "comparison": "==",
  "expected_bool": true,
  "success_script": "successScript",
  "value": 1,
  "variable": "varName"
},
{
  "action": "CHECK_VARIABLE",
  "comparison": "==",
  "expected_bool": true,
  "jump_index": 12,
  "value": 1,
  "variable": "varName"
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax#if-and-else) condition statement, e.g.

```mgs
script {
  if (variable varName is < 1) {}
}
```

### Examples

```mgs
script {
  if variable varName is < 1 then goto successScript;
  if variable varName is < 1 then goto index 12;
  if variable varName is < 1 then goto label labelName;
  if variable varName is 1 then goto successScript;
  if variable varName is 1 then goto index 12;
  if variable varName is 1 then goto label labelName;
  if variable varName is not < 1 then goto successScript;
  if variable varName is not < 1 then goto index 12;
  if variable varName is not < 1 then goto label labelName;
  if variable varName is not 1 then goto successScript;
  if variable varName is not 1 then goto index 12;
  if variable varName is not 1 then goto label labelName;
}
```

### Dictionary entries

```
if variable $variable:string is $comparison:operator $value:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if variable $variable:string is $comparison:operator $value:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if variable $variable:string is $comparison:operator $value:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if variable $variable:string is $value:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true
	// built-in value: comparison = ==

if variable $variable:string is $value:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true
	// built-in value: comparison = ==

if variable $variable:string is $value:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true
	// built-in value: comparison = ==

if variable $variable:string is not $comparison:operator $value:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if variable $variable:string is not $comparison:operator $value:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if variable $variable:string is not $comparison:operator $value:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false

if variable $variable:string is not $value:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false
	// built-in value: comparison = ==

if variable $variable:string is not $value:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false
	// built-in value: comparison = ==

if variable $variable:string is not $value:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
	// built-in value: comparison = ==
```
