//
//  Point.h
//  DC801
//
//  Created by Professor Plum on 3/6/19.
//  Copyright © 2019 Professor Plum. All rights reserved.
//

#ifndef Point_h
#define Point_h

class Point {
public:
    Point() {};
    Point(int _x, int _y) : x(_x), y(_y) {};
    Point(const Point &p) : x(p.x), y(p.y) {};
    
    Point &operator+=(const Point &p) {x+=p.x;y+=p.y;return (*this);}
    Point &operator-=(const Point &p) {x-=p.x;y-=p.y;return (*this);}
    
    Point operator+(const Point &p){return Point(x+p.x, y+p.y);};
    Point operator-(const Point &p){return Point(x-p.x, y-p.y);};
    
    Point &operator*=(int m) {x*=m;y*=m;return (*this);}
    Point &operator/=(int m) {x/=m;y/=m;return (*this);}
    
    Point operator*(int m){return Point(x*m, y*m);}
    Point operator/(int m){return Point(x/m, y/m);}
    
    Point &operator=(const Point &rhs) {x=rhs.x;y=rhs.y;return (*this);}
    Point &operator-() {x=-x;y=-y;return (*this);}
    int &operator[](int i) {return i%2?y:x;}
    
    int x,y;
};

#endif /* Point_h */
