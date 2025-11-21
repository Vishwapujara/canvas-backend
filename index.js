// import express from 'express';
// import Hello from './Hello.js';
// import Lab5 from './Lab5/index.js';
// import cors from "cors";   
// import session from "express-session"; 
// import "dotenv/config.js"; 
// import db from './Kambaz/Database/index.js';
// import UserRoutes from './Kambaz/Users/routes.js';
// import CourseRoutes from './Kambaz/Courses/routes.js';
// import ModuleRoutes from './Kambaz/Modules/routes.js';
// import AssignmentsRoutes from "./Kambaz/Assignments/routes.js";

// const app = express();

// // Configuration constants
// const ALLOWED_ORIGINS = [
//     // 1. The URL set in your Render environment variable (CLIENT_URL)
//     process.env.CLIENT_URL, 
//     'http://localhost:3000', 
//     // Using your Vercel domain from the console log for reference
//     'https://kambaz-next-js-466h.vercel.app' 
// ];

// const vercelPreviewRegex = /-vishwa-pujaras-projects\.vercel\.app$/;

// // -------------------------------------------------------------
// // CRITICAL FIX: MIDDLEWARE ORDERING
// // -------------------------------------------------------------

// // 1. CORS: Must run FIRST to allow cross-site requests with credentials
// app.use(cors(
//     {
//         credentials: true,
//         origin: (origin, callback) => {
//             if (!origin) return callback(null, true); 

//             if (ALLOWED_ORIGINS.includes(origin)) {
//                 return callback(null, true);
//             }

//             if (origin.match(vercelPreviewRegex)) {
//                 return callback(null, true);
//             }

//             console.log('CORS Blocked Origin:', origin);
//             return callback(new Error('Not allowed by CORS'));
//         }
//     }
// ));

// // 2. SESSION: Must run immediately AFTER CORS to process the incoming cookie
// const sessionOptions = {
//   secret: process.env.SESSION_SECRET || "Any string here to sign the cookie",
//   resave: false,
//   saveUninitialized: false, 
//   cookie: {
//     sameSite: "none", 
//     secure: true,    
//     maxAge: 1000 * 60 * 60 * 24, // 1 day
//   },
// };
// app.use(session(sessionOptions));

// // 3. BODY PARSER: Must run AFTER CORS and SESSION, but BEFORE routes that read req.body
// app.use(express.json());

// // -------------------------------------------------------------
// // 4. REGISTER ROUTES
// // -------------------------------------------------------------
// UserRoutes(app, db);
// CourseRoutes(app, db);
// ModuleRoutes(app, db); // Ensure this route is working
// AssignmentsRoutes(app, db); // Ensure this route is working
// Hello(app);
// Lab5(app);

// // -------------------------------------------------------------

// app.listen(process.env.PORT || 4000)

// import "dotenv/config.js"; 
// import express from 'express';
// import Hello from './Hello.js';
// import Lab5 from './Lab5/index.js';
// import cors from "cors";   
// import session from "express-session"; 
// import db from './Kambaz/Database/index.js';
// import UserRoutes from './Kambaz/Users/routes.js';
// import CourseRoutes from './Kambaz/Courses/routes.js';
// import ModuleRoutes from './Kambaz/Modules/routes.js';
// import AssignmentsRoutes from "./Kambaz/Assignments/routes.js";

// const app = express();

// // Configuration constants
// const ALLOWED_ORIGINS = [
//   process.env.CLIENT_URL, 
//   'http://localhost:3000', 
//   'https://kambaz-next-js-466h.vercel.app' 
// ];

// const vercelPreviewRegex = /-vishwa-pujaras-projects\.vercel\.app$/;

// // 1. CORS Configuration
// app.use(cors({
//   credentials: true,
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true); 

//     if (ALLOWED_ORIGINS.includes(origin)) {
//       return callback(null, true);
//     }

//     if (origin.match(vercelPreviewRegex)) {
//       return callback(null, true);
//     }

//     console.log('CORS Blocked Origin:', origin);
//     return callback(new Error('Not allowed by CORS'));
//   }
// }));

// // 2. SESSION Configuration (FIXED)
// const sessionOptions = {
//   secret: process.env.SESSION_SECRET || "kambaz",
//   resave: false,
//   saveUninitialized: false,
// };

// // Only set these cookie options in PRODUCTION
// if (process.env.SERVER_ENV !== "development") {
//   sessionOptions.proxy = true;
//   sessionOptions.cookie = {
//     sameSite: "none",
//     secure: true,
//     domain: process.env.SERVER_URL,
//   };
// }

// app.use(session(sessionOptions));

// // 3. Body Parser
// app.use(express.json());

// // 4. Routes
// UserRoutes(app, db);
// CourseRoutes(app, db);
// ModuleRoutes(app, db);
// AssignmentsRoutes(app, db);
// Hello(app);
// Lab5(app);

// app.listen(process.env.PORT || 4000);

import "dotenv/config.js"; 
import express from 'express';
import Hello from './Hello.js';
import Lab5 from './Lab5/index.js';
import cors from "cors";   
import session from "express-session"; 
import db from './Kambaz/Database/index.js';
import UserRoutes from './Kambaz/Users/routes.js';
import CourseRoutes from './Kambaz/Courses/routes.js';
import ModuleRoutes from './Kambaz/Modules/routes.js';
import AssignmentsRoutes from "./Kambaz/Assignments/routes.js";

const app = express();

// Configuration constants
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL, 
  'http://localhost:3000', 
  'https://kambaz-next-js-466h.vercel.app' 
];

const vercelPreviewRegex = /-vishwa-pujaras-projects\.vercel\.app$/;

// 1. CORS Configuration
app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); 

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    if (origin.match(vercelPreviewRegex)) {
      return callback(null, true);
    }

    console.log('CORS Blocked Origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  }
}));

// 2. SESSION Configuration - CRITICAL FIX
const sessionOptions = {
  secret: process.env.SESSION_SECRET || "kambaz-secret-key",
  resave: false,
  saveUninitialized: false,
};

// FIX: Check NODE_ENV (not SERVER_ENV) and configure cookies properly
if (process.env.SERVER_ENV === "production") {
  sessionOptions.proxy = true;
  sessionOptions.cookie = {
    sameSite: "none",
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  };
  console.log('Production session config applied');
} else {
  console.log('Development session config applied');
}

app.use(session(sessionOptions));

// 3. Body Parser
app.use(express.json());

// 4. Routes
UserRoutes(app, db);
CourseRoutes(app, db);
ModuleRoutes(app, db);
AssignmentsRoutes(app, db);
Hello(app);
Lab5(app);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
});