import * as fs from "fs-extra";
import path from "path";
import { randomUUID } from "crypto";
import { Content, contentSchema } from "../types/content";

const BASE_PATH = path.join(__dirname, "..", `../files`);

export async function saveContentToFile(content: Content) {
  try {
    if (!content.content || content.content.trim() === "") {
      return null;
    }
    await ensureDirectoryExists();
    return createFileWithContent(content);
  } catch (error) {
    return null;
  }
}

export async function getContentById(id: string): Promise<Content | null> {
  try {
    const content = await fs.readFile(getFilePath(id), "utf8");
    const parsedContent = contentSchema.parse(JSON.parse(content));

    if (isContentExpired(parsedContent)) {
      await deleteFileById(id);
      return null;
    }

    return parsedContent;
  } catch (error) {
    console.error("Error getting content", error);
    return null;
  }
}

export async function deleteFileById(id: string) {
  try {
    await fs.remove(getFilePath(id));
  } catch (error) {
    console.error("Error deleting file", error);
    return null;
  }
}

// Helper function to check if content has expired
function isContentExpired(content: Content): boolean {
  if (!content.expiresAt) {
    return false; // No expiration set
  }
  return new Date() > content.expiresAt;
}

export async function cleanupExpiredFiles(): Promise<number> {
  try {
    await ensureDirectoryExists();
    const files = await fs.readdir(BASE_PATH);
    let cleanedCount = 0;

    for (const file of files) {
      if (file.endsWith(".txt")) {
        const id = file.replace(".txt", "");
        const content = await getContentById(id);
        // getContentById already deletes expired content, so we just need to call it
        if (!content) {
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  } catch (error) {
    console.error("Error during cleanup", error);
    return 0;
  }
}

export function createExpirationDate(ttlSeconds?: number): Date | undefined {
  if (!ttlSeconds || ttlSeconds <= 0) return undefined;
  return new Date(Date.now() + ttlSeconds * 1000);
}

function getFilePath(id: string) {
  return path.join(BASE_PATH, `${id}.txt`);
}

async function createFileWithContent(content: Content) {
  if (!content.content || content.content.trim() === "") {
    return null;
  }
  try {
    const id = randomUUID();
    await fs.writeFile(getFilePath(id), JSON.stringify(content));
    return id;
  } catch (error) {
    console.error("Error creating file", error);
    return null;
  }
}

async function ensureDirectoryExists() {
  const dir = path.dirname(BASE_PATH);
  await fs.ensureDir(dir);
}
