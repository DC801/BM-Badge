/*
 * PlayerShip.h
 *
 *  Created on: Aug 3, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_OBJECTS_RENDERABLEOBJECTS_PLAYERSHIP_H_
#define GAMES_GALAGA_OBJECTS_RENDERABLEOBJECTS_PLAYERSHIP_H_
#include "games/galaga/Objects/Object.h"
#include "games/galaga/resources/ships/PlayerShipRaw.h"
#include "games/galaga/Objects/ObjectActions/MoveableCharacter.h"
class PlayerShip : public Object, public MoveableCharacter {
	public:
		PlayerShip(int id) {
			MoveableCharacter::setMovementRate(defaultPlayerShipSpeed);
			Object::initialize(id, defaultWidth, defaultHeight,  defaultPosX, defaultPosY, player_ship_raw);
		}

		PlayerShip(int id, int _width, int _height, int posX, int posY) {
			MoveableCharacter::setMovementRate(defaultPlayerShipSpeed);
			Object::initialize(id, _width, _height,  posX, posY, player_ship_raw);
		}

		PlayerShip(int id, int posX, int posY) {
			MoveableCharacter::setMovementRate(defaultPlayerShipSpeed);
			Object::initialize(id, defaultWidth, defaultHeight, posX, posY, player_ship_raw);
		}

	private:
		const int defaultWidth = 15;
		const int defaultHeight = 20;
		const int defaultPosX = 56;
		const int defaultPosY = 113;
		const int defaultPlayerShipSpeed = 4;
};



#endif /* GAMES_GALAGA_OBJECTS_RENDERABLEOBJECTS_PLAYERSHIP_H_ */
