/*
 * ResourceLoader.h
 *
 *  Created on: Aug 3, 2019
 *      Author: matweaver7
 */

#ifndef GAMES_GALAGA_ENGINE_RESOURCELOADER_RESOURCELOADER_H_
#define GAMES_GALAGA_ENGINE_RESOURCELOADER_RESOURCELOADER_H_
#include <games/galaga/Objects/RenderedObjects.h>

class ResourceLoader {
	public:
		 static ResourceLoader* getInstance(){
			static ResourceLoader instance;
			return &instance;
		}
		void setRenderedObject(RenderedObjects* _window){
			window = _window;
		};
		RenderedObjects* getRenderedObjects(){
			return window;
		};
	private:
		ResourceLoader() {}
		ResourceLoader(ResourceLoader const&){}; // Don't Implement
		void operator=(ResourceLoader const&){}; // Don't implement
		RenderedObjects* window;
};



#endif /* GAMES_GALAGA_ENGINE_RESOURCELOADER_RESOURCELOADER_H_ */
