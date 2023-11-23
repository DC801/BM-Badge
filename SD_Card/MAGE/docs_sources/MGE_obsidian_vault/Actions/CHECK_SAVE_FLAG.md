# CHECK_SAVE_FLAG

Checks one of the [[save flags]] (booleans).

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

The [[Conditional Gotos|condition]] portion of this action can be used inside an [[If and Else|if]] condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">flag</span> <span class="string">saveFlagName</span> <span class="operator">is</span> <span class="language-constant">true</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">flag</span> <span class="string">saveFlagName</span> <span class="operator">is</span> <span class="language-constant">true</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">flag</span> <span class="string">saveFlagName</span> <span class="operator">is</span> <span class="language-constant">true</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
if flag $save_flag:string is $expected_bool:boolean
    then goto (script) $success_script:string (;)

if flag $save_flag:string is $expected_bool:boolean
    then goto index $jump_index:number (;)
```

---

Back to [[Actions]]
