#!/usr/bin/env python3
"""Generate a professional marketing audit PDF report from JSON data.

Usage:
    python generate_pdf_report.py <input.json> [output.pdf]

Requires: pip install reportlab
"""

import json
import sys
import os
from datetime import datetime

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        PageBreak, HRFlowable
    )
    from reportlab.graphics.shapes import Drawing, Rect, String, Circle
    from reportlab.graphics import renderPDF
except ImportError:
    print("Error: reportlab not installed. Run: pip install reportlab")
    sys.exit(1)


# Color scheme
DARK_BLUE = colors.HexColor("#2c3e50")
GREEN = colors.HexColor("#2ecc71")
YELLOW = colors.HexColor("#f39c12")
RED = colors.HexColor("#e74c3c")
LIGHT_GRAY = colors.HexColor("#ecf0f1")
DARK_GRAY = colors.HexColor("#333333")
WHITE = colors.white


def score_color(score):
    """Return color based on score range."""
    if score >= 80:
        return GREEN
    elif score >= 60:
        return YELLOW
    return RED


def grade_from_score(score):
    """Convert numeric score to letter grade."""
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B"
    if score >= 60: return "C"
    if score >= 50: return "D"
    return "F"


def create_score_bar(score, width=300, height=20):
    """Create a horizontal bar chart for a single score."""
    d = Drawing(width + 60, height + 5)
    # Background bar
    d.add(Rect(0, 0, width, height, fillColor=LIGHT_GRAY, strokeColor=None))
    # Score bar
    bar_width = (score / 100) * width
    d.add(Rect(0, 0, bar_width, height, fillColor=score_color(score), strokeColor=None))
    # Score text
    d.add(String(width + 5, 4, f"{score}/100", fontSize=10, fillColor=DARK_GRAY))
    return d


def create_score_gauge(score, size=150):
    """Create a circular score gauge for the cover page."""
    d = Drawing(size, size)
    cx, cy, r = size / 2, size / 2, size / 2 - 10

    # Background circle
    d.add(Circle(cx, cy, r, fillColor=LIGHT_GRAY, strokeColor=colors.HexColor("#bdc3c7"), strokeWidth=2))
    # Inner circle with score color
    d.add(Circle(cx, cy, r - 8, fillColor=score_color(score), strokeColor=None))
    # White center
    d.add(Circle(cx, cy, r - 20, fillColor=WHITE, strokeColor=None))
    # Score text
    d.add(String(cx - 15, cy - 8, str(score), fontSize=28, fillColor=DARK_GRAY, fontName="Helvetica-Bold"))
    # "/100" text
    d.add(String(cx - 10, cy - 22, "/100", fontSize=10, fillColor=DARK_GRAY))

    return d


def build_pdf(data, output_path):
    """Build the complete PDF report."""
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "CoverTitle", parent=styles["Title"],
        fontSize=28, textColor=DARK_BLUE, spaceAfter=10
    ))
    styles.add(ParagraphStyle(
        "CoverSubtitle", parent=styles["Normal"],
        fontSize=14, textColor=DARK_GRAY, spaceAfter=20
    ))
    styles.add(ParagraphStyle(
        "SectionHeader", parent=styles["Heading1"],
        fontSize=18, textColor=DARK_BLUE, spaceBefore=20, spaceAfter=10
    ))
    styles.add(ParagraphStyle(
        "SubHeader", parent=styles["Heading2"],
        fontSize=14, textColor=DARK_BLUE, spaceBefore=12, spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        "BodyText", parent=styles["Normal"],
        fontSize=10, textColor=DARK_GRAY, spaceAfter=6, leading=14
    ))
    styles.add(ParagraphStyle(
        "Finding", parent=styles["Normal"],
        fontSize=10, textColor=DARK_GRAY, spaceAfter=4, leftIndent=20
    ))

    elements = []

    # === COVER PAGE ===
    elements.append(Spacer(1, 1.5 * inch))
    elements.append(Paragraph("Marketing Audit Report", styles["CoverTitle"]))
    elements.append(Paragraph(data.get("business_name", "Business"), styles["CoverSubtitle"]))
    elements.append(Spacer(1, 0.3 * inch))

    overall = data.get("overall_score", 0)
    grade = data.get("overall_grade", grade_from_score(overall))
    elements.append(create_score_gauge(overall))
    elements.append(Spacer(1, 0.2 * inch))
    elements.append(Paragraph(f"Overall Grade: <b>{grade}</b>", styles["CoverSubtitle"]))
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(Paragraph(f"URL: {data.get('url', 'N/A')}", styles["BodyText"]))
    elements.append(Paragraph(f"Date: {data.get('date', datetime.now().strftime('%Y-%m-%d'))}", styles["BodyText"]))
    elements.append(Paragraph("Prepared by: Apex Vision", styles["BodyText"]))

    elements.append(PageBreak())

    # === SCORE BREAKDOWN ===
    elements.append(Paragraph("Score Breakdown", styles["SectionHeader"]))
    elements.append(HRFlowable(width="100%", thickness=1, color=DARK_BLUE))
    elements.append(Spacer(1, 0.2 * inch))

    scores = data.get("scores", {})
    category_labels = {
        "content": "Content & Messaging",
        "conversion": "Conversion Optimization",
        "seo": "SEO & Discoverability",
        "competitive": "Competitive Positioning",
        "brand": "Brand & Trust",
        "strategy": "Growth & Strategy",
    }
    category_weights = {
        "content": "25%", "conversion": "20%", "seo": "20%",
        "competitive": "15%", "brand": "10%", "strategy": "10%",
    }

    for key, label in category_labels.items():
        cat = scores.get(key, {})
        score = cat.get("score", 0)
        summary = cat.get("summary", "")
        weight = category_weights.get(key, "")

        elements.append(Paragraph(f"<b>{label}</b> (Weight: {weight})", styles["SubHeader"]))
        elements.append(create_score_bar(score))
        if summary:
            elements.append(Paragraph(summary, styles["BodyText"]))
        elements.append(Spacer(1, 0.1 * inch))

    elements.append(PageBreak())

    # === KEY FINDINGS ===
    elements.append(Paragraph("Key Findings", styles["SectionHeader"]))
    elements.append(HRFlowable(width="100%", thickness=1, color=DARK_BLUE))
    elements.append(Spacer(1, 0.2 * inch))

    findings = data.get("findings", [])
    severity_colors = {
        "Critical": RED, "High": colors.HexColor("#e67e22"),
        "Medium": YELLOW, "Low": GREEN
    }

    for i, finding in enumerate(findings[:10], 1):
        severity = finding.get("severity", "Medium")
        sev_color = severity_colors.get(severity, YELLOW)
        title = finding.get("title", "Finding")
        desc = finding.get("description", "")
        rec = finding.get("recommendation", "")

        elements.append(Paragraph(
            f'<b>{i}. [{severity}]</b> {title}',
            styles["SubHeader"]
        ))
        if desc:
            elements.append(Paragraph(desc, styles["Finding"]))
        if rec:
            elements.append(Paragraph(f"<i>Recommendation:</i> {rec}", styles["Finding"]))
        elements.append(Spacer(1, 0.1 * inch))

    elements.append(PageBreak())

    # === ACTION PLAN ===
    elements.append(Paragraph("Action Plan", styles["SectionHeader"]))
    elements.append(HRFlowable(width="100%", thickness=1, color=DARK_BLUE))

    action_plan = data.get("action_plan", {})
    for tier, label in [("quick_wins", "Quick Wins (This Week)"),
                        ("strategic", "Strategic Changes (This Month)"),
                        ("long_term", "Long-Term Investments (This Quarter)")]:
        items = action_plan.get(tier, [])
        if items:
            elements.append(Paragraph(label, styles["SubHeader"]))
            for item in items:
                elements.append(Paragraph(f"  - {item}", styles["Finding"]))
            elements.append(Spacer(1, 0.1 * inch))

    # === COMPETITORS ===
    competitors = data.get("competitors", [])
    if competitors:
        elements.append(PageBreak())
        elements.append(Paragraph("Competitive Landscape", styles["SectionHeader"]))
        elements.append(HRFlowable(width="100%", thickness=1, color=DARK_BLUE))
        elements.append(Spacer(1, 0.2 * inch))

        table_data = [["Competitor", "URL", "Strengths", "Weaknesses"]]
        for comp in competitors:
            table_data.append([
                comp.get("name", ""),
                comp.get("url", ""),
                comp.get("strengths", ""),
                comp.get("weaknesses", ""),
            ])

        t = Table(table_data, colWidths=[1.5 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(t)

    # === METHODOLOGY ===
    elements.append(PageBreak())
    elements.append(Paragraph("Methodology", styles["SectionHeader"]))
    elements.append(HRFlowable(width="100%", thickness=1, color=DARK_BLUE))
    elements.append(Spacer(1, 0.2 * inch))
    elements.append(Paragraph(
        "This report was generated using Apex Vision's AI Marketing Suite. "
        "Five specialized analysis agents examine the website simultaneously across "
        "content quality, conversion optimization, technical SEO, competitive positioning, "
        "and growth strategy. Each category is scored 0-100 and weighted to produce the overall score.",
        styles["BodyText"]
    ))
    elements.append(Paragraph(
        "Scores are based on industry best practices, competitive benchmarks, and "
        "conversion rate optimization research. Recommendations are prioritized by "
        "expected impact and implementation effort.",
        styles["BodyText"]
    ))

    # Build PDF
    doc.build(elements)
    print(f"PDF report generated: {output_path}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_pdf_report.py <input.json> [output.pdf]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else input_path.replace(".json", ".pdf")

    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)

    with open(input_path, "r") as f:
        data = json.load(f)

    build_pdf(data, output_path)


if __name__ == "__main__":
    main()
