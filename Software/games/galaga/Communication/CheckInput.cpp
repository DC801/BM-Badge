/*
 * CheckInput.cpp
 *
 *  Created on: Aug 4, 2019
 *      Author: mweaver
 */

#include <games/galaga/Communication/CheckInput.h>
#include <games/galaga/Communication/Actions/LeftClick.h>
#include <games/galaga/Communication/Actions/RightClick.h>
#include "games/hcrn/FrameBuffer.h"

CheckInput::CheckInput() {
	// TODO Auto-generated constructor stub
	//controls = new Controls;
}


CheckInput::~CheckInput() {
	// TODO Auto-generated destructor stub
}
void CheckInput::CheckUserInput() {
	if (isButtonDown(USER_BUTTON_LEFT)) {
		printf("detected left click\n");
		//controls.fireButton(Buttons::BTN_LEFT);
		LeftClick click = LeftClick();
		click.doAction();
	}
	if (isButtonDown(USER_BUTTON_RIGHT)) {
		printf("detected right click\n");
		//controls.fireButton(Buttons::BTN_RIGHT);
		RightClick click = RightClick();
		click.doAction();
	}
}

