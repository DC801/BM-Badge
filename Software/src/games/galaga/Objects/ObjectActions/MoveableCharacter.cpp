/*
 * moveableCharacter.cpp
 *
 *  Created on: Aug 3, 2019
 *      Author: matweaver7
 */

#include "MoveableCharacter.h"
#include "common.h"
#include "games/galaga/resources/GalagaCommon.h"
void MoveableCharacter::moveLeft(Object& object, bool allowOffScreen){
//	printf("trying to move at speed: %d\n", movementRate);
	if(AllowedToMove(object, left, allowOffScreen)){
		object.position_x = object.position_x - movementRate;
	} else{
		object.position_x = LEFT_MOST_PIXEL;
	}
}
void MoveableCharacter::moveRight(Object& object, bool allowOffScreen){
//	printf("moving right\n");
	if(AllowedToMove(object, right, allowOffScreen)){
		object.position_x = object.position_x + movementRate;
//		printf("1right movement new position: %d\n", object.position_x);
	} else{
		//the additional minus 2 is because of screen problems on the right
		object.position_x = RIGHT_MOST_PIXEL - object.width;
//		printf("right movement new position: %d\n", object.position_x);
	}
}
void MoveableCharacter::moveUp(Object& object, bool allowOffScreen){
	if(AllowedToMove(object, up, allowOffScreen)){
		object.position_y = object.position_y - movementRate;
	} else{
		object.position_x = TOP_MOST_PIXEL;
	}
}
void MoveableCharacter::moveDown(Object& object, bool allowOffScreen){
	if(AllowedToMove(object, down, allowOffScreen)){
		object.position_y = object.position_y + movementRate;
	} else{
		object.position_x = BOTTOM_MOST_PIXEL - object.height;
	}
}
bool MoveableCharacter::AllowedToMove(Object object, LocalDirection direction, bool allowOffScreen) {
	if (!allowOffScreen){

		if(direction == LocalDirection::left){
			if ((object.position_x - movementRate) < LEFT_MOST_PIXEL){
				return false;
			}
		} else if(direction == LocalDirection::right){
			if ((object.position_x + movementRate + object.width) > RIGHT_MOST_PIXEL){
				return false;
			}
		} else if(direction == LocalDirection::up){
			if ((object.position_x - movementRate) < TOP_MOST_PIXEL){
				return false;
			}
		} else {
			if ((object.position_x + movementRate + object.height) > BOTTOM_MOST_PIXEL){
				return false;
			}
		}

	}
	return true;
}


