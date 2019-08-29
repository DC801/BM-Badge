/*
 * object.h
 *
 *  Created on: Aug 2, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_OBJECT_H_
#define GAMES_GALAGA_OBJECT_H_
#include <stdint.h>
class Object {
	public:
		Object(){}
		void initialize(int _id, int _width, int _height, int posX, int posY, const uint16_t* _data) {
			id = _id;
			width = _width;
			height = _height;
			position_x = posX;
			position_y = posY;
			data = _data;
		}
		//uniqueID
		int id;
		//		number of pixels horizontally
		int width;
		//		number of pixels vertically.
		int height;
		//		Position is the top position
		int position_y;
		//		Position is the left position
		int position_x;
		//		Picture Data
		const uint16_t *data;

		bool operator== (const Object &n2) {
			bool results = (width == n2.width);
			results &= (id == n2.id);
			results &= (height == n2.height);
			results &= (position_y == n2.position_y);
			results &= (position_x == n2.position_x);
			results &= (data == n2.data);

			return results;
		}
};



#endif /* GAMES_GALAGA_OBJECT_H_ */
