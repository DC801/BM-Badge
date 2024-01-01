/*
This class contains the MageGeometry class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_GEOMETRY_H
#define _MAGE_GEOMETRY_H

#include "mage_rom.h"
#include "mage_defines.h"
#include "utility.h"
#include <stdint.h>
#include <algorithm>
#include <cmath>
#include <limits>
#include <memory>
#include <span>
#include <type_traits>
#include <vector>
#include <optional>

#define RENDER_FLAGS_IS_GLITCHED_MASK	0b01111111
#define RENDER_FLAGS_IS_GLITCHED			0b10000000
#define RENDER_FLAGS_IS_DEBUG				0b01000000
#define RENDER_FLAGS_FLIP_X				0b00000100
#define RENDER_FLAGS_FLIP_Y				0b00000010
#define RENDER_FLAGS_FLIP_DIAG			0b00000001

#define RENDER_FLAGS_FLIP_MASK			0b00000111
#define RENDER_FLAGS_DIRECTION_MASK		0b00000011
#define NUM_DIRECTIONS 4

//this is the numerical translation for entity direction.
enum MageEntityAnimationDirection : uint8_t
{
   NORTH = 0,
   EAST = 1,
   SOUTH = 2,
   WEST = 3,
};


//this is a point in 2D space. Due to the entity storing points as 16 bit unsigned integers 
// and the remaining functions using 32 bit signed integers, 
// I have templated it and aliased the appropriate types below
template <typename T>
struct Vector2T
{
   T x{ 0 };
   T y{ 0 };

   template <typename R>
   operator Vector2T<R>() 
   {
      return Vector2T<R>{(R)x, (R)y};
   }

   constexpr float DotProduct(const Vector2T& b) const
   {
      return (float)x * (float)b.x
         + (float)y * (float)b.y;
   };

   constexpr bool zero() const
   {
      return x == T{ 0 } && y == T{ 0 };
   }

   Vector2T lerp(Vector2T b, float progress) const
   {
      return Vector2T{
         Util::lerp(x, b.x, progress),
         Util::lerp(y, b.y, progress)
      };
   }

   Vector2T flipByFlags(uint8_t flags, uint16_t width, uint16_t height) const
   {
      Vector2T point = Vector2T{ x,y };

      if (flags & RENDER_FLAGS_FLIP_X)
      {
         point.x = width - point.x;
      }
      if (flags & RENDER_FLAGS_FLIP_Y)
      {
         point.y = height - point.y;
      }

      if (flags & RENDER_FLAGS_FLIP_DIAG)
      {
         auto xTemp = point.x;
         point.x = point.y;
         point.y = xTemp;
      }

      return point;
   }

   template <class O>
   Vector2T& operator-=(const O& rhs)
   {
      if constexpr (std::is_integral_v<O>)
      {
         x -= rhs;
         y -= rhs;
      }
      else
      {
         x -= rhs.x;
         y -= rhs.y;
      }
      return *this;
   }

   template <class O>
   friend Vector2T operator-(Vector2T lhs, const O& rhs)
   {
      lhs -= rhs;
      return lhs;
   }

   template <class O>
   friend Vector2T operator*(Vector2T lhs, const O& rhs)
   {
      lhs *= rhs;
      return lhs;
   }

   template <class O>
   Vector2T& operator*=(const O& scale)
   {
      this->x *= scale;
      this->y *= scale;
      return *this;
   }

   template <class O>
   friend Vector2T operator/(Vector2T lhs, const O& rhs)
   {
      lhs /= rhs;
      return lhs;
   }

   template <class O>
   Vector2T& operator/=(const O& scale)
   {
      this->x /= scale;
      this->y /= scale;
      return *this;
   }

   Vector2T operator-()
   {
   	return Vector2T{ -x, -y };
   }

   template <class O>
   Vector2T& operator+=(const O& rhs)
   {
      this->x += rhs.x;
      this->y += rhs.y;
      return *this;
   }

   template <class O>
   friend Vector2T operator+(Vector2T lhs, const O& rhs)
   {
      lhs += rhs;
      return lhs;
   }

   template <class O>
   friend bool operator==(Vector2T lhs, const O& rhs)
   {
      return lhs.x == rhs.x && lhs.y == rhs.y;
   }

   MageEntityAnimationDirection getRelativeDirection(const Vector2T& target) const
   {
      float angle = atan2f(target.y - y, target.x - x);
      float absoluteAngle = abs(angle);
      MageEntityAnimationDirection direction = SOUTH;
      if (absoluteAngle > 2.356194f)
      {
         direction = WEST;
      }
      else if (absoluteAngle < 0.785398f)
      {
         direction = EAST;
      }
      else if (angle < 0)
      {
         direction = NORTH;
      }
      else if (angle > 0)
      {
         direction = SOUTH;
      }
      return direction;
   }
};

using EntityPoint = Vector2T<uint16_t>;


//struct Line
//{
//	Vector2T A;
//	Vector2T B;
//};

template <class T>
struct RectT
{
   Vector2T<T> origin;
   T w{ 0 };
   T h{ 0 };

   constexpr bool Overlaps(RectT<T>& other) const
   {
      return origin.x <= other.origin.x + other.w
         && origin.x + w >= other.origin.x
         && origin.y <= other.origin.y + other.h
         && origin.y + h >= other.origin.y;
   }
};

using Rect = RectT<int>;
using EntityRect = RectT<uint16_t>;

//these are the types of geometries that can be passed from the geometry data in ROM:
enum class MageGeometryType : uint8_t
{
   Point = 0,
   Polyline = 1,
   Polygon = 2
};

class MageGeometry
{
public:
   std::vector<EntityPoint> FlipByFlags(uint8_t flags, uint16_t width, uint16_t height) const;

   static std::optional<EntityPoint> getIntersectPointBetweenLineSegments(const EntityPoint& lineAPointA, const EntityPoint& lineAPointB, const EntityPoint& lineBPointA, const EntityPoint& lineBPointB);

   static float VectorLength(const int32_t& x, const int32_t& y) { return sqrt((x * x) + (y * y)); };

   uint16_t getLoopableGeometryPointIndex(uint8_t pointIndex) const;
   uint16_t GetLoopableGeometrySegmentIndex(uint8_t segmentIndex) const
   {
      uint16_t result = 0;
      if (GetPointCount() == 1)
      {
         // handle the derp who made a poly* with 1 point
      }
      else if (typeId == MageGeometryType::Polygon)
      {
         result = segmentIndex % segmentCount;
      }
      else if (typeId == MageGeometryType::Polyline)
      {
         result = (segmentIndex * 2) % segmentCount;
      }
      return result;
   }

   bool IsPointInside(const EntityPoint& pointToCheck, const EntityPoint& geometryOffset = EntityPoint{ 0 }) const
   {
      auto minX{ 0 }, minY{ 0 }, maxX{ 0 }, maxY{ 0 };

      for (auto& p : GetPoints())
      {
         auto point = p + geometryOffset;
         minX = std::min(point.x - pointToCheck.x, minX);
         minY = std::min(point.y - pointToCheck.y, minY);
         maxX = std::max(point.x - pointToCheck.x, maxX);
         maxY = std::max(point.y - pointToCheck.y, maxY);
      }

      return minX <= 0 && minY <= 0 && maxX >= 0 && maxY >= 0;
   }

   std::span<Vector2T<int32_t>> GetPoints() const
   {
      return std::span<Vector2T<int32_t>>{(Vector2T<int32_t>*)((uint8_t*)&pathLength + sizeof(pathLength)), pointCount};
   }

   Vector2T<int32_t> GetPoint(uint16_t i) const
   {
      auto points = (uint16_t*)((uint8_t*)&pathLength + sizeof(float));
      return Vector2T<int32_t>{ points[2 * i], points[2 * i + 1] };
   }
   uint16_t GetPointCount() const { return pointCount; }

   MageGeometryType GetTypeId() const { return typeId; }
   float GetPathLength() const { return pathLength; }
   float GetSegmentLength(uint16_t index) const
   {
      auto segmentLengths = (float*)((uint8_t*)&pathLength + sizeof(float) + pointCount * sizeof(EntityPoint));
      return !segmentCount ? 0.0f : segmentLengths[index % segmentCount];
   }

private:
   char name[32]{ 0 };
   //can be any MageGeometryType:
   MageGeometryType typeId{ MageGeometryType::Point };
   uint8_t pointCount{ 0 };
   uint8_t segmentCount{ 0 };
   //total length of all segments in the geometry
   float pathLength{ 0.0f };

};

#endif //_MAGE_GEOMETRY_H
