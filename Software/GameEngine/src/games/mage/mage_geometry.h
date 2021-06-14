/*
This class contains the MageGeometry class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_GEOMETRY_H
#define _MAGE_GEOMETRY_H

#include "mage_defines.h"
#include "FrameBuffer.h"

class MageGeometry{
	private:
	public:
		//can be any MageGeometryTypeId:
		MageGeometryTypeId typeId;
		//how many points will be in the pointArray:
		uint8_t pointCount;
		//how many points will be in the segmentLengths:
		uint8_t segmentCount;
		//total length of all segments in the geometry
		float pathLength;
		//the array of the actual coordinate points that make up the geometry:
		std::unique_ptr<Point[]> points;
		//the array of segment lengths:
		std::unique_ptr<float[]> segmentLengths;

		//default constructor returns a point with coordinates 0,0:
		MageGeometry() :
			typeId{MageGeometryTypeId::POINT},
			pointCount{1},
			segmentCount{0},
			points{std::make_unique<Point[]>(pointCount)},
			segmentLengths{std::make_unique<float[]>(segmentCount)}
		{}

		//this constructor allows you to make a geometry of a known type and pointCount.
		//you'll need to manually fill in the points, though. They all default to 0,0.
		MageGeometry(
			MageGeometryTypeId type,
			uint8_t numPoints
		);

		//this constructor takes a ROM memory address and returns a MageGeometry object as stored in the ROM data:
		MageGeometry(uint32_t address);

		//returns the size in RAM of a MageGeometry object.
		uint32_t size() const;

		void flipSelfByFlags(
			uint8_t flags,
			uint16_t width,
			uint16_t height
		);

		//this checks to see if a given point is inside the boundaries of a given geometry:
		bool isPointInGeometry(
			Point point
		);

		static bool doRectsOverlap(Rect a, Rect b);

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

		static float getVectorLength(
			Point v
		);

		static float getDotProduct(
			Point a,
			Point b
		);

		void draw(
			int32_t cameraX,
			int32_t cameraY,
			uint16_t color,
			int32_t offset_x = 0,
			int32_t offset_y = 0
		);

		void drawSpokes(
			Point polyACenter,
			int32_t cameraX,
			int32_t cameraY,
			uint16_t color,
			int32_t offset_x = 0,
			int32_t offset_y = 0
		);

		static bool pushADiagonalsVsBEdges(
			Point *spokeCenter,
			MageGeometry *playerSpokes,
			float *maxSpokePushbackLengths,
			Point *maxSpokePushbackVectors,
			MageGeometry *tile
		);

		static bool getIntersectPointBetweenLineSegments(
			const Point &lineAPointA,
			const Point &lineAPointB,
			const Point &lineBPointA,
			const Point &lineBPointB,
			Point &intersectPoint
		);

}; //class MageGeometry

#endif //_MAGE_GEOMETRY_H
