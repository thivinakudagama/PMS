---
name: Professional Enterprise Identity
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#45464f'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#757680'
  outline-variant: '#c5c6d0'
  surface-tint: '#4c5d8c'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#031945'
  on-primary-container: '#7282b4'
  inverse-primary: '#b4c5fb'
  secondary: '#835400'
  on-secondary: '#ffffff'
  secondary-container: '#fcab28'
  on-secondary-container: '#694300'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1d'
  on-tertiary-container: '#828485'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b4c5fb'
  on-primary-fixed: '#031945'
  on-primary-fixed-variant: '#344573'
  secondary-fixed: '#ffddb5'
  secondary-fixed-dim: '#ffb957'
  on-secondary-fixed: '#2a1800'
  on-secondary-fixed-variant: '#643f00'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 16px
  margin: 24px
  container-max: 1440px
---

## Brand & Style

This design system establishes a visual language of authority, precision, and momentum. It is specifically tailored for high-stakes project management where clarity and trust are paramount. The aesthetic follows a **Corporate / Modern** approach, blending the deep, institutional stability of navy with the energetic, high-visibility pulse of amber. 

The interface prioritizes information density without sacrificing breathing room, ensuring that complex workflows feel manageable. It avoids unnecessary decoration, instead using subtle tonal shifts and crisp geometry to guide the user’s eye through task hierarchies and data visualizations.

## Colors

The palette is anchored by a sophisticated deep navy, which provides the structural foundation for navigation and primary actions. This is contrasted by a vibrant amber used selectively for high-priority signals, status updates, and interactive highlights.

- **Primary (#001542):** Used for sidebars, top navigation, and primary text to evoke a sense of professional reliability.
- **Secondary (#F9A825):** Reserved for "In Progress" statuses, call-to-action buttons, and critical focus states.
- **Neutral / Background (#F9FAFB & #FFFFFF):** These provide a clean, high-contrast canvas for data-heavy tables and kanban boards, reducing visual fatigue during extended use.

## Typography

This design system utilizes **Manrope** to deliver a refined, technical, and balanced reading experience. The typeface offers excellent legibility at small sizes, which is critical for dense project schedules and task lists.

Headlines use a tighter letter-spacing and heavier weights to command attention, while body text maintains a generous line height to improve scanning. Labels and metadata utilize a bold weight at smaller sizes, often paired with subtle uppercase styling for distinct categorization.

## Layout & Spacing

The design system employs a **12-column fluid grid** for dashboard views, transitioning to a focused single-column layout for mobile devices. A strict 8px baseline grid ensures vertical rhythm across all components.

- **Desktop:** 24px outer margins with 16px gutters between cards. Content containers are capped at 1440px to prevent excessive line lengths on ultra-wide monitors.
- **Tablet:** Margins reduce to 16px; sidebars may collapse into an icon-only "rail" or a hamburger menu.
- **Mobile:** Elements stack vertically with a minimum 16px safe area on all sides. Interactive targets are maintained at a 44px minimum height.

## Elevation & Depth

Hierarchy is established through **tonal layers** and **ambient shadows**. The background uses the neutral off-white, while the primary workspace surfaces (cards, modals) use pure white to pop forward.

- **Level 1 (Surface):** Subtle 1px borders in a soft gray are used for most static containers.
- **Level 2 (Interaction):** Low-opacity, extra-diffused shadows (e.g., `rgba(0, 21, 66, 0.08)`) are applied to cards during hover states to indicate interactivity.
- **Level 3 (Overlay):** Modals and dropdowns use a more pronounced shadow with a slightly tinted navy base to reinforce the brand's primary color within the depth model.

## Shapes

The design system uses a **Rounded** shape language to soften the corporate aesthetic and make the platform feel modern and accessible.

Standard components like buttons and input fields utilize a 0.5rem (8px) radius. Larger containers, such as project cards or dashboard widgets, use a 1rem (16px) radius to create a clear container-to-content relationship. Status pills and tags are fully rounded (pill-shaped) to distinguish them from interactive action buttons.

## Components

### Buttons
- **Primary:** Deep Navy (#001542) background with White text. Bold weight. Used for the main action (e.g., "Create Project").
- **Secondary:** Amber (#F9A825) background with Navy text. Used for secondary critical actions (e.g., "Go Pro", "Urgent Update").
- **Ghost:** Transparent background with Navy border and text. Used for "Cancel" or "Edit" actions.

### Input Fields
Inputs feature a 1px border and a white background. Upon focus, the border transitions to the Primary Navy with a subtle 2px outer glow. Labels are placed above the field in the `label-md` style.

### Cards & Lists
Task lists utilize thin dividers between items. Active or selected tasks are highlighted with a vertical 4px Amber bar on the left edge. Cards use the `rounded-lg` token and a subtle Level 1 shadow.

### Chips & Badges
Small, rounded indicators for status. "High Priority" uses an Amber background with low opacity and high-saturation text. "Completed" uses a neutral light gray.

### Progress Bars
The track is the Neutral Tertiary color, while the fill is either Navy (standard progress) or Amber (approaching deadline).