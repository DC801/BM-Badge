#ifndef _MAGE_INPUT_H
#define _MAGE_INPUT_H

#include <cstdint>
#include <cstring>
#include "mage.h"
#include "mage_hex.h"
#include "../../modules/led.h"
#include "../../modules/keyboard.h"
#include "../../engine/EngineInput.h"

void apply_input_to_player(uint8_t *data);

void apply_input_to_game();

#endif //_MAGE_INPUT_H
