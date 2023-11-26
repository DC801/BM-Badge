# CHECK_DEBUG_MODE

Checks whether [debug mode](debug/debug_mode) is currently on.

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

The [condition](actions/conditional_gotos) portion of this action can be used inside an [if](mgs/advanced_syntax/if_and_else) condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="target">debug</span> <span class="target">mode</span> <span class="operator">is</span> <span class="language-constant">true</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="target">debug</span> <span class="target">mode</span> <span class="operator">is</span> <span class="language-constant">true</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="target">debug</span> <span class="target">mode</span> <span class="operator">is</span> <span class="language-constant">true</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="target">debug</span> <span class="target">mode</span> <span class="operator">is</span> <span class="language-constant">true</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
if debug mode is $expected_bool:boolean
    then goto (script) $success_script:string (;)

if debug mode is $expected_bool:boolean
    then goto index $jump_index:number (;)

if debug mode is $expected_bool:boolean
    then goto label $jump_index:bareword (;)
```

---

Back to [Actions](actions)
