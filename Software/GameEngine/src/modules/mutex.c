
#include "mutex.h"

void badge_mutex_lock(std::atomic_int* mutex)
{
	std::atomic_exchange(mutex, 1);
	std::atomic_thread_fence(std::memory_order_relaxed);
}

void badge_mutex_unlock(std::atomic_int *mutex)
{
	std::atomic_thread_fence(std::memory_order_release);
	std::atomic_store(mutex, 0);
}
