# SLOT_SAVE

This action saves the [game state](../variables#save_data) into the current slot (the last slot loaded).

It is not possible to write save data into an arbitrary slots, nor is it possible to copy data from one save slot into another.

## Example JSON

```json
{
  "action": "SLOT_SAVE"
}
```

## MGS Natlang

### Example

```mgs
script {
  save slot;
}
```

### Dictionary entry

```
save slot (;)
```
