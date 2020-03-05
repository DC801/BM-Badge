# CMAKE Build System

There are several flavors of build targets including Embedded, Desktop, and Browser. The SDK library must be built prior to targeting Embedded. The new build system generates a static library `libnordic-sdk.a` which the application will link against so it only needs to be built once.

Since the bootloader configuration is different enough from the application, if you are building the bootloader you will need to build a second version of the sdk, but a binary distribution of the bootloader will be provided.

If you are targeting embedded and receive link errors, you need to build the sdk library

# Prerequisites

- cmake 3.13 or newer
- gcc-arm-none-eabi version7.3.1 or higher if targeting embedded (aka gcc-arm-embedded)
- make

# Running cmake

## Primary application

```bash
$ cd ./Software
$ mkdir build
$ cd build
$ cmake -DFLAVOR=<flavor> -j<n> ..
```

Where `<flavor>` can be:

- `EMBEDDED`
- `DESKTOP`
- `BROWSER`

And `<n>` is the number of jobs, this will speed up cmake by running across multiple cores. This is optional.

## Bootloader

Embedded flavor is implied when building for the bootloader, trying to use any other flavor will result in an error.

```bash
$ cd ./Software
$ mkdir build
$ cd build
$ cmake -DBOOTLOADER=1 -j<n> ..
```

# Running make

cmake will generate a Makefile which is ready to be used without any extra defines or flags

```bash
$ make -j<n>
```

Once again, the jobs flag is optional here, but does save a significant amount of time.

---

# Building the SDK

## Primary application

There is a separate cmake file to generate the SDK library. For most people, this will only need to be built once.

```bash
$ cd ./Software/sdk
$ mkdir build
$ cd build
$ cmake -j<n> ..
$ make -j<n>
```

It is highly recommended to use multiple jobs to build the sdk library, it takes quite a while to build. The sdk library file will be generated in `./Software/sdk/output/app/libnordic-sdk.a`, which is where the application build system expects it to be. If you move this file between machines, all you need to do is drop it into this directory

```bash
$ mkdir -p ./Software/sdk/build/app
$ cp <libnordic-sdk.a> ./Software/sdk/output/app/
```

## Bootloader

```bash
$ cd ./Software/sdk
$ mkdir build
$ cd build
$ cmake -DBOOTLOADER=1 -j<n> ..
$ make -j<n>
```

This will generate the sdk library at `./Software/sdk/output/bootloader/libnordic-sdk.a` similar to the application sdk.
