#include "common.h"
#include "mutex.h"

void badge_mutex_lock(atomic_int *mutex)
{
    atomic_exchange(mutex, 1);
    atomic_thread_fence(memory_order_relaxed);
}

void badge_mutex_unlock(atomic_int *mutex)
{
    atomic_thread_fence(memory_order_release);
    atomic_store(mutex, 0);
}
