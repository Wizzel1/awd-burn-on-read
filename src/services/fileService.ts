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
    return contentSchema.parse(JSON.parse(content));
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
