#!/usr/bin/env python3
"""Generate a 30-day social media content calendar.

Usage:
    python social_calendar.py <business_name> <industry> [output.json]

Creates a content calendar with platform-specific posts, pillar rotation,
and hook formulas.

No external dependencies required.
"""

import json
import sys
from datetime import datetime, timedelta


# Content pillars rotate on a 5-day cycle
CONTENT_PILLARS = [
    "Educational",      # Day 1: Teach something valuable
    "Behind the Scenes", # Day 2: Show the human side
    "Social Proof",      # Day 3: Case studies, testimonials, results
    "Engagement",        # Day 4: Questions, polls, conversations
    "Promotional",       # Day 5: Products, services, offers
]

HOOK_FORMULAS = {
    "Educational": [
        "Most {industry} businesses get this wrong...",
        "The #1 mistake I see in {industry}:",
        "Here's what nobody tells you about {topic}:",
        "{Number} things I wish I knew about {topic} sooner",
        "Stop doing {bad_practice}. Do this instead:",
    ],
    "Behind the Scenes": [
        "Here's what a day at {business} actually looks like:",
        "The real story behind how we {achievement}:",
        "I wasn't going to share this, but...",
        "What happens when {scenario} at {business}:",
        "The honest truth about running a {industry} business:",
    ],
    "Social Proof": [
        "{Client} came to us with {problem}. Here's what happened:",
        "Results from our latest {service}:",
        "Why {client_type} choose {business} over the competition:",
        "Before and after: {transformation}",
        "Don't take our word for it. Here's what {client} says:",
    ],
    "Engagement": [
        "Hot take: {controversial_opinion}. Agree or disagree?",
        "What's your biggest challenge with {topic}?",
        "If you could change one thing about {industry}, what would it be?",
        "Rate your {topic} on a scale of 1-10:",
        "Unpopular opinion about {industry}:",
    ],
    "Promotional": [
        "Introducing {product/service} — built for {audience}",
        "For a limited time: {offer}",
        "Ready to {desired_outcome}? Here's how we help:",
        "New: {feature/service} is now available",
        "This is for you if you're tired of {pain_point}:",
    ],
}

PLATFORM_SPECS = {
    "LinkedIn": {
        "max_length": 3000,
        "best_time": "8-10am or 12-1pm weekdays",
        "format": "Long-form text with line breaks, no hashtags in body, 3-5 hashtags at end",
        "frequency": "3-5x per week",
    },
    "Instagram": {
        "max_length": 2200,
        "best_time": "11am-1pm or 7-9pm",
        "format": "Caption with emojis, 20-30 hashtags, carousel or reel preferred",
        "frequency": "4-7x per week",
    },
    "Twitter/X": {
        "max_length": 280,
        "best_time": "9-11am weekdays",
        "format": "Short, punchy, thread for longer content, 1-3 hashtags max",
        "frequency": "3-7x per week",
    },
    "TikTok": {
        "max_length": 300,
        "best_time": "7-9am, 12-3pm, 7-11pm",
        "format": "Video script with hook in first 3 seconds, trending sounds",
        "frequency": "3-5x per week",
    },
}


def generate_calendar(business_name, industry, start_date=None):
    """Generate a 30-day content calendar."""
    if start_date is None:
        start_date = datetime.now()

    calendar = {
        "business": business_name,
        "industry": industry,
        "generated": datetime.now().strftime("%Y-%m-%d"),
        "platform_specs": PLATFORM_SPECS,
        "days": [],
    }

    for day_num in range(30):
        date = start_date + timedelta(days=day_num)
        pillar_index = day_num % len(CONTENT_PILLARS)
        pillar = CONTENT_PILLARS[pillar_index]
        hooks = HOOK_FORMULAS[pillar]
        hook = hooks[day_num % len(hooks)]

        # Replace placeholders
        hook = hook.replace("{business}", business_name)
        hook = hook.replace("{industry}", industry)

        day_entry = {
            "day": day_num + 1,
            "date": date.strftime("%Y-%m-%d"),
            "day_of_week": date.strftime("%A"),
            "pillar": pillar,
            "hook_template": hook,
            "platforms": [],
            "notes": "",
        }

        # Determine which platforms to post on this day
        weekday = date.weekday()
        if weekday < 5:  # Weekdays
            day_entry["platforms"] = ["LinkedIn", "Instagram", "Twitter/X"]
        else:  # Weekends
            day_entry["platforms"] = ["Instagram", "Twitter/X"]

        # Add repurposing suggestion every 5th day
        if (day_num + 1) % 5 == 0:
            day_entry["notes"] = "Repurpose best-performing post from this week into a different format"

        calendar["days"].append(day_entry)

    return calendar


def main():
    if len(sys.argv) < 3:
        print("Usage: python social_calendar.py <business_name> <industry> [output.json]")
        sys.exit(1)

    business_name = sys.argv[1]
    industry = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else None

    calendar = generate_calendar(business_name, industry)

    output = json.dumps(calendar, indent=2)
    if output_path:
        with open(output_path, "w") as f:
            f.write(output)
        print(f"Calendar saved to: {output_path}")
    else:
        print(output)


if __name__ == "__main__":
    main()
