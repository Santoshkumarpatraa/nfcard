export type Theme = {
  name: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
};

export const THEMES = {
  onyx: {
    name: "Onyx",
    bg: "#0b0b0c",
    surface: "#161618",
    text: "#f4f1ea",
    muted: "#a19d94",
    border: "#2a2a2d",
    accent: "#c8a96a",
    accentText: "#0b0b0c",
  },
  ivory: {
    name: "Ivory",
    bg: "#f7f4ee",
    surface: "#ffffff",
    text: "#17150f",
    muted: "#6b665c",
    border: "#e4ded2",
    accent: "#17150f",
    accentText: "#f7f4ee",
  },
  midnight: {
    name: "Midnight",
    bg: "#0a1020",
    surface: "#121a2e",
    text: "#eef2fb",
    muted: "#93a0bd",
    border: "#24304d",
    accent: "#b9c6e4",
    accentText: "#0a1020",
  },
  forest: {
    name: "Forest",
    bg: "#0d1712",
    surface: "#14231b",
    text: "#eef3ee",
    muted: "#9db3a5",
    border: "#25392e",
    accent: "#d9c58f",
    accentText: "#0d1712",
  },
  blush: {
    name: "Blush",
    bg: "#fbf3f1",
    surface: "#ffffff",
    text: "#2b1418",
    muted: "#80646a",
    border: "#efdcd8",
    accent: "#7a2335",
    accentText: "#fbf3f1",
  },
} satisfies Record<string, Theme>;

export type ThemeId = keyof typeof THEMES;
export const THEME_IDS: ThemeId[] = ["onyx", "ivory", "midnight", "forest", "blush"];

export function isThemeId(value: string): value is ThemeId {
  return THEME_IDS.some((id) => id === value);
}

export function resolveTheme(themeId: string, accent?: string | null): Theme {
  const base = isThemeId(themeId) ? THEMES[themeId] : THEMES.onyx;
  return accent && /^#[0-9a-f]{6}$/i.test(accent) ? { ...base, accent } : base;
}

export function themeStyle(theme: Theme): Record<string, string> {
  return {
    "--p-bg": theme.bg,
    "--p-surface": theme.surface,
    "--p-text": theme.text,
    "--p-muted": theme.muted,
    "--p-border": theme.border,
    "--p-accent": theme.accent,
    "--p-accent-text": theme.accentText,
  };
}
