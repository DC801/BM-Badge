@echo off

set firmware=%cd%\data\firmware\KeyboardController-1.0.0.hex
set programmer=%cd%\data\programmers\atmel\atprogram.exe

"%programmer%" -i updi -d attiny1617 -t atmelice program -c -f "%firmware%"
IF ERRORLEVEL 1 GOTO errorHandling

echo ATMEL SUCCESS
exit 0

:errorHandling
echo ATMEL ERROR
echo ATMEL ERROR - not programmed!
echo ATMEL ERROR
exit 1
