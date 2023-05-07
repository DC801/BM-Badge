meta:
  id: mage_dat
  endian: le
seq:
  - id: identifier
    contents: MAGEGAME
  - id: engine_version
    type: u4
    valid: 6
    doc: If your engine versions mismatch with the ksy version, you are going to have a bad time. This validity check will stop parsing _really early_ if they do not match up.
  - id: dat_file_content_crc32
    type: u4
  - id: dat_file_length
    type: u4
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
  - id: geometry_offsets
    type: count_with_offsets
  - id: script_offsets
    type: count_with_offsets
  - id: portrait_offsets
    type: count_with_offsets
  - id: dialog_offsets
    type: count_with_offsets
  - id: serial_dialog_offsets
    type: count_with_offsets
  - id: image_color_palette_offsets
    type: count_with_offsets
  - id: string_offsets
    type: count_with_offsets
  - id: save_flags_offsets
    type: count_with_offsets
  - id: variables_offsets
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
  - id: geometry
    type: geometry
    repeat: expr
    repeat-expr: geometry_offsets.count
  - id: scripts
    type: script
    repeat: expr
    repeat-expr: script_offsets.count
  - id: portraits
    type: portrait
    repeat: expr
    repeat-expr: portrait_offsets.count
  - id: dialogs
    type: dialog
    repeat: expr
    repeat-expr: dialog_offsets.count
  - id: serial_dialogs
    type: serial_dialog
    repeat: expr
    repeat-expr: serial_dialog_offsets.count
  - id: image_color_palettes
    type: image_color_palette
    repeat: expr
    repeat-expr: image_color_palette_offsets.count
instances:
  strings:
    type: string(_index)
    repeat: expr
    repeat-expr: string_offsets.count
  save_flags:
    type: string(_index)
    repeat: expr
    repeat-expr: save_flags_offsets.count
  variables:
    type: string(_index)
    repeat: expr
    repeat-expr: variables_offsets.count
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
        type: str
        size: 16
        encoding: ASCII
      - id: tile_width
        type: u2
        doc: The width of the map tiles in pixels
      - id: tile_height
        type: u2
        doc: The height of the map tiles in pixels
      - id: cols
        type: u2
        doc: The width of the map, in tiles
      - id: rows
        type: u2
        doc: The height of the map, in tiles
      - id: on_load
        type: u2
        doc: local index to the map's script list
      - id: on_tick
        type: u2
        doc: local index to the map's script list
      - id: on_look
        type: u2
        doc: local index to the map's script list
      - id: layer_count
        type: u1
        doc: The number of layers in this map's tile data
      - id: player_entity_id
        type: u1
        doc: local index to the map's entity list
      - id: entity_count
        type: u2
        doc: The number of entities placed on this map
      - id: geometry_count
        type: u2
        doc: The number of geometry placed on this map
      - id: script_count
        type: u2
        doc: The number of scripts used on this map
      - id: go_direction_count
        type: u1
        doc: the number of items in the directions array
      - id: count_padding
        type: u1
        doc: padding to get back to u2 alignment
      - id: entity_global_ids
        type: u2
        repeat: expr
        repeat-expr: entity_count
        doc: The global IDs of the entities on this map
      - id: geometry_global_ids
        type: u2
        repeat: expr
        repeat-expr: geometry_count
        doc: The global IDs of the geometry on this map
      - id: script_global_ids
        type: u2
        repeat: expr
        repeat-expr: script_count
        doc: The global IDs of the scripts this map and its entities use
      - id: go_directions
        type: go_direction
        repeat: expr
        repeat-expr: go_direction_count
      - id: map_header_padding
        type: u2
        repeat: expr
        repeat-expr: (entity_count + geometry_count + script_count) % 2
        doc: Padding to align things back to uint32_t
      - id: layers
        type: map_layer(cols, rows)
        repeat: expr
        repeat-expr: layer_count
    instances:
      tiles_per_layer:
        value: 'cols * rows'

  go_direction:
    seq:
      - id: name
        type: str
        size: 12
        encoding: ASCII
      - id: script_id
        type: u2
      - id: padding
        type: u2
        doc: to get us back into 16 alignment

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
      is_glitched:
        value: (flags & 0b10000000) != 0
      is_debug:
        value: (flags & 0b01000000) != 0
      flip_x:
        value: (flags & 0b00000100) != 0
      flip_y:
        value: (flags & 0b00000010) != 0
      flip_diag:
        value: (flags & 0b00000001) != 0

  entity_render_flags:
    seq:
      - id: flags
        type: u1
    instances:
      is_glitched:
        value: (flags & 0b10000000) != 0
      is_debug:
        value: (flags & 0b01000000) != 0
      relative_direction:
        value: (flags & 0b00110000) >> 4
      direction:
        value: (flags & 0b00000011)
        enum: direction_type

  tileset:
    seq:
      - id: name
        type: str
        size: 16
        encoding: ASCII
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
      - id: tile_global_geometry_ids
        type: u2
        repeat: expr
        repeat-expr: tile_count
      - id: tileset_footer_padding
        type: u2
        repeat: expr
        repeat-expr: tile_count % 2
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
        type: str
        size: 32
        encoding: ASCII
      - id: padding_a
        type: u1
      - id: padding_b
        type: u1
      - id: portrait_index
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
        type: str
        size: 12
        encoding: ASCII
      - id: x
        type: u2
      - id: y
        type: u2
      - id: on_interact_script_id
        type: u2
        doc: local index to the map's script list
      - id: on_tick_script_id
        type: u2
        doc: local index to the map's script list
      - id: primary_id
        type: u2
        doc: may be: entity_type_id, animation_id, tileset_id
      - id: secondary_id
        type: u2
        doc: if primary_id_type is tileset_id, this is the tile_id, otherwise 0
      - id: primary_id_type
        type: u1
        enum: entity_primary_id_type
      - id: current_animation
        type: u1
      - id: current_frame
        type: u1
      - id: direction
        type:
          switch-on: primary_id_type
          cases:
            'entity_primary_id_type::tileset_id': render_flags
            'entity_primary_id_type::animation_id': render_flags
            'entity_primary_id_type::entity_type_id': entity_render_flags
      - id: path_id
        type: u2
        doc: local index to the map's geometry list
      - id: on_look_script_id
        type: u2
        doc: local index to the map's script list

  geometry:
    seq:
      - id: name
        type: str
        size: 32
        encoding: ASCII
      - id: geometry_type
        type: u1
        enum: geometry_type
      - id: point_count
        type: u1
      - id: segment_count
        type: u1
      - id: padding
        type: u1
      - id: path_length
        type: f4
      - id: points
        type: point
        repeat: expr
        repeat-expr: point_count
      - id: segment_lengths
        type: f4
        repeat: expr
        repeat-expr: segment_count

  point:
    seq:
      - id: x
        type: u2
      - id: y
        type: u2

  script:
    seq:
      - id: name
        type: str
        size: 32
        encoding: ASCII
      - id: action_count
        type: u4
      - id: actions
        type: action
        repeat: expr
        repeat-expr: action_count

  action:
    seq:
      - id: action_type
        type: u1
        enum: action_type
      - id: padding_a
        type: u1
      - id: padding_b
        type: u1
      - id: padding_c
        type: u1
      - id: padding_d
        type: u1
      - id: padding_e
        type: u1
      - id: padding_f
        type: u1
      - id: padding_g
        type: u1

  portrait:
    seq:
      - id: name
        type: str
        size: 32
        encoding: ASCII
      - id: padding_a
        type: u1
      - id: padding_b
        type: u1
      - id: padding_c
        type: u1
      - id: emote_count
        type: u1
      - id: emotes
        type: entity_type_animation_direction
        repeat: expr
        repeat-expr: emote_count

  dialog:
    seq:
      - id: name
        type: str
        size: 32
        encoding: ASCII
      - id: screen_count
        type: u4
      - id: dialog_screens
        type: dialog_screen
        repeat: expr
        repeat-expr: screen_count

  dialog_screen:
    seq:
      - id: name_index
        type: u2
      - id: border_tileset_index
        type: u2
      - id: alignment
        type: u1
        enum: dialog_screen_alignment_type
      - id: font_index
        type: u1
      - id: message_count
        type: u1
      - id: response_type
        type: u1
        enum: dialog_response_type
      - id: response_count
        type: u1
      - id: entity_id
        type: u1
      - id: portrait_id
        type: u1
      - id: emote
        type: u1
      - id: messages
        type: u2
        repeat: expr
        repeat-expr: message_count
      - id: responses
        type: dialog_response
        repeat: expr
        repeat-expr: response_count
      - id: dialog_screen_padding
        type: u2
        repeat: expr
        repeat-expr: (message_count) % 2
        doc: Padding to align things back to uint32_t

  dialog_response:
    seq:
      - id: string_id
        type: u2
      - id: map_local_script_id
        type: u2

  serial_dialog:
    seq:
      - id: name
        type: str
        size: 32
        encoding: ASCII
      - id: string_id
        type: u2
      - id: serial_response_type
        type: u1
        enum: serial_response_type
      - id: response_count
        type: u1
      - id: responses
        type: serial_dialog_response
        repeat: expr
        repeat-expr: response_count

  serial_dialog_response:
    seq:
      - id: string_id
        type: u2
      - id: map_local_script_id
        type: u2

  string:
    params:
      - id: index
        type: u4
    instances:
      offset:
        value: '_parent.string_offsets.offsets[index]'
      char_count:
        value: '_parent.string_offsets.lengths[index]'
      name:
        type: strz
        size: char_count
        encoding: ASCII

  image_color_palette:
    seq:
     - id: name
       type: str
       size: 32
       encoding: ASCII
     - id: color_count
       type: u1
     - id: padding
       type: u1
       doc: Padding to align things back to uint16_t
     - id: colors
       type: image_color
       repeat: expr
       repeat-expr: color_count
     - id: colors_padding
       type: u2
       repeat: expr
       repeat-expr: (color_count + 1) % 2
       doc: Padding to align things back to uint32_t

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
        type: u1
        repeat: expr
        repeat-expr: pixel_count

  image_color:
    seq:
      - id: color_565
        type: u2be
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

  direction_type:
    0: north
    1: east
    2: south
    3: west

  geometry_type:
    0: point
    1: polyline
    2: polygon

  action_type:
    00: null_action
    01: check_entity_name
    02: check_entity_x
    03: check_entity_y
    04: check_entity_interact_script
    05: check_entity_tick_script
    06: check_entity_look_script
    07: check_entity_type
    08: check_entity_primary_id
    09: check_entity_secondary_id
    10: check_entity_primary_id_type
    11: check_entity_current_animation
    12: check_entity_current_frame
    13: check_entity_direction
    14: check_entity_glitched
    15: check_entity_path
    16: check_save_flag
    17: check_if_entity_is_in_geometry
    18: check_for_button_press
    19: check_for_button_state
    20: check_warp_state
    21: run_script
    22: blocking_delay
    23: non_blocking_delay
    24: set_entity_name
    25: set_entity_x
    26: set_entity_y
    27: set_entity_interact_script
    28: set_entity_tick_script
    30: set_entity_type
    31: set_entity_primary_id
    32: set_entity_secondary_id
    33: set_entity_primary_id_type
    34: set_entity_current_animation
    35: set_entity_current_frame
    36: set_entity_direction
    37: set_entity_direction_relative
    38: set_entity_direction_target_entity
    39: set_entity_direction_target_geometry
    40: set_entity_glitched
    41: set_entity_path
    42: set_save_flag
    43: set_player_control
    44: set_map_tick_script
    45: set_hex_cursor_location
    46: set_warp_state
    47: set_hex_editor_state
    48: set_hex_editor_dialog_mode
    49: set_hex_editor_control
    50: set_hex_editor_control_clipboard
    51: load_map
    52: show_dialog
    53: play_entity_animation
    54: teleport_entity_to_geometry
    55: walk_entity_to_geometry
    56: walk_entity_along_geometry
    57: loop_entity_along_geometry
    58: set_camera_to_follow_entity
    59: teleport_camera_to_geometry
    60: pan_camera_to_entity
    61: pan_camera_to_geometry
    62: pan_camera_along_geometry
    63: loop_camera_along_geometry
    64: set_screen_shake
    65: screen_fade_out
    66: screen_fade_in
    67: mutate_variable
    68: mutate_variables
    69: copy_variable
    70: check_variable
    71: check_variables
    72: slot_save
    73: slot_load
    74: slot_erase
    75: set_connect_serial_dialog
    76: show_serial_dialog
    77: inventory_get
    78: inventory_drop
    79: check_inventory
    80: set_map_look_script
    81: set_entity_look_script
    82: set_teleport_enabled
    83: check_map
    84: set_ble_flag
    85: check_ble_flag
    86: set_serial_dialog_control
    87: register_serial_dialog_command
    88: register_serial_dialog_command_argument
    89: unregister_serial_dialog_command
    90: unregister_serial_dialog_command_argument

  dialog_screen_alignment_type:
    0: bottom_left
    1: bottom_right
    2: top_left
    3: top_right
    4: bottom_left_with_name
    5: bottom_right_with_name
    6: top_left_with_name
    7: top_right_with_name

  dialog_response_type:
    0: no_response
    1: select_from_short_list
    2: select_from_long_list
    3: enter_number
    4: enter_alphanumeric

  serial_response_type:
    0: response_none
    1: response_enter_number
    2: response_enter_string
