/*
 * AlienGroup.cpp
 *
 *  Created on: Aug 4, 2019
 *      Author: bashninja
 */

#include "games/galaga/Objects/renderableObjects/AlienGroup.h"
#include "games/galaga/Engine/ResourceLoader/ResourceLoader.h"
#include <vector>
#include <list>

AlienGroup::AlienGroup() {
	// TODO Auto-generated constructor stub

}


AlienGroup::~AlienGroup() {
	// TODO Auto-generated destructor stub
	for (auto p : ListOfAliens){
		 delete p;
	}
	ListOfAliens.clear();
}

void AlienGroup::setPath(std::list<NavPoint> navPath, uint8_t rows) {
	NavigationPath = navPath;
	NavigationPathRows = rows;
}

void AlienGroup::generateAliens(int Alientype, int numberOfAliens, int idStart) {

	ResourceLoader* resourceLoader = ResourceLoader::getInstance();
	RenderedObjects* renderedObjects = (*resourceLoader).getRenderedObjects();

	std::list<NavPoint>::iterator point = NavigationPath.begin();

	for (int i = 0; i < numberOfAliens; ++i, ++point){
		Alien* newAlien = new Alien(idStart + i, Alientype, (*point).x, (*point).x);
		(*renderedObjects).addObject(newAlien);
		ListOfAliens.push_back(newAlien);
	}

}

void AlienGroup::addAlien(Alien* alien) {
	ListOfAliens.push_back(alien);
}

void AlienGroup::removeAlien(Alien* alien) {
	std::vector<Alien*>::iterator iter, end;
	for(iter = ListOfAliens.begin(), end = ListOfAliens.end() ; iter != end; ++iter) {
		if(alien == *iter){
			Object* tmp = (*iter);
			ListOfAliens.erase(iter);
			delete tmp;
		}
	}
}

void AlienGroup::processGroup() {

}

