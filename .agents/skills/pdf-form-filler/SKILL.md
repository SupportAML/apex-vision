---
name: pdf-form-filler
description: >
  Fill out any PDF form — fillable or non-fillable — with clean, professional results. Uses pdfplumber
  for precise coordinate extraction and ReportLab overlay + pypdf merge to produce native PDF text
  without annotation artifacts. Use this skill whenever the user asks to fill out a PDF form, complete
  a PDF application, populate a PDF template, or enter data into any PDF document. Triggers on phrases
  like "fill out this form", "complete this application", "fill in this PDF", "populate this template",
  "enter data into this PDF", "fill the blanks", or any time the user uploads a PDF form and wants
  data entered into it. Also use when working with government forms, medical forms, legal forms,
  tax forms, employment applications, insurance forms, credentialing packets, or any multi-page
  PDF form packet. This skill is CRITICAL for non-fillable PDFs where the annotation approach fails.
---

# PDF Form Filler

Fill any PDF form cleanly using the ReportLab overlay method. This approach draws text onto a
transparent PDF layer and merges it with the original, producing native PDF content that looks
like it was typed into the form — no floating annotations, no double-text artifacts, no
rendering inconsistencies across PDF viewers.

## Why This Skill Exists

The naive approach to filling non-fillable PDFs — adding FreeText annotations at estimated
coordinates — produces terrible results: text overlaps form labels, annotations render
differently across viewers, and coordinate estimation from image-to-PDF conversion introduces
drift. This skill uses a fundamentally better method.

## Method Overview

```
+---------------+     +----------------+     +---------------+     +------------+
|  pdfplumber   |---->|  Calculate     |---->|  ReportLab    |---->|  pypdf     |
|  Extract      |     |  entry         |     |  Draw text    |     |  Merge     |
|  exact label  |     |  positions     |     |  on blank     |     |  overlay   |
|  coordinates  |     |  from labels   |     |  overlay      |     |  + orig    |
+---------------+     +----------------+     +---------------+     +------------+
```

The key insight: extract label positions directly in PDF coordinate space using pdfplumber,
calculate entry positions relative to those labels, then draw text at those exact coordinates
using ReportLab. No image conversion, no coordinate system translation, no estimation drift.

## Step-by-Step Process

### Step 0: Install Dependencies (if needed)

```bash
pip install pdfplumber reportlab pypdf --break-system-packages
```

### Step 1: Check If Fillable

Some PDFs have actual form fields (AcroForm). These are much easier to fill.

```python
from pypdf import PdfReader

reader = PdfReader("form.pdf")
fields = reader.get_fields()
if fields:
    print(f"FILLABLE -- {len(fields)} fields found")
    for name, field in fields.items():
        print(f"  {name}: {field.get('/FT', 'unknown type')}")
else:
    print("NON-FILLABLE -- use overlay method")
```

**If fillable**: Use pypdf's `update_page_form_field_values()`. See the
"Fillable PDF Shortcut" section at the end.

**If non-fillable**: Continue with the overlay method below.

### Step 2: Extract Label Coordinates with pdfplumber

For each page that needs filling, extract every text element with its exact PDF position:

```python
import pdfplumber

with pdfplumber.open("form.pdf") as pdf:
    page = pdf.pages[PAGE_IDX]  # 0-indexed
    page_height = float(page.height)
    page_width = float(page.width)

    # Get all words with positions
    words = page.extract_words(keep_blank_chars=True, x_tolerance=3, y_tolerance=2)
    for w in words:
        print(f"'{w['text']}'  x0={w['x0']:.1f}  x1={w['x1']:.1f}  "
              f"top={w['top']:.1f}  bottom={w['bottom']:.1f}")

    # Get individual characters (useful when pdfplumber merges separate words)
    chars = page.chars

    # Get lines (underlines, separators, table borders)
    lines = page.lines

    # Get rectangles (table cells, checkboxes)
    rects = page.rects
```

**pdfplumber coordinate system**: y=0 is at the TOP of the page, increasing downward.

### Step 3: Calculate Entry Positions

For each field you need to fill, find its label in the extracted words and calculate where
the entry text should go.

**Common patterns:**

| Form Layout | Entry Position |
|---|---|
| `Label: ___________` (underline after label) | x = label.x1 + 5, y = underline.top |
| `Label` above a line | x = label.x0, y = line below label |
| Checkbox next to text | x = checkbox center, y = checkbox center |
| Table cell | x = cell.x0 + 3, y = cell center |

**Coordinate conversion** -- pdfplumber to ReportLab:

ReportLab uses y=0 at BOTTOM (opposite of pdfplumber). Convert with:

```python
# For text baseline placement:
rl_y = page_height - pdfplumber_top - font_size + 2

# For text that should sit ON an underline:
rl_y = page_height - underline_top + 3
```

The `+2` or `+3` offset places the text baseline slightly above the target line so text
sits naturally on the line rather than overlapping it.

### Step 4: Create the Overlay and Merge

```python
from io import BytesIO
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter

def fill_pdf(input_path, output_path, fields):
    """
    fields: list of dicts with keys:
        - page: 1-based page number
        - x: x position in PDF points (from left edge)
        - y: y position in ReportLab coords (from bottom edge)
        - text: string to draw
        - font_size: optional, default 9
        - bold: optional boolean, default False
    """
    reader = PdfReader(input_path)
    num_pages = len(reader.pages)

    # Create overlay
    buf = BytesIO()
    c = canvas.Canvas(buf)

    for page_num in range(1, num_pages + 1):
        page = reader.pages[page_num - 1]
        w = float(page.mediabox.width)
        h = float(page.mediabox.height)
        c.setPageSize((w, h))

        page_fields = [f for f in fields if f['page'] == page_num]
        for f in page_fields:
            font = "Helvetica-Bold" if f.get('bold') else "Helvetica"
            c.setFont(font, f.get('font_size', 9))
            c.drawString(f['x'], f['y'], f['text'])

        c.showPage()

    c.save()
    buf.seek(0)

    # Merge overlay onto original
    overlay = PdfReader(buf)
    writer = PdfWriter()

    for i in range(num_pages):
        page = reader.pages[i]
        if i < len(overlay.pages):
            page.merge_page(overlay.pages[i])
        writer.add_page(page)

    with open(output_path, 'wb') as f:
        writer.write(f)
```

### Step 5: Verify Output (NON-NEGOTIABLE)

After filling, ALWAYS convert to images and visually check every filled page:

```python
import pypdfium2 as pdfium

pdf_doc = pdfium.PdfDocument(output_path)
for i in range(len(pdf_doc)):
    page = pdf_doc[i]
    bitmap = page.render(scale=2)  # 2x for readability
    image = bitmap.to_pil()
    image.save(f"verify/page_{i+1}.png")
```

Then READ each image and check:
- Text is inside entry areas, not overlapping labels
- No text is cut off at edges
- Data is correct (not accidentally swapped between fields)
- Checkboxes have X marks centered properly

If anything is off, adjust coordinates and re-run.

## Practical Tips

### Font Sizes
- **9pt**: Default for most form fields
- **8pt**: Tight spaces, small table cells
- **7pt**: Very cramped fields
- **10-11pt**: Name fields, headers, prominent entries
- Never exceed 11pt on a standard form

### Checkboxes
Use bold "X" sized to match the checkbox:
```python
{"page": 1, "x": 150, "y": 500, "text": "X", "font_size": 10, "bold": True}
```

### Signatures
ALWAYS leave signature and date fields blank for manual signing. You can optionally
add a printed name near a "Print Name" line.

### Finding Individual Words in Merged Text

pdfplumber sometimes merges nearby words into a single text element. Use character-level
extraction to find exact positions:

```python
with pdfplumber.open("form.pdf") as pdf:
    chars = pdf.pages[0].chars
    # Filter chars in a specific region
    region_chars = [c for c in chars if Y1 < float(c['top']) < Y2 and float(c['x0']) > X_MIN]
    # Group into words by gaps
    words = []
    current = {'text': '', 'x0': 0, 'x1': 0}
    for c in sorted(region_chars, key=lambda c: float(c['x0'])):
        if c['text'].strip() == '':
            if current['text']:
                words.append(dict(current))
                current = {'text': '', 'x0': 0, 'x1': 0}
            continue
        if not current['text']:
            current = {'text': c['text'], 'x0': float(c['x0']), 'x1': float(c['x1'])}
        elif float(c['x0']) - current['x1'] < 5:
            current['text'] += c['text']
            current['x1'] = float(c['x1'])
        else:
            words.append(dict(current))
            current = {'text': c['text'], 'x0': float(c['x0']), 'x1': float(c['x1'])}
    if current['text']:
        words.append(current)
```

### Multi-Page Forms

Process all pages in one pass. The overlay PDF must have the same number of pages
as the original (blank overlay pages for pages you don't modify):

```python
for page_num in range(1, total_pages + 1):
    c.setPageSize((w, h))
    # Only draw on pages that need filling
    page_fields = [f for f in fields if f['page'] == page_num]
    for f in page_fields:
        c.setFont("Helvetica", f.get('font_size', 9))
        c.drawString(f['x'], f['y'], f['text'])
    c.showPage()  # Always call showPage, even for blank overlay pages
```

### Working with Page Subsets

If filling only some pages of a large PDF (e.g., pages 14-18 of 22), you can either:

**Option A**: Extract pages first, fill the subset, keep separately
```python
writer = PdfWriter()
for i in range(13, 18):  # pages 14-18
    writer.add_page(reader.pages[i])
writer.write(open("subset.pdf", "wb"))
# Then fill subset.pdf
```

**Option B**: Create overlay for entire PDF but only draw on target pages (simpler)

### Handling Tables

For table cells, use pdfplumber's rect extraction to find cell boundaries:
```python
rects = page.rects
# Table cells are rectangles with width > 10 and height > 10
cells = [r for r in rects if (r['x1'] - r['x0']) > 10 and (r['bottom'] - r['top']) > 10]
```

Place text left-aligned inside each cell with a small padding:
```python
x = cell_x0 + 3
rl_y = page_height - (cell_top + cell_bottom) / 2  # vertical center
```

## Fillable PDF Shortcut

If the PDF has AcroForm fields, skip the overlay method entirely:

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("fillable_form.pdf")
writer = PdfWriter()
writer.append(reader)

# Fill fields by name
writer.update_page_form_field_values(
    writer.pages[0],
    {
        "last_name": "Smith",
        "first_name": "John",
        "checkbox_1": "/On",  # or the field's checked_value
    },
    auto_regenerate=False
)

with open("filled.pdf", "wb") as f:
    writer.write(f)
```

Use `reader.get_fields()` to discover field names and types.

## Common Gotchas

1. **Text overlapping labels**: The #1 failure mode. Always place text AFTER (to the right of)
   or BELOW labels, never on top of them. If a form has "(Street)" inside the entry area,
   your text will inevitably overlap it -- accept this or use a smaller font and offset.

2. **Wrong coordinate system**: pdfplumber y goes DOWN from top. ReportLab y goes UP from
   bottom. Forgetting to convert produces text in mirrored positions.

3. **Page size mismatch**: Always read the actual page dimensions from the PDF rather than
   assuming letter size (612x792). Some forms use A4 or custom sizes.

4. **Merged text in pdfplumber**: Use character-level extraction when pdfplumber combines
   separate words (common with spaced-out text like checkbox labels).

5. **Blank overlay pages**: The overlay must have the same page count as the original.
   Call `c.showPage()` for every page, even ones with no text to add.
