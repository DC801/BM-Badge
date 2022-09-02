#ifndef SHIM_TIMER_H
#define SHIM_TIMER_H

#include <stdint.h>



#define TIMER1_CC_NUM 4

enum {
//    NRFX_TIMER0_INST_IDX,
    NRFX_TIMER1_INST_IDX,
//    NRFX_TIMER2_INST_IDX,
//    NRFX_TIMER3_INST_IDX,
//    NRFX_TIMER4_INST_IDX,
    NRFX_TIMER_ENABLED_COUNT
};

typedef void (*app_timer_timeout_handler_t)(void * p_context);

typedef enum
{
    APP_TIMER_MODE_SINGLE_SHOT,                // The timer will expire only once.
    APP_TIMER_MODE_REPEATED                    // The timer will restart each time it expires
} app_timer_mode_t;

typedef struct
{
    uint32_t                    ticks_to_expire;                            /**< Number of ticks from previous timer interrupt to timer expiry. */
    uint32_t                    ticks_at_start;                             /**< Current RTC counter value when the timer was started. */
    uint32_t                    ticks_first_interval;                       /**< Number of ticks in the first timer interval. */
    uint32_t                    ticks_periodic_interval;                    /**< Timer period (for repeating timers). */
    bool                        is_running;                                 /**< True if timer is running, False otherwise. */
    app_timer_mode_t            mode;                                       /**< Timer mode. */
    app_timer_timeout_handler_t p_timeout_handler;                          /**< Pointer to function to be executed when the timer expires. */
} app_timer_t;

typedef app_timer_t * app_timer_id_t;

#define CONCAT_2(p1, p2)      CONCAT_2_(p1, p2)
#define CONCAT_2_(p1, p2)     p1##p2

#define CONCAT_3(p1, p2, p3)  CONCAT_3_(p1, p2, p3)
#define CONCAT_3_(p1, p2, p3) p1##p2##p3

// static app_timer_t standby_animation_timer_id_data = { 0 };
// static const app_timer_id_t standby_animation_timer_id = standby_animation_timer_id_data;

#define APP_TIMER_DEF(timer_id)                                      \
    static app_timer_t CONCAT_2(timer_id,_data) = { 0 };             \
    static const app_timer_id_t timer_id = &CONCAT_2(timer_id,_data)

#define NRF_TIMER_CC_CHANNEL_COUNT(id)  CONCAT_3(TIMER, id, _CC_NUM)

#define ROUNDED_DIV(A, B) (((A) + ((B) / 2)) / (B))
#define APP_TIMER_CLOCK_FREQ            32768
#define APP_TIMER_TICKS(MS) (uint32_t)((uint32_t)ROUNDED_DIV((MS) * (uint64_t)APP_TIMER_CLOCK_FREQ, 1000))

#define NRF_DRV_TIMER_INSTANCE(id)                           \
{                                                            \
    CONCAT_2(NRF_TIMER, id),             \
    CONCAT_3(NRFX_TIMER, id, _INST_IDX), \
    NRF_TIMER_CC_CHANNEL_COUNT(id),      \
}

typedef struct {                 /*!< (@ 0x40008000) TIMER0 Structure                                               */
    uint32_t  TASKS_START;       /*!< (@ 0x00000000) Start Timer                                                    */
    uint32_t  TASKS_STOP;        /*!< (@ 0x00000004) Stop Timer                                                     */
    uint32_t  TASKS_COUNT;       /*!< (@ 0x00000008) Increment Timer (Counter mode only)                            */
    uint32_t  TASKS_CLEAR;       /*!< (@ 0x0000000C) Clear time                                                     */
    uint32_t  TASKS_SHUTDOWN;    /*!< (@ 0x00000010) Deprecated register - Shut down timer                          */
    uint32_t  TASKS_CAPTURE[6];  /*!< (@ 0x00000040) Description collection: Capture Timer value to  CC[n] register */
    uint32_t  EVENTS_COMPARE[6]; /*!< (@ 0x00000140) Description collection: Compare event on CC[n] match           */
    uint32_t  SHORTS;            /*!< (@ 0x00000200) Shortcuts between local events and tasks                       */
    uint32_t  INTENSET;          /*!< (@ 0x00000304) Enable interrupt                                               */
    uint32_t  INTENCLR;          /*!< (@ 0x00000308) Disable interrupt                                              */
    uint32_t  MODE;              /*!< (@ 0x00000504) Timer mode selection                                           */
    uint32_t  BITMODE;           /*!< (@ 0x00000508) Configure the number of bits used by the TIMER                 */
    uint32_t  PRESCALER;         /*!< (@ 0x00000510) Timer prescaler register                                       */
    uint32_t  CC[6];             /*!< (@ 0x00000540) Description collection: Capture/Compare register n             */
} NRF_TIMER_Type;                /*!< Size = 1368 (0x558)                                                           */

typedef struct
{
    NRF_TIMER_Type * p_reg;            ///< Pointer to the structure with TIMER peripheral instance registers.
    uint8_t          instance_id;      ///< Index of the driver instance. For internal use only.
    uint8_t          cc_channel_count; ///< Number of capture/compare channels.
} nrf_drv_timer_t;


extern NRF_TIMER_Type* NRF_TIMER1;

typedef uint32_t ret_code_t;
ret_code_t app_timer_init(void);
ret_code_t app_timer_create(app_timer_id_t const *p_timer_id, app_timer_mode_t mode, app_timer_timeout_handler_t timeout_handler);
ret_code_t app_timer_start(app_timer_id_t timer_id, uint32_t timeout_ticks, void *p_context);
ret_code_t app_timer_stop(app_timer_id_t timer_id);

uint32_t app_timer_cnt_get(void);

void nrf_delay_us(uint32_t time_us);
void nrf_delay_ms(uint32_t time_ms);



#endif
