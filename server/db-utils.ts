import { db } from "./db";
import { v4 as uuidv4 } from "uuid";

// ===== USER OPERATIONS =====
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
  bio: string;
  profilePicture?: string;
  createdAt: string;
}

export function findUserByEmail(email: string): User | null {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return stmt.get(email) as User | null;
}

export function findUserById(id: string): User | null {
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  return stmt.get(id) as User | null;
}

export function createUser(name: string, email: string, password: string, role: string = "student"): User {
  const id = uuidv4();
  const stmt = db.prepare(
    "INSERT INTO users (id, name, email, password, role, bio) VALUES (?, ?, ?, ?, ?, '')"
  );
  stmt.run(id, name, email, password, role);
  return findUserById(id) as User;
}

export function updateUserProfile(id: string, data: Partial<User>): User | null {
  const fields = [];
  const values: any[] = [];
  
  if (data.bio !== undefined) {
    fields.push("bio = ?");
    values.push(data.bio);
  }
  if (data.profilePicture !== undefined) {
    fields.push("profilePicture = ?");
    values.push(data.profilePicture);
  }
  
  if (fields.length === 0) return findUserById(id);
  
  values.push(id);
  const stmt = db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`);
  stmt.run(...values);
  
  return findUserById(id);
}

// ===== PROJECT OPERATIONS =====
export interface Project {
  id: string;
  title: string;
  description: string;
  course: string;
  tags: string[];
  files: Array<{ name: string; path: string; size: number }>;
  uploadedBy: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  thumbsUp: number;
  thumbsDown: number;
}

export function findProjectById(id: string): Project | null {
  const stmt = db.prepare("SELECT * FROM projects WHERE id = ?");
  const row: any = stmt.get(id);
  if (!row) return null;
  
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    files: row.files ? JSON.parse(row.files) : [],
  };
}

export function findAllProjects(limit: number = 100, offset: number = 0): Project[] {
  const stmt = db.prepare("SELECT * FROM projects ORDER BY createdAt DESC LIMIT ? OFFSET ?");
  const rows: any[] = stmt.all(limit, offset);
  
  return rows.map(row => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    files: row.files ? JSON.parse(row.files) : [],
  }));
}

export function findProjectsByStatus(status: string, limit: number = 100): Project[] {
  const stmt = db.prepare("SELECT * FROM projects WHERE status = ? ORDER BY createdAt DESC LIMIT ?");
  const rows: any[] = stmt.all(status, limit);
  
  return rows.map(row => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    files: row.files ? JSON.parse(row.files) : [],
  }));
}

export function createProject(data: {
  title: string;
  description: string;
  course: string;
  tags: string[];
  files: any[];
  uploadedBy: string;
  status?: string;
}): Project {
  const id = uuidv4();
  const stmt = db.prepare(
    `INSERT INTO projects (id, title, description, course, tags, files, uploadedBy, status, thumbsUp, thumbsDown)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  
  stmt.run(
    id,
    data.title,
    data.description,
    data.course,
    JSON.stringify(data.tags),
    JSON.stringify(data.files),
    data.uploadedBy,
    data.status || "pending",
    0,
    0
  );
  
  return findProjectById(id) as Project;
}

export function updateProjectStatus(projectId: string, status: string): Project | null {
  const stmt = db.prepare("UPDATE projects SET status = ? WHERE id = ?");
  stmt.run(status, projectId);
  return findProjectById(projectId);
}

// ===== COMMENT OPERATIONS =====
export interface Comment {
  id: string;
  projectId: string;
  author: string;
  text: string;
  createdAt: string;
}

export function getProjectComments(projectId: string): Comment[] {
  const stmt = db.prepare("SELECT * FROM comments WHERE projectId = ? ORDER BY createdAt DESC");
  return stmt.all(projectId) as Comment[];
}

export function addComment(projectId: string, author: string, text: string): Comment {
  const id = uuidv4();
  const stmt = db.prepare(
    "INSERT INTO comments (id, projectId, author, text) VALUES (?, ?, ?, ?)"
  );
  stmt.run(id, projectId, author, text);
  
  const getStmt = db.prepare("SELECT * FROM comments WHERE id = ?");
  return getStmt.get(id) as Comment;
}

// ===== VOTE OPERATIONS =====
export interface Vote {
  id: string;
  projectId: string;
  userId: string;
  type: "up" | "down";
}

export function getUserVote(projectId: string, userId: string): Vote | null {
  const stmt = db.prepare("SELECT * FROM votes WHERE projectId = ? AND userId = ?");
  return stmt.get(projectId, userId) as Vote | null;
}

export function addVote(projectId: string, userId: string, type: "up" | "down"): void {
  const existingVote = getUserVote(projectId, userId);
  
  if (existingVote) {
    // Remove old vote and update thumbs
    removeVote(existingVote.id, projectId, existingVote.type);
  }
  
  const id = uuidv4();
  const stmt = db.prepare("INSERT INTO votes (id, projectId, userId, type) VALUES (?, ?, ?, ?)");
  stmt.run(id, projectId, userId, type);
  
  // Update thumbs count
  updateProjectVoteCounts(projectId);
}

export function removeVote(voteId: string, projectId: string, type: string): void {
  const stmt = db.prepare("DELETE FROM votes WHERE id = ?");
  stmt.run(voteId);
  updateProjectVoteCounts(projectId);
}

export function updateProjectVoteCounts(projectId: string): void {
  const upStmt = db.prepare("SELECT COUNT(*) as count FROM votes WHERE projectId = ? AND type = 'up'");
  const downStmt = db.prepare("SELECT COUNT(*) as count FROM votes WHERE projectId = ? AND type = 'down'");
  
  const upCount = (upStmt.get(projectId) as any).count;
  const downCount = (downStmt.get(projectId) as any).count;
  
  const updateStmt = db.prepare("UPDATE projects SET thumbsUp = ?, thumbsDown = ? WHERE id = ?");
  updateStmt.run(upCount, downCount, projectId);
}

export function getProjectStats() {
  const totalStmt = db.prepare("SELECT COUNT(*) as count FROM projects");
  const approvedStmt = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'approved'");
  const usersStmt = db.prepare("SELECT COUNT(*) as count FROM users");
  
  return {
    totalProjects: (totalStmt.get() as any).count,
    approvedProjects: (approvedStmt.get() as any).count,
    totalUsers: (usersStmt.get() as any).count,
  };
}
