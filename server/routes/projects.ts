import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createProject,
  findProjectById,
  findAllProjects,
  findProjectsByStatus,
  updateProjectStatus,
  getProjectComments,
  addComment,
  addVote,
  getUserVote,
  removeVote,
  updateProjectVoteCounts,
} from "../db-utils";
import { ensureAuth } from "./auth";
import { isStaff } from "../lib/roles";
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
const upload = multer({ storage });

router.post("/upload", ensureAuth, upload.array("files", 10), (req, res) => {
  try {
    const { title, description, course, tags } = req.body;
    const user = req.session.user;

    if (!title || !description || !course) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const fileInfos = (req.files as Express.Multer.File[]).map((file) => ({
      name: file.originalname,
      path: `/uploads/${file.filename}`,
      size: file.size,
    }));

    const project = createProject({
      title,
      description,
      course,
      tags: Array.isArray(tags) ? tags : tags ? tags.split(",") : [],
      files: fileInfos,
      uploadedBy: user?.id || "",
      status: "pending",
    });

    res.json({ message: "Project uploaded successfully", project });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", ensureAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected", "pending"].includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const project = findProjectById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const updated = updateProjectStatus(id, status);
    res.json({ message: `Project ${status}`, project: updated });
  } catch (err) {
    console.error("Error updating project status:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", (req, res) => {
  try {
    const { userId, status } = req.query;
    const currentUser = req.session.user;
    const isAdmin = isStaff(currentUser);

    let projects: any[] = [];

    if (!currentUser) {
      // Not logged in - only show approved projects
      projects = findProjectsByStatus("approved", 50);
    } else {
      const isRequestingOwn = userId && String(userId) === String(currentUser.id);

      if (isAdmin || isRequestingOwn) {
        // Admin or requesting own - show all or filtered
        if (userId) {
          const stmt = db.prepare("SELECT * FROM projects WHERE uploadedBy = ? ORDER BY createdAt DESC LIMIT 50");
          const rows: any[] = stmt.all(userId);
          projects = rows.map(row => ({
            ...row,
            tags: row.tags ? JSON.parse(row.tags) : [],
            files: row.files ? JSON.parse(row.files) : [],
          }));
        } else if (status) {
          projects = findProjectsByStatus(status as string, 50);
        } else {
          projects = findAllProjects(50);
        }
      } else {
        // Regular user - show approved + own pending
        const allProjects = findAllProjects(999);
        projects = allProjects.filter(
          p =>
            p.status === "approved" ||
            (p.status === "pending" && p.uploadedBy === currentUser.id)
        );
      }
    }

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Vary", "Origin, Cookie");
    res.json(projects);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/tags", (req, res) => {
  try {
    const stmt = db.prepare("SELECT DISTINCT tags FROM projects WHERE tags IS NOT NULL");
    const rows: any[] = stmt.all();
    const allTags = new Set<string>();

    rows.forEach(row => {
      if (row.tags) {
        const tags = JSON.parse(row.tags);
        if (Array.isArray(tags)) {
          tags.forEach(tag => allTags.add(tag));
        }
      }
    });

    res.json(Array.from(allTags).sort());
  } catch (err) {
    console.error("Error fetching tags:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", (req, res) => {
  try {
    const project = findProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:id/comments", (req, res) => {
  try {
    const { author, text } = req.body;
    if (!text || !author) return res.status(400).json({ message: "Author and text required" });

    const project = findProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const newComment = addComment(req.params.id, author, text);
    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/comments", (req, res) => {
  try {
    const project = findProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const comments = getProjectComments(req.params.id);
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/vote", ensureAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const userId = req.session.user?.id;

    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    if (!["up", "down"].includes(type))
      return res.status(400).json({ message: "Invalid vote type" });

    const project = findProjectById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    addVote(id, userId, type);

    const updated = findProjectById(id);
    res.json({
      thumbsUp: updated?.thumbsUp || 0,
      thumbsDown: updated?.thumbsDown || 0,
      message: "Vote updated",
    });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", ensureAuth, (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.session.user;
    const project = findProjectById(id);

    if (!project) return res.status(404).json({ message: "Project not found" });

    const isOwner = project.uploadedBy === currentUser?.id;
    const isAdmin = isStaff(currentUser);
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Not authorized" });

    const stmt = db.prepare("DELETE FROM projects WHERE id = ?");
    stmt.run(id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", ensureAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, status } = req.body;
    const currentUser = req.session.user;

    const project = findProjectById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isOwner = project.uploadedBy === currentUser?.id;
    const isAdmin = isStaff(currentUser);
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Not authorized" });

    const updateStmt = db.prepare(
      "UPDATE projects SET title = ?, description = ?, tags = ?, status = ? WHERE id = ?"
    );
    updateStmt.run(
      title ?? project.title,
      description ?? project.description,
      tags ? JSON.stringify(tags) : project.tags ? JSON.stringify(project.tags) : null,
      status ?? project.status,
      id
    );

    const updated = findProjectById(id);
    res.json({ message: "Project updated", project: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
