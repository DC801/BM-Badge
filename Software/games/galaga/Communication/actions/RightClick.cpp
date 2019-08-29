/*
 * RightClick.cpp
 *
 *  Created on: Aug 4, 2019
 *      Author: matweaver7
 */
#include "games/galaga/Communication/actions/RightClick.h"
#include "games/galaga/Engine/ResourceLoader/ResourceLoader.h"
#include "games/galaga/Objects/RenderedObjects.h"
#include "games/galaga/Objects/Object.h"
#include "games/galaga/Objects/renderableObjects/PlayerShip.h"
void RightClick::doAction(){
	ResourceLoader* resourceLoader = ResourceLoader::getInstance();
	RenderedObjects* renderedObjects = (*resourceLoader).getRenderedObjects();
	Object* playerShipObject = (*renderedObjects).getObject(1);
	PlayerShip* playerShip = (PlayerShip*) playerShipObject;
	(*playerShip).moveRight(*playerShipObject, false);
}


