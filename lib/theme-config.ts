// Theme configuration for the AI chatbot application

// Default theme configuration
export const themeConfig = {
  colors: {
    light: {
      // Purple light mode colors
      primary: "249 92% 65%", // A vibrant purple shade
      "primary-foreground": "0 0% 98%",
      secondary: "240 40% 90%", // Lighter purple for secondary
      "secondary-foreground": "240 50% 10%",
      background: "0 0% 100%",
      foreground: "240 20% 20%", // Darker foreground for contrast
      card: "0 0% 100%",
      "card-foreground": "240 20% 20%",
      popover: "0 0% 100%",
      "popover-foreground": "240 20% 20%",
      muted: "249 80% 95%",
      "muted-foreground": "240 50% 70%",
      accent: "249 52% 65%",
      "accent-foreground": "0 0% 98%",
      sidebar: "240 10% 10%",
      "sidebar-background": "249 80% 98%",
      "sidebar-foreground": "240 10% 26.1%",
      border: "249 10% 90%",
      input: "249 10% 90%",
      ring: "249 92% 45%",
    },
    dark: {
      // Purple dark mode colors
      primary: "249 92% 65%",
      "primary-foreground": "0 0% 98%", // Vibrant purple for primary foreground
      secondary: "240 40% 30%", // Darker vibrant purple for secondary
      "secondary-foreground": "0 0% 98%",
      background: "249 15% 5%", // Darker background for dark mode
      foreground: "0 0% 98%",
      card: "240 20% 3.9%",
      "card-foreground": "0 0% 98%",
      popover: "240 20% 3.9%",
      "popover-foreground": "0 0% 98%",
      muted: "249 35% 15%",
      "muted-foreground": "240 10% 64.9%",
      accent: "249 52% 45%",
      "accent-foreground": "0 0% 98%",
      border: "249 10% 15.9%",
      input: "249 10% 15.9%",
      ring: "249 92% 75%",
      sidebar: "240 10% 10%",
      "sidebar-background": "249 25% 10%",
      "sidebar-foreground": "240 10% 95.9%",
    },
  },
  sidebar: {
    label: "Monad Assistant",
    aiAvatarUrl: "/ai-avatar.png",
  },
} as const;

export type ThemeConfig = typeof themeConfig;

// Generate CSS for theme variables
export function generateThemeCSS(config: ThemeConfig): string {
  let css = "";

  // Generate light mode CSS variables
  if (config.colors?.light) {
    css += ":root {\n";
    Object.entries(config.colors.light).forEach(([key, value]) => {
      if (value) {
        css += `  --${key}: ${value};\n`;
      }
    });

    css += "}\n\n";
  }

  // Generate dark mode CSS variables
  if (config.colors?.dark) {
    css += ".dark {\n";
    Object.entries(config.colors.dark).forEach(([key, value]) => {
      if (value) {
        css += `  --${key}: ${value};\n`;
      }
    });
    css += "}\n";
  }

  return css;
}

// Function to apply theme configuration (client-side only)
export function applyThemeConfig(
  config: ThemeConfig,
  isDarkMode = false
) {
  if (typeof document === "undefined") return; // Skip on server-side

  const root = document.documentElement;
  const colorMode = isDarkMode ? "dark" : "light";

  // Apply color variables
  if (config.colors?.[colorMode]) {
    Object.entries(config.colors[colorMode] || {}).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(`--${key}`, value);
      }
    });
  }
}
