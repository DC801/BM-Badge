meta:
  id: mage_dat
  endian: be
seq:
  - id: identifier
    contents: MAGEGAME
  - id: map_offsets
    type: count_with_offsets
  - id: tileset_offsets
    type: count_with_offsets
  - id: animation_offsets
    type: count_with_offsets
  - id: entity_type_offsets
    type: count_with_offsets
  - id: entity_offsets
    type: count_with_offsets
  - id: image_offsets
    type: count_with_offsets
  - id: maps
    type: map
    repeat: expr
    repeat-expr: map_offsets.count
  - id: tilesets
    type: tileset
    repeat: expr
    repeat-expr: tileset_offsets.count
  - id: animations
    type: animation
    repeat: expr
    repeat-expr: animation_offsets.count
  - id: entity_types
    type: entity_type
    repeat: expr
    repeat-expr: entity_type_offsets.count
  - id: entites
    type: entity
    repeat: expr
    repeat-expr: entity_offsets.count
instances:
  images:
    type: image(_index)
    repeat: expr
    repeat-expr: image_offsets.count

types:
  count_with_offsets:
    seq:
      - id: count
        type: u4
        doc: The number of items of type the file
      - id: offsets
        type: u4
        repeat: expr
        repeat-expr: count
        doc: The offsets of items in bytes from the start of the file
      - id: lengths
        type: u4
        repeat: expr
        repeat-expr: count
        doc: The lengths of items in bytes from the start of the offset

  map:
    seq:
      - id: name
        type: strz
        size: 16
        encoding: UTF8
      - id: tile_width
        type: u2
        doc: The width of the map tiles in pixels
      - id: tile_height
        type: u2
        doc: The height of the map tiles in pixels
      - id: width
        type: u2
        doc: The width of the map, in tiles
      - id: height
        type: u2
        doc: The height of the map, in tiles
      - id: layer_count
        type: u1
        doc: The number of layers in this map's tile data
      - id: padding
        type: u1
      - id: entity_count
        type: u2
        doc: The number of entities placed on this map
      - id: entity_global_ids
        type: u2
        repeat: expr
        repeat-expr: entity_count
        doc: The global IDs of the tilesets this map's tiles use
      - id: map_header_padding
        type: u2
        repeat: expr
        repeat-expr: (entity_count + 4) % 2
        doc: Padding to align things back to uint32_t
      - id: layers
        type: map_layer(width, height)
        repeat: expr
        repeat-expr: layer_count
    instances:
      tiles_per_layer:
        value: 'width * height'

  map_layer:
    params:
      - id: width
        type: u2
      - id: height
        type: u2
    seq:
      - id: tiles
        type: map_tile
        repeat: expr
        repeat-expr: tiles_per_layer
    instances:
      tiles_per_layer:
        value: 'width * height'

  map_tile:
    seq:
      - id: tile_id
        type: u2
      - id: map_tileset_id
        type: u1
      - id: render_flags
        type: render_flags

  render_flags:
    seq:
      - id: flags
        type: u1
    instances:
      flip_x:
        value: (flags & 0b00000100) != 0
      flip_y:
        value: (flags & 0b00000010) != 0
      flip_diag:
        value: (flags & 0b00000001) != 0

  tileset:
    seq:
      - id: name
        type: strz
        size: 16
        encoding: UTF8
      - id: image_id
        type: u2
      - id: image_width
        type: u2
      - id: image_height
        type: u2
      - id: tile_width
        type: u2
      - id: tile_height
        type: u2
      - id: cols
        type: u2
      - id: rows
        type: u2
      - id: padding
        type: u2
      - id: tiles
        type: u1
        repeat: expr
        repeat-expr: tile_count
      - id: tileset_footer_padding
        type: u1
        repeat: expr
        repeat-expr: (4 - (tile_count % 4)) % 4
        doc: Padding bytes to get things back to uint32_t alignment
    instances:
      tile_count:
        value: cols * rows

  animation:
    seq:
      - id: tileset_id
        type: u2
      - id: frame_count
        type: u2
      - id: animation_frames
        type: animation_frame
        repeat: expr
        repeat-expr: frame_count

  animation_frame:
    seq:
      - id: tile_id
        type: u2
      - id: duration
        type: u2

  entity_type:
    seq:
      - id: name
        type: strz
        size: 16
        encoding: UTF8
      - id: padding_a
        type: u1
      - id: padding_b
        type: u1
      - id: padding_c
        type: u1
      - id: animation_count
        type: u1
      - id: entity_type_animations
        type: entity_type_animation
        repeat: expr
        repeat-expr: animation_count

  entity_type_animation:
    seq:
      - id: north
        type: entity_type_animation_direction
      - id: east
        type: entity_type_animation_direction
      - id: south
        type: entity_type_animation_direction
      - id: west
        type: entity_type_animation_direction

  entity_type_animation_direction:
    seq:
      - id: type_id
        type: u2
      - id: type
        type: u1
        doc: if value is 0, type_id is the ID of an animation. If value is not 0, type is now a lookup on the tileset table, and type_id is the ID of the tile on that tileset
      - id: render_flags
        type: render_flags

  entity:
    seq:
      - id: name
        type: strz
        size: 16
        encoding: UTF8
      - id: primary_id
        type: u2
        doc: may be: entity_type_id, animation_id, tileset_id
      - id: secondary_id
        type: u2
        doc: if primary_id_type is tileset_id, this is the tile_id, otherwise 0
      - id: script_id
        type: u2
      - id: x
        type: u2
      - id: y
        type: u2
      - id: primary_id_type
        type: u1
        enum: entity_primary_id_type
      - id: current_animation
        type: u1
      - id: current_frame
        type: u1
      - id: direction
        type: u1
      - id: hackable_state
        type: u1
      - id: padding
        type: u1

  image:
    params:
      - id: index
        type: u4
    instances:
      offset:
        value: '_parent.image_offsets.offsets[index]'
      pixel_count:
        value: '_parent.image_offsets.lengths[index] / 2'
      colors:
        pos: offset
        type: image_color
        repeat: expr
        repeat-expr: pixel_count

  image_color:
    seq:
      - id: color_565
        type: u2
    instances:
      r:
        value: '(color_565 & 0b1111100000000000) >> 11'
      g:
        value: '(color_565 & 0b0000011111000000) >> 6'
      b:
        value: '(color_565 & 0b0000000000011111)'
      a:
        value: '(color_565 & 0b0000000000100000 ^ 0b0000000000100000) >> 5'

enums:
  entity_primary_id_type:
    0: tileset_id
    1: animation_id
    2: entity_type_id
