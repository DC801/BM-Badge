/*
 * action.h
 *
 *  Created on: Aug 2, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_COMMUNICATION_IACTION_H_
#define GAMES_GALAGA_COMMUNICATION_IACTION_H_

class IAction {
	public:
		IAction(){}
		~IAction(){}
		void doAction();
		void undo();
};



#endif /* GAMES_GALAGA_COMMUNICATION_IACTION_H_ */
