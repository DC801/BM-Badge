#include <common.h>
#include "drv_nau8810.h"
#include "drv_nau8810_i2s_params.h"
#include "EnginePanic.h"

#ifdef DC801_EMBEDDED
#include <nrfx_i2s.h>
#include <nrf_drv_i2s.h>
#include <math.h>

#define NAU8810_ADDRESS		0x1a

// Fun Fact:
//
// The PLL will not work for low LRCK speeds
// because f2 would be way below optimal
// frequencies after doing the PLL math
//
// Therefore, if you want to use a sample rate
// of 15.625 kHz or less, comment out the below 
// preprocessor macro. Otherwise, uncomment it.
// Just remember that you might have to increase
// the sample rate a lot to get PLL to work...
//
// Remember that, when not using the PLL, you need
// to force the ratio to be 256. This can be done
// by calling tools/i2s.py with the following arguments.
//
// tools/i2s.py --ratio 256 <SampleRate>
//
// If you fail to do this, the engine will panic
// and tell you that this is the problem.
//
// #define NAU8810_USE_PLL

static audio_engine_callback audio_callback;
const unsigned int nau8810_lrck = DRV_NAU8810_LRCK;

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
	uint8_t buffer[] =
	{
		(address << 1) | (uint8_t)((value >> 8) & 0x01),
		(uint8_t)value
	};

	i2si2cMasterTransmit(NAU8810_ADDRESS, buffer, sizeof(buffer));
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
	DACEN		= 0x01;	 // Enable DAC output
	ADCEN		= 0x00;	 // Leave ADC disabled
	SPKMXEN		= 0x01;	 // Enable speaker mixer
	MOUTMXEN	= 0x00;	 // Leave mono mixer disabled
	MOUTEN		= 0x00;	 // Leave mono output disabled
	NSPKEN		= 0x01;	 // Enable negative side speaker driver
	PSPKEN		= 0x01;	 // Enable positive side speakre driver
	SMPLR		= 0x00;	 // 16kHz sample rate filter
	DACMT		= 0x00;	 // Disable DAC soft mute						(default)
	AIFMT           = 0x02;	 // Set mode to be I2S
	WLEN            = 0x00;	 // Set sample width to be 16 bits
				 //
				 // If PLL is used, use values from tools/i2s.py
	PLLN            = ????;
	PLLMCLK         = ????;
	PLLK            = ????;
	MCLKSEL         = ????;
	PLLEN           = 0x01;
	CLKM            = 0x01;
	*/

	// Enable 80k reference impedance, i/o buffers, and analog amplifier bias control
	int power = NAU8810_REFIMP_80K | NAU8810_IOBUF_EN | NAU8810_ABIAS_EN;
	// Set internal clock source to bypass PLL for receiver mode and MCKSEL to div2
	// Set slave mode because we'll be generating SCK and LRCK
	int clk = NAU8810_CLKIO_SLAVE;
	// If PLL is used, set the PLL params related to clock and power.
	// Otherwise, verify that ratio is 256 because NAU8810 requires this
	// when MCLK is used instead of PLL output.
#ifdef NAU8810_USE_PLL
	power |= NAU8810_PLL_EN;
	clk |= NAU8810_CLKM_PLL | (DRV_NAU8810_MCLKSEL << NAU8810_MCLKSEL_SFT);
#else
	if (DRV_NAU8810_RATIO != NRF_I2S_RATIO_256X)
	{
		ENGINE_PANIC(
			"PLL is not used and I2S LRCK ratio != 256!\n"
			"DRV_NAU8810_RATIO = 0x%08x\n",
			DRV_NAU8810_RATIO);
	}
#endif
	// TWI already initialized in i2c.c so
	// no need to initialize it here!
	// Reset NAU8810. Any value can be written.
	nau8810_twi_write(NAU8810_REG_RESET, 0);
	nau8810_twi_write(NAU8810_REG_POWER1, power);
	nau8810_twi_write(NAU8810_REG_CLOCK, clk);
	// Enable DAC output, speaker mixer, speaker drivers, and leave mic disabled
	nau8810_twi_write(NAU8810_REG_POWER3, (
		NAU8810_DAC_EN 
		| NAU8810_SPKMX_EN 
		| NAU8810_PSPK_EN 
		| NAU8810_NSPK_EN
	));
	// Set desired sample rate to 32kHz
	// and IMCLK = MCLK
	// If you change the sample rate here,
	// you should also change it in EngineAudio.cpp
	nau8810_twi_write(NAU8810_REG_SMPLR, NAU8810_SMPLR_16K);

	// Set speaker gain
	nau8810_twi_write(NAU8810_REG_SPKGAIN, 0x3f);

	// Set mode to I2S and sample width to be 16 bits
	nau8810_twi_write(NAU8810_REG_IFACE, NAU8810_AIFMT_I2S | NAU8810_WLEN_16);

	// If PLL is used, set rest of PLL params
#ifdef NAU8810_USE_PLL
	nau8810_twi_write(NAU8810_REG_PLLN, DRV_NAU8810_PLLN | (DRV_NAU8810_PLLM << NAU8810_PLLMCLK_SFT));
	nau8810_twi_write(NAU8810_REG_PLLK1, DRV_NAU8810_PLLK1);
	nau8810_twi_write(NAU8810_REG_PLLK2, DRV_NAU8810_PLLK2);
	nau8810_twi_write(NAU8810_REG_PLLK3, DRV_NAU8810_PLLK3);
#endif


	// Initialize NAU8810 I2S instance
	ret_code_t err_code;
	nrf_drv_i2s_config_t config = NRFX_I2S_DEFAULT_CONFIG;

	// ... I really hate this chip.
	// So the NAU8810 has an IMCLK derived from MCLK.
	// This IMCLK must be about 256 * LRCK or else the 
	// ADC and DAC converters screw up.
	//
	// So we set a generated MCK and ratio to make NAU8810
	// happy. We use the PLL to tweak IMCLK if we need it,
	// or we use a ratio of 256 if we don't want PLL. 
	config.mck_setup = DRV_NAU8810_MCK;
	config.ratio     = DRV_NAU8810_RATIO;

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
