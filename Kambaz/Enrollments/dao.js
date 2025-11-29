import model from "./model.js";

export default function EnrollmentsDao(db) {
  
  // REFACTORED: Finds enrollments for a user and populates the 'course' field
  async function findCoursesForUser(userId) {
    const enrollments = await model.find({ user: userId }).populate("course");
    // Returns an array of actual Course documents
    return enrollments.map((enrollment) => enrollment.course);
  }

  // REFACTORED: Finds enrollments for a course and populates the 'user' field
  async function findUsersForCourse(courseId) {
    const enrollments = await model.find({ course: courseId }).populate("user");
    // Returns an array of actual User documents
    return enrollments.map((enrollment) => enrollment.user);
  }

  // REFACTORED: Creates a new enrollment document
  function enrollUserInCourse(userId, courseId) {
    return model.create({
      user: userId,
      course: courseId,
      // Create a predictable _id to prevent duplicate entries
      _id: `${userId}-${courseId}`, 
    });
  }
  
  // REFACTORED: Deletes a single enrollment
  function unenrollUserFromCourse(user, course) {
    return model.deleteOne({ user, course });
  }

  // NEW: Deletes all enrollments for a given course
  function unenrollAllUsersFromCourse(courseId) {
    return model.deleteMany({ course: courseId });
  }

  return {
    findCoursesForUser,
    findUsersForCourse,
    enrollUserInCourse,
    unenrollUserFromCourse,
    unenrollAllUsersFromCourse,
  };
}