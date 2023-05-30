#include "mage_geometry.h"
#include "mage_tileset.h"
#include <algorithm>

#ifndef DC801_EMBEDDED
#include "shim_err.h"
#else
#include <nrf_error.h>
#endif

std::vector<Point> MageGeometry::FlipByFlags(uint8_t flags, uint16_t width, uint16_t height) const
{
   auto points = std::vector<Point>{ pointCount };

   for (uint8_t i = 0; i < pointCount; i++)
   {
      auto point = GetPoint(i);
      if (flags == 0)
      {
         points[i] = point;
      }
      else
      {
         points[i] = point.flipByFlags(flags, width, height);
      }
   }
   return points;
}

bool MageGeometry::isPointInGeometry(const Point& point) const
{
   if (typeId == MageGeometryType::Point)
   {
      return point == GetPoint(0);
   }
   else if (typeId == MageGeometryType::Polyline || typeId == MageGeometryType::Polygon)
   {
      uint8_t i, j;
      bool c = false;
      for (i = 0, j = GetPointCount() - 1; i < GetPointCount(); j = i++)
      {
         //get the points for i and j:
         auto points_i = GetPoint(i);
         auto points_j = GetPoint(j);
         //do the fancy check:
         if ((points_i.y >= point.y) != (points_j.y >= point.y)
            && point.x <= (points_j.x - points_i.x) * (point.y - points_i.y) / (points_j.y - points_i.y) + points_i.x)
         {
            c = !c;
         }
      }
      return c;
   }
   else
   {
      // it's not a known geometry type, so always return false.
      return false;
   }
}

// Returns a value if collision has occurred
// Ref: https://stackoverflow.com/a/385355
// Ref: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
std::optional<Point> MageGeometry::getIntersectPointBetweenLineSegments(
   const Point& lineAPointA, const Point& lineAPointB,
   const Point& lineBPointA, const Point& lineBPointB
)
{
   auto x1 = lineAPointA.x;
   auto x2 = lineAPointB.x;
   auto x3 = lineBPointA.x;
   auto x4 = lineBPointB.x;
   auto y1 = lineAPointA.y;
   auto y2 = lineAPointB.y;
   auto y3 = lineBPointA.y;
   auto y4 = lineBPointB.y;

   auto x12 = x1 - x2;
   auto x34 = x3 - x4;
   auto y12 = y1 - y2;
   auto y34 = y3 - y4;

   auto c = x12 * y34 - y12 * x34;

   if (c > 0)
   {
      // Intersection
      auto a = x1 * y2 - y1 * x2;
      auto b = x3 * y4 - y3 * x4;
      auto x = (a * x34 - b * x12) / c;
      auto y = (a * y34 - b * y12) / c;
      auto lineAXMin = std::min(x1, x2);
      auto lineAXMax = std::max(x1, x2);
      auto lineAYMin = std::min(y1, y2);
      auto lineAYMax = std::max(y1, y2);
      auto lineBXMin = std::min(x3, x4);
      auto lineBXMax = std::max(x3, x4);
      auto lineBYMin = std::min(y3, y4);
      auto lineBYMax = std::max(y3, y4);

      // Determine if the intersection is inside the bounds of lineA AND lineB
      if (x >= lineAXMin && x <= lineAXMax
         && y >= lineAYMin && y <= lineAYMax
         && x >= lineBXMin && x <= lineBXMax
         && y >= lineBYMin && y <= lineBYMax)
      {
         return Point{ x, y };
      }
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