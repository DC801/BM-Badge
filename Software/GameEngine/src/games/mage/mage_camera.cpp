#include "mage_camera.h"
#include "mage_defines.h"
#include "mage_entity.h"
#include "FrameBuffer.h"

static constexpr const EntityPoint midScreen = EntityPoint{ DrawWidth / 2, DrawHeight / 2 };

void MageCamera::applyEffects()
{
   if (followEntity)
   {
      position = followEntity->center();// EntityPoint{ uint16_t(renderableData.origin.x + renderableData.hitBox.w / 2),uint16_t(renderableData.origin.y + renderableData.hitBox.h / 2) };
   }

   if (shaking)
   {
      position.x += cosf(PI * 2 * shakePhase) * (float)shakeAmplitude;
      position.y += sinf(PI * 2 * (shakePhase * 2)) * (float)shakeAmplitude;
   }
}