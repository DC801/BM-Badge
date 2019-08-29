//
//  Rect.h
//  DC801
//
//  Created by Professor Plum on 3/11/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Rect_h
#define Rect_h

#include "Point.h"

class Rect {
public:
    Rect(): x(0), y(0), w(0), h(0) {};
    Rect(int _x, int _y, int _w, int _h) : x(_x), y(_y), w(_w), h(_h) {};
    Rect(const Rect &r) : x(r.x), y(r.y), w(r.w), h(r.h) {};
    Rect(const Point &p, int _w, int _h): x(p.x), y(p.y), w(_w), h(_h) {};
    Rect(const Point &p1, const Point &p2) : x(p1.x), y(p1.y), w(0), h(0) {include(p2);};
    
    void include(Point p) {
        if(p.x<x){w+=x-p.x;y=p.x;}
        if(p.y<y){h+=y-p.y;y=p.y;}
        if(p.x>(x+w)) {w=p.x-x;}
        if(p.y>(y+h)) {h=p.y-y;}
    }
    
    Point topLeft() const {return Point(x,y);}
    Point botomRight() const {return Point(x+w, y+h);}
    
    bool intersects(const Rect &r) const {
        if ((x+w) < r.x) return false;
        if ((r.w + r.x) < x) return false;
        if ((y+h) < r.y) return false;
        if ((r.y + r.h) < y) return false;
        return true;
    }
    Rect &shift(const Point& p) {x+=p.x; y+=p.y;return (*this);}
    
    //Rect &operator+=(const Point &p) {include(p);return (*this);}
    
    Rect &operator+=(const Rect &r) {include(r.topLeft());include(r.botomRight());return (*this);}
    
    int x,y,w,h;
};

#endif /* Rect_h */
