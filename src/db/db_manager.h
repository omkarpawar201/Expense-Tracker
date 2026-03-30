#pragma once
#include <mariadb/mysql.h>
#include <string>
#include <vector>

struct Expense {
    int id;
    int user_id;
    int category_id;
    double amount;
    std::string description;
    std::string expense_date;
    std::string type;
};

struct Budget {
    int id;
    int user_id;
    std::string category_name;
    double target_amount;
};

struct SavingTx {
    int id;
    int user_id;
    double amount;
    std::string description;
    std::string transaction_date;
};

struct Goal {
    int id;
    int user_id;
    std::string title;
    double target_amount;
    double saved_amount;
    std::string deadline;
    std::string priority;
};

class DBManager {
public:
    DBManager();
    ~DBManager();

    // Initialize the DB Connection
    bool connect(const std::string& host, const std::string& user, const std::string& pwd, const std::string& db, int port);
    
    // Auto-migrate schema on boot
    void executeMigrations();

    // User operations
    bool registerUser(const std::string& email, const std::string& display_name, const std::string& password_hash);
    std::string getPasswordHash(const std::string& email, int& out_user_id, std::string& out_display_name);

    // CRUD operations - Expenses
    bool addExpense(const Expense& exp);
    std::vector<Expense> getExpenses(int user_id);
    bool deleteExpense(int id);
    
    // CRUD operations - Budgets
    bool addBudget(const Budget& b);
    std::vector<Budget> getBudgets(int user_id);

    // CRUD operations - Savings
    bool addSavingTx(const SavingTx& stx);
    std::vector<SavingTx> getSavingTx(int user_id);
    
    // CRUD operations - Goals
    bool addGoal(const Goal& g);
    std::vector<Goal> getGoals(int user_id);
    
private:
    MYSQL* conn;
};
