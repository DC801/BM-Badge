
# Setting up the DC801 Dev Environment

Want to get started developing for the DC801 badge?  Read through these instructions and we'll have you up and running in no time!

## Assumptions

This guide is written assuming you will be using Ubuntu 20.04.1.  I'll probably work with other versions of Linux, and possibly Windows, but you'll have to figure out the differences.  

Any line starting with $ is a command you should type into a terminal

I've tried to note anything non-standard in this guide and to make it as easy as possible.

## Software required

- Nordic SDK version 15.3.0
- Nordic nrfjprog
- J-Link segger tools
- VSCode

## Hardware required

- J-Link Segger - $70 edu version works fine:  [Segger](https://www.segger.com/j-link-edu.html), [Adafruit](https://www.adafruit.com/product/1369)
- Adapter for badge JTAG - ~$8 [Adafruit - cable](https://www.adafruit.com/product/1675) and [adapter](https://www.adafruit.com/product/2094)
- A badge!

If you have the bootloader pre-installed, we also support upload of new images via USB, which means that unless you want to change out the badge code you won't need a JTAG programmer.  JTAG is useful for debugging, however, and future badges will continue to make use of it, so we recommend that you pick one up. 
# Installation

We're going to be using VSCode and GCC to do our development.  There are other options out there, like Keil or CLion, but sticking with an open source stack means no pesky license fees and more flexibility. In years past, we have used an Eclipse stack from [the Nordic Tutorial](https://devzone.nordicsemi.com/tutorials/7/), which still might work.

## Setup a dev directory structure

Your structure is important for make, so try not to deviate from it. You can make it work with a different structure, but I suggest following ours.

 ```
 $ mkdir -p ~/dev/
 $ mkdir -p ~/dev/installer
 ```
 
 ## Install dependancies

If you're using a distro other than ubuntu, you'll need to figure out how to install the equivalent dependencies. 

 ```
 $ sudo apt update
 $ sudo apt upgrade -y
 $ sudo apt install -y build-essential make git libsdl2-2.0-0 libsdl2-image-2.0-0 libsdl2-dev libsdl2-image-dev libncurses5 libncurses-dev
 ```
 
 Verify these were installed:
 
  ```
 $ git --version
git version 2.25.1
 $ make --version
GNU Make 4.2.1
 ```

## ARM toolchain for GCC

Unfortunately ARM is no longer supporting the PPA we used to use, so we get to install this manually.
If the link in the wget below doesn't work, you can grab the latest from [ARM's website](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm/downloads)

 ```
 $ cd ~/dev/
 $ wget https://armkeil.blob.core.windows.net/developer/Files/downloads/gnu-rm/9-2020q2/gcc-arm-none-eabi-9-2020-q2-update-x86_64-linux.tar.bz2
 $ tar -xvf gcc-arm-none-eabi-9-2020-q2-update-x86_64-linux.tar.bz2
 $ sudo mv gcc-arm-none-eabi-9-2020-q2-update /usr/share/
 $ sudo ln -s /usr/share/gcc-arm-none-eabi-9-2020-q2-update/bin/arm-none-eabi-gcc /usr/bin/arm-none-eabi-gcc 
 $ sudo ln -s /usr/share/gcc-arm-none-eabi-9-2020-q2-update/bin/arm-none-eabi-g++ /usr/bin/arm-none-eabi-g++
 $ sudo ln -s /usr/share/gcc-arm-none-eabi-9-2020-q2-update/bin/arm-none-eabi-gdb /usr/bin/arm-none-eabi-gdb
 $ sudo ln -s /usr/share/gcc-arm-none-eabi-9-2020-q2-update/bin/arm-none-eabi-size /usr/bin/arm-none-eabi-size
 $ sudo ln -s /usr/share/gcc-arm-none-eabi-9-2020-q2-update/bin/arm-none-eabi-ar /usr/bin/arm-none-eabi-ar
 $ sudo ln -s /usr/share/gcc-arm-none-eabi-9-2020-q2-update/bin/arm-none-eabi-objcopy /usr/bin/arm-none-eabi-objcopy
 $ sudo ln -s /usr/share/gcc-arm-none-eabi-9-2020-q2-update/bin/arm-none-eabi-objdump /usr/bin/arm-none-eabi-objdump
 $ sudo ln -s /usr/share/gcc-arm-none-eabi-9-2020-q2-update/bin/arm-none-eabi-nm /usr/bin/arm-none-eabi-nm
 $ sudo ln -s /usr/share/gcc-arm-none-eabi-9-2020-q2-update/bin/arm-none-eabi-strip /usr/bin/arm-none-eabi-strip
 ```

 Make sure it works:

 ```
 $ arm-none-eabi-gcc --version 
 arm-none-eabi-gcc (GNU Arm Embedded Toolchain 9-2020-q2-update) 9.3.1 20200408 (release)
 $ arm-none-eabi-gdb --version
GNU gdb (GNU Arm Embedded Toolchain 9-2020-q2-update) 8.3.1.20191211-git
 ```

If you see the above, you've got it right.

## Get the Nordic SDK 15

 [Download from Nordic](http://developer.nordicsemi.com/nRF5_SDK/nRF5_SDK_v15.x.x/)

 Grab the zip file of your chosing - for this we're going with `nRF5_SDK_15.3.0_59ac345.zip` but that might change by the time you get there.

 ```
 $ cd ~/dev/installer/
 $ wget http://developer.nordicsemi.com/nRF5_SDK/nRF5_SDK_v15.x.x/nRF5_SDK_15.3.0_59ac345.zip
 $ unzip nRF5_SDK_15.3.0_59ac345.zip
 $ mv nRF5_SDK_*/ ../nordic-sdk15.3.0/
 ```
 Now you need to configure the SDK for the GCC compiler

 Edit the file `~/dev/nordic-sdk15.3.0/components/toolchain/gcc/Makefike.posix`

 It should read:

 ```
 GNU_INSTALL_ROOT ?= /usr/bin
 GNU_VERSION ?= 9.3.1
 GNU_PREFIX ?= arm-none-eabi
 ```

 _Note_: You might find `\^M` at the end of the lines in the SDK.  This is due to DOS line endings being used.  UNIX does not use these, so you get control chars instead.  It's safe to delete these.  Beware that the `\^M` is actually a single char escape - if you paste in the two chars ^ and M you'll end up with a hard to track down error.  I recommend removing the `\^M` from any line you edit just to be on the safe side!

 Now we are going to test your install.  Do this before moving onto the next step, it'll make like easier.

 ```
 $ cd ~/dev/nordic-sdk15.3.0/examples/peripheral/blinky/pca10040/blank/armgcc
 $ make
 mkdir _build
cd _build && mkdir nrf52832_xxaa
Assembling file: gcc_startup_nrf52.S
Compiling file: nrf_log_frontend.c
Compiling file: nrf_log_str_formatter.c
Compiling file: boards.c
Compiling file: app_error.c
Compiling file: app_error_handler_gcc.c
Compiling file: app_error_weak.c
Compiling file: app_util_platform.c
Compiling file: nrf_assert.c
Compiling file: nrf_atomic.c
Compiling file: nrf_balloc.c
Compiling file: nrf_fprintf.c
Compiling file: nrf_fprintf_format.c
Compiling file: nrf_memobj.c
Compiling file: nrf_ringbuf.c
Compiling file: nrf_strerror.c
Compiling file: nrfx_atomic.c
Compiling file: main.c
Compiling file: system_nrf52.c
Linking target: _build/nrf52832_xxaa.out
   text	   data	    bss	    dec	    hex	filename
   2072	    108	     28	   2208	    8a0	_build/nrf52832_xxaa.out
Preparing: _build/nrf52832_xxaa.hex
Preparing: _build/nrf52832_xxaa.bin
DONE nrf52832_xxaa
 ```
	
 If you see that, your toolchain is working, and you can generate binaries with the SDK.  Great job!

## Install NRF Command Line Tools

If the link in the wget below doesn't work, head to [J-Link](https://www.nordicsemi.com/Software-and-tools/Development-Tools/nRF-Command-Line-Tools/Download#infotabs) and download the latest nRF Command Line Tools for Linux. To do that, click the Downloads tab, switch the platform to Linux64, and download the tar.gz file provided. The one that's currently available is named `nRF-Command-Line-Tools_10_10_0_Linux-amd64.tar.gz`. Move it to your installer directory.

 ```
 $ cd ~/dev/installer
 $ wget https://www.nordicsemi.com/-/media/Software-and-other-downloads/Desktop-software/nRF-command-line-tools/sw/Versions-10-x-x/10-10-0-v2/nRFCommandLineTools10100Linuxamd64tar.gz
 $ mv nRFCommandLineTools10100Linuxamd64tar.gz nRFCommandLineTools10100Linuxamd64.tar.gz
 $ tar -xvf nRFCommandLineTools10100Linuxamd64.tar.gz
 $ sudo dpkg -i JLink_Linux_V684a_x86_64.deb
 $ sudo dpkg -i nRF-Command-Line-Tools_10_10_0_Linux-amd64.deb
 ```
 
 Let's verify that it installed correctly:
 
 ```
 $ JLinkExe version
SEGGER J-Link Commander V6.84a (Compiled Sep  7 2020 18:28:09)
DLL version V6.84a, compiled Sep  7 2020 18:27:57

Unknown command line option version.
$ nrfjprog --version
nrfjprog version: 10.10.0 
JLinkARM.dll version: 6.84a
```

  If you see that, you're good.  You have everything you need to program your badge now, how about that?
 
## Get the badge source

 Get the badge source code from git and save it out to ~/dev/DC28PartyBadge.
 
 ```
 $ cd ~/dev/
 $ git clone https://github.com/AdmiralPotato/DC28PartyBadge/
 ```
 
## Install VSCode

 You could just about stop here and do everything at the command line if you want. VSCode just uses the Makefile wrapper anyway, but it helps for editing your code.  Your call and all that.

 ```
 $ sudo snap install --classic code
 ```
 
 Now let's install `compiledb`. Thiscreates compile_commands.json which interfaces with VSCode's Intellisence system. This allows you to have tab completion, include path stuff, etc.
 
 ```
 $ sudo apt install python3-pip
 $ sudo pip3 install compiledb
 ```
 
 With that done, go ahead and open VSCode.

 You want to install the following plugins: `Cortex-Debug` by [marus25](https://github.com/Marus/cortex-debug.git), `C/C++` by [Microsoft](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools). You do that by pressing Ctrl+P then enter the following one at a time:
 
 ```
ext install marus25.cortex-debug
ext install ms-vscode.cpptools
 ```

 Now let's open our badge code in VSCode.  `File` -> `Open Folder` -> `Navigate to ~/dev` -> `Highlight DC28PartyBadge` -> `Ok`

 At this point, you should be able to build, clean, flash, and even debug with the Segger.  Hurray!

# Test Build & Flash
### Desktop Build

 Here are the steps to compile the badge code:
 
- From within VSCode, make sure that the badge code folder is open (if you've followed the steps above, it should be).
- Open a terminal (`Terminal` -> `New Terminal`)
- From within the terminal that appears, run the following (replace `8` with the number of cores your machine has):
   ```
	 $ cd Software/
	 $ compiledb make cleanall
	 $ compiledb make -j8 DESKTOP=1 TEST_ALL=1
	 ```

You should now have everything compiled in the `~/dev/DC28PartyBadge/Software/output` folder. Since we compiled the desktop build above, let's test running it.
From within the VSCode Terminal:

```
$ cd ~/dev/DC28PartyBadge/Software/output
$ ./dc28_badge.out
```

You should now have the badge running on your screen!

To debug you need to open the Run/debug menu on the left (`Ctrl+Shift+D`). It looks like it has a triangle and a bug symbol. At the top, make sure that the dropdown says "Debug Desktop", and either click the green arrow or hit F5. You're debugging now!

### Badge Build
  
Here are the steps to compile the badge code for the physical Badge:
 
- From within VSCode, make sure that the badge code folder is open (if you've followed the steps above, it should be).
- Open a terminal (`Terminal` -> `New Terminal`)
- From within the terminal that appears, run the following (replace `8` with the number of cores your machine has):
   ```
	 $ cd Software/
	 $ compiledb make cleanall
	 $ compiledb make -j8 TEST_ALL=1
	 ```

You should now have everything compiled in the `~/dev/DC28PartyBadge/Software/output` folder.

Let's flash it. Make sure you connect your badge to the J-Link Programmer and power on your badge. 

From within the VSCode terminal:

```
$ make flash-merged
```

This flashed the badge code & the soft device to your badge. Now that you have the soft device, from now on only run `make flash`, unless you want to change or update your soft device.

You should now have the badge running on your screen!

To debug you need to open the Run/debug menu on the left (`Ctrl+Shift+D`). It looks like it has a triangle and a bug symbol. At the top, make sure that the dropdown says "Debug (Linux)". Now let's connect the JLink to your Badge. In a new terminal run these commands:

```
$ JLinkExe 
SEGGER J-Link Commander V6.84a (Compiled Sep  7 2020 18:28:09)
DLL version V6.84a, compiled Sep  7 2020 18:27:57

Connecting to J-Link via USB...O.K.
Firmware: J-Link EDU Mini V1 compiled Jul 17 2020 16:25:21
Hardware version: V1.00
S/N: 
License(s): GDB, FlashBP
VTref=1.043V


Type "connect" to establish a target connection, '?' for help
J-Link>connect
Please specify device / core. <Default>: NRF52840_XXAA
Type '?' for selection dialog
Device>nrf52
Please specify target interface:
  J) JTAG (Default)
  S) SWD
  T) cJTAG
TIF>s
Specify target interface speed [kHz]. <Default>: 4000 kHz
Speed>
Device "NRF52" selected.


Connecting to target via SWD
InitTarget() start
InitTarget() end
Found SW-DP with ID 0x2BA01477
DPIDR: 0x2BA01477
Scanning AP map to find all available APs
AP[2]: Stopped AP scan as end of AP map has been reached
AP[0]: AHB-AP (IDR: 0x24770011)
AP[1]: JTAG-AP (IDR: 0x02880000)
Iterating through AP map to find AHB-AP to use
AP[0]: Core found
AP[0]: AHB-AP ROM base: 0xE00FF000
CPUID register: 0x410FC241. Implementer code: 0x41 (ARM)
Found Cortex-M4 r0p1, Little endian.
FPUnit: 6 code (BP) slots and 2 literal slots
CoreSight components:
ROMTbl[0] @ E00FF000
ROMTbl[0][0]: E000E000, CID: B105E00D, PID: 000BB00C SCS-M7
ROMTbl[0][1]: E0001000, CID: B105E00D, PID: 003BB002 DWT
ROMTbl[0][2]: E0002000, CID: B105E00D, PID: 002BB003 FPB
ROMTbl[0][3]: E0000000, CID: B105E00D, PID: 003BB001 ITM
ROMTbl[0][4]: E0040000, CID: B105900D, PID: 000BB9A1 TPIU
ROMTbl[0][5]: E0041000, CID: B105900D, PID: 000BB925 ETM
Cortex-M4 identified.
J-Link>
```

Now go back to VSCode and do `Run` -> `Start Debugging` or hit `F5`. You're debugging on hardware now!

# Optional - Install Tiled
Tiled is being used to edit the game map & character files. If you want to edit these, you'll need to install tiled. (The `wget` isn't grabbing the latest. If you want, download it manually to get the newest version of tiled)
```
$ cd ~/dev/installer
$ wget https://github.com/bjorn/tiled/releases/download/v1.4.2/Tiled-1.4.2-x86_64.AppImage
$ chmod +x Tiled-*-x86_64.AppImage
$ sudo mkdir -p /usr/share/tiled/
$ sudo mv Tiled-*-x86_64.AppImage /usr/share/tiled/
$ sudo ln -s /usr/share/tiled/Tiled-*-x86_64.AppImage /usr/bin/tiled
```

You can now run `tiled` in the command line to start Tiled.
