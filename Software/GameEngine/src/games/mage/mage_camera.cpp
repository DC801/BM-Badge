#include "mage_camera.h"
#include "mage_game_control.h"
#include "mage_defines.h"
#include "FrameBuffer.h"


void MageCamera::applyCameraEffects(uint32_t deltaTime)
{
   adjustedCameraPosition.x = position.x;
   adjustedCameraPosition.y = position.y;
   if (shaking)
   {
      adjustedCameraPosition.x += cos(PI * 2 * shakePhase) * (float)shakeAmplitude;
      adjustedCameraPosition.y += sin(PI * 2 * (shakePhase * 2)) * (float)shakeAmplitude;
   }
}