import mongoose from "mongoose";
const assignmentSchema = new mongoose.Schema({
   _id: String,
   title: String,
   course: String, // Course ID foreign key
   due: Date,
   maxPoints: Number,
   available: Date,
   description: String,
 },
 { collection: "assignments" }
);
export default assignmentSchema;