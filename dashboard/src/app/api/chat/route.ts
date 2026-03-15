import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { readRepoFile, writeRepoFile } from "@/lib/data";
import { z } from "zod";

export async function POST(req: Request) {
  const { messages, mode } = await req.json();

  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const claudeMd = await readRepoFile("CLAUDE.md");
  const priorities = await readRepoFile("context/priorities.md");
  const me = await readRepoFile("context/me.md");

  const systemPrompt =
    mode === "system"
      ? `You are the Apex Brain system administrator. You can modify the system by using the provided tools to read and write files in the apex-brain repository.

${claudeMd}

Current priorities:
${priorities}

About the user:
${me}

When the user asks to make changes:
1. Use read_file to see the current content
2. Use write_file to save changes
3. Explain what you changed

File paths are relative to apex-brain/. Examples:
- team/zeus.md
- workflows/nlc/linkedin-content.md
- entities/club-haus/config.md
- context/priorities.md`
      : `You are the Apex Brain business advisor. You help Abhi Kapuria make strategic decisions across all his businesses. You know the context, priorities, and goals.

${claudeMd}

Current priorities:
${priorities}

About the user:
${me}

Give direct, actionable advice. Propose multiple options when the task is creative. Be brief and visual where possible.`;

  const tools = mode === "system" ? {
    read_file: {
      description: "Read a file from the apex-brain repository. Path is relative to apex-brain/.",
      inputSchema: z.object({
        path: z.string().describe("File path relative to apex-brain/, e.g. team/zeus.md"),
      }),
      execute: async ({ path }: { path: string }) => {
        const content = await readRepoFile(path);
        return content || `File not found: ${path}`;
      },
    },
    write_file: {
      description: "Write or update a file in the apex-brain repository. Path is relative to apex-brain/.",
      inputSchema: z.object({
        path: z.string().describe("File path relative to apex-brain/, e.g. workflows/nlc/new-workflow.md"),
        content: z.string().describe("The full file content to write"),
        commit_message: z.string().describe("Short description of what changed"),
      }),
      execute: async ({ path, content, commit_message }: { path: string; content: string; commit_message: string }) => {
        const success = await writeRepoFile(path, content, commit_message);
        return success
          ? `Successfully wrote ${path}: ${commit_message}`
          : `Failed to write ${path}. Check permissions.`;
      },
    },
  } : undefined;

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages,
    tools,
  });

  return result.toTextStreamResponse();
}
