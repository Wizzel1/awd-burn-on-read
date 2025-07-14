import express from "express";
import nunjucks from "nunjucks";
import path from "path";
import {
  saveContentToFile,
  getContentById,
  deleteFileById,
  cleanupExpiredFiles,
  createExpirationDate,
} from "../src/services/fileService";
import z from "zod";
import { contentSchema } from "./types/content";

const app = express();
const port = process.env.PORT || 3000;

const env = nunjucks.configure(path.join(__dirname, "../templates"), {
  autoescape: true,
  express: app,
  watch: true,
});

env.addFilter("date", (date: Date, format: string) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

function errorHandler(
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.error(err.stack);
  res.status(500).render("error.html", {
    errorType: "server_error",
  });
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(errorHandler);

app.get("/", (req, res) => {
  res.render("create.html");
});

app.post("/create", async (req, res) => {
  const { content, title, ttl } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).render("error.html", {
      errorType: "invalid_content",
      message: "Content cannot be empty",
    });
  }
  const ttlParsed = z.coerce.number().parse(ttl);
  const ttlSeconds = ttl ? ttlParsed : undefined;
  console.log(ttlSeconds);
  const expiresAt = createExpirationDate(ttlSeconds);

  const contentParsed = contentSchema.safeParse({
    content,
    title,
    createdAt: new Date(),
    expiresAt,
  });
  if (contentParsed.error) {
    return res.status(400).render("error.html", {
      errorType: "invalid_content",
      message: "Content cannot be empty",
    });
  }

  const id = await saveContentToFile(contentParsed.data);
  const link = `${req.protocol}://${req.get("host")}/read/${id}`;
  res.redirect(`/success?id=${id}&link=${encodeURIComponent(link)}`);
});

app.get("/success", async (req, res) => {
  const { id, link } = req.query;
  const content = await getContentById(id as string);
  if (!id || !content) {
    return res.status(404).render("error.html", {
      errorType: "not_found",
    });
  }

  res.render("success.html", {
    link: decodeURIComponent(link as string),
    title: content.title,
    id: id,
    expiresAt: content.expiresAt,
  });
});

app.get("/read/:id", async (req, res) => {
  const { id } = req.params;
  const file = await getContentById(id);
  if (!file) {
    return res.render("error.html", {
      errorType: "not_found",
    });
  }

  await deleteFileById(id);

  res.render("view.html", {
    content: file.content,
    title: file.title,
    createdAt: file.createdAt,
    expiresAt: file.expiresAt,
    id: id,
  });
});

app.delete("/content/:id", async (req, res) => {
  const { id } = req.params;
  const content = await getContentById(id);

  if (!content) {
    return res.status(404).json({
      success: false,
      message: "Content not found or already expired",
    });
  }

  await deleteFileById(id);
  res.json({ success: true, message: "Content deleted successfully" });
});

app.post("/read/:id/destroy", async (req, res) => {
  const { id } = req.params;
  await deleteFileById(id);
  res.json({ success: true, message: "Message destroyed" });
});

//TODO: Add a cron job to cleanup expired files
app.post("/ttl-cleanup", async (req, res) => {
  try {
    const cleanedCount = await cleanupExpiredFiles();
    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired files`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during cleanup",
    });
  }
});

app.get("/error", (req, res) => {
  const errorType = req.query.type || "general";
  res.render("error.html", {
    errorType: errorType,
  });
});

app.use((req, res) => {
  res.status(404).render("error.html", {
    errorType: "not_found",
  });
});

app.listen(port, () => {
  console.log(`🔥 Burn-on-Read server running at http://localhost:${port}`);
  console.log(`📝 Create messages at: http://localhost:${port}/`);
  console.log(`❌ View errors at: http://localhost:${port}/error`);
});
