import mongoose from "mongoose";
const enrollmentSchema = new mongoose.Schema(
  {
    _id: String,
    // References the CourseModel using its 'name' declared in Mongoose
    course: { type: String, ref: "CourseModel" },
    // References the UserModel using its 'name' declared in Mongoose
    user: 	 { type: String, ref: "UserModel"	 	},
    grade: Number,
    letterGrade: String,
    enrollmentDate: Date,
    status: {
      type: String,
      enum: ["ENROLLED", "DROPPED", "COMPLETED"],
      default: "ENROLLED",
    },
  },
  { collection: "enrollments" }
);
export default enrollmentSchema;