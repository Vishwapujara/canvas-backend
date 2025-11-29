import CoursesDao from "./dao.js";
import EnrollmentsDao from "../Enrollments/dao.js";
export default function CourseRoutes(app, db) {
    const dao = CoursesDao(db);
    const enrollmentsDao = EnrollmentsDao(db);
    
    // REFACTORED to async
    const findAllCourses = async (req, res) => {
        const courses = await dao.findAllCourses();
        res.send(courses);
    }
    
// REFACTORED (6.4.3.2): Use Enrollments DAO to find enrolled courses
    const findCoursesForEnrolledUser = async (req, res) => {
        let { userId } = req.params;
        if (userId === "current") {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                res.sendStatus(401);
                return;
            }
            userId = currentUser._id;
        }
        // Use EnrollmentsDao to fetch courses for the user
        const courses = await enrollmentsDao.findCoursesForUser(userId);
        res.json(courses);
    };
    
    // REFACTORED to async
    const createCourse = async (req, res) => {
        const currentUser = req.session["currentUser"];
        const newCourse = await dao.createCourse(req.body); // AWAIT
        enrollmentsDao.enrollUserInCourse(currentUser._id, newCourse._id);
        res.json(newCourse);
    };
    
    // REFACTORED (6.4.3.3): Delete enrollments before deleting course
    const deleteCourse = async (req, res) => {
        const { courseId } = req.params;
        // 1. Unenroll all users from the course
        await enrollmentsDao.unenrollAllUsersFromCourse(courseId);
        // 2. Delete the course
        const status = await dao.deleteCourse(courseId); 
        res.send(status);
    }
    
    // REFACTORED to async
    const updateCourse = async (req, res) => {
        const { courseId } = req.params;
        const courseUpdates = req.body;
        const updatedCourse = await dao.updateCourse(courseId, courseUpdates); // AWAIT
        res.send(updatedCourse);
    }

    // NEW ROUTE: Enroll user in course
    const enrollUserInCourse = async (req, res) => {
        let { uid, cid } = req.params;
        if (uid === "current") {
            const currentUser = req.session["currentUser"];
            if (!currentUser) { res.sendStatus(401); return; }
            uid = currentUser._id;
        }
        const status = await enrollmentsDao.enrollUserInCourse(uid, cid);
        res.json(status);
    };
    
    // NEW ROUTE : Unenroll user from course
    const unenrollUserFromCourse = async (req, res) => {
        let { uid, cid } = req.params;
        if (uid === "current") {
            const currentUser = req.session["currentUser"];
            if (!currentUser) { res.sendStatus(401); return; }
            uid = currentUser._id;
        }
        const status = await enrollmentsDao.unenrollUserFromCourse(uid, cid);
        res.json(status);
    };

    // NEW ROUTE : Find users enrolled in a course (for People page)
    const findUsersForCourse = async (req, res) => {
        const { cid } = req.params;
        const users = await enrollmentsDao.findUsersForCourse(cid);
        res.json(users);
    }
    
    app.put("/api/courses/:courseId", updateCourse);
    app.delete("/api/courses/:courseId", deleteCourse)
    app.post("/api/users/current/courses", createCourse);
    app.get("/api/users/:userId/courses", findCoursesForEnrolledUser)
    app.get("/api/courses", findAllCourses);
    app.post("/api/users/:uid/courses/:cid", enrollUserInCourse);
    app.delete("/api/users/:uid/courses/:cid", unenrollUserFromCourse);
    app.get("/api/courses/:cid/users", findUsersForCourse)
}