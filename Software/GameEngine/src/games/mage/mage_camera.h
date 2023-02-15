#ifndef MAGE_CAMERA_H
#define MAGE_CAMERA_H

#include "mage_defines.h"
#include "mage_geometry.h"
#include <stdint.h>

static inline const float PI = 3.141592653589793;

struct Point;
class MapControl;

class MageCamera
{
   friend class MageGameEngine;
   friend class MageScriptActions;
public:
   MageCamera() noexcept = default;
   MageCamera(std::shared_ptr<MapControl> mapControl) noexcept
      : mapControl(mapControl)
   {}
   void applyEffects(uint32_t deltaTime);
private:
   std::shared_ptr<MapControl> mapControl;

   bool    shaking{ false };
   float   shakePhase{ 0 };
   uint8_t shakeAmplitude{ 0 };
   uint8_t followEntityId{ 0 };
   Point   position{ 0,0 };
};

#endif