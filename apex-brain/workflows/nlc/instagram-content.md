# Instagram Content Pipeline - NLC
schedule: weekly

## Objective
Post 3x/week on NLC Instagram with educational and credibility-building content.

## Schedule
Monday, Wednesday, Friday - 11am EST

## Steps
1. **Topic selection** - Pull from content calendar or trending medical-legal news
2. **Draft** - Create carousel or single image post concept
3. **Visual** - Generate infographic/visual matching NLC brand (reference approved examples in examples/)
4. **Caption** - Write caption with relevant hashtags
5. **Review** - Queue for approval (auto-approve if matches learned style)
6. **Post** - Publish via Instagram API
7. **Track** - Log reach, saves, shares

## Skills Used
- social-media-content
- cli-anything (for image generation/editing via GIMP or Inkscape if installed)

## Tool Preference
For the Visual step: use `cli-anything-gimp` or `cli-anything-inkscape` if available on PATH.
These produce real graphics matching brand guidelines. Falls back to AI-generated image descriptions
if no cli-anything image tool is installed yet.

## Output
- Post image + caption saved to outputs/nlc/instagram/
