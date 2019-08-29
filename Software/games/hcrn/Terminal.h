//
//  Terminal.hpp
//  DC801
//
//  Created by DC801 for DEFCON27.
//

#ifndef Terminal_h
#define Terminal_h

#include "GameObject.h"

class Terminal : public GameObject {
public:
    Terminal();
    Terminal(Point at);
    ~Terminal();
    
    void draw(FrameBuffer* canvas);
    Rect getBoundingbox();
    bool think(Room* room);
    void collide(GameObject* other);
    void interact(FrameBuffer* canvas);
    
private:
    void showStatusMessage();
    void showMainMenu(void);
#ifdef DEBUGMODE
    void debugMenu(int page);
#endif
    void showConfigMenu(void);
    void showGameMenu(void);
    
    uint8_t frame, id;
    bool solved;
};

#endif /* Terminal_h */
