/*
This class contains the MageGeometry class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_GEOMETRY_H
#define _MAGE_GEOMETRY_H

#include "mage_rom.h"
#include "mage_defines.h"
#include "utility.h"
#include <stdint.h>
#include <cmath>
#include <memory>
#include <span>
#include <vector>
#include <optional>

#define RENDER_FLAGS_IS_GLITCHED_MASK	0b01111111
#define RENDER_FLAGS_IS_GLITCHED			0b10000000
#define RENDER_FLAGS_IS_DEBUG				0b01000000
#define RENDER_FLAGS_FLIP_X				0b00000100
#define RENDER_FLAGS_FLIP_Y				0b00000010
#define RENDER_FLAGS_FLIP_DIAG			0b00000001

#define RENDER_FLAGS_FLIP_MASK			0b00000111
#define RENDER_FLAGS_DIRECTION_MASK		0b00000011
#define NUM_DIRECTIONS 4

//this is the numerical translation for entity direction.
enum MageEntityAnimationDirection : uint8_t
{
	NORTH = 0,
	EAST = 1,
	SOUTH = 2,
	WEST = 3,
};


//this is a point in 2D space.
struct Point
{
	int32_t x{ 0 };
	int32_t y{ 0 };

	constexpr float DotProduct(const Point& b) const
	{
		return (float)x * (float)b.x
			+ (float)y * (float)b.y;
	};

	Point lerp(Point b, float progress) const
	{
		auto point = Point{
			Util::lerp(x, b.x, progress),
			Util::lerp(y, b.y, progress)
		};
		return point;
	}

	Point flipByFlags(uint8_t flags, uint16_t width, uint16_t height) const
	{
		Point point = Point{ x,y };

		if (flags & RENDER_FLAGS_FLIP_X)
		{
			point.x = width - point.x;
		}
		if (flags & RENDER_FLAGS_FLIP_Y)
		{
			point.y = height - point.y;
		}

		if (flags & RENDER_FLAGS_FLIP_DIAG)
		{
			auto xTemp = point.x;
			point.x = point.y;
			point.y = xTemp;
		}

		return point;
	}

	Point& operator-=(const Point& rhs)
	{
		x -= rhs.x;
		y -= rhs.y;
		return *this;
	}

	friend Point operator-(Point lhs, const Point& rhs)
	{
		lhs -= rhs;
		return lhs;
	}

	friend Point operator*(Point lhs, const int32_t& rhs)
	{
		lhs *= rhs;
		return lhs;
	}

	Point& operator*=(const int32_t& scale)
	{
		this->x *= scale;
		this->y *= scale;
		return *this;
	}

	friend Point operator/(Point lhs, const int32_t& rhs)
	{
		lhs /= rhs;
		return lhs;
	}

	Point& operator/=(const int32_t& scale)
	{
		this->x /= scale;
		this->y /= scale;
		return *this;
	}

	//Point& operator-=(const uint8_t& scale)
	//{
	//	this->x -= scale;
	//	this->y -= scale;
	//	return *this;
	//}


	//friend Point operator-(Point lhs, const uint8_t& scale)
	//{
	//	lhs -= scale;
	//	return lhs;
	//}


	Point operator-()
	{
		return Point{ -x, -y };
	}

	Point& operator+=(const Point& rhs)
	{
		this->x += rhs.x;
		this->y += rhs.y;
		return *this;
	}

	friend Point operator+(Point lhs, const Point& rhs)
	{
		lhs += rhs;
		return lhs;
	}

	Point& operator+=(const uint8_t& shift)
	{
		this->x += shift;
		this->y += shift;
		return *this;
	}

	friend Point operator+(Point lhs, const uint8_t& shift)
	{
		lhs += shift;
		return lhs;
	}

	friend bool operator==(Point lhs, const Point& rhs)
	{
		return lhs.x == rhs.x && lhs.y == rhs.y;
	}

	MageEntityAnimationDirection getRelativeDirection(const Point& target) const
	{
		float angle = atan2f(target.y - y, target.x - x);
		float absoluteAngle = abs(angle);
		MageEntityAnimationDirection direction = SOUTH;
		if (absoluteAngle > 2.356194f)
		{
			direction = WEST;
		}
		else if (absoluteAngle < 0.785398f)
		{
			direction = EAST;
		}
		else if (angle < 0)
		{
			direction = NORTH;
		}
		else if (angle > 0)
		{
			direction = SOUTH;
		}
		return direction;
	}
};

using Line = std::tuple<Point, Point>;


//struct Line
//{
//	Point A;
//	Point B;
//};

struct Rect
{
	Point origin;
	int32_t w{ 0 };
	int32_t h{ 0 };

	constexpr bool Overlaps(Rect& other) const
	{
		return origin.x <= other.origin.x + other.w
			&& origin.x + w >= other.origin.x
			&& origin.y <= other.origin.y + other.h
			&& origin.y + h >= other.origin.y;
	}
};


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
   MageGeometry() noexcept = default;

   ////this constructor allows you to make a geometry of a known type and pointCount.
   ////you'll need to manually fill in the points, though. They all default to 0,0.
   //MageGeometry(MageGeometryType type, uint8_t numPoints)
   //   : pointCount(numPoints),
   //   typeId(type),
   //   segmentCount(typeId == MageGeometryType::Polygon ? numPoints : numPoints - 1)
   //{
   //}

   std::vector<Point> FlipByFlags(uint8_t flags, uint16_t width, uint16_t height) const;

   //this checks to see if a given point is inside the boundaries of a given geometry:
   bool isPointInGeometry(const Point& point) const;

   static std::optional<Point> getIntersectPointBetweenLineSegments(const Point& lineAPointA, const Point& lineAPointB, const Point& lineBPointA, const Point& lineBPointB);

	static float VectorLength(const int32_t& x, const int32_t& y) { return sqrt((x * x) + (y * y)); };

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
         result = (segmentIndex * 2) % segmentCount;
      }
      return result;
   }

	std::span<Point> GetPoints() const
	{
		return std::span<Point>{(Point*)((uint8_t*)&pathLength + sizeof(pathLength)), pointCount};
	}

	Point GetPoint(uint16_t i) const
	{
		auto points = (uint16_t*)((uint8_t*)&pathLength + sizeof(float));
      return Point{ points[2*i], points[2*i + 1] };
   }
   uint16_t GetPointCount() const { return pointCount;  }

   MageGeometryType GetTypeId() const { return typeId; }
   float GetPathLength() const { return pathLength; }
   float GetSegmentLength(uint16_t index) const { 
      auto segmentLengths = (float*)((uint8_t*)&pathLength + sizeof(float) + pointCount * sizeof(Point));
      return !segmentCount ? 0.0f : segmentLengths[index % segmentCount]; 
   }

private:
   char name[32]{ 0 };
   //can be any MageGeometryType:
   MageGeometryType typeId{ MageGeometryType::Point };
   uint8_t pointCount{ 0 };
   uint8_t segmentCount{ 0 };
   //total length of all segments in the geometry
   float pathLength{ 0.0f };

};

#endif //_MAGE_GEOMETRY_H
