import express from "express";
import { findAllProjects, findProjectsByStatus } from "../db-utils";
import { ensureAuth } from "./auth";

const router = express.Router();

router.get("/", ensureAuth, (req, res) => {
  try {
    const allProjects = findAllProjects(999);

    const feedProjects = allProjects;

    const recentProjects = allProjects
      .filter(p => p.status === "approved")
      .slice(0, 3);

    const topProjects = [...allProjects]
      .sort((a, b) => (b.thumbsUp || 0) - (a.thumbsUp || 0))
      .slice(0, 3);

    res.json({ feedProjects, recentProjects, topProjects });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
