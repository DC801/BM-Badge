#include "mage_geometry.h"
#include "FrameBuffer.h"
#include "convert_endian.h"
#include "shim_err.h"

MageGeometry::MageGeometry(std::shared_ptr<EngineROM> ROM, uint32_t address)
{
   //skip over name:
   address += 32;
   //read typeId:
   ROM->Read(
      address,
      sizeof(typeId),
      (uint8_t*)&typeId
   );
   address += sizeof(typeId);

   //read pointCount:
   ROM->Read(
      address,
      sizeof(pointCount),
      (uint8_t*)&pointCount
   );
   address += sizeof(pointCount);

   //read segmentCount:
   ROM->Read(
      address,
      sizeof(segmentCount),
      (uint8_t*)&segmentCount
   );
   address += sizeof(segmentCount);

   address += 1; //padding

   //read pathLength:
   ROM->Read(
      address,
      sizeof(pathLength),
      (uint8_t*)&pathLength
   );
   pathLength = ROM_ENDIAN_F4_VALUE(pathLength);
   address += sizeof(pathLength);

   //generate appropriately sized point array:
   points = std::make_unique<Point[]>(pointCount);

   //fill array one point at a time:
   for (int i = 0; i < pointCount; i++)
   {
      uint16_t x;
      uint16_t y;
      //get x value:
      ROM->Read(
         address,
         sizeof(x),
         (uint8_t*)&x
      );
      x = ROM_ENDIAN_U2_VALUE(x);
      address += sizeof(x);
      //get y value:
      ROM->Read(
         address,
         sizeof(y),
         (uint8_t*)&y
      );
      y = ROM_ENDIAN_U2_VALUE(y);
      address += sizeof(y);
      //assign values:
      points[i].x = x;
      points[i].y = y;
   }

   //generate appropriately sized array:
   segmentLengths = std::make_unique<float[]>(segmentCount);

   ROM->Read(
      address,
      sizeof(float) * segmentCount,
      (uint8_t*)segmentLengths.get()
   );
   ROM_ENDIAN_F4_BUFFER(segmentLengths.get(), segmentCount);

   return;
}

MageGeometry::MageGeometry(MageGeometryType type, uint8_t numPoints)
{
   typeId = type;
   pointCount = numPoints;
   points = std::make_unique<Point[]>(pointCount);
   segmentCount = typeId == MageGeometryType::Polygon
      ? numPoints
      : numPoints - 1;
   for (uint8_t i = 0; i < pointCount; i++)
   {
      points[i].x = 0;
      points[i].y = 0;
   }
   segmentLengths = std::make_unique<float[]>(segmentCount);
}

void MageGeometry::flipSelfByFlags(
   uint8_t flags,
   uint16_t width,
   uint16_t height
)
{
   if (flags == 0)
   {
      return;
   }
   for (uint8_t i = 0; i < pointCount; i++)
   {
      points[i] = flipPointByFlags(
         points[i],
         flags,
         width,
         height
      );
   }
}

bool MageGeometry::isPointInGeometry(
   Point point
)
{
   //first check for the case where the geometry is a point:
   if (typeId == MageGeometryType::Point)
   {
      return (
         point.x == points[0].x &&
         point.y == points[0].y
         );
   }
   //if it's a polyline or polygon, do the thing:
   else if (
      typeId == MageGeometryType::Polyline ||
      typeId == MageGeometryType::Polygon
      )
   {
      //refactoring stackoverflow code based on point-in-polygon by James Halliday
      //https://stackoverflow.com/questions/11716268/point-in-polygon-algorithm
      /*
      bool PointInPolygon(Point point, Polygon polygon) {
         vector<Point> points = polygon.getPoints();
         int i, j, nvert = points.size();
         bool c = false;

         for(i = 0, j = nvert - 1; i < nvert; j = i++) {
            if(( (points[i].y >= point.y ) != (points[j].y >= point.y) ) &&
               (point.x <= (points[j].x - points[i].x) * (point.y - points[i].y) / (points[j].y - points[i].y) + points[i].x)
            )
            c = !c;
         }
         return c;
      }
      */
      //Tim's version below:
      uint8_t i, j;
      bool c = false;
      for (i = 0, j = pointCount - 1; i < pointCount; j = i++)
      {
         //get the points for i and j:
         Point points_i = points[i];
         Point points_j = points[j];
         //do the fancy check:
         if (
            ((points_i.y >= point.y) != (points_j.y >= point.y)) &&
            (point.x <= (points_j.x - points_i.x) * (point.y - points_i.y) / (points_j.y - points_i.y) + points_i.x)
            )
         {
            c = !c;
         }
      }
      //return the bool, that should be correct:
      return c;
   }
   //otherwise it's not a known geometry type, so always return false.
   else
   {
      return false;
   }
}

Point MageGeometry::flipPointByFlags(
   Point unflippedPoint,
   uint8_t flags,
   uint16_t width,
   uint16_t height
)
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
         point.x = -point.x + width;
      }
      if (flagsUnion.vertical)
      {
         point.y = -point.y + height;
      }
   }
   return point;
};

Point MageGeometry::flipVectorByFlags(
   Point unflippedPoint,
   uint8_t flags
)
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

void MageGeometry::draw(
   int32_t cameraX,
   int32_t cameraY,
   uint16_t color,
   int32_t offset_x,
   int32_t offset_y
)
{
   Point pointA;
   Point pointB;

}

bool MageGeometry::pushADiagonalsVsBEdges(
   Point* spokeCenter,
   MageGeometry* playerSpokes,
   float* maxSpokePushbackLengths,
   Point* maxSpokePushbackVectors,
   MageGeometry* tile,
   FrameBuffer* frameBuffer
)
{
   bool collidedWithThisTileAtAll = false;
   for (int tileLinePointIndex = 0; tileLinePointIndex < tile->pointCount; tileLinePointIndex++)
   {
      Point tileLinePointA = tile->points[tileLinePointIndex];
      Point tileLinePointB = tile->points[(tileLinePointIndex + 1) % tile->pointCount];
      bool collidedWithTileLine = false;

      for (int spokeIndex = 0; spokeIndex < playerSpokes->pointCount; spokeIndex++)
      {
         Point spokePointB = playerSpokes->points[spokeIndex];
         Point spokeIntersectionPoint = {
            0,
            0,
         };
         bool collided = getIntersectPointBetweenLineSegments(
            *spokeCenter,
            spokePointB,
            tileLinePointA,
            tileLinePointB,
            spokeIntersectionPoint
         );
         if (collided)
         {
            collidedWithTileLine = true;
            collidedWithThisTileAtAll = true;
            frameBuffer->drawLine(
               spokeCenter->x,
               spokeCenter->y,
               spokePointB.x,
               spokePointB.y,
               COLOR_RED
            );
            frameBuffer->drawLine(
               spokeCenter->x,
               spokeCenter->y,
               spokeIntersectionPoint.x,
               spokeIntersectionPoint.y,
               COLOR_GREENYELLOW
            );
            Point diff = {
               spokeIntersectionPoint.x - spokePointB.x,
               spokeIntersectionPoint.y - spokePointB.y,
            };
            frameBuffer->drawLine(
               spokeCenter->x,
               spokeCenter->y,
               spokeCenter->x + diff.x,
               spokeCenter->y + diff.y,
               COLOR_ORANGE
            );
            float currentIntersectLength = diff.VectorLength();
            maxSpokePushbackLengths[spokeIndex] = MAX(
               currentIntersectLength,
               maxSpokePushbackLengths[spokeIndex]
            );
            if (currentIntersectLength == maxSpokePushbackLengths[spokeIndex])
            {
               maxSpokePushbackVectors[spokeIndex] = diff;
            }
         }
      }
      frameBuffer->drawLine(
         tileLinePointA.x,
         tileLinePointA.y,
         tileLinePointB.x,
         tileLinePointB.y,
         collidedWithTileLine
         ? COLOR_RED
         : COLOR_ORANGE
      );
   }
   return collidedWithThisTileAtAll;
}

// Returns true if collision has occurred, and if it has,
// sets the new value of intersectPoint.
// Ref: https://stackoverflow.com/a/385355
// Ref: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
bool MageGeometry::getIntersectPointBetweenLineSegments(
   const Point& lineAPointA,
   const Point& lineAPointB,
   const Point& lineBPointA,
   const Point& lineBPointB,
   Point& intersectPoint
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
         intersectPoint.x = x;
         intersectPoint.y = y;
         return true;
      }
   }
   // No intersection
   return false;
}
