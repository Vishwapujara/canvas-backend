import express from 'express';
import Hello from './Hello.js';
import Lab5 from './Lab5/index.js';
import cors from "cors";   
import session from "express-session"; // Import session
import "dotenv/config.js"; 
import db from './Kambaz/Database/index.js';
import UserRoutes from './Kambaz/Users/routes.js';
import CourseRoutes from './Kambaz/Courses/routes.js';
import ModuleRoutes from './Kambaz/Modules/routes.js';
import AssignmentsRoutes from "./Kambaz/Assignments/routes.js";

const app = express();
app.use(cors(
    {
        credentials: true,
        origin: process.env.CLIENT_URL || "http://localhost:3000",
    }
));
app.use(express.json());
UserRoutes(app, db);
CourseRoutes(app, db);
AssignmentsRoutes(app, db);
Hello(app);
Lab5(app);

app.listen(process.env.PORT || 4000)