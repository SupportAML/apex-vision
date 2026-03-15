# Social Media Content

Generate platform-specific social media posts for LinkedIn, Instagram, Threads, and Twitter.

## What It Does
- Creates posts tailored to each platform's format and audience
- Generates accompanying visual concepts/descriptions for image creation
- Supports multiple variations per post for A/B testing
- Learns from approved examples to match brand voice over time

## Inputs
- Entity name (to load brand.md for tone)
- Topic or content brief
- Platform(s) to target
- Optional: reference post or approved example

## Outputs
- Post text per platform (with hashtags, formatting)
- Image prompt or visual description
- Saved to outputs/[entity]/social/

## Usage
```
Topic: "NLC just won a complex neurosurgery malpractice case"
Platforms: LinkedIn, Instagram
Variations: 3
```

## Source
Adapted from alirezarezvani/claude-skills (marketing pod) + ComposioHQ/awesome-claude-skills
