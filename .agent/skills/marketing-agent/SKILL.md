---
name: marketing-agent
description: Guide for creating comprehensive advertising and marketing campaigns. Use when the user needs a marketing plan, ad copy, site analysis, or social media strategy for a specific website or product.
---

# Marketing Agent

This skill guides you through the process of acting as a world-class marketing agency. You will analyze a product/website, explain its functions, gather visual assets, and plan a multi-channel campaign.

## Process Workflow

### 1. Website & Product Analysis
**Goal**: Deeply understand what you are selling.
**Tools**: Use `read_browser_page` (or `browser_subagent` if interaction is needed) to visit the target URL.

1.  **Identify the Core Value Proposition**: What problem does it solve?
2.  **Map Functions**: List every key feature and explain *benefit* to the user.
3.  **Visual Asset Extraction**: Look for `<img>` tags or visual elements.
    *   **CRITICAL**: You MUST capture URLs of product screenshots, hero images, or UI elements found on the page.
    *   If you cannot find direct image URLs, use `browser_subagent` to inspect the page and describe the visuals in detail, or use `generate_image` to create mockups that represent the style.
    *   *User specific coverage*: The user wants to see "screenshots from the page". If technically unable to take a literal screenshot file to disk (unless using `browser_subagent` artifacts), **embed the image URLs** found on the page directly into your report using standard markdown image syntax: `![Description](url)`.

### 2. Campaign Strategy Artifact
Create a new Markdown artifact named `marketing_campaign_plan.md`. This will be your deliverable.

**Structure of the Plan**:

#### A. Executive Summary
Brief overview of the product and the campaign goal.

#### B. Product Functions & Features
Detailed breakdown of the product.
- **Feature Name**: Explanation of how it works.
- **Benefit**: Why the user cares.
- **Evidence**: **[Embed Image/Screenshot Here]** (Use URLs found on the site).

#### C. Target Audience
Who is this for? (Demographics, Psychographics, Pain Points).

#### D. Visual Strategy
Describe the visual direction.
- **Color Palette**: Extract from site (CSS).
- **Typography**: Extract from site.
- **Imagery**: Show valid image links found on the site.

### 3. Social Media Planning
**Reference**: See `references/channels.md` for specs.

For each channel (Facebook, Instagram, LinkedIn, etc.), provide:
1.  **Angle/Hook**: The specific psychological trigger (e.g., FOMO, Social Proof, Gain/Logic).
2.  **Creative Brief**:
    *   **Image/Video Concept**: Describe what the visual should be. If an image from the site fits, embed it.
    *   **Copy**: Write the actual text, hashtags, and CTA (Call to Action).
3.  **Schedule**: Suggested posting frequency or timeline (e.g., Teaser -> Launch -> Sustain).

## Instructions for Execution
1.  **ALWAYS** start by visiting the provided URL. Do not guess.
2.  **ALWAYS** quote actual text from the site to ensure tone alignment.
3.  **ALWAYS** try to find legitimate image URLs to serve as "screenshots". If the image URL is relative (e.g., `/images/logo.png`), prepend the base URL.
4.  If the user asks for a "campaign", produce the full `marketing_campaign_plan.md` artifact.
5.  If the user asks for specific ad copy, you can provide it directly in the chat, but referencing the analysis is still required.

## Example Output Structure (in Artifact)

```markdown
# Campaign: [Product Name]

## 1. Product Breakdown
### Feature: Smart Analytics
It tracks your progress automatically.
![Analytics Dashboard](https://example.com/assets/dashboard.png)

## 2. Social Media: Instagram
**Post 1: Lifestyle Shot**
*Visual*: User running with the app (Stock/Mockup or Site Image).
*Caption*: "Never run alone again. 🏃‍♂️💨 #RunSmart"
```
