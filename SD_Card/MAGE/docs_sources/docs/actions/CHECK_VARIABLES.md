# CHECK_VARIABLES

Compares the value of a [variable](../scripts/integer_variables) against another.

`==` is assumed if no [operator](../mgs/variables/operator) is given.

## Example JSON

```json
{
  "action": "CHECK_VARIABLES",
  "comparison": "==",
  "expected_bool": true,
  "source": "otherVar",
  "success_script": "successScript",
  "variable": "varName"
},
{
  "action": "CHECK_VARIABLES",
  "comparison": "==",
  "expected_bool": true,
  "jump_index": 12,
  "source": "otherVar",
  "variable": "varName"
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

```mgs
script {
  if (variable varName is < otherVar) {}
}
```

### Examples

```mgs
script {
  if variable varName is < otherVar then goto successScript;
  if variable varName is < otherVar then goto index 12;
  if variable varName is < otherVar then goto label labelName;
  if variable varName is otherVar then goto successScript
  if variable varName is otherVar then goto index 12
  if variable varName is otherVar then goto label labelName
  if variable varName is not < otherVar then goto successScript;
  if variable varName is not < otherVar then goto index 12;
  if variable varName is not < otherVar then goto label labelName;
  if variable varName is not otherVar then goto successScript;
  if variable varName is not otherVar then goto index 12;
  if variable varName is not otherVar then goto label labelName;
}
```

### Dictionary entries

```
if variable $variable:string is $comparison:operator $source:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if variable $variable:string is $comparison:operator $source:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if variable $variable:string is $comparison:operator $source:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if variable $variable:string is $source:string
    then goto (script) $success_script:string
	// built-in value: expected_bool = true
	// built-in value: comparison = ==

if variable $variable:string is $source:string
    then goto index $jump_index:number
	// built-in value: expected_bool = true
	// built-in value: comparison = ==

if variable $variable:string is $source:string
    then goto label $jump_index:bareword
	// built-in value: expected_bool = true
	// built-in value: comparison = ==

if variable $variable:string is not $comparison:operator $source:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if variable $variable:string is not $comparison:operator $source:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if variable $variable:string is not $comparison:operator $source:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false

if variable $variable:string is not $source:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false
	// built-in value: comparison = ==

if variable $variable:string is not $source:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false
	// built-in value: comparison = ==

if variable $variable:string is not $source:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
	// built-in value: comparison = ==
```
