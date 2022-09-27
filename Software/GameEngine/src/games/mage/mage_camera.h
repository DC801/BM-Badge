#ifndef MAGE_CAMERA_H
#define MAGE_CAMERA_H

#define PI 3.141592653589793
#include "mage_defines.h"
#include <stdint.h>

class MageCamera
{
public:
   bool    shaking{ false };
   float   shakePhase{ 0 };
   uint8_t shakeAmplitude{ 0 };
   uint8_t followEntityId{ 0 };
   Point   position = { 0,0 };
   Point adjustedCameraPosition = { 0,0 };

   void applyCameraEffects(uint32_t deltaTime);
};

#endif