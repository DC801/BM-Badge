/*
This class contains the MageGeometry class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_GEOMETRY_H
#define _MAGE_GEOMETRY_H

#include "mage_defines.h"


//this is a point in 2D space.
typedef struct {
	int32_t x;
	int32_t y;
} Point;

class MageGeometry{
	private:
		//can be any MageGeometryTypeId:
		uint8_t typeId;
		//how many points will be in the pointArray:
		uint8_t pointCount;
		//the array of the actual coordinate points that make up the geometry:
		std::unique_ptr<Point[]> pointArray;
	public:
		//default constructor returns a point with coordinates 0,0:
		MageGeometry() : 
			typeId{},
			pointCount{1},
			pointArray{std::make_unique<Point[]>(pointCount)}
		{}

		//this constructor allows you to make a geometry of a known type and pointCount.
		//you'll need to manually fill in the points, though. They all default to 0,0.
		MageGeometry(uint8_t type, uint8_t numPoints);

		//this constructor takes a ROM memory address and returns a MageGeometry object as stored in the ROM data:
		MageGeometry(uint32_t address);

		//returns the size in RAM of a MageGeometry object.
		uint32_t size();

		//this checks to see if a given point is inside the boundaries of a given geometry:
		bool isPointInGeometry(Point point, MageGeometry geometry);

		static bool doRectsOverlap(Rect a, Rect b);
}; //class MageGeometry

#endif //_MAGE_GEOMETRY_H
