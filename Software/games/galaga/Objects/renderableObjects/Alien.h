/*
 * Alien.h
 *
 *  Created on: Aug 3, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_OBJECTS_RENDERABLEOBJECTS_ALIEN_H_
#define GAMES_GALAGA_OBJECTS_RENDERABLEOBJECTS_ALIEN_H_
#include <stdint.h>
#include "games/galaga/Objects/Object.h"
#include "games/galaga/resources/ships/AlienShipsRaw.h"
#include "games/galaga/Objects/ObjectActions/MoveableCharacter.h"

struct AlienType {
	int defaultWidth;
	int defaultHeight;
	const uint16_t* data;
};
class Alien: public Object, public MoveableCharacter {
	public:
		Alien(int id, int typeOfAlien, int posX, int posY) {
			 callObjectWithCorrectAlienType(id, typeOfAlien, posX, posY);
		}

	private:
		void callObjectWithCorrectAlienType(int id, int typeOfAlien, int posX, int posY) {
			AlienType* defaultAlien = &alienType1;
			if (typeOfAlien == 2) {
				defaultAlien = &alienType2;
			} else if(typeOfAlien == 3) {
				defaultAlien = &alienType3;
			} else if(typeOfAlien == 4) {
				defaultAlien = &alienType4;
			}

			Object::initialize(id, (*defaultAlien).defaultWidth, (*defaultAlien).defaultHeight, posX, posY, *(&defaultAlien->data));
		}

		AlienType alienType1 = {13, 17, alien1_raw};
		AlienType alienType2 = {18, 17, alien2_raw};
		AlienType alienType3 = {17, 18, alien3_raw};
		AlienType alienType4 = {15, 18, alien4_raw};


};




#endif /* GAMES_GALAGA_OBJECTS_RENDERABLEOBJECTS_ALIEN_H_ */
