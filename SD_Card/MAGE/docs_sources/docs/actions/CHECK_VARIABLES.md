# CHECK_VARIABLES

Compares the value of a [variable](scripts/integer_variables) against another.

`==` is assumed if no [operator](mgs/variables/operator) is given.

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

The [condition](actions/conditional_gotos) portion of this action can be used inside an [if](mgs/advanced_syntax/if_and_else) condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="operator"><</span> <span class="string">otherVar</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="operator"><</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="operator"><</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="operator"><</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span>
  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span>
  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span>
  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="operator">not</span> <span class="operator"><</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="operator">not</span> <span class="operator"><</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="operator">not</span> <span class="operator"><</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">otherVar</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

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

---

Back to [Actions](actions)
