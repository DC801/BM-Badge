//
//  hcrn.c
//  DC801
//
//  Created by Professor Plum on 3/6/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//
#include "GameEngine.h"
#include "Audio.h"

int HCRN()
{
    audio.loop("AUDIO/Movement/Vehicles/sfx_vehicle_plainloop.wav", 0.05);
    game.run();
    return 0;
}
