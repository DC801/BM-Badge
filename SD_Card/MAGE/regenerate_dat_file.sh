#!/bin/bash
set -e

node --unhandled-rejections=strict ./editor/cli/cli.js "$@"
echo "Success generating dat file ./game.dat"
