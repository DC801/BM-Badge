# SET_CAMERA_TO_FOLLOW_ENTITY

Sets what the camera is following. ([[%PLAYER%]] is the default.)

## Example JSON

```json
{
  "action": "SET_CAMERA_TO_FOLLOW_ENTITY",
  "entity": "Entity Name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">make</span> <span class="target">camera</span> <span class="">follow</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
make camera follow entity $entity:string (;)
```

---

Back to [[Actions]]
