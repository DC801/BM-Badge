/*
 * level1.h
 *
 *  Created on: Aug 3, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_RESOURCES_MAPS_LEVEL1_H_
#define GAMES_GALAGA_RESOURCES_MAPS_LEVEL1_H_

#include <games/galaga/Objects/renderableObjects/Alien.h>
#include <games/galaga/Objects/renderableObjects/PlayerShip.h>
#include <games/galaga/Objects/renderableObjects/AlienGroup.h>
#include "games/galaga/Objects/RenderedObjects.h"

class Level1 {
	public:
		Level1(RenderedObjects* _window) {
			window = _window;
		}

		void setup() {
			(*window).addObject(new Alien(2, 1,70,70));
			(*window).addObject(new Alien(3, 2,110,35));
			(*window).addObject(new Alien(4, 3,0,0));
			(*window).addObject(new PlayerShip(1));
			AlienGroup* wave1 = new AlienGroup();
			std::list<NavPoint> navPath = { NavPoint({0, 0}), NavPoint({15, 0}), NavPoint({30, 0}), NavPoint({45, 0}) };
			wave1->setPath(navPath, 1);
			wave1->generateAliens(1, 4, 5);
		}
	private:
		RenderedObjects* window;

};


#endif /* GAMES_GALAGA_RESOURCES_MAPS_LEVEL1_H_ */
