# CHECK_WARP_STATE

Checks whether the [warp state string](scripts/warp_state) is a specific value.

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

The [condition](actions/conditional_gotos) portion of this action can be used inside an [if](mgs/advanced_syntax/if_and_else) condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="target">warp</span> <span class="target">state</span> <span class="operator">is</span> <span class="string">"some kind of string"</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="target">warp</span> <span class="target">state</span> <span class="operator">is</span> <span class="string">"some kind of string"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="target">warp</span> <span class="target">state</span> <span class="operator">is</span> <span class="string">"some kind of string"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="target">warp</span> <span class="target">state</span> <span class="operator">is</span> <span class="string">"some kind of string"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="target">warp</span> <span class="target">state</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">"some kind of string"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="target">warp</span> <span class="target">state</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">"some kind of string"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="target">warp</span> <span class="target">state</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">"some kind of string"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

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

---

Back to [Actions](actions)
