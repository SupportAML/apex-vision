import { Octokit } from "@octokit/rest";

let octokit: Octokit | null = null;

function getOctokit(): Octokit | null {
  if (!process.env.GITHUB_TOKEN) return null;
  if (!octokit) {
    octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }
  return octokit;
}

export interface RepoTarget {
  owner: string;
  repo: string;
}

function getRepo(): RepoTarget {
  return {
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
  };
}

// Known repos the dashboard can interact with
export const REPOS: Record<string, RepoTarget> = {
  brain: { owner: process.env.GITHUB_OWNER || "", repo: process.env.GITHUB_REPO || "" },
  porcupine: { owner: process.env.GITHUB_OWNER || "", repo: "porcupine-website" },
};

export function isGitHubMode(): boolean {
  return !!(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO);
}

export async function readFile(path: string, target?: RepoTarget): Promise<string> {
  const ok = getOctokit();
  if (!ok) return "";
  const { owner, repo } = target || getRepo();
  try {
    const res = await ok.repos.getContent({ owner, repo, path });
    const data = res.data;
    if ("content" in data && data.encoding === "base64") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return "";
  } catch {
    return "";
  }
}

export async function listDir(path: string, target?: RepoTarget): Promise<string[]> {
  const ok = getOctokit();
  if (!ok) return [];
  const { owner, repo } = target || getRepo();
  try {
    const res = await ok.repos.getContent({ owner, repo, path });
    if (Array.isArray(res.data)) {
      return res.data.map((f) => f.name);
    }
    return [];
  } catch {
    return [];
  }
}

export async function listDirs(path: string, target?: RepoTarget): Promise<string[]> {
  const ok = getOctokit();
  if (!ok) return [];
  const { owner, repo } = target || getRepo();
  try {
    const res = await ok.repos.getContent({ owner, repo, path });
    if (Array.isArray(res.data)) {
      return res.data.filter((f) => f.type === "dir").map((f) => f.name);
    }
    return [];
  } catch {
    return [];
  }
}

export async function writeFile(
  path: string,
  content: string,
  message: string,
  target?: RepoTarget
): Promise<boolean> {
  const ok = getOctokit();
  if (!ok) return false;
  const { owner, repo } = target || getRepo();

  try {
    let sha: string | undefined;
    try {
      const existing = await ok.repos.getContent({ owner, repo, path });
      if ("sha" in existing.data) {
        sha = existing.data.sha;
      }
    } catch {
      // File doesn't exist yet
    }

    await ok.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      sha,
    });
    return true;
  } catch (e) {
    console.error("GitHub write failed:", e);
    return false;
  }
}
