# Actions

**Actions** are a basic element of the DC801 Mage Game Engine (MGE) along with [entities](../entities).

They are individual units of script behavior, such as a logic check or state management, given one after the other within a single [script](../scripts). They each have predefined arguments, and are indicated with "SCREAMING_SNAKE_CASE." In the encoded game, they are 8 bytes a piece.

Each action requires specific JSON properties, but through [MGS Natlang](../mgs/mgs_natlang), they can instead be written as one or more "natural language" patterns which can then be converted into JSON.

## Game Management

Handle the general state of the game, such as [loading maps](../maps/map_loads), timing game actions, enabling and disabling player input, and managing save states.

- [BLOCKING_DELAY](../actions/BLOCKING_DELAY)
- [NON_BLOCKING_DELAY](../actions/NON_BLOCKING_DELAY)
- [SET_PLAYER_CONTROL](../actions/SET_PLAYER_CONTROL)
- [LOAD_MAP](../actions/LOAD_MAP)
- [SLOT_SAVE](../actions/SLOT_SAVE)
- [SLOT_LOAD](../actions/SLOT_LOAD)
- [SLOT_ERASE](../actions/SLOT_ERASE)
- [SHOW_DIALOG](../actions/SHOW_DIALOG)
- [CLOSE_DIALOG](../actions/CLOSE_DIALOG)
- [SET_LIGHTS_CONTROL](../actions/SET_LIGHTS_CONTROL)
- [SET_LIGHTS_STATE](../actions/SET_LIGHTS_STATE)

## Hex Editor

Enable or disable player control of specific game features, and otherwise manage the hex editor state.

- [SET_HEX_EDITOR_STATE](../actions/SET_HEX_EDITOR_STATE)
- [SET_HEX_EDITOR_DIALOG_MODE](../actions/SET_HEX_EDITOR_DIALOG_MODE)
- [SET_HEX_EDITOR_CONTROL](../actions/SET_HEX_EDITOR_CONTROL)
- [SET_HEX_EDITOR_CONTROL_CLIPBOARD](../actions/SET_HEX_EDITOR_CONTROL_CLIPBOARD)

## Serial Console

Manage serial features and create serial output.

- [SET_SERIAL_DIALOG_CONTROL](../actions/SET_SERIAL_DIALOG_CONTROL)
- [SHOW_SERIAL_DIALOG](../actions/SHOW_SERIAL_DIALOG)
- [CLOSE_SERIAL_DIALOG](../actions/CLOSE_SERIAL_DIALOG)
- [SET_CONNECT_SERIAL_DIALOG](../actions/SET_CONNECT_SERIAL_DIALOG)
- [REGISTER_SERIAL_DIALOG_COMMAND](../actions/REGISTER_SERIAL_DIALOG_COMMAND)
- [UNREGISTER_SERIAL_DIALOG_COMMAND](../actions/UNREGISTER_SERIAL_DIALOG_COMMAND)
- [REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT](../actions/REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT)
- [UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT](../actions/UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT)

## Camera Control

Manipulate the camera's position or perform tricks like shaking the camera or fading the screen in and out to an arbitrary color.

- [SET_CAMERA_TO_FOLLOW_ENTITY](../actions/SET_CAMERA_TO_FOLLOW_ENTITY)
- [TELEPORT_CAMERA_TO_GEOMETRY](../actions/TELEPORT_CAMERA_TO_GEOMETRY)
- [PAN_CAMERA_TO_ENTITY](../actions/PAN_CAMERA_TO_ENTITY)
- [PAN_CAMERA_TO_GEOMETRY](../actions/PAN_CAMERA_TO_GEOMETRY)
- [PAN_CAMERA_ALONG_GEOMETRY](../actions/PAN_CAMERA_ALONG_GEOMETRY)
- [LOOP_CAMERA_ALONG_GEOMETRY](../actions/LOOP_CAMERA_ALONG_GEOMETRY)
- [SET_SCREEN_SHAKE](../actions/SET_SCREEN_SHAKE)
- [SCREEN_FADE_OUT](../actions/SCREEN_FADE_OUT)
- [SCREEN_FADE_IN](../actions/SCREEN_FADE_IN)

## Script Control

Set a specific [on_tick](../scripts/on_tick) or [on_interact](../scripts/on_interact) script, run another script, or recursively copy the actions inside another script.

- [RUN_SCRIPT](../actions/RUN_SCRIPT)
- [GOTO_ACTION_INDEX](../actions/GOTO_ACTION_INDEX)
- [COPY_SCRIPT](../actions/COPY_SCRIPT)
- [SET_MAP_TICK_SCRIPT](../actions/SET_MAP_TICK_SCRIPT)
- [SET_ENTITY_INTERACT_SCRIPT](../actions/SET_ENTITY_INTERACT_SCRIPT)
- [SET_ENTITY_TICK_SCRIPT](../actions/SET_ENTITY_TICK_SCRIPT)
- [SET_ENTITY_LOOK_SCRIPT](../actions/SET_ENTITY_LOOK_SCRIPT)
- [SET_SCRIPT_PAUSE](../actions/SET_SCRIPT_PAUSE)

## Entity Choreography

Move entities around the map using [vector objects](../maps/vector_objects) placed with Tiled.

NOTE: These actions can behave erratically if any of the vertices in the geometry object are subject to coordinate underflow.

- [SET_ENTITY_PATH](../actions/SET_ENTITY_PATH)
- [TELEPORT_ENTITY_TO_GEOMETRY](../actions/TELEPORT_ENTITY_TO_GEOMETRY)
- [WALK_ENTITY_TO_GEOMETRY](../actions/WALK_ENTITY_TO_GEOMETRY)
- [WALK_ENTITY_ALONG_GEOMETRY](../actions/WALK_ENTITY_ALONG_GEOMETRY)
- [LOOP_ENTITY_ALONG_GEOMETRY](../actions/LOOP_ENTITY_ALONG_GEOMETRY)

## Entity Appearance

Many of these actions (the ones that don't have an explicit duration) will happen instantly. Therefore, if several are used back-to-back, they will all resolve on the same frame. If this is not intended behavior, you should pad them with [non-blocking delay](../NON_BLOCKING_DELAY).

- [PLAY_ENTITY_ANIMATION](../actions/PLAY_ENTITY_ANIMATION)
- [SET_ENTITY_CURRENT_ANIMATION](../actions/SET_ENTITY_CURRENT_ANIMATION)
- [SET_ENTITY_CURRENT_FRAME](../actions/SET_ENTITY_CURRENT_FRAME)
- [SET_ENTITY_DIRECTION](../actions/SET_ENTITY_DIRECTION)
- [SET_ENTITY_DIRECTION_RELATIVE](../actions/SET_ENTITY_DIRECTION_RELATIVE)
- [SET_ENTITY_DIRECTION_TARGET_ENTITY](../actions/SET_ENTITY_DIRECTION_TARGET_ENTITY)
- [SET_ENTITY_DIRECTION_TARGET_GEOMETRY](../actions/SET_ENTITY_DIRECTION_TARGET_GEOMETRY)
- [SET_ENTITY_MOVEMENT_RELATIVE](../actions/SET_ENTITY_MOVEMENT_RELATIVE)
- [SET_ENTITY_GLITCHED](../actions/SET_ENTITY_GLITCHED)

## Set Entity Properties

Set a specific property on a specific [entity](../entities).

- [SET_ENTITY_NAME](../actions/SET_ENTITY_NAME)
- [SET_ENTITY_X](../actions/SET_ENTITY_X)
- [SET_ENTITY_Y](../actions/SET_ENTITY_Y)
- [SET_ENTITY_TYPE](../actions/SET_ENTITY_TYPE)
- [SET_ENTITY_PRIMARY_ID](../actions/SET_ENTITY_PRIMARY_ID)
- [SET_ENTITY_SECONDARY_ID](../actions/SET_ENTITY_SECONDARY_ID)
- [SET_ENTITY_PRIMARY_ID_TYPE](../actions/SET_ENTITY_PRIMARY_ID_TYPE)

## Set Variables

Manipulate MGE variables or set them to an arbitrary value.

- [SET_SAVE_FLAG](../actions/SET_SAVE_FLAG)
- [SET_WARP_STATE](../actions/SET_WARP_STATE)
- [MUTATE_VARIABLE](../actions/MUTATE_VARIABLE)
- [MUTATE_VARIABLES](../actions/MUTATE_VARIABLES)
- [COPY_VARIABLE](../actions/COPY_VARIABLE)

## Check Entity Properties

These actions check whether one of an [entity](../entities)'s [properties](../entities/entity_properties) matches a specific state. If the condition is met (or not met), then the script will jump: either to a specific point in the same script or the top of an entirely different script.

You can use [%SELF%](../entities/SELF) to target the entity running the script and [%PLAYER%](../entities/PLAYER) to target the player entity. Otherwise, you must use the entity's given name (its name in Tiled).

You can use the condition portion of these following actions with [if and else](../mgs/advanced_syntax/if_and_else).

- [CHECK_ENTITY_NAME](../actions/CHECK_ENTITY_NAME)
- [CHECK_ENTITY_X](../actions/CHECK_ENTITY_X)
- [CHECK_ENTITY_Y](../actions/CHECK_ENTITY_Y)
- [CHECK_ENTITY_INTERACT_SCRIPT](../actions/CHECK_ENTITY_INTERACT_SCRIPT)
- [CHECK_ENTITY_TICK_SCRIPT](../actions/CHECK_ENTITY_TICK_SCRIPT)
- [CHECK_ENTITY_LOOK_SCRIPT](../actions/CHECK_ENTITY_LOOK_SCRIPT)
- [CHECK_ENTITY_TYPE](../actions/CHECK_ENTITY_TYPE)
- [CHECK_ENTITY_PRIMARY_ID](../actions/CHECK_ENTITY_PRIMARY_ID)
- [CHECK_ENTITY_SECONDARY_ID](../actions/CHECK_ENTITY_SECONDARY_ID)
- [CHECK_ENTITY_PRIMARY_ID_TYPE](../actions/CHECK_ENTITY_PRIMARY_ID_TYPE)
- [CHECK_ENTITY_CURRENT_ANIMATION](../actions/CHECK_ENTITY_CURRENT_ANIMATION)
- [CHECK_ENTITY_CURRENT_FRAME](../actions/CHECK_ENTITY_CURRENT_FRAME)
- [CHECK_ENTITY_DIRECTION](../actions/CHECK_ENTITY_DIRECTION)
- [CHECK_ENTITY_GLITCHED](../actions/CHECK_ENTITY_GLITCHED)
- [CHECK_ENTITY_PATH](../actions/CHECK_ENTITY_PATH)
- [CHECK_IF_ENTITY_IS_IN_GEOMETRY](../actions/CHECK_IF_ENTITY_IS_IN_GEOMETRY)

## Check Variables

Check whether one of the MGE variables matches a specific value. If the condition is met (or not met), then the script will jump: either to a specific point in the same script or the top of an entirely different script.

You can use the condition portion of these following actions with [if and else](../mgs/advanced_syntax/if_and_else).

- [CHECK_VARIABLE](../actions/CHECK_VARIABLE)
- [CHECK_VARIABLES](../actions/CHECK_VARIABLES)
- [CHECK_SAVE_FLAG](../actions/CHECK_SAVE_FLAG)
- [CHECK_FOR_BUTTON_PRESS](../actions/CHECK_FOR_BUTTON_PRESS)
- [CHECK_FOR_BUTTON_STATE](../actions/CHECK_FOR_BUTTON_STATE)
- [CHECK_WARP_STATE](../actions/CHECK_WARP_STATE)
- [CHECK_DIALOG_OPEN](../actions/CHECK_DIALOG_OPEN)
- [CHECK_SERIAL_DIALOG_OPEN](../actions/CHECK_SERIAL_DIALOG_OPEN)
- [CHECK_DEBUG_MODE](../actions/CHECK_DEBUG_MODE)
