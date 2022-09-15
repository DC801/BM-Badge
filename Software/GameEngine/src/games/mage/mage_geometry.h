/*
This class contains the MageGeometry class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_GEOMETRY_H
#define _MAGE_GEOMETRY_H

#include "mage_defines.h"
#include "FrameBuffer.h"
#include "EngineROM.h"

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
   //can be any MageGeometryType:
   MageGeometryType typeId{ MageGeometryType::Point };
   //how many points will be in the pointArray:
   uint8_t pointCount{ 1 };
   //how many points will be in the segmentLengths:
   uint8_t segmentCount{ 0 };
   //total length of all segments in the geometry
   float pathLength{ 0.0f };
   //the array of the actual coordinate points that make up the geometry:
   std::unique_ptr<Point[]> points{ std::make_unique<Point[]>(pointCount) };
   //the array of segment lengths:
   std::unique_ptr<float[]> segmentLengths{ std::make_unique<float[]>(segmentCount) };

   //default constructor returns a point with coordinates 0,0:
   MageGeometry() = default;

   //this constructor allows you to make a geometry of a known type and pointCount.
   //you'll need to manually fill in the points, though. They all default to 0,0.
   MageGeometry(MageGeometryType type, uint8_t numPoints);

   //this constructor takes a ROM memory address and returns a MageGeometry object as stored in the ROM data:
   MageGeometry(std::shared_ptr<EngineROM> ROM, uint32_t address);

   void flipSelfByFlags(uint8_t flags, uint16_t width, uint16_t height);

   //this checks to see if a given point is inside the boundaries of a given geometry:
   bool isPointInGeometry(Point point);

   static Point flipPointByFlags(
      Point point,
      uint8_t flags,
      uint16_t width,
      uint16_t height
   );

   static Point flipVectorByFlags(
      Point unflippedPoint,
      uint8_t flags
   );

   void draw(
      int32_t cameraX,
      int32_t cameraY,
      uint16_t color,
      int32_t offset_x = 0,
      int32_t offset_y = 0
   );

   static bool pushADiagonalsVsBEdges(
      Point* spokeCenter,
      MageGeometry* playerSpokes,
      float* maxSpokePushbackLengths,
      Point* maxSpokePushbackVectors,
      MageGeometry* tile,
      FrameBuffer* frameBuffer
   );

   static bool getIntersectPointBetweenLineSegments(
      const Point& lineAPointA,
      const Point& lineAPointB,
      const Point& lineBPointA,
      const Point& lineBPointB,
      Point& intersectPoint
   );
};

#endif //_MAGE_GEOMETRY_H
