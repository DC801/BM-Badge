# PAN_CAMERA_TO_ENTITY

Pans the camera to an [entity](../entities). Afterward, the camera will follow that entity.

NOTE: if the entity is moving while the camera is coming closer, the camera will speed up or slow down to reach the entity at the correct time.

## Example JSON

```json
{
  "action": "PAN_CAMERA_TO_ENTITY",
  "duration": 1000,
  "entity": "Entity Name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">pan</span> <span class="target">camera</span> <span class="">to</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="">over</span> <span class="number">1000ms</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
pan camera to entity $entity:string over $duration:duration (;)
```

---

Back to [Actions](../actions)
