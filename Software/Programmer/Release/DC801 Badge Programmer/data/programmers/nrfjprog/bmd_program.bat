@echo off

set firmware=%cd%\data\firmware\bm-badge-test-merged.hex
rem echo %firmware%

nrfjprog --recover -f nrf52
IF ERRORLEVEL 1 GOTO errorHandling

nrfjprog -q --program "%firmware%" -f nrf52 --sectorerase
IF ERRORLEVEL 1 GOTO errorHandling

nrfjprog --reset -f nrf52
IF ERRORLEVEL 1 GOTO errorHandling

echo BMD-340 SUCCESS
exit 0

:errorHandling
echo BMD-340 ERROR
echo BMD-340 ERROR - not programmed!
echo BMD-340 ERROR
exit 1
