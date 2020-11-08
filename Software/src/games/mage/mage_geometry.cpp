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
	//need to write this, returning false every time for now. -Tim
	return false;
}
