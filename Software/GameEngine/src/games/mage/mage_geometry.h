/*
This class contains the MageGeometry class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_GEOMETRY_H
#define _MAGE_GEOMETRY_H

#include "mage_rom.h"
#include "FrameBuffer.h"
#include "mage_defines.h"
#include <stdint.h>
#include <memory>
#include <vector>
#include <optional>

struct Point;

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
   //default constructor returns a point with coordinates 0,0:
   MageGeometry() = default;

   //this constructor allows you to make a geometry of a known type and pointCount.
   //you'll need to manually fill in the points, though. They all default to 0,0.
   MageGeometry(MageGeometryType type, uint8_t numPoints);

   //this constructor takes a ROM memory offset and returns a MageGeometry object as stored in the ROM data:
   MageGeometry(uint32_t& offset);

   MageGeometry FlipByFlags(uint8_t flags, uint16_t width, uint16_t height) const;

   //this checks to see if a given point is inside the boundaries of a given geometry:
   bool isPointInGeometry(Point point) const;

   static std::optional<Point> getIntersectPointBetweenLineSegments(const Point& lineAPointA, const Point& lineAPointB, const Point& lineBPointA, const Point& lineBPointB);

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
         segmentIndex %= (segmentCount * 2);
         uint16_t zeroIndexedSegmentCount = segmentCount - 1;
         result = (segmentIndex < segmentCount)
            ? segmentIndex
            : zeroIndexedSegmentCount + (zeroIndexedSegmentCount - segmentIndex) + 1;
      }
      return result;
   }

   const Point& GetPoint(uint16_t i) const { return points[i % pointCount]; }
   uint16_t GetPointCount() const { return pointCount;  }

   MageGeometryType GetTypeId() const { return typeId; }
   float GetPathLength() const { return pathLength; }
   float GetSegmentLength(uint16_t index) const { return !segmentCount ? 0.0f : segmentLengths[index % segmentCount]; }

   const Point* GetPoints() const
   {
      return points.get();
   }

private:
   char name[32]{ 0 };
   //can be any MageGeometryType:
   MageGeometryType typeId{ MageGeometryType::Point };
   uint8_t pointCount{ 0 };
   uint8_t segmentCount{ 0 };
   //total length of all segments in the geometry
   float pathLength{ 0.0f };
   //the array of the actual coordinate points that make up the geometry:
   std::unique_ptr<Point[]> points;
   //the array of segment lengths:
   std::unique_ptr<float[]> segmentLengths;

};

#endif //_MAGE_GEOMETRY_H
