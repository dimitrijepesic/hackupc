---
name: Precision & Clarity
colors:
  surface: '#fcf8f8'
  surface-dim: '#ddd9d9'
  surface-bright: '#fcf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c8'
  surface-tint: '#5d5f5f'
  primary: '#5d5f5f'
  on-primary: '#ffffff'
  primary-container: '#ffffff'
  on-primary-container: '#747676'
  inverse-primary: '#c6c6c7'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#5f5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffffff'
  on-tertiary-container: '#767575'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e4e2e1'
  tertiary-fixed-dim: '#c8c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474747'
  background: '#fcf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  xxxl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system is engineered for professional environments where clarity, precision, and efficiency are paramount. It targets high-stakes industries like fintech, scientific research, and advanced SaaS, where information density must be balanced with absolute legibility.

The style is **Minimalist and High-Contrast**, drawing from modern Swiss design principles. It emphasizes a "white-dominant" canvas to create a sense of infinite space and clinical cleanliness. Instead of structural borders, the system uses light, air, and subtle shadows to define boundaries, evoking a "precision engineering" aesthetic that feels both premium and utilitarian.

## Colors
The palette is intentionally restricted to maintain a high-contrast, professional atmosphere. 

- **Primary White (#FFFFFF):** Used for the global background and primary surfaces to maximize the "light-filled" aesthetic.
- **Deep Black (#000000):** Reserved for primary typography and essential structural elements to ensure maximum accessibility and authority.
- **Dark Gray (#333333):** Used for secondary text, icons, and subtle interactive states.
- **Electric Indigo (#5856D6):** A sophisticated purple-blue accent used exclusively for primary actions, focus states, and active data points. 

Use color sparingly; the white space is as much a functional element as the ink.

## Typography
This design system utilizes **Inter** for its neutral, systematic, and utilitarian qualities. The typeface is optimized for screen legibility at small sizes while maintaining a geometric sophistication at larger scales.

- **Headlines:** Use tight letter-spacing and bold weights to create a strong visual anchor against the white background.
- **Body Copy:** Set with generous line-height to ensure readability in data-heavy views.
- **Labels:** Use uppercase and increased tracking for small-scale identification (e.g., table headers, overlines) to provide a "technical" feel.

## Layout & Spacing
The layout philosophy follows a **Fixed Grid** approach for desktop environments to maintain a sense of structured engineering, while transitioning to a fluid model for mobile.

- **Grid:** A 12-column grid with 24px gutters. Content should be rigorously aligned to these vertical axes.
- **Rhythm:** An 8px linear scale is used for all spatial relationships. 
- **Density:** High-density layouts are encouraged for data-heavy dashboards, provided they are balanced by generous outer margins (32px+) to prevent the UI from feeling cramped.

## Elevation & Depth
Depth is communicated through **Ambient Shadows** and tonal layering rather than lines. This creates a "precision" feel where elements appear to be floating on perfectly flat planes.

- **Level 0 (Floor):** Pure White (#FFFFFF).
- **Level 1 (Cards/Panels):** Pure White with a "Precision Shadow" (0px 2px 4px rgba(0,0,0,0.05)).
- **Level 2 (Dropdowns/Modals):** Pure White with a "Deep Ambient Shadow" (0px 12px 24px rgba(0,0,0,0.08)).
- **Separators:** When necessary, use 1px offsets of #F5F5F7 instead of dark lines. Shadows should feel almost invisible, serving only to provide enough contrast for the eye to distinguish objects.

## Shapes
The shape language is **Soft (0.25rem)**. This subtle rounding removes the harshness of 90-degree corners while maintaining a professional, rigid structure that aligns with the "precision engineering" theme.

- **Buttons & Inputs:** 4px radius.
- **Cards & Large Containers:** 8px radius (rounded-lg).
- **Icons:** Use a consistent 2px stroke weight with slight corner rounds to match the UI components.

## Components

- **Buttons:** 
  - *Primary:* Solid Black background with White text. Hover state: Electric Indigo.
  - *Secondary:* Ghost style with no border; Black text that shifts to Electric Indigo on hover.
- **Input Fields:** Pure White background with a subtle 1px border in #F5F5F7. Upon focus, the border disappears and is replaced by a 2px Electric Indigo "Precision Shadow."
- **Cards:** No borders. Defined solely by the Level 1 Ambient Shadow. Padding should be generous (24px).
- **Chips:** Light Gray (#F5F5F7) background with #333333 text. Used for status and filtering without drawing significant attention.
- **Lists:** Rows are separated by whitespace and subtle 1px #F5F5F7 dividers. Hovering over a list item should trigger a subtle shift to a #FAFAFA background.
- **Checkboxes & Radios:** When selected, they utilize the Electric Indigo accent. Use sharp, clean icons (checkmarks/dots) with no gradients.
- **Progress Indicators:** Use thin (2px or 4px) lines in Electric Indigo against a #F5F5F7 track for a technical, precise look.