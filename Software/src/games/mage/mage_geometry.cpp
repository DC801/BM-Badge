#include "mage_geometry.h"
#include "FrameBuffer.h"
#include "EngineROM.h"
#include "EnginePanic.h"

extern FrameBuffer *mage_canvas;

MageGeometry::MageGeometry(uint32_t address)
{
	//skip over name:
	address += 32;
	//read typeId:
	EngineROM_Read(
		address,
		sizeof(typeId),
		(uint8_t *)&typeId,
		"Failed to load Geometry property 'typeId'"
	);
	address += sizeof(typeId);

	//read pointCount:
	EngineROM_Read(
		address,
		sizeof(pointCount),
		(uint8_t *)&pointCount,
		"Failed to load Geometry property 'pointCount'"
	);
	address += sizeof(pointCount);

	//read segmentCount:
	EngineROM_Read(
		address,
		sizeof(segmentCount),
		(uint8_t *)&segmentCount,
		"Failed to load Geometry property 'segmentCount'"
	);
	address += sizeof(segmentCount);

	address += 1; //padding

	//read pathLength:
	EngineROM_Read(
		address,
		sizeof(pathLength),
		(uint8_t *)&pathLength,
		"Failed to load Geometry property 'pathLength'"
	);
	pathLength = ROM_ENDIAN_F4_VALUE(pathLength);
	address += sizeof(pathLength);

	//generate appropriately sized point array:
	points = std::make_unique<Point[]>(pointCount);

	//fill array one point at a time:
	for(int i=0; i<pointCount; i++){
		uint16_t x;
		uint16_t y;
		//get x value:
		EngineROM_Read(
			address,
			sizeof(x),
			(uint8_t *)&x,
			"Failed to load Geometry property 'x'"
		);
		x = ROM_ENDIAN_U2_VALUE(x);
		address += sizeof(x);
		//get y value:
		EngineROM_Read(
			address,
			sizeof(y),
			(uint8_t *)&y,
			"Failed to load Geometry property 'x'"
		);
		y = ROM_ENDIAN_U2_VALUE(y);
		address += sizeof(y);
		//assign values:
		points[i].x = x;
		points[i].y = y;
	}

	//generate appropriately sized array:
	segmentLengths = std::make_unique<float[]>(segmentCount);

	EngineROM_Read(
		address,
		sizeof(float) * segmentCount,
		(uint8_t *)segmentLengths.get(),
		"Failed to load Geometry property 'x'"
	);
	ROM_ENDIAN_F4_BUFFER(segmentLengths.get(), segmentCount);

	return;
}

MageGeometry::MageGeometry(
	MageGeometryTypeId type,
	uint8_t numPoints
) {
	typeId = type;
	pointCount = numPoints;
	points = std::make_unique<Point[]>(pointCount);
	segmentCount = typeId == MageGeometryTypeId::POLYGON
		? numPoints
		: numPoints - 1;
	for(uint8_t i=0; i<pointCount; i++)
	{
		points[i].x = 0;
		points[i].y = 0;
	}
	segmentLengths = std::make_unique<float[]>(segmentCount);
}

uint32_t MageGeometry::size() const
{
	uint32_t size =
		sizeof(typeId) +
		sizeof(pointCount) +
		sizeof(segmentCount) +
		sizeof(pathLength) +
		(sizeof(Point) * pointCount) +
		(sizeof(float) * segmentCount);
	return size;
}

bool MageGeometry::isPointInGeometry(
	Point unFlippedPoint,
	uint8_t flags,
	uint16_t width,
	uint16_t height
)
{
	Point point = flipPointByFlags(
		unFlippedPoint,
		flags,
		width,
		height
	);
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
				if(( (points[i].y >= point.y ) != (points[j].y >= point.y) ) &&
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


Point MageGeometry::flipPointByFlags(
	Point unflippedPoint,
	uint8_t flags,
	uint16_t width,
	uint16_t height
) {
	Point point = unflippedPoint;
	if (flags != 0) {
		RenderFlagsUnion flagsUnion = {};
		flagsUnion.i = flags;
		if (flagsUnion.f.diagonal) {
			point.x = unflippedPoint.y;
			point.y = unflippedPoint.x;
		}
		if (flagsUnion.f.horizontal) {
			point.x = -point.x + width;
		}
		if (flagsUnion.f.vertical) {
			point.y = -point.y + height;
		}
	}
	return point;
};

Point MageGeometry::flipVectorByFlags(
	Point unflippedPoint,
	uint8_t flags
) {
	Point point = unflippedPoint;
	if (flags != 0) {
		RenderFlagsUnion flagsUnion = {};
		flagsUnion.i = flags;
		if (flagsUnion.f.diagonal) {
			point.x = point.y;
			point.y = point.x;
		}
		if (flagsUnion.f.horizontal) {
			point.x = -point.x;
		}
		if (flagsUnion.f.vertical) {
			point.y = -point.y;
		}
	}
	return point;
};

float MageGeometry::getVectorLength(
	Point v
) {
	return sqrt((v.x * v.x) + (v.y * v.y));
};

void MageGeometry::draw(
	int32_t cameraX,
	int32_t cameraY,
	uint16_t color,
	int32_t offset_x,
	int32_t offset_y,
	uint8_t flags,
	uint16_t width,
	uint16_t height
)
{
	Point pointA;
	Point pointB;
	if(typeId == POINT) {
		pointA = points[0];
		pointA = flipPointByFlags(
			pointA,
			flags,
			width,
			height
		);
		mage_canvas->drawPoint(
			pointA.x + offset_x - cameraX,
			pointA.y + offset_y - cameraY,
			4,
			color
		);
	} else {
		// POLYLINE segmentCount is pointCount - 1
		// POLYGON segmentCount is same as pointCount
		for (int i = 0; i < segmentCount; i++) {
			pointA = points[i];
			pointB = points[(i + 1) % pointCount];
			pointA = flipPointByFlags(
				pointA,
				flags,
				width,
				height
			);
			pointB = flipPointByFlags(
				pointB,
				flags,
				width,
				height
			);
			mage_canvas->drawLine(
				pointA.x + offset_x - cameraX,
				pointA.y + offset_y - cameraY,
				pointB.x + offset_x - cameraX,
				pointB.y + offset_y - cameraY,
				color
			);
		}
	}
}

Point MageGeometry::getPushBackFromCollidingPolygon(
	MageGeometry *collidingPolygon
) {
	Point pushback = {
		.x= 0,
		.y= 0,
	};
	Point force;

	MageGeometry *currentPolygon = this;

	force = pushADiagonalsVsBEdges(
		collidingPolygon,
		currentPolygon
	);
	pushback.x -= force.x;
	pushback.y -= force.y;

	force = pushADiagonalsVsBEdges(
		currentPolygon,
		collidingPolygon
	);
	pushback.x += force.x;
	pushback.y += force.y;

	return pushback;
}

Point MageGeometry::pushADiagonalsVsBEdges(
	MageGeometry *a,
	MageGeometry *b
) {
	Point pushback = {
		.x= 0,
		.y= 0,
	};
	Point polyACenter = {
		.x= 0,
		.y= 0,
	};
	uint16_t collisionCount = 0;

	for (int lineAPointIndex = 0; lineAPointIndex < a->pointCount; lineAPointIndex++) {
		Point lineAPointA = a->points[lineAPointIndex];
		polyACenter.x += lineAPointA.x;
		polyACenter.y += lineAPointA.y;
	}
	polyACenter.x = polyACenter.x / a->pointCount;
	polyACenter.y = polyACenter.y / a->pointCount;

	for (int lineAPointIndex = 0; lineAPointIndex < a->pointCount; lineAPointIndex++) {
		Point lineAPoint = a->points[lineAPointIndex];

		for (int lineBPointIndex = 0; lineBPointIndex < b->pointCount; lineBPointIndex++) {
			Point lineBPointA = b->points[lineBPointIndex];
			Point lineBPointB = b->points[(lineBPointIndex + 1) % b->pointCount];

			// Standard "off the shelf" line segment intersection
			float h = (
				(lineBPointB.x - lineBPointA.x)
				* (polyACenter.y - lineAPoint.y)
				- (polyACenter.x - lineAPoint.x)
				* (lineBPointB.y - lineBPointA.y)
			);
			float t1 = (
				(lineBPointA.y - lineBPointB.y)
				* (polyACenter.x - lineBPointA.x)
				+ (lineBPointB.x - lineBPointA.x)
				* (polyACenter.y - lineBPointA.y)
			) / h;
			float t2 = (
				(polyACenter.y - lineAPoint.y)
				* (polyACenter.x - lineBPointA.x)
				+ (lineAPoint.x - polyACenter.x)
				* (polyACenter.y - lineBPointA.y)
			) / h;

			if (t1 >= 0.0f && t1 < 1.0f && t2 >= 0.0f && t2 < 1.0f)
			{
				collisionCount++;
				pushback.x += (1.0f - t1) * (lineAPoint.x - polyACenter.x);
				pushback.y += (1.0f - t1) * (lineAPoint.y - polyACenter.y);
			}
		}
	}
	if(collisionCount > 0) {
		pushback.x /= collisionCount;
		pushback.y /= collisionCount;
	}
	return pushback;
}
