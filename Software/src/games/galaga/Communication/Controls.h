/*
 * Controls.h
 *
 *  Created on: Aug 2, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_COMMUNICATION_CONTROLS_H_
#define GAMES_GALAGA_COMMUNICATION_CONTROLS_H_
#include <games/galaga/Communication/Buttons.h>
#include <games/galaga/Communication/IAction.h>
#include <games/galaga/Communication/Actions/LeftClick.h>
class Controls {
	public:
		Controls(){
			//sets up the default
//			IAction
//			list = new IAction[6];
//			list[BTN_UP] = new LeftClick;
//			list[BTN_DOWN] = new LeftClick;
//			list[BTN_LEFT] = new LeftClick;
//			list[BTN_RIGHT] = new LeftClick;
//			list[BTN_A] = new LeftClick;
//			list[BTN_B] = new LeftClick;
		}
		~Controls() {
//			for (int i = 0; i < 6; ++i)
//			    delete list[i];
//			delete[] list;
		}
		void fireButton(Buttons button) {
//			if (list != NULL){
//				list[button].doAction();
//			}
		}
		void undoButton(Buttons button){
//			if (list != NULL){
//				list[button].undo();
//			}
		}

	private:
		IAction* list;

};



#endif /* GAMES_GALAGA_COMMUNICATION_CONTROLS_H_ */
