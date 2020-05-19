/*
 * RenderedObjects.h
 *
 *  Created on: Aug 3, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_OBJECTS_RENDEREDOBJECTS_H_
#define GAMES_GALAGA_OBJECTS_RENDEREDOBJECTS_H_

#include <games/galaga/Objects/Object.h>
#include <vector>
#include <algorithm>
#include "games/hcrn/FrameBuffer.h"
class RenderedObjects {
	public:
		RenderedObjects(){};
		~RenderedObjects();
		void addObject(Object* obj);
		Object* getObject(int id);
		void removeObject(Object obj);
		void renderCanvas();
		bool operator== (const Object &n2);
		void printList();
		void printSize(){
			//printf("List Size is: %d\n", listOfObjects.size());
		}
	private:
		std::vector<Object*> listOfObjects;
};



#endif /* GAMES_GALAGA_OBJECTS_RENDEREDOBJECTS_H_ */
