# Apex Vision

## Environment Check (SILENT — runs at session start)

Run this silently at the start of every session. Do not print output unless Doppler is missing:
```bash
if ! doppler secrets get ANTHROPIC_API_KEY --plain 2>/dev/null 1>/dev/null; then
  echo "⚠️ Doppler not connected. Setup required before any testing or API calls."
  echo ""
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Mac setup:"
    echo "  brew install dopplerhq/cli/doppler"
    echo "  doppler login"
    echo "  doppler setup   # pick apex-vision → dev"
  elif [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "cygwin"* ]] || command -v winget &>/dev/null; then
    echo "Windows setup:"
    echo "  winget install doppler.cli"
    echo "  doppler login"
    echo "  doppler setup   # pick apex-vision → dev"
  else
    echo "Cloud session — DOPPLER_TOKEN may be missing or expired."
    echo "Go to Claude Code → Settings → Cloud Environment → add DOPPLER_TOKEN=your_service_token"
  fi
  echo ""
  echo "Code-only changes are fine without Doppler. Testing/running requires it."
fi
```

## Git Workflow

### VS Code with Claude Code extension (normal local development)

Commit directly to `main` and push normally:
```bash
git add <files>
git commit -m "your message"
git push origin main
```

### Claude Code Desktop (cloud/remote sessions only)

Direct pushes to `main` are blocked by the environment proxy in these sessions. Do not waste time debugging — it is blocked by design.

1. Work on your assigned `claude/` branch (e.g. `claude/some-task-XXXXX`).
2. Push to that branch: `git push -u origin claude/your-branch-name`
3. A GitHub Action (`.github/workflows/auto-merge-claude.yml`) will auto-create a PR and merge it into `main`.

If a `claude/` push fails with 403: retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s).
