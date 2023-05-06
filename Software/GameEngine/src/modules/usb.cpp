// Note to self: No part of this file should be ifdef'd in or out
// to make the Desktop build possible - the whole thing should
// just not be included, because we'll need a completely different
// implementation for Desktop. Instead, this file's "handler"
// functions should call "Command handling" methods defined in
// "mage_text_commands.cpp", and the desktop interface will call
// those same methods as well, but only when "enter" is pressed.

#include "usb.h"