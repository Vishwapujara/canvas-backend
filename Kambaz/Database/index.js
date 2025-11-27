import courses from "./courses.js";
import modules from "./modules.js";
import assignments from "./assignments.js";
import users from "./users.js";
import enrollments from "./enrollments.js";

const db = { 
  courses: [...courses], 
  modules: [...modules], 
  assignments: [...assignments], 
  users: [...users], 
  enrollments: [...enrollments] 
};

export default { courses, modules, assignments, users, enrollments };
