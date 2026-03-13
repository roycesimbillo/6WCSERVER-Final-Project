import http from "http";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import session from "express-session";
import createMemoryStore from "memorystore";
import cors from "cors";
import projectRoutes from "./routes/projects";
import authRoutes from "./routes/auth";
import passport from "passport";
import dashboardRoutes from "./routes/dashboard";
import usersRoutes from "./routes/users";
import { initializeDatabase } from "./db";

dotenv.config();

const MemoryStore = createMemoryStore(session);
const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ✅ SQLite Database Initialization
function setupDatabase() {
  try {
    initializeDatabase();
    console.log("✅ SQLite database initialized successfully");
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    process.exit(1);
  }
}

setupDatabase();

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", usersRoutes);
app.use(
  "/uploads",
  express.static("uploads", {
    setHeaders: (res, filePath) => {
      res.setHeader("Content-Disposition", `attachment`);
    },
  })
);
app.use("/api/dashboard", dashboardRoutes);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(app);

  const server = http.createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  try {
    if (app.get("env") === "development") {
      console.log("[Server] Setting up Vite...");
      await setupVite(app, server);
      console.log("[Server] Vite setup complete");
    } else {
      serveStatic(app);
    }
  } catch (err) {
    console.error("[Server] Fatal setup error:", err);
    process.exit(1);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "0.0.0.0";
  server.listen(port, host, () => {
    console.log(`🚀 Server running on ${host}:${port}`);
  });

  // Handle any uncaught exceptions
  process.on("uncaughtException", (err) => {
    console.error("[Server] Uncaught exception:", err);
  });
})();
