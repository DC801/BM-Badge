/*
 * AlienGroup.h
 *
 *  Created on: Aug 3, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_OBJECTS_RENDERABLEOBJECTS_ALIENGROUP_H_
#define GAMES_GALAGA_OBJECTS_RENDERABLEOBJECTS_ALIENGROUP_H_
#include "games/galaga/Objects/renderableObjects/Alien.h"
#include <vector>
#include <list>

struct NavPoint {
	uint8_t x;
	uint8_t y;
};

class AlienGroup {
	public:
		AlienGroup();
		~AlienGroup();
		void setPath(std::list<NavPoint> navPath, uint8_t rows);
		void generateAliens(int Alientype, int numberOfAliens, int idStart);
		void addAlien(Alien* alien);
		void removeAlien(Alien* alien);
		void processGroup();

	private:
		std::list<NavPoint> NavigationPath;
		std::vector<Alien*> ListOfAliens;
		uint8_t NavigationPathRows;

};


#endif /* GAMES_GALAGA_OBJECTS_RENDERABLEOBJECTS_ALIENGROUP_H_ */
