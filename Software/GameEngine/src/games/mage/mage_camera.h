#ifndef MAGE_CAMERA_H
#define MAGE_CAMERA_H

#include "mage_defines.h"
#include "mage_geometry.h"
#include <stdint.h>
#include <optional>

static inline const float PI = 3.141592653589793f;

class MapControl;
struct RenderableData;

class MageCamera
{
   friend class MageScriptActions;
public:
   void Update();

   void ClearFollowEntity()
   {
      followEntity = nullptr;
   }
   void SetFollowEntity(const RenderableData& toFollow)
   {
      followEntity = &toFollow;
   }
   Vector2T<int32_t> Position{};
   Vector2T<int32_t> GetScreenCenter() 
   {
      return Vector2T<int32_t>{Position.x - DrawWidth / 2, Position.y - DrawHeight / 2};
   }
private:
   bool    shaking{ false };
   float   shakePhase{ 0 };
   uint8_t shakeAmplitude{ 0 };
   const RenderableData* followEntity{ nullptr };
};

#endif