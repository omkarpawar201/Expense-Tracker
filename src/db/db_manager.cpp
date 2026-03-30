#include "db_manager.h"
#include <iostream>

DBManager::DBManager() {
    conn = mysql_init(nullptr);
}

DBManager::~DBManager() {
    if (conn) {
        mysql_close(conn);
    }
}

bool DBManager::connect(const std::string& host, const std::string& user, const std::string& pwd, const std::string& db, int port) {
    if (mysql_real_connect(conn, host.c_str(), user.c_str(), pwd.c_str(), db.c_str(), port, nullptr, 0) == nullptr) {
        std::cerr << "MySQL Connection Error: " << mysql_error(conn) << std::endl;
        return false;
    }
    std::cout << "Successfully connected to MySQL database!" << std::endl;
    return true;
}

void DBManager::executeMigrations() {
    // Attempt to migrate the legacy "username" column into "display_name", and add "email"
    if (mysql_query(conn, "ALTER TABLE users CHANGE username display_name VARCHAR(100)")) {
        // Will fail if already renamed, which is safe to ignore
    }
    if (mysql_query(conn, "ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE")) {
        // Will fail if already added, safe to ignore
    }
    if (mysql_query(conn, "ALTER TABLE Expenses ADD COLUMN type ENUM('income', 'expense') DEFAULT 'expense'")) {
        // Will fail if already added, safe to ignore
    }

    // Seed Categories
    mysql_query(conn, "INSERT IGNORE INTO Categories (id, name, icon) VALUES (1, 'Housing', 'fa-house'), (2, 'Transportation', 'fa-car'), (3, 'Food', 'fa-utensils'), (4, 'Utilities', 'fa-bolt'), (5, 'Insurance', 'fa-shield'), (6, 'Medical', 'fa-notes-medical'), (7, 'Investing', 'fa-arrow-trend-up'), (8, 'Personal', 'fa-user'), (9, 'Entertainment', 'fa-film'), (10, 'Others', 'fa-ellipsis-h');");
    
    // Establish Phase 8 Tables
    mysql_query(conn, "CREATE TABLE IF NOT EXISTS Budgets (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, category_name VARCHAR(255), target_amount DOUBLE)");
    mysql_query(conn, "CREATE TABLE IF NOT EXISTS Savings (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, amount DOUBLE, description VARCHAR(255), transaction_date DATE)");

    // Establish Phase 9 Tables
    mysql_query(conn, "CREATE TABLE IF NOT EXISTS Goals (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, title VARCHAR(255), target_amount DOUBLE, saved_amount DOUBLE DEFAULT 0, deadline DATE, priority VARCHAR(50) DEFAULT 'Medium')");
}

bool DBManager::registerUser(const std::string& email, const std::string& display_name, const std::string& password_hash) {
    // Escaping to prevent basic SQL injection during registration (prototype level)
    std::string query = "INSERT INTO users (email, display_name, password_hash) VALUES ('" + email + "', '" + display_name + "', '" + password_hash + "')";
    if (mysql_query(conn, query.c_str())) {
        std::cerr << "MySQL Register Error: " << mysql_error(conn) << std::endl;
        return false;
    }
    return true;
}

std::string DBManager::getPasswordHash(const std::string& email, int& out_user_id, std::string& out_display_name) {
    std::string query = "SELECT id, password_hash, display_name FROM users WHERE email = '" + email + "'";
    if (mysql_query(conn, query.c_str())) return "";
    
    MYSQL_RES* result = mysql_store_result(conn);
    if (!result) return "";
    
    MYSQL_ROW row = mysql_fetch_row(result);
    std::string hash = "";
    if (row) {
        out_user_id = std::stoi(row[0]);
        hash = row[1] ? row[1] : "";
        out_display_name = row[2] ? row[2] : "";
    }
    mysql_free_result(result);
    return hash;
}

bool DBManager::addExpense(const Expense& exp) {
    std::string query = "INSERT INTO Expenses (user_id, category_id, amount, description, expense_date, type) VALUES (" +
                        std::to_string(exp.user_id) + ", " +
                        std::to_string(exp.category_id) + ", " +
                        std::to_string(exp.amount) + ", '" +
                        exp.description + "', '" +
                        exp.expense_date + "', '" +
                        exp.type + "')";
    
    if (mysql_query(conn, query.c_str())) {
        std::cerr << "MySQL addExpense Error: " << mysql_error(conn) << std::endl;
        return false;
    }
    return true;
}

std::vector<Expense> DBManager::getExpenses(int user_id) {
    std::vector<Expense> expenses;
    std::string query = "SELECT id, user_id, category_id, amount, description, expense_date, type FROM Expenses WHERE user_id = " + std::to_string(user_id);
    
    if (mysql_query(conn, query.c_str())) {
        std::cerr << "MySQL getExpenses Error: " << mysql_error(conn) << std::endl;
        return expenses;
    }
    
    MYSQL_RES* result = mysql_store_result(conn);
    if (!result) return expenses;
    
    MYSQL_ROW row;
    while ((row = mysql_fetch_row(result))) {
        Expense exp;
        exp.id = std::stoi(row[0]);
        exp.user_id = std::stoi(row[1]);
        exp.category_id = row[2] ? std::stoi(row[2]) : 0;
        exp.amount = std::stod(row[3]);
        exp.description = row[4] ? row[4] : "";
        exp.expense_date = row[5] ? row[5] : "";
        exp.type = row[6] ? row[6] : "expense";
        expenses.push_back(exp);
    }
    mysql_free_result(result);
    return expenses;
}

bool DBManager::deleteExpense(int id) {
    std::string query = "DELETE FROM Expenses WHERE id = " + std::to_string(id);
    if (mysql_query(conn, query.c_str())) {
        std::cerr << "MySQL deleteExpense Error: " << mysql_error(conn) << std::endl;
        return false;
    }
    return true;
}

// === Budgets ===
bool DBManager::addBudget(const Budget& b) {
    std::string query = "INSERT INTO Budgets (user_id, category_name, target_amount) VALUES (" +
                        std::to_string(b.user_id) + ", '" +
                        b.category_name + "', " +
                        std::to_string(b.target_amount) + ")";
    if(mysql_query(conn, query.c_str())) return false;
    return true;
}

std::vector<Budget> DBManager::getBudgets(int user_id) {
    std::vector<Budget> list;
    std::string query = "SELECT id, user_id, category_name, target_amount FROM Budgets WHERE user_id = " + std::to_string(user_id);
    if(mysql_query(conn, query.c_str())) return list;
    MYSQL_RES* result = mysql_store_result(conn);
    if (!result) return list;
    MYSQL_ROW row;
    while((row = mysql_fetch_row(result))) {
        Budget b;
        b.id = std::stoi(row[0]);
        b.user_id = std::stoi(row[1]);
        b.category_name = row[2] ? row[2] : "";
        b.target_amount = std::stod(row[3]);
        list.push_back(b);
    }
    mysql_free_result(result);
    return list;
}

// === Savings ===
bool DBManager::addSavingTx(const SavingTx& stx) {
    std::string query = "INSERT INTO Savings (user_id, amount, description, transaction_date) VALUES (" +
                        std::to_string(stx.user_id) + ", " +
                        std::to_string(stx.amount) + ", '" +
                        stx.description + "', '" +
                        stx.transaction_date + "')";
    if(mysql_query(conn, query.c_str())) return false;
    return true;
}

std::vector<SavingTx> DBManager::getSavingTx(int user_id) {
    std::vector<SavingTx> list;
    std::string query = "SELECT id, user_id, amount, description, transaction_date FROM Savings WHERE user_id = " + std::to_string(user_id);
    if(mysql_query(conn, query.c_str())) return list;
    MYSQL_RES* result = mysql_store_result(conn);
    if (!result) return list;
    MYSQL_ROW row;
    while((row = mysql_fetch_row(result))) {
        SavingTx stx;
        stx.id = std::stoi(row[0]);
        stx.user_id = std::stoi(row[1]);
        stx.amount = std::stod(row[2]);
        stx.description = row[3] ? row[3] : "";
        stx.transaction_date = row[4] ? row[4] : "";
        list.push_back(stx);
    }
    mysql_free_result(result);
    return list;
}

// === Goals ===
bool DBManager::addGoal(const Goal& g) {
    std::string query = "INSERT INTO Goals (user_id, title, target_amount, saved_amount, deadline, priority) VALUES (" +
                        std::to_string(g.user_id) + ", '" +
                        g.title + "', " +
                        std::to_string(g.target_amount) + ", " +
                        std::to_string(g.saved_amount) + ", '" +
                        g.deadline + "', '" +
                        g.priority + "')";
    if(mysql_query(conn, query.c_str())) return false;
    return true;
}

std::vector<Goal> DBManager::getGoals(int user_id) {
    std::vector<Goal> list;
    std::string query = "SELECT id, user_id, title, target_amount, saved_amount, deadline, priority FROM Goals WHERE user_id = " + std::to_string(user_id);
    if(mysql_query(conn, query.c_str())) return list;
    MYSQL_RES* result = mysql_store_result(conn);
    if (!result) return list;
    MYSQL_ROW row;
    while((row = mysql_fetch_row(result))) {
        Goal g;
        g.id = std::stoi(row[0]);
        g.user_id = std::stoi(row[1]);
        g.title = row[2] ? row[2] : "";
        g.target_amount = std::stod(row[3]);
        g.saved_amount = std::stod(row[4]);
        g.deadline = row[5] ? row[5] : "";
        g.priority = row[6] ? row[6] : "Medium";
        list.push_back(g);
    }
    mysql_free_result(result);
    return list;
}
