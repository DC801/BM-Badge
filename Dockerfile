FROM ubuntu:20.04
ARG DEBIAN_FRONTEND=noninteractive

# Setup for Desktop builds
# GDB from EnvironmentSetup.md is omitted
# because it should be installed on the host instead
RUN apt-get update && \
  apt-get install -y \
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
  libncurses5 \
  libncurses-dev \
  python3-pip \
  coreutils \
  zip \
  unzip \
  && pip3 install compiledb

ENV HOME="/home/dc801"

RUN mkdir -p ~/dev/installer && \
  echo 'PATH="$HOME/.local/bin:$PATH"' >>~/.profile \
  && echo 'export PATH="$HOME/.local/bin:$PATH"' >>~/.bash_profile
 

# Setup for Embedded builds
WORKDIR "${HOME}/dev/installer"

RUN wget https://armkeil.blob.core.windows.net/developer/Files/downloads/gnu-rm/10-2020q4/gcc-arm-none-eabi-10-2020-q4-major-x86_64-linux.tar.bz2 && \
  export EABI_VERSION=10-2020-q4-major && \
  tar xjf gcc-arm-none-eabi-$EABI_VERSION-x86_64-linux.tar.bz2 -C /usr/share && \
  ln -s /usr/share/gcc-arm-none-eabi-$EABI_VERSION/bin/arm-none-eabi-* /usr/bin

RUN wget http://developer.nordicsemi.com/nRF5_SDK/nRF5_SDK_v15.x.x/nRF5_SDK_15.3.0_59ac345.zip && \
  unzip nRF5_SDK_15.3.0_59ac345.zip && \
  mv nRF5_SDK_*/ ~/dev/nordic-sdk15.3.0

RUN printf "GNU_INSTALL_ROOT ?= /usr/bin/\nGNU_VERSION ?= 10.2.1\nGNU_PREFIX ?= arm-none-eabi\n" \
  >~/dev/nordic-sdk15.3.0/components/toolchain/gcc/Makefile.posix

RUN wget https://www.nordicsemi.com/-/media/Software-and-other-downloads/Desktop-software/nRF-command-line-tools/sw/Versions-10-x-x/10-12-2/nRF-Command-Line-Tools_10_12_2_Linux-amd64.zip && \
  unzip nRF-Command-Line-Tools_10_12_2_Linux-amd64.zip && \
  cd nRF-Command-Line-Tools_10_12_2_Linux-amd64 && \
  tar -xvf nRF-Command-Line-Tools_10_12_2_Linux-amd64.tar.gz && \
  dpkg -i *.deb

