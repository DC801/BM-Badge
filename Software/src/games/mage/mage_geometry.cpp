#include "mage_geometry.h"
#include "EngineROM.h"
#include "EnginePanic.h"

MageGeometry::MageGeometry(uint32_t address)
{
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
	address += 2; //padding

	//generate appropriately sized point array:
	pointArray = std::make_unique<Point[]>(pointCount);

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
		pointArray[i].x = x;
		pointArray[i].y = y;
	}

	return;

MageGeometry_Error:
	ENGINE_PANIC("Failed to load geometry data.");
}

MageGeometry::MageGeometry(uint8_t type, uint8_t numPoints)
{
	typeId = type;
	pointCount = numPoints;
	pointArray = std::make_unique<Point[]>(pointCount);
	for(uint8_t i=0; i<pointCount; i++)
	{
		pointArray[i].x = 0;
		pointArray[i].y = 0;
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

bool MageGeometry::isPointInGeometry(Point point, MageGeometry geometry)
{
	//first check for the case where the geometry is a point:
	if(geometry.typeId == MageGeometryTypeId::POINT)
	{
		if(
			point.x == geometry.pointArray[0].x &&
			point.y == geometry.pointArray[0].y
		)
		{ return true; }
		else { return false; }
	}
	//if it's a polyline or polygon, do the thing:
	else if(
		geometry.typeId == MageGeometryTypeId::POLYLINE ||
		geometry.typeId == MageGeometryTypeId::POLYGON
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
		for(i=0, j=geometry.pointCount; i < geometry.pointCount; j = i++)
		{
			//get the points for i and j:
			Point points_i = geometry.pointArray[i];
			Point points_j = geometry.pointArray[j];
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
