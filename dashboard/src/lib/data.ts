import fs from "fs";
import path from "path";
import * as gh from "./github";

const BRAIN_DIR = path.join(process.cwd(), "..", "apex-brain");
const BRAIN_PREFIX = "apex-brain";

export interface Entity {
  slug: string;
  name: string;
  type: string;
  description: string;
  status: string;
}

export interface TeamMember {
  name: string;
  role: string;
  entities: string;
  access: string;
  slug: string;
}

export interface WorkflowStep {
  name: string;
  status: "done" | "running" | "waiting" | "failed";
}

export interface Workflow {
  name: string;
  slug: string;
  entity: string;
  objective: string;
  schedule: string;
  steps: WorkflowStep[];
  lastRun: string | null;
}

export interface EntityGoal {
  period: string;
  items: string[];
}

// --- Filesystem helpers ---

function readMdLocal(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function parseField(content: string, field: string): string {
  const regex = new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

function parseName(content: string): string {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : "";
}

// --- Unified data fetchers ---

export async function getEntitiesAsync(): Promise<Entity[]> {
  if (gh.isGitHubMode()) {
    const dirs = await gh.listDirs(`${BRAIN_PREFIX}/entities`);
    const entities: Entity[] = [];
    for (const d of dirs) {
      const config = await gh.readFile(`${BRAIN_PREFIX}/entities/${d}/config.md`);
      entities.push({
        slug: d,
        name: parseName(config) || d,
        type: parseField(config, "Type"),
        description: parseField(config, "Description"),
        status: parseField(config, "Status") || "Active",
      });
    }
    return entities;
  }
  return getEntities();
}

export function getEntities(): Entity[] {
  const entitiesDir = path.join(BRAIN_DIR, "entities");
  if (!fs.existsSync(entitiesDir)) return [];
  const dirs = fs.readdirSync(entitiesDir, { withFileTypes: true });
  return dirs
    .filter((d) => d.isDirectory())
    .map((d) => {
      const config = readMdLocal(path.join(entitiesDir, d.name, "config.md"));
      return {
        slug: d.name,
        name: parseName(config) || d.name,
        type: parseField(config, "Type"),
        description: parseField(config, "Description"),
        status: parseField(config, "Status") || "Active",
      };
    });
}

export async function getTeamAsync(): Promise<TeamMember[]> {
  if (gh.isGitHubMode()) {
    const files = await gh.listDir(`${BRAIN_PREFIX}/team`);
    const members: TeamMember[] = [];
    for (const f of files.filter((f) => f.endsWith(".md"))) {
      const content = await gh.readFile(`${BRAIN_PREFIX}/team/${f}`);
      members.push({
        name: parseName(content) || f.replace(".md", ""),
        role: parseField(content, "Role"),
        entities: parseField(content, "Entities"),
        access: parseField(content, "Access"),
        slug: f.replace(".md", ""),
      });
    }
    return members;
  }
  return getTeam();
}

export function getTeam(): TeamMember[] {
  const teamDir = path.join(BRAIN_DIR, "team");
  if (!fs.existsSync(teamDir)) return [];
  return fs
    .readdirSync(teamDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const content = readMdLocal(path.join(teamDir, f));
      return {
        name: parseName(content) || f.replace(".md", ""),
        role: parseField(content, "Role"),
        entities: parseField(content, "Entities"),
        access: parseField(content, "Access"),
        slug: f.replace(".md", ""),
      };
    });
}

function parseWorkflowContent(content: string, file: string, entity: string): Workflow {
  const objectiveMatch = content.match(/## Objective\n(.+)/);
  const scheduleMatch = content.match(/## Schedule\n(.+)/);
  const stepMatches = content.match(/\d+\.\s+\*\*(.+?)\*\*/g) || [];
  const steps: WorkflowStep[] = stepMatches.map((s) => ({
    name: s.replace(/\d+\.\s+\*\*/, "").replace(/\*\*/, ""),
    status: "waiting" as const,
  }));

  return {
    name: parseName(content) || file.replace(".md", ""),
    slug: file.replace(".md", ""),
    entity,
    objective: objectiveMatch ? objectiveMatch[1].trim() : "",
    schedule: scheduleMatch ? scheduleMatch[1].trim() : "On-demand",
    steps,
    lastRun: null,
  };
}

export async function getWorkflowsAsync(entitySlug?: string): Promise<Workflow[]> {
  if (gh.isGitHubMode()) {
    const workflowsPath = `${BRAIN_PREFIX}/workflows`;
    const entities = entitySlug ? [entitySlug] : await gh.listDirs(workflowsPath);
    const workflows: Workflow[] = [];
    for (const entity of entities) {
      const files = await gh.listDir(`${workflowsPath}/${entity}`);
      for (const file of files.filter((f) => f.endsWith(".md"))) {
        const content = await gh.readFile(`${workflowsPath}/${entity}/${file}`);
        workflows.push(parseWorkflowContent(content, file, entity));
      }
    }
    return workflows;
  }
  return getWorkflows(entitySlug);
}

export function getWorkflows(entitySlug?: string): Workflow[] {
  const workflowsDir = path.join(BRAIN_DIR, "workflows");
  if (!fs.existsSync(workflowsDir)) return [];

  const entities = entitySlug
    ? [entitySlug]
    : fs
        .readdirSync(workflowsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

  const workflows: Workflow[] = [];
  for (const entity of entities) {
    const entityDir = path.join(workflowsDir, entity);
    if (!fs.existsSync(entityDir)) continue;
    for (const file of fs.readdirSync(entityDir).filter((f) => f.endsWith(".md"))) {
      const content = readMdLocal(path.join(entityDir, file));
      workflows.push(parseWorkflowContent(content, file, entity));
    }
  }
  return workflows;
}

export async function getEntityGoalsAsync(entitySlug: string): Promise<EntityGoal[]> {
  if (gh.isGitHubMode()) {
    const content = await gh.readFile(`${BRAIN_PREFIX}/entities/${entitySlug}/goals.md`);
    return parseGoals(content);
  }
  return getEntityGoals(entitySlug);
}

function parseGoals(content: string): EntityGoal[] {
  if (!content) return [];
  const goals: EntityGoal[] = [];
  const sections = content.split(/## /);
  for (const section of sections.slice(1)) {
    const lines = section.trim().split("\n");
    const period = lines[0].trim();
    const items = lines
      .slice(1)
      .filter((l) => l.startsWith("- "))
      .map((l) => l.replace(/^- /, ""));
    if (items.length > 0) goals.push({ period, items });
  }
  return goals;
}

export function getEntityGoals(entitySlug: string): EntityGoal[] {
  const goalsFile = path.join(BRAIN_DIR, "entities", entitySlug, "goals.md");
  return parseGoals(readMdLocal(goalsFile));
}

export function getPriorities(): string {
  return readMdLocal(path.join(BRAIN_DIR, "context", "priorities.md"));
}

export async function getPrioritiesAsync(): Promise<string> {
  if (gh.isGitHubMode()) {
    return gh.readFile(`${BRAIN_PREFIX}/context/priorities.md`);
  }
  return getPriorities();
}

// --- Write operations ---

export async function writeRepoFile(filePath: string, content: string, message: string): Promise<boolean> {
  if (gh.isGitHubMode()) {
    return gh.writeFile(`${BRAIN_PREFIX}/${filePath}`, content, message);
  }
  // Local filesystem write
  try {
    const fullPath = path.join(BRAIN_DIR, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
    return true;
  } catch {
    return false;
  }
}

export async function readRepoFile(filePath: string): Promise<string> {
  if (gh.isGitHubMode()) {
    return gh.readFile(`${BRAIN_PREFIX}/${filePath}`);
  }
  return readMdLocal(path.join(BRAIN_DIR, filePath));
}
