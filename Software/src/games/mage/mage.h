#ifndef _MAGE_H
#define _MAGE_H

#include "mage_defines.h"
#include "mage_game_control.h"
#include "FrameBuffer.h"

//this is called in the main game loop, and is responsible for
//updating the game state based on all inputs.
void MageGameLoop();

//this runs the actual game, preformining initial setup and then
//running the game loop indefinitely until the game is exited.
void MAGE();

#endif //_MAGE_H