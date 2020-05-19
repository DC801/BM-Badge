//
// Created by dvdfreitag on 5/13/20
//

#ifndef I2S_H
#define I2S_H

void i2s_master_init(void);

// I2S Default config
// NRFX_I2S_DEFAULT_CONFIG = {
//     .sck_pin      = NRFX_I2S_CONFIG_SCK_PIN,
//     .lrck_pin     = NRFX_I2S_CONFIG_LRCK_PIN,
//     .mck_pin      = NRFX_I2S_CONFIG_MCK_PIN,
//     .sdout_pin    = NRFX_I2S_CONFIG_SDOUT_PIN,
//     .sdin_pin     = NRFX_I2S_CONFIG_SDIN_PIN,
//     .irq_priority = NRFX_I2S_CONFIG_IRQ_PRIORITY,
//     .mode         = (nrf_i2s_mode_t)NRFX_I2S_CONFIG_MASTER,
//     .format       = (nrf_i2s_format_t)NRFX_I2S_CONFIG_FORMAT,
//     .alignment    = (nrf_i2s_align_t)NRFX_I2S_CONFIG_ALIGN,
//     .sample_width = (nrf_i2s_swidth_t)NRFX_I2S_CONFIG_SWIDTH,
//     .channels     = (nrf_i2s_channels_t)NRFX_I2S_CONFIG_CHANNELS,
//     .mck_setup    = (nrf_i2s_mck_t)NRFX_I2S_CONFIG_MCK_SETUP,
//     .ratio        = (nrf_i2s_ratio_t)NRFX_I2S_CONFIG_RATIO,
// }

#define I2S_SCK_M       20
#define I2S_LRCK_M      22
#define I2S_MCK_M       19
#define I2S_SDOUT_M     23
#define I2S_SDIN_M      NRFX_I2S_PIN_NOT_USED
#define I2S_PRIORITY_M  NRFX_I2S_CONFIG_IRQ_PRIORITY
#define I2S_MODE_M      NRF_I2S_MODE_MASTER
#define I2S_FORMAT_M    NRF_I2S_FORMAT_I2S
#define I2S_ALIGN_M     NRF_I2S_ALIGN_LEFT
#define I2S_WIDTH_M     NRF_I2S_SWIDTH_16BIT
#define I2S_CHANNEL_M   NRF_I2S_CHANNELS_RIGHT
#define I2S_MCKSETUP_M  NRF_I2S_MCK_32MDIV8     // 16MHz Master clock
#define I2S_RATIO_M     NRF_I2S_RATIO_128X      // 31.25kHz LRCLK

/*

Example PLL calculation

Fdac        = 48kHz
F256fs      = 49.152MHz
F256fsPre   = 98.304MHz <- div2 prescaler
Fmclk       = 12MHz

R    = 49.152MHz / 12MHz = 4.096 <- R must be between 6 and 12
Rpre = 98.304MHz / 12MHz = 8.192
N                        = 8
K                        = (2^24)(0.192)
                         = 3221225.472
                         = 3221225
                         = 0x3126E9

PLLK                     = 0C 93 E9

                            00001100  10010011  11101001
                           000001100 010010011 011101001
                            00110001  00100110  11101001

PLLK                     = 0x3126E9

PLL_N_CTRL = PLLMCLK | 8; // Enable MCLK div2, N = 8
PLL_K_1 = 0x0C;
PLL_K_2 = 0x93;
PLL_K_3 = 0xE9;



PLLK Calculation

PLLK[ 8: 0] = K & 0x1FF;            // 9 bits
PLLK[17: 9] = (K >> 9) & 0x1FF;     // 9 bits
PLLK[32:18] = (K >> 18) & 0x3F;     // 6 bits

>>> K = 0x3126E9
>>> PLLa = K & 0x1FF
>>> PLLb = (K >> 9) & 0x1FF
>>> PLLc = (K >> 18) & 0x3F
>>> print(f'0x{K:06X}: {PLLc:02X} {PLLb:03X} {PLLa:03X}')
0x3126E9: 0C 093 0E9



Desired PLL calculation (16MHz)

Fdac        = 48kHz
F256fs      = 49.152MHz
F256fsPre   = 98.305MHz
Fmclk       = 16MHz

R    = 49.152MHz / 16MHz = 3.072
Rpre = 98.304MHz / 16MHz = 6.144
N                        = 6
K                        = (2^24)(0.144)
                         = 2415919.104
                         = 2415919
                         = 0x24DD2F

>>> K = 0x24DD2F
>>> print(f'0x{K:06X}: {PLLc:02X} {PLLb:03X} {PLLa:03X}')
0x24DD2F: 09 06E 12F



Powerup sequence

SPKBST      = 0x00;     // Disable speaker boost (3.3v)
MOUTBST     = 0x00;     // Disable mic boost (3.3v)
REFIMP      = 0x01;     // 80k ohm ramp rate, mid ground ramp/PSRR
ABIASEN     = 0x01;     // Enable analog amplifiers
IOBUFEN     = 0x01;     // Enable IO buffers
CLKIOEN     = 0x00;     // Configure receiver mode
BCLKSEL     = 0x00;     // Bit clock = Master clock
MCLKSEL     = 0x00;     // No Master clock divider
PLLEN       = 0x01;     // Enable PLL
DACEN       = 0x01;     // Enable DAC output
ADCEN       = 0x00;     // Leave ADC disabled
SPKMXEN     = 0x01;     // Enable speaker mixer
MOUTMXEN    = 0x00;     // Leave mono mixer disabled
MOUTEN      = 0x00;     // Leave mono output disabled
NSPKEN      = 0x01;     // Enable negative side speaker driver
PSPKEN      = 0x01;     // Enable positive side speakre driver
SMPLR       = 0x01;     // 32kHz sample rate filter
DACMT       = 0x00;     // Disable DAC soft mute

*/






#endif
