import AssignmentsDao from "./dao.js";

export default function AssignmentsRoutes(app, db) {
  const dao = AssignmentsDao(db);

  console.log('=== ASSIGNMENTS ROUTES INITIALIZED ===');
  console.log('Total assignments in DB:', db.assignments?.length || 0);
  console.log('Sample assignment:', db.assignments?.[0]);

  const findAssignmentsForCourse = (req, res) => {
    const { courseId } = req.params;
    console.log('\n=== GET ASSIGNMENTS REQUEST ===');
    console.log('Course ID:', courseId);
    console.log('Session User:', req.session?.currentUser?.username || 'No session');
    
    const assignments = dao.findAssignmentsForCourse(courseId);
    
    console.log('Found assignments:', assignments.length);
    console.log('Assignment IDs:', assignments.map(a => a._id));
    console.log('Assignment titles:', assignments.map(a => a.title));
    
    res.json(assignments);
  };

  const createAssignmentForCourse = (req, res) => {
    const { courseId } = req.params;
    const assignment = { ...req.body, course: courseId };
    const newAssignment = dao.createAssignment(assignment);
    res.json(newAssignment);
  };

  const updateAssignment = (req, res) => {
    const { assignmentId } = req.params;
    const updates = req.body;
    const updated = dao.updateAssignment(assignmentId, updates);
    res.json(updated);
  };

  const deleteAssignment = (req, res) => {
    const { assignmentId } = req.params;
    const status = dao.deleteAssignment(assignmentId);
    res.json(status);
  };

  app.get("/api/courses/:courseId/assignments", findAssignmentsForCourse);
  app.post("/api/courses/:courseId/assignments", createAssignmentForCourse);
  app.put("/api/assignments/:assignmentId", updateAssignment);
  app.delete("/api/assignments/:assignmentId", deleteAssignment);
}
