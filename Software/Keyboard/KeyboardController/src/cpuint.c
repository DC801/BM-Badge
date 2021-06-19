/**
 * \file
 *
 * \brief CPUINT related functionality implementation.
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
 * \defgroup doc_driver_system_cpuint CPU Interrupt Controller
 * \ingroup doc_driver_system
 *
 * \section doc_driver_cpuint_rev Revision History
 * - v0.0.0.1 Initial Commit
 *
 *@{
 */
#include <compiler.h>
#include <cpuint.h>
#include <ccp.h>
#include <atomic.h>
/**
 * \brief Initialize cpuint interface
 *
 * \return Initialization status
 */
int8_t CPUINT_init()
{

	/* IVSEL and CVT are Configuration Change Protected */

	// ccp_write_io((void*)&(CPUINT.CTRLA),0 << CPUINT_CVT_bp /* Compact Vector Table: disabled */
	//		 | 0 << CPUINT_IVSEL_bp /* Interrupt Vector Select: disabled */
	//		 | 0 << CPUINT_LVL0RR_bp /* Round-robin Scheduling Enable: disabled */);

	// CPUINT.LVL0PRI = 0x0 << CPUINT_LVL0PRI_gp; /* Interrupt Level Priority: 0x0 */

	// CPUINT.LVL1VEC = 0x0 << CPUINT_LVL1VEC_gp; /* Interrupt Vector with High Priority: 0x0 */

	ENABLE_INTERRUPTS();

	return 0;
}
