/*
 * RenderedObjects.cpp
 *
 *  Created on: Aug 3, 2019
 *      Author: matweaver7
 */
#include <games/galaga/Objects/RenderedObjects.h>

void RenderedObjects::printList(){
	for (std::vector<Object*>::iterator it = listOfObjects.begin(); it != listOfObjects.end(); ++it) {
		//printf("the list is %d, %d, %d, %d\n", (*(*it)).position_y, (*(*it)).position_x, (*(*it)).width, (*(*it)).height);
	}
}
Object* RenderedObjects::getObject(int id){
		for (std::vector<Object*>::iterator it = listOfObjects.begin(); it != listOfObjects.end(); ++it) {
			if(id == (*it)->id){
				return (*it);
			}
		}
		return nullptr;
}
void RenderedObjects::addObject(Object* obj) {
	listOfObjects.push_back(obj);
}
void RenderedObjects::removeObject(Object obj){
	std::vector<Object*>::iterator iter, end;
	for(iter = listOfObjects.begin(), end = listOfObjects.end() ; iter != end; ++iter) {
		if(obj == *(*iter)){
			Object* tmp = (*iter);
			listOfObjects.erase(iter);
			delete tmp;
		}
	}
}
void RenderedObjects::renderCanvas() {
	canvas.clearScreen(RGB(0,0,0));

	for (std::vector<Object*>::iterator it = listOfObjects.begin(); it != listOfObjects.end(); ++it) {
		canvas.drawImage((*it)->position_x, (*it)->position_y, (*it)->width, (*it)->height, (*it)->data);
	}

	canvas.blt();

}
RenderedObjects::~RenderedObjects(){
	for (auto p : listOfObjects)
	   {
	     delete p;
	   }
	   listOfObjects.clear();
}
