# LinkedIn Content Pipeline - NLC
schedule: daily

## Objective
Post daily LinkedIn content on NLC company page to attract law firms and physicians.

## Schedule
Daily, 9am EST

## Steps
1. **Research** - Check trending medical-legal topics, recent case law, neurology news
2. **Draft** - Generate 2-3 post variations (educational, case study, credibility)
3. **Visual** - Create accompanying graphic/infographic matching NLC brand
4. **Review** - Queue for approval (auto-approve if confidence > 90% and matches approved examples)
5. **Post** - Publish via LinkedIn API
6. **Track** - Log engagement metrics

## Skills Used
- social-media-content
- seo-content
- cli-anything (for infographic/visual creation via GIMP or Inkscape if installed)

## Tools Used
- tools/post_to_linkedin.py
- cli-anything-gimp or cli-anything-inkscape (if on PATH, for Visual step)

## Tool Preference
For the Visual step: prefer `cli-anything-inkscape` for vector infographics or
`cli-anything-gimp` for raster graphics if available. Structured JSON output, no browser needed.

## Output
- Post text + image saved to outputs/nlc/linkedin/
