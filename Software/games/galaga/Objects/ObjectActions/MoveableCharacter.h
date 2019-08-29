/*
 * moveableCharacter.h
 *
 *  Created on: Aug 2, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_MOVEABLECHARACTER_H_
#define GAMES_GALAGA_MOVEABLECHARACTER_H_
#include <games/galaga/Objects/Object.h>
enum LocalDirection{
	up,
	down,
	left,
	right
};
class MoveableCharacter {
	public:
		MoveableCharacter(){}
		void setMovementRate(int MovementRate){movementRate = MovementRate;}
		void moveLeft(Object& object, bool allowOffScreen);
		void moveRight(Object& object, bool allowOffScreen);
		void moveUp(Object& object, bool allowOffScreen);
		void moveDown(Object& object, bool allowOffScreen);
	private:
		bool AllowedToMove(Object object, LocalDirection direction, bool allowOffScreen);
		int movementRate;
};



#endif /* GAMES_GALAGA_MOVEABLECHARACTER_H_ */
