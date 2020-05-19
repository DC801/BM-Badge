/*
 * CheckInput.h
 *
 *  Created on: Aug 4, 2019
 *      Author: mweaver
 */

#ifndef GAMES_GALAGA_COMMUNICATION_CHECKINPUT_H_
#define GAMES_GALAGA_COMMUNICATION_CHECKINPUT_H_
//#include "games/galaga/Communication/Controls.h"
class CheckInput {
public:
	CheckInput();
	virtual ~CheckInput();
	void CheckUserInput();
private:
	//Controls controls;
};

#endif /* GAMES_GALAGA_COMMUNICATION_CHECKINPUT_H_ */
