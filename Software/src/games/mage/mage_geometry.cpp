#include "mage_geometry.h"
#include "FrameBuffer.h"
#include "EngineROM.h"
#include "EnginePanic.h"

extern FrameBuffer *mage_canvas;

MageGeometry::MageGeometry(uint32_t address)
{
	size_t segmentLengthsSize;
	//skip over name:
	address += 32;
	//read typeId:
	if (EngineROM_Read(address, sizeof(typeId), (uint8_t *)&typeId) != sizeof(typeId))
	{
		goto MageGeometry_Error;
	}
	address += sizeof(typeId);

	//read pointCount:
	if (EngineROM_Read(address, sizeof(pointCount), (uint8_t *)&pointCount) != sizeof(pointCount))
	{
		goto MageGeometry_Error;
	}
	address += sizeof(pointCount);

	//read segmentCount:
	if (EngineROM_Read(address, sizeof(segmentCount), (uint8_t *)&segmentCount) != sizeof(segmentCount))
	{
		goto MageGeometry_Error;
	}
	address += sizeof(segmentCount);

	address += 1; //padding

	//read pathLength:
	if (EngineROM_Read(address, sizeof(pathLength), (uint8_t *)&pathLength) != sizeof(pathLength))
	{
		goto MageGeometry_Error;
	}
	pathLength = convert_endian_f4_value(pathLength);
	address += sizeof(pathLength);

	//generate appropriately sized point array:
	points = std::make_unique<Point[]>(pointCount);

	//fill array one point at a time:
	for(int i=0; i<pointCount; i++){
		uint16_t x;
		uint16_t y;
		//get x value:
		if (EngineROM_Read(address, sizeof(x), (uint8_t *)&x) != sizeof(x))
		{
			goto MageGeometry_Error;
		}
		x = convert_endian_u2_value(x);
		address += sizeof(x);
		//get y value:
		if (EngineROM_Read(address, sizeof(y), (uint8_t *)&y) != sizeof(y))
		{
			goto MageGeometry_Error;
		}
		y = convert_endian_u2_value(y);
		address += sizeof(y);
		//assign values:
		points[i].x = x;
		points[i].y = y;
	}

	//generate appropriately sized array:
	segmentLengths = std::make_unique<float[]>(segmentCount);
	segmentLengthsSize = sizeof(float) * segmentCount;

	if (EngineROM_Read(
		address,
		segmentLengthsSize,
		(uint8_t *)segmentLengths.get() // <- fuck this little `.get()` shit right here HOW ABOUT YOU GIVE ME A REAL POINTER
	) != segmentLengthsSize) {
		goto MageGeometry_Error;
	}
	convert_endian_f4_buffer(segmentLengths.get(), segmentCount);

	return;

MageGeometry_Error:
	ENGINE_PANIC("Failed to load geometry data.");
}

MageGeometry::MageGeometry(uint8_t type, uint8_t numPoints)
{
	typeId = type;
	pointCount = numPoints;
	points = std::make_unique<Point[]>(pointCount);
	for(uint8_t i=0; i<pointCount; i++)
	{
		points[i].x = 0;
		points[i].y = 0;
	}
}

uint32_t MageGeometry::size()
{
	uint32_t size =
		sizeof(typeId) +
		sizeof(pointCount) +
		sizeof(Point) * pointCount;
	return size;
}

bool MageGeometry::isPointInGeometry(Point point)
{
	//first check for the case where the geometry is a point:
	if(typeId == MageGeometryTypeId::POINT)
	{
		return (
			point.x == points[0].x &&
			point.y == points[0].y
		);
	}
	//if it's a polyline or polygon, do the thing:
	else if(
		typeId == MageGeometryTypeId::POLYLINE ||
		typeId == MageGeometryTypeId::POLYGON
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
				if( ( (points[i].y >= point.y ) != (points[j].y >= point.y) ) &&
					(point.x <= (points[j].x - points[i].x) * (point.y - points[i].y) / (points[j].y - points[i].y) + points[i].x)
				)
				c = !c;
			}
			return c;
		}
		*/
		//Tim's version below:
		uint8_t i,j;
		bool c = false;
		for(i=0, j=pointCount - 1; i < pointCount; j = i++)
		{
			//get the points for i and j:
			Point points_i = points[i];
			Point points_j = points[j];
			//do the fancy check:
			if(
				( (points_i.y >= point.y) != (points_j.y >= point.y) ) &&
				( point.x <= (points_j.x - points_i.x) * (point.y - points_i.y) / (points_j.y - points_i.y) + points_i.x )
			)
			{ c = !c; }
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


bool MageGeometry::doRectsOverlap(Rect a, Rect b)
{
	return !(
		a.x > (b.x + b.w) ||
		a.y > (b.y + b.h) ||
		b.x > (a.x + a.w) ||
		b.y > (a.y + a.h)
	);
}


void MageGeometry::draw(int32_t cameraX, int32_t cameraY, uint16_t color)
{
	Point *pointA;
	Point *pointB;
	if(typeId == POINT) {
		mage_canvas->drawPoint(
			points[0].x - cameraX,
			points[0].y - cameraY,
			4,
			color
		);
	} else {
		for (int i = 1; i < pointCount; ++i) {
			pointA = &points[i - 1];
			pointB = &points[i];
			mage_canvas->drawLine(
				pointA->x - cameraX,
				pointA->y - cameraY,
				pointB->x - cameraX,
				pointB->y - cameraY,
				color
			);
		}
	}
	if(typeId == POLYGON) {
		// draw the closing line from point N-1 to 0
		pointA = &points[pointCount - 1];
		pointB = &points[0];
		mage_canvas->drawLine(
			pointA->x - cameraX,
			pointA->y - cameraY,
			pointB->x - cameraX,
			pointB->y - cameraY,
			color
		);
	}
}