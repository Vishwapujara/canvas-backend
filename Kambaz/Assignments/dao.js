import model from "./model.js";
import { v4 as uuidv4 } from "uuid";

export default function AssignmentsDao(db) {
  
  // R: Read (Find all for a course)
  function findAssignmentsForCourse(courseId) {
    return model.find({ course: courseId });
  }

  // Kambaz/Assignments/dao.js

// C: Create
function createAssignment(assignment) {
    const newAssignment = {
        _id: uuidv4(), 
        ...assignment // Spreads the title, due, maxPoints, etc. here
    };
    return model.create(newAssignment); // Attempts to save the full object
}

  // Kambaz/Assignments/dao.js

// U: Update
async function updateAssignment(assignmentId, assignmentUpdates) {
    // Use findByIdAndUpdate to perform the update and return the updated document in one query
    const updatedAssignment = await model.findByIdAndUpdate(
        assignmentId, 
        { $set: assignmentUpdates }, 
        { new: true } // IMPORTANT: This tells Mongoose to return the *updated* document
    );
    
    // Check if the assignment was actually found and updated
    if (!updatedAssignment) {
        // You would typically throw an error here or return a 404 response in the route
        console.warn(`Assignment ID ${assignmentId} not found for update.`);
    }
    
    return updatedAssignment;
}
  // D: Delete
  async function deleteAssignment(assignmentId) {
    const status = await model.deleteOne({ _id: assignmentId });
    return status;
  }

  return {
    findAssignmentsForCourse,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}