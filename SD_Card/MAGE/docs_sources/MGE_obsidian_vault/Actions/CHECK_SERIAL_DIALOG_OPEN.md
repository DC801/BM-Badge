# CHECK_SERIAL_DIALOG_OPEN

Checks whether a [[serial dialogs|serial dialog]] is currently awaiting user input, such as a [[serial dialog options|free response question or a multiple choice question]].

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

The [[Conditional Gotos|condition]] portion of this action can be used inside an [[If and Else|if]] condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="target">serial</span> <span class="target">dialog</span> <span class="operator">is</span> <span class="language-constant">open</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="target">serial</span> <span class="target">dialog</span> <span class="operator">is</span> <span class="language-constant">open</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="target">serial</span> <span class="target">dialog</span> <span class="operator">is</span> <span class="language-constant">open</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="target">serial</span> <span class="target">dialog</span> <span class="operator">is</span> <span class="language-constant">open</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
if serial dialog is $expected_bool:boolean
    then goto (script) $success_script:string (;)

if serial dialog is $expected_bool:boolean
    then goto index $jump_index:number (;)

if serial dialog is $expected_bool:boolean
    then goto label $jump_index:bareword (;)
```

---

Back to [[Actions]]
