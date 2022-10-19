#include "mage_geometry.h"
#include "mage_tileset.h"
#include "FrameBuffer.h"
#include "convert_endian.h"
#include "shim_err.h"

MageGeometry::MageGeometry(std::shared_ptr<EngineROM> ROM, uint32_t& address)
{
   //skip over name:
   address += 32;
   ROM->Read(typeId, address);
   ROM->Read(pointCount, address);
   address += sizeof(pointCount);

   //read segmentCount:
   ROM->Read(segmentCount, address);

   address += 1; //padding

   //read pathLength:
   ROM->Read(pathLength, address);

   //generate appropriately sized point array:
   ROM->InitializeCollectionOf(points, address, pointCount);

   //generate appropriately sized array:
   ROM->InitializeCollectionOf(segmentLengths, address, segmentCount);
}

MageGeometry::MageGeometry(MageGeometryType type, uint8_t numPoints)
{
   typeId = type;
   pointCount = numPoints;
   segmentCount = typeId == MageGeometryType::Polygon
      ? numPoints
      : numPoints - 1;
   for (uint8_t i = 0; i < pointCount; i++)
   {
      points.push_back(Point{ 0,0 });
   }
   for (uint8_t i = 0; i < segmentCount; i++)
   {
      segmentLengths.push_back(segmentCount);
   }
}

MageGeometry MageGeometry::flipSelfByFlags(uint8_t flags, uint16_t width, uint16_t height) const
{
   auto geometry = MageGeometry{ *this };
   if (flags != 0)
   {
      for (uint8_t i = 0; i < pointCount; i++)
      {
         geometry.points[i] = flipPointByFlags(points[i], flags, width, height);
      }
   }
   return geometry;
}

bool MageGeometry::isPointInGeometry(Point point) const
{
   if (typeId == MageGeometryType::Point)
   {
      return point.x == points[0].x && point.y == points[0].y;
   }
   else if (typeId == MageGeometryType::Polyline || typeId == MageGeometryType::Polygon)
   {
      uint8_t i, j;
      bool c = false;
      for (i = 0, j = pointCount - 1; i < pointCount; j = i++)
      {
         //get the points for i and j:
         Point points_i = points[i];
         Point points_j = points[j];
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

Point MageGeometry::flipPointByFlags(Point unflippedPoint, uint8_t flags, uint16_t width, uint16_t height)
{
   Point point = unflippedPoint;
   if (flags != 0)
   {
      RenderFlags flagsUnion = { flags };
      if (flagsUnion.diagonal)
      {
         point.x = unflippedPoint.y;
         point.y = unflippedPoint.x;
      }
      if (flagsUnion.horizontal)
      {
         point.x = width - point.x;
      }
      if (flagsUnion.vertical)
      {
         point.y = height - point.y;
      }
   }
   return point;
};

Point MageGeometry::flipVectorByFlags(Point unflippedPoint, uint8_t flags)
{
   Point point = unflippedPoint;
   if (flags != 0)
   {
      RenderFlags flagsUnion = { flags };
      if (flagsUnion.diagonal)
      {
         point.x = point.y;
         point.y = point.x;
      }
      if (flagsUnion.horizontal)
      {
         point.x = -point.x;
      }
      if (flagsUnion.vertical)
      {
         point.y = -point.y;
      }
   }
   return point;
};

// Returns true if collision has occurred, and if it has,
// sets the new value of intersectPoint.
// Ref: https://stackoverflow.com/a/385355
// Ref: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
std::optional<Point> MageGeometry::getIntersectPointBetweenLineSegments(
   const Point& lineAPointA, const Point& lineAPointB,
   const Point& lineBPointA, const Point& lineBPointB
)
{
   float x1 = lineAPointA.x;
   float x2 = lineAPointB.x;
   float x3 = lineBPointA.x;
   float x4 = lineBPointB.x;
   float y1 = lineAPointA.y;
   float y2 = lineAPointB.y;
   float y3 = lineBPointA.y;
   float y4 = lineBPointB.y;

   float x12 = x1 - x2;
   float x34 = x3 - x4;
   float y12 = y1 - y2;
   float y34 = y3 - y4;

   float c = x12 * y34 - y12 * x34;

   if (fabs(c) > 0.01)
   {
      // Intersection
      float a = x1 * y2 - y1 * x2;
      float b = x3 * y4 - y3 * x4;

      float x = (a * x34 - b * x12) / c;
      float y = (a * y34 - b * y12) / c;

      float lineAXMin = MIN(x1, x2);
      float lineAXMax = MAX(x1, x2);
      float lineAYMin = MIN(y1, y2);
      float lineAYMax = MAX(y1, y2);
      float lineBXMin = MIN(x3, x4);
      float lineBXMax = MAX(x3, x4);
      float lineBYMin = MIN(y3, y4);
      float lineBYMax = MAX(y3, y4);

      // Determine if the intersection is inside the bounds of lineA AND lineB
      if (x >= lineAXMin && x <= lineAXMax
       && y >= lineAYMin && y <= lineAYMax 
       && x >= lineBXMin && x <= lineBXMax
       && y >= lineBYMin && y <= lineBYMax)
      {
         return Point{ (int32_t)x, (int32_t)y };
      }
   }
   // No intersection
   return std::nullopt;
}

uint16_t MageGeometry::getLoopableGeometryPointIndex(uint8_t pointIndex) const
{
   uint16_t result = 0;
   if (pointCount == 1)
   {
      // handle the derp who made a poly* with 1 point
   }
   else if (typeId == MageGeometryType::Polygon)
   {
      result = pointIndex % pointCount;
   }
   else if (typeId == MageGeometryType::Polyline)
   {
      // haunted, do not touch
      pointIndex %= (segmentCount * 2);
      result = (pointIndex < pointCount)
         ? pointIndex
         : segmentCount + (segmentCount - pointIndex);
   }
   return result;
}