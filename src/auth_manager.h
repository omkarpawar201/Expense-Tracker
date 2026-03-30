#pragma once
#include <string>

class AuthManager {
public:
    static std::string hashPassword(const std::string& password);
    static bool verifyPassword(const std::string& password, const std::string& hash);
    
    // Generates a mock JWT token string (Header.Payload.Signature) uses HMAC-SHA256
    static std::string generateJWT(int user_id, const std::string& username);
    
    // Verifies token and returns user_id, or -1 if invalid
    static int verifyJWT(const std::string& token);
};
