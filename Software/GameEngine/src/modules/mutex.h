#ifndef MODULE_MUTEX_H
#define MODULE_MUTEX_H

#include <atomic>

void badge_mutex_lock(std::atomic_int *mutex);
void badge_mutex_unlock(std::atomic_int *mutex);

#endif
