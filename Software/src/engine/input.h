#ifndef ENGINE_INPUT_H
#define ENGINE_INPUT_H

typedef struct {
    bool up;
    bool down;
    bool left;
    bool right;
} ButtonStates;

void EngineHandleInput(ButtonStates* buttons);
bool EngineIsRunning();

#endif