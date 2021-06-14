#ifndef MODULE_MUTEX_H
#define MODULE_MUTEX_H

#include <stdatomic.h>

void badge_mutex_lock(atomic_int *mutex);
void badge_mutex_unlock(atomic_int *mutex);

#endif
