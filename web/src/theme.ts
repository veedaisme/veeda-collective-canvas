/**
 * Central theme constants for Veeda UI.
 * Import from this file for consistent styling across components.
 *
 * Usage:
 *   import { THEME } from "@/theme";
 *   <div style={{ height: THEME.headerHeight, background: THEME.colors.background }} />
 *
 * For CSS variables (colors, etc.), use Tailwind's bg-[var(--color-background)] or reference in custom CSS.
 */

export const THEME = {
  headerHeight: '4rem', // 64px
  containerMaxWidth: '1024px', // Tailwind's max-w-screen-lg
  containerPaddingX: '1rem', // 16px (px-4)
  colors: {
    background: 'var(--color-background, #fff)',
    foreground: 'var(--color-foreground, #111)',
    border: 'var(--color-border, #e5e7eb)',
    accent: 'var(--color-accent, #ff8800)',
    muted: 'var(--color-muted, #6b7280)',
    card: 'var(--color-card, #fff)',
    cardBorder: 'var(--color-card-border, #e5e7eb)',
    shadow: '0 1px 4px 0 rgb(0 0 0 / 0.04)',
  },
  font: {
    family: 'Inter, sans-serif',
    sizeBase: '1rem',
    sizeLg: '1.25rem',
    weightBold: 700,
    weightNormal: 400,
  },
  borderRadius: '0.5rem', // 8px
  zIndexHeader: 50,
};
