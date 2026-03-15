#!/usr/bin/env python3
"""Workflow orchestrator. Reads workflow markdown files, executes steps via Claude API."""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# Auto-load .env file if present
_env_file = REPO_ROOT / ".env"
if _env_file.exists():
    for line in _env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            if value and not os.environ.get(key.strip()):
                os.environ[key.strip()] = value.strip()

WORKFLOWS_DIR = REPO_ROOT / "workflows"
OUTPUTS_DIR = REPO_ROOT / "outputs"
ENTITIES_DIR = REPO_ROOT / "entities"
CONTEXT_DIR = REPO_ROOT / "context"
SKILLS_DIR = REPO_ROOT / "skills"
RUN_LOG = REPO_ROOT / "decisions" / "run_log.jsonl"

CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 4096

# Tools that can be dispatched from workflow steps
TOOL_MAP = {
    "post_to_linkedin": "tools/post_to_linkedin.py",
    "post_to_twitter": "tools/post_to_twitter.py",
    "fetch_analytics": "tools/fetch_analytics.py",
    "scrape_trending": "tools/scrape_trending.py",
    "send_email": "tools/send_email.py",
    "deploy_to_vercel": "tools/deploy_to_vercel.py",
    "browser_agent": "tools/browser_agent.py",
}


def load_file(path: Path) -> str:
    """Read a file, return empty string if missing."""
    try:
        return path.read_text()
    except FileNotFoundError:
        return ""


def build_entity_context(entity: str) -> str:
    """Load config.md, brand.md, goals.md for an entity."""
    entity_dir = ENTITIES_DIR / entity
    parts = []
    for fname in ["config.md", "brand.md", "goals.md"]:
        content = load_file(entity_dir / fname)
        if content:
            parts.append(content)
    return "\n\n---\n\n".join(parts)


def build_skill_context(workflow_text: str) -> str:
    """Extract skill names from workflow and load their SKILL.md files."""
    skills_used = re.findall(r"[-*]\s*(\S+)", re.search(r"## Skills Used\n(.*?)(?:\n##|\Z)", workflow_text, re.DOTALL).group(1)) if "## Skills Used" in workflow_text else []
    parts = []
    for skill in skills_used:
        skill_file = SKILLS_DIR / skill / "SKILL.md"
        content = load_file(skill_file)
        if content:
            parts.append(f"### Skill: {skill}\n{content}")
    return "\n\n".join(parts)


def call_claude(system_prompt: str, user_prompt: str, api_key: str) -> dict:
    """Call the Anthropic Messages API."""
    payload = {
        "model": CLAUDE_MODEL,
        "max_tokens": MAX_TOKENS,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }
    body = json.dumps(payload).encode()
    req = urllib.request.Request(CLAUDE_API_URL, data=body, headers={
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
        text = data.get("content", [{}])[0].get("text", "")
        return {"status": "ok", "text": text, "usage": data.get("usage", {})}
    except urllib.error.HTTPError as e:
        return {"status": "error", "code": e.code, "message": e.read().decode()}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def run_tool(tool_name: str, args: list, dry_run: bool = False) -> dict:
    """Execute a Python tool script and capture JSON output."""
    script = REPO_ROOT / TOOL_MAP.get(tool_name, "")
    if not script.exists():
        return {"status": "error", "message": f"Tool not found: {tool_name}"}

    cmd = [sys.executable, str(script)] + args
    if dry_run:
        cmd.append("--dry-run")

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return {"status": "ok", "raw_output": result.stdout, "stderr": result.stderr}
    except subprocess.TimeoutExpired:
        return {"status": "error", "message": f"Tool {tool_name} timed out"}


def parse_workflow(path: Path) -> dict:
    """Extract metadata from a workflow markdown file."""
    text = path.read_text()
    wf = {"path": str(path), "entity": path.parent.name, "name": path.stem, "steps": [], "schedule": None, "raw": text}

    sched = re.search(r"schedule:\s*(.+)", text, re.IGNORECASE)
    if sched:
        wf["schedule"] = sched.group(1).strip()

    for match in re.finditer(r"(?:^##\s*Step\s*\d+[:\s]*(.+)|^\d+\.\s*\*\*(.+?)\*\*)", text, re.MULTILINE):
        step_name = (match.group(1) or match.group(2)).strip()
        wf["steps"].append(step_name)

    return wf


def discover_workflows(schedule_filter: str = None) -> list:
    """Find all workflow files, optionally filtered by schedule keyword."""
    workflows = []
    if not WORKFLOWS_DIR.exists():
        return workflows
    for md in WORKFLOWS_DIR.rglob("*.md"):
        wf = parse_workflow(md)
        if schedule_filter and wf["schedule"]:
            if schedule_filter.lower() not in wf["schedule"].lower():
                continue
        elif schedule_filter and not wf["schedule"]:
            continue
        workflows.append(wf)
    return workflows


def execute_workflow(wf: dict, api_key: str, dry_run: bool = False) -> dict:
    """Execute a workflow by sending each step to Claude with full context."""
    result = {
        "workflow": wf["name"],
        "entity": wf["entity"],
        "steps": [],
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Build context
    entity_context = build_entity_context(wf["entity"])
    skill_context = build_skill_context(wf["raw"])
    global_context = load_file(CONTEXT_DIR / "priorities.md")

    system_prompt = f"""You are the Apex Brain orchestrator for the entity "{wf['entity']}".
Your job is to execute one step of a workflow and produce concrete output.

## Entity Context
{entity_context}

## Current Priorities
{global_context}

## Available Skills
{skill_context}

## Rules
- Produce the actual deliverable for each step (draft text, research findings, etc.)
- Return valid JSON with keys: "output" (the content), "tool_calls" (list of tools to invoke, or empty), "needs_approval" (bool), "confidence" (0-100)
- For tool_calls, use format: {{"tool": "tool_name", "args": ["--flag", "value"]}}
- If a step produces content for human review, set needs_approval: true
- Be direct, no filler. Match the entity's brand voice."""

    # Accumulate step outputs so later steps have context from earlier ones
    conversation_so_far = []

    for step in wf["steps"]:
        if dry_run:
            result["steps"].append({"step": step, "status": "dry_run"})
            continue

        if not api_key:
            result["steps"].append({"step": step, "status": "skipped", "reason": "no API key"})
            continue

        # Build user prompt with conversation history
        history = ""
        if conversation_so_far:
            history = "## Previous steps completed:\n" + "\n".join(
                f"- **{s['step']}**: {s.get('output_preview', 'done')}" for s in conversation_so_far
            ) + "\n\n"

        user_prompt = f"""{history}## Current Step: {step}

Full workflow for reference:
{wf['raw']}

Execute this step now. Return JSON only."""

        claude_result = call_claude(system_prompt, user_prompt, api_key)

        step_result = {"step": step, "status": "completed"}

        if claude_result["status"] == "ok":
            # Try to parse Claude's JSON response
            raw_text = claude_result["text"]
            try:
                # Extract JSON from possible markdown code fences
                json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
                parsed = json.loads(json_match.group(1) if json_match else raw_text)
                step_result["output"] = parsed.get("output", raw_text)
                step_result["needs_approval"] = parsed.get("needs_approval", False)
                step_result["confidence"] = parsed.get("confidence", 50)

                # Dispatch any tool calls Claude requested
                for tc in parsed.get("tool_calls", []):
                    tool_name = tc.get("tool", "")
                    tool_args = tc.get("args", [])
                    if tool_name in TOOL_MAP:
                        tool_result = run_tool(tool_name, tool_args, dry_run)
                        step_result.setdefault("tool_results", []).append({
                            "tool": tool_name,
                            "result": tool_result,
                        })
            except (json.JSONDecodeError, AttributeError):
                step_result["output"] = raw_text
                step_result["needs_approval"] = True
                step_result["confidence"] = 50

            step_result["usage"] = claude_result.get("usage", {})
        else:
            step_result["status"] = "error"
            step_result["error"] = claude_result

        result["steps"].append(step_result)
        conversation_so_far.append({
            "step": step,
            "output_preview": str(step_result.get("output", ""))[:200],
        })

    # Save outputs
    entity_out = OUTPUTS_DIR / wf["entity"]
    entity_out.mkdir(parents=True, exist_ok=True)
    output_file = entity_out / f"{wf['name']}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, indent=2))

    # Log the run
    RUN_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(RUN_LOG, "a") as f:
        f.write(json.dumps({
            "workflow": wf["name"],
            "entity": wf["entity"],
            "timestamp": result["timestamp"],
            "steps_completed": sum(1 for s in result["steps"] if s["status"] == "completed"),
            "steps_total": len(result["steps"]),
            "needs_approval": any(s.get("needs_approval") for s in result["steps"]),
        }) + "\n")

    return result


def main():
    parser = argparse.ArgumentParser(description="Apex Brain workflow orchestrator")
    parser.add_argument("--schedule", help="Filter by schedule (daily, weekly, etc.)")
    parser.add_argument("--entity", help="Run only workflows for this entity")
    parser.add_argument("--workflow", help="Run a specific workflow by name")
    parser.add_argument("--list", action="store_true", help="List workflows without running")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")

    workflows = discover_workflows(args.schedule)
    if args.entity:
        workflows = [w for w in workflows if w["entity"] == args.entity]
    if args.workflow:
        workflows = [w for w in workflows if w["name"] == args.workflow]

    if args.list:
        # Strip raw content for listing
        for w in workflows:
            w.pop("raw", None)
        print(json.dumps(workflows, indent=2))
        return

    if not workflows:
        print(json.dumps({"status": "no_workflows", "filter": {"schedule": args.schedule, "entity": args.entity}}))
        return

    if not api_key and not args.dry_run:
        print(json.dumps({"status": "error", "message": "ANTHROPIC_API_KEY not set. Use --dry-run to test without it."}))
        sys.exit(1)

    results = []
    for wf in workflows:
        result = execute_workflow(wf, api_key, args.dry_run)
        results.append(result)

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
