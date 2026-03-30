cmake_minimum_required(VERSION 3.15)
project(ExpenseTracker)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Use locally cloned header-only libraries
include_directories(include/Crow/include)
include_directories(include/asio/asio/include)
include_directories(src)

# Standalone Asio flag required for Crow
add_definitions(-DCROW_ENABLE_STANDALONE)

# Add executable
add_executable(ExpenseTracker 
    src/main.cpp 
    src/db/db_manager.cpp
    src/auth_manager.cpp
)

# Link against Winsock2 on Windows or standard libraries on Linux
if(WIN32)
    target_link_libraries(ExpenseTracker ws2_32 mswsock mariadb "C:/msys64/mingw64/lib/libcrypto.dll.a")
else()
    target_link_libraries(ExpenseTracker mariadb crypto ssl pthread)
endif()
