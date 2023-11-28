# Terminal

The terminal interface, new in the chapter 2 version of the Mage Game Engine (MGE), allows a computer to connect to the badge over USB and use it as a serial host.

Some serial [commands](commands) are build in to the MGE by default, but others must be [registered](actions/REGISTER_SERIAL_DIALOG_COMMAND).

[Scripts](scripts) can print serial messages with [serial dialogs](serial_dialogs). These can listen for specific serial input, too, with [serial dialog options](serial_dialog_options).