import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";


const viteLogger = createLogger();

const host = process.env.VITE_HOST || "0.0.0.0";
const port = Number(process.env.VITE_PORT) || 5173;

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
      watch: {
    usePolling: true,
  },
    hmr: {
      server,
    },
    allowedHosts: "all",
  };

  const vite = await createViteServer({
    ...viteConfig,
    server: serverOptions,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    
    appType: "custom",
  });

  app.use(vite.middlewares);

  return vite;

}

export function serveStatic(app: Express) {
  const distPath = path.resolve(
    import.meta.dirname,
    "..",
    "dist",
    "public",
  );

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
