import UsersDao from "./dao.js";
import EnrollmentsDao from "../Enrollments/dao.js";

export default function UserRoutes(app) {
    // The DAO is initialized, but it uses the Mongoose model internally, 
    // ignoring the deprecated 'db' object passed in.
    const dao = UsersDao(); 
    const enrollmentsDao = EnrollmentsDao();
    
    // CRUD Functions
    const createUser = async (req, res) => {
        const newUser = await dao.createUser(req.body); // AWAIT
        res.json(newUser);
    };
    
    const deleteUser = async (req, res) => {
        const { userId } = req.params;
        const status = await dao.deleteUser(userId); // AWAIT
        res.json(status);
    };
    
    const findAllUsers = async (req, res) => {
    try {
        // Extract query parameters
        const { role, name } = req.query;
        let users;

        if (role) {
            // Filter by exact role match
            users = await dao.findUsersByRole(role);
        } else if (name) {
            // Filter by partial name match
            users = await dao.findUsersByPartialName(name);
        } else {
            // Default: Retrieve all users
            users = await dao.findAllUsers();
        }

        res.json(users);

    } catch (error) {
        console.error("Error fetching all users (GET /api/users):", error);
        // Respond with a 500 error if the database query fails
        res.status(500).json({ message: "Internal server error while fetching users." });
    }
};
    
    const findUserById = async (req, res) => {
        const { userId } = req.params;
        const user = await dao.findUserById(userId); // AWAIT
        res.json(user);
    };
    
    const updateUser = async (req, res) => { // ASYNC
        const userId = req.params.userId;
        const userUpdates = req.body;
        
        await dao.updateUser(userId, userUpdates); // AWAIT

        const currentUser = await dao.findUserById(userId); // AWAIT
        
        if (!currentUser) {
            return res.status(404).json({ message: "User not found after update." });
        }

        req.session["currentUser"] = currentUser;
        res.json(currentUser);
    };
    
    // Authentication Functions
   const signup = async (req, res) => {
        const user = await dao.findUserByUsername(req.body.username);
        if (user) {
            res.status(400).json({ message: "Username already in use" });
            return;
        }
        
        try {
            // This is the line that was crashing before, now it's protected
            const newUser = await dao.createUser(req.body); 
            req.session["currentUser"] = newUser;
            res.json(newUser);
        } catch (error) { 
            console.error("Signup failed:", error);
            // Sending a 500 error, which now includes unhandled validation errors 
            // that occurred during the model.create call (like missing fields).
            res.status(500).json({ message: "An error occurred during signup." });
        }
    };
    
    const signin = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Signin attempt:", { username, password }); // DEBUG
    
    const currentUser = await dao.findUserByCredentials(username, password); 
    console.log("User found:", currentUser); // DEBUG
    
    if (currentUser) {
      req.session["currentUser"] = currentUser;
      res.json(currentUser);
    } else {
      res.status(401).json({ message: "Invalid username or password. Try again later." });
    }
  } catch (error) {
    console.error("Signin failed:", error);
    res.status(500).json({ message: "An unexpected error occurred during signin." });
  }
};
    
    const signout = async (req, res) => { // ASYNC (for consistency)
        req.session.destroy();
        res.sendStatus(200);
    };
    
    const profile = async (req, res) => { // ASYNC (for consistency)
        const currentUser = req.session["currentUser"];
        if (!currentUser) {
            res.sendStatus(401);
            return;
        }
        res.json(currentUser);
    };
    
    // Enrollment Functions (Assuming EnrollmentsDao is also Mongoose-based/async)
    const enrollUserInCourse = async (req, res) => { // ASYNC
        const { uid, cid } = req.params;
        const currentUser = req.session["currentUser"];
        
        if (!currentUser || (currentUser._id !== uid && currentUser.role !== "ADMIN")) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        
        const newEnrollment = await enrollmentsDao.enrollUserInCourse(uid, cid); // AWAIT
        res.json(newEnrollment);
    };

    const unenrollUserFromCourse = async (req, res) => { // ASYNC
        const { uid, cid } = req.params;
        const currentUser = req.session["currentUser"];
        
        if (!currentUser || (currentUser._id !== uid && currentUser.role !== "ADMIN")) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        
        const status = await enrollmentsDao.unenrollUserFromCourse(uid, cid); // AWAIT
        res.json({ status });
    };
    
    // Route mappings
    // Route mappings
app.post("/api/users", createUser);
app.get("/api/users/test", async (req, res) => {  // ← MOVE THIS UP HERE!
  try {
    const allUsers = await dao.findAllUsers();
    console.log("=== DATABASE TEST ===");
    console.log("Number of users found:", allUsers ? allUsers.length : 0);
    console.log("Users:", JSON.stringify(allUsers, null, 2));
    console.log("===================");
    res.json({
      count: allUsers ? allUsers.length : 0,
      users: allUsers
    });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/users", findAllUsers);
app.get("/api/users/:userId", findUserById);  // ← Now this comes AFTER
app.put("/api/users/:userId", updateUser);
app.delete("/api/users/:userId", deleteUser);
app.post("/api/users/signup", signup);
app.post("/api/users/signin", signin);
app.post("/api/users/signout", signout);
app.post("/api/users/profile", profile);
app.post("/api/users/:uid/courses/:cid", enrollUserInCourse);
app.delete("/api/users/:uid/courses/:cid", unenrollUserFromCourse);
}