---
name: Kinetic Engineering
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c3c9b0'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#8d937c'
  outline-variant: '#434936'
  surface-tint: '#a4d72e'
  primary: '#e3ffa6'
  on-primary: '#253500'
  primary-container: '#b5e940'
  on-primary-container: '#4a6700'
  inverse-primary: '#4b6700'
  secondary: '#b7c4ff'
  on-secondary: '#002681'
  secondary-container: '#033cb8'
  on-secondary-container: '#a3b5ff'
  tertiary: '#f9f2ff'
  on-tertiary: '#3a0093'
  tertiary-container: '#dfd1ff'
  on-tertiary-container: '#6943c6'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#bff44a'
  primary-fixed-dim: '#a4d72e'
  on-primary-fixed: '#141f00'
  on-primary-fixed-variant: '#384e00'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b7c4ff'
  on-secondary-fixed: '#001551'
  on-secondary-fixed-variant: '#0039b4'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#cfbdff'
  on-tertiary-fixed: '#22005d'
  on-tertiary-fixed-variant: '#5127ae'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin: 40px
  container-max: 1440px
  stack-xs: 8px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

This design system is built on the principles of high-performance engineering and mathematical precision. It targets a sophisticated audience that values speed, utility, and a "pro-tool" aesthetic. The brand personality is clinical yet energetic—characterized by deep technical blacks and sudden bursts of hyper-saturated color.

The design style merges **Modern Corporate** structure with **Glassmorphism** and **High-Contrast** accents. It utilizes ultra-thin borders and semi-transparent layers to create a UI that feels like a high-tech heads-up display (HUD). The focus is on clarity, where every element has a functional purpose and visual weight is managed through luminosity rather than traditional shadows.

## Colors

The palette is anchored in an absolute black (`#000000`) to maximize OLED efficiency and visual depth. The primary brand color is a high-visibility Lime (`#B5E940`), used sparingly for critical actions and brand presence. 

Secondary and tertiary accents—Electric Blue and Tech Purple—are reserved for data visualization and secondary interactive states, providing a "neon-on-midnight" contrast. Grays are neutral and cool-toned, used primarily for subtle borders and secondary text to maintain a clean, monochromatic foundation that allows accent colors to pop.

## Typography

The typography system relies on a dual-font strategy. **Space Grotesk** provides a technical, geometric edge for headlines and UI labels, echoing the aesthetics of modern engineering. **Inter** is utilized for body copy and long-form content to ensure maximum readability and a neutral, utilitarian feel.

Large headlines should use tight letter spacing and bold weights to command attention. Labels and small UI elements should frequently use uppercase with increased tracking to enhance the "instrument panel" look.

## Layout & Spacing

This design system uses a **Fixed Grid** model for desktop and a **Fluid Grid** for mobile devices. The underlying rhythm is based on a 4px baseline grid to ensure perfect alignment of technical elements. 

Layouts are structured using a 12-column grid with generous 24px gutters. Content is often contained within "modules" that use consistent padding (24px or 32px) to maintain a modular, dashboard-like appearance. Negative space is used strategically to separate distinct functional areas rather than relying on heavy dividers.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and **Tonal Layering** rather than traditional drop shadows.
- **Surface 0:** Pure black background (`#000000`).
- **Surface 1:** Deep charcoal (`#121212`) for secondary containers.
- **Glass Layer:** 40% opacity surfaces with a 20px backdrop blur and a 1px "inner-glow" border (`#FFFFFF` at 10% opacity).

Interactive elements should appear to "light up" rather than "lift up." Use subtle outer glows with the primary accent color to indicate focus or active states, simulating the luminescence of high-end hardware interfaces.

## Shapes

The shape language is disciplined and "sharp-soft." Base components use a **0.25rem (4px)** corner radius to maintain a sense of precision and structural integrity. 

Large containers and cards may scale up to **0.5rem (8px)**, but never further. Avoid fully rounded pill shapes unless used for specialized tags or status indicators. This restraint in curvature reinforces the engineering-led aesthetic, favoring hard lines and intentional corners over organic softness.

## Components

### Buttons
Primary buttons are solid Lime (`#B5E940`) with black text, featuring sharp corners and a "no-transition" hover state to feel instantaneous. Secondary buttons are outlined with a 1px border and use a semi-transparent fill on hover.

### Cards & Containers
Cards utilize the glassmorphism effect: a subtle backdrop blur, a dark translucent fill, and a 1px hairline border. Borders should use a "top-light" gradient to simulate a physical edge catching a light source.

### Input Fields
Inputs are minimal, featuring only a bottom border in a neutral gray that transitions to the primary accent color upon focus. Use monospaced fonts for numerical input to emphasize data precision.

### Chips & Badges
Chips are small, rectangular elements with high-contrast text. Status indicators use a small glowing dot (CSS `box-shadow` with blur) to represent "Live" or "Active" states.

### Progress Bars
Progress indicators should be ultra-thin (2px - 4px) and use a vibrant gradient fill (e.g., Electric Blue to Tech Purple) to signify movement and performance.