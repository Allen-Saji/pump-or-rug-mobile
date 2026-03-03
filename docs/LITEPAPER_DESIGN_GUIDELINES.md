# Litepaper Site Design Guidelines (Degen + Clean)

## Design goals
1. Instantly understandable in 10 seconds
2. Feels degen-native, not corporate
3. Still readable and trustworthy for judges/investors
4. Mobile-first (primary)

## Visual direction
- Mood: cyber-terminal + meme trading floor
- Tone: bold, punchy, slightly chaotic but controlled
- Avoid clutter: high contrast, short sections, clear hierarchy

## Color system
- Background: near-black `#07090D`
- Surface: `#0E1320`
- Primary text: `#EAF2FF`
- Muted text: `#93A4C3`
- Pump accent: neon green `#23F28B`
- Rug accent: hot red `#FF4D6D`
- Neutral accent: electric blue `#4EA8FF`
- Warning/void: amber `#FFC857`

## Typography
- Headings: bold geometric sans (e.g. Space Grotesk/Plus Jakarta Sans)
- Body: clean sans (Inter/DM Sans)
- Data/labels: mono (JetBrains Mono)

Rules:
- H1 very short, max 8 words
- Body line length: 55–75 chars desktop, 35–45 mobile
- Prefer 1–2 sentence paragraphs

## Layout
- Single page with anchored sections
- Sticky top nav with section jumps
- Max content width: 1100px desktop
- Section rhythm: generous vertical spacing (72–96px desktop, 48–64px mobile)

## Component style
1. Hero block
   - Huge title
   - One-line value prop
   - Primary CTA + secondary CTA
2. Rule cards
   - One rule per card
   - Show formula + plain-English explanation
3. Comparison bars
   - Pump vs Rug thresholds visualized
4. Timeline strip
   - Hourly round -> 60 min pick window -> settle at :05
5. Token selection matrix
   - Show filters + why each exists

## Motion and interaction
- Use subtle scanline/noise overlays (very low opacity)
- Hover lift + glow on cards
- Animated counters for key stats
- Avoid heavy animation that hurts mobile performance

## Copy rules
- Short, sharp, degen-friendly language
- Every technical term must have plain-English line under it
- Keep formulas visible but optional to read
- No giant paragraphs

## Section-by-section UX notes
### Hero
- Headline example: "Call Pumps. Dodge Rugs. Climb the Board."
- Subheadline must mention pump.fun

### Problem
- Use 3 bullets max
- Include one meme-ish line and one serious line

### How it works
- 3-step visual flow only
- Keep each step under 12 words

### Settlement logic
- Must show exact thresholds in a compact block
- Show "Order matters: VOID -> RUG -> PUMP -> NO SCORE"

### Anti-manipulation
- Display as trust checklist with check icons
- Include: Birdeye oracle, liquidity floor, hidden selection, cooldown

### Mobile edge
- Show mockup frame with thumb-zone optimized UI

### Roadmap
- 3 phases max for litepaper

## Mobile requirements
- Design for 390x844 first
- Buttons min height 44px
- Sticky CTA on mobile bottom (optional)
- Avoid multi-column dense tables on mobile

## Accessibility baseline
- Contrast >= WCAG AA for body text
- Don’t rely on color alone for Pump/Rug
- Keyboard navigable anchors
- Respect reduced-motion preference

## Technical implementation hints
- Stack: Next.js + Tailwind + Framer Motion (light use)
- Use CSS variables for theme tokens
- Prefer static content sections for fast loading
- Preload key font files or use system fallback

## Final quality checklist
- Can a first-time user explain game in 30 seconds?
- Can they find settlement rules in one scroll?
- Does it feel fun without looking scammy?
- Does it look great on Android screen recording for demo?
