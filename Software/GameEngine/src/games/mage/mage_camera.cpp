#include "mage_camera.h"
#include "mage_defines.h"
#include "mage_map.h"
#include "FrameBuffer.h"

static constexpr const EntityPoint midScreen = EntityPoint{ DrawWidth / 2, DrawHeight / 2 };

void MageCamera::applyEffects(uint32_t deltaTime)
{
   if (followEntityId  != NO_PLAYER_INDEX)
   {
      position = mapControl->getEntityRenderableData(followEntityId).center;
   }

   if (shaking)
   {
      position.x += cosf(PI * 2 * shakePhase) * (float)shakeAmplitude;
      position.y += sinf(PI * 2 * (shakePhase * 2)) * (float)shakeAmplitude;
   }
}