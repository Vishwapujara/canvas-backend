import model from "./model.js";

export default function CoursesDao(db) {
  function findAllCourses() {
    // REFACTORED: Use Mongoose model.find() with projection
    return model.find({}, { name: 1, description: 1 });
  }

  function createCourse(course) {
    // REFACTORED: Use Mongoose model.create()
    return model.create(course);
  }

  async function deleteCourse(courseId) {
    // REFACTORED: Only deletes the course from the MongoDB collection.
    // Cleanup of enrollments is now handled in the routes file.
    return model.deleteOne({ _id: courseId });
  }

  async function updateCourse(courseId, courseUpdates) {
    // REFACTORED: Update in MongoDB
    await model.updateOne({ _id: courseId }, { $set: courseUpdates });

    // Fetch and return the updated course
    const updatedCourse = await model.findById(courseId);
    return updatedCourse;
  }

  return { findAllCourses, createCourse, deleteCourse, updateCourse };
}