cmake_minimum_required(VERSION 3.13)

set(PROJ_DIR ${CMAKE_CURRENT_LIST_DIR}/..)
set(SDK_ROOT ${PROJ_DIR}/../../nordic-sdk16.0)
set(CMAKE_TRY_COMPILE_TARGET_TYPE "STATIC_LIBRARY")
set(CMAKE_TOOLCHAIN_FILE ${PROJ_DIR}/cmake/toolchain.cmake)

project(nordic-sdk VERSION 16.0)
enable_language(C ASM)

add_definitions(
        -DBOARD_CUSTOM
        -DCONFIG_NFCT_PINS_AS_GPIOS
        -DFLOAT_ABI_HARD
        -DNRF52840_XXAA
        -DNRF_DFU_DEBUG_VERSION
        -DNRF_DFU_SETTINGS_VERSION=1
        -DSVC_INTERFACE_CALL_AS_NORMAL_FUNCTION
        -DuECC_ENABLE_VLI_API=0
        -DuECC_OPTIMIZATION_LEVEL=3
        -DuECC_SQUARE_FUNC=0
        -DuECC_SUPPORT_COMPRESSED_POINT=0
        -DuECC_VLI_NATIVE_LITTLE_ENDIAN=1
)

if(NOT DEFINED BOOTLOADER)
    set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}/output/app)
    list(APPEND SDK_INCLUDES ${PROJ_DIR}/config/app)

    list(APPEND SDK_SOURCES
        "${SDK_ROOT}/components/ble/ble_advertising/ble_advertising.c"
        "${SDK_ROOT}/components/ble/ble_db_discovery/ble_db_discovery.c"
        "${SDK_ROOT}/components/ble/ble_services/ble_lbs/ble_lbs.c"
        "${SDK_ROOT}/components/ble/common/ble_advdata.c"
        "${SDK_ROOT}/components/ble/common/ble_conn_params.c"
        "${SDK_ROOT}/components/ble/common/ble_conn_state.c"
        "${SDK_ROOT}/components/ble/common/ble_srv_common.c"
        "${SDK_ROOT}/components/ble/nrf_ble_gatt/nrf_ble_gatt.c"
        "${SDK_ROOT}/components/ble/nrf_ble_qwr/nrf_ble_qwr.c"
        "${SDK_ROOT}/components/ble/peer_manager/gatt_cache_manager.c"
        "${SDK_ROOT}/components/ble/peer_manager/gatts_cache_manager.c"
        "${SDK_ROOT}/components/ble/peer_manager/id_manager.c"
        "${SDK_ROOT}/components/ble/peer_manager/peer_data_storage.c"
        "${SDK_ROOT}/components/ble/peer_manager/peer_database.c"
        "${SDK_ROOT}/components/ble/peer_manager/peer_id.c"
        "${SDK_ROOT}/components/ble/peer_manager/peer_manager.c"
        "${SDK_ROOT}/components/ble/peer_manager/pm_buffer.c"
        "${SDK_ROOT}/components/ble/peer_manager/security_dispatcher.c"
        "${SDK_ROOT}/components/ble/peer_manager/security_manager.c"
        "${SDK_ROOT}/components/softdevice/common/nrf_sdh.c"
        "${SDK_ROOT}/components/softdevice/common/nrf_sdh_ble.c"
        "${SDK_ROOT}/components/softdevice/common/nrf_sdh_soc.c"
        "${SDK_ROOT}/components/libraries/fstorage/nrf_fstorage.c"
        "${SDK_ROOT}/components/libraries/fstorage/nrf_fstorage_nvmc.c"
        "${SDK_ROOT}/components/libraries/fstorage/nrf_fstorage_sd.c"
    )
else(NOT DEFINED BOOTLOADER)
    set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}/output/bootloader)
    list(APPEND SDK_INCLUDES ${PROJ_DIR}/config/bootloader)
endif(NOT DEFINED BOOTLOADER)

list(APPEND SDK_SOURCES
        "${SDK_ROOT}/components/boards/boards.c"
        "${SDK_ROOT}/components/drivers_ext/st7735/st7735.c"
        "${SDK_ROOT}/components/libraries/atomic/nrf_atomic.c"
        "${SDK_ROOT}/components/libraries/atomic_fifo/nrf_atfifo.c"
        "${SDK_ROOT}/components/libraries/atomic_flags/nrf_atflags.c"
        "${SDK_ROOT}/components/libraries/balloc/nrf_balloc.c"
        "${SDK_ROOT}/components/libraries/block_dev/sdc/nrf_block_dev_sdc.c"
        "${SDK_ROOT}/components/libraries/bootloader/dfu/dfu-cc.pb.c"
        "${SDK_ROOT}/components/libraries/bootloader/dfu/nrf_dfu.c"
        "${SDK_ROOT}/components/libraries/bootloader/dfu/nrf_dfu_flash.c"
        "${SDK_ROOT}/components/libraries/bootloader/dfu/nrf_dfu_handling_error.c"
        "${SDK_ROOT}/components/libraries/bootloader/dfu/nrf_dfu_mbr.c"
        "${SDK_ROOT}/components/libraries/bootloader/dfu/nrf_dfu_req_handler.c"
        "${SDK_ROOT}/components/libraries/bootloader/dfu/nrf_dfu_settings.c"
        "${SDK_ROOT}/components/libraries/bootloader/dfu/nrf_dfu_transport.c"
        "${SDK_ROOT}/components/libraries/bootloader/dfu/nrf_dfu_utils.c"
        "${SDK_ROOT}/components/libraries/bootloader/dfu/nrf_dfu_validation.c"
        "${SDK_ROOT}/components/libraries/bootloader/dfu/nrf_dfu_ver_validation.c"
        "${SDK_ROOT}/components/libraries/bootloader/nrf_bootloader.c"
        "${SDK_ROOT}/components/libraries/bootloader/nrf_bootloader_app_start.c"
        "${SDK_ROOT}/components/libraries/bootloader/nrf_bootloader_app_start_final.c"
        "${SDK_ROOT}/components/libraries/bootloader/nrf_bootloader_dfu_timers.c"
        "${SDK_ROOT}/components/libraries/bootloader/nrf_bootloader_fw_activation.c"
        "${SDK_ROOT}/components/libraries/bootloader/nrf_bootloader_info.c"
        "${SDK_ROOT}/components/libraries/bootloader/nrf_bootloader_wdt.c"
        "${SDK_ROOT}/components/libraries/bootloader/serial_dfu/nrf_dfu_serial.c"
        "${SDK_ROOT}/components/libraries/bootloader/serial_dfu/nrf_dfu_serial_uart.c"
        "${SDK_ROOT}/components/libraries/bsp/bsp.c"
        "${SDK_ROOT}/components/libraries/button/app_button.c"
        "${SDK_ROOT}/components/libraries/crc32/crc32.c"
        "${SDK_ROOT}/components/libraries/crypto/backend/micro_ecc/micro_ecc_backend_ecc.c"
        "${SDK_ROOT}/components/libraries/crypto/backend/micro_ecc/micro_ecc_backend_ecdh.c"
        "${SDK_ROOT}/components/libraries/crypto/backend/micro_ecc/micro_ecc_backend_ecdsa.c"
        "${SDK_ROOT}/components/libraries/crypto/backend/nrf_sw/nrf_sw_backend_hash.c"
        "${SDK_ROOT}/components/libraries/crypto/nrf_crypto_ecc.c"
        "${SDK_ROOT}/components/libraries/crypto/nrf_crypto_ecdsa.c"
        "${SDK_ROOT}/components/libraries/crypto/nrf_crypto_hash.c"
        "${SDK_ROOT}/components/libraries/crypto/nrf_crypto_init.c"
        "${SDK_ROOT}/components/libraries/crypto/nrf_crypto_shared.c"
        "${SDK_ROOT}/components/libraries/experimental_section_vars/nrf_section_iter.c"
        "${SDK_ROOT}/components/libraries/fds/fds.c"
        "${SDK_ROOT}/components/libraries/fifo/app_fifo.c"
        "${SDK_ROOT}/components/libraries/gfx/nrf_gfx.c"
        "${SDK_ROOT}/components/libraries/hardfault/hardfault_implementation.c"
        "${SDK_ROOT}/components/libraries/log/src/nrf_log_backend_rtt.c"
        "${SDK_ROOT}/components/libraries/log/src/nrf_log_backend_serial.c"
        "${SDK_ROOT}/components/libraries/log/src/nrf_log_backend_uart.c"
        "${SDK_ROOT}/components/libraries/log/src/nrf_log_default_backends.c"
        "${SDK_ROOT}/components/libraries/log/src/nrf_log_frontend.c"
        "${SDK_ROOT}/components/libraries/log/src/nrf_log_str_formatter.c"
        "${SDK_ROOT}/components/libraries/mem_manager/mem_manager.c"
        "${SDK_ROOT}/components/libraries/memobj/nrf_memobj.c"
        "${SDK_ROOT}/components/libraries/pwm/app_pwm.c"
        "${SDK_ROOT}/components/libraries/pwr_mgmt/nrf_pwr_mgmt.c"
        "${SDK_ROOT}/components/libraries/queue/nrf_queue.c"
        "${SDK_ROOT}/components/libraries/ringbuf/nrf_ringbuf.c"
        "${SDK_ROOT}/components/libraries/scheduler/app_scheduler.c"
        "${SDK_ROOT}/components/libraries/sdcard/app_sdcard.c"
        "${SDK_ROOT}/components/libraries/sha256/sha256.c"
        "${SDK_ROOT}/components/libraries/slip/slip.c"
        "${SDK_ROOT}/components/libraries/sortlist/nrf_sortlist.c"
        "${SDK_ROOT}/components/libraries/strerror/nrf_strerror.c"
        "${SDK_ROOT}/components/libraries/timer/app_timer.c"
        "${SDK_ROOT}/components/libraries/uart/app_uart_fifo.c"
        "${SDK_ROOT}/components/libraries/uart/retarget.c"
        "${SDK_ROOT}/components/libraries/usbd/app_usbd.c"
        "${SDK_ROOT}/components/libraries/usbd/app_usbd_core.c"
        "${SDK_ROOT}/components/libraries/usbd/app_usbd_serial_num.c"
        "${SDK_ROOT}/components/libraries/usbd/app_usbd_string_desc.c"
        "${SDK_ROOT}/components/libraries/usbd/class/cdc/acm/app_usbd_cdc_acm.c"
        "${SDK_ROOT}/components/libraries/util/app_error.c"
        "${SDK_ROOT}/components/libraries/util/app_error_handler_gcc.c"
        "${SDK_ROOT}/components/libraries/util/app_error_weak.c"
        "${SDK_ROOT}/components/libraries/util/app_util_platform.c"
        "${SDK_ROOT}/components/libraries/util/nrf_assert.c"
        "${SDK_ROOT}/external/fatfs/port/diskio_blkdev.c"
        "${SDK_ROOT}/external/fatfs/src/ff.c"
        "${SDK_ROOT}/external/fprintf/nrf_fprintf.c"
        "${SDK_ROOT}/external/fprintf/nrf_fprintf_format.c"
        "${SDK_ROOT}/external/nano-pb/pb_common.c"
        "${SDK_ROOT}/external/nano-pb/pb_decode.c"
        "${SDK_ROOT}/external/segger_rtt/SEGGER_RTT.c"
        "${SDK_ROOT}/external/segger_rtt/SEGGER_RTT_Syscalls_GCC.c"
        "${SDK_ROOT}/external/segger_rtt/SEGGER_RTT_printf.c"
        "${SDK_ROOT}/external/thedotfactory_fonts/orkney24pts.c"
        "${SDK_ROOT}/external/thedotfactory_fonts/orkney8pts.c"
        "${SDK_ROOT}/integration/nrfx/legacy/nrf_drv_clock.c"
        "${SDK_ROOT}/integration/nrfx/legacy/nrf_drv_power.c"
        "${SDK_ROOT}/integration/nrfx/legacy/nrf_drv_ppi.c"
        "${SDK_ROOT}/integration/nrfx/legacy/nrf_drv_rng.c"
        "${SDK_ROOT}/integration/nrfx/legacy/nrf_drv_spi.c"
        "${SDK_ROOT}/integration/nrfx/legacy/nrf_drv_twi.c"
        "${SDK_ROOT}/integration/nrfx/legacy/nrf_drv_uart.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_clock.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_gpiote.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_power.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_ppi.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_rng.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_saadc.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_spi.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_spim.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_systick.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_timer.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_twi.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_twim.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_uart.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_uarte.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/nrfx_usbd.c"
        "${SDK_ROOT}/modules/nrfx/drivers/src/prs/nrfx_prs.c"
        "${SDK_ROOT}/modules/nrfx/hal/nrf_nvmc.c"
        "${SDK_ROOT}/modules/nrfx/soc/nrfx_atomic.c"
)

list(APPEND SDK_SOURCES "${SDK_ROOT}/modules/nrfx/mdk/system_nrf52840.c")
list(APPEND SDK_SOURCES "${SDK_ROOT}/modules/nrfx/mdk/gcc_startup_nrf52840.S")

include(sdk-includes.cmake)
add_library(nordic-sdk STATIC ${SDK_SOURCES})
target_include_directories(nordic-sdk PUBLIC ${SDK_INCLUDES})
