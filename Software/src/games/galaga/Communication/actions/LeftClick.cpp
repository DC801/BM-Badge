/*
 * LeftClick.cpp
 *
 *  Created on: Aug 3, 2019
 *      Author: matweaver7
 */

#include "games/galaga/Communication/actions/LeftClick.h"
#include "games/galaga/Engine/ResourceLoader/ResourceLoader.h"
#include "games/galaga/Objects/RenderedObjects.h"
#include "games/galaga/Objects/Object.h"
#include "games/galaga/Objects/renderableObjects/PlayerShip.h"
void LeftClick::doAction(){
	ResourceLoader* resourceLoader = ResourceLoader::getInstance();
	RenderedObjects* renderedObjects = (*resourceLoader).getRenderedObjects();
	Object* playerShipObject = (*renderedObjects).getObject(1);
	printf("return Object %d\n", playerShipObject->id);
	PlayerShip* playerShip = (PlayerShip*) playerShipObject;
	(*playerShip).moveLeft(*playerShipObject, false);
}


