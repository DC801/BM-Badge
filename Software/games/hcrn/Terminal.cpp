//
//  Terminal.cpp
//  DC801
//
//  Created by DC801 for DEFCON27.
//

#include "Terminal.h"
#include "GameEngine.h"
#include "sprites_raw.h"
#include "common.h"

Terminal::Terminal() : frame(0), id(255), solved(false) {
    life=100;
    blocking = true;
}

Terminal::Terminal(Point at) :frame(0), id(255), solved(false) {
    life = 100;
    blocking = true;
    position = at + Point(4,5);
}

Terminal::~Terminal() {
    
}

void Terminal::draw(FrameBuffer* canvas) {
    uint16_t offx = frame++/2;
    if (solved)
        offx*=2;
    offx %= 4;
    canvas->drawImage(position.x, position.y, 7, 6, terminal_raw, offx*7, 0, 4*7, BGCOLOR);
}

Rect Terminal::getBoundingbox() {
    return Rect(position, 4, 4);
}

bool Terminal::think(Room* room) {
    uint8_t roomid = room->getId();
    if (id == 255)
        id = roomid;
    
    //Big ugly code mess below
    if ((frame % 10) == 0) {// only needs to be check once in a while
        if ((roomid == 23) && game.isTaskComplete(FIRST_ATTEMPT))
            solved = true;
        else if ((roomid == 18) && game.isTaskComplete(CORE_POWERED))
            solved = true;
        else if ((roomid == 57) && game.isTaskComplete(COMP_UNLOCKED))
            solved = true;
        else if ((roomid == 86) && game.isTaskComplete(BRIDGE_OPEN))
            solved = true;
        else if ((roomid == 4) && game.isTaskComplete(TRUSTERS_ON))
            solved = true;
        else if ((roomid == 56) && game.isTaskComplete(WEAPONS_ON))
            solved = true;
        else if ((roomid == 19) && game.isTaskComplete(SHIELDS_ON))
            solved = true;
        else if ((roomid == 53) && game.isTaskComplete(DEAD_OPEN))
            solved = true;
        else if ((roomid == 47) && game.isTaskComplete(COMMS_ON))
            solved = true;
        else if ((roomid == 89) && game.isTaskComplete(BEAT_RACE))
            solved = true;
    }
    
    return true;
}

void Terminal::collide(GameObject* other) {
}

void Terminal::interact(FrameBuffer* canvas) {
	switch(id) {
        case 23:
            if (game.isTaskComplete(FIRST_ATTEMPT))
            	showMainMenu();
            else {
            	if(!game.isTaskComplete(TERMINAL_BOOT)){
            		game.TerminalBoot();
            		game.completeTask(TERMINAL_BOOT);
            	}
                if (game.ShowTerminal("Jrypbzr gb gur fuvc\nGnufurrc. Cyrnfr ragre\ngur pbqr RONP gb cbjre\nba gur flfgrzf.", 4) == 0xEBAC) { //0xEBAC
                    game.ShowTerminal("Systems powering up...", 0);
                    game.completeTask(FIRST_ATTEMPT);
                    game.flicker(true);
                }
                else{
                    game.ShowTerminal("Invalid configuration", 0);
                    game.ShowDialog("Yeah. It looked like \njibberish to me too. \nYou'll have to figure\nout what it means\nthough.", MILLER_AVATAR, true);
                }
            }
            break;
        case 18: //Engineering with Main Reactor
            if (game.isTaskComplete(CORE_POWERED))
            {
            	showMainMenu();
            }
            // fun captcha
            else if (game.ShowTerminalCaptcha("The Main Reactor is on lock down.\n\nProve your humanity.","Enter captcha:", 5, "hcrn/DC801.bmp") == 0xDC801)
            {   // random trivia
            	int hex1 = game.ShowTerminal("Please answer the\nfollowing question:\n\nWhat is the answer to\nlife the universe, and\neverything?", 4);
            	if (hex1 == 42 || hex2dec(hex1) == 42)
            	{   // math question
                	int hex2 = game.ShowTerminalCaptcha("Please solve the\nfollowing equation:\n\nGiven DEF, find DE\n","Enter (DE x 100):", 4, "hcrn/trig.bmp");
            		if (hex2 == 690 || hex2dec(hex2) == 690)
            		{   //  V=IR electronics question
                    	int hex3 = game.ShowTerminalCaptcha("Please solve: \nWhat is the current\nflowing through R1?\n","Enter in mA:", 4, "hcrn/res.bmp");
                		if (hex3 == 227 || hex2dec(hex3) == 227)
                		{   // xkcd question
							if (!game.TerminalRequestResponse("WHEN LITTLEFOOT'S\nMOTHER DIED IN THE\nORIGINAL 'LAND BEFORE\nTIME, 'DID YOU FEEL SAD?\n\n(BOTS: NO LYING)", "YES", "NO"))
							{
								game.ShowTerminal("Valid captcha.", 0);
								game.ShowDialog("Simple Captcha. I don't\nthink I could have\nanswered some of\nthose. Does that make\nme a robot?", MILLER_AVATAR, true);
								game.ShowDialog("I don't know. Seems like\nI'm acing my Turing test,\nthough.", MILLER_AVATAR, true);
								game.ShowTerminal("Powering up Main\nReactor........\n................\n................\nPowered on", 0);
								game.completeTask(CORE_POWERED);
							}
                            else
                                game.ShowTerminal("Automated access\ndetected!\nResetting terminal.", 0);
            			}
                        else
                            game.ShowTerminal("Automated access\ndetected!\nResetting terminal.", 0);
                	}
                    else
                        game.ShowTerminal("Automated access\ndetected!\nResetting terminal.", 0);
            	}
                else
                    game.ShowTerminal("Automated access\ndetected!\nResetting terminal.", 0);
            }
            else
                game.ShowTerminal("Automated access\ndetected!\nResetting terminal.", 0);
            break;
        case 57:
            if (game.isTaskComplete(COMP_UNLOCKED))
            	showMainMenu();
            else {
            	char response[5]; // extra for null char
            	printf("string: %s\n", response);
            	game.ShowTerminalText("System on lock down.\nEnter passcode:", 4, response);
    			if (strncmp("BASH", response, strlen(response)) == 0) {
                    game.ShowTerminal("System unlocked", 0);
                    game.ShowDialog("You cracked that\npassword. Impressive.\nI guess I better tell\nyou who I am.", MILLER_AVATAR, true);
                    game.ShowDialog("The name is Miller.\nIt looks like I'm stuck\nhere with you.", MILLER_AVATAR, true);
                    if (game.DialogRequestResponse("Let's try to get off\nthis broken can.","Nice to meet you,\nMiller.", "Hey, what's with the hat?", MILLER_AVATAR)){
                      	game.ShowDialog("Keeps the rain off my\nhead.", MILLER_AVATAR, true);
                    }
                    game.ShowDialog("Up ahead is the\ncrew quarters. It's\npretty much a giant\nmaze. So try not to get lost.", MILLER_AVATAR, true);
                    game.ShowDialog("I'm remembering now that\nthe ship was attacked\nby a bio-weapon. I don't\nknow what you'll find\nahead.", MILLER_AVATAR, true);
                    game.ShowDialog("Probably something\nnasty.\n\nWatch your doors and\ncorners kid.", MILLER_AVATAR, false);
                    game.completeTask(COMP_UNLOCKED);
                } else {
                    game.ShowTerminalError("Checking passcode\nagainst the database...","ERROR! \n System is corrup\nDoes not match.\n$1$v6HoeKu$IvYB4ncnm6nM55ZxAqpg4/",2);
                }
            }
            break;
        case 86:
            if (game.isTaskComplete(BRIDGE_OPEN))
            	showMainMenu();
            else {
                uint8_t r;
                int v1, v2, v3, vx, vx2;
                nrf_drv_rng_rand(&r,1);
                r %= 64;
                r += 36;
                EEget_milliVolts(r, &v1, &v2, &v3);
                EEpwm_set(r);
#ifdef DEBUGMODE
                printf("Random val = %d%%\n", r);
                printf("Test points should be %d, %d %d\n", v1, v2, v3);
#endif
                game.ShowTerminal("The bridge is jammed!\n\nRepair Instructions:\n-----------\nOpen the panel and\nmeasure the three\ntest points.\n\nEnter the values into\nthe terminal to reset\nthe door lock.", 0);
                game.ShowDialog("This one is a bit tricky.\nYou need to use a\nmultimeter. Try not to\nground to the wrong\nthing or you can cause\nmagic smoke.", MILLER_AVATAR, false);
                vx = game.ShowTerminal("Enter millivolt reading\nat P3", 4);
                vx2 = hex2dec(vx);
                if ((( vx > (v1 - 50)) && ( vx < (v1 + 50))) || (( vx2 > (v1 - 50)) && ( vx2 < (v1 + 50))))  {
                    vx = game.ShowTerminal("Enter millivolt reading\nat P2", 4);
                    vx2 = hex2dec(vx);
                    if ((( vx > (v2 - 50)) && ( vx < (v2 + 50))) || (( vx2 > (v2 - 50)) && ( vx2 < (v2 + 50)))) {
                        vx = game.ShowTerminal("Enter millivolt reading\nat P1", 4);
                        vx2 = hex2dec(vx);
                        if ((( vx > (v3 - 50)) && ( vx < (v3 + 50))) || (( vx2 > (v3 - 50)) && ( vx2 < (v3 + 50)))) {
                            game.ShowTerminal("Bridge access\nrestored!", 0);
                            game.ShowDialog("Maybe you should be\nan engineer. You did\npretty good with that.", MILLER_AVATAR, false);
                            game.completeTask(BRIDGE_OPEN);
                            game.flicker(false);
                        }
                        else
                            game.ShowTerminal("Invalid reading", 0);
                    }
                    else
                        game.ShowTerminal("Invalid reading", 0);
                }
                else
                    game.ShowTerminal("Invalid reading", 0);
                EEpwm_set(0);
            }
            break;
        case 4:
            if (game.isTaskComplete(TRUSTERS_ON))
            	showMainMenu();
            else {
            	game.ShowTerminal("Engines have failed.\n\nRepair Instructions:\n-----------\nConnect to the ship\nvia USB and connect\nto the COM port.\n\nWhen connected,\ncontinue to the next\nscreen.", 0);

            	game.ShowTerminalNoResponse("Debug Started.\n\nContinue all work via\nthe USB diagnostic\nport.\n");
                
                
                //wait for connection
                for (int i=0; i<5000; ++i) {
                    app_usbd_event_queue_process();
                    nrf_delay_ms(10);
                    if (usb_serial_is_connected()) {
                        printf("connection ready\n");
                        break;
                    }
                    if (getButton(false) != USER_BUTTON_A)
                        break;
                }

                if (usb_serial_is_connected()) {
                    wg_Reset();
                    
                    while (usb_serial_is_connected() && (getButton(false) != USER_BUTTON_A)) {
                        const size_t max_len = 1024;
                        char response[max_len];
                        app_usbd_event_queue_process();
                        memset(response, 0, max_len);
                        if (usb_serial_read_line(response, max_len) && (!wg_GotString(response, max_len))) {
                            game.ShowTerminal("GREETINGS PROFESSOR\nHAMSTER          \n               \nA STRANGE GAME.\nTHE ONLY WINNING MOVE\nIS NOT TO PLAY.           \n               \nHOW ABOUT A NICE GAME OF WHISKY SHOTS?\n               \nPOWER RESTORED TO\nTHRUSTERS", 0);
                            game.completeTask(TRUSTERS_ON);
                            game.updateShipLights();
                            if (game.isTaskComplete(WEAPONS_ON)) {
        						game.ShowTerminal("Warning! Inbound hostile\nthreat detected.\n\nReport to the bridge\nimmediately!", 0);
        						game.ShowDialog("Oh shit, hostiles!?\nHURRY FAST!", MILLER_AVATAR, false);
        						game.completeTask(RACE_START_AT_THRUSTERS);
                                game.completeTask(RACE_START);
                            }
                            else {
        						game.ShowDialog("All that's left is\nthe railguns.\n\nThey're on the\nportside of the ship.", MILLER_AVATAR, false);
                            }
                            break;
                        }
                    }
                }
                //debounce
                while (isButtonDown(USER_BUTTON_A))
                    nrf_delay_ms(10);
            }
            break;
        case 56: // TODO: bug in weapons room. When saving in the weapons room, then resetting the badge. The laser does not re-appear when loading the room
            if (game.isTaskComplete(WEAPONS_ON))
            	showMainMenu();
            else {
            	char response[9]; // extra for null char
            	game.ShowTerminalText("Weapons have been\ndisabled externally,\nplease report unknown\nwritings", 7, response);
            	printf("string: %s\n", response);
				if (strncmp("WELWALA", response, strlen(response)) == 0) {
					game.ShowTerminal("Weapons enabled", 0);
					game.ShowDialog("Welwala.\nTraitor to my people.\nI wonder who wrote\nthat on the ship?", MILLER_AVATAR, false);
					game.completeTask(WEAPONS_ON);
					if (game.isTaskComplete(TRUSTERS_ON)) {
						game.ShowTerminal("Warning! Inbound hostile\nthreat detected.\n\nReport to the bridge\nimmediately!", 0);
						game.ShowDialog("Oh shit, hostiles?\nHURRY FAST!", MILLER_AVATAR, false);
						game.completeTask(RACE_START);
					}
					else {
						game.ShowDialog("All that's left is\nthe thrusters.\n\nI think you can figure\nout where those are.", MILLER_AVATAR, false);
					}
				} else
		                game.ShowTerminal("Invalid", 0);
            }

            break;
        case 19:
            if (game.isTaskComplete(SHIELDS_ON) || !game.isTaskComplete(SHOOT_OUT))
            	showMainMenu();
            else if (game.ShowTerminal("Hull integrity is 12%,\nto activate repair\ndrones enter the\ndrones' NFC passcode:", 8) == 0x01189998) { // TODO: hex & dec accept
                game.ShowTerminal("Drones activated.\nRepairing to 86%", 0);
                game.completeTask(SHIELDS_ON);
            } else
                game.ShowTerminal("Drone activation\nfailed, please try\nagain.", 0);
            break;
        case 53:
            if (game.isTaskComplete(DEAD_OPEN))
                game.ShowTerminal("Terminal Broken\n\nService area unlocked\nvia UART controls.", 0);
            else {
                if (serial_getSolved()) {
                    game.ShowTerminal("Service area unlocked", 0);
                    game.completeTask(DEAD_OPEN);
                }
                else{
    	            game.ShowTerminal("Terminal Broken\n\nUse UART to access\ndoor controls.\nUART Instructions:\n-----------\nConnect to the ship\nvia the RX/TX pads.\nThen override door.\nOnce connected,\ncontinue to the next\nscreen.", 0);
    	            serial_openChallenge();
                	game.ShowTerminalNoResponse("Debug Started.\n\nContinue all work via\nthe UART diagnostic\nport.\n");
                    while (!serial_getSolved() && (getButton(false) != USER_BUTTON_A)) {

                    }
                    serial_closeChallenge();
                    if(serial_getSolved()){
                    	game.ShowTerminal("Service area unlocked", 0);
                    	game.completeTask(DEAD_OPEN);
                    }
                }
            }
            break;
        case 47:
            if (game.isTaskComplete(COMMS_ON))
                game.ShowTerminal("--- Comms Station ---\nTransmitting distress\nbeacon...", 0);
            else {
            	game.ShowTerminal("--- Comms Station ---\nATTENTION:\nExternal communication\nrecorded.\n\nMessages saved to\ncollect.cap on the\nShip's SD Card.", 0);
                if (FR_NO_FILE == f_stat("collect.cap", NULL)) {
                    decryptFile("SuperSecretRc4Key", "hcrn/collect.enc", "collect.cap");
                }
                if(!game.isTaskComplete(COMMS_EXTERNAL_MESSAGE)){
                	game.ShowDialog("This looks important.\nPower off the ship, look\nat the communications\nthen come back and\nenter in any useful\ninformation.", MILLER_AVATAR, false);
                	game.completeTask(COMMS_EXTERNAL_MESSAGE);
                	game.saveGame();
                }
            	char response[9]; // extra for null char
            	printf("string: %s\n", response);
            	game.ShowTerminalText("Enter the code:", 8, response);
				if (strncmp("FREDJOHN", response, strlen(response)) == 0) {
                    game.completeTask(COMMS_ON);
                    morseStart();
	                game.ShowTerminal("--- Comms Station ---\nTransmitting access\ncode...", 0);
                }
                else
                    game.ShowTerminal("--- Comms Station ---\nUnknown access code.", 0);
            }
            break;
        case 89:
        	if (game.isTaskComplete(ALL_DONE))
        		showMainMenu();
        	else if (game.isTaskComplete(COMMS_ON)) {
            	bool stop = false;
                if (!game.isTaskComplete(MORSE)) {
                    if (game.TerminalRequestResponse("Do you know the comms message?", "no", "yes")) {
                        if (game.ShowTerminal("Enter comms beacon", 6) == 0x801801) {
                            game.ShowTerminal("Call for aid has\nbeen broadcast.", 0);
                            game.completeTask(MORSE);
                            morseStop();
                        }
                        else{
                            game.ShowTerminal("Incorrect", 0);
                            stop = true;
                        }
                    }
                }
                if (stop != true){
					if (game.isTaskComplete(B_BENDER) && game.isTaskComplete(B_FURRY) && game.isTaskComplete(B_DCZIA) && game.isTaskComplete(B_KIDZ) && game.isTaskComplete(B_PIRATE) && game.isTaskComplete(B_DC801)) {
						game.ShowTerminal("You have received\nbeacons from all\nthe nearby ships!\n\n", 0);
						if (!game.TerminalRequestResponse("Are you ready and\ndo you want to continue?", "no", "yes")) {
							stop = true;
						}
					}
					else {
						if (!game.TerminalRequestResponse("You haven't gotten all\nthe beacons. Do you\nwant to continue\nanyway?", "no", "yes")) {
							stop = true;
						}
					}
                }
                if (stop != true){
                    if (game.isTaskComplete(MORSE) && game.isTaskComplete(B_BENDER) && game.isTaskComplete(B_FURRY) && game.isTaskComplete(B_DCZIA) && game.isTaskComplete(B_KIDZ) && game.isTaskComplete(B_PIRATE) && game.isTaskComplete(B_DC801)) {
                        game.ShowTerminal("Your power level is\nover 9,000!", 0);
                    }

                    game.ShowDialog("When you fight off\nall of these ships\nand head home, could\nI hitch a ride?", MILLER_AVATAR, true);
                    //Play final game, difficulty based on dc801 peers near me
                    uint8_t levels = 0;
                    if(game.isTaskComplete(B_BENDER))
                    	++levels;
                    if(game.isTaskComplete(B_FURRY))
                		++levels;
                    if(game.isTaskComplete(B_DCZIA))
                		++levels;
                    if(game.isTaskComplete(B_KIDZ))
                		++levels;
                    if(game.isTaskComplete(B_PIRATE))
                		++levels;
                    if(game.isTaskComplete(B_DC801))
                		++levels;

                   if (levels / 2 > 0)
                	   game.ShowDialog("Looks like some\nallies helped you\nskip some waves due\nto the number of\nbadges you've found.\nNice.", MILLER_AVATAR, true);

                    game.ShowDialog("Are you ready?\nLets GO!", MILLER_AVATAR, true);
                    invadersScore InvadersResults;
                    InvadersResults.win = false;
                    while(!InvadersResults.win == true){
                    	InvadersResults = SpaceInvaders(hcrn_level2, game.isTaskComplete(MORSE), levels);
                    }
                    game.updateShipLights();
    				game.ShowTerminal("Enemies Destroyed!", 0);
    				game.completeTask(ALL_DONE);
    				game.ShowDialog("Baaaaa\nYou WON.\nGame Over.", "hcrn/sheep.bmp", true);\
    				game.ShowDialog("You can continue\nto explore, but\nthat's all we have\nfor you. Hope you\nenjoyed playing!", "hcrn/sheep.bmp", true);
    				game.ShowTerminal("CREDITS\n-------\nEVERYONE WHO BOUGHT A BADGE\n\nBADGE MAKERS\n@nemus\n@professor__plum\n@SirGed\n@_bashNinja\n@dvdfreitag\n@hamster  @matweaver7", 0);
    				game.completeTask(ALL_DONE);
    				game.saveGame();
    				// Winning LEDs
    			    ledPulseFast(LED_PERSON_COMPBAY);
    			    ledPulseFast(LED_PERSON_ENGINE);
    			    ledPulseFast(LED_PERSON_SHIELDS);
    			    ledPulseFast(LED_PERSON_ENGINEERING);
    			    ledPulseFast(LED_PERSON_CARGO);
    			    ledPulseFast(LED_PERSON_DAMAGED);
    			    ledPulseFast(LED_PERSON_BRIDGE);
                }
            }
            else if (game.isTaskComplete(SHIELDS_ON)) {
                game.ShowTerminal("In coming large fleet,\nrecommend enabling distress\nbeacon at comms station", 0);
            }
            else if (game.isTaskComplete(SHOOT_OUT)) {
                showMainMenu();
            }
            else if (game.isTaskComplete(WEAPONS_ON) && game.isTaskComplete(TRUSTERS_ON)) {
                game.completeTask(BEAT_RACE);
				game.ShowDialog("YOU MADE IT.\nSit down, and pilot the\nship.\n", MILLER_AVATAR, true);
				game.ShowDialog("It's simple. We only have\none ship. Shoot them\nand don't die.", MILLER_AVATAR, true);
				game.ShowDialog("Lets GO!", MILLER_AVATAR, true);
                //play fight game
                invadersScore InvadersResults;
                InvadersResults.win = false;
                while(!InvadersResults.win == true){
                	InvadersResults = SpaceInvaders(hcrn_level1, false, 0);
                }
                game.updateShipLights();
				game.ShowTerminal("Enemies Destroyed!", 0);
				game.completeTask(SHOOT_OUT);
				game.ShowTerminal("Ship damaged!\nActivate repair drones\nin the drone bay.", 0);
				game.ShowDialog("That was intense.\nShit just follows you\naround, don't it?", MILLER_AVATAR, true);
				game.ShowDialog("Still, that was quite\nthe battle. Let's get\nthings fixed up and\nhopefully get the comms\nworking so we can get\nout of here.", MILLER_AVATAR, true);
				game.ShowDialog("Listen to the terminal.\nFirst stop the drone\nbay. It's on the\nstarboard side of the\nship.", MILLER_AVATAR, true);
				game.saveGame();
            }
            else {
                showMainMenu();
            }
    }
    game.saveGame();
}


void Terminal::showStatusMessage() {
    if (!game.isTaskComplete(CORE_POWERED))
        game.ShowTerminal("Core failure, check\nengineering bay", 0);
    else if (!game.isTaskComplete(COMP_UNLOCKED))
        game.ShowTerminal("Power restored,\ndefense systems\nactive", 0);
    else if (!game.isTaskComplete(BRIDGE_OPEN))
        game.ShowTerminal("Bridge systems locked\ndown", 0);
    else if (game.isTaskComplete(RACE_START) && (!game.isTaskComplete(BEAT_RACE)))
        game.ShowTerminal("Warning! inbound hostile\nthreat detected.\n\nReport to the bridge\nimmediately!", 0);
    else {
        char msg[256];
        int hull = 86;
        if (game.isTaskComplete(SHIELDS_ON))
            hull = 93;
        else if (game.isTaskComplete(SHOOT_OUT))
            hull = 34;
        bool comms;
        if ((!game.isTaskComplete(SHOOT_OUT)) || (game.isTaskComplete(COMMS_ON)))
            comms=true;
        sprintf(msg, "--- System status ---\n Hull integrity:   %d%%\n Weapons:   %s\n Thrusters: %s\n Comms:     %s",
                hull,
                game.isTaskComplete(WEAPONS_ON)?"online":"offline",
                game.isTaskComplete(TRUSTERS_ON)?"online":"offline",
                comms?"online":"offline");
        game.ShowTerminal(msg, 0);
        if (!game.isTaskComplete(FIRST_BRIDGE_MESSAGE) && !game.isTaskComplete(WEAPONS_ON) && !game.isTaskComplete(TRUSTERS_ON)) {
            game.ShowDialog("Looks like you're not\ngoing anywhere until\nyou get those railguns\nand thrusters fixed.", MILLER_AVATAR, false);
            game.completeTask(FIRST_BRIDGE_MESSAGE);
        }
    }
}

void Terminal::showMainMenu(void) {
	// Menu options
	const char* options[] = {
			"System Status", // 0
			"External Scan", // 1
			"Recreation", // 2
			"System Information", // 3
			"Configure Settings", // 4
			"Credits", // 5
			"-- Quit Terminal", // 6
#ifdef DEBUGMODE
            "Debug",
#endif
			NULL // null is here so that the functions that use this know when it's done.
	};
	uint8_t selected = game.TerminalMenu("--- Terminal Menu ---", options);
	switch (selected){
		case 0:
			showStatusMessage(); // Status Message
			showMainMenu();
			break;
		case 1:
			nearby(); // BLE scan
			showMainMenu();
			break;
		case 2:
			showGameMenu();
			break;
		case 3:
			char row[124];
		    snprintf(row, 124, "---- System Info ----\nHelgaOS v%s\nNordic SDK%s\nSAO Spec %s\n%s %s\n\nCurrent Score: %d", VERSION, NORDICSDK, SAOSPEC, __DATE__, __TIME__, game.getScore());
		    game.ShowTerminal(row, 0);
			showMainMenu();
			break;
		case 4:
		{
			showConfigMenu();
            break;
		}
		case 5:
	        game.ShowTerminal("CREDITS\n-------\nEVERYONE WHO BOUGHT A BADGE\n\nBADGE MAKERS\n@nemus\n@professor__plum\n@SirGed\n@_bashNinja\n@dvdfreitag\n@hamster  @matweaver7", 0);
			showMainMenu();
	        break;
		case 6: // quit
			break;
#ifdef DEBUGMODE
		case 7:
			debugMenu(1);
			break;
#endif

	}
}

#ifdef DEBUGMODE
void Terminal::debugMenu(int page) {

	if (page == 1){

		// Menu options
		const char* options[] = {
				"--CAN BREAK THINGS--", // 0
				"Delete Save & RST", // 1
				"UART", // 2
				"Morse Code", // 3
				"Dialog Test", // 4
				"-- Page 2",
				"-- Quit Terminal", // 5
				NULL // null is here so that the functions that use this know when it's done.
		};
		uint8_t selected = game.TerminalMenu("--- DEBUG Menu ---", options);
		switch (selected){
			case 0:
	            game.ShowTerminal("You have been warned.", 0);
				break;
			case 1:
			{
				FRESULT sav_result = f_stat("HCRN/PLAYER.sav", NULL);
	            if (sav_result != FR_OK) {
	            	NRF_LOG_INFO("Can't find file HCRN/player.sav (%d)\n", sav_result);
	            }
	            else {
	            	sav_result = f_unlink("HCRN/PLAYER.sav");
	            	NRF_LOG_INFO("Deleting HCRN/player.sav (%d)\n", sav_result);
	            }
	            NVIC_SystemReset();
				break;
			}
			case 2:
	        	serial_openChallenge();
	            game.ShowTerminal("Terminal Broken\n\nUART ACTIVATED\nUse UART to access\ndoor controls.\n\nUART Instructions:\n-----------\nConnect to the ship\nvia the RX/TX pads.\nThen override door.", 0);
				break;
			case 3:
				morseStart();
	            game.ShowTerminal("Morse Code Flashing\nExit screen to stop.", 0);
				morseStop();
				break;
			case 4:
			{
				game.ShowDialog("YOU MADE IT.\nSit down, pilot the\nship.\n", MILLER_AVATAR, true);
				game.ShowDialog("It's simple. We\nonly have 1\nship. Shoot them\nand don't die.", MILLER_AVATAR, true);
				game.ShowDialog("Lets GO!", MILLER_AVATAR, true);			}
		        break;
			case 5: // quit
				debugMenu(2);
				break;
			case 6: // quit
				break;
		}

	}
	else if (page == 2){

		// Menu options
		const char* options[] = {
				"Toggle 1337 Score", // 0
				"Play HCRN_LVL1", // 1
				"Play HCRN_LVL2", // 2
				"", // 3
				"", // 4
				"-- Quit Terminal", // 5
				NULL // null is here so that the functions that use this know when it's done.
		};
		uint8_t selected = game.TerminalMenu("--- DEBUG Menu ---", options);
		switch (selected){
			case 0:
				game.unCompleteTask(L337_SCORE);
				char row[24];
			    snprintf(row, 24, "Current Score is %d.", game.getScore());
			    game.ShowTerminal(row, 0);
				break;
			case 1:
			{
                invadersScore InvadersResults = SpaceInvaders(hcrn_level1, false, 0);
                if (InvadersResults.win){
					game.ShowTerminal("Enemies Destroyed!", 0);
					game.ShowTerminal("Ship damaged!\nActivate repair drones\nin the drone bay.", 0);
					game.ShowDialog("That was intense.\nShit just follows you\naround, don't it?", MILLER_AVATAR, true);
					game.ShowDialog("Still, that was quite\nthe battle. Let's get\nthings fixed up and\nhopefully get the comms\nworking so we can get\nout of here.", MILLER_AVATAR, true);
					game.ShowDialog("Listen to the terminal.\nFirst stop the drone\nbay. It's on the\nstarboard side of the\nship.", MILLER_AVATAR, true);
                }
                else{
                	game.getPlayer()->setLife(0);
                }
			}
				break;
			case 2:
			{
                invadersScore InvadersResults = SpaceInvaders(hcrn_level2, true, 6);
                if (InvadersResults.win){
					game.ShowTerminal("Enemies Destroyed!", 0);
					game.ShowTerminal("Ship damaged!\nActivate repair drones\nin the drone bay.", 0);
					game.ShowDialog("That was intense.\nShit just follows you\naround, don't it?", MILLER_AVATAR, true);
					game.ShowDialog("Still, that was quite\nthe battle. Let's get\nthings fixed up and\nhopefully get the comms\nworking so we can get\nout of here.", MILLER_AVATAR, true);
					game.ShowDialog("Listen to the terminal.\nFirst stop the drone\nbay. It's on the\nstarboard side of the\nship.", MILLER_AVATAR, true);
                }
                else{
                	game.getPlayer()->setLife(0);
                }
			}
				break;
			case 3:
				break;
			case 4:
		        break;
			case 5: // quit
				break;
		}


	}

}
#endif

void Terminal::showConfigMenu(void) {
	// Menu options
	const char* options[] = {
			"Change Name", // 0
			"Erase Save", // 1
			"-- Main Menu", // 2
			NULL // null is here so that the functions that use this know when it's done.
	};
	uint8_t selected = game.TerminalMenu("--- Terminal Menu ---", options);
	switch (selected){
		case 0:
		{
        	printf("name: %s\n", ble_name);
            game.TerminalRequestName("What's your name?", 10, ble_name);
            printf("advertising user: '%s'\n", ble_name);
            advertising_setUser(ble_name);
            ble_adv_start(); //TODO: add response to name
            showConfigMenu();
            break;
		}
		case 1:
		{
			if(!game.TerminalRequestResponse("Are you sure?","no", "yes")){
				break;
			}
			else{
				FRESULT sav_result = f_stat("HCRN/PLAYER.sav", NULL);
				if (sav_result != FR_OK) {
					NRF_LOG_INFO("Can't find file HCRN/player.sav (%d)\n", sav_result);
				}
				else {
					sav_result = f_unlink("HCRN/PLAYER.sav");
					NRF_LOG_INFO("Deleting HCRN/player.sav (%d)\n", sav_result);
				}
				NVIC_SystemReset();
			}
			break;
		}
		case 2:
			showMainMenu();
			break;
	}
}

void Terminal::showGameMenu(void) {
	if (game.isTaskComplete(ARCADE_OPENED)){
		if (game.isTaskComplete(SHOOT_OUT)){
			const char* options[] = {
					"Invaders", // 0
					"Snake", // 1
					"Pips the ET", // 2
					"TicTacToe", // 3
					"HCRN Invaders", // 4
					"-- Main Menu", // 5
					NULL // null is here so that the functions that use this know when it's done.
			};
			uint8_t selected = game.TerminalMenu("--- Terminal Menu ---", options);
			switch (selected){
				case 0:
					game.saveGame();
		            SpaceInvaders(normal, false, 0);
		            break;
				case 1:
					game.saveGame();
					Snake();
					break;
				case 2:
					game.saveGame();
					PipsTheET();
					break;
				case 3:
					game.saveGame();
					TicTacToe();
					break;
				case 4:
					SpaceInvaders(hcrn_normal, false, 0);
				case 5:
					showMainMenu();
					break;
			}
		}
		else {
			const char* options[] = {
					"Invaders", // 0
					"Snake", // 1
					"Pips the ET", // 2
					"TicTacToe", // 3
					"-- Main Menu", // 4
					NULL // null is here so that the functions that use this know when it's done.
			};
			uint8_t selected = game.TerminalMenu("--- Terminal Menu ---", options);
			switch (selected){
				case 0:
					game.saveGame();
					SpaceInvaders(normal, false, 0);
		            break;
				case 1:
					game.saveGame();
					Snake();
					break;
				case 2:
					game.saveGame();
					PipsTheET();
					break;
				case 3:
					game.saveGame();
					TicTacToe();
					break;
				case 4:
					showMainMenu();
					break;
			}
		}
	}
	else{
        game.ShowTerminal("No games exist.", 0);
        showMainMenu();
	}



}
