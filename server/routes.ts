import { Express } from "express";
import authRoutes from "./routes/auth";

export async function registerRoutes(app: Express) {
  app.use("/api", authRoutes);
  return app;
}
