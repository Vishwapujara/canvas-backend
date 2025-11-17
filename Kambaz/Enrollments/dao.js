import { v4 as uuidv4 } from "uuid";

export default function EnrollmentsDao(db) {
  const findCoursesForUser = (userId) => {
    // This function is in CoursesDao in the book, but logically fits here too.
    // We'll find the course IDs from enrollments.
    const enrollments = db.enrollments.filter((e) => e.user === userId);
    const courseIds = enrollments.map((e) => e.course);
    const courses = db.courses.filter((c) => courseIds.includes(c._id));
    return courses;
  };

  const findUsersForCourse = (courseId) => {
    const enrollments = db.enrollments.filter((e) => e.course === courseId);
    const userIds = enrollments.map((e) => e.user);
    const users = db.users.filter((u) => userIds.includes(u._id));
    return users;
  };

  const enrollUserInCourse = (userId, courseId) => {
    // Check if enrollment already exists
    const existingEnrollment = db.enrollments.find(
      (e) => e.user === userId && e.course === courseId
    );
    if (existingEnrollment) {
      return existingEnrollment; // Already enrolled
    }
    // Create new enrollment
    const newEnrollment = {
      _id: uuidv4(),
      user: userId,
      course: courseId,
    };
    db.enrollments.push(newEnrollment);
    return newEnrollment;
  };

  const unenrollUserFromCourse = (userId, courseId) => {
    // Filter out the enrollment
    const initialLength = db.enrollments.length;
    db.enrollments = db.enrollments.filter(
      (e) => e.user !== userId || e.course !== courseId
    );
    // Return status (1 if deleted, 0 if not found)
    return initialLength > db.enrollments.length ? 1 : 0;
  };

  return {
    findCoursesForUser,
    findUsersForCourse,
    enrollUserInCourse,
    unenrollUserFromCourse,
  };
}