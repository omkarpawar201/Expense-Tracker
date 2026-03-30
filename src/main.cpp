#include "crow.h"
#include "crow/middlewares/cors.h"
#include "db/db_manager.h"

#include "auth_manager.h"

// Helper for JWT extraction
int authenticate(const crow::request& req) {
    auto it = req.headers.find("Authorization");
    if(it == req.headers.end()) return -1;
    std::string auth = it->second;
    if(auth.substr(0, 7) == "Bearer ") {
        std::string token = auth.substr(7);
        return AuthManager::verifyJWT(token);
    }
    return -1;
}

// Global or shared db manager for simplicity in this example
DBManager db;

int main()
{
    // Enable CORS middleware
    crow::App<crow::CORSHandler> app;
    
    // Configure CORS
    auto& cors = app.get_middleware<crow::CORSHandler>();
    cors.global().headers("Origin", "Content-Type", "Accept", "Authorization")
        .methods("POST"_method, "GET"_method, "PUT"_method, "DELETE"_method, "OPTIONS"_method)
        .origin("*");

    // Connect to the database using environment variables for containerization
    const char* db_host = std::getenv("DB_HOST") ? std::getenv("DB_HOST") : "localhost";
    const char* db_user = std::getenv("DB_USER") ? std::getenv("DB_USER") : "root";
    const char* db_pass = std::getenv("DB_PASSWORD") ? std::getenv("DB_PASSWORD") : "root";
    const char* db_name = std::getenv("DB_NAME") ? std::getenv("DB_NAME") : "expense_tracker";
    int db_port = std::getenv("DB_PORT") ? std::atoi(std::getenv("DB_PORT")) : 3306;

    if (!db.connect(db_host, db_user, db_pass, db_name, db_port)) {
        std::cerr << "Failed to connect to the database at " << db_host << ":" << db_port << ". Check environment variables." << std::endl;
        return 1;
    }

    db.executeMigrations();

    CROW_ROUTE(app, "/")([]() {
        return "Welcome to Full Stack Expense Tracker API!";
    });

    CROW_ROUTE(app, "/api/auth/register").methods("POST"_method)([](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x) return crow::response(400, "Invalid JSON");
        std::string email = x["email"].s();
        std::string display_name = x["displayName"].s();
        std::string password = x["password"].s();
        
        std::string hash = AuthManager::hashPassword(password);
        if(db.registerUser(email, display_name, hash)) {
            return crow::response(201, "User registered");
        }
        return crow::response(400, "Email might already exist");
    });

    CROW_ROUTE(app, "/api/auth/login").methods("POST"_method)([](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x) return crow::response(400, "Invalid JSON");
        std::string email = x["email"].s();
        std::string password = x["password"].s();
        
        int user_id = -1;
        std::string display_name = "";
        std::string hash = db.getPasswordHash(email, user_id, display_name);
        
        if(hash != "" && AuthManager::verifyPassword(password, hash)) {
            std::string token = AuthManager::generateJWT(user_id, display_name);
            crow::json::wvalue res;
            res["token"] = token;
            res["username"] = display_name; // Keeping variable 'username' in JSON for frontend simplicity
            return crow::response(200, res);
        }
        return crow::response(401, "Invalid credentials");
    });

    // 1. Add Expense (Protected)
    CROW_ROUTE(app, "/api/expenses").methods("POST"_method)([](const crow::request& req) {
        int user_id = authenticate(req);
        if(user_id == -1) return crow::response(401, "Unauthorized");

        auto x = crow::json::load(req.body);
        if (!x) return crow::response(400, "Invalid JSON");

        Expense exp;
        exp.user_id = user_id;
        exp.category_id = x.has("category_id") ? x["category_id"].i() : 0;
        exp.amount = x["amount"].d();
        exp.description = x["description"].s();
        exp.expense_date = x["expense_date"].s();
        exp.type = "expense";
        if (x.has("type")) {
            exp.type = x["type"].s();
        }

        if (db.addExpense(exp)) return crow::response(201, "Expense added successfully");
        return crow::response(500, "Failed to add expense");
    });

    // 2. Get Expenses (Protected)
    CROW_ROUTE(app, "/api/expenses").methods("GET"_method)([](const crow::request& req) {
        int user_id = authenticate(req);
        if(user_id == -1) return crow::response(401, "Unauthorized");

        std::vector<Expense> expenses = db.getExpenses(user_id);
        
        crow::json::wvalue res_list;
        int i = 0;
        for (const auto& e : expenses) {
            res_list[i]["id"] = e.id;
            res_list[i]["user_id"] = e.user_id;
            res_list[i]["category_id"] = e.category_id;
            res_list[i]["amount"] = e.amount;
            res_list[i]["description"] = e.description;
            res_list[i]["expense_date"] = e.expense_date;
            res_list[i]["type"] = e.type;
            i++;
        }
        return crow::response(200, res_list);
    });

    // 3. Delete Expense (Protected)
    CROW_ROUTE(app, "/api/expenses/<int>").methods("DELETE"_method)([](const crow::request& req, int id) {
        int user_id = authenticate(req);
        if(user_id == -1) return crow::response(401, "Unauthorized");
        // In reality, ensure user owns the expense before deleting
        if (db.deleteExpense(id)) return crow::response(200, "Expense deleted properly");
        return crow::response(500, "Failed to delete expense");
    });

    // 4. Add Budget (Protected)
    CROW_ROUTE(app, "/api/budgets").methods("POST"_method)([](const crow::request& req) {
        int user_id = authenticate(req);
        if(user_id == -1) return crow::response(401, "Unauthorized");

        auto x = crow::json::load(req.body);
        if (!x) return crow::response(400, "Invalid JSON");

        Budget b;
        b.user_id = user_id;
        b.category_name = x["category_name"].s();
        b.target_amount = x["target_amount"].d();

        if(db.addBudget(b)) return crow::response(201, "Budget created");
        return crow::response(500, "Failed to create budget");
    });

    // 5. Get Budgets (Protected)
    CROW_ROUTE(app, "/api/budgets").methods("GET"_method)([](const crow::request& req) {
        int user_id = authenticate(req);
        if(user_id == -1) return crow::response(401, "Unauthorized");

        std::vector<Budget> list = db.getBudgets(user_id);
        crow::json::wvalue res;
        int i=0;
        for(const auto& b : list) {
            res[i]["id"] = b.id;
            res[i]["category_name"] = b.category_name;
            res[i]["target_amount"] = b.target_amount;
            i++;
        }
        return crow::response(200, res);
    });

    // 6. Add Saving Transaction (Protected)
    CROW_ROUTE(app, "/api/savings").methods("POST"_method)([](const crow::request& req) {
        int user_id = authenticate(req);
        if(user_id == -1) return crow::response(401, "Unauthorized");

        auto x = crow::json::load(req.body);
        if (!x) return crow::response(400, "Invalid JSON");

        SavingTx stx;
        stx.user_id = user_id;
        stx.amount = x["amount"].d();
        stx.description = x["description"].s();
        stx.transaction_date = x["transaction_date"].s();

        if(db.addSavingTx(stx)) return crow::response(201, "Saving logged");
        return crow::response(500, "Failed to log saving");
    });

    // 7. Get Savings (Protected)
    CROW_ROUTE(app, "/api/savings").methods("GET"_method)([](const crow::request& req) {
        int user_id = authenticate(req);
        if(user_id == -1) return crow::response(401, "Unauthorized");

        std::vector<SavingTx> list = db.getSavingTx(user_id);
        crow::json::wvalue res;
        int i=0;
        for(const auto& s : list) {
            res[i]["id"] = s.id;
            res[i]["amount"] = s.amount;
            res[i]["description"] = s.description;
            res[i]["transaction_date"] = s.transaction_date;
            i++;
        }
        return crow::response(200, res);
    });

    // 8. Add Goal (Protected)
    CROW_ROUTE(app, "/api/goals").methods("POST"_method)([](const crow::request& req) {
        int user_id = authenticate(req);
        if(user_id == -1) return crow::response(401, "Unauthorized");

        auto x = crow::json::load(req.body);
        if (!x) return crow::response(400, "Invalid JSON");

        Goal g;
        g.user_id = user_id;
        g.title = x["title"].s();
        g.target_amount = x["target_amount"].d();
        g.saved_amount = x.has("saved_amount") ? x["saved_amount"].d() : 0.0;
        g.deadline = x["deadline"].s();
        g.priority = "Medium";
        if (x.has("priority")) {
            g.priority = x["priority"].s();
        }

        if(db.addGoal(g)) return crow::response(201, "Goal logged");
        return crow::response(500, "Failed to log goal");
    });

    // 9. Get Goals (Protected)
    CROW_ROUTE(app, "/api/goals").methods("GET"_method)([](const crow::request& req) {
        int user_id = authenticate(req);
        if(user_id == -1) return crow::response(401, "Unauthorized");

        std::vector<Goal> list = db.getGoals(user_id);
        crow::json::wvalue res;
        int i=0;
        for(const auto& g : list) {
            res[i]["id"] = g.id;
            res[i]["title"] = g.title;
            res[i]["target_amount"] = g.target_amount;
            res[i]["saved_amount"] = g.saved_amount;
            res[i]["deadline"] = g.deadline;
            res[i]["priority"] = g.priority;
            i++;
        }
        return crow::response(200, res);
    });

    // Start the server on port 8080 with multithreading
    // NOTE: In production, enable CORS middleware. We will handle CORS separately if frontend is served differently.
    app.port(8080).multithreaded().run();
    return 0;
}
