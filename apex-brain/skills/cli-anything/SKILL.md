# CLI-Anything

Turn any professional software into an agent-controllable CLI. When a workflow needs software that has no API (image editors, video editors, office suites, design tools), use this skill to generate a full CLI harness from the source code.

## What It Does
- Analyzes any software's source code and maps GUI actions to callable commands
- Generates a Click-based Python CLI with JSON output mode for agent consumption
- Creates REPL interface with undo/redo, session management, and state tracking
- Auto-generates tests (unit + e2e) and installs the CLI to PATH
- Works with any app that has source code: no API needed, no UI automation hacks

## When to Use (Instead of MCP or Direct API)
- Software has **no API** but has source code (GIMP, Blender, LibreOffice, video editors)
- You need **stateful sessions** (open project, make edits, export - not just one-shot calls)
- You want **undo/redo** and **session persistence** across agent steps
- The tool needs to be **composable** in shell pipelines with other tools
- MCP is better when an API already exists. CLI-Anything is better when it doesn't.

## Inputs
- Path to the software's source code (cloned repo or local install)
- Optional: specific capabilities to focus on (e.g. "batch processing and filters")

## Outputs
- Installable Python CLI package (`cli-anything-[appname]`)
- JSON output mode for agent parsing (`--json` flag)
- Human-readable output for debugging
- Test suite with passing tests
- Installed to PATH, ready for orchestrator TOOL_MAP

## Usage

### Generate a CLI for new software
```
/cli-anything:cli-anything ./path-to-source
```

### Refine/expand an existing CLI
```
/cli-anything:refine ./path-to-source "batch processing and filters"
```

### Use a generated CLI in workflows
```bash
# Image editing for social media
cli-anything-gimp project new --width 1080 --height 1080
cli-anything-gimp --json layer add -n "Background"
cli-anything-gimp filter apply --name gaussian-blur --radius 2
cli-anything-gimp export --format png --output post.png

# Document generation for NLC
cli-anything-libreoffice document open --path template.docx
cli-anything-libreoffice --json document replace --find "{{case_id}}" --replace "NLC-2026-042"
cli-anything-libreoffice document export --format pdf --output report.pdf

# Video editing for social content
cli-anything-shotcut project new --width 1080 --height 1920
cli-anything-shotcut --json clip add --file intro.mp4
cli-anything-shotcut clip trim --start 0 --end 15
cli-anything-shotcut export --format mp4 --output reel.mp4
```

## Proven Applications (11 tested)
GIMP, Blender, Shotcut, Audacity, Kdenlive, OBS Studio, Inkscape, LibreOffice, Draw.io, AnyGen, Zoom

## Business Use Cases
| Entity | Software | Use Case |
|--------|----------|----------|
| NLC / ApexMedLaw | LibreOffice | Case reports, legal documents, PDF generation |
| All entities | GIMP / Inkscape | Social media graphics, brand assets |
| NLC / Club Haus | Shotcut / Kdenlive | Video reels, testimonial edits |
| A2Z Equity | LibreOffice Calc | Investment analysis spreadsheets |
| Porcupine Edu | Audacity | Podcast/audio editing |
| All entities | Draw.io | Architecture diagrams, process flows |

## Architecture
- Python 3.10+, Click framework, pytest
- 7-phase pipeline: Analyze > Design > Implement > Plan Tests > Write Tests > Document > Publish
- Namespace: `cli-anything-*` (e.g. `cli-anything-gimp`)
- Dual output: `--json` for agents, human-readable by default

## Source
HKUDS/CLI-Anything (GitHub)
