TEST_ROOT := $(PRJ_ROOT)/test
TEST_INCLUDES := -I$(TEST_ROOT)

ifdef TEST_AUDIO
TEST_DEFINES := -DTEST
TEST_SRCS := $(TEST_ROOT)/test_audio.cpp
endif

ifdef TEST_MEMORY
TEST_DEFINES := -DTEST
TEST_SRCS := $(TEST_ROOT)/test_memory.cpp
endif

ifdef TEST_ALL
TEST_DEFINES := -DTEST_ALL

TEST_SRCS := $(TEST_ROOT)/test.cpp \
			 $(TEST_ROOT)/test_audio.cpp \
			 $(TEST_ROOT)/test_memory.cpp
endif
