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

### Example

```mgs
script {
  pan camera to entity "Entity Name" over 1000ms;
}
```

### Dictionary entry

```
pan camera to entity $entity:string over $duration:duration (;)
```
