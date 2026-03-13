import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
  bio: { type: String, default: "" },
  profilePicture: {
    name: String,
    path: String,
    size: Number,
  },
  resumes: [
    {
      name: String,
      path: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model("User", userSchema);
