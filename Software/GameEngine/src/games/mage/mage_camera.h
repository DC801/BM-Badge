#ifndef MAGE_CAMERA_H
#define MAGE_CAMERA_H

#include "mage_defines.h"
#include "mage_geometry.h"
#include <stdint.h>
#include <optional>

static inline const float PI = 3.141592653589793f;

class MapControl;
class MageEntity;
class MageCamera
{
   friend class MageGameEngine;
   friend class MageScriptActions;
public:
   MageCamera() noexcept = default;
   MageCamera(std::shared_ptr<MapControl> mapControl) noexcept
      : mapControl(mapControl)
   {}
   void applyEffects();
   void setFollowEntity(std::optional<const MageEntity*> toFollow)
   {
      followEntity = toFollow;
   }
private:
   std::shared_ptr<MapControl> mapControl;

   bool    shaking{ false };
   float   shakePhase{ 0 };
   uint8_t shakeAmplitude{ 0 };
   std::optional<const MageEntity*> followEntity{ };
   EntityPoint   position{ 0,0 };

};

#endif