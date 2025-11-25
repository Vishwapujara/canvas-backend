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

    // R - Retrieve (By ID Path Parameter)
    const getTodoById = (req, res) => {
        const { id } = req.params;
        const todo = todos.find((t) => t.id === parseInt(id));
        if (!todo) {
            res.status(404).json({ message: `Todo with ID ${id} not found` });
            return;
        }
        res.json(todo);
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

    // C - Create (Asynchronous POST method)
    const postNewTodo = (req, res) => {
        const newTodo = { ...req.body, id: new Date().getTime() };
        todos.push(newTodo);
        res.status(201).json(newTodo);
    };

    // D - Delete (Synchronous GET method for initial testing)
    const removeTodo = (req, res) => {
        const { id } = req.params;
        const todoIndex = todos.findIndex((t) => t.id === parseInt(id));
        if (todoIndex === -1) {
            res.status(404).json({ message: `Unable to delete Todo with ID ${id}` });
            return;
        }
        todos.splice(todoIndex, 1);
        res.json(todos);
    };

    // D - Delete (Asynchronous DELETE method with error handling)
    const deleteTodo = (req, res) => {
        const { id } = req.params;
        const todoIndex = todos.findIndex((t) => t.id === parseInt(id));
        if (todoIndex === -1) {
            res.status(404).json({ message: `Unable to delete Todo with ID ${id}` });
            return;
        }
        todos.splice(todoIndex, 1);
        res.status(200).json({ message: "Todo deleted successfully", todos });
    };

    // U - Update (Update Title via Path Parameter)
    const updateTodoTitle = (req, res) => {
        const { id, title } = req.params;
        const todo = todos.find((t) => t.id === parseInt(id));
        if (!todo) {
            res.status(404).json({ message: `Todo with ID ${id} not found` });
            return;
        }
        todo.title = decodeURIComponent(title);
        res.json(todos);
    };

    // U - Update (Update Completed via Path Parameter)
    const updateTodoCompleted = (req, res) => {
        const { id, completed } = req.params;
        const todo = todos.find((t) => t.id === parseInt(id));
        if (!todo) {
            res.status(404).json({ message: `Todo with ID ${id} not found` });
            return;
        }
        const completedBool = completed === "true";
        todo.completed = completedBool;
        res.json(todos);
    };

    // U - Update (Update Description via Path Parameter)
    const updateTodoDescription = (req, res) => {
        const { id, description } = req.params;
        const todo = todos.find((t) => t.id === parseInt(id));
        if (!todo) {
            res.status(404).json({ message: `Todo with ID ${id} not found` });
            return;
        }
        todo.description = decodeURIComponent(description);
        res.json(todos);
    };

    // U - Update (Asynchronous PUT method - proper way)
    const updateTodo = (req, res) => {
        const { id } = req.params;
        const todoIndex = todos.findIndex((t) => t.id === parseInt(id));
        
        if (todoIndex === -1) {
            res.status(404).json({ message: `Unable to update Todo with ID ${id}` });
            return;
        }

        // Update the todo at the found index
        todos[todoIndex] = { ...todos[todoIndex], ...req.body, id: parseInt(id) };
        
        res.status(200).json({ message: "Todo updated successfully", todo: todos[todoIndex] });
    };

    // --- Route Registration (Order matters! Specific routes BEFORE generic ones) ---
    
    // Synchronous Create (Must be BEFORE /lab5/todos/:id to avoid being matched as ID)
    app.get("/lab5/todos/create", createNewTodo);
    
    // Read Routes
    app.get("/lab5/todos", getTodos);
    app.get("/lab5/todos/:id", getTodoById);
    
    // Synchronous Update/Delete (for initial testing with <a> tags)
    app.get("/lab5/todos/:id/title/:title", updateTodoTitle);
    app.get("/lab5/todos/:id/completed/:completed", updateTodoCompleted);
    app.get("/lab5/todos/:id/description/:description", updateTodoDescription);
    app.get("/lab5/todos/:id/delete", removeTodo);
    
    // Asynchronous Methods (PUT/POST/DELETE for proper REST)
    app.post("/lab5/todos", postNewTodo);
    app.put("/lab5/todos/:id", updateTodo);
    app.delete("/lab5/todos/:id", deleteTodo);
}