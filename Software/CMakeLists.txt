cmake_minimum_required(VERSION 3.10)
project(dc27_badge)

set(CMAKE_CXX_STANDARD 11)
set(SDK_ROOT /home/hamster/dev/nordic-sdk15/)
set(PROJ_DIR /home/hamster/dev/dc801/dc27-party-badge/Software)

set(SRC_FILES
        ${PROJ_DIR}/utility.c
        ${PROJ_DIR}/modules/drv_st7735.c
        ${PROJ_DIR}/modules/gfx.c
        ${PROJ_DIR}/modules/sd.c
        ${PROJ_DIR}/main.c
        ${PROJ_DIR}/menu.c
        ${PROJ_DIR}/menu.h
        ${PROJ_DIR}/user.c
        ${PROJ_DIR}/user.h
        ${PROJ_DIR}/games/Space_Invaders.c
        ${PROJ_DIR}/games/Space_Invaders.h
        ${PROJ_DIR}/games/Snake.c
        ${PROJ_DIR}/modules/ble.c games/PipsTheET.c games/PipsTheET.h modules/uart.c
        modules/uart.h modules/adc.c modules/adc.h extras.c extras.h nearby.c nearby.h
        games/Tic-Tac-Toe.c games/Tic-Tac-Toe.h games/Wargames.c games/Wargames.h
        godmode.c godmode.h)

set(INC_FOLDERS
        ${SDK_ROOT}/components
        ${SDK_ROOT}/components/ble/ble_advertising
        ${SDK_ROOT}/components/ble/ble_dtm
        ${SDK_ROOT}/components/ble/ble_racp
        ${SDK_ROOT}/components/ble/ble_services/ble_ancs_c
        ${SDK_ROOT}/components/ble/ble_services/ble_ans_c
        ${SDK_ROOT}/components/ble/ble_services/ble_bas
        ${SDK_ROOT}/components/ble/ble_services/ble_bas_c
        ${SDK_ROOT}/components/ble/ble_services/ble_cscs
        ${SDK_ROOT}/components/ble/ble_services/ble_cts_c
        ${SDK_ROOT}/components/ble/ble_services/ble_dfu
        ${SDK_ROOT}/components/ble/ble_services/ble_dis
        ${SDK_ROOT}/components/ble/ble_services/ble_gls
        ${SDK_ROOT}/components/ble/ble_services/ble_hids
        ${SDK_ROOT}/components/ble/ble_services/ble_hrs
        ${SDK_ROOT}/components/ble/ble_services/ble_hrs_c
        ${SDK_ROOT}/components/ble/ble_services/ble_hts
        ${SDK_ROOT}/components/ble/ble_services/ble_ias
        ${SDK_ROOT}/components/ble/ble_services/ble_ias_c
        ${SDK_ROOT}/components/ble/ble_services/ble_lbs
        ${SDK_ROOT}/components/ble/ble_services/ble_lbs_c
        ${SDK_ROOT}/components/ble/ble_services/ble_lls
        ${SDK_ROOT}/components/ble/ble_services/ble_nus
        ${SDK_ROOT}/components/ble/ble_services/ble_nus_c
        ${SDK_ROOT}/components/ble/ble_services/ble_rscs
        ${SDK_ROOT}/components/ble/ble_services/ble_rscs_c
        ${SDK_ROOT}/components/ble/ble_services/ble_tps
        ${SDK_ROOT}/components/ble/common
        ${SDK_ROOT}/components/ble/nrf_ble_gatt
        ${SDK_ROOT}/components/ble/nrf_ble_qwr
        ${SDK_ROOT}/components/ble/peer_manager
        ${SDK_ROOT}/components/boards
        ${SDK_ROOT}/components/drivers_nrf/usbd
        ${SDK_ROOT}/components/libraries/atomic
        ${SDK_ROOT}/components/libraries/atomic_fifo
        ${SDK_ROOT}/components/libraries/atomic_flags
        ${SDK_ROOT}/components/libraries/balloc
        ${SDK_ROOT}/components/libraries/block_dev
        ${SDK_ROOT}/components/libraries/block_dev/sdc
        ${SDK_ROOT}/components/libraries/bootloader/ble_dfu
        ${SDK_ROOT}/components/libraries/bsp
        ${SDK_ROOT}/components/libraries/button
        ${SDK_ROOT}/components/libraries/cli
        ${SDK_ROOT}/components/libraries/crc16
        ${SDK_ROOT}/components/libraries/crc32
        ${SDK_ROOT}/components/libraries/crypto
        ${SDK_ROOT}/components/libraries/csense
        ${SDK_ROOT}/components/libraries/csense_drv
        ${SDK_ROOT}/components/libraries/delay
        ${SDK_ROOT}/components/libraries/ecc
        ${SDK_ROOT}/components/libraries/experimental_log
        ${SDK_ROOT}/components/libraries/experimental_log/src
        ${SDK_ROOT}/components/libraries/experimental_memobj
        ${SDK_ROOT}/components/libraries/experimental_mpu
        ${SDK_ROOT}/components/libraries/experimental_ringbuf
        ${SDK_ROOT}/components/libraries/experimental_section_vars
        ${SDK_ROOT}/components/libraries/experimental_stack_guard
        ${SDK_ROOT}/components/libraries/experimental_task_manager
        ${SDK_ROOT}/components/libraries/fds
        ${SDK_ROOT}/components/libraries/fifo
        ${SDK_ROOT}/components/libraries/fstorage
        ${SDK_ROOT}/components/libraries/gfx
        ${SDK_ROOT}/components/libraries/gpiote
        ${SDK_ROOT}/components/libraries/hardfault
        ${SDK_ROOT}/components/libraries/hci
        ${SDK_ROOT}/components/libraries/led_softblink
        ${SDK_ROOT}/components/libraries/low_power_pwm
        ${SDK_ROOT}/components/libraries/mem_manager
        ${SDK_ROOT}/components/libraries/mutex
        ${SDK_ROOT}/components/libraries/pwm
        ${SDK_ROOT}/components/libraries/pwr_mgmt
        ${SDK_ROOT}/components/libraries/queue
        ${SDK_ROOT}/components/libraries/scheduler
        ${SDK_ROOT}/components/libraries/sdcard
        ${SDK_ROOT}/components/libraries/slip
        ${SDK_ROOT}/components/libraries/sortlist
        ${SDK_ROOT}/components/libraries/spi_mngr
        ${SDK_ROOT}/components/libraries/strerror
        ${SDK_ROOT}/components/libraries/timer
        ${SDK_ROOT}/components/libraries/twi_mngr
        ${SDK_ROOT}/components/libraries/twi_sensor
        ${SDK_ROOT}/components/libraries/uart
        ${SDK_ROOT}/components/libraries/usbd
        ${SDK_ROOT}/components/libraries/usbd/class/audio
        ${SDK_ROOT}/components/libraries/usbd/class/cdc
        ${SDK_ROOT}/components/libraries/usbd/class/cdc/acm
        ${SDK_ROOT}/components/libraries/usbd/class/hid
        ${SDK_ROOT}/components/libraries/usbd/class/hid/generic
        ${SDK_ROOT}/components/libraries/usbd/class/hid/kbd
        ${SDK_ROOT}/components/libraries/usbd/class/hid/mouse
        ${SDK_ROOT}/components/libraries/usbd/class/msc
        ${SDK_ROOT}/components/libraries/usbd/config
        ${SDK_ROOT}/components/libraries/util
        ${SDK_ROOT}/components/nfc/ndef/connection_handover/ac_rec
        ${SDK_ROOT}/components/nfc/ndef/connection_handover/ble_oob_advdata
        ${SDK_ROOT}/components/nfc/ndef/connection_handover/ble_pair_lib
        ${SDK_ROOT}/components/nfc/ndef/connection_handover/ble_pair_msg
        ${SDK_ROOT}/components/nfc/ndef/connection_handover/common
        ${SDK_ROOT}/components/nfc/ndef/connection_handover/ep_oob_rec
        ${SDK_ROOT}/components/nfc/ndef/connection_handover/hs_rec
        ${SDK_ROOT}/components/nfc/ndef/connection_handover/le_oob_rec
        ${SDK_ROOT}/components/nfc/ndef/conn_hand_parser
        ${SDK_ROOT}/components/nfc/ndef/conn_hand_parser/ac_rec_parser
        ${SDK_ROOT}/components/nfc/ndef/conn_hand_parser/ble_oob_advdata_parser
        ${SDK_ROOT}/components/nfc/ndef/conn_hand_parser/le_oob_rec_parser
        ${SDK_ROOT}/components/nfc/ndef/generic/message
        ${SDK_ROOT}/components/nfc/ndef/generic/record
        ${SDK_ROOT}/components/nfc/ndef/launchapp
        ${SDK_ROOT}/components/nfc/ndef/parser/message
        ${SDK_ROOT}/components/nfc/ndef/parser/record
        ${SDK_ROOT}/components/nfc/ndef/text
        ${SDK_ROOT}/components/nfc/ndef/uri
        ${SDK_ROOT}/components/nfc/t2t_lib
        ${SDK_ROOT}/components/nfc/t2t_lib/hal_t2t
        ${SDK_ROOT}/components/nfc/t2t_parser
        ${SDK_ROOT}/components/nfc/t4t_lib
        ${SDK_ROOT}/components/nfc/t4t_lib/hal_t4t
        ${SDK_ROOT}/components/nfc/t4t_parser/apdu
        ${SDK_ROOT}/components/nfc/t4t_parser/cc_file
        ${SDK_ROOT}/components/nfc/t4t_parser/hl_detection_procedure
        ${SDK_ROOT}/components/nfc/t4t_parser/tlv
        ${SDK_ROOT}/components/softdevice/common
        ${SDK_ROOT}/components/softdevice/s132/headers
        ${SDK_ROOT}/components/softdevice/s132/headers/nrf52
        ${SDK_ROOT}/components/toolchain/cmsis/include
       
        ${SDK_ROOT}/external/protothreads
        ${SDK_ROOT}/external/protothreads/pt-1.4/
        ${SDK_ROOT}/external/fatfs/port/
        ${SDK_ROOT}/external/fatfs/src
        ${SDK_ROOT}/external/fprintf
        ${SDK_ROOT}/external/segger_rtt
       
        ${SDK_ROOT}/integration/nrfx
        ${SDK_ROOT}/integration/nrfx/legacy
       
        ${SDK_ROOT}/modules/nrfx
        ${SDK_ROOT}/modules/nrfx/drivers/include
        ${SDK_ROOT}/modules/nrfx/hal
        ${SDK_ROOT}/modules/nrfx/mdk
       
        ${PROJ_DIR}/
        ${PROJ_DIR}/config
        ${PROJ_DIR}/config/app )

include_directories(${INC_FOLDERS})

add_executable(dc27_badge ${SRC_FILES})