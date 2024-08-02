# PAN_CAMERA_TO_GEOMETRY

Pans the camera to the first vertex of a [geometry object](../vector_objects).

## Example JSON

```json
{
  "action": "PAN_CAMERA_TO_GEOMETRY",
  "duration": 1000,
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example

```mgs
script {
  pan camera to geometry "vector object name" over 1000ms;
}
```

### Dictionary entry

```
pan camera to geometry $geometry:string over $duration:duration (;)
```
