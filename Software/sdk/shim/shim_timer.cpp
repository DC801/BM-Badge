#include "sdk_shim.h"

#include <atomic>
#include <chrono>
#include <list>
#include <mutex>
#include <thread>

#include <csignal>
#include <cstdio>
#include <cstdlib>

// TODO: Implement this shit

class timer_manager
{
private:
    const double interval;
    std::list<app_timer_t*> timers;
    std::mutex timers_mutex;
    std::atomic<bool> running;
    std::thread runner;
public:
    timer_manager();
    ~timer_manager();

    void worker();
    bool timer_exists(app_timer_t *timer);
    void add_timer(app_timer_t *timer);
    void kill();
};

timer_manager::timer_manager() : interval{1.0 / APP_TIMER_CLOCK_FREQ}, timers{}, timers_mutex{}, 
    running{true}, runner{} // runner{&timer_manager::worker, this}
{
    
}

timer_manager::~timer_manager()
{
    kill();
}

void timer_manager::worker()
{
    //const auto duration = std::chrono::duration<double, std::ratio<1>>(interval);
    const auto duration = std::chrono::milliseconds(100);

    while(running)
    {
        std::lock_guard<std::mutex> lock(timers_mutex);

        // Do stuff
        printf("butt stuff\n");

        std::this_thread::sleep_for(duration);
    }
}

bool timer_manager::timer_exists(app_timer_t *timer)
{
    std::lock_guard<std::mutex> lock(timers_mutex);

    bool exists = false;

    for (const app_timer_t *item : timers)
    {
        if (item == timer) exists = true;
    }

    return exists;
}

void timer_manager::add_timer(app_timer_t *timer)
{
    std::lock_guard<std::mutex> lock(timers_mutex);

    timers.push_back(timer);
}

void timer_manager::kill()
{
    printf("Killing timer thread...");
    running = false;

    try
    {
        if (runner.joinable())
        {
            runner.join();
        }
    }
    catch(const std::system_error) { }
    
    printf("Done\n");
}

extern "C" {

timer_manager manager;

void signal_handler(int signal)
{
    manager.kill();
    exit(0);
}

ret_code_t app_timer_init(void)
{
	return NRF_SUCCESS;
}

ret_code_t app_timer_create(app_timer_id_t const *p_timer_id, app_timer_mode_t mode, app_timer_timeout_handler_t timeout_handler)
{
    if (timeout_handler == NULL)
    {
        return NRF_ERROR_INVALID_PARAM;
    }

    if (p_timer_id == NULL)
    {
        return NRF_ERROR_INVALID_PARAM;
    }

    app_timer_t *timer = (app_timer_t *)*p_timer_id;

    if (timer->is_running)
    {
        return NRF_ERROR_INVALID_STATE;
    }

    timer->is_running = false;
    timer->mode = mode;
    timer->p_timeout_handler = timeout_handler;

    manager.add_timer(timer);

    return NRF_SUCCESS;
}

ret_code_t app_timer_start(app_timer_id_t timer_id, uint32_t timeout_ticks, void *p_context)
{
	UNUSED_PARAMETER(timer_id);
    UNUSED_PARAMETER(timeout_ticks);
    UNUSED_PARAMETER(p_context);

    return NRF_SUCCESS;
}

ret_code_t app_timer_stop(app_timer_id_t timer_id)
{
	UNUSED_PARAMETER(timer_id);

    return NRF_SUCCESS;
}


uint32_t app_timer_cnt_get(void)
{
	return 0;
}


void nrf_delay_us(uint32_t time_us)
{
	UNUSED_PARAMETER(time_us);
}

void nrf_delay_ms(uint32_t time_ms)
{
	if (time_ms == 0)
    {
        return;
    }

    do {
        nrf_delay_us(1000);
    } while (--time_ms);
}

}
