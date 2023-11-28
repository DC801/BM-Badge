# SLOT_ERASE

This action clears all the [save data](../variables#save_data) in the given slot.

## Example JSON

```json
{
  "action": "SLOT_ERASE",
  "slot": 2
}
```

## MGS Natlang

### Example

```mgs
script {
  erase slot 2;
}
```

### Dictionary entry

```
erase slot $slot:number (;)
```