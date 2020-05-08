#!/usr/bin/env python3

import argparse
from argparse import RawTextHelpFormatter
from contextlib import contextmanager
import fcntl
import os
import subprocess
import sys
import tempfile
import time

SOFTDEVICE = 'softdevice/s140_nrf52_7.0.1_softdevice.hex'

APP = 'output/app/dc27_badge'
BOOTLOADER = 'output/bootloader/dc27_badge'
UF2 = 'output/dc27_badge.uf2'
MERGED = 'output/dc27_badge_merged.hex'

# Run command and print any output, we don't care about errors since
#  failures will be handled by humans
def run(args):
    process = subprocess.run(args, universal_newlines=True, capture_output=True)

    if (len(process.stdout) > 0):
        print(process.stdout)

    if (len(process.stderr) > 0):
        print(process.stderr)

# Run objcopy to generate intel hex files
def hex(file):
    run(['arm-none-eabi-objcopy', '-O', 'ihex', file, f'{file}.hex'])

# Run NRF mergehex tool to merge binaries
def merge(app, bootloader, merged):
    global SOFTDEVICE
    run(['mergehex', '-m', SOFTDEVICE, bootloader, app, '-o', merged])

# Flash merged binary with NRF utility
def flash(file):
    run(['nrfjprog', '--program', file, '-f', 'nrf52', '--sectorerase'])

# Generate UF2 binary
def uf2(file, output):
    run(['tools/uf2conv.py', file, '-c', '-f', '0xADA52840', '-o', output])

def non_block_read(file):
    fd = file.fileno()
    fl = fcntl.fcntl(fd, fcntl.F_GETFL)
    fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)
    try:
        return file.read().decode()
    except:
        return ''

def jlinkexe_connect(command):
    try:
        jlinkexe = subprocess.Popen(['JLinkExe', '-CommanderScript', command], stdout=subprocess.PIPE, stdin=subprocess.PIPE)
        stdout = non_block_read(jlinkexe.stdout)

        while True:
            if 'Cannot connect to J-Link' in stdout:
                jlinkexe.kill()
                print('Failed to connect to target (Try running as root?)')
                exit(1)

            if 'Cortex-M4 identified' in stdout:
                print('Connected to target')
                break

            stdout += non_block_read(jlinkexe.stdout)
        
        return jlinkexe
    except FileNotFoundError:
        return None

def gdbserver_connect():
    try:
        gdbserver = subprocess.Popen(['JLinkGDBServer', 
                                    '-if', 'swd', 
                                    '-speed', '4000', 
                                    '-device', 'NRF52840_XXAA', 
                                    '-port', '2331'],
            stdout=subprocess.PIPE,
            stdin=subprocess.PIPE)
        
        stdout = non_block_read(gdbserver.stdout)

        while True:
            if 'Could not connect to J-Link' in stdout:
                gdbserver.kill()
                print('Failed to connect GDB server')
                exit(1)

            if 'Waiting for GDB connection' in stdout:
                print('GDB server connected')
                break

            stdout += non_block_read(gdbserver.stdout)
        
        return gdbserver
    except FileNotFoundError:
        return None

def gdb():
    try:
        # Run GDB and give it direct access to stdin, stderr, and stdin
        process = subprocess.Popen('arm-none-eabi-gdb', stdout=sys.stdout, stderr=sys.stderr, stdin=sys.stdin)

        # Check periodically to see if GDB has been killed
        while process.poll() is None:
            time.sleep(0.5)

        return True
    except FileNotFoundError:
        return False


# Debug helper function, runs all servers including gdb
def debug():
    print('Running debug helper...')

    jlinkexe_command = ('si 1\n'                    # Select SWD interface
                        'speed 4000\n'              # 400kHz interface speed
                        'device NRF52840_XXAA\n'    # NRF52840 device
                        'connect\n')                # Connect to device

    cmdfile, cmdpath = tempfile.mkstemp(dir=os.getcwd())

    try:
        with os.fdopen(cmdfile, 'w') as tmp:
            tmp.write(jlinkexe_command)
            
        jlinkexe = jlinkexe_connect(cmdpath)
        if jlinkexe is None:
            print('Error while running JLinkExe: Not found')
            exit(1)

        gdbserver = gdbserver_connect()
        if gdbserver is None:
            print('Error while running JLinkGDBServer: Not found')
            print('Killing JLinkExe')
            jlinkexe.kill()
            exit(1)
        
        if not gdb():
            print('Error while running GDB: Not found')

        print('Killing GDB server')
        gdbserver.kill()
        print('Killing JLinkExe')
        jlinkexe.kill()
        
    finally:
        os.remove(cmdpath)

def main():
    global APP, BOOTLOADER, MERGED, UF2

    # Print our hard-coded file paths
    config = f'''
    Configured with the following:
        NRF Softdevice:     {SOFTDEVICE}
        Application binary: {APP}
        Bootloader binary:  {BOOTLOADER}
        Merged output:      {MERGED}
        UF2 output:         {UF2}
    '''

    # RawTextHelpFormatter, keep newlines in epilog string
    # Prints:
    #   description
    #
    #   <help message>
    #
    #   epilog
    #
    parser = argparse.ArgumentParser(description='DC801 badge helper script', epilog=config, formatter_class=RawTextHelpFormatter)
    # store_true, binary flag without argument
    parser.add_argument('-H', '--hex',      action='store_true', help='Generates a hex file from application elf')
    parser.add_argument('-b', '--boot-hex', action='store_true', help='Generates a hex file from bootloader elf')
    parser.add_argument('-m', '--merge',    action='store_true', help='Merges NRF softdevice, application, and bootloader hex files')
    parser.add_argument('-f', '--flash',    action='store_true', help='Flashes merged hex file using nrfjprog')
    parser.add_argument('-u', '--uf2',      action='store_true', help='Generates a uf2 image from application hex')
    parser.add_argument('-a', '--all',      action='store_true', help='Generates app/boot hex files, and merges them')
    parser.add_argument('-d', '--debug',    action='store_true', help='Runs JLinkExe, JLinkDBGServer, and gdb to allow remote debugging')

    # Print help for no flags
    if len(sys.argv)==1:
        parser.print_help(sys.stderr)
        sys.exit(1)

    args = parser.parse_args()

    # Enable flags for all
    if args.all:
        args.hex = True
        args.boot_hex = True
        args.merge = True

    if args.hex:
        print('Generating application hex file...')
        hex(APP)
    if args.boot_hex:
        print('Generating bootloader hex file...')
        hex(BOOTLOADER)
    if args.merge:
        print('Merging hex files...')
        merge(f'{APP}.hex', f'{BOOTLOADER}.hex', MERGED)
    if args.flash:
        print('Flashing merged hex file...')
        flash(MERGED)
    if args.uf2:
        print('Generating uf2 image...')
        uf2(f'{APP}.hex', UF2)
    if args.debug:
        debug()

if __name__ == '__main__':
    main()
