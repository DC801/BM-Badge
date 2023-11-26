# GOTO_ACTION_INDEX

Jumps to the action at the given [label](../mgs/advanced_syntax/labels) ([bareword](../mgs/variables/bareword)) or action index ([number](../mgs/variables/number)). All jumps are made within the current [script](../scripts).

The index (number) variant is not recommended for manual use, as `COPY_SCRIPT` and procedural syntax expansion can make action indices impossible to predetermine.

The keyword `return` uses this action to jump to the end of the current script (i.e. "return early").

## Example JSON

```json
{
  "action": "GOTO_ACTION_INDEX",
  "action_index": 12
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
goto index $action_index:number (;)

goto label $action_index:bareword (;)
```

---

Back to [Actions](../actions)
