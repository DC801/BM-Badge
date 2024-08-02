---
tags: [ 'alias', 'aliases', 'register', 'unregister', 'command', 'verb', 'argument', 'arguments' ]
---

# Commands

Commands can be [registered](actions/REGISTER_SERIAL_DIALOG_COMMAND), after which the player can type the command into the serial [terminal](terminal) to run a script.

The first word is considered to be the command itself, a.k.a. the **verb**. Everything afterward is considered to be the command's **argument**. (You may register a script to be run in the event a command is attempted with an invalid argument.)

All custom command registrations are lost upon a map load.

## MGE Command Interpretation

- Words are split by whitespace when interpreted. The number of spaces does not matter. `GO      NORTH` is equivalent to `GO NORTH`.
- Case is ignored. `go north` is equivalent to `GO NORTH` (and `gO nOrTh`).
- The second word in a command is ignored if it is "AT" or "TO". `LOOK AT BOB` is equivalent to `LOOK BOB`
- Non-ASCII characters are not explicitly handled, so the MGE may interpret complex characters as one (or more) entirely different characters.

## Default Commands

These commands are built into the MGE.

Importantly, none of these default command words are reserved, so you may register custom arguments, e.g. `GO DENNIS` for a map without a "DENNIS" exit. Just know that these custom registrations will not appear in the list of exits provided by LOOK.

### Universal

- **HELP**: lists all commands that are currently registered, excluding:
    - Commands that have been [hidden](actions/SET_SERIAL_DIALOG_COMMAND_VISIBILITY)
    - Command aliases (e.g. `I` for `INVENTORY`)

### Per Map

A map's exits and script slots are defined in the map's [`maps.json` definition](mage_folder#maps-json).

- **LOOK**: runs the map's `on_look` script, and prints the names of exits associated with that map.
- **LOOK + entity's current name**: runs the script in that entity's `on_look` slot.
- **GO + name of one of the map's exits**: runs the script associated with that exit name.
    - Abbreviations of the cardinal directions are built into GO, so `GO N` will try to run `GO NORTH`. This also applies to the diagonals, e.g. `GO SW` for `GO SOUTHWEST`.

## Relevant actions

- [REGISTER_SERIAL_DIALOG_COMMAND](actions/REGISTER_SERIAL_DIALOG_COMMAND)
- [UNREGISTER_SERIAL_DIALOG_COMMAND](actions/UNREGISTER_SERIAL_DIALOG_COMMAND)
- [REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT](actions/REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT)
- [UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT](actions/UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT)
- [REGISTER_SERIAL_DIALOG_COMMAND_ALIAS](actions/REGISTER_SERIAL_DIALOG_COMMAND_ALIAS)
- [UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS](actions/UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS)
- [SET_SERIAL_DIALOG_COMMAND_VISIBILITY](actions/SET_SERIAL_DIALOG_COMMAND_VISIBILITY)
