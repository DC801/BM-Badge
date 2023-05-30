#ifndef ENGINE_PANIC_H_
#define ENGINE_PANIC_H_

#include <cstring>
#include <stdexcept>
#include <utility>
#include "utility.h"

// Capture File Number, Line Number, and Message.
//   Message should be at most 39 columns by 10 lines
//
//   123456789012345678901234567890123456789
//   2
//   3
//   4
//   5
//   6
//   7
//   8
//   9
//   10
//
//   Total message length including newlines and termination:
//     (39 + 1) * 10 + 1 = 401
//
//   Anything beyond 400 characters will be truncated
template<typename... Ts>
static inline void ENGINE_PANIC(const char* s, Ts... fmt)
{
	char buf[401];
	sprintf(buf, "%s %d", __FILE__, __LINE__);
	sprintf(buf + strlen(__FILE__) + __LINE__ / 10, s, std::forward<Ts>(fmt)...);
	throw std::runtime_error(buf);
}

static inline void ENGINE_PANIC(const char* s)
{
	char buf[401];
	sprintf(buf, "%s %d", __FILE__, __LINE__);
	sprintf(buf + strlen(__FILE__) + __LINE__ / 10, "%s", s);
	throw std::runtime_error(buf);
}


[[noreturn]] void EnginePanic(const char* filename, int lineno, const char* format, ...);



#endif
