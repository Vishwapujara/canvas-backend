import model from "./model.js";

export default function AssignmentsDao(db) {
  
  // R: Read (Find all for a course)
  function findAssignmentsForCourse(courseId) {
    return model.find({ course: courseId });
  }

  // C: Create
  function createAssignment(assignment) {
    return model.create(assignment);
  }

  // U: Update
  async function updateAssignment(assignmentId, assignmentUpdates) {
    await model.updateOne({ _id: assignmentId }, { $set: assignmentUpdates });
    const updatedAssignment = await model.findById(assignmentId);
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