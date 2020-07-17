meta:
  id: mage_dat
  endian: be
seq:
  - id: identifier
    contents: MAGEGAME
  - id: maps
    type: count_with_offsets
  - id: tilesets
    type: count_with_offsets
  - id: images
    type: count_with_offsets

types:
  count_with_offsets:
    seq:
      - id: count
        type: u2
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
