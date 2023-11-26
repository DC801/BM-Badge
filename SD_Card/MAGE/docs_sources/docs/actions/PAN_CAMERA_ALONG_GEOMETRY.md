# PAN_CAMERA_ALONG_GEOMETRY

(might not work yet — instead, make a [null entity](../entities/null_entity) and lock the camera to it)

## Example JSON

```json
{
  "action": "PAN_CAMERA_ALONG_GEOMETRY",
  "duration": 1000,
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example

```mgs
script {
  pan camera along geometry "vector object name" over 1000ms;
}
```

### Dictionary entry

```
pan camera along geometry $geometry:string over $duration:duration (;)
```
