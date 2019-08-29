/*
 * doNothing.h
 *
 *  Created on: Aug 2, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_COMMUNICATION_ACTIONS_DONOTHING_H_
#define GAMES_GALAGA_COMMUNICATION_ACTIONS_DONOTHING_H_

#include <games/galaga/Communication/IAction.h>

class DoNothing : public IAction {
	void doAction();
	void undo();
};



#endif /* GAMES_GALAGA_COMMUNICATION_ACTIONS_DONOTHING_H_ */
