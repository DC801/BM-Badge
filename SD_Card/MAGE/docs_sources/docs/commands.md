---
tags: [ 'alias', 'aliases', 'register', 'unregister' ]
---

# Commands

Commands can be [registered](actions/REGISTER_SERIAL_DIALOG_COMMAND), after which the player can type the command verb into the serial [terminal](terminal) to run a script.

The command HELP, available by default, will list all commands that are currently registered unless they are [hidden](actions/SET_SERIAL_DIALOG_COMMAND_VISIBILITY). Command aliases (e.g. `i` for `inventory`) are not included in the HELP list.

#expandme

## Relevant actions

- [REGISTER_SERIAL_DIALOG_COMMAND](actions/REGISTER_SERIAL_DIALOG_COMMAND)
- [UNREGISTER_SERIAL_DIALOG_COMMAND](actions/UNREGISTER_SERIAL_DIALOG_COMMAND)
- [REGISTER_SERIAL_DIALOG_COMMAND_ALIAS](actions/REGISTER_SERIAL_DIALOG_COMMAND_ALIAS)
- [UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS](actions/UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS)
- [SET_SERIAL_DIALOG_COMMAND_VISIBILITY](actions/SET_SERIAL_DIALOG_COMMAND_VISIBILITY)
