import { v4 as uuidv4 } from "uuid";
import QuizModel from "./model.js";
import SubmissionModel from "./submission.model.js";

/**
 * Calculates the score for a single quiz attempt.
 * Note: Grading logic is case-insensitive for text answers.
 */
function gradeQuiz(quiz, answers) {
  let score = 0;
  
  // Create a map of questionId to the correct answer(s) for quick lookup
  const correctAnswersMap = {};
  for (const question of quiz.questions) {
    // Normalize correct answers to an array of lowercase, trimmed strings
    let answersArray = [];
    if (question.questionType === "MULTIPLE_CHOICE" || question.questionType === "TRUE_FALSE") {
      if (question.correctAnswer) {
        answersArray = [question.correctAnswer.toLowerCase().trim()];
      }
    } else if (question.questionType === "FILL_IN_THE_BLANK") {
      if (Array.isArray(question.correctAnswers)) {
        answersArray = question.correctAnswers.map(a => a.toLowerCase().trim());
      }
    }

    correctAnswersMap[question._id] = { 
      points: question.points, 
      correct: answersArray 
    };
  }

  // Check student answers against the correct answers
  const gradedAnswers = answers.map(submissionAnswer => {
    const questionData = correctAnswersMap[submissionAnswer.questionId];
    
    // Default to incorrect if question not found or missing correct data
    if (!questionData || questionData.correct.length === 0) {
      return { ...submissionAnswer, isCorrect: false };
    }

    const studentAnswer = submissionAnswer.studentAnswer ? submissionAnswer.studentAnswer.toLowerCase().trim() : '';
    let isCorrect = false;

    // Check if the student's answer matches any of the correct answers
    if (questionData.correct.includes(studentAnswer) && studentAnswer !== '') {
        isCorrect = true;
    }

    if (isCorrect) {
      score += questionData.points;
    }
    
    return { ...submissionAnswer, isCorrect };
  });

  return { score, gradedAnswers };
}

export default function QuizzesDao(db) {
  
  // --- Quiz Helper ---
  
  // Helper to re-calculate total points and update the quiz document
  async function recalculatePoints(quizId) {
    const quiz = await QuizModel.findById(quizId);
    if (!quiz) return;
    
    const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0);
    
    if (quiz.points !== totalPoints) {
        quiz.points = totalPoints;
        await quiz.save();
    }
    return totalPoints;
  }
    
  // --- Quiz CRUD Operations ---
  
  // R: Find all quizzes for a course [cite: 27]
  async function findQuizzesForCourse(courseId) {
    return QuizModel.find({ course: courseId });
  }

  // R: Find quiz by ID
  async function findQuizById(quizId) {
    return QuizModel.findById(quizId);
  }

  // C: Create new quiz (default is unpublished)
  async function createQuiz(courseId, quiz) {
    const newQuiz = {
      _id: uuidv4(),
      course: courseId,
      title: "New Quiz",
      points: 0, 
      ...quiz,
    };
    return QuizModel.create(newQuiz);
  }

  // U: Update quiz (details tab)
  async function updateQuiz(quizId, quizUpdates) {
    await QuizModel.updateOne({ _id: quizId }, { $set: quizUpdates });
    return QuizModel.findById(quizId);
  }

  // U: Toggle publish status [cite: 58]
  async function updateQuizPublishStatus(quizId, isPublished) {
    return QuizModel.updateOne({ _id: quizId }, { $set: { isPublished } });
  }
  
  // D: Delete quiz [cite: 35]
  async function deleteQuiz(quizId) {
    // Also delete all associated submissions [cite: 335]
    await SubmissionModel.deleteMany({ quiz: quizId });
    return QuizModel.deleteOne({ _id: quizId });
  }


  // --- Embedded Question Operations ---

  // C: Add new question [cite: 215]
  async function createQuestion(quizId, question) {
    const newQuestion = { 
        ...question, 
        _id: uuidv4(),
        points: question.points || 10 // Default points [cite: 231]
    }; 
    
    const status = await QuizModel.updateOne(
      { _id: quizId },
      { $push: { questions: newQuestion } }
    );
    
    await recalculatePoints(quizId);
    return newQuestion;
  }

  // U: Update existing question
  async function updateQuestion(quizId, questionId, questionUpdates) {
    const status = await QuizModel.updateOne(
      { _id: quizId, "questions._id": questionId },
      { $set: { "questions.$": { _id: questionId, ...questionUpdates } } }
    );
    
    await recalculatePoints(quizId);
    return status;
  }

  // D: Delete question
  async function deleteQuestion(quizId, questionId) {
    const status = await QuizModel.updateOne(
      { _id: quizId },
      { $pull: { questions: { _id: questionId } } }
    );
    
    await recalculatePoints(quizId);
    return status;
  }
  
  // --- Submission Operations (Student) ---
  
  // R: Find the last submission for a specific student/quiz pair [cite: 340]
  async function findLastSubmissionForUser(quizId, studentId) {
    return SubmissionModel.findOne({ quiz: quizId, student: studentId })
                           .sort({ attemptNumber: -1 }); // Get the highest attempt number
  }

  // C: Create new submission 
  async function createSubmission(quizId, studentId, answers) {
    const quiz = await QuizModel.findById(quizId);
    if (!quiz) throw new Error("Quiz not found");
    
    // 1. Determine next attempt number [cite: 334]
    const lastSubmission = await findLastSubmissionForUser(quizId, studentId);
    const nextAttemptNumber = (lastSubmission ? lastSubmission.attemptNumber : 0) + 1;
    
    // 2. Grade the quiz [cite: 335]
    const { score, gradedAnswers } = gradeQuiz(quiz, answers); 
    
    // 3. Create the submission
    const newSubmission = {
      _id: `${quizId}-${studentId}-${nextAttemptNumber}`,
      quiz: quizId,
      student: studentId,
      attemptNumber: nextAttemptNumber,
      score: score,
      submitted: true, 
      answers: gradedAnswers,
    };
    
    return SubmissionModel.create(newSubmission);
  }


  return {
    findQuizzesForCourse,
    findQuizById,
    createQuiz,
    updateQuiz,
    updateQuizPublishStatus,
    deleteQuiz,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    findLastSubmissionForUser,
    createSubmission,
  };
}