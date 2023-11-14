
var testInput = `settings for dialog {
	parameters for label Player {
		entity "%PLAYER%"
		alignment BR
		/* Saying it the long way (BOTTOM_RIGHT) would be okay, too */
	}
	parameters for global default {
		wrap messages 40 // 42 is default
		alignment BL
	}
}`;

var testText = `/* These would just be so you don't have to specify ALL the dialog parameters over and over every time anyone says something */
settings for dialog {
	parameters for label Player {
		entity "%PLAYER%"
		alignment BR
		/* Saying it the long way (BOTTOM_RIGHT) would be okay, too */
	}
	parameters for global default {
		wrap messages 40 // 42 is default
		alignment BL
	}
}

test-script {
	mutate "hintiger" = 1
	show dialog { /* maybe generate a name, like "test-script:line54", only needed for debugging purposes */ // asdfasdf EOL
		Player "Whoa, neat." "Are you sure?"
		Bert "Yes."
		Player
			"How is it that white space is optional?"
			"I mean... this looks pretty trippy."
		Bert "It magic."
	}
	show dialog "asdfasdf"
	wait 5000ms
	show dialog { Player "I'm loving this!" }
	copy "face-player"
	show dialog "long-convo" { /* explicit names are fine too! */
		Jackob
		"You see why we're doing it this way?"
		
		Player
		"I think so."
		"Less boiler plate, right?"
		
		Bert
		"Indeed."
	}
}

/* You CAN have a SHOW_DIALOG with no dialog block; the output JSON just wouldn't have an entry for it. The encoder actually catches missing dialogs, so natlang shouldn't need to enforce it. This way there's no problem when a dialog is used multiple times and only defined once -- nor if it's not defined the first time it's used. */

/* ------ BIG TEST BELOW ------ */

script on_tick-lodge {
	if flag "tuesdayd" is true then
		goto "on_tick-tuesdayd"
	if entity "%PLAYER%" is inside geometry "door-lodge" then
		goto "show_dialog-lodge-cantleaveyet"
}

on_tick-lodge-goose {
	if flag "ring-acquired" is true then
		goto "on_tick-lodge-goose-ring-acquired"
}

on_tick-lodge-goose-ring-acquired {
	if entity "%PLAYER%" is inside geometry "door-secretdoor" then
		goto enter-secretroom
}

on_tick-tuesdayd {
	if entity "%PLAYER%" is inside geometry "door-lodge" then
		goto "leave-lodge"
}

elders-to-secretdoor {
	wait 100ms
	set entity "Alfonso" on_tick to "secretdoor-walk"
	wait 200ms
	set entity "Bert" on_tick to "secretdoor-knightsmove-walk"
	wait 400ms
	set entity "Jackob" on_tick to "secretdoor-knightsmove-walk"
}

secretdoor-walk {
	walk entity "%SELF%" to geometry "secretdoor-point" over 800ms
	teleport entity "%SELF%" to geometry "lodge-hidingplace"
	goto "null_script"
}

secretdoor-knightsmove-walk {
	walk entity "%SELF%" to geometry "elder-point" over 500ms
	copy "secretdoor-walk"
}

leave-lodge {
	set warp state to "exit_from-lodge"
	load map "main"
}

enter-secretroom-with-guaranteed-cutscene {
	set flag "tuesdayd" to false
	copy "enter-secretroom"
}

enter-secretroom {
	load map "secretroom"
}

enter_from-secretroom {
	turn player control off
	walk entity "%PLAYER%" along geometry "enter_from-secretroom" over 200ms
	turn player control on
	goto "on_load-lodge-end"
}

on_load-lodge {
	goto "on_load-lodge-debug-check"
}

on_load-lodge-debug-check {
	if flag "debug-mode" is false then
		goto "hide-debug-lodge"
	goto script on_load-lodge-tuesday-check
}

hide-debug-lodge {
	teleport entity "Debug Exa" to geometry lodge-hidingplace
	teleport entity "Debug Exa 2" to geometry "lodge-hidingplace"
	teleport entity "Debug Exa 3" to geometry "lodge-hidingplace"
	goto "on_load-lodge-tuesday-check"
}

on_load-lodge-tuesday-check {
	if flag "tuesday-walkedup" is false then
		goto "on_load-lodge-cutscene"
	goto "on_load-crowd-mini-check"
}

on_load-crowd-mini-check {
	if flag "hide-lodge-crowd-mini" is true then
		goto "on_load-empty-lodge-mini"
		/* doc: because there's a tiny window where you might reload map after elders leave but before crowd does */
	goto "on_load-crowd-check"
}

on_load-empty-lodge-mini {
	set entity "Bookcase" current_animation to 3
		/* doc: down animation */
	copy "empty-lodge-mini"
	goto "on_load-crowd-check"
}

on_load-crowd-check {
	if flag "hide-lodge-crowd" is true then
		goto "on_load-empty-lodge"
		/* doc: this is not set to check 'tuesdayd' because you might want the crowd inside and otherwise leave the tuesday cutscene inert */
	goto "on_load-lodge-glitch_cat-check"
}

on_load-empty-lodge {
	set entity "Bookcase" current_animation to 3
		/* doc: down animation */
	copy "empty-lodge"
	goto "on_load-lodge-glitch_cat-check"
}

on_load-lodge-glitch_cat-check {
	if flag "lodge_cat-unglitched" is true then
		goto "on_load-lodge-glitch_cat-do"
	goto "on_load-lodge-glitch_timmy-check"
}

on_load-lodge-glitch_cat-do {
	make entity "Cat" unglitched
	goto "on_load-lodge-glitch_timmy-check"
}

on_load-lodge-glitch_timmy-check {
	if flag "timmy-unglitched" is true then
		goto "on_load-lodge-glitch_timmy-do"
	goto "on_load-lodge-door-check"
}

on_load-lodge-glitch_timmy-do {
	make entity "Timmy" unglitched
	goto "on_load-lodge-door-check"
}

on_load-lodge-door-check {
	if warp state is "exit_from-secretroom" then
		goto "enter_from-secretroom"
	goto "on_load-lodge-end"
}

on_load-lodge-end {
	goto "on_load-lodge-demobonus-eval"
}

on_load-lodge-demobonus-eval {
	if flag "demobonus-timmy-yell" is true then
		goto "on_load-lodge-demobonus-end"
	if flag "demobonus" is false then
		goto "on_load-lodge-demobonus-end"
	turn player control off
	wait 200ms
	turn player control on
	show dialog "dialog-timmy-demobonus1"
		/* doc: Hey! Hey! My book! */
	set flag "demobonus-timmy-yell" to true
	goto "null_script"
}

on_load-lodge-demobonus-end {
	goto "null_script"
}

lodge_cat-glitchwatch {
	if entity "%SELF%" is not glitched then
		goto "lodge_cat_now_unglitched"
}

lodge_cat_now_unglitched {
	set flag "lodge_cat-unglitched" to true
	goto "null_script"
}

timmy-glitchwatch {
	if entity "%SELF%" is not glitched then
		goto "timmy_now_unglitched"
}

timmy_now_unglitched {
	set flag "timmy-unglitched" to true
	goto "null_script"
}

show_dialog-lodge-cantleaveyet {
	show dialog "dialog-lodge-cantleaveyet" {
		Player "Wait, I can't leave yet!"
	}
	turn player control off
	walk entity "%PLAYER%" along geometry "enter-lodge" over 200ms
	turn player control on
	goto "on_tick-lodge"
}

secret-door-open {
	set entity "Bookcase" current_animation to 1 /* bookcase shake */
	wait 900ms
	set entity "Bookcase" current_animation to 0 /* bookcase holding still */
	wait 400ms
	play entity "Bookcase" animation 2 once /* bookcase drop */
	set flag "ring-acquired" to true
	teleport entity "Bookcase" to geometry "lodge-hidingplace"
}

on_load-lodge-cutscene {
	set entity "Aunt Zippy" animation_frame to 3
	goto "cutscene-tuesday"
}

lodge-watch-player-gradually {
	set entity "Beatrice" on_tick to "face-player"
	set entity "Cleo" on_tick to "face-player"
	set entity "Trekkie" on_tick to "face-player"
	wait 200ms
	set entity "Max Swagger" on_tick to "face-player"
	set entity "Verthandi" on_tick to "face-player"
	set entity "Marta" on_tick to "face-player"
	wait 200ms
	set entity "Baker" on_tick to "face-player"
	set entity "Smith" on_tick to "face-player"
	set entity "Uncle Zappy" on_tick to "face-player"
	wait 200ms
	set entity "Aunt Zippy" on_tick to "face-player"
	set entity "Shepherd" on_tick to "face-player"
}

cutscene-tuesday {
	turn player control off
	turn hex control off
	walk entity "%PLAYER%" to geometry "lodge-path1" over 600ms
	wait 600ms
	show dialog "dialog-tuesday-intro1" {
		Alfonso "Come on in, %PLAYER%!"
	}
	wait 800ms
	copy "lodge-watch-player-gradually"
	wait 300ms
	walk entity "%PLAYER%" along geometry "lodge-path1" over 1900ms
	wait 100ms
	turn entity "%PLAYER%" toward entity "Uncle Zappy"
	wait 100ms
	show dialog "dialog-tuesday-intro2" {
		Zappy "We'll be right here."
	}
	wait 200ms
	walk entity "%PLAYER%" to geometry "lodge-path2" over 300ms
	wait 100ms
	turn entity "%PLAYER%" toward entity "Aunt Zippy"
	wait 100ms
	show dialog "dialog-tuesday-intro3" {
		Zippy "Go ahead. You'll do great!"
	}
	wait 200ms
	walk entity "%PLAYER%" along geometry "lodge-path2" over 800ms
	wait 200ms
	turn entity "%PLAYER%" toward entity "Alfonso"
	goto "cutscene-tuesday2"
}

cutscene-tuesday2 {
	pan camera to geometry "lodge-camera-point" over 1500ms
	show dialog "dialog-tuesday1" {
		Jackob alignment TL
		"The day has come!"
		"You have come of age, and what a joyous day it is."
		"You may have noticed some aches and pains, and hair growing in new places. It's also possible --"
	}
	turn entity "Alfonso" toward entity "Jackob"
	show dialog "dialog-tuesday2" {
		Alfonso alignment TL
		"Uh, that's the wrong speech! It's TUESDAY, not puberty education!"
	}
	turn entity "Bert" toward entity "Alfonso"
	show dialog "dialog-tuesday3" {
		Bert alignment TL
		"It Friday."
	}
	turn entity "Alfonso" toward entity "Bert"
	show dialog "dialog-tuesday4" {
		Alfonso alignment TL
		"No, not Tuesday, T.U.E.S.D.A.Y.! You know, Traditional and Unambiguous Event of Selection Directly Affecting You."
	}
	turn entity "Jackob" toward entity "Alfonso"
	show dialog "dialog-tuesday5" {
		Jackob alignment TL
		"Ah, yes. Right you are."
	}
	turn entity "Alfonso" toward entity "%PLAYER%"
	wait 100ms
	turn entity "Bert" toward entity "%PLAYER%"
	wait 50ms
	turn entity "Jackob" toward entity "%PLAYER%"
	wait 200ms
	show dialog "dialog-tuesday6" {
		Alfonso alignment TL
		"*Ahem*"
		"Each mage, upon the day of their 16th birthday, will then be present for their TUESDAY."
		"Upon the chosen TUESDAY, each mage is recognized by forces beyond our comprehension as ready to wield power bestowed upon them by a magical artifact."
		"Mages do not choose their own artifacts, but rather are subject to the moods and temperaments of the artifacts."
		"(And boy they are moody.)"
	}
	walk entity "Alfonso" to geometry "elder-point" over 400ms
	copy "alfonso-left-right"
	show dialog "dialog-tuesday7" {
		Alfonso alignment TL
		"The mage must present themselves to the artifacts until one shows interest. Mage, step forth."
	}
	pan camera to entity "%PLAYER%" over 1200ms
	turn entity "%PLAYER%" south
	show dialog "dialog-candothis" {
		Player "Okay. I can do this."
	}
	turn hex control off
	turn player control on
	set flag "tuesday-walkedup" to true
}

alfonso-left-right {
	wait 200ms
	turn entity "Alfonso" west
	wait 500ms
	turn entity "Alfonso" east
	wait 500ms
	turn entity "Alfonso" south
	wait 200ms
}

artifacts-eval {
	if flag "artifact-bracelet-touched" is false then
		goto "show_dialog-artifacts-eval-bad"
	if flag "artifact-broom-touched" is false then
		goto "show_dialog-artifacts-eval-bad"
	if flag "artifact-glasses-touched" is false then
		goto "show_dialog-artifacts-eval-bad"
	if flag "artifact-wand-touched" is false then
		goto "show_dialog-artifacts-eval-bad"
	if flag "artifact-book-touched" is false then
		goto "show_dialog-artifacts-eval-bad"
	show dialog "dialog-maybe-another"
		/* duplicate: Maybe a different artifact? */
	show dialog "dialog-maybe-none" {
		Player "Wait. Was that the last one?"
	}
	set entity "%PLAYER%" on_tick to "look-left-and-right-fast"
	turn player control off
	wait 900ms
	set entity "%PLAYER%" on_tick to "null_script"
	copy "lodge-murmur"
	copy "player-ringzero-landing"
}

show_dialog-artifacts-eval-bad {
	show dialog "dialog-maybe-another" {
		Player "Maybe a different artifact?"
	}
}

lodge-murmur {
	set entity "Cleo" on_tick to "gossip-down-player"
	set entity "Baker" on_tick to "gossip-up-player"
	set entity "Beatrice" on_tick to "null_script"
	turn entity "Beatrice" toward entity "%PLAYER%"
	set entity "Shepherd" on_tick to "gossip-left-player"
	set entity "Trekkie" on_tick to "gossip-right-player"
	set entity "Marta" on_tick to "gossip-left-player"
	set entity "Max Swagger" on_tick to "gossip-right-player"
	set entity "Smith" on_tick to "gossip-left-player"
	set entity "Verthandi" on_tick to "gossip-up-player"
	set entity "Aunt Zippy" on_tick to "gossip-down-player"
	set entity "Uncle Zappy" on_tick to "null_script"
	turn entity "Uncle Zappy" toward entity "%PLAYER%"
}

lodge-un-murmur {
	set entity "Cleo" on_tick to "null_script"
	turn entity "Cleo" toward entity "%PLAYER%"
	set entity "Baker" on_tick to "null_script"
	turn entity "Baker" toward entity "%PLAYER%"
	set entity "Beatrice" on_tick to "null_script"
	turn entity "Beatrice" toward entity "%PLAYER%"
	set entity "Shepherd" on_tick to "null_script"
	turn entity "Shepherd" toward entity "%PLAYER%"
	set entity "Trekkie" on_tick to "null_script"
	turn entity "Trekkie" toward entity "%PLAYER%"
	set entity "Marta" on_tick to "null_script"
	turn entity "Marta" toward entity "%PLAYER%"
	set entity "Max Swagger" on_tick to "null_script"
	turn entity "Max Swagger" toward entity "%PLAYER%"
	set entity "Smith" on_tick to "null_script"
	turn entity "Smith" toward entity "%PLAYER%"
	set entity "Verthandi" on_tick to "null_script"
	turn entity "Verthandi" toward entity "%PLAYER%"
	set entity "Aunt Zippy" on_tick to "null_script"
	turn entity "Aunt Zippy" toward entity "%PLAYER%"
	set entity "Uncle Zappy" on_tick to "null_script"
	turn entity "Uncle Zappy" toward entity "%PLAYER%"
}

gossip-left-player {
	wait 200ms
	turn entity "%SELF%" west
	wait 350ms
	turn entity "%SELF%" toward entity "%PLAYER%"
	wait 350ms
}

gossip-right-player {
	wait 300ms
	turn entity "%SELF%" east
	wait 400ms
	turn entity "%SELF%" toward entity "%PLAYER%"
	wait 200ms
}

gossip-up-player {
	turn entity "%SELF%" north
	wait 300ms
	turn entity "%SELF%" toward entity "%PLAYER%"
	wait 600ms
}

gossip-down-player {
	wait 100ms
	turn entity "%SELF%" south
	wait 250ms
	turn entity "%SELF%" toward entity "%PLAYER%"
	wait 550ms
}

player-ringzero-landing {
	wait 200ms
	if entity "%PLAYER%" is inside geometry "ringzero-walk-6-donut" then
		goto "player-ringzero-from6-donut"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-6" then
		goto "player-ringzero-from6"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-1159" then
		goto "player-ringzero-from1159"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-1130" then
		goto "player-ringzero-from1130"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-11" then
		goto "player-ringzero-from11"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-10" then
		goto "player-ringzero-from10"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-9" then
		goto "player-ringzero-from9"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-8" then
		goto "player-ringzero-from8"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-7" then
		goto "player-ringzero-from7"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-5" then
		goto "player-ringzero-from5"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-4" then
		goto "player-ringzero-from4"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-3" then
		goto "player-ringzero-from3"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-2" then
		goto "player-ringzero-from2"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-1" then
		goto "player-ringzero-from1"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-1230" then
		goto "player-ringzero-from1230"
	if entity "%PLAYER%" is inside geometry "ringzero-walk-1201" then
		goto "player-ringzero-from1201"
	goto "cutscene-artifacts-eval-good"
}

player-ringzero-from11 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-10" over 100ms
	copy "player-ringzero-from-landing-10"
}

player-ringzero-from1130 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-10" over 300ms
	copy "player-ringzero-from-landing-10"
}

player-ringzero-from1159 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-10" over 600ms
	copy "player-ringzero-from-landing-10"
}

player-ringzero-from1 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-1" over 100ms
	copy "player-ringzero-from-landing-1"
}

player-ringzero-from1230 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-1" over 300ms
	copy "player-ringzero-from-landing-1"
}

player-ringzero-from1201 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-1" over 600ms
	copy "player-ringzero-from-landing-1"
}

player-ringzero-from7 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-6" over 250ms
	goto "cutscene-artifacts-eval-good"
}

player-ringzero-from5 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-6" over 250ms
	goto "cutscene-artifacts-eval-good"
}

player-ringzero-from8 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-6" over 500ms
	goto "cutscene-artifacts-eval-good"
}

player-ringzero-from4 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-6" over 500ms
	goto "cutscene-artifacts-eval-good"
}

player-ringzero-from9 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-8" over 200ms
	copy "player-ringzero-from-landing-8"
}

player-ringzero-from3 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-4" over 200ms
	copy "player-ringzero-from-landing-4"
}

player-ringzero-from10 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-8" over 400ms
	copy "player-ringzero-from-landing-8"
}

player-ringzero-from2 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-4" over 400ms
	copy "player-ringzero-from-landing-4"
}

player-ringzero-from-landing-4 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-6" over 800ms
	goto "cutscene-artifacts-eval-good"
}

player-ringzero-from-landing-1 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-4" over 400ms
	copy "player-ringzero-from-landing-4"
}

player-ringzero-from-landing-10 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-8" over 600ms
	copy "player-ringzero-from-landing-8"
}

player-ringzero-from-landing-8 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-6" over 800ms
	goto "cutscene-artifacts-eval-good"
}

player-ringzero-from6-donut {
	walk entity "%PLAYER%" to geometry "ringzero-landing-6" over 200ms
	goto "cutscene-artifacts-eval-good"
}

player-ringzero-from6 {
	walk entity "%PLAYER%" to geometry "ringzero-landing-6" over 300ms
	goto "cutscene-artifacts-eval-good"
}

cutscene-artifacts-eval-good {
	set entity "%PLAYER%" on_tick to "look-left-and-right"
	wait 300ms
	show dialog "dialog-murmur1" {
		Marta "Did they do it wrong?"
	}
	wait 400ms
	show dialog "dialog-murmur2" {
		Max "I'm pretty sure %PLAYER% touched all of them...."
	}
	wait 200ms
	show dialog "dialog-murmur3" {
		Trekkie "Maybe they missed one."
	}
	wait 200ms
	set entity "%PLAYER%" on_tick to "null_script"
	turn entity "%PLAYER%" north
	show dialog "dialog-ring1" {
		Alfonso "Well, this is certainly... unexpected. We've never had a dud quite like this one before."
	}
	copy "alfonso-left-right"
	show dialog "dialog-ring2" {
		Alfonso "Why don't we --"
	}
	wait 300ms
	copy "lodge-un-murmur"
	fade out camera to #FFDD00 over 1000ms
	turn entity "%PLAYER%" south
	teleport entity "Ring Zero[0]" to geometry "ringzero-landing[0]"
	teleport entity "Ring Zero[1]" to geometry "ringzero-landing[1]"
	fade in camera from #FFDD00 over 1000ms
	wait 500ms
	pan camera to geometry "ringzero-camera" over 1100ms
	wait 400ms
	show dialog "dialog-ring3" {
		Alfonso "Oh! Oh, good heavens! Is that --"
		Bert "It is."
		Jackob "It's Ring Zero!"
		Player "What?! What is that?"
	}
	copy "player-struggles-a-bit"
	wait 200ms
	pan camera to entity "%PLAYER%" over 800ms
	wait 50ms
	fade out camera to #FFDD00 over 1000ms
	turn entity "%PLAYER%" south
	teleport entity "Ring Zero[0]" to geometry "ring_zero_when_off_screen[0]"
	teleport entity "Ring Zero[1]" to geometry "ring_zero_when_off_screen[1]"
	fade in camera from #FFDD00 over 1000ms
	show dialog "dialog-ring4" {
		Player "It just slipped itself onto my finger!"
	}
	copy "player-struggles-a-bit"
	wait 500ms
	copy "player-struggles-a-bit"
	wait 300ms
	turn entity "%PLAYER%" south
	show dialog "dialog-ring5" {
		Player "Um, it's not coming off. Is that normal?"
	}
	turn entity "%PLAYER%" toward entity "Alfonso"
	show dialog "dialog-ring6" {
		Alfonso
			"Normal? Normal?!"
			"Nothing about that thing is normal!"
			"This is --\nThis is unprecedented."
		Player
			"Is it bad?! What's wrong with it?"
			"Am I... am I gonna die?!"
		Jackob
			"The ring isn't bad. It's just... powerful."
		Bert
			"No one has been chosen by this ring before."
		Alfonso
			"Oh, but... but perhaps...."
	}
	set entity "Alfonso" on_tick to "look-left-and-right-fast"
	show dialog "dialog-ring7" {
		Alfonso
			"Oh, but this is good news, isn't it?"
			"This means we can finally fix things!"
		Bert
			"Fix the town."
		Jackob
			"Yes...."
			"Yes!"
	}
	set entity "Alfonso" on_tick to "null_script"
	turn entity "Alfonso" south
	show dialog "dialog-ring8" {
		Jackob "Yes, you can fix things at last!"
		Player "Fix the town?"
	}
	set entity "%PLAYER%" on_tick to "loiter2"
	show dialog "dialog-ring9" {
		Player "But the town is all glitchy and hacked! How am I supposed to fix it with this thing? Unless...."
	}
	set entity "%PLAYER%" on_tick to "null_script"
	turn entity "%PLAYER%" toward entity "Alfonso"
	show dialog "dialog-ring10" {
		Alfonso
			"Yes, exactly! That ring, Ring Zero --"
			"That ring gives you the power to hack the planet!"
		Player
			 "Hack the planet? You mean... all the stuff that's broken?"
		Bert
			"You can fix what the Big Bad broke!"
		Jackob
			"Everything that the Big Bag hacked so many years ago.... Everything that scoundrel ruined...."
		Player
			"This ring gives me the Big Bad's power?"
			"But I don't know how to hack! How am I supposed to fix anything?"
		Alfonso
			"Yes, well, you see...."
	}
	copy "elders-whisper"
	show dialog "dialog-ring11" {
		Alfonso "Please come with us, %PLAYER%."
	}
	pan camera to geometry "lodge-camera-point" over 1200ms
	wait 200ms
	copy "alfonso-to-secretdoor-button"
	wait 500ms
	copy "secret-door-open"
	wait 400ms
	copy "alfonso-from-secretdoor-button"
	pan camera to entity "%PLAYER%" over 900ms
	show dialog "dialog-ring12" {
		Alfonso "Into the inner sanctum!"
	}
	copy "elders-to-secretdoor"
	copy "deaden-artifacts"
	set flag "hide-lodge-crowd-mini" to true
	turn player control on
}

deaden-artifacts {
	set entity "Broom" on_interact to "null_script"
	set entity "Glasses" on_interact to "null_script"
	set entity "Wand" on_interact to "null_script"
	set entity "Book" on_interact to "null_script"
	set entity "Bracelet" on_interact to "null_script"
}

alfonso-to-secretdoor-button {
	wait 100ms
	walk entity "Alfonso" to geometry "secretdoor-button-path1" over 600ms
	walk entity "Alfonso" to geometry "secretdoor-button-path2" over 500ms
	wait 100ms
	turn entity "Alfonso" north
}

alfonso-from-secretdoor-button {
	wait 100ms
	walk entity "Alfonso" to geometry "secretdoor-button-path1" over 500ms
	walk entity "Alfonso" to geometry "elder-point" over 600ms
}

elders-whisper {
	wait 100ms
	turn entity "Alfonso" toward entity "Jackob"
	wait 100ms
	turn entity "Jackob" toward entity "Alfonso"
	wait 700ms
	turn entity "Alfonso" toward entity "Bert"
	wait 100ms
	turn entity "Bert" toward entity "Alfonso"
	wait 700ms
	turn entity "Alfonso" toward entity "Jackob"
	wait 500ms
	turn entity "Bert" toward entity "%PLAYER%"
	wait 50ms
	turn entity "Alfonso" toward entity "%PLAYER%"
	wait 100ms
	turn entity "Jackob" toward entity "%PLAYER%"
}

player-struggles-a-bit {
	wait 100ms
	turn entity "%PLAYER%" west
	set entity "%PLAYER%" current_animation to 1
	wait 50ms
	set entity "%PLAYER%" current_animation to 0
	wait 200ms
	turn entity "%PLAYER%" east
	set entity "%PLAYER%" current_animation to 1
	wait 50ms
	set entity "%PLAYER%" current_animation to 0
	wait 200ms
}

examine-bracelet {
	show dialog "dialog-tuesday-lunch" {
		Player
		"A Power Bracelet?"
		
		Bert
		"That is a croissant!"
		"Is my lunch!"
	}
		/* doc: That? That is my lunch! */
	turn player control off
	walk entity "Bert" to geometry "bert-lunch-take-spot" over 400ms
	turn entity "Bert" south
	wait 400ms
	teleport entity "Bracelet" to geometry "lodge-hidingplace"
	wait 300ms
	walk entity "Bert" to geometry "bert-lunch-watch-spot" over 400ms
	turn entity "Bert" south
	turn player control on
	set flag "artifact-bracelet-touched" to true
	goto "artifacts-eval"
}

examine-glasses {
	show dialog "dialog-tuesday-glasses" {
		Player
		"This?"
		"This is clearly a temporary asset that hasn't been replaced with anything yet."
		"Though...."
		"(touch)"
		"Ahh, oh well."
	}
	set flag "artifact-glasses-touched" to true
	goto "artifacts-eval"
}

examine-book {
	show dialog "dialog-tuesday-book" {
		Player
		"Ugh. Is that an eye on the cover?"
		"And I don't wanna know what kind of leather that is."
		"...."
		"It's not reacting to me, though."
	}
	set flag "artifact-book-touched" to true
	goto "artifacts-eval"
}

examine-broom {
	turn player control off
	set entity "Marta" on_tick to "null_script"
	walk entity "Marta" to geometry "marta-broom-step-spot" over 500ms
	set entity "%PLAYER%" on_tick to "watch-marta"
	show dialog "dialog-tuesday-broom" {
		Marta "Hey, that broom is mine! How did that end up there?"
	}
	walk entity "Marta" to geometry "marta-broom-take-spot" over 600ms
	wait 400ms
	teleport entity "Broom" to geometry "lodge-hidingplace"
	wait 300ms
	set entity "Marta" type to "marta_broom"
	wait 300ms
	walk entity "Marta" to geometry "marta-broom-watch-spot" over 700ms
	set entity "Marta" on_tick to "face-player"
	wait 300ms
	set flag "artifact-broom-touched" to true
	set entity "%PLAYER%" on_tick to "null_script"
	turn player control on
	goto "artifacts-eval"
}

examine-wand {
	set entity "%PLAYER%" on_tick to "spin-around-fast"
	show dialog "dialog-tuesday-wand1" {
		Player "Moon Prism Power...."
	}
	turn player control off
	wait 900ms
	set entity "%PLAYER%" on_tick to "null_script"
	turn entity "%PLAYER%" south
	show dialog "dialog-tuesday-wand2" {
		Player "Make Up!"
	}
	wait 400ms
	turn player control on
	turn entity "%PLAYER%" toward entity "Wand"
	show dialog "dialog-tuesday-wand3" {
		Player
		"Erm, maybe I had that a bit wrong."
		"Still, no response."
	}
	set flag "artifact-wand-touched" to true
	goto "artifacts-eval"
}

empty-lodge {
	copy "empty-lodge-mini"
		/* doc: just in case I didn't catch all the 'empty-lodge' scripts and need the rest to happen, too */
	teleport entity "Cleo" to geometry "lodge-hidingplace"
	teleport entity "Shepherd" to geometry "lodge-hidingplace"
	teleport entity "Beatrice" to geometry "lodge-hidingplace"
	teleport entity "Baker" to geometry "lodge-hidingplace"
	teleport entity "Trekkie" to geometry "lodge-hidingplace"
	teleport entity "Marta" to geometry "lodge-hidingplace"
	teleport entity "Max Swagger" to geometry "lodge-hidingplace"
	teleport entity "Smith" to geometry "lodge-hidingplace"
	teleport entity "Verthandi" to geometry "lodge-hidingplace"
	teleport entity "Uncle Zappy" to geometry "lodge-hidingplace"
	teleport entity "Aunt Zippy" to geometry "lodge-hidingplace"
	teleport entity "Goose  " to geometry "lodge-hidingplace"
	teleport entity "Goose " to geometry "lodge-hidingplace"
}

empty-lodge-mini {
	teleport entity "Bookcase" to geometry "lodge-hidingplace"
	copy "skip-artifacts"
	copy "deaden-artifacts"
	teleport entity "Jackob" to geometry "lodge-hidingplace"
	teleport entity "Alfonso" to geometry "lodge-hidingplace"
	teleport entity "Bert" to geometry "lodge-hidingplace"
}

show_dialog-zippy-prechoose {
	copy "face-player"
	if flag "ring-acquired" is true then
		goto "show_dialog-zippy-postchoose"
	show dialog "dialog-zippy-prechoose" {
		SELF "Go ahead, dear!"
	}
}

show_dialog-zappy-prechoose {
	copy "face-player"
	if flag "ring-acquired" is true then
		goto "show_dialog-zappy-postchoose"
	show dialog "dialog-zappy-prechoose" {
		SELF "Take your time!"
	}
}

show_dialog-verthandi-prechoose {
	copy "face-player"
	if flag "ring-acquired" is true then
		goto "show_dialog-verthandi-postchoose"
	show dialog "dialog-verthandi-prechoose" {
		SELF "Oh, how exciting!"
	}
}

show_dialog-smith-prechoose {
	copy "face-player"
	if flag "ring-acquired" is true then
		goto "show_dialog-smith-postchoose"
	show dialog "dialog-smith-prechoose" {
		SELF "Don't look at me! I don't know how any of this stuff works!"
	}
}

show_dialog-max-prechoose {
	copy "face-player"
	if flag "ring-acquired" is true then
		goto "show_dialog-max-postchoose"
	show dialog "dialog-max-prechoose" {
		SELF "Hmm. I've seen better artifacts."
	}
}

show_dialog-marta-prechoose {
	copy "face-player"
	if flag "ring-acquired" is true then
		goto "show_dialog-marta-postchoose"
	if flag "artifact-broom-touched" is true then
		goto "show_dialog-marta-prechoose-broomd"
	show dialog "dialog-marta-prechoose" {
		SELF "One of those artifacts seems a little familiar to me...."
	}
}

show_dialog-marta-prechoose-broomd {
	show dialog "dialog-marta-prechoose-broomd" {
		SELF "I knew I recognized this broom!"
	}
	set entity "Marta" on_interact to "show_dialog-marta-prechoose"
}

show_dialog-trekkie-prechoose {
	copy "face-player"
	if flag "ring-acquired" is true then
		goto "show_dialog-trekkie-postchoose"
	show dialog "dialog-trekkie-prechoose" {
		SELF "Oh, me hope it's a good one!"
	}
}

show_dialog-shepherd-prechoose {
	copy "face-player"
	if flag "ring-acquired" is true then
		goto "show_dialog-shepherd-postchoose"
	show dialog "dialog-shepherd-prechoose" {
		SELF "Is that old junk really magic?"
	}
}

show_dialog-cleo-prechoose {
	copy "face-player"
	if flag "ring-acquired" is true then
		goto "show_dialog-cleo-postchoose"
	show dialog "dialog-cleo-prechoose" {
		SELF "Ooh! I bet it's gonna be the one on the left! No, the right! No, the second one!"
	}
}

show_dialog-beatrice-prechoose {
	copy "face-player"
	if flag "ring-acquired" is true then
		goto "show_dialog-beatrice-postchoose"
	show dialog "dialog-beatrice-prechoose" {
		SELF "It's been so long since we've had a new mage!"
	}
}

show_dialog-baker-prechoose {
	copy "face-player"
	if flag "ring-acquired" is true then
		goto "show_dialog-baker-postchoose"
	show dialog "dialog-baker-prechoose" {
		SELF "Um, I gotta get back to work, kid. You wanna hurry it up a little?"
	}
}

show_dialog-jackob-prechoose {
	copy "face-player"
	set entity "Jackob" on_tick to "look-left-and-right-fast"
	show dialog "dialog-jackob-prechoose" {
		SELF "(Wait, was this everything?)"
	}
	set entity "Jackob" on_tick to "null_script"
	turn entity "%SELF%" south
}

show_dialog-alfonso-prechoose {
	copy "face-player"
	show dialog "dialog-alfonso-prechoose" {
		SELF
		"*ahem*"
		"The mage must present themselves to the artifacts until one shows interest."
	}
	turn entity "%SELF%" south
}

show_dialog-bert-prechoose {
	copy "face-player"
	show dialog "dialog-bert-prechoose" {
		SELF "Touch each item, please."
	}
	turn entity "%SELF%" south
}

show_dialog-zippy-postchoose {
	show dialog "dialog-zippy-postchoose" {
		SELF "We always knew you were destined for great things!"
	}
	set entity "%SELF%" on_interact to "show_dialog-zippy-prechoose"
}

show_dialog-zappy-postchoose {
	show dialog "dialog-zappy-postchoose" {
		SELF "We're both so proud of you!"
	}
	set entity "%SELF%" on_interact to "show_dialog-zappy-prechoose"
}

show_dialog-verthandi-postchoose {
	show dialog "dialog-verthandi-postchoose" {
		SELF "Oh, how exciting!"
	}
	set entity "%SELF%" on_interact to "show_dialog-verthandi-prechoose"
}

show_dialog-smith-postchoose {
	show dialog "dialog-smith-postchoose" {
		SELF
		"Sounds like that ring is a big deal."
		"Neat."
	}
	set entity "%SELF%" on_interact to "show_dialog-smith-prechoose"
}

show_dialog-max-postchoose {
	show dialog "dialog-max-postchoose" {
		SELF "Hmm. That ring looks a bit too plain to be the real Ring Zero, doesn't it?"
	}
	set entity "%SELF%" on_interact to "show_dialog-max-prechoose"
}

show_dialog-marta-postchoose {
	show dialog "dialog-marta-postchoose" {
		SELF "Wow. Never seen a TUESDAY like this before!"
	}
	set entity "%SELF%" on_interact to "show_dialog-marta-prechoose"
}

show_dialog-trekkie-postchoose {
	show dialog "dialog-trekkie-postchoose" {
		SELF "Amazing!"
	}
	set entity "%SELF%" on_interact to "show_dialog-trekkie-prechoose"
}

show_dialog-shepherd-postchoose {
	show dialog "dialog-shepherd-postchoose" {
		SELF "Neat!"
	}
	set entity "%SELF%" on_interact to "show_dialog-shepherd-prechoose"
}

show_dialog-cleo-postchoose {
	show dialog "dialog-cleo-postchoose" {
		SELF "It looks so shiny!"
	}
	set entity "%SELF%" on_interact to "show_dialog-cleo-prechoose"
}

show_dialog-beatrice-postchoose {
	show dialog "dialog-beatrice-postchoose" {
		SELF "Oh! I never thought I'd see this day! Oh, my Delmar...!"
	}
	set entity "%SELF%" on_interact to "show_dialog-beatrice-prechoose"
}

show_dialog-baker-postchoose {
	show dialog "dialog-baker-postchoose" {
		SELF "Congratulations, %PLAYER%!"
	}
	set entity "%SELF%" on_interact to "show_dialog-baker-prechoose"
}

watch-marta {
	turn entity "%SELF%" toward entity "Marta"
}

spin-around-fast {
	wait 200ms
	turn entity "%SELF%" west
	wait 200ms
	turn entity "%SELF%" south
	wait 200ms
	turn entity "%SELF%" east
	wait 200ms
	turn entity "%SELF%" north
}

show_dialog-lodge_cat {
	copy "face-player"
	if entity "%SELF%" is glitched then
		goto "show_dialog-lodge_cat-glitched"
	if flag "storyflag-catwork" is true then
		goto "lodge_cat-neutral"
	if flag "white-cat" is false then
		goto "lodge_cat-neutral"
	goto "show_dialog-lodge_cat-magic"
}

lodge_cat-neutral {
	show dialog "dialog-lodge_cat" {
		SELF "...."
	}
	goto "lodge_cat-wrapup"
}

show_dialog-lodge_cat-glitched {
	show dialog "dialog-lodge_cat-glitched" {
		SELF "////////"
	}
	goto "lodge_cat-glitchhint-eval"
}

debug-cat-prep {
	make entity "Cat" unglitched
	copy "set-hint-max-from-cleo"
}

begin-thumbsup {
	play entity "Cat" animation 3 once
	set entity "Cat" current_animation to 4
}

end-thumbsup {
	play entity "Cat" animation 5 once
}

show_dialog-lodge_cat-magic {
	turn player control off
	copy "begin-thumbsup"
	wait 700ms
	set entity "%PLAYER%" type to "pipscat"
	wait 400ms
	copy "end-thumbsup"
	turn player control on
	goto "lodge_cat-wrapup"
}

lodge_cat-glitchhint-eval {
	if flag "lodge_cat-unglitched" is false then
		goto "lodge_cat-hint-yes"
	goto "lodge_cat-wrapup"
}

lodge_cat-hint-yes {
	copy "set-hint-glitch"
	goto "lodge_cat-wrapup"
}

lodge_cat-wrapup {
	set entity "%SELF%" on_interact to "show_dialog-lodge_cat"
}

show_dialog-timmy-start {
	copy "face-player"
	if entity "%SELF%" is glitched then
		goto "show_dialog-timmy-glitched"
	if flag "demobonus" is false then
		goto "show_dialog-timmy-start-normal"
	if flag "demobonus-sportsbook-read" is true then
		goto "show_dialog-timmy-demobonus-s"
	show dialog "dialog-timmy-demobonus2"
		/* doc: Something really weird happened to my book! */
	goto "timmy-wrapup"
}

show_dialog-timmy-demobonus-s {
	if flag "demobonus" is false then
		goto "show_dialog-timmy-start"
	show dialog "dialog-timmy-demobonus-s"
		/* doc: I've heard of Clippy Bird!! */
	goto "timmy-wrapup"
}

show_dialog-timmy-start-normal {
	if flag "timmy-endstory" is true then
		goto "show_dialog-timmy-start-s"
	show dialog "dialog-timmy-start" {
		SELF
		alignment TL
		"Oh, how lovely! It's much easier to read like this!"
	}
	set flag "timmy-endstory" to true
	goto "timmy-wrapup"
}

show_dialog-timmy-start-s {
	show dialog "dialog-timmy-start-s" {
		SELF
			alignment TL
		"I've been trying to find books about the olympics."
		"Gosh, it'd be cool if I could get a gold medal for the high jump!"
		"I can jump, like, SO high!"
	}
		/* doc: I want to get a high jump gold medal! */
	goto "timmy-wrapup"
}

timmy-wrapup {
	turn entity "%SELF%" west
	set entity "%SELF%" on_interact to "show_dialog-timmy-start"
}

show_dialog-sportsbook {
	show dialog "dialog-sportsbook"
	copy "demobonus-sportsbook-eval"
	show dialog "dialog-hexeditor-bonus" {
		SELF
			portrait "journal"
			alignment TL
		"Sports sports sports. This book is about sports!"
		"Go, home team!"
	}
		/* doc: Copy paste tutorial */
	set flag "demobonus-sportsbook-read" to true
	turn hex clipboard on
	goto "dialog-sportsbook-end"
}

demobonus-sportsbook-eval {
	if flag "demobonus" is false then
		goto "dialog-sportsbook-end"
}

dialog-sportsbook-end {
	set entity "%SELF%" on_interact to "show_dialog-sportsbook"
}

show_dialog-timmy-glitched {
	show dialog "dialog-timmy-glitched"
		/* doc: Ner ubg qbtf n fnaqjvpu? */
	turn entity "%SELF%" west
	goto "timmy-glitchhint-eval"
}

timmy-glitchhint-eval {
	if flag "timmy-unglitched" is false then
		goto "timmy-hint-yes"
	set entity "%SELF%" on_interact to "show_dialog-timmy-start"
}

timmy-hint-yes {
	copy "set-hint-glitch"
	set entity "%SELF%" on_interact to "show_dialog-timmy-start"
}

bypass-tuesday {
	copy "set-goodmorning-flags-true"
	copy "set-artifact-flags-true"
	copy "set-tuesday-flags-true"
	turn hex control on
	copy "deaden-artifacts"
	copy "empty-lodge"
	teleport entity "Marta" to geometry "lodge-hidingplace"
		/* doc: possibly you can't teleport an entity twice in one tick... though why then does this one work? */
}

debug-disable-tuesday-q {
	show dialog "dialog-debug-disable-tuesday-q"
		/* doc: Disable Tuesday? */
}

debug-disable-tuesday-no {
	show dialog "dialog-no_debug-disable-tuesday"
	set entity "%SELF%" on_interact to "debug-disable-tuesday-q"
}

debug-disable-tuesday-walkup {
	copy "set-goodmorning-flags-true"
		/* doc: so you don't accidentally trigger walk-to-lodge if you set all flags to false before engaging the lodge */
	copy "set-tuesday-flags-true"
	set flag "hide-lodge-crowd" to false
		/* doc: was set true above; set to false now so the lodge crowd isn't hidden upon load, so you can voluntarily start the cutscene and it'll look okay */
	turn hex control on
	show dialog "dialog-debug-disable-tuesday-walkup"
	set entity "%SELF%" on_interact to "debug-disable-tuesday-q"
}

debug-disable-tuesday-complete {
	copy "set-goodmorning-flags-true"
	copy "set-artifact-flags-true"
	copy "set-tuesday-flags-true"
	turn hex control on
	show dialog "dialog-debug-disable-tuesday-complete"
	set entity "%SELF%" on_interact to "debug-disable-tuesday-q"
}

debug-undisable-tuesday {
	copy "set-goodmorning-flags-true"
		/* doc: so you don't accidentally trigger walk-to-lodge if you set all to false before engaging the lodge */
	copy "set-artifact-flags-false"
	copy "set-tuesday-flags-false"
	turn hex control off
	show dialog "dialog-debug-undisable-tuesday"
	set entity "%SELF%" on_interact to "debug-disable-tuesday-q"
}

debug-bypass-tuesday-q {
	copy "face-player"
	show dialog "dialog-debug-bypass-tuesday-q"
		/* doc: Bypass Tuesday? */
}

debug-bypass-tuesday {
	copy "bypass-tuesday"
	copy "set-tuesday-flags-true"
	show dialog "dialog-debug-bypass-tuesday"
		/* doc: Tuesday bypassed. */
	set entity "%SELF%" on_interact to "debug-bypass-tuesday-q"
}

debug-bypass-tuesday-but-enable-hintman {
	copy "bypass-tuesday"
	copy "set-tuesday-flags-true"
	set flag "hintman-explanation" to false
		/* doc: set to true in above copied script */
	show dialog "dialog-debug-bypass-tuesday-plus-hintman"
		/* doc: Tuesday bypassed. Prepare for hintman cutscene. */
	set entity "%SELF%" on_interact to "debug-bypass-tuesday-q"
}

debug-bypass-tuesday-no {
	set entity "%SELF%" on_interact to "debug-bypass-tuesday-q"
}

debug-cutscene-tuesday-q {
	copy "face-player"
	show dialog "dialog-debug-cutscene-tuesday-q"
		/* doc: Begin TUESDAY cutscene? */
}

debug-cutscene-tuesday {
	copy "cutscene-tuesday"
	set entity "%SELF%" on_interact to "debug-bypass-tuesday-q"
}

debug-cutscene-tuesday-no {
	set entity "%SELF%" on_interact to "debug-bypass-tuesday-q"
}

debug-touch-artifacts-q {
	copy "face-player"
	show dialog "dialog-debug-touch-artifacts-q" {
		SELF
		"Do what to artifacts?"
		> "Touch all artifacts"
			: debug-touch-artifacts
		> "Finish lecture and lower bookcase"
			: debug-touch-artifacts-and-aftermath
		> "Teleport to secret room (with cutscene)"
			: enter-secretroom-with-guaranteed-cutscene
		> "No"
			: debug-touch-artifacts-no
			
	}
}

skip-artifacts {
	copy "set-artifact-flags-true"
	teleport entity "Alfonso" to geometry "elder-point"
	teleport entity "Marta" to geometry "marta-broom-watch-spot"
	teleport entity "Broom" to geometry "lodge-hidingplace"
	teleport entity "Bracelet" to geometry "lodge-hidingplace"
	set entity "Marta" type to "marta_broom"
}

debug-touch-artifacts-end {
	set entity "%SELF%" on_interact to "debug-touch-artifacts-q"
}

debug-touch-artifacts-no {
	set entity "%SELF%" on_interact to "debug-touch-artifacts-q"
}

debug-touch-artifacts-and-aftermath {
	copy "skip-artifacts"
	teleport entity "Bookcase" to geometry "lodge-hidingplace"
	set flag "ring-acquired" to true
	set flag "hide-lodge-crowd-mini" to true
	teleport entity "Alfonso" to geometry "lodge-hidingplace"
	teleport entity "Bert" to geometry "lodge-hidingplace"
	teleport entity "Jackob" to geometry "lodge-hidingplace"
	goto "debug-touch-artifacts-end"
}

debug-touch-artifacts {
	copy "skip-artifacts"
	goto "debug-touch-artifacts-end"
}
`;

var oldCoupleHouseDialog = {
	"dialog-delmar-huh": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Wha... huh?"
			]
		}
	],
	"dialog-bea-glitched": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Ydy D ymjk ht bgvnnzn? Ocz rjmgy'n bjiz\nv wdo apuut."
			]
		}
	],
	"dialog-delmar-glitched": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Bu, qrne. V zhfg'ir fgbbq hc gbb snfg.\nSrry n ovg jbbml."
			]
		}
	],
	"dialog-delmar-blab": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"...I tied an onion to my belt, which was\nthe style at the time.",
				"Now, to take the ferry cost a nickle, and\nin those days, nickles had pictures of\nbumblebees on 'em.",
				"\"Gimme five bees for a quarter,\" you'd\nsay. Now where were we?",
				"Oh, yeah. The important thing was that I\nhad an onion on my belt, which was the\nstyle at the time.",
				"They didn't have any white onions, because\nof the war. The only thing you could get\nwas those big yellow ones...."
			]
		}
	],
	"dialog-delmar-catchup": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "Delmar",
			"messages": [
				"Huh? What's goin' on? What'd I miss?"
			]
		}
	],
	"dialog-bea-start1": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Forty years ago, things were sure\ndifferent.",
				"I was a lot younger then, and my husband,\n%Delmar%...."
			]
		}
	],
	"dialog-bea-start2": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"My husband was a real man! Not a farm\nanimal!"
			]
		}
	],
	"dialog-bea-start3": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"That ghastly hacker ruffian hacked him\ninto a sheep on a whim!",
				"%Delmar% didn't even do anything\nto him!",
				"...Other than insult his character, and\nthat of his mother.",
				"...And eat his lunch.",
				"...And cut his brake line.",
				"The point is, child, that %Delmar%'s\nbeen stuck as a sheep ever since!",
				"But you, now that you have Ring Zero....",
				"You can make things right again, can't\nyou?",
				"I miss my %Delmar%!"
			]
		},
		{
			"alignment": "BOTTOM_RIGHT",
			"entity": "%PLAYER%",
			"messages": [
				"Make things right? Well, I can change\nwhat he looks like, anyway."
			]
		},
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"That works for me!"
			]
		}
	],
	"dialog-bea-start-s": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Oh, %Delmar%... we'll fix you up\nreal soon!"
			]
		}
	],
	"dialog-bea-mandud1": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Oh, %Delmar%! You're... oh...."
			]
		}
	],
	"dialog-bea-mandud2": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Oh, goodness. Well, this isn't my\n%Delmar%, but I suppose it's nice\nhe's not a sheep anymore, at least.",
				"He's been a sheep for so long... well, I\nsuppose it's been forty years."
			]
		}
	],
	"dialog-bea-mandud-s": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Oh, %Delmar%! We'll make you your\nnormal self soon!"
			]
		}
	],
	"dialog-bea-happy": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "Beatrice",
			"messages": [
				"Oh, %Delmar%, it's you!\nYou're a man again! At last!"
			]
		},
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "Delmar",
			"messages": [
				"Whazzat, %Beatrice%? Something seems\ndifferent."
			]
		},
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "Beatrice",
			"messages": [
				"Oh, it's my %Delmar%! Thank you,\n%PLAYER%!"
			]
		}
	],
	"dialog-bea-trick": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Oh! That's a nasty trick,\n%PLAYER%!",
				"How could you?",
				"Although... I sort of get the feeling\nhe'll be back to normal in a few minutes."
			]
		}
	],
	"dialog-bea-confused": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Oh, %Delmar%, you're... uh...."
			]
		}
	],
	"dialog-bea-end-s": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Thank you, %PLAYER%!"
			]
		}
	],
	"dialog-bea-regret1": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"....",
				"You know, I appreciate what you did,\n%PLAYER%. I really do."
			]
		}
	],
	"dialog-bea-regret2": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"...."
			]
		}
	],
	"dialog-bea-regret3": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"But now I find myself longing for quiet.",
				"It was so peaceful, before. %Delmar%\nand I used to get along so well.",
				"And it's so difficult to fall asleep\nrecently.",
				"I hate to ask it, child, but....",
				"I can't hear myself think! Please change\nhim back!"
			]
		}
	],
	"dialog-bea-regret-s": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"I'm sure he won't mind being a sheep\nagain. In fact, I'm not sure he'll notice.",
				"But I sure will! I won't have peace\notherwise!"
			]
		}
	],
	"dialog-bea-relief": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Thank you, child!",
				"...And, erm, we need not mention this to\nanyone! You understand?"
			]
		}
	],
	"dialog-bea-relief-s": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Peace at last!"
			]
		}
	],
	"dialog-bea-coincidence": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Oh! And I was just thinking how I wanted\nhim to become a sheep again!",
				"So gentle... and so quiet!",
				"Thank you, %PLAYER%!"
			]
		}
	],
	"dialog-bea-deja": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"....",
				"I suddenly have the strangest feeling of\ndeja vu."
			]
		}
	],
	"dialog-debug-bea-sequel-q": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Set sequel branch?"
			],
			"response_type": "SELECT_FROM_SHORT_LIST",
			"options": [
				{
					"label": "Yes (plus man)",
					"script": "debug-bea-sequel-man"
				},
				{
					"label": "Yes",
					"script": "debug-bea-sequel-noman"
				},
				{
					"label": "No",
					"script": "debug-bea-sequel-no"
				}
			]
		}
	],
	"dialog-debug-bea-sequel-man": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Sequel branch activated, and Delmar is a\nman."
			]
		}
	],
	"dialog-debug-bea-sequel-noman": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Sequel branch activated, and Delmar left\nalone."
			]
		}
	],
	"dialog-no_debug-bea-sequel": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Nothing changed."
			]
		}
	],
	"dialog-bea2-backstory-alt": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Oh, um....",
				"Actually, I was hoping he could become a\nsheep again."
			]
		}
	],
	"dialog-bea2-end-alt": [
		{
			"alignment": "BOTTOM_LEFT",
			"entity": "%SELF%",
			"messages": [
				"Well, I suppose we could give this a try\ninstead...."
			]
		}
	]
};

var oldCoupleHouseScript = {
	"on_tick-oldcouplehouse": [
		{
			"action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
			"entity": "%PLAYER%",
			"geometry": "door-oldcouplehouse",
			"success_script": "leave-oldcouplehouse",
			"expected_bool": true
		}
	],
	"on_load-oldcouplehouse": [
		{
			"action": "RUN_SCRIPT",
			"script": "oldcouplehouse-debug-check"
		}
	],
	"oldcouplehouse-debug-check": [
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "debug-mode",
			"expected_bool": false,
			"success_script": "hide-debug-oldcouplehouse"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "oldcouplehouse-sequel-check"
		}
	],
	"hide-debug-oldcouplehouse": [
		{
			"action": "TELEPORT_ENTITY_TO_GEOMETRY",
			"entity": "Debug Exa",
			"geometry": "oldcouplehouse-hidingplace"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "oldcouplehouse-sequel-check"
		}
	],
	"oldcouplehouse-sequel-check": [
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "bea-sequel-branch",
			"expected_bool": true,
			"success_script": "on_load-make-delmar-man"
		}
	],
	"on_load-make-delmar-man": [
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "storyflag-bea2",
			"expected_bool": true,
			"success_script": "make-delmar-sheep"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "make-delmar-man"
		}
	],
	"make-delmar-man": [
		{
			"action": "SET_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "old_man"
		},
		{
			"action": "SET_ENTITY_CURRENT_ANIMATION",
			"entity": "Delmar",
			"byte_value": 3
		},
		{
			"action": "SET_ENTITY_on_tick",
			"entity": "Delmar",
			"script": "on_tick-delmar-blab-nonman-watch"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "on_load-oldcouplehouse-end"
		}
	],
	"make-delmar-sheep": [
		{
			"action": "SET_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "sheep"
		},
		{
			"action": "SET_ENTITY_CURRENT_ANIMATION",
			"entity": "Delmar",
			"byte_value": 0
		},
		{
			"action": "SET_ENTITY_on_tick",
			"entity": "Delmar",
			"script": "on_tick-delmar-blab-man-watch"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "on_load-oldcouplehouse-end"
		}
	],
	"on_load-oldcouplehouse-end": [
		{
			"action": "RUN_SCRIPT",
			"script": "null_script"
		}
	],
	"leave-oldcouplehouse": [
		{
			"action": "SET_WARP_STATE",
			"string": "exit_from-oldcouplehouse"
		},
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "storyflag-bea1",
			"expected_bool": true,
			"success_script": "leave-happytrue"
		},
		{
			"action": "LOAD_MAP",
			"map": "main"
		}
	],
	"leave-happytrue": [
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "bea-sequel-branch",
			"bool_value": true
		},
		{
			"action": "LOAD_MAP",
			"map": "main"
		}
	],
	"show_dialog-bea-glitched": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-glitched"
		},
		{
			"action": "SET_ENTITY_on_interact",
			"entity": "%SELF%",
			"script": "show_dialog-bea-start"
		}
	],
	"show_dialog-delmar-glitched": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-delmar-glitched"
		},
		{
			"action": "SET_ENTITY_on_interact",
			"entity": "%SELF%",
			"script": "show_dialog-delmar"
		}
	],
	"show_dialog-delmar": [
		{
			"action": "CHECK_ENTITY_GLITCHED",
			"entity": "%SELF%",
			"success_script": "show_dialog-delmar-glitched",
			"expected_bool": true
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "old_man",
			"expected_bool": false,
			"success_script": "show_dialog-dsheep"
		},
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "bea-sequel-branch",
			"expected_bool": true,
			"success_script": "show_dialog-delmar-blab"
		},
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "storyflag-bea1",
			"expected_bool": true,
			"success_script": "show_dialog-delmar-catchup"
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-delmar-huh",
			"doc": "Wha... Huh?"
		}
	],
	"show_dialog-delmar-blab": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-delmar-blab",
			"doc": "Which was the style at the time."
		},
		{
			"action": "SET_ENTITY_on_interact",
			"entity": "Delmar",
			"script": "show_dialog-delmar"
		}
	],
	"show_dialog-delmar-catchup": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-delmar-catchup",
			"doc": "Huh? What's goin' on? What'd I miss?"
		},
		{
			"action": "SET_ENTITY_on_interact",
			"entity": "Delmar",
			"script": "show_dialog-delmar"
		}
	],
	"show_dialog-dsheep": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-dsheep"
		},
		{
			"action": "SET_ENTITY_on_interact",
			"entity": "Delmar",
			"script": "show_dialog-delmar"
		}
	],
	"show_dialog-bea-start": [
		{
			"action": "CHECK_ENTITY_GLITCHED",
			"entity": "%SELF%",
			"success_script": "show_dialog-bea-glitched",
			"expected_bool": true
		},
		{
			"action": "COPY_SCRIPT",
			"script": "clear-own-tick"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "face-player"
		},
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "bea-sequel-branch",
			"expected_bool": true,
			"success_script": "show_dialog-bea2-eval"
		},
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "storyflag-bea1",
			"expected_bool": true,
			"success_script": "show_dialog-bea1-end-eval"
		},
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "bea1-backstory",
			"expected_bool": false,
			"success_script": "show_dialog-bea1-backstory-eval"
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "old_man",
			"expected_bool": true,
			"success_script": "show_dialog-bea1-success"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "show_dialog-bea1-backstory-s"
		}
	],
	"show_dialog-bea1-backstory-eval": [
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "old_man",
			"expected_bool": true,
			"success_script": "show_dialog-bea1-backstory-surprise"
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "sheep",
			"expected_bool": true,
			"success_script": "show_dialog-bea1-backstory"
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "helga",
			"expected_bool": true,
			"success_script": "show_dialog-bea1-backstory"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "show_dialog-bea1-backstory-alt"
		}
	],
	"show_dialog-bea1-backstory": [
	{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-start1",
			"doc": "Forty years ago, things were"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "clear-own-tick"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "slow-stare-at-delmar"
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-start2",
			"doc": "My husband was a real man, not a"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "slow-stare-at-player"
		},
		{
			"action": "SET_PLAYER_CONTROL",
			"bool_value": true
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-start3",
			"doc": "That gastly hacker ruffian hacked him on a whim!"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea1-incomplete-wrapup"
		}
	],
	"show_dialog-bea1-backstory-alt": [
		{
			"action": "COPY_SCRIPT",
			"script": "clear-own-tick"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "slow-stare-at-delmar"
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-mandud1",
			"doc": "Oh, Delmar! You're... oh...."
		},
		{
			"action": "COPY_SCRIPT",
			"script": "face-player"
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-mandud2",
			"doc": "Oh, goodness. Well, at least he's not a sheep."
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-start3",
			"doc": "That gastly hacker ruffian hacked him on a whim!"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea1-incomplete-wrapup"
		}
	],
	"show_dialog-bea1-backstory-s": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-start-s",
			"doc": "Oh Delmar, we'll fix you up real soon!"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea1-incomplete-wrapup"
		}
	],
	"show_dialog-bea1-success": [
		{
			"action": "SET_PLAYER_CONTROL",
			"bool_value": false
		},
		{
			"action": "COPY_SCRIPT",
			"script": "clear-own-tick"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "slow-stare-at-delmar"
		},
		{
			"action": "SET_PLAYER_CONTROL",
			"bool_value": true
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-happy",
			"doc": "Oh, Delmar, it's you!"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea1-complete-wrapup"
		}
	],
	"show_dialog-bea1-end-eval": [
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "old_man",
			"expected_bool": true,
			"success_script": "show_dialog-bea1-end-s"
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "sheep",
			"expected_bool": true,
			"success_script": "show_dialog-bea1-end-trick"
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "helga",
			"expected_bool": true,
			"success_script": "show_dialog-bea1-end-trick"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "show_dialog-bea1-end-confused"
		}
	],
	"show_dialog-bea1-end-confused": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-confused",
			"doc": "Delmar, you're...."
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea-wrapup-mini"
		}
	],
	"show_dialog-bea1-end-trick": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-trick",
			"doc": "How could you? What a nasty trick!"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea-wrapup-mini"
		}
	],
	"show_dialog-bea1-end-s": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-end-s",
			"doc": "Thank you, Player!"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea-wrapup-mini"
		}
	],
	"show_dialog-bea1-backstory-surprise": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-happy",
			"doc": "He's a man again! Thank you, Player! (TODO: MAKE THIS DIALOG DIFFERENT THO)"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea1-complete-wrapup"
		}
	],
	"show_dialog-bea2-eval": [
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "storyflag-bea2",
			"expected_bool": true,
			"success_script": "show_dialog-bea2-end-eval"
		},
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "bea2-backstory",
			"expected_bool": false,
			"success_script": "show_dialog-bea2-backstory-eval"
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "sheep",
			"expected_bool": true,
			"success_script": "show_dialog-bea2-success"
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "helga",
			"expected_bool": true,
			"success_script": "show_dialog-bea2-success"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "show_dialog-bea2-backstory-s"
		}
	],
	"show_dialog-bea2-success-surprise": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-coincidence",
			"doc": "Oh, and I was just thinking how I wanted him to become a sheep"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea2-complete-wrapup"
		}
	],
	"show_dialog-bea2-backstory-alt": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea2-backstory-alt",
			"doc": "Actually, I was hoping he could become a sheep again."
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea2-incomplete-wrapup"
		}
	],
	"show_dialog-bea2-backstory-eval": [
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "sheep",
			"expected_bool": true,
			"success_script": "show_dialog-bea2-success-surprise"
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "helga",
			"expected_bool": true,
			"success_script": "show_dialog-bea2-success-surprise"
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "old_man",
			"expected_bool": true,
			"success_script": "show_dialog-bea2-backstory"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "show_dialog-bea2-backstory-alt"
		}
	],
	"show_dialog-bea2-backstory": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-regret1",
			"doc": "You know, I appreciate what you did, Player"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "clear-own-tick"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "slow-stare-at-delmar"
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-regret2",
			"doc": "...."
		},
		{
			"action": "COPY_SCRIPT",
			"script": "slow-stare-at-player"
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-regret3",
			"doc": "But now I find myself longing for quiet."
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea2-incomplete-wrapup"
		}
	],
"show_dialog-bea2-backstory-s": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-regret-s",
			"doc": "I'm sure he won't mind being a sheep again."
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea2-incomplete-wrapup"
		}
	],
	"show_dialog-bea2-success": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-relief",
			"doc": "Thank you! And we need not mention this to anyone"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea2-complete-wrapup"
		}
	],
	"show_dialog-bea2-end-eval": [
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "old_man",
			"expected_bool": true,
			"success_script": "show_dialog-bea2-deja"
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "sheep",
			"expected_bool": true,
			"success_script": "show_dialog-bea2-end"
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "helga",
			"expected_bool": true,
			"success_script": "show_dialog-bea2-end"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "show_dialog-bea2-end-alt"
		}
	],
	"show_dialog-bea2-end": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-relief-s",
			"doc": "Peace at last!"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea-wrapup-mini"
		}
	],
	"show_dialog-bea2-end-alt": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea2-end-alt",
			"doc": "Well, I suppose we could give this a try instead"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea-wrapup-mini"
		}
	],
	"show_dialog-bea2-deja": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-bea-deja",
			"doc": "I suddenly have the strangest feeling of"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea-wrapup-mini"
		}
	],
	"bea-wrapup-mini": [
		{
			"action": "SET_ENTITY_on_interact",
			"entity": "Beatrice",
			"script": "show_dialog-bea-start"
		}
	],
	"bea1-complete-wrapup": [
		{
			"action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
			"entity": "%SELF%",
			"target_entity": "Delmar"
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "bea1-backstory",
			"bool_value": true
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "storyflag-bea1",
			"bool_value": true
		},
		{
			"action": "COPY_SCRIPT",
			"script": "calculate-hint-tracking-series"
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "hint-tracking-check",
			"value": 4,
			"comparison": "==",
			"expected_bool": true,
			"success_script": "reset-bea1-hint-only",
			"doc": "if the hint series is the same, reset hint"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "bea1-success-wrapup"
		}
	],
	"reset-bea1-hint-only": [
		{
			"action": "COPY_SCRIPT",
			"script": "set-hint-none"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "bea1-success-wrapup"
		}
	],
	"bea1-success-wrapup": [
		{
			"action": "COPY_SCRIPT",
			"script": "bea-wrapup-mini"
		}
	],
	"bea1-incomplete-wrapup": [
		{
			"action": "COPY_SCRIPT",
			"script": "set_tick-watch-player"
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "bea1-backstory",
			"bool_value": true
		},
		{
			"action": "COPY_SCRIPT",
			"script": "set-hint-bea1"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "bea-wrapup-mini"
		}
	],
	"slow-stare-at-delmar": [
		{
			"action": "SET_PLAYER_CONTROL",
			"bool_value": false
		},
{
			"action": "NON_BLOCKING_DELAY",
			"duration": 100
		},
		{
			"action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
			"entity": "%SELF%",
			"target_entity": "Delmar"
		},
		{
			"action": "NON_BLOCKING_DELAY",
			"duration": 500
		},
		{
			"action": "SET_PLAYER_CONTROL",
			"bool_value": true
		}
	],
	"slow-stare-at-player": [
		{
			"action": "SET_PLAYER_CONTROL",
			"bool_value": false
		},
{
			"action": "NON_BLOCKING_DELAY",
			"duration": 100
		},
		{
			"action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
			"entity": "%SELF%",
			"target_entity": "%PLAYER%"
		},
		{
			"action": "NON_BLOCKING_DELAY",
			"duration": 500
		},
		{
			"action": "SET_PLAYER_CONTROL",
			"bool_value": true
		}
	],
	"bea2-complete-wrapup": [
		{
			"action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
			"entity": "%SELF%",
			"target_entity": "Delmar"
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "storyflag-bea2",
			"bool_value": true
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "bea2-backstory",
			"bool_value": true
		},
		{
			"action": "COPY_SCRIPT",
			"script": "calculate-hint-tracking-series"
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "hint-tracking-check",
			"value": 9,
			"comparison": "==",
			"expected_bool": true,
			"success_script": "reset-bea2-hint-only",
			"doc": "if the hint series is the same, reset hint"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "bea2-success-wrapup"
		}
	],
	"reset-bea2-hint-only": [
		{
			"action": "COPY_SCRIPT",
			"script": "set-hint-none"
		},
		{
			"action": "RUN_SCRIPT",
			"script": "bea2-success-wrapup"
		}
	],
	"bea2-success-wrapup": [
		{
			"action": "COPY_SCRIPT",
			"script": "bea-wrapup-mini"
		}
	],
	"bea2-incomplete-wrapup": [
		{
			"action": "COPY_SCRIPT",
			"script": "set_tick-watch-player"
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "bea2-backstory",
			"bool_value": true
		},
		{
			"action": "COPY_SCRIPT",
			"script": "set-hint-bea2"
		},
		{
			"action": "SET_ENTITY_on_interact",
			"entity": "Beatrice",
			"script": "show_dialog-bea-start"
		}
	],
	"debug-bea-sequel-q": [
		{
			"action": "COPY_SCRIPT",
			"script": "face-player"
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-debug-bea-sequel-q"
		}
	],
	"delmar-blab": [
		{
			"action": "SET_ENTITY_CURRENT_ANIMATION",
			"entity": "Delmar",
			"byte_value": 3
		},
		{
			"action": "SET_ENTITY_on_tick",
			"entity": "Delmar",
			"script": "on_tick-delmar-blab-nonman-watch"
		}
	],
	"on_tick-delmar-blab-nonman-watch": [
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "old_man",
			"expected_bool": false,
			"success_script": "delmar-unblab"
		}
	],
	"delmar-unblab": [
		{
			"action": "SET_ENTITY_CURRENT_ANIMATION",
			"entity": "Delmar",
			"byte_value": 0
		},
		{
			"action": "SET_ENTITY_on_tick",
			"entity": "Delmar",
			"script": "on_tick-delmar-blab-man-watch"
		}
	],
	"on_tick-delmar-blab-man-watch": [
		{
			"action": "CHECK_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "old_man",
			"expected_bool": true,
			"success_script": "delmar-blab"
		}
	],
	"debug-bea-sequel-man": [
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "bea-sequel-branch",
			"bool_value": true
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "storyflag-bea1",
			"bool_value": true
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "bea1-backstory",
			"bool_value": true
		},
		{
			"action": "SET_ENTITY_TYPE",
			"entity": "Delmar",
			"entity_type": "old_man"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "set-hint-none"
		},
		{
			"action": "COPY_SCRIPT",
			"script": "delmar-blab"
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-debug-bea-sequel-man"
		},
		{
			"action": "SET_ENTITY_on_interact",
			"entity": "%SELF%",
			"script": "debug-bea-sequel-q"
		}
	],
	"debug-bea-sequel-noman": [
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "bea-sequel-branch",
			"bool_value": true
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "storyflag-bea1",
			"bool_value": true
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "bea1-backstory",
			"bool_value": true
		},
		{
			"action": "COPY_SCRIPT",
			"script": "set-hint-none"
		},
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-debug-bea-sequel-noman"
		},
		{
			"action": "SET_ENTITY_on_interact",
			"entity": "%SELF%",
			"script": "debug-bea-sequel-q"
		}
	],
	"debug-bea-sequel-no": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-no_debug-bea-sequel",
			"doc": "Nothing changed."
		},
		{
			"action": "SET_ENTITY_on_interact",
			"entity": "%SELF%",
			"script": "debug-bea-sequel-q"
		}
	],
	"debug-bea-sequel-no": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "dialog-no_debug-bea-sequel",
			"doc": "Nothing changed."
		},
		{
			"action": "SET_ENTITY_on_interact",
			"entity": "%SELF%",
			"script": "debug-bea-sequel-q"
		}
	]
};

var oldCoupleHouseNatlang = `settings for dialog {
	parameters for global defaults {
		alignment BOTTOM_LEFT
	}
	parameters for label PLAYER {
		entity "%PLAYER%"
		alignment BOTTOM_RIGHT
	}
	parameters for label SELF {
		entity "%SELF%"
	}
}

on_tick-oldcouplehouse {
	if entity "%PLAYER%" is inside geometry door-oldcouplehouse
		then goto leave-oldcouplehouse
}

on_load-oldcouplehouse {
	goto oldcouplehouse-debug-check
}

oldcouplehouse-debug-check {
	if flag debug-mode is false then goto hide-debug-oldcouplehouse
	goto oldcouplehouse-sequel-check
}

hide-debug-oldcouplehouse {
	teleport entity "Debug Exa" to geometry oldcouplehouse-hidingplace
	goto oldcouplehouse-sequel-check
}

oldcouplehouse-sequel-check {
	if flag bea-sequel-branch is true then goto on_load-make-delmar-man
}

on_load-make-delmar-man {
	if flag storyflag-bea2 is true then goto make-delmar-sheep
	goto make-delmar-man
}

make-delmar-man {
	set entity Delmar type to old_man
	set entity Delmar current_animation to 3
	set entity Delmar on_tick to on_tick-delmar-blab-nonman-watch
	goto on_load-oldcouplehouse-end
}

make-delmar-sheep {
	set entity Delmar type to sheep
	set entity Delmar current_animation to 0
	set entity Delmar on_tick to on_tick-delmar-blab-man-watch
	goto on_load-oldcouplehouse-end
}

on_load-oldcouplehouse-end {
	goto null_script
}

leave-oldcouplehouse {
	set warp state to exit_from-oldcouplehouse
	if flag storyflag-bea1 is true then goto leave-happytrue
	load map main
}

leave-happytrue {
	set flag bea-sequel-branch to true
	load map main
}

show_dialog-bea-glitched {
	show dialog {
		SELF "Ydy D ymjk ht bgvnnzn? Ocz rjmgy'n bjiz v wdo apuut."
	}
	set entity "%SELF%" on_interact to show_dialog-bea-start
}

show_dialog-delmar-glitched {
	show dialog {
		SELF "Bu, qrne. V zhfg'ir fgbbq hc gbb snfg. Srry n ovg jbbml."
	}
	set entity "%SELF%" on_interact to show_dialog-delmar
}

show_dialog-delmar {
	if entity "%SELF%" is glitched then goto show_dialog-delmar-glitched
	if entity Delmar type is not old_man then goto show_dialog-dsheep
	if flag bea-sequel-branch is true then goto show_dialog-delmar-blab
	if flag storyflag-bea1 is true then goto show_dialog-delmar-catchup
	show dialog {
		SELF "Wha... huh?"
	}
}

show_dialog-delmar-blab {
	show dialog {
		SELF
		"...I tied an onion to my belt, which was the style at the time."
		"Now, to take the ferry cost a nickle, and in those days, nickles had pictures of bumblebees on 'em."
		"\\"Gimme five bees for a quarter,\\" you'd say. Now where were we?"
		"Oh, yeah. The important thing was that I had an onion on my belt, which was the style at the time."
		"They didn't have any white onions, because of the war. The only thing you could get was those big yellow ones...."
	}
	set entity Delmar on_interact to show_dialog-delmar
}

show_dialog-delmar-catchup {
	show dialog {
		Delmar "Huh? What's goin' on? What'd I miss?"
	}
	set entity Delmar on_interact to show_dialog-delmar
}

show_dialog-dsheep {
	show dialog dialog-dsheep
	set entity Delmar on_interact to show_dialog-delmar
}

show_dialog-bea-start {
	if entity "%SELF%" is glitched then goto show_dialog-bea-glitched
	copy script clear-own-tick
	copy script face-player
	if flag bea-sequel-branch is true then goto show_dialog-bea2-eval
	if flag storyflag-bea1 is true then goto show_dialog-bea1-end-eval
	if flag bea1-backstory is false then goto show_dialog-bea1-backstory-eval
	if entity Delmar type is old_man then goto show_dialog-bea1-success
	goto show_dialog-bea1-backstory-s
}

show_dialog-bea1-backstory-eval {
	if entity Delmar type is old_man then goto show_dialog-bea1-backstory-surprise
	if entity Delmar type is sheep then goto show_dialog-bea1-backstory
	if entity Delmar type is helga then goto show_dialog-bea1-backstory
	goto show_dialog-bea1-backstory-alt
}

show_dialog-bea1-backstory {
	show dialog {
		SELF
		"Forty years ago, things were sure different."
		"I was a lot younger then, and my husband, %Delmar%...."
	}
	copy script clear-own-tick
	copy script slow-stare-at-delmar
	show dialog {
		SELF
		"My husband was a real man! Not a farm animal!"
	}
	copy script slow-stare-at-player
	turn player control on
	show dialog dialog-bea-start3 {
		SELF
		"That ghastly hacker ruffian hacked him into a sheep on a whim!"
		"%Delmar% didn't even do anything to him!"
		"...Other than insult his character, and that of his mother."
		"...And eat his lunch."
		"...And cut his brake line."
		"The point is, child, that %Delmar%'s been stuck as a sheep ever since!"
		"But you, now that you have Ring Zero...."
		"You can make things right again, can't you?"
		"I miss my %Delmar%!"

		PLAYER
		"Make things right? Well, I can change what he looks like, anyway."

		SELF
		"That works for me!"
	}
	copy script bea1-incomplete-wrapup
}

show_dialog-bea1-backstory-alt {
	copy script clear-own-tick
	copy script slow-stare-at-delmar
	show dialog {
		SELF "Oh, %Delmar%! You're... oh...."
	}
	copy script face-player
	show dialog {
		SELF
		"Oh, goodness. Well, this isn't my %Delmar%, but I suppose it's nice he's not a sheep anymore, at least."
		"He's been a sheep for so long... well, I suppose it's been forty years."
	}
	show dialog dialog-bea-start3 // That gastly hacker ruffian hacked him on a whim!
	copy script bea1-incomplete-wrapup
}

show_dialog-bea1-backstory-s {
	show dialog {
		SELF
		"Oh, %Delmar%... we'll fix you up real soon!"
	}
	copy script bea1-incomplete-wrapup
}

show_dialog-bea1-success {
	turn player control off
	copy script clear-own-tick
	copy script slow-stare-at-delmar
	turn player control on
	show dialog dialog-bea-happy {
		Beatrice "Oh, %Delmar%, it's you! You're a man again! At last!"
		Delmar "Whazzat, %Beatrice%? Something seems different."
		Beatrice "Oh, it's my %Delmar%! Thank you, %PLAYER%!"
	}
	copy script bea1-complete-wrapup
}

show_dialog-bea1-end-eval {
	if entity Delmar type is old_man then goto show_dialog-bea1-end-s
	if entity Delmar type is sheep then goto show_dialog-bea1-end-trick
	if entity Delmar type is helga then goto show_dialog-bea1-end-trick
	goto show_dialog-bea1-end-confused
}

show_dialog-bea1-end-confused {
	show dialog {
		SELF "Oh, %Delmar%, you're... uh...."
	}
	copy script bea-wrapup-mini
}

show_dialog-bea1-end-trick {
	show dialog {
		SELF
		"Oh! That's a nasty trick, %PLAYER%!"
		"How could you?"
		"Although... I sort of get the feeling he'll be back to normal in a few minutes."
	}
	copy script bea-wrapup-mini
}

show_dialog-bea1-end-s {
	show dialog { SELF "Thank you, %PLAYER%!" }
	copy script bea-wrapup-mini
}

show_dialog-bea1-backstory-surprise {
	show dialog dialog-bea-happy // He's a man again! Thank you, Player!
		// (TODO: MAKE THIS DIALOG DIFFERENT THO)
	copy script bea1-complete-wrapup
}

show_dialog-bea2-eval {
	if flag storyflag-bea2 is true then goto show_dialog-bea2-end-eval
	if flag bea2-backstory is false then goto show_dialog-bea2-backstory-eval
	if entity Delmar type is sheep then goto show_dialog-bea2-success
	if entity Delmar type is helga then goto show_dialog-bea2-success
	goto show_dialog-bea2-backstory-s
}

show_dialog-bea2-success-surprise {
	show dialog {
		SELF
		"Oh! And I was just thinking how I wanted him to become a sheep again!"
		"So gentle... and so quiet!"
		"Thank you, %PLAYER%!"
	}
	copy script bea2-complete-wrapup
}

show_dialog-bea2-backstory-alt {
	show dialog {
		SELF "Oh, um...."
		"Actually, I was hoping he could become a sheep again."
	}
	copy script bea2-incomplete-wrapup
}

show_dialog-bea2-backstory-eval {
	if entity Delmar type is sheep then goto show_dialog-bea2-success-surprise
	if entity Delmar type is helga then goto show_dialog-bea2-success-surprise
	if entity Delmar type is old_man then goto show_dialog-bea2-backstory
	goto show_dialog-bea2-backstory-alt
}

show_dialog-bea2-backstory {
	show dialog {
		SELF
		"...."
		"You know, I appreciate what you did, %PLAYER%. I really do."
	}
	copy script clear-own-tick
	copy script slow-stare-at-delmar
	show dialog {
		SELF "...."
	}
	copy script slow-stare-at-player
	show dialog {
		SELF
		"But now I find myself longing for quiet."
		"It was so peaceful, before. %Delmar% and I used to get along so well."
		"And it's so difficult to fall asleep recently."
		"I hate to ask it, child, but...."
		"I can't hear myself think! Please change him back!"
	}
	copy script bea2-incomplete-wrapup
}

show_dialog-bea2-backstory-s {
	show dialog {
		SELF
		"I'm sure he won't mind being a sheep again. In fact, I'm not sure he'll notice."
		"But I sure will! I won't have peace otherwise!"
	}
	copy script bea2-incomplete-wrapup
}

show_dialog-bea2-success {
	show dialog dialog-bea-relief {
		SELF
		"Thank you, child!"
		"...And, erm, we need not mention this to anyone! You understand?"
	}
	copy script bea2-complete-wrapup
}

show_dialog-bea2-end-eval {
	if entity Delmar type is old_man then goto show_dialog-bea2-deja
	if entity Delmar type is sheep then goto show_dialog-bea2-end
	if entity Delmar type is helga then goto show_dialog-bea2-end
	goto show_dialog-bea2-end-alt
}

show_dialog-bea2-end {
	show dialog dialog-bea-relief-s {
		SELF "Peace at last!"
	}
	copy script bea-wrapup-mini
}

show_dialog-bea2-end-alt {
	show dialog dialog-bea2-end-alt {
		SELF "Well, I suppose we could give this a try instead...."
	}
	copy script bea-wrapup-mini
}

show_dialog-bea2-deja {
	show dialog dialog-bea-deja {
		SELF
		"...."
		"I suddenly have the strangest feeling of deja vu."
	}
	copy script bea-wrapup-mini
}

bea-wrapup-mini {
	set entity Beatrice on_interact to show_dialog-bea-start
}

bea1-complete-wrapup {
	turn entity "%SELF%" toward entity Delmar
	set flag bea1-backstory to true
	set flag storyflag-bea1 to true
	copy script calculate-hint-tracking-series
	if variable hint-tracking-check is 4 then goto reset-bea1-hint-only
		// if the hint series is the same, reset hint
	goto bea1-success-wrapup
}

reset-bea1-hint-only {
	copy script set-hint-none
	goto bea1-success-wrapup
}

bea1-success-wrapup {
	copy script bea-wrapup-mini
}

bea1-incomplete-wrapup {
	copy script set_tick-watch-player
	set flag bea1-backstory to true
	copy script set-hint-bea1
	copy script bea-wrapup-mini
}

slow-stare-at-delmar {
	turn player control off
	wait 100ms
	turn entity "%SELF%" toward entity Delmar
	wait 500ms
	turn player control on
}

slow-stare-at-player {
	turn player control off
	wait 100ms
	turn entity "%SELF%" toward entity "%PLAYER%"
	wait 500ms
	turn player control on
}

bea2-complete-wrapup {
	turn entity "%SELF%" toward entity Delmar
	set flag storyflag-bea2 to true
	set flag bea2-backstory to true
	copy script calculate-hint-tracking-series
	if variable hint-tracking-check is 9 then goto reset-bea2-hint-only
		// if the hint series is the same, reset hint
	goto bea2-success-wrapup
}

reset-bea2-hint-only {
	copy script set-hint-none
	goto bea2-success-wrapup
}

bea2-success-wrapup {
	copy script bea-wrapup-mini
}

bea2-incomplete-wrapup {
	copy script set_tick-watch-player
	set flag bea2-backstory to true
	copy script set-hint-bea2
	set entity Beatrice on_interact to show_dialog-bea-start
}

debug-bea-sequel-q {
	copy script face-player
	show dialog {
		SELF
		"Set sequel branch?"
		> "Yes (plus man)" : goto "debug-bea-sequel-man"
		> "Yes" : goto "debug-bea-sequel-noman"
		> "No" : goto "debug-bea-sequel-no"
	}
}

delmar-blab {
	set entity Delmar current_animation to 3
	set entity Delmar on_tick to on_tick-delmar-blab-nonman-watch
}

on_tick-delmar-blab-nonman-watch {
	if entity Delmar type is not old_man then goto delmar-unblab
}

delmar-unblab {
	set entity Delmar current_animation to 0
	set entity Delmar on_tick to on_tick-delmar-blab-man-watch
}

on_tick-delmar-blab-man-watch {
	if entity Delmar type is old_man then goto delmar-blab
}

debug-bea-sequel-man {
	set flag bea-sequel-branch to true
	set flag storyflag-bea1 to true
	set flag bea1-backstory to true
	set entity Delmar type to old_man
	copy script set-hint-none
	copy script delmar-blab
	show dialog {
		SELF "Sequel branch activated, and Delmar is a man."
	}
	set entity "%SELF%" on_interact to debug-bea-sequel-q
}

debug-bea-sequel-noman {
	set flag bea-sequel-branch to true
	set flag storyflag-bea1 to true
	set flag bea1-backstory to true
	copy script set-hint-none
	show dialog {
		SELF "Sequel branch activated, and Delmar left alone."
	}
	set entity "%SELF%" on_interact to debug-bea-sequel-q
}

debug-bea-sequel-no {
	show dialog {
		SELF "Nothing changed."
	}
	set entity "%SELF%" on_interact to debug-bea-sequel-q
}

dialog dialog-bea-mandud-s { //where was this supposed to go? lol
	SELF "Oh, %Delmar%! We'll make you your normal self soon!"
}`;

// ZIG ZAG TESTS

var zigzagTestStrings = [
`testScript {
	action1;
	if ( conditionA || conditionB ) { behaviorAB; }
	action2;
}`,
`testScript {
	action1;
	if ( conditionA || conditionB ) { behaviorAB; }
	else { behaviorX; }
	action2;
}`,
`testScript {
	action1;
	if ( conditionA || conditionB ) { behaviorAB; }
	else if ( conditionC ) { behaviorC; }
	else { behaviorX1; behaviorX2; }
	action2;
}`,
`testScript {
	action1;
	if ( conditionA || conditionB ) { behaviorAB; }
	else if ( conditionC ) { behaviorC; }
	else if ( conditionD ) { behaviorE; }
	else if ( conditionF ) { behaviorG; }
	else { behaviorX1; behaviorX2; }
	action2;
}`,
`testScript {
	action1;
	if ( conditionA || conditionB ) { behaviorAB; }
	action2;
	if ( conditionC || conditionD ) { behaviorCD; }
	action3;
}`,
`"bea script" {
	wait 200ms;
	copy "face-player";
	if (
		entity Delmar type is sheep
		|| entity Delmar type is sheep_helga
	) {
		copy script face-player;
		show dialog { Beatrice "He's a sheep!" }
		wait 500ms;
	} else if ( entity Delmar type is old_man ) {
		copy script face-player;
		show dialog { Beatrice "He's his old self!" }
		wait 500ms;
	}
	else {
		copy script face-player;
		show dialog { Beatrice "I'm not sure what to make of this...." }
		wait 500ms;
	}
	set entity "%SELF%" on_interact to "bea script";
}`,
]

// WHYLE TESTS

var whyleTestStrings = [
`testScript {
	while (CONDITION) {
		BEHAVIOR;
	}
}`,
`testScript {
	for (INIT; COND; ITER) {
		BEHAVIOR;
	}
}`,
`testScript {
	for (INIT; COND; ITER) {
		BEHAVIOR;
		BEHAVIOR;
		break;
		BEHAVIOR;
		BEHAVIOR;
	}
}`,
`testScript {
	for (INIT; COND; ITER) {
		BEHAVIOR;
		BEHAVIOR;
		continue;
		BEHAVIOR;
		BEHAVIOR;
	}
}`,
`testScript {
	for (INIT; COND;) {
		BEHAVIOR;
		BEHAVIOR;
		continue;
		BEHAVIOR;
		BEHAVIOR;
	}
}`,
]

var constantsTestStrings = [
`testScript {
	const! ($five = 5)
	wait $five;
}`,
`const! ($five = 5)

testScript {
	wait $five;
}`,
`const!(
	$five = 5
	$four = 4
)

testScript {
	wait $four;
	wait $five;
}`,
`const!(
	$five = 5
	$four = 4
)

testScript {
	wait $four;
	wait $five;
	const!($four = 4000)
	wait $four;
	wait $five;
}`,
`testScript {
	wait $undefinedVar;
}`,
]
