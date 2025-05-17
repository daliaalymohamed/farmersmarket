import { initializeDatabaseOnce } from "@/lib/utils/initDatabase";

initializeDatabaseOnce(); 
// Runs **only once** when the server starts
// On server start, middleware.js ensures connectToDatabase() runs only once.
// All subsequent requests skip re-initialization.
// Prevents multiple database connections and duplicate role/action inserts.