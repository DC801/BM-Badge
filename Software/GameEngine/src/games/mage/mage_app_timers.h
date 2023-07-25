#ifndef MAGE_APP_TIMERS_H
#define MAGE_APP_TIMERS_H

#include <stdint.h>
#include <chrono>


//class GameClock
//{
//public:
//    using period = std::milli;
//    using rep = uint32_t;
//    using duration = std::chrono::duration<rep, period>;
//    using time_point = std::chrono::time_point<GameClock>;
//    static constexpr bool is_steady = true;
//
//    template< class Duration >
//    std::chrono::time_point<Clock, Duration>
//        operator()(const std::chrono::time_point<Clock, Duration>& t) const;
//
//    static time_point now() noexcept
//    {
//#ifdef DC801_EMBEDDED
//        // nrfx_systick_get(&systick);
//        // return time_point{ duration{systick.time} };
//        return time_point{ duration{getSystick()} };
//#else
//        //steady_clock
//        using namespace std::chrono;
//        std::chrono::duration_return steady_clock::now().time_since_epoch());
//
//#endif
//    }
//
//private:
//#ifdef DC801_EMBEDDED
//#else
//#endif
//};

void sysTickStart(void);
void sysTickHandler(void* p_context);
uint32_t getSystick(void);
    
#endif // MAGE_APP_TIMERS_H