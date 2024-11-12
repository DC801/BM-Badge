#include "mage_geometry.h"
#include "FrameBuffer.h"
#include <algorithm>

#ifndef DC801_EMBEDDED
#include "shim_err.h"
#else
#include <nrf_error.h>
#endif

std::vector<EntityPoint> MageGeometry::FlipByFlags(uint8_t flags, uint16_t width, uint16_t height) const
{
   auto points = std::vector<EntityPoint>{ pointCount };

   for (uint8_t i = 0; i < pointCount; i++)
   {
      auto point = GetPoint(i);
      
      if (flags & RENDER_FLAGS_FLIP_X)
      {
         points[i].x = width - point.x;
      }
      if (flags & RENDER_FLAGS_FLIP_Y)
      {
         points[i].y = height - point.y;
      }
      if (flags & RENDER_FLAGS_FLIP_DIAG)
      {
         auto xTemp = point.x;
         points[i].x = point.y;
         points[i].y = xTemp;
      }

      points[i] = point;
   }
   return points;
}

// Returns a value if collision has occurred
// Ref: https://stackoverflow.com/a/385355
// Ref: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
std::optional<EntityPoint> MageGeometry::getIntersectPointBetweenLineSegments(
   const EntityPoint& lineAPointA, const EntityPoint& lineAPointB,
   const EntityPoint& lineBPointA, const EntityPoint& lineBPointB
)
{
    auto differenceA = lineAPointA - lineAPointB;
    auto differenceB = lineBPointA - lineBPointB;

    auto x12 = lineAPointA.x - lineAPointB.x;
    auto x34 = lineBPointA.x - lineBPointB.x;
    auto y12 = lineAPointA.y - lineAPointB.y;
    auto y34 = lineBPointA.y - lineBPointB.y;

   auto A = lineAPointA - lineAPointB;
   auto B = lineBPointA - lineBPointB;

   auto c = A.x * B.y - A.y * B.x;

   if (c > 0)
   {
      // Intersection
      auto a = lineAPointA.x * lineAPointB.y - lineAPointA.y * lineAPointB.x;
      auto b = lineBPointA.x * lineBPointB.y - lineBPointA.y * lineBPointB.x;
      
      auto lineAXMin = std::min(lineAPointA.x, lineAPointB.x);
      auto lineAXMax = std::max(lineAPointA.x, lineAPointB.x);

      auto lineAYMin = std::min(lineAPointA.y, lineAPointB.y);
      auto lineAYMax = std::max(lineAPointA.y, lineAPointB.y);

      auto lineBXMin = std::min(lineBPointA.x, lineBPointB.x);
      auto lineBXMax = std::max(lineBPointA.x, lineBPointB.x);

      auto lineBYMin = std::min(lineBPointA.y, lineBPointB.y);
      auto lineBYMax = std::max(lineBPointA.y, lineBPointB.y);

      // Determine if the intersection is inside the bounds of lineA AND lineB
      //if (x >= lineAXMin && x <= lineAXMax
      //   && y >= lineAYMin && y <= lineAYMax
      //   && x >= lineBXMin && x <= lineBXMax
      //   && y >= lineBYMin && y <= lineBYMax)
      //{
      //    auto x = (a * differenceB.x - b * differenceA.x) / c;
      //    auto y = (a * differenceB.y - b * differenceA.y) / c;

      //   return EntityPoint{ x, y };
      //}
   }
   // No intersection
   return std::nullopt;
}

uint16_t MageGeometry::getLoopableGeometryPointIndex(uint8_t pointIndex) const
{
   uint16_t result = 0;
   if (GetPointCount() == 1)
   {
      // handle the derp who made a poly* with 1 point
   }
   else if (typeId == MageGeometryType::Polygon)
   {
      result = pointIndex % GetPointCount();
   }
   else if (typeId == MageGeometryType::Polyline)
   {
      pointIndex %= (segmentCount * 2);
      result = (pointIndex < GetPointCount())
         ? pointIndex
         : segmentCount + (segmentCount - pointIndex);
   }
   return result;
}