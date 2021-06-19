/**
 * \file
 *
 * \brief BOD related functionality implementation.
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
 * \defgroup doc_driver_system_bod Brown-Out Detector (BOD)
 * \ingroup doc_driver_system
 *
 * \section doc_driver_bod_rev Revision History
 * - v0.0.0.1 Initial Commit
 *
 *@{
 */
#include <bod.h>
#include <ccp.h>

/**
 * \brief Initialize Brownout Detector
 *
 * \return Initialization status.
 */
int8_t BOD_init()
{

	// ccp_write_io((void*)&(BOD.CTRLA),BOD_SLEEP_DIS_gc /* Disabled */);

	// BOD.INTCTRL = 0 << BOD_VLMIE_bp /* voltage level monitor interrrupt enable: disabled */
	//		 | BOD_VLMCFG_BELOW_gc; /* Interrupt when supply goes below VLM level */

	// BOD.VLMCTRLA = BOD_VLMLVL_5ABOVE_gc; /* VLM threshold 5% above BOD level */

	return 0;
}
