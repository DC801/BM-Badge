# TELEPORT_CAMERA_TO_GEOMETRY

Moves the camera to the first vertex of the specified [geometry object](../maps/vector_objects).

## Example JSON

```json
{
  "action": "TELEPORT_CAMERA_TO_GEOMETRY",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example

```mgs
script {
  teleport camera to geometry "vector object name";
}
```

### Dictionary entry

```
teleport camera to geometry $geometry:string (;)
```
