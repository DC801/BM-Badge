#include "mage_camera.h"
#include "mage_defines.h"
#include "mage_map.h"
#include "FrameBuffer.h"

void MageCamera::applyEffects(uint32_t deltaTime)
{
   if (followEntityId != NO_PLAYER)
   {
      auto followEntity = mapControl->getEntity(followEntityId);
      const auto midScreen = Point{ HALF_WIDTH, HALF_HEIGHT };
      position = followEntity->getRenderableData()->center - midScreen;
   }

   if (shaking)
   {
      position.x += cos(PI * 2 * shakePhase) * (float)shakeAmplitude;
      position.y += sin(PI * 2 * (shakePhase * 2)) * (float)shakeAmplitude;
   }
}