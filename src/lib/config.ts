import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { MissingCredentialsError, NotInitializedError } from "./errors.js";

export interface RepoConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  repoId: string;
  repoName: string;
  githubOwner: string;
  githubRepo: string;
  /** Cached copy of repos.base_branch for offline use. Postgres is authoritative. */
  baseBranchCache: string;
}

export interface Credentials {
  /** Free-text identity used as the shared `assignee` value, e.g. "jane@team.dev". */
  identity: string;
}

const CONFIG_DIR = ".collab";
const CONFIG_FILE = "config.json";

function configDir(cwd = process.cwd()): string {
  return join(cwd, CONFIG_DIR);
}

function configPath(cwd = process.cwd()): string {
  return join(configDir(cwd), CONFIG_FILE);
}

function credentialsPath(): string {
  return join(homedir(), ".collab", "credentials.json");
}

export function loadRepoConfig(cwd = process.cwd()): RepoConfig {
  const path = configPath(cwd);
  if (!existsSync(path)) {
    throw new NotInitializedError();
  }
  return JSON.parse(readFileSync(path, "utf8")) as RepoConfig;
}

export function tryLoadRepoConfig(cwd = process.cwd()): RepoConfig | null {
  try {
    return loadRepoConfig(cwd);
  } catch {
    return null;
  }
}

export function saveRepoConfig(config: RepoConfig, cwd = process.cwd()): void {
  mkdirSync(configDir(cwd), { recursive: true });
  writeFileSync(configPath(cwd), JSON.stringify(config, null, 2) + "\n", "utf8");
}

export function loadCredentials(): Credentials {
  const path = credentialsPath();
  if (!existsSync(path)) {
    throw new MissingCredentialsError();
  }
  return JSON.parse(readFileSync(path, "utf8")) as Credentials;
}

export function saveCredentials(creds: Credentials): void {
  const dir = join(homedir(), ".collab");
  mkdirSync(dir, { recursive: true });
  writeFileSync(credentialsPath(), JSON.stringify(creds, null, 2) + "\n", "utf8");
}
