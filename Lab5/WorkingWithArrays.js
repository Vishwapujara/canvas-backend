let todos = [
    { id: 1, title: "Task 1", completed: false },
    { id: 2, title: "Task 2", completed: true },
    { id: 3, title: "Task 3", completed: false },
    { id: 4, title: "Task 4", completed: true },
];
export default function WorkingWithArrays(app) {
    // R - Retrieve (All & Filtered by Query Parameter)
    const getTodos = (req, res) => {
        const { completed } = req.query;
        if (completed !== undefined) {
            const completedBool = completed === "true";
            const completedTodos = todos.filter((t) => t.completed === completedBool);
            res.json(completedTodos);
            return;
        }
        res.json(todos);
    };

    // C - Create (Synchronous GET method for initial testing)
    const createNewTodo = (req, res) => {
        const newTodo = {
            id: new Date().getTime(),
            title: "New Task",
            completed: false,
        };
        todos.push(newTodo);
        res.json(todos);
    };

    // R - Retrieve (By ID Path Parameter)
    const getTodoById = (req, res) => {
        const { id } = req.params;
        const todo = todos.find((t) => t.id === parseInt(id));
        res.json(todo);
    };

    // D - Delete (Synchronous GET method for initial testing)
    const removeTodo = (req, res) => {
        const { id } = req.params;
        const todoIndex = todos.findIndex((t) => t.id === parseInt(id));
        todos.splice(todoIndex, 1);
        res.json(todos);
    };

    // U - Update (Update Title via Path Parameter)
    const updateTodoTitle = (req, res) => {
        const { id, title } = req.params;
        const todo = todos.find((t) => t.id === parseInt(id));
        todo.title = title;
        res.json(todos);
    };

    // U - Update (5.2.4.7: Update Completed via Path Parameter)
    const updateTodoCompleted = (req, res) => {
        const { id, completed } = req.params;
        const todo = todos.find((t) => t.id === parseInt(id));
        const completedBool = completed === "true";
        todo.completed = completedBool;
        res.json(todos);
    };

    // U - Update (5.2.4.7: Update Description via Path Parameter)
    const updateTodoDescription = (req, res) => {
        const { id, description } = req.params;
        const todo = todos.find((t) => t.id === parseInt(id));
        todo.description = description;
        res.json(todos);
    };

    // C - Create (Asynchronous POST method - for later in the assignment)
    const postNewTodo = (req, res) => {
        const newTodo = { ...req.body, id: new Date().getTime() };
        todos.push(newTodo);
        res.json(newTodo);
    };

    // D - Delete (Asynchronous DELETE method - requires error handling)
    const deleteTodo = (req, res) => {
        const { id } = req.params;
        const todoIndex = todos.findIndex((t) => t.id === parseInt(id));
        if (todoIndex === -1) {
            res.status(404).json({ message: `Unable to delete Todo with ID ${id}` });
            return;
        }
        // FIX: Complete deletion logic for successful delete
        todos.splice(todoIndex, 1);
        res.sendStatus(200);
    };

    // U - Update (Asynchronous PUT method - for later in the assignment)
    const updateTodo = (req, res) => {
        const { id } = req.params;
        const todoIndex = todos.findIndex((t) => t.id === parseInt(id));
        if (todoIndex === -1) {
            res.status(404).json({ message: `Unable to update Todo with ID ${id}` });
            return;
        }
        todos = todos.map((t) => { 
            if (t.id === parseInt(id)) {
                return { ...t, ...req.body };
            }
            return t;
        });
        res.sendStatus(200);
    };


    // --- Route Registration (Keep async routes at the bottom or grouped, as shown) ---
    app.put("/lab5/todos/:id", updateTodo);
    app.delete("/lab5/todos/:id", deleteTodo);

    // Synchronous Read/Update/Delete (for initial testing with <a> tags)
    app.get("/lab5/todos/:id/title/:title", updateTodoTitle);
    app.get("/lab5/todos/:id/completed/:completed", updateTodoCompleted);
    app.get("/lab5/todos/:id/description/:description", updateTodoDescription);
    app.get("/lab5/todos/:id/delete", removeTodo);
    
    // Synchronous Create (Must be BEFORE /lab5/todos/:id)
    app.get("/lab5/todos/create", createNewTodo); 
    
    // Read Routes
    app.get("/lab5/todos/:id", getTodoById);
    app.get("/lab5/todos", getTodos);
    
    // Asynchronous Create (for later testing with POST verb)
    app.post("/lab5/todos", postNewTodo);
};