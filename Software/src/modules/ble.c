/*
 * @file ble.c
 *
 * @date 8/1/2018
 * @author hamster
 *
 * Bluetooth configuration and data handling
 *
 */


#ifdef DC801_EMBEDDED
#include <softdevice/s132/headers/ble_gap.h>
#else
#include "sdk_shim.h"
#endif

#include "common.h"
#include "ble.h"

/**
 * Group info
 */
const BADGE_INFO badgeInfo[NUM_BADGE_GROUPS - 1] = {
        { badge_andnxor,        0x049E, "and!xor",          "/GROUPS/BENDER.RAW",       "@ANDnXOR"          },
        { badge_cpv,            0x0C97, "CPV",              "/GROUPS/CPV.RAW",          "@CryptoVillage"    },
        { badge_darknet,        0x444E, "dcdarknet",        "/GROUPS/DARKNET.RAW",      "@DCDarknet"        },
        { badge_dc801,          0x0801, "DC801",            "/GROUPS/DC801.RAW",        "@dc801"            },
        { badge_dczia,          0x5050, "DCZIA",            "/GROUPS/DCZIA.RAW",        "@DCZia505"         },
        { badge_FoB,            0x0069, "FoB",              NULL,                       "@B1un7"            },
        { badge_diana,          0x1010, "Diana Init",       NULL,                       "@B1un7"            },
        { badge_dc503,          0x0503, "DC503",            NULL,                       "@r00tkillah"       },
        { badge_dcfurs,         0x71FF, "DefconFurs",       "/GROUPS/DCFURS.RAW",       "@DCFurs"           },
        { badge_blinky,         0x4242, "MrBlinkyBling",    "/GROUPS/BLINKY.RAW",       "@MrBlinkyBling"    },
        { badge_phase4_monkey,  0x0B25, "Phase4 Monkey",    "/GROUPS/MONKEY.RAW",       "@abraxas3d"        },
        { badge_phase4_ham,     0x064A, "Phase4 Iono",      "/GROUPS/IONO.RAW",         "@abraxas3d"        },
        { badge_queercon,       0x04D3, "Queercon",         "/GROUPS/QUEERCON.RAW",     "@Queercon"         },
        { badge_shotbot,        0x5051, "Shotbot!",         "/GROUPS/SHOTBOT.RAW",      "@jediguybob"       },
        { badge_pirates,        0x1337, "BadgePirates",     "/GROUPS/PIRATE.RAW",       "@BadgePirates"     },
		{ badge_hak4kidz,       0x02E5, "Hak4Kidz",         NULL,                       "@Hak4Kidz"         },
		{ badge_ides,           0x1DE5, "IDES",             NULL,                       "@Netik"            },
		{ badge_dc858_619,      0x0698, "DC858/619",        NULL,                       "@ellwoodthewood"   }
    };

static BADGE_ADV badgeAdv[NUM_BADGES_TO_STORE];
static uint8_t badgeAdvNum;
static volatile bool lockBadges = false;

#ifdef DC801_EMBEDDED

static ble_gap_adv_params_t m_adv_params;                                  /**< Parameters to be passed to the stack when starting advertising. */
static uint8_t              m_adv_handle = BLE_GAP_ADV_SET_HANDLE_NOT_SET; /**< Advertising handle used to identify an advertising set. */
static uint8_t              m_enc_advdata[BLE_GAP_ADV_SET_DATA_SIZE_MAX];  /**< Buffer for storing an encoded advertising set. */

static ble_gap_adv_data_t m_adv_data = {
    .adv_data = {
        .p_data = m_enc_advdata,
        .len    = BLE_GAP_ADV_SET_DATA_SIZE_MAX
            },
    .scan_rsp_data = {
        .p_data = NULL,
        .len    = 0
            }
};

static uint8_t               m_scan_buffer_data[BLE_GAP_SCAN_BUFFER_MIN]; /**< buffer where advertising reports will be stored by the SoftDevice. */

/**@brief Pointer to the buffer where advertising reports will be stored by the SoftDevice. */
static ble_data_t m_scan_buffer = {
    m_scan_buffer_data,
    BLE_GAP_SCAN_BUFFER_MIN
};


/**
 * This is the data we stuff into the manufacturer block after the ID
 * The first 8 bytes is the score
 * The next byte is the clan name
 *
 */
static uint8_t m_dc801_beacon_info[8] =
{
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
};

APP_TIMER_DEF(ble_scan_timer);

/**
 * Scan for 15 seconds or until we have 16 entries
 * @param p_context
 */
static void ble_scan_timeout_handler(void *p_context) {
    UNUSED_PARAMETER(p_context);

    printf("Rescan %d badges...\n", badgeAdvNum);

    // Check for special modes if we can see any badges
    if(badgeAdvNum > 0) {

        int modifier = 0;

        for (uint8_t i = 0; i < badgeAdvNum; i++) {
            if (badgeAdv[i].group == badge_dc801) {
                for(uint8_t j = 0; j < 7; j++){
                    printf("%d - %02X\n", j, badgeAdv[i].data[j]);
                }
            }
        }

    }

    if(lockBadges){
        // Punt for now
        return;
    }

    lockBadges = true;

    badgeAdvNum = 0;
    memset(badgeAdv, 0, sizeof(badgeAdv));

    lockBadges = false;

}

/**
 * @brief Function for initiating scanning.
 */
void scan_start(void){

    ble_gap_scan_params_t m_scan_param;

    m_scan_param.active         = 1;
    m_scan_param.interval       = SCAN_INTERVAL;
    m_scan_param.window         = SCAN_WINDOW;
    m_scan_param.timeout        = SCAN_TIMEOUT;
    m_scan_param.filter_policy  = BLE_GAP_SCAN_FP_ACCEPT_ALL;
    m_scan_param.scan_phys      = BLE_GAP_PHY_1MBPS;

    badgeAdvNum = 0;
    memset(badgeAdv, 0, sizeof(badgeAdv));

    sd_ble_gap_scan_stop();
    sd_ble_gap_scan_start(&m_scan_param, &m_scan_buffer);

}

/**
 * Check if two MAC addresses match
 * @param left
 * @param right
 * @return true if matching
 */
bool macAddressMatch(const uint8_t left[], const uint8_t right[]){
    for(int i = 0; i < 6; i++){
        if(left[i] != right[i]){
            return false;
        }
    }

    return true;
}

#endif

/**
 * @return a pointer to the seen badges
 */
uint8_t getBadges(BADGE_ADV *badges){

    if(lockBadges){
        // Punt for now
        return 0;
    }

    lockBadges = true;

    memcpy(badges, badgeAdv, sizeof(badgeAdv));
    uint8_t retVal = badgeAdvNum;

    lockBadges = false;

    return retVal;
}


/**
 * Get a single badge
 * @param index of the badge we want
 * @param badge the struct to return to
 * @return true if it wasn't null
 */
bool getBadge(uint8_t index, BADGE_ADV *badge){

    if(lockBadges){
        // Punt for now
        return false;
    }

    lockBadges = true;

    if(index > badgeAdvNum || badgeAdvNum == 0){
        lockBadges = false;
        return false;
    }

    memcpy(badge, &badgeAdv[index], sizeof(BADGE_ADV));

    lockBadges = false;

    return true;
}

/**
 * Return the number of badges we currently see
 * @return
 */
uint8_t getBadgeNum(void){
    return badgeAdvNum;
}

/**
 * @param year we want info on
 * @return int8_t, of the year
 */
uint8_t getBadgeYear(BADGE_YEAR year){
	if (year == badgeYear_25 || year == SWAP(badgeYear_25))
		return 25;
	else if (year == badgeYear_26 || year == SWAP(badgeYear_26))
		return 26;
	else if (year == badgeYear_27 || year == SWAP(badgeYear_27))
		return 27;
    else if (year == badgeYear_28 || year == SWAP(badgeYear_28))
            return 28;
    else if (year == badgeYear_29 || year == SWAP(badgeYear_29))
            return 29;
	else
		return 0;
}

#ifdef DC801_EMBEDDED

/**
 * See if we have seen this badge, and if not, stick in the seen array
 * If the array is full, just ignore it
 * @param badge
 */
void addSeenBadge(BADGE_ADV badge){

    if(lockBadges){
        // Punt for now
        return;
    }

    lockBadges = true;

    if(badge.appearance == 0){
        // Don't save it
        lockBadges = false;
        return;
    }

    if (badgeAdvNum < NUM_BADGES_TO_STORE) {

        bool haveBadge = false;

        if (badgeAdvNum != 0) {
            // Check if we have seen this badge yet or not
            for (int i = 0; i < badgeAdvNum; i++) {
                // Compare mac address
                if(macAddressMatch(badge.mac, badgeAdv[i].mac)){
                    haveBadge = true;
                    break;
                }
            }
        }

        if (!haveBadge || badgeAdvNum == 0) {
            // Add it!
            memcpy(&badgeAdv[badgeAdvNum], &badge, sizeof(BADGE_ADV));
            badgeAdvNum++;
        }
    }

    lockBadges = false;
}


/**
 * @brief Function for dispatching a BLE stack event to all modules with a BLE stack event handler.
 *
 * @details This function is called from the scheduler in the main loop after a BLE stack event has
 * been received.
 *
 * @param[in]   p_ble_evt   Bluetooth stack event.
 */
static void ble_evt_handler(ble_evt_t const *p_ble_evt, void *p_context) {

    static ADVERTISEMENT adv = {0, 0, {0}, NULL, 0, NULL, 0};

    const ble_gap_evt_t *const p_gap_evt = &p_ble_evt->evt.gap_evt;

    switch (p_ble_evt->header.evt_id) {
        case BLE_GAP_EVT_ADV_REPORT:

            // Was the advertisement more than 0 bytes long?
            if (p_gap_evt->params.adv_report.data.len > 0) {

                // Grab a copy of it and pass that to be parsed
                uint8_t data[BLE_GAP_ADV_SET_DATA_SIZE_MAX];
                memcpy(data, p_gap_evt->params.adv_report.data.p_data, p_gap_evt->params.adv_report.data.len);

                if (!p_gap_evt->params.adv_report.type.scan_response) {
                    // This is not a scan response, so clear the struct
                    // Since the data is static, this allows
                    memset(&adv, 0, sizeof(adv));
                }

                if(parseAdvertisementData(data, p_gap_evt->params.adv_report.data.len, &adv)) {

                    //printf("App %04X\n", adv.appearance);

                    // Parsed OK
                    // Is this a defcon badge?
                    if (getBadgeYear((BADGE_YEAR)adv.appearance)) {
                        // Yes

                        BADGE_ADV badge;
                        memset(&badge, 0, sizeof(BADGE_ADV));

                        badge.year = (BADGE_YEAR)adv.appearance;
                        if(adv.long_name_len != 0){
                            memcpy(&badge.name, adv.long_name, MIN(adv.long_name_len, DATA_SAVE_LEN));
                            badge.name[DATA_SAVE_LEN] = '\0';
                        }
                        badge.appearance = adv.manu;
                        badge.group = getBadgeGroupFromAppearance(adv.manu);
                        memcpy(&badge.mac, p_gap_evt->params.adv_report.peer_addr.addr, BLE_GAP_ADDR_LEN);
                        memcpy(badge.data, adv.manu_data, DATA_SAVE_LEN);

                        badge.rssi = p_gap_evt->params.adv_report.rssi;

                        addSeenBadge(badge);

                    }
                }
            }

            sd_ble_gap_scan_start(NULL, &m_scan_buffer);

            break;

        default:
            break;
    }

}



/**
 * @brief Function for the GAP initialization.
 *
 * @details This function sets up all the necessary GAP (Generic Access Profile) parameters of the
 *          device including the device name, appearance, and the preferred connection parameters.
 */
void gap_params_init(void){

    ble_gap_conn_params_t   gap_conn_params;
    ble_gap_conn_sec_mode_t sec_mode;

    // Set the connection mode
    // We're not actually offering any services, so this will
    // just trip up anyone connecting to us, for funsies.
    BLE_GAP_CONN_SEC_MODE_SET_OPEN(&sec_mode);

    // Set a default device short name
    // The app will probably override this pretty quickly
    sd_ble_gap_device_name_set(&sec_mode, (const uint8_t *)DEVICE_NAME, strlen(DEVICE_NAME));

    // Set our appearance as a DC29 badge
    sd_ble_gap_appearance_set(badgeYear_29);

    // Finally, setup the gap parameters for broadcast interval
    memset(&gap_conn_params, 0, sizeof(gap_conn_params));

    gap_conn_params.min_conn_interval = MIN_CONN_INTERVAL;
    gap_conn_params.max_conn_interval = MAX_CONN_INTERVAL;
    gap_conn_params.slave_latency     = SLAVE_LATENCY;
    gap_conn_params.conn_sup_timeout  = CONN_SUP_TIMEOUT;

    sd_ble_gap_ppcp_set(&gap_conn_params);

}


/**
 * @brief Function for initializing the Advertising functionality.
 *
 * @details Encodes the required advertising data and passes it to the stack.
 *          Also builds a structure to be passed to the stack when starting advertising.
 */
void ble_adv_init(void){

    sd_ble_gap_adv_stop(m_adv_handle);

    ble_advdata_t advdata;

	// Set the manufacturer data to be a DC801 badge
	ble_advdata_manuf_data_t manuf_specific_data;
	manuf_specific_data.company_identifier = APP_COMPANY_IDENTIFIER_DC801;
	manuf_specific_data.data.p_data = (uint8_t *) m_dc801_beacon_info;
	manuf_specific_data.data.size   = 8;

    memset(&advdata, 0, sizeof(advdata));

    advdata.name_type             = BLE_ADVDATA_FULL_NAME;
    advdata.short_name_len        = 8;
    advdata.include_appearance    = true;
    advdata.flags                 = BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE;
    advdata.p_manuf_specific_data = &manuf_specific_data;

    // Initialize advertising parameters (used when starting advertising).^M
    memset(&m_adv_params, 0, sizeof(m_adv_params));

    m_adv_params.properties.type = BLE_GAP_ADV_TYPE_NONCONNECTABLE_SCANNABLE_UNDIRECTED;
    m_adv_params.p_peer_addr     = NULL;    // Undirected advertisement.
    m_adv_params.filter_policy   = BLE_GAP_ADV_FP_ANY;
    m_adv_params.interval        = NON_CONNECTABLE_ADV_INTERVAL;
    m_adv_params.duration        = 0;       // Never time out.^M

    ble_advdata_encode(&advdata, m_adv_data.adv_data.p_data, &m_adv_data.adv_data.len);

    sd_ble_gap_adv_set_configure(&m_adv_handle, &m_adv_data, &m_adv_params);

}


/**
 * @brief Function for starting advertising.
*/
void ble_adv_start(void){

    sd_ble_gap_adv_start(m_adv_handle, APP_BLE_CONN_CFG_TAG);

    bsp_indication_set(BSP_INDICATE_ADVERTISING);

}


/**
 * @brief Function for initializing the BLE stack.
 *
 * @details Initializes the SoftDevice and the BLE event interrupt.
 */
void ble_stack_init(void){


    ret_code_t err_code;

    err_code = nrf_sdh_enable_request();
    APP_ERROR_CHECK(err_code);

    // Configure the BLE stack using the default settings.
    // Fetch the start address of the application RAM.
    uint32_t ram_start = 0;
    err_code = nrf_sdh_ble_default_cfg_set(APP_BLE_CONN_CFG_TAG, &ram_start);
    APP_ERROR_CHECK(err_code);

    // Enable BLE stack.
    err_code = nrf_sdh_ble_enable(&ram_start);
    APP_ERROR_CHECK(err_code);

    // Register a handler for BLE events.
    NRF_SDH_BLE_OBSERVER(m_ble_observer, APP_BLE_OBSERVER_PRIO, ble_evt_handler, NULL);


    app_timer_create(&ble_scan_timer, APP_TIMER_MODE_REPEATED, ble_scan_timeout_handler);
    app_timer_start(ble_scan_timer, DEFCON_BADGE_SCAN_INTERVAL, NULL);
}

/**
 * @brief Parse an advertisement packet
 */
bool parseAdvertisementData(uint8_t *data, uint8_t len, ADVERTISEMENT *adv){

	// Parse the data
	// The data is structured in blocks, each block starts with
	// the number of bytes in the block, then the block type, then the block data

	uint8_t data_left = len;
	uint8_t loc = 0;

	while(data_left > 0){

		uint8_t block_type = 0;
		uint8_t block_data[BLE_GAP_ADV_SET_DATA_SIZE_MAX];
		memset(block_data, 0, sizeof(block_data));

		uint8_t block_size = data[loc++];

		if(block_size > data_left){
			// Block is bigger than data left, that's not good
			return false;
		}

		uint8_t j = 0;
		for(int i = 0; i < block_size; i++){
			if(i == 0){
				block_type = data[loc];
			}
			else{
				block_data[j++] = data[loc+i];
			}
		}

		loc = loc + block_size;

		data_left = data_left - block_size - 1;

		// Figure out what to do with the block
		switch(block_type){
			case BLOCK_TYPE_APPEARANCE:
			{
				uint16_t id;
				id = ((uint16_t)block_data[1] << 8) | block_data[0];
				adv->appearance = id;
				//printf("Appearance %04X\n", adv->appearance);
				break;
			}
			case BLOCK_TYPE_MANU_INFO:
			{
				uint16_t id = ((uint16_t)block_data[1] << 8) | block_data[0];
				adv->manu = id;
                memset(adv->manu_data, 0, DATA_SAVE_LEN);
				memcpy(adv->manu_data, &block_data[2], MIN(13, block_size));
				//printf("Manu %04X\n", adv->manu);
				break;
			}
			case BLOCK_TYPE_LONG_NAME:
			{
				adv->long_name = (char *)block_data;
				adv->long_name_len = block_size;
				//printf("Long name %s\n", adv->long_name);
				break;
			}
			case BLOCK_TYPE_SHORT_NAME:
			{
				adv->short_name = (char *)block_data;
				adv->short_name_len = block_size;
                //printf("Short name %s\n", adv->short_name);
				break;
			}
		    default:
		        break;
		}
	}

	return true;

}


/**
 * @brief Update the advertised long name
 */
void advertising_setUser(char *user){

    ble_gap_conn_sec_mode_t sec_mode;

    BLE_GAP_CONN_SEC_MODE_SET_OPEN(&sec_mode);

#ifdef DEBUGMODE
    printf("Setting BLE name to: '%s'\n", user)
#endif
    // User name is always 10 chars
    sd_ble_gap_appearance_set(badgeYear_29);
    sd_ble_gap_device_name_set(&sec_mode, (const uint8_t *)user, 10);
    ble_adv_init();
    ble_adv_start();

}


#endif

/**
 * @param group we want info on
 * @return string, group name
 */
char* getBadgeGroupName(BADGE_GROUP group){

    for(int i = 0; i < NUM_BADGE_GROUPS; i++){
        if(badgeInfo[i].group == group || SWAP(badgeInfo[i].group) == group){
            return badgeInfo[i].name;
        }
    }

    return "Mystery Badge";

}


/**
 * Get the icon file for a given group
 * @param group badge group we want
 * @return a string that is the file name
 */
char* getBadgeIconFile(BADGE_GROUP group){

    for(int i = 0; i < NUM_BADGE_GROUPS; i++){
        if(badgeInfo[i].group == group || badgeInfo[i].group == SWAP(group)){
            return badgeInfo[i].icon;
        }
    }

    return NULL;

}


/**
 * Get the contact info for a given group
 * @param group badge group we want
 * @return a string that is the contact info
 */
char* getBadgeContact(BADGE_GROUP group){

    for(int i = 0; i < NUM_BADGE_GROUPS; i++){
        if(badgeInfo[i].group == group || badgeInfo[i].group == SWAP(group)){
            return badgeInfo[i].contact;
        }
    }

    return NULL;

}

/**
 * Get the appearance ID for a given group
 * @param group badge group we want
 * @return a 16 bit ID
 */
uint16_t getBadgeAppearance(BADGE_GROUP group){

    for(int i = 0; i < NUM_BADGE_GROUPS; i++){
        if(badgeInfo[i].group == group || badgeInfo[i].group == SWAP(group)){
            return badgeInfo[i].appearance;
        }
    }

    return 0;

}

#ifdef DC801_EMBEDDED

/**
 * Get the group from a given appearance
 * @param appearance to check
 * @return badge group enum
 */
BADGE_GROUP getBadgeGroupFromAppearance(uint16_t appearance) {

    for (int i = 0; i < NUM_BADGE_GROUPS; i++) {
        if (badgeInfo[i].appearance == appearance) {
            return badgeInfo[i].group;
        }
    }

    return badge_none;

}

#endif
