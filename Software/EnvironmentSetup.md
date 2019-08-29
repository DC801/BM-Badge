
# Setting up the DC801 Dev Environment

Want to get started developing for the DC801 badge?  Read through these instructions and we'll have you up and running in no time!

## Assumptions

This guide is written assuming you will be using Ubuntu 16.04.2.  I'll probably work with other versions of Linux, and possibly Windows, but you'll have to figure out the differences.  

Any line starting with $ is a command you should type into a terminal

I've tried to note anything non-standard in this guide and to make it as easy as possible.

## Software required

- Nordic SDK version 13
- Nordic nrfjprog
- J-Link segger tools
- Eclipse

## Hardware required

- J-Link Segger - $70 edu version works fine:  [Segger](https://www.segger.com/j-link-edu.html), [Adafruit](https://www.adafruit.com/product/1369)
- Adapter for badge JTAG - ~$8 [Adafruit - cable](https://www.adafruit.com/product/1675) and [adapter](https://www.adafruit.com/product/2094)
- A badge!

In the near future we'll support upload of new images via serial UART, which means that unless you want to change out the bootloader you won't need a JTAG programmer.  JTAG is useful for debugging, however, and future badges will continue to make use of it, so we recommend that you pick one up.  The serial UART will require a serial port on your PC or a USB to serial adapter, and to solder onto a couple of pins on your badge.

# Installation

We're going to be using Eclipse and GCC to do our development.  There are other options out there, like Keil, but sticking with an open source stack means no pesky license fees and more flexibility.  Most of this install comes from [the Nordic Tutorial](https://devzone.nordicsemi.com/tutorials/7/)

## Setup a dev directory structure

 Your structure can be whatever you want it to be, but this is how I do it, and you'll have less config steps to go through once you get the code if you copy me.

 ```
 $ mkdir -p ~/dev/installer
 $ mkdir -p ~/dev/bin
 $ mkdir -p ~/dev/nordic-sdk13
 ```

## Configure your environment to add the new bin directory to your PATH

 Easiest way of doing this, assuming you are using bash, is:
 
 ```
 $ echo "PATH=\$PATH\$( find \$HOME/dev/bin -type d -printf \":%p\" )" >> ~/.bashrc 
 ```

 You'll need to start a new terminal for this to take effect - log out and back in, or just launch a new terminal and close the old one.  It will automatically add any subdir to the path, which will be useful, below.

## ARM toolchain for GCC

 Luckily for us, there is a nice Ubuntu ppa that covers this.  It's pretty simple to get installed ([taken from launchpad](https://launchpad.net/~team-gcc-arm-embedded/+archive/ubuntu/ppa)):

 ```
 $ sudo add-apt-repository ppa:team-gcc-arm-embedded/ppa
 $ sudo apt-get update
 $ sudo apt-get install gcc-arm-embedded
 ```
 
 Step 3 is a 70mB download from a slow server, so go get yourself a beer - you deserve it!

 Make sure it works

 ```
 $ arm-none-eabi-gcc --version 
 arm-none-eabi-gcc (GNU Tools for ARM Embedded Processors 6-2017-q2-update) 6.3.1 20170215 (release) [ARM/embedded-6-branch revision 245512]
 ```

## Build tools

 We need the build tools like make installed, so run:
	
 ```
 $ sudo apt-get install build-essential checkinstall
 ```

 After it completes, make should be installed on your system:

 ```
 $ make
 make: *** No targets specified and no makefile found.  Stop.
 ```

 You're rocking this install!

## Get the Nordic SDK 13 

 [Download from Nordic](http://developer.nordicsemi.com/nRF5_SDK/nRF5_SDK_v13.x.x/)

 Grab the zip file of your chosing - for this we're going with nRF5\_SDK\_13.0.0\_04a0bfd.zip but that might change by the time you get there.

 Save it to ~/dev/installer for safe keeping.
 
 Unzip it with:

 ```
 $ cp ~/Downloads/nRF5_SDK_13*.zip ~/dev/installer/
 $ cd ~/dev/nordic-sdk13
 $ unzip ../installer/nRF5_SDK_13*.zip
 ```
 Now you need to configure the SDK for the GCC compiler

 Edit the file ~/dev/nordic-sdk13/components/toolchain/gcc/Makefike.posix

 It should read:

 ```
 GNU_INSTALL_ROOT := /usr
 GNU_VERSION := 6.3.1
 GNU_PREFIX := arm-none-eabi
 ```

 _Note_: You'll find \^M at the end of the lines in the SDK.  This is due to DOS line endings being used.  UNIX does not use these, so you get control chars instead.  It's safe to delete these.  Beware that the \^M is actually a single char escape - if you paste in the two chars ^ and M you'll end up with a hard to track down error.  I recommend removing the \^M from any line you edit just to be on the safe side!

 Now we are going to test your install.  Do this before moving onto the next step, it'll make like easier.

 ```
 $ cd ~/dev/nordic-sdk13/examples/peripheral/blinky/pca10040/blank/armgcc/
 $ make
 mkdir _build
 Compiling file: nrf_log_backend_serial.c
 Compiling file: nrf_log_frontend.c
 Compiling file: boards.c
 Compiling file: app_error.c
 Compiling file: app_error_weak.c
 Compiling file: app_scheduler.c
 Compiling file: app_timer.c
 Compiling file: app_util_platform.c
 Compiling file: hardfault_implementation.c
 Compiling file: nrf_assert.c
 Compiling file: nrf_strerror.c
 Compiling file: nrf_drv_clock.c
 Compiling file: nrf_drv_common.c
 Compiling file: nrf_drv_uart.c
 Compiling file: nrf_nvic.c
 Compiling file: nrf_soc.c
 Compiling file: main.c
 Compiling file: RTT_Syscalls_GCC.c
 Compiling file: SEGGER_RTT.c
 Compiling file: SEGGER_RTT_printf.c
 Assembling file: gcc_startup_nrf52.S
 Compiling file: system_nrf52.c
 Linking target: _build/nrf52832_xxaa.out

    text	   data	    bss	    dec	    hex	filename
    4728	    112	    372	   5212	   145c	_build/nrf52832_xxaa.out

 Preparing: _build/nrf52832_xxaa.hex
 Preparing: _build/nrf52832_xxaa.bin
 ```
	
 If you see that, your toolchain is working, and you can generate binaries with the SDK.  Great job!

## Install J-Link

 Head to [J-Link](https://www.segger.com/downloads/jlink) and click on the 'Click for downloads' link for 'J-Link Software and Documentation Pack'.  Download the DEB installer for 64 bit Linux.  Move it to your installer directory and install it.

 ```
 $ mv ~/Downloads/JLink*.deb ~/dev/installer
 # sudo dpkg -i ~/dev/installer/JLink*.deb
 ```

## Install nrfjprog

 You'll be using this to flash and interact with your badge.  It's a little more tricky.
 Goto [Nordic](http://www.nordicsemi.com/eng/Products/Bluetooth-low-energy/nRF52832) and click on the Downloads tab.  Scroll down and find 'nRF5x-Command-Line-Tools-Linux64' and click on it to download the tarball.  Save it to the installer directory.  Now let's set it up in bin:

 ```
 $ cp ~/Downloads/nRF5x-Command-Line-Tools_*_Linux-x86_64.tar ~/dev/installer/
 $ cd ~/dev/bin
 $ tar xvf ~/dev/installer/nRF5x-Command-Line-Tools_*_Linux-x86_64.tar
 ```

 Now, log out and back in or start a new terminal.  Let's test it:

 ```
 $ nrfjprog --version
 nrfjprog version: 9.4.0
 JLinkARM.dll version: 6.14h
 ```

 If you see that, you're good.  You have everything you need to program your badge now, how about that?

## Install Eclipse

 You could just about stop here and do everything at the command line if you want.  Eclipse just uses the Makefile wrapper anyway, but it helps for editing your code.  Your call and all that.

 You'll need a Java Runtime Enviroment, ie, JRE installed first:

 ```
 $ sudo apt-get install default-jre
 ```

 Download the [Eclipse Installer](https://www.eclipse.org/downloads/)

 ```
 $ cd ~/dev/installer
 $ cp ~/Downloads/eclipse-inst*.tar.gz .
 $ tar -xzvf eclipse-inst*.tar.gz
 $ ./eclipse-installer/eclipse-inst
 ```

 You want to install the Eclipse IDE for C/C++ Developers

 Install it to ~/dev/bin/eclipse/cpp-neon

 Once it has been installed, launch it.  The workspace doesn't matter, it can be anywhere you want it.

 Now we need to install the GNU ARM plugins.

 Head to [GNU ARM Eclipse Plugin](http://gnuarmeclipse.github.io/plugins/install/) and follow the instructions, which is basically, 'drag and drop this thing into eclipse'.  It will take a bit.  Hope you're not doing this at defcon.

 For better debugging, you might want to install the device family packs.  It'll download a bunch of stuff, so be prepared for that.  From the Nordic tutorial:

 - Select the Window item from the menu bar, and enter perspective -> open perspective -> other -> Packs.
 - Click the refresh button in the top right corner of the window that got opened. This will fetch all packs from the repositories.
 - Select Nordic Semiconductor in the list of vendors, and install the latest version of Device family pack.

## Get the source

 Get the badge source code from git and save it out to disk somewhere.  I recommend putting it in ~/dev/dc801

## Import into Eclipse

 From within Eclipse, right click in the Project Explorer on the left side of the screen.  Select Import, open the 'General' folder and select 'Existing projects int Workspace'.  Browse to the folder where you saved the badge source code.  It should now find the project.  Go ahead and finish, and the project should now be sitting in Eclipse.  

 At this point, you should be able to build, clean, flash, and even debug with the Segger.  Hurray!

 If you want to program the softdevice via Eclipse or the makefile, go download the s132 softdevice and unzip it into the softdevice folder.  Set the filename at the top of the Makefile to reflect the version, then the make flash_softdevice target will work for you.

# Programming

Click here for [Program Structure Info](Structure.md)