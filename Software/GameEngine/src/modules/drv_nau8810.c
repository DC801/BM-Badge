#include <common.h>
#include "drv_nau8810.h"
#include "EnginePanic.h"

#ifdef DC801_EMBEDDED
#include <nrfx_i2s.h>
#include <nrf_drv_i2s.h>
#include <math.h>

#endif


/*

Example PLL calculation

Fdac		= 48kHz
F256fs		= 49.152MHz
F256fsPre	= 98.304MHz <- div2 prescaler
Fmclk		= 12MHz

R	= 49.152MHz / 12MHz = 4.096 <- R must be between 6 and 12
Rpre = 98.304MHz / 12MHz = 8.192
N						= 8
K						= (2^24)(0.192)
						 = 3221225.472
						 = 3221225
						 = 0x3126E9

PLLK					 = 0C 93 E9

							 00001100   10010011 11101001
							000001100 010010011 011101001
							 00110001  00100110  11101001

PLLK					 = 0x3126E9

PLL_N_CTRL = PLLMCLK | 8; // Enable MCLK div2, N = 8
PLL_K_1 = 0x0C;
PLL_K_2 = 0x93;
PLL_K_3 = 0xE9;

PLLK Calculation

PLLK[ 8: 0] = K & 0x1FF;			// 9 bits
PLLK[17: 9] = (K >> 9) & 0x1FF;		// 9 bits
PLLK[32:18] = (K >> 18) & 0x3F;		// 6 bits

>>> K = 0x3126E9
>>> PLLa = K & 0x1FF
>>> PLLb = (K >> 9) & 0x1FF
>>> PLLc = (K >> 18) & 0x3F
>>> print(f'0x{K:06X}: {PLLc:02X} {PLLb:03X} {PLLa:03X}')
0x3126E9: 0C 093 0E9



Desired PLL calculation (16MHz)

Fdac		= 48kHz
F256fs		= 49.152MHz
F256fsPre	= 98.305MHz
Fmclk		= 16MHz

R	= 49.152MHz / 16MHz = 3.072
Rpre = 98.304MHz / 16MHz = 6.144
N						= 6
K						= (2^24)(0.144)
						= 2415919.104
						= 2415919
						= 0x24DD2F

>>> K = 0x24DD2F
0x24DD2F: 09 06E 12F

*/

#ifdef DC801_EMBEDDED


#define NAU8810_ADDRESS		0x1a

#define NAU8810_PLLN		6
#define NAU8810_PLLK0		0x0009	// 9-bit values
#define NAU8810_PLLK1		0x006E
#define NAU8810_PLLK2		0x012F

#define I2S_SDIN_M			NRFX_I2S_PIN_NOT_USED
#define I2S_PRIORITY_M		NRFX_I2S_CONFIG_IRQ_PRIORITY
#define I2S_MODE_M			NRF_I2S_MODE_MASTER
#define I2S_FORMAT_M		NRF_I2S_FORMAT_I2S
#define I2S_ALIGN_M	 		NRF_I2S_ALIGN_LEFT
#define I2S_WIDTH_M	 		NRF_I2S_SWIDTH_16BIT
#define I2S_CHANNEL_M		NRF_I2S_CHANNELS_RIGHT
#define I2S_MCKSETUP_M		NRF_I2S_MCK_32MDIV8				// 16MHz Master clock
#define I2S_RATIO_M			NRF_I2S_RATIO_128X				// 31.25kHz LRCLK

#define DMA_NUMBER_OF_WORDS 256
#define DMA_NUMBER_OF_BUFFERS 4
static int curr_buffer = 0;
static uint32_t dma_data[DMA_NUMBER_OF_BUFFERS][DMA_NUMBER_OF_WORDS];
//static const nrf_drv_twi_t m_twi_master = NRF_DRV_TWI_INSTANCE(I2S_TWI_INST);

audio_engine_callback audio_callback;

#if 0
static void i2sDataHandler(uint32_t const * p_data_received,
						   uint32_t       * p_data_to_send,
						   uint16_t         number_of_words)
{
	if (p_data_received != NULL)
	{
		// Process the received data.
	}
	if (p_data_to_send != NULL)
	{
		// Provide the data to be sent.
	}
}
#endif

void nau8810_next(const uint32_t *data);
struct __nau8810_state nau8810_state = {
	.ctr = 1
};
static void i2sDataHandler(nrf_drv_i2s_buffers_t const * p_released,
                           uint32_t status)
{
	// if(status != NRF_SUCCESS) ENGINE_PANIC("AHHHHh");
	if(p_released->p_rx_buffer)
	{
		// Process received data
	}
	if(p_released->p_tx_buffer)
	{
		// Process sent data
	}

	if(status & NRFX_I2S_STATUS_NEXT_BUFFERS_NEEDED)
	{
		// audio_callback(p_released, status);
	}
}

void nau8810_twi_init(void)
{
//	const nrf_drv_twi_config_t config =
//	{
//		.scl				= I2S_SCL_M,
//		.sda				= I2S_SDA_M,
//		.frequency			= NRF_DRV_TWI_FREQ_400K,
//		.interrupt_priority = APP_IRQ_PRIORITY_HIGH,
//		.clear_bus_init		= false
//	};
//
//	if (NRF_SUCCESS == nrf_drv_twi_init(&m_twi_master, &config, NULL, NULL))
//	{
//		nrf_drv_twi_enable(&m_twi_master);
//	}
#if 0
	uint32_t err_code;
	nrf_drv_i2s_config_t config = NRFX_I2S_DEFAULT_CONFIG;
	config.mck_setup = NRF_I2S_MCK_32MDIV21;
	config.ratio     = NRF_I2S_RATIO_96X;
	err_code = nrf_drv_i2s_init(&config, i2sDataHandler);
	if (err_code != NRF_SUCCESS)
	{
		// Initialization failed. Take recovery action.
		ENGINE_PANIC("I2S Init Failed");
	}
#endif

	//TODO: Figure out how to send to and read from the chip over its i2c interface
	//init NAU8810 Via TWI:
	uint8_t device_id[20];
	for(int i=0; i<20; i++) {
		device_id[i] = 0;
	}

	//Read from I2S I2C a device id:
	i2si2cMasterRead(NAU8810_ADDRESS, device_id, 20);
	for(int i=0; i<20; i++){
		if(device_id[i]){
			ENGINE_PANIC("Device ID: %d, i=%d", device_id[i], i);
		}
	}
}

void nau8810_twi_write(uint8_t address, uint16_t value)
{
	#ifdef DC801_EMBEDDED
	uint8_t buffer[] =
	{
		(address << 1) | (uint8_t)((value >> 7) & 0x01),
		(uint8_t)value
	};

	i2si2cMasterTransmit(NAU8810_ADDRESS, buffer, sizeof(buffer));
	#endif
}

uint16_t nau8810_twi_read(uint8_t address)
{
	uint16_t retval = 0;
	uint8_t *p = (uint8_t *)&retval;

	uint8_t buffer[] =
	{
		(address << 1)
	};

	// Setup for transfer followed by read with no STOP condition in between
	nrf_drv_twi_xfer_desc_t desc =
	{
		.type = NRF_DRV_TWI_XFER_TXRX,
		.address = NAU8810_ADDRESS,
		.primary_length = 1,
		.secondary_length = sizeof(retval),
		.p_primary_buf = buffer,
		.p_secondary_buf = p
	};

	i2si2cMasterTransfer(&desc, 0);

	return retval;
}


void nau8810_i2s_init(nrfx_i2s_data_handler_t handler)
{
	#ifdef DC801_EMBEDDED
	// We work with 16-bit signed PCM data
	// with a sample rate of 48 kHZ
	ret_code_t err_code;
	nrf_drv_i2s_config_t config = NRFX_I2S_DEFAULT_CONFIG;
	config.mck_setup = NRF_I2S_MCK_32MDIV8;
	config.ratio     = NRF_I2S_RATIO_256X;
	config.channels = NRF_I2S_CHANNELS_STEREO;
	config.sample_width = NRF_I2S_SWIDTH_16BIT;
	err_code = nrf_drv_i2s_init(&config, handler);
	if (err_code != NRF_SUCCESS)
	{
		// Initialization failed. Take recovery action.
		ENGINE_PANIC("I2S Init Failed");
	}
	#endif
}

void nau8810_start(const uint32_t *data, uint16_t length);
void nau8810_init(audio_engine_callback callback)
{
	audio_callback = callback;
	// TWI already initialized in i2c.c at twi_master_init
    // Initialize NAU8810 I2C instance
    // nau8810_twi_init();

    /*

    Powerup sequence

    SPKBST		= 0x00;	 // Disable speaker boost (3.3v) 				(default)
    MOUTBST		= 0x00;	 // Disable mic boost (3.3v)					(default)
    REFIMP		= 0x01;	 // 80k ohm ramp rate, mid ground ramp/PSRR
    ABIASEN		= 0x01;	 // Enable analog amplifiers
    IOBUFEN		= 0x01;	 // Enable IO buffers
    CLKIOEN		= 0x00;	 // Configure receiver mode
    BCLKSEL		= 0x00;	 // Bit clock = Master clock
    MCLKSEL		= 0x00;	 // No Master clock divider
    DACEN		= 0x01;	 // Enable DAC output
    ADCEN		= 0x00;	 // Leave ADC disabled
    SPKMXEN		= 0x01;	 // Enable speaker mixer
    MOUTMXEN	= 0x00;	 // Leave mono mixer disabled
    MOUTEN		= 0x00;	 // Leave mono output disabled
    NSPKEN		= 0x01;	 // Enable negative side speaker driver
    PSPKEN		= 0x01;	 // Enable positive side speakre driver
    SMPLR		= 0x01;	 // 32kHz sample rate filter
    DACMT		= 0x00;	 // Disable DAC soft mute						(default)

    */

    // Enable 80k reference impedance, i/o buffers, and analog amplifier bias control
    nau8810_twi_write(NAU8810_REG_POWER1, (
		NAU8810_REFIMP_80K 
		| NAU8810_IOBUF_EN 
		| NAU8810_ABIAS_EN
	));
    // Set internal clock source to bypass PLL for receiver mode and MCKSEL to div2
    nau8810_twi_write(NAU8810_REG_CLOCK, NAU8810_CLKIO_MASTER);
    // Enable DAC output, speaker mixer, speaker drivers, and leave mic disabled
    nau8810_twi_write(NAU8810_REG_POWER3, (
		NAU8810_DAC_EN 
		| NAU8810_SPKMX_EN 
		| NAU8810_PSPK_EN 
		| NAU8810_NSPK_EN
	));
    // Set sample rate filter to 32kHz
    nau8810_twi_write(NAU8810_REG_SMPLR, NAU8810_SMPLR_32K);

	// Set speaker gain
	nau8810_twi_write(NAU8810_REG_SPKGAIN, 0x3f);


    // Initialize NAU8810 I2S instance
    nau8810_i2s_init(i2sDataHandler);

    // Set PLL? Maybe later...
}

void nau8810_start(const uint32_t *data, uint16_t length)
{
	nrf_drv_i2s_buffers_t buffers =
	{
		.p_rx_buffer = NULL,
		.p_tx_buffer = data
	};
	ret_code_t err = nrf_drv_i2s_start(&buffers, length, 0);
	if(err != NRF_SUCCESS) ENGINE_PANIC("Failed to start I2S");
}

void nau8810_next(const uint32_t *data)
{
	nrf_drv_i2s_buffers_t buffers =
	{
		.p_rx_buffer = NULL,
		.p_tx_buffer = data
	};

	ret_code_t err = nrf_drv_i2s_next_buffers_set(&buffers);
	if(err != NRF_SUCCESS) ENGINE_PANIC("Failed to set next buffers");
}

void nau8810_stop(void)
{
	nrf_drv_i2s_stop();
}
#endif
