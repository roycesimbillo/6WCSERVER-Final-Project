import express from "express";
import { findUserById, updateUserProfile } from "../db-utils";
import { ensureAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only PDF/DOC/DOCX allowed."));
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only images allowed."));
  },
});

router.get("/:id", ensureAuth, (req, res) => {
  try {
    const userId = req.params.id;
    const user = findUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Don't send password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/stats", ensureAuth, (req, res) => {
  try {
    const userId = req.params.id;

    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as projectsCount,
        COALESCE(SUM(thumbsUp), 0) as totalThumbsUp,
        COALESCE(SUM(thumbsDown), 0) as totalThumbsDown
      FROM projects 
      WHERE uploadedBy = ?
    `);
    
    const stats: any = stmt.get(userId);

    res.json({
      projectsCount: stats.projectsCount || 0,
      rating: stats.totalThumbsUp || 0,
      totalThumbsDown: stats.totalThumbsDown || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/profile-picture", ensureAuth, imageUpload.single("profilePicture"), (req, res) => {
  try {
    const userId = req.params.id;
    const currentUser = req.session.user;
    if (currentUser?.id !== userId && !(currentUser?.role === "admin" || currentUser?.role === "teacher"))
      return res.status(403).json({ message: "Not authorized" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = findUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const profilePicture = JSON.stringify({
      name: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
    });

    updateUserProfile(userId, { profilePicture });
    res.json({
      message: "Profile picture uploaded",
      profilePicture: JSON.parse(profilePicture),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/profile", ensureAuth, (req, res) => {
  try {
    const userId = req.params.id;
    const currentUser = req.session.user;
    if (currentUser?.id !== userId && !(currentUser?.role === "admin" || currentUser?.role === "teacher"))
      return res.status(403).json({ message: "Not authorized" });

    const { name, bio } = req.body;
    const user = findUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updates: any = {};
    if (bio !== undefined) updates.bio = bio;

    const updated = updateUserProfile(userId, updates);

    // Update name separately since we don't have updateUserName
    if (name) {
      const stmt = db.prepare("UPDATE users SET name = ? WHERE id = ?");
      stmt.run(name, userId);
    }

    res.json({
      message: "Profile updated",
      user: { id: updated?.id, name: updated?.name, bio: updated?.bio },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

router.post("/:id/promote", async (req, res) => {
  try {
    const secret = req.headers["x-promote-secret"] || req.body?.secret;
    if (!secret || secret !== process.env.PROMOTE_SECRET) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "admin";
    await user.save();
    res.json({ message: "User promoted to admin", user: { id: user._id, role: user.role } });
  } catch (err) {
    console.error("Promote error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
