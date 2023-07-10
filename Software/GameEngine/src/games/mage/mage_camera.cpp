#include "mage_camera.h"
#include "mage_defines.h"
#include "mage_map.h"
#include "FrameBuffer.h"

void MageCamera::applyEffects(uint32_t deltaTime)
{
   if (followEntityId  != NO_PLAYER_INDEX)
   {
      const auto& followEntityRenderableData = mapControl->getEntityRenderableData(followEntityId);
      const auto midScreen = Point{ DrawWidth / 2, DrawHeight / 2 };
      position = followEntityRenderableData.center - midScreen;
   }

   if (shaking)
   {
      position.x += cosf(PI * 2 * shakePhase) * (float)shakeAmplitude;
      position.y += sinf(PI * 2 * (shakePhase * 2)) * (float)shakeAmplitude;
   }
}