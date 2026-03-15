import { task } from "@trigger.dev/sdk";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { BRAIN_ROOT } from "../outputs/config.js";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;

const WORKFLOWS_DIR = path.join(BRAIN_ROOT, "workflows");
const OUTPUTS_DIR = path.join(BRAIN_ROOT, "outputs");
const ENTITIES_DIR = path.join(BRAIN_ROOT, "entities");
const CONTEXT_DIR = path.join(BRAIN_ROOT, "context");
const SKILLS_DIR = path.join(BRAIN_ROOT, "skills");
const RUN_LOG = path.join(BRAIN_ROOT, "decisions", "run_log.jsonl");

// --- Helpers ---

function loadFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function buildEntityContext(entity: string): string {
  const entityDir = path.join(ENTITIES_DIR, entity);
  const parts: string[] = [];
  for (const fname of ["config.md", "brand.md", "goals.md"]) {
    const content = loadFile(path.join(entityDir, fname));
    if (content) parts.push(content);
  }
  return parts.join("\n\n---\n\n");
}

function buildSkillContext(workflowText: string): string {
  const skillsMatch = workflowText.match(
    /## Skills Used\n([\s\S]*?)(?:\n##|$)/
  );
  if (!skillsMatch) return "";

  const skillNames = [...skillsMatch[1].matchAll(/[-*]\s*(\S+)/g)].map(
    (m) => m[1]
  );
  const parts: string[] = [];
  for (const skill of skillNames) {
    const content = loadFile(path.join(SKILLS_DIR, skill, "SKILL.md"));
    if (content) parts.push(`### Skill: ${skill}\n${content}`);
  }
  return parts.join("\n\n");
}

interface ParsedWorkflow {
  path: string;
  entity: string;
  name: string;
  steps: string[];
  schedule: string | null;
  raw: string;
}

function parseWorkflow(filePath: string): ParsedWorkflow {
  const text = fs.readFileSync(filePath, "utf-8");
  const wf: ParsedWorkflow = {
    path: filePath,
    entity: path.basename(path.dirname(filePath)),
    name: path.basename(filePath, ".md"),
    steps: [],
    schedule: null,
    raw: text,
  };

  const schedMatch = text.match(/schedule:\s*(.+)/i);
  if (schedMatch) wf.schedule = schedMatch[1].trim();

  const stepPattern =
    /(?:^##\s*Step\s*\d+[:\s]*(.+)|^\d+\.\s*\*\*(.+?)\*\*)/gm;
  let match: RegExpExecArray | null;
  while ((match = stepPattern.exec(text)) !== null) {
    wf.steps.push((match[1] || match[2]).trim());
  }

  return wf;
}

function discoverWorkflows(scheduleFilter?: string): ParsedWorkflow[] {
  if (!fs.existsSync(WORKFLOWS_DIR)) return [];

  const workflows: ParsedWorkflow[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".md")) {
        const wf = parseWorkflow(full);
        if (scheduleFilter) {
          if (
            wf.schedule &&
            wf.schedule.toLowerCase().includes(scheduleFilter.toLowerCase())
          ) {
            workflows.push(wf);
          }
        } else {
          workflows.push(wf);
        }
      }
    }
  }

  walk(WORKFLOWS_DIR);
  return workflows;
}

interface StepResult {
  step: string;
  status: string;
  output?: any;
  needs_approval?: boolean;
  confidence?: number;
  usage?: any;
  error?: any;
}

interface WorkflowResult {
  workflow: string;
  entity: string;
  steps: StepResult[];
  timestamp: string;
}

async function executeWorkflow(
  wf: ParsedWorkflow,
  claude: Anthropic
): Promise<WorkflowResult> {
  const result: WorkflowResult = {
    workflow: wf.name,
    entity: wf.entity,
    steps: [],
    timestamp: new Date().toISOString(),
  };

  const entityContext = buildEntityContext(wf.entity);
  const skillContext = buildSkillContext(wf.raw);
  const globalContext = loadFile(path.join(CONTEXT_DIR, "priorities.md"));

  const systemPrompt = `You are the Apex Brain orchestrator for the entity "${wf.entity}".
Your job is to execute one step of a workflow and produce concrete output.

## Entity Context
${entityContext}

## Current Priorities
${globalContext}

## Available Skills
${skillContext}

## Rules
- Produce the actual deliverable for each step (draft text, research findings, etc.)
- Return valid JSON with keys: "output" (the content), "needs_approval" (bool), "confidence" (0-100)
- If a step produces content for human review, set needs_approval: true
- Be direct, no filler. Match the entity's brand voice.`;

  const conversationSoFar: { step: string; output_preview: string }[] = [];

  for (const step of wf.steps) {
    let history = "";
    if (conversationSoFar.length > 0) {
      history =
        "## Previous steps completed:\n" +
        conversationSoFar
          .map((s) => `- **${s.step}**: ${s.output_preview}`)
          .join("\n") +
        "\n\n";
    }

    const userPrompt = `${history}## Current Step: ${step}

Full workflow for reference:
${wf.raw}

Execute this step now. Return JSON only.`;

    try {
      const response = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const rawText =
        response.content[0].type === "text" ? response.content[0].text : "";

      const stepResult: StepResult = { step, status: "completed" };

      try {
        const jsonMatch = rawText.match(
          /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
        );
        const parsed = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);
        stepResult.output = parsed.output || rawText;
        stepResult.needs_approval = parsed.needs_approval ?? false;
        stepResult.confidence = parsed.confidence ?? 50;
      } catch {
        stepResult.output = rawText;
        stepResult.needs_approval = true;
        stepResult.confidence = 50;
      }

      stepResult.usage = response.usage;
      result.steps.push(stepResult);
      conversationSoFar.push({
        step,
        output_preview: String(stepResult.output).slice(0, 200),
      });
    } catch (err: any) {
      result.steps.push({
        step,
        status: "error",
        error: err.message || String(err),
      });
    }
  }

  // Save outputs
  const entityOut = path.join(OUTPUTS_DIR, wf.entity);
  fs.mkdirSync(entityOut, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outputFile = path.join(entityOut, `${wf.name}_${ts}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

  // Log the run
  fs.mkdirSync(path.dirname(RUN_LOG), { recursive: true });
  fs.appendFileSync(
    RUN_LOG,
    JSON.stringify({
      workflow: wf.name,
      entity: wf.entity,
      timestamp: result.timestamp,
      steps_completed: result.steps.filter((s) => s.status === "completed")
        .length,
      steps_total: result.steps.length,
      needs_approval: result.steps.some((s) => s.needs_approval),
    }) + "\n"
  );

  return result;
}

// --- Main task ---

export const runOrchestrator = task({
  id: "run-orchestrator",
  maxDuration: 300,
  run: async (payload: {
    schedule?: string;
    entity?: string;
    workflow?: string;
  }) => {
    const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let workflows = discoverWorkflows(payload.schedule);

    if (payload.entity) {
      workflows = workflows.filter((w) => w.entity === payload.entity);
    }
    if (payload.workflow) {
      workflows = workflows.filter((w) => w.name === payload.workflow);
    }

    if (workflows.length === 0) {
      console.log("No workflows matched filters", payload);
      return { status: "no_workflows", filters: payload };
    }

    console.log(
      `Running ${workflows.length} workflow(s): ${workflows.map((w) => `${w.entity}/${w.name}`).join(", ")}`
    );

    const results: WorkflowResult[] = [];
    for (const wf of workflows) {
      const result = await executeWorkflow(wf, claude);
      results.push(result);
    }

    return results;
  },
});
