# SEO Content

Create search-optimized articles, blog posts, and web copy.
Also serves as the handler for `/market seo`.

## What It Does
- Keyword research and clustering for target topics
- Long-form article generation optimized for search intent
- Meta descriptions, title tags, headers structure
- Internal linking suggestions
- Content gap analysis vs competitors
- Technical SEO audit (on-page, schema, E-E-A-T)

## Inputs
- Entity name
- Target keyword or topic
- Content type (blog post, landing page, FAQ)
- Competitor URLs (optional)

## Outputs
- Full article with SEO structure
- Keyword map
- Meta tags
- Saved to outputs/[entity]/content/

## SEO Audit Mode (`/market seo`)

### On-Page SEO Checklist
| Element | Best Practice | Check |
|---------|--------------|-------|
| Title tag | 50-60 chars, keyword near front | [ ] |
| Meta description | 150-160 chars, includes CTA | [ ] |
| H1 | Single H1, includes primary keyword | [ ] |
| H2-H6 | Logical hierarchy, keyword variations | [ ] |
| URL structure | Short, descriptive, hyphens | [ ] |
| Image alt text | Descriptive, keyword where natural | [ ] |
| Internal links | 3-5 per page to relevant content | [ ] |
| External links | 1-2 to authoritative sources | [ ] |
| Content length | 1,500+ words for pillar, 800+ for supporting | [ ] |
| Schema markup | Organization, Article, FAQ, HowTo | [ ] |

### E-E-A-T Assessment
- **Experience:** First-hand experience demonstrated?
- **Expertise:** Author credentials visible? Depth of knowledge?
- **Authoritativeness:** Industry recognition? Backlinks? Citations?
- **Trustworthiness:** Accurate info? Clear sourcing? Transparency?

### Keyword Analysis Framework
1. **Primary keyword:** Main target (1 per page)
2. **Secondary keywords:** 3-5 related terms
3. **Long-tail variations:** Question-based, conversational
4. **Semantic keywords:** LSI terms for topical depth

### Schema Audit
Check for and recommend:
- Organization schema (business info)
- LocalBusiness schema (if applicable)
- Article / BlogPosting schema
- FAQ schema (for FAQ sections)
- HowTo schema (for tutorial content)
- Review / AggregateRating schema
- BreadcrumbList schema
- Product schema (if selling products)

### Content Gap Analysis
1. Identify keywords competitors rank for that you don't
2. Find topics with high search volume and low competition
3. Map content clusters (pillar + supporting pages)
4. Prioritize by: search volume x conversion potential / competition

### Page Analysis Script
```bash
python scripts/marketing/analyze_page.py <url>
```
Extracts: title, meta, headings, CTAs, forms, tracking, schema, social links.

## Source
Adapted from alirezarezvani/claude-skills (marketing pod) + zubair-trabzada/ai-marketing-claude (market-seo)
