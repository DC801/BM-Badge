#include "mage_camera.h"
#include "mage_defines.h"
#include "mage_entity.h"
#include "FrameBuffer.h"

static constexpr const EntityPoint midScreen = EntityPoint{ DrawWidth / 2, DrawHeight / 2 };

void MageCamera::applyEffects()
{
   if (followEntity)
   {
      positionX = followEntity->center().x;
      positionY = followEntity->center().y;
   }

   if (shaking)
   {
      positionX += cosf(PI * 2 * shakePhase) * (float)shakeAmplitude;
      positionY += sinf(PI * 2 * (shakePhase * 2)) * (float)shakeAmplitude;
   }
}