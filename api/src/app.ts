import express from "express";
import helmet from "helmet";

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  return app;
}
