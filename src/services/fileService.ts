import * as fs from "fs-extra";
import path from "path";
import { randomUUID } from "crypto";
import { Content, contentSchema } from "../types/content";

export async function saveContentToFile(content: Content) {
    try {
        if (!content.content || content.content.trim() === '') {
            return null;
        }
        await ensureDirectoryExists(path.join(__dirname, "..",  `../files`));
        return createFileWithContent(content);
    } catch (error) {
        return null;
    }
}

export async function getContentById(id: string): Promise<Content | null> {
    try {
        const filePath = path.join(__dirname, "..", `../files/${id}.txt`);
        const content = await fs.readFile(filePath, "utf8");
        return contentSchema.parse(JSON.parse(content));
    } catch (error) {
        console.error("Error getting content", error);
        return null;
    }
}

export async function deleteFileById(id: string) {
    try {
        const filePath = path.join(__dirname, "..", `../files/${id}.txt`);
        await fs.remove(filePath);
    } catch (error) {
        console.error("Error deleting file", error);
        return null;
    }
}

async function createFileWithContent(content: Content) {
    if (!content.content || content.content.trim() === '') {
        return null;
    }
    try {
        const id = randomUUID();
        const filePath = path.join(__dirname, "..", `../files/${id}.txt`);
        await fs.writeFile(filePath, JSON.stringify(content));
        return id;
    } catch (error) {
        console.error("Error creating file", error);
        return null;
    }
}

async function ensureDirectoryExists(filePath: string) {
    const dir = path.dirname(filePath);
    await fs.ensureDir(dir);
}
