#include "mage_camera.h"
#include "mage_defines.h"
#include "mage_entity.h"
#include "FrameBuffer.h"

static constexpr const EntityPoint midScreen = EntityPoint{ DrawWidth / 2, DrawHeight / 2 };

void MageCamera::Update()
{
   if (followEntity)
   {
      Position = Vector2T<int32_t>{ followEntity->center().x - MidScreen.x, followEntity->center().y - MidScreen.y };
   }

   if (shaking)
   {
      Position.x += cosf(PI * 2 * shakePhase) * (float)shakeAmplitude;
      Position.y += sinf(PI * 2 * (shakePhase * 2)) * (float)shakeAmplitude;
   }
}