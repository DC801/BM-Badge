/**
 * \file
 *
 * \brief SLPCTRL related functionality implementation.
 *
 (c) 2020 Microchip Technology Inc. and its subsidiaries.

    Subject to your compliance with these terms,you may use this software and
    any derivatives exclusively with Microchip products.It is your responsibility
    to comply with third party license terms applicable to your use of third party
    software (including open source software) that may accompany Microchip software.

    THIS SOFTWARE IS SUPPLIED BY MICROCHIP "AS IS". NO WARRANTIES, WHETHER
    EXPRESS, IMPLIED OR STATUTORY, APPLY TO THIS SOFTWARE, INCLUDING ANY IMPLIED
    WARRANTIES OF NON-INFRINGEMENT, MERCHANTABILITY, AND FITNESS FOR A
    PARTICULAR PURPOSE.

    IN NO EVENT WILL MICROCHIP BE LIABLE FOR ANY INDIRECT, SPECIAL, PUNITIVE,
    INCIDENTAL OR CONSEQUENTIAL LOSS, DAMAGE, COST OR EXPENSE OF ANY KIND
    WHATSOEVER RELATED TO THE SOFTWARE, HOWEVER CAUSED, EVEN IF MICROCHIP HAS
    BEEN ADVISED OF THE POSSIBILITY OR THE DAMAGES ARE FORESEEABLE. TO THE
    FULLEST EXTENT ALLOWED BY LAW, MICROCHIP'S TOTAL LIABILITY ON ALL CLAIMS IN
    ANY WAY RELATED TO THIS SOFTWARE WILL NOT EXCEED THE AMOUNT OF FEES, IF ANY,
    THAT YOU HAVE PAID DIRECTLY TO MICROCHIP FOR THIS SOFTWARE.
 *
 */

/**
 * \defgroup doc_driver_system_slpctrl Sleep Controller
 * \ingroup doc_driver_system
 *
 * \section doc_driver_slpctrl_rev Revision History
 * - v0.0.0.1 Initial Commit
 *
 *@{
 */
#include <slpctrl.h>

/**
 * \brief Initialize Sleep Controller
 *
 * \return Initialization status.
 */
int8_t SLPCTRL_init()
{

	// SLPCTRL.CTRLA = 0 << SLPCTRL_SEN_bp /* Sleep enable: disabled */
	//		 | SLPCTRL_SMODE_IDLE_gc; /* Idle mode */

	return 0;
}

void SLPCTRL_set_sleep_mode(SLPCTRL_SMODE_t setmode)
{
	SLPCTRL.CTRLA = (SLPCTRL.CTRLA & ~SLPCTRL_SMODE_gm) | (setmode & SLPCTRL_SMODE_gm);
}
