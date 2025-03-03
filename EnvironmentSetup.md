# Setting up the DC801 Badge Dev Environment

Want to get started developing for the DC801 badge? Read through these instructions and we'll have you up and running in no time!

## Assumptions

You don't have any hardware to develop this on, because it's not done yet.

This guide is written assuming you will be using Ubuntu 20.04 or greater. It will probably work with other versions of Linux, and possibly Windows, but you'll have to figure out those differences yourself.

----

## Desktop Build
Since __**THE HARDWARE ISN'T READY YET**__, you early adopters will have to try out our game on your computer that runs about a thousand times faster than our real badge hardware - so if it seems like it runs a little faster than it should, uhh... get used to it.

### Install most of our software dependencies via package manager

- GIT (https://git-scm.com/)
    - version control
- SDL (https://www.libsdl.org/)
    - desktop build window and framebuffer management, input handling
- pip, Python Package Manager
(https://pypi.org/project/pip/)
    - required for compiledb to create compile-commands.json
- GDB, the Gnu Debugger (https://www.gnu.org/software/gdb/)
    - because writing software without a debugger is for idiots and savants that hate themselves
- The Python package `compiledb` Compilation Database Generator (https://github.com/nickdiego/compiledb)
    - this generates the `Software/GameEngine/compile-commands.json` file that allows VSCode's Intellisence system to understand the relationships between all the `.c` and `.h` files, and gives tab completion, include path stuff, etc.

```shell script
sudo apt install -y \
  build-essential \
  make \
  git \
  git-gui \
  gitk \
  wget \
  libsdl2-2.0-0 \
  libsdl2-image-2.0-0 \
  libsdl2-dev \
  libsdl2-image-dev \
  gdb \
  libncurses5 \
  libncurses-dev \
  python3-pip

pip3 install compiledb
# pip installs packages into `~/.local/bin`, but doesn't bother
# adding that do your path so you can, you know, use them.
# These echo lines add the user local pip install path to the
# PATH variable so you can run `compiledb`.
echo 'PATH="$HOME/.local/bin:$PATH"' >> ~/.profile
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bash_profile
# At this point, you may need to close your terminal, relaunch
# your IDE, or even sign out and back in before you'll be able
# to run the `compiledb` command in the context you need it.
```

### Setup a dev directory structure

The structure of the project files is important for `make`, so try not to deviate from it. You can make it work with a different structure, but I suggest following ours.

```shell script
mkdir -p ~/dev/
mkdir -p ~/dev/installer
```

### Git Clone the badge source code

```shell script
cd ~/dev/
git clone https://github.com/DC801/BM-Badge/
```

This clones the badge source code from git and saves it out to `~/dev/BM-Badge`.

### Install VSCode, if you don't already have it
We're going to be using VSCode and GCC to do our development. There are other options out there like VIM or nice tools like CLion, but sticking with an open source stack means no pesky license fees and more flexibility.

```shell script
sudo snap install --classic code
```

...but if you hate Snap for some reason, you can download VSCode from here: https://code.visualstudio.com/

### Compiling and running the Desktop Build:

- From within VSCode, select (`File` -> `Open Folder...`) and select the `~/dev/BM-Badge` folder.
- Open a terminal (`Terminal` -> `New Terminal`) or use `Ctrl+backtick`
- From within the terminal that appears, run the following (replace `8` with the number of cores your machine has, or the number of cores you have allocated to your VM):
```shell script
cd Software/GameEngine/
make cleanall
compiledb make DESKTOP=1 -j8
```

You should now have everything compiled in the `~/dev/BM-Badge/Software/GameEngine/output` folder. Since we compiled the desktop build above, let's test running it.

From within the VSCode Terminal:
```shell script
cd ~/dev/BM-Badge/Software/GameEngine/output
./bm_badge.out
```

You should now have the badge running on your desktop computer screen!

To debug you need to open the Run/debug menu on the left (`Ctrl+Shift+D`). It looks like it has a triangle and a bug symbol. At the top, make sure that the dropdown says "Debug (Desktop)", and either click the green arrow or hit F5. You're debugging the Desktop build now!

### Desktop Build controls

| Function           | Location on board    | Key   | Alternate Key      | Alternate 2 |
|-------------------:|:---------------------|:--------:|:------------------:|:-----------:|
| `Move Up`          | `Left Stick Up`      | `W`      | `Arrow Up`         |             |
| `Move Down`        | `Left Stick Down`    | `S`      | `Arrow Down`       |             |
| `Move Left`        | `Left Stick Left`    | `A`      | `Arrow Left`       |             |
| `Move Right`       | `Left Stick Right`   | `D`      | `Arrow Right`      |             |
| `None`             | `Left Stick Center`  | `Q`      |                    | `Numpad 7`  |
| `Hack Entity / +`  | `Right Stick Up`     | `I`      | `Back(tick/slash)` | `Numpad 8`  |
| `Run / -`          | `Right Stick Down`   | `K`      | `Left Shift`       | `Numpad 5`  |
| `Action / Paste`   | `Right Stick Left`   | `J`      |                    | `Numpad 4`  |
| `Interact / Copy`  | `Right Stick Right`  | `L`      | `E/Enter/Return`   | `Numpad 6`  |
| `None`             | `Right Stick Center` | `O`      |                    | `Numpad 9`  |
| `Toggle HexEditor` | `PCB Capacitive Hat` | `Tab`    | `Escape`           |             |
| `Hex XOR`          | `Scren Left, XOR`    | `F1`     | `Z`                | `Numpad 1`  |
| `Hex ADD`          | `Scren Left, ADD`    | `F2`     | `X`                | `Numpad 2`  |
| `Hex SUB`          | `Scren Left, SUB`    | `F3`     | `C`                | `Numpad 3`  |
| `Hex PAGE`         | `Scren Left, PAGE`   | `F4`     | `V`                | `Numpad 0`  |
| `Hex MEM0`         | `Screen Right, MEM0` | `F5`     | `B`                |             |
| `Hex MEM1`         | `Screen Right, MEM1` | `F6`     | `N`                |             |
| `Hex MEM2`         | `Screen Right, MEM2` | `F7`     | `M`                |             |
| `Hex MEM3`         | `Screen Right, MEM3` | `F8`     | `,`                |             |
| `Quit game`        | `Power switch`       | `Alt-F4` |                    |             |
| `Reload game.dat`  | `N/A`                | `CTRL-R` |                    |             |
| `Window Size -`    | `N/A`                | `-`      |                    |             |
| `Window Size +`    | `N/A`                | `+`      |                    |             |

Hex Bit keys:

| Bit | 128 | 64  | 32  | 16  | 8   | 4   | 2   | 1   |
|-----|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Key | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   |

### Optional - Install Tiled

Tiled (https://www.mapeditor.org/) is being used to edit the game map & character files. If you want to edit these, you'll need to install tiled. (The `wget` isn't grabbing the latest. If you want, download it manually to get the newest version of tiled, but you must use v 1.4.2 or later)

```shell script
cd ~/dev/installer
wget https://github.com/mapeditor/tiled/releases/download/v1.7.0/Tiled-1.7.0-x86_64.AppImage
chmod +x Tiled-*-x86_64.AppImage
sudo mkdir -p /usr/share/tiled/
sudo mv Tiled-*-x86_64.AppImage /usr/share/tiled/
sudo ln -s /usr/share/tiled/Tiled-*-x86_64.AppImage /usr/bin/tiled
```

You can now run `tiled` in the command line to start Tiled.

### Optional - Install Node.js for an automated CLI build for the game.dat
While it is possible to build the `game.dat` file using only a browser, if you find that you are regenerating this file frequently, it may be very productive to use the CLI build for the `game.dat` file.

```sh
sudo apt install curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

With Node installed, you can `cd SD_Card/MAGE` and execute `./regenerate_dat_file.sh` to regenerate the game.dat file for a very seamless editing workflow.

----

# If you don't have the hardware yet, IGNORE EVERYTHING BELOW THIS LINE

----

## Hardware Build

### Additional Software required for the Hardware Build

- Nordic SDK version 15.3.0
- Nordic nrfjprog
- J-Link segger tools

### Hardware required

- J-Link Segger - $20 edu version works fine:  [Segger](https://www.segger.com/j-link-edu.html), [Adafruit](https://www.adafruit.com/product/3571)
- Header - $1.40: [Mouser](https://www.mouser.com/ProductDetail/Wurth-Elektronik/62201021121/?qs=PhR8RmCirEZWrjKrFMt0Bg%3D%3D)
- A badge!

If you have the bootloader pre-installed, we also support upload of new images via USB, which means that unless you want to change out the badge code you won't need a JTAG programmer. JTAG is useful for debugging, however, and future badges will continue to make use of it, so we recommend that you pick one up.

### Install ARM toolchain for GCC

Unfortunately ARM is no longer supporting the PPA we used to use, so we get to install this manually.
If the link in the wget below doesn't work, you can grab the latest from [ARM's website](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm/downloads)

If you're using a distro other than ubuntu, you'll need to figure out how to install the equivalent paths below.

```shell script
wget https://armkeil.blob.core.windows.net/developer/Files/downloads/gnu-rm/10-2020q4/gcc-arm-none-eabi-10-2020-q4-major-x86_64-linux.tar.bz2
export EABI_VERSION=10-2020-q4-major
sudo tar xjf gcc-arm-none-eabi-$EABI_VERSION-x86_64-linux.tar.bz2 -C /usr/share/
sudo ln -s /usr/share/gcc-arm-none-eabi-$EABI_VERSION/bin/arm-none-eabi-* /usr/bin
```

Make sure it works:

```shell script
arm-none-eabi-gcc --version
```
You should see:
```shell script
arm-none-eabi-gcc (GNU Arm Embedded Toolchain 10-2020-q4-major) 10.2.1 20201103 (release)
```

If you see the above, you've got it right.

### Get the Nordic SDK 15

[Download from Nordic](http://developer.nordicsemi.com/nRF5_SDK/nRF5_SDK_v15.x.x/)

Grab the zip file of your choosing - for this we're going with `nRF5_SDK_15.3.0_59ac345.zip` but that might change by the time you get there.

```shell script
cd ~/dev/installer/
wget http://developer.nordicsemi.com/nRF5_SDK/nRF5_SDK_v15.x.x/nRF5_SDK_15.3.0_59ac345.zip
unzip nRF5_SDK_15.3.0_59ac345.zip
mv nRF5_SDK_*/ ../nordic-sdk15.3.0/
```

Now you need to configure the SDK for the GCC compiler

Edit the file `~/dev/nordic-sdk15.3.0/components/toolchain/gcc/Makefike.posix`

It should read:
```shell script
GNU_INSTALL_ROOT ?= /usr/bin/
GNU_VERSION ?= <arm gcc version from above>
GNU_PREFIX ?= arm-none-eabi
```

_Note_: You might find `\^M` at the end of the lines in the SDK. This is due to DOS line endings being used. UNIX does not use these, so you get control chars instead. It's safe to delete these. Beware that the `\^M` is actually a single char escape - if you paste in the two chars ^ and M you'll end up with a hard to track down error. I recommend removing the `\^M` from any line you edit just to be on the safe side!

Now we are going to test your install. Do this before moving onto the next step, it'll make like easier.

```shell script
cd ~/dev/nordic-sdk15.3.0/examples/peripheral/blinky/pca10040/blank/armgcc
make
```

You should see this output:
```shell script
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

If you see that, your toolchain is working, and you can generate binaries with the SDK. Great job!

### Install NRF Command Line Tools

If the link in the wget below doesn't work, head to [J-Link](https://www.nordicsemi.com/Software-and-tools/Development-Tools/nRF-Command-Line-Tools/Download#infotabs) and download the latest nRF Command Line Tools for Linux. To do that, click the Downloads tab, switch the platform to Linux64, and download the tar.gz file provided. The one that's currently available is named `nRF-Command-Line-Tools_10_12_1_Linux-amd64.tar.gz`. Move it to your installer directory.

```shell script
cd ~/dev/installer
wget https://www.nordicsemi.com/-/media/Software-and-other-downloads/Desktop-software/nRF-command-line-tools/sw/Versions-10-x-x/10-12-2/nRF-Command-Line-Tools_10_12_2_Linux-amd64.zip
unzip nRF-Command-Line-Tools_10_12_2_Linux-amd64.zip
cd nRF-Command-Line-Tools_10_12_2_Linux-amd64
tar -xvf nRF-Command-Line-Tools_10_12_2_Linux-amd64.tar.gz
sudo dpkg -i *.deb
```

Let's verify that it installed correctly:

```shell script
JLinkExe version
```

You should see, depending on version:
```shell script
SEGGER J-Link Commander V6.84a (Compiled Sep	7 2020 18:28:09)
DLL version V6.84a, compiled Sep	7 2020 18:27:57

Unknown command line option version.
```

Next, run:
```shell script
nrfjprog --version
```

You should see, depending on version:
```shell script
nrfjprog version: 10.12.2
JLinkARM.dll version: 6.88a
```

If you see that, you're good. You have everything you need to program your badge now, how about that?

With that done, go ahead and open VSCode.

You want to install the following plugins: `Cortex-Debug` by [marus25](https://github.com/Marus/cortex-debug.git), `C/C++` by [Microsoft](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools). You do that by pressing Ctrl+P then enter the following one at a time:

```
ext install marus25.cortex-debug
ext install ms-vscode.cpptools
```

Now let's open our badge code in VSCode. `File` -> `Open Folder` -> `Navigate to ~/dev` -> `Highlight BM-Badge` -> `Ok`

At this point, you should be able to build, clean, flash, and even debug with the Segger. Hurray!

# Test Build & Flash

### Badge Build

Here are the steps to compile the badge code for the physical Badge:

- From within VSCode, make sure that the badge code folder is open (if you've followed the steps above, it should be).
- Open a terminal (`Terminal` -> `New Terminal`)
- From within the terminal that appears, run the following (replace `8` with the number of cores your machine has):
```shell script
cd Software/GameEngine/
make cleanall
compiledb make EMBEDDED=1 -j8
```

You should now have everything compiled in the `~/dev/BM-Badge/Software/GameEngine/output` folder.

Let's flash it. Make sure you connect your badge to the J-Link Programmer and power on your badge.

From within the VSCode terminal:

```shell script
compiledb make flash EMBEDDED=1 -j8
```

This compiled and flashed the game engine your badge. You should now have the game running on your badge screen!

To debug you need to open the Run/debug menu on the left (`Ctrl+Shift+D`). It looks like it has a triangle and a bug symbol. At the top, make sure that the dropdown says "Debug (Linux)". Now let's connect the JLink to your Badge. In a new terminal run these commands:

```shell script
JLinkExe
```

You should see:
```shell script
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

To debug you need to open the Run/debug menu on the left (`Ctrl+Shift+D`). It looks like it has a triangle and a bug symbol. At the top, make sure that the dropdown says "Debug (Physical Badge)", and either click the green arrow or hit F5. You're debugging the hardware now!
