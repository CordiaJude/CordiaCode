import { customAlphabet } from "nanoid";

// Lowercase + digits only, no ambiguous chars: safe in branch names, dir
// names, and easy to read/type over voice or chat.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export const generateTaskId = customAlphabet(ALPHABET, 7);

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "task";
}

export function branchName(taskId: string, title: string): string {
  return `collab/${taskId}-${slugify(title)}`;
}

export function worktreePath(repoRootParent: string, repoName: string, taskId: string): string {
  return `${repoRootParent}/${repoName}-${taskId}`;
}
