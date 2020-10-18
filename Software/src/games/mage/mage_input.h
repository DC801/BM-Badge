#ifndef _MAGE_INPUT_H
#define _MAGE_INPUT_H

#include <cstdint>
#include <cstring>
#include "mage.h"
#include "mage_hex.h"
#include "modules/led.h"
#include "modules/keyboard.h"
#include "engine/EngineInput.h"

extern std::unique_ptr<MageRom> MageROM;
extern MageEntity *hackableDataAddress;

void apply_input_to_player();

void apply_input_to_game();

#endif //_MAGE_INPUT_H
