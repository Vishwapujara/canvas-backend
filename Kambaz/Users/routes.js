import UsersDao from "./dao.js";
import EnrollmentsDao from "../Enrollments/dao.js";

export default function UserRoutes(app, db) {
    const dao = UsersDao(db);
    const enrollmentsDao = EnrollmentsDao(db);
    
    const createUser = (req, res) => {
        const newUser = dao.createUser(req.body);
        res.json(newUser);
    };
    
    const deleteUser = (req, res) => {
        const { userId } = req.params;
        const status = dao.deleteUser(userId);
        res.json(status);
    };
    
    const findAllUsers = (req, res) => {
        const users = dao.findAllUsers();
        res.json(users);
    };
    
    const findUserById = (req, res) => {
        const { userId } = req.params;
        const user = dao.findUserById(userId);
        res.json(user);
    };
    
    const updateUser = (req, res) => {
        const userId = req.params.userId;
        const userUpdates = req.body;
        dao.updateUser(userId, userUpdates);
        const currentUser = dao.findUserById(userId);
        req.session["currentUser"] = currentUser;
        res.json(currentUser);
    };
    
    const signup = (req, res) => {
        const user = dao.findUserByUsername(req.body.username);
        if (user) {
            res.status(400).json({ message: "Username already in use" });
            return;
        }
        
        const newUser = dao.createUser(req.body);
        req.session["currentUser"] = newUser;
        
        // CRITICAL FIX: Explicitly save session to ensure cookie is set
        req.session.save((err) => {
            if (err) {
                console.error('Session save error in signup:', err);
                return res.status(500).json({ message: "Session error" });
            }
            console.log('Signup session saved. Session ID:', req.sessionID);
            res.json(newUser);
        });
    };
    
    const signin = (req, res) => {
        const { username, password } = req.body;
        const currentUser = dao.findUserByCredentials(username, password);
        
        if (currentUser) {
            req.session["currentUser"] = currentUser;
            
            // CRITICAL FIX: Explicitly save session to ensure cookie is set
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error in signin:', err);
                    return res.status(500).json({ message: "Session error" });
                }
                console.log('Signin session saved. Session ID:', req.sessionID);
                res.json(currentUser);
            });
        } else {
            res.status(401).json({ message: "Unable to login. Try again later." });
        }
    };
    
    const signout = (req, res) => {
        req.session.destroy();
        res.sendStatus(200);
    };
    
    const profile = (req, res) => {
        const currentUser = req.session["currentUser"];
        if (!currentUser) {
            res.sendStatus(401);
            return;
        }
        res.json(currentUser);
    };
    
    const enrollUserInCourse = (req, res) => {
        const { uid, cid } = req.params;
        const currentUser = req.session["currentUser"];
        
        if (!currentUser || (currentUser._id !== uid && currentUser.role !== "ADMIN")) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        
        const newEnrollment = enrollmentsDao.enrollUserInCourse(uid, cid);
        res.json(newEnrollment);
    };

    const unenrollUserFromCourse = (req, res) => {
        const { uid, cid } = req.params;
        const currentUser = req.session["currentUser"];
        
        if (!currentUser || (currentUser._id !== uid && currentUser.role !== "ADMIN")) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        
        const status = enrollmentsDao.unenrollUserFromCourse(uid, cid);
        res.json({ status });
    };
    
    app.post("/api/users", createUser);
    app.get("/api/users", findAllUsers);
    app.get("/api/users/:userId", findUserById);
    app.put("/api/users/:userId", updateUser);
    app.delete("/api/users/:userId", deleteUser);
    app.post("/api/users/signup", signup);
    app.post("/api/users/signin", signin);
    app.post("/api/users/signout", signout);
    app.post("/api/users/profile", profile);
    app.post("/api/users/:uid/courses/:cid", enrollUserInCourse);
    app.delete("/api/users/:uid/courses/:cid", unenrollUserFromCourse);
}