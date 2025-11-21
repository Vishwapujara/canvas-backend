import CoursesDao from "./dao.js";
import EnrollmentsDao from "../Enrollments/dao.js";
export default function CourseRoutes(app, db) {
    const dao = CoursesDao(db);
    const enrollmentsDao = EnrollmentsDao(db);
    const findAllCourses = (req, res) => {
        const courses = dao.findAllCourses();
        res.send(courses);
    }
    // const findCoursesForEnrolledUser = (req, res) => {
    //     let { userId } = req.params;
    //     if (userId === "current") {
    //         const currentUser = req.session["currentUser"];
    //         if (!currentUser) {
    //             res.sendStatus(401);
    //             return;
    //         }
    //         userId = currentUser._id;
    //     }
    //     const courses = dao.findCoursesForEnrolledUser(userId);
    //     res.json(courses);
    // };
    const findCoursesForEnrolledUser = (req, res) => {
    console.log('=== Finding courses for enrolled user ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    console.log('Current user:', req.session["currentUser"]);
    
    let { userId } = req.params;
    if (userId === "current") {
        const currentUser = req.session["currentUser"];
        if (!currentUser) {
            console.log('❌ No current user in session!');
            res.sendStatus(401);
            return;
        }
        userId = currentUser._id;
    }
    const courses = dao.findCoursesForEnrolledUser(userId);
    res.json(courses);
};
    const createCourse = (req, res) => {
        const currentUser = req.session["currentUser"];
        const newCourse = dao.createCourse(req.body);
        enrollmentsDao.enrollUserInCourse(currentUser._id, newCourse._id);
        res.json(newCourse);
    };
    const deleteCourse = (req, res) => {
        const { courseId } = req.params;
        const status = dao.deleteCourse(courseId);
        res.send(status);
    }
    const updateCourse = (req, res) => {
        const { courseId } = req.params;
        const courseUpdates = req.body;
        const status = dao.updateCourse(courseId, courseUpdates);
        res.send(status);
    }
    app.put("/api/courses/:courseId", updateCourse);
    app.delete("/api/courses/:courseId", deleteCourse)
    app.post("/api/users/current/courses", createCourse);
    app.get("/api/users/:userId/courses", findCoursesForEnrolledUser)
    app.get("/api/courses", findAllCourses);
}
