#ifndef SHIM_BLE_H
#define SHIM_BLE_H


#ifdef DC801_EMBEDDED

#include <app_util.h>
#include <bsp.h>
#include <ble_advdata.h>
#include <nordic_common.h>
#include <nrf_sdh.h>
#include <nrf_sdh_ble.h>

#endif

#include <stdint.h>

#define DATA_SAVE_LEN 16

typedef struct
{
    uint16_t appearance;
    uint16_t manu;
    uint8_t manu_data[DATA_SAVE_LEN];
    char* short_name;
    uint8_t short_name_len;
    char* long_name;
    uint8_t long_name_len;
} ADVERTISEMENT;

typedef enum
{
    badgeYear_25 = 0x19DC,
    badgeYear_26 = 0x26DC,
    badgeYear_27 = 0x27DC,
    badgeYear_28 = 0x28DC,
    badgeYear_29 = 0x29DC,
    NUM_BADGE_YEARS
} BADGE_YEAR;

typedef enum
{
    badge_none,
    badge_andnxor,
    badge_cpv,
    badge_darknet,
    badge_dc801,
    badge_dczia,
    badge_FoB,
    badge_diana,
    badge_dc503,
    badge_dcfurs,
    badge_blinky,
    badge_phase4_monkey,
    badge_phase4_ham,
    badge_queercon,
    badge_shotbot,
    badge_pirates,
    badge_hak4kidz,
    badge_dc858_619,
    badge_ides,
    NUM_BADGE_GROUPS
} BADGE_GROUP;

#define FIRST_BADGE_GROUP   badge_andnxor
#define LAST_BADGE_GROUP    NUM_BADGE_GROUPS - 1

typedef struct
{
    BADGE_YEAR year;
    BADGE_GROUP group;
    uint16_t appearance;
    uint8_t data[DATA_SAVE_LEN];
    uint8_t name[DATA_SAVE_LEN + 1];
    uint8_t mac[6];
    int8_t rssi;
} BADGE_ADV;

typedef struct
{
    BADGE_GROUP group;
    uint16_t appearance;
    const char* name;
    const char* icon;
    const char* contact;
} BADGE_INFO;

extern const BADGE_INFO badgeInfo[NUM_BADGE_GROUPS - 1];

void ble_adv_init(void);
void ble_adv_start(void);
void ble_stack_init(void);
void gap_params_init(void);
void scan_start(void);

void advertising_setUser(const char* user);

bool parseAdvertisementData(uint8_t* data, uint8_t len, ADVERTISEMENT* adv);


uint8_t getBadges(BADGE_ADV* badges);
bool getBadge(uint8_t index, BADGE_ADV* badge);
uint8_t getBadgeNum(void);
uint8_t getBadgeYear(BADGE_YEAR year);
const char* getBadgeGroupName(BADGE_GROUP group);
const char* getBadgeIconFile(BADGE_GROUP group);
const char* getBadgeContact(BADGE_GROUP group);
uint16_t getBadgeAppearance(BADGE_GROUP group);
BADGE_GROUP getBadgeGroupFromAppearance(uint16_t appearance);


#define APP_COMPANY_IDENTIFIER_DC801    0x0801

#define BLOCK_TYPE_APPEARANCE	0x19
#define BLOCK_TYPE_MANU_INFO	0xFF
#define BLOCK_TYPE_LONG_NAME	0x09
#define BLOCK_TYPE_SHORT_NAME	0x08

#define APP_BLE_CONN_CFG_TAG 			1
#define APP_BLE_OBSERVER_PRIO           3

#define DEVICE_NAME                     "DC801   "                 				/**< Name of device. Will be included in the advertising data. */
#define NON_CONNECTABLE_ADV_INTERVAL    MSEC_TO_UNITS(500, UNIT_0_625_MS) 		/**< The advertising interval for non-connectable advertisement (100 ms).
                                                                                    This value can vary between 100ms to 10.24s). */

#define SCAN_INTERVAL                   MSEC_TO_UNITS(100, UNIT_0_625_MS)    	/**< Determines scan interval in units of 0.625 millisecond. */
#define SCAN_WINDOW                     MSEC_TO_UNITS(50, UNIT_0_625_MS)    	/**< Determines scan window in units of 0.625 millisecond. */
#define SCAN_TIMEOUT                    0

#define MIN_CONN_INTERVAL               MSEC_TO_UNITS(100, UNIT_1_25_MS)        /**< Minimum acceptable connection interval (0.1 seconds). */
#define MAX_CONN_INTERVAL               MSEC_TO_UNITS(200, UNIT_1_25_MS)        /**< Maximum acceptable connection interval (0.2 second). */
#define SLAVE_LATENCY                   0                                       /**< Slave latency. */
#define CONN_SUP_TIMEOUT                MSEC_TO_UNITS(4000, UNIT_10_MS)         /**< Connection supervisory timeout (4 seconds). */

#define DEFCON_BADGE_SCAN_INTERVAL		APP_TIMER_TICKS(15000)

#define NUM_BADGES_TO_STORE             16

#endif
