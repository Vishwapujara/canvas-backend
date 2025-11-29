// Kambaz/Database/index.js

import { createRequire } from 'module'; // 1. Import the utility
const require = createRequire(import.meta.url); // 2. Create the require function

// 3. Use require() to load JSON files safely
const courses = require("./courses.json");
const modules = require("./modules.json");
const assignments = require("./assignments.json");
const users = require("./users.json");
const enrollments = require("./enrollments.json");

const db = { 
  courses: [...courses], 
  modules: [...modules], 
  assignments: [...assignments], 
  users: [...users], 
  enrollments: [...enrollments] 
};

export default { courses, modules, assignments, users, enrollments };