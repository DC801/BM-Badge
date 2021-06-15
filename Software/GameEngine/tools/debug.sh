#!/bin/sh

# Fires up the RTT logger and redirects to a log file

JLinkRTTLogger -Device NRF52 -If SWD -Speed 4000 -RTTChannel 0 RTT_Terminal.log 
