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

audio_engine_callback audio_callback;

void nau8810_next(const uint32_t *data);
struct __nau8810_state nau8810_state = {
	.ctr = 1
};
static void i2sDataHandler(nrf_drv_i2s_buffers_t const * p_released,
                           uint32_t status)
{
	if(status & NRFX_I2S_STATUS_NEXT_BUFFERS_NEEDED)
	{
		// Callback will call nau8810_next
		audio_callback(p_released, status);
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

void nau8810_start(const uint32_t *data, uint16_t length);
void nau8810_init(audio_engine_callback callback)
{
	audio_callback = callback;

	/*
	Powerup sequence

	RESET           = 0x00;  // Software Reset NAU8810
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
	AIFMT           = 0x02;	 // Set mode to be I2S
	WLEN            = 0x00;	 // Set sample width to be 16 bits
	*/

	// TWI already initialized in i2c.c so
	// no need to initialize it here!
	
	// Reset NAU8810. Any value can be written.
	// nau8810_twi_write(NAU8810_REG_RESET, 0);

	// Enable 80k reference impedance, i/o buffers, and analog amplifier bias control
	nau8810_twi_write(NAU8810_REG_POWER1, (
		NAU8810_REFIMP_80K 
		| NAU8810_IOBUF_EN 
		| NAU8810_ABIAS_EN
	));
	// Set internal clock source to bypass PLL for receiver mode and MCKSEL to div2
	// Set slave mode because we'll be generating SCK and LRCK
	nau8810_twi_write(NAU8810_REG_CLOCK, NAU8810_CLKIO_SLAVE);
	// Enable DAC output, speaker mixer, speaker drivers, and leave mic disabled
	nau8810_twi_write(NAU8810_REG_POWER3, (
		NAU8810_DAC_EN 
		| NAU8810_SPKMX_EN 
		| NAU8810_PSPK_EN 
		| NAU8810_NSPK_EN
	));
	// Set desired sample rate to 32kHz
	// and real sample rate to PLL output
	// If you change the sample rate here,
	// you should also change it in EngineAudio.cpp
	nau8810_twi_write(NAU8810_REG_SMPLR, NAU8810_SMPLR_32K | NAU8810_SMPLR_SCLKEN);

	// Set speaker gain
	nau8810_twi_write(NAU8810_REG_SPKGAIN, 0x3f);

	// Set mode to I2S and sample width to be 16 bits
	nau8810_twi_write(NAU8810_REG_IFACE, NAU8810_AIFMT_I2S | NAU8810_WLEN_16);

	// Initialize NAU8810 I2S instance
	#ifdef DC801_EMBEDDED
	ret_code_t err_code;
	nrf_drv_i2s_config_t config = NRFX_I2S_DEFAULT_CONFIG;

	// ... I really hate this chip.
	// So the NAU8810 has an IMCLK derived from MCLK.
	// This IMCLK must be about 256 * LRCK or else the 
	// ADC and DAC converters screw up.
	//
	// This means you should use either use
	// a ratio of 256 or use a ratio close to that
	// and then work out the PLL math. Note that,
	// With PLL, no ratio below 96 can be used.
	//
	// LRCK = Sample Rate = MCLK / RATIO
	// SCK = 2 * SWIDTH * LRCK (L + R Audio Data)
	//
	// In terms of our program:
	//   MCLK = 32 / 8 mHz 
	//   LRCK = MCLK / 256 = (16 kHz)
	//   SCK = 32 * LRCK = (2 * 16 * 32 kHz)
	config.mck_setup = NRF_I2S_MCK_32MDIV8;
	config.ratio     = NRF_I2S_RATIO_256X;

	// Use only the left channel.
	// We'd like to use stereo but the NAU8810 chip
	// can only take audio in the left channel, so
	// configure I2S to use that instead.
	config.channels = NRF_I2S_CHANNELS_LEFT;

	// Use 16-bit samples.
	config.sample_width = NRF_I2S_SWIDTH_16BIT;

	err_code = nrf_drv_i2s_init(&config, i2sDataHandler);
	if (err_code != NRF_SUCCESS)
	{
		// Initialization failed. Take recovery action.
		ENGINE_PANIC("I2S Init Failed");
	}
	#endif

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
