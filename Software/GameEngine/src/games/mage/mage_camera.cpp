#include "mage_camera.h"

void MageCamera::Update()
{
   if (followEntity)
   {
      Position = Vector2T<int32_t>{ followEntity->center().x - MidScreen.x, followEntity->center().y - MidScreen.y };
   }

   if (shakeAmplitude > 0)
   {
      Position.x += cosf(PI * 2 * shakePhase) * (float)shakeAmplitude;
      Position.y += sinf(PI * 2 * (shakePhase * 2)) * (float)shakeAmplitude;
   }
}