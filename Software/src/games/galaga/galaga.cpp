/*
 * galaga.cpp
 *
 *  Created on: Aug 3, 2019
 *      Author: matweaver7
 */

#include "galaga.h"

extern "C" int galaga_run(){
	GalagaGameEngine galagaEngine = GalagaGameEngine();
	return galagaEngine.start();
}
