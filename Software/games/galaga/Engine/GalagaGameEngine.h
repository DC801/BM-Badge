/*
 * GameEngine.h
 *
 *  Created on: Aug 2, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_ENGINE_GALAGAGAMEENGINE_H_
#define GAMES_GALAGA_ENGINE_GALAGAGAMEENGINE_H_
#define GAMESTATE_SIZE 12
#define FRAME_INTERVAL 50
#define PROCESS_INTERVAL 25
#include <games/galaga/Objects/RenderedObjects.h>
#include <games/galaga/Communication/CheckInput.h>
#include "games/hcrn/FrameBuffer.h"


class GalagaGameEngine {
	public:
		GalagaGameEngine();
		~GalagaGameEngine(){};
		RenderedObjects* getRenderedObjects();
		int start();
		void loop(uint32_t dt);
	private:
		bool quit;
		uint32_t lastFrame, lastTime, lastProcess;
		RenderedObjects window;
		CheckInput userControls;
		uint32_t racestart;
		uint8_t mapstates[100];
		uint8_t gamestate[GAMESTATE_SIZE];

};

#endif /* GAMES_GALAGA_ENGINE_GALAGAGAMEENGINE_H_ */
