import { v4 as uuidv4 } from "uuid";
// NOTE: Must now import CourseModel instead of ModuleModel
import model from "../Courses/model.js"; 

export default function ModulesDao(db) {
  
  // REFACTORED: Retrieve modules array from parent course document
  async function findModulesForCourse(courseId) {
    const course = await model.findById(courseId); // Find the course
    // Return the subdocument array
    return course.modules;
  }

  // REFACTORED: Use $push to insert new module subdocument
  async function createModule(courseId, module) {
    const newModule = { 
        ...module, 
        _id: uuidv4(), // Generate client-side ID for subdocument
        lessons: [] // Ensure lessons array exists
    }; 
    
    const status = await model.updateOne(
      { _id: courseId },
      { $push: { modules: newModule } } // Push to the modules array
    );
    // Returning the newly created module (with its generated _id)
    return newModule;
  }

  // REFACTORED: Use $pull to remove module subdocument
  async function deleteModule(courseId, moduleId) {
    const status = await model.updateOne(
      { _id: courseId },
      { $pull: { modules: { _id: moduleId } } } // Pull the subdocument by its _id
    );
    return status;
  }

  // REFACTORED: Use findById and modules.id() to update subdocument
  async function updateModule(courseId, moduleId, moduleUpdates) {
    const course = await model.findById(courseId);
    if (!course) {
        throw new Error(`Course with ID ${courseId} not found.`);
    }
    // Find the subdocument within the modules array
    const module = course.modules.id(moduleId);
    if (!module) {
        throw new Error(`Module with ID ${moduleId} not found in course ${courseId}.`);
    }
    
    // Use Object.assign to apply updates to the subdocument
    Object.assign(module, moduleUpdates); 
    await course.save(); // Save the parent document to persist subdocument changes
    
    return module;
  }

  return {
    findModulesForCourse,
    createModule,
    deleteModule,
    updateModule,
  };
}