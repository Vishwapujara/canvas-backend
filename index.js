// import "dotenv/config.js"; 
import express from 'express';
import mongoose from "mongoose";
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
const isDevelopment = process.env.NODE_ENV === "development";
const CONNECTION_STRING = process.env.DATABASE_CONNECTION_STRING || "mongodb://127.0.0.1:27017/kambaz"
mongoose.connect(CONNECTION_STRING);

console.log("🔧 Environment:", isDevelopment ? "DEVELOPMENT" : "PRODUCTION");
console.log("📍 Client URL:", process.env.CLIENT_URL);
console.log("📍 Server URL:", process.env.SERVER_URL);

// =============================================================================
// 1. CORS Configuration (MUST BE FIRST)
// =============================================================================
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL, 
  'http://localhost:3000', 
  'https://kambaz-next-js-466h.vercel.app',
  'https://canvas-clone-frontend.vercel.app' 
];

const vercelPreviewRegex = /-vishwa-pujaras-projects\.vercel\.app$/;

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true); 

    if (ALLOWED_ORIGINS.includes(origin)) {
      console.log("✅ CORS allowed for:", origin);
      return callback(null, true);
    }

    // Allow Vercel preview deployments
    if (origin.match(vercelPreviewRegex)) {
      console.log("✅ CORS allowed for Vercel preview:", origin);
      return callback(null, true);
    }

    console.warn("❌ CORS Blocked Origin:", origin);
    return callback(new Error('Not allowed by CORS'));
  }
}));

// =============================================================================
// 2. SESSION Configuration (MUST BE AFTER CORS, BEFORE BODY PARSER)
// =============================================================================
const sessionOptions = {
  secret: process.env.SESSION_SECRET || "kambaz-secret-key",
  resave: false,
  saveUninitialized: false,
  name: "kambazSessionId", // Custom session cookie name
  cookie: {
    httpOnly: true, // Prevents JavaScript access to the cookie
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  }
};

// PRODUCTION: Secure cookie settings for HTTPS
if (!isDevelopment) {
  sessionOptions.trust = true; // Trust proxy (Render/Vercel set X-Forwarded-Proto)
  sessionOptions.cookie = {
    httpOnly: true,
    secure: true, // HTTPS only
    sameSite: "none", // Allow cross-site cookies
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    domain: process.env.SERVER_DOMAIN || undefined, // Set domain for cross-subdomain cookies
  };
  console.log("🔒 Using PRODUCTION session settings (secure cookies, HTTPS)");
} else {
  // DEVELOPMENT: Allow non-secure cookies for localhost
  sessionOptions.cookie = {
    httpOnly: true,
    secure: false, // Allow HTTP in development
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  console.log("🔓 Using DEVELOPMENT session settings (non-secure cookies)");
}

app.use(session(sessionOptions));

// =============================================================================
// 3. BODY PARSER (MUST BE AFTER CORS AND SESSION)
// =============================================================================
app.use(express.json());

// =============================================================================
// 4. TRUST PROXY (Important for Render/Vercel deployments)
// =============================================================================
if (!isDevelopment) {
  app.set("trust proxy", 1); // Trust first proxy (Render/Vercel uses proxies)
}

// =============================================================================
// 5. HEALTH CHECK ENDPOINT
// =============================================================================
app.get("/", (req, res) => {
  res.json({
    message: "✅ Server is running",
    environment: isDevelopment ? "development" : "production",
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// 6. REGISTER ROUTES
// =============================================================================
UserRoutes(app, db);
CourseRoutes(app, db);
ModuleRoutes(app, db);
AssignmentsRoutes(app, db);
Hello(app);
Lab5(app);

// =============================================================================
// 7. ERROR HANDLING
// =============================================================================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

// =============================================================================
// 8. START SERVER
// =============================================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📌 Development Mode: ${isDevelopment}`);
  console.log(`🔐 Session Secret: ${process.env.SESSION_SECRET ? "✅ Set" : "❌ Missing"}`);
  console.log(`\n`);
});