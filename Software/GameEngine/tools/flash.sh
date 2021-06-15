#!/bin/bash

# Simple flash file for programming blank badges

printf "DC801 BADGE PROGRAMMER YO\n"
printf "PLUG IN A BADGE AND MASH A KEY\n\n"
read -n 1 input


while true; do
    printf "\n\nPROGRAMMING STAND BACK\n"
    nrfjprog -f nrf52 --recover
    nrfjprog -f nrf52 --program dc27_badge_merged_user.hex --chiperase
    nrfjprog -f nrf52 --reset
    tput bel
    printf "\n\nTHIS FUCKER IS DONE, PLUG IN NEXT AND SMACK THE KEYBOARD\n"
    printf "OR PRESS Q TO BE A QUITTER\n\n\n"

    read -n 1 input
    if [[ $input = "q" ]] || [[ $input = "Q" ]]; then
        printf "\nAH SHIT I'M DONE I GUESS\n\n"
        break
    fi
done