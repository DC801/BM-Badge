
#include <atomic>
#include <chrono>
#include <cstdlib>
#include <iostream>
#include <list>
#include <mutex>
#include <thread>

// #include <csignal>
// #include <cstdio>

#ifdef EMSCRIPTEN
#include <emscripten.h>
#endif

#include "shim_timer.h"
#include "shim_err.h"

// TODO: Implement this shit

NRF_TIMER_Type NRF_TIMER_1 = { 0 };
NRF_TIMER_Type *NRF_TIMER1 = &NRF_TIMER_1;

class timer_manager
{
private:
    const double interval;
    std::list<app_timer_t*> timers;
    std::recursive_mutex timers_mutex;
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
    //std::cout << "New timer manager" << std::endl;
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
        std::cout << "Locking worker" << std::endl;
        std::unique_lock<std::recursive_mutex> lock(timers_mutex);

        // Do stuff

        lock.unlock();
        std::cout << "Unlocked worker" << std::endl;

        std::this_thread::sleep_for(duration);
    }
}

bool timer_manager::timer_exists(app_timer_t *timer)
{
    std::cout << "Locking exists" << std::endl;
    std::unique_lock<std::recursive_mutex> lock(timers_mutex);

    bool exists = false;

    for (const app_timer_t *item : timers)
    {
        if (item == timer) exists = true;
    }

    lock.unlock();
    std::cout << "Unlocked exists" << std::endl;

    return exists;
}

void timer_manager::add_timer(app_timer_t *timer)
{
    std::cout << "Locking add" << std::endl;

    std::unique_lock<std::recursive_mutex> lock(timers_mutex);
    timers.push_back(timer);
    lock.unlock();

    std::cout << "Unlocked add" << std::endl;
}

void timer_manager::kill()
{
    running = false;

    try
    {
        if (runner.joinable())
        {
            runner.join();
        }
    }
    catch(const std::system_error&) { }

}

timer_manager manager{};

extern "C"
{
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

		// manager.add_timer(timer);

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
		return std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count();
	}

	void nrf_delay_us(uint32_t time_us)
	{
		const auto duration = std::chrono::microseconds(time_us);
		std::this_thread::sleep_for(duration);
	}

	void nrf_delay_ms(uint32_t time_ms)
	{
		#ifdef EMSCRIPTEN
		// This is needed to allow the JS side of the code to take a turn;
		// allows for a break to handle input, as well as render canvas output.
		// If you have a `while(true)` loop that only `break`s on input or whatever,
		// throw a call to `nrf_delay_ms` in there to at least allow for GUI/input handling.
		emscripten_sleep(time_ms);
		#else
		const auto duration = std::chrono::milliseconds(time_ms);
		std::this_thread::sleep_for(duration);
		#endif
	}
}
