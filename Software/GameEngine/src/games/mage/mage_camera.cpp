#include "mage_camera.h"
#include "mage_defines.h"
#include "mage_map.h"
#include "FrameBuffer.h"

void MageCamera::applyEffects(uint32_t deltaTime)
{
   if (followEntityId != NO_PLAYER)
   {
      const auto& followEntityRenderableData = mapControl->getEntityRenderableData(followEntityId);
      const auto midScreen = Point{ DrawWidthHalf, DrawHeightHalf };
      position = followEntityRenderableData.center - midScreen;
   }

   if (shaking)
   {
      position.x += cos(PI * 2 * shakePhase) * (float)shakeAmplitude;
      position.y += sin(PI * 2 * (shakePhase * 2)) * (float)shakeAmplitude;
   }
}