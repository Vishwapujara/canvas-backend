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
      // Ensure the field exists and contains items, map elements defensively
      if (Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0) {
        answersArray = question.correctAnswers
          .map(a => (a ? String(a).toLowerCase().trim() : ""))
          .filter(a => a !== ""); // drop empty entries
      }
    }

    correctAnswersMap[question._id] = {
      points: question.points || 0, // default to 0 if undefined
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
    // 1. Fetch the quiz, including only the questions array
    const quiz = await QuizModel.findById(quizId).select('questions points');

    if (!quiz) return 0;

    // 2. Calculate the new total points
    const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0);

    // 3. Use updateOne to ATOMICALLY set the new total points
    // This avoids fetching the full document and calling .save(), skipping validation.
    await QuizModel.updateOne(
      { _id: quizId },
      { $set: { points: totalPoints } }
    );

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

  // U: Update existing question (The definitive atomic fix)
  async function updateQuestion(quizId, questionId, questionUpdates) {

    // 1. Prepare updates using $set on specific fields
    const setUpdates = {};
    for (const key in questionUpdates) {
      // Correctly targets only the updated field in the matched subdocument
      setUpdates[`questions.$.${key}`] = questionUpdates[key];
    }

    // 2. Execute the atomic update. This bypasses the dangerous quiz.save() call.
    const status = await QuizModel.updateOne(
      { _id: quizId, "questions._id": questionId }, // Match quiz and subdocument
      { $set: setUpdates } // Apply partial updates
    );

    // 3. Recalculate points (This is now safe as it uses QuizModel.updateOne internally)
    await recalculatePoints(quizId);

    // 4. Return the Mongoose status object for the route check
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