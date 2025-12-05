// Kambaz/Quizzes/routes.js

import QuizzesDao from "./dao.js";

// Helper function to check for Faculty or Admin roles
const isFacultyOrAdmin = (user) => {
    // Assuming 'INSTRUCTOR' also has full privileges based on typical LMS roles.
    return user && (user.role === "FACULTY" || user.role === "ADMIN" || user.role === "INSTRUCTOR");
};

export default function QuizRoutes(app, db) {
  const dao = QuizzesDao(db);

  // --- Quiz CRUD Endpoints (Faculty Only) ---
  
  // POST /api/courses/:courseId/quizzes - Create a new quiz [cite: 12, 32]
  const createQuizForCourse = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!isFacultyOrAdmin(currentUser)) {
        return res.status(403).json({ message: "Forbidden: Faculty privilege required." });
    }
    const { courseId } = req.params;
    try {
      const newQuiz = await dao.createQuiz(courseId, req.body);
      res.json(newQuiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Internal server error while creating quiz." });
    }
  };

  // PUT /api/quizzes/:quizId - Update quiz details [cite: 12]
  const updateQuiz = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!isFacultyOrAdmin(currentUser)) {
        return res.status(403).json({ message: "Forbidden: Faculty privilege required." });
    }
    const { quizId } = req.params;
    try {
      const updatedQuiz = await dao.updateQuiz(quizId, req.body);
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Internal server error while updating quiz." });
    }
  };
  
  // DELETE /api/quizzes/:quizId - Delete quiz [cite: 12, 35]
  const deleteQuiz = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!isFacultyOrAdmin(currentUser)) {
        return res.status(403).json({ message: "Forbidden: Faculty privilege required." });
    }
    const { quizId } = req.params;
    try {
      const status = await dao.deleteQuiz(quizId);
      res.json(status);
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Internal server error while deleting quiz." });
    }
  };

  // PUT /api/quizzes/:quizId/publish - Toggle publish status [cite: 58]
  const updateQuizPublishStatus = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!isFacultyOrAdmin(currentUser)) {
        return res.status(403).json({ message: "Forbidden: Faculty privilege required." });
    }
    const { quizId } = req.params;
    const { isPublished } = req.body; 
    try {
      await dao.updateQuizPublishStatus(quizId, isPublished);
      const updatedQuiz = await dao.findQuizById(quizId);
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error updating quiz publish status:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };

  // --- Quiz Retrieval Endpoints (Faculty/Student) ---
  
  // GET /api/courses/:courseId/quizzes - List quizzes for a course [cite: 13, 27]
  const findQuizzesForCourse = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!currentUser) return res.status(401).json({ message: "Unauthorized." });
    
    const { courseId } = req.params;
    const isFaculty = isFacultyOrAdmin(currentUser);
    
    try {
      let quizzes = await dao.findQuizzesForCourse(courseId);
      
      // Filter for Students: only show published quizzes [cite: 74]
      if (!isFaculty) {
          quizzes = quizzes.filter(q => q.isPublished);
      }
      
      // For students, enrich with their last score [cite: 85]
      if (currentUser.role === "STUDENT") {
        const quizzesWithScores = await Promise.all(quizzes.map(async (quiz) => {
            const lastSubmission = await dao.findLastSubmissionForUser(quiz._id, currentUser._id);
            const quizObj = quiz.toObject ? quiz.toObject() : quiz;
            quizObj.lastScore = lastSubmission ? lastSubmission.score : null;
            return quizObj;
        }));
        res.json(quizzesWithScores);
      } else {
        res.json(quizzes);
      }

    } catch (error) {
      console.error("Error fetching quizzes for course:", error);
      res.status(500).json({ message: "Internal server error while fetching quizzes." });
    }
  };

  // GET /api/quizzes/:quizId - Get single quiz details (Faculty sees all, Student sees questions only)
  const findQuizById = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!currentUser) return res.status(401).json({ message: "Unauthorized." });
    
    const { quizId } = req.params;
    const isFaculty = isFacultyOrAdmin(currentUser);
    
    try {
      const quiz = await dao.findQuizById(quizId);
      if (!quiz) return res.status(404).json({ message: "Quiz not found." });

      // Check if student is trying to access an unpublished quiz
      if (!isFaculty && !quiz.isPublished) {
          return res.status(403).json({ message: "Forbidden: This quiz is not published." });
      }
      
      // If student, strip question answers and include last submission
      if (currentUser.role === "STUDENT") {
          const lastSubmission = await dao.findLastSubmissionForUser(quizId, currentUser._id);
          
          const studentQuiz = quiz.toObject();
          // Remove answers from questions array for student preview/taking the quiz
          studentQuiz.questions = studentQuiz.questions.map(q => {
            const { correctAnswer, correctAnswers, ...rest } = q;
            return rest;
          });
          
          studentQuiz.lastSubmission = lastSubmission;
          res.json(studentQuiz);

      } else {
          // Faculty sees the full quiz object including answers
          res.json(quiz);
      }
      
    } catch (error) {
      console.error("Error fetching quiz by ID:", error);
      res.status(500).json({ message: "Internal server error while fetching quiz." });
    }
  };


  // --- Question Management Endpoints (Faculty Only) ---
  
  // POST /api/quizzes/:quizId/questions - Add a new question to a quiz
  const createQuestionForQuiz = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!isFacultyOrAdmin(currentUser)) {
        return res.status(403).json({ message: "Forbidden: Faculty privilege required." });
    }
    const { quizId } = req.params;
    try {
      const newQuestion = await dao.createQuestion(quizId, req.body);
      res.json(newQuestion);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Internal server error while creating question." });
    }
  };

  // PUT /api/quizzes/:quizId/questions/:questionId - Update a question
  const updateQuestion = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!isFacultyOrAdmin(currentUser)) {
        return res.status(403).json({ message: "Forbidden: Faculty privilege required." });
    }
    const { quizId, questionId } = req.params;
    try {
      const status = await dao.updateQuestion(quizId, questionId, req.body);
      if (status.matchedCount === 0) return res.status(404).json({ message: "Quiz or Question not found." });
      // Return the updated quiz to refresh points on the client
      const updatedQuiz = await dao.findQuizById(quizId);
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Internal server error while updating question." });
    }
  };

  // DELETE /api/quizzes/:quizId/questions/:questionId - Delete a question
  const deleteQuestion = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!isFacultyOrAdmin(currentUser)) {
        return res.status(403).json({ message: "Forbidden: Faculty privilege required." });
    }
    const { quizId, questionId } = req.params;
    try {
      const status = await dao.deleteQuestion(quizId, questionId);
      if (status.matchedCount === 0) return res.status(404).json({ message: "Quiz or Question not found." });
      // Return the updated quiz to refresh points on the client
      const updatedQuiz = await dao.findQuizById(quizId);
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Internal server error while deleting question." });
    }
  };

  // --- Submission Endpoints (Student Only) ---

  // POST /api/quizzes/:quizId/submit - Student submits the quiz [cite: 13, 334, 335]
  const submitQuiz = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!currentUser || currentUser.role !== "STUDENT") {
        return res.status(403).json({ message: "Forbidden: Only students can submit a quiz." });
    }

    const { quizId } = req.params;
    const { answers } = req.body; 

    try {
      const quiz = await dao.findQuizById(quizId);
      if (!quiz || !quiz.isPublished) return res.status(404).json({ message: "Quiz not found or not available." });
      
      const lastSubmission = await dao.findLastSubmissionForUser(quizId, currentUser._id);
      const currentAttempts = lastSubmission ? lastSubmission.attemptNumber : 0;
      
      // Check for attempt limit [cite: 339]
      if ((!quiz.multipleAttempts && currentAttempts >= 1) || 
          (quiz.multipleAttempts && currentAttempts >= quiz.howManyAttempts)) {
        return res.status(403).json({ message: `You have exhausted your attempts. Max attempts: ${quiz.howManyAttempts}.` });
      }

      const newSubmission = await dao.createSubmission(quizId, currentUser._id, answers);
      res.json(newSubmission);
      
    } catch (error) {
      if (error.message.includes("Quiz not found")) return res.status(404).json({ message: error.message });
      console.error("Error submitting quiz:", error);
      res.status(500).json({ message: "Internal server error while submitting quiz." });
    }
  };
  
  // GET /api/quizzes/:quizId/submissions/last - Student retrieves their last score/answers [cite: 340]
  const findLastSubmission = async (req, res) => {
    const currentUser = req.session["currentUser"];
    // Faculty can also view submissions, but this route is for the student's own last score
    if (!currentUser || currentUser.role !== "STUDENT") {
        return res.status(403).json({ message: "Forbidden: Only students can view their own last submission via this endpoint." });
    }
    const { quizId } = req.params;
    
    try {
      const lastSubmission = await dao.findLastSubmissionForUser(quizId, currentUser._id);
      if (!lastSubmission) return res.status(404).json({ message: "No submission found for this quiz." });
      
      res.json(lastSubmission);
    } catch (error) {
      console.error("Error fetching last submission:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  
  
  // --- Route Mappings ---
  
  // Quiz CRUD (Faculty/Admin)
  app.post("/api/courses/:courseId/quizzes", createQuizForCourse);
  app.put("/api/quizzes/:quizId", updateQuiz);
  app.delete("/api/quizzes/:quizId", deleteQuiz);
  app.put("/api/quizzes/:quizId/publish", updateQuizPublishStatus);

  // Quiz Read (Faculty/Student)
  app.get("/api/courses/:courseId/quizzes", findQuizzesForCourse);
  app.get("/api/quizzes/:quizId", findQuizById);

  // Question CRUD (Faculty/Admin)
  app.post("/api/quizzes/:quizId/questions", createQuestionForQuiz);
  app.put("/api/quizzes/:quizId/questions/:questionId", updateQuestion);
  app.delete("/api/quizzes/:quizId/questions/:questionId", deleteQuestion);
  
  // Submission (Student)
  app.post("/api/quizzes/:quizId/submit", submitQuiz);
  app.get("/api/quizzes/:quizId/submissions/last", findLastSubmission);
}