import type { Express } from "express";
import { createServer, type Server } from "http";
import { globalErrorHandler } from "./routes/middlewares/errorHandler"; 
import apiRouter from "./routes/index"; 

import "./types"; 

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.use("/api", apiRouter);

  app.use(globalErrorHandler);

  return app;
}