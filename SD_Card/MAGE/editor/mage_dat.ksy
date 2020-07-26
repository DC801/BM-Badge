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
      - id: tileset_count
        type: u1
        doc: The number of tilesets this map's tile use
      - id: tileset_global_ids
        type: u2
        repeat: expr
        repeat-expr: tileset_count
        doc: The global IDs of the tilesets this map's tiles use
      - id: tileset_global_ids_padding
        type: u2
        repeat: expr
        repeat-expr: ((tileset_count + 1) % 4)
        doc: Padding to align things back to uint32_t
      - id: tiles
        type: map_tile
        repeat: expr
        repeat-expr: tiles_per_layer * layer_count
    instances:
      tiles_per_layer:
        value: 'width * height'

  map_tile:
    seq:
      - id: tile_id
        type: u2
      - id: map_tileset_index
        type: u1
      - id: tile_flags
        type: u1
    instances:
      flip_x:
        value: '(tile_flags & 0b00000100) != 0'
      flip_y:
        value: '(tile_flags & 0b00000010) != 0'
      flip_diag:
        value: '(tile_flags & 0b00000001) != 0'

  tileset:
    seq:
      - id: name
        type: strz
        size: 16
        encoding: UTF8
      - id: image_index
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
      - id: tileset_header_padding
        type: u2
        doc: Padding bytes to get things back to uint32_t alignment
      - id: tiles
        type: str
        size: 1
        encoding: ASCII
        repeat: expr
        repeat-expr: tile_count
      - id: tileset_footer_padding
        type: u1
        repeat: expr
        repeat-expr: 4 - (tile_count % 4)
        doc: Padding bytes to get things back to uint32_t alignment
    instances:
      tile_count:
        value: 'cols * rows'

  image:
    params:
      - id: i               # => receive `_index` as `i` here
        type: s4
    instances:
      offset:
        value: '_parent.image_offsets.offsets[i]'
      pixel_count:
        value: '_parent.image_offsets.lengths[i] / 2'
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
