// Theme configuration for the AI chatbot application

export interface ThemeConfig {
  // Custom CSS variables for theme colors
  colors?: {
    // Light mode colors
    light?: {
      primary?: string;
      "primary-foreground"?: string;
      secondary?: string;
      "secondary-foreground"?: string;
      background?: string;
      foreground?: string;
      card?: string;
      "card-foreground"?: string;
      popover?: string;
      "popover-foreground"?: string;
      muted?: string;
      "muted-foreground"?: string;
      accent?: string;
      "accent-foreground"?: string;
      destructive?: string;
      "destructive-foreground"?: string;
      border?: string;
      input?: string;
      ring?: string;
      // Sidebar specific colors
      "sidebar-background"?: string;
      "sidebar-foreground"?: string;
      "sidebar-primary"?: string;
      "sidebar-primary-foreground"?: string;
      "sidebar-accent"?: string;
      "sidebar-accent-foreground"?: string;
      "sidebar-border"?: string;
      "sidebar-ring"?: string;
    };
    // Dark mode colors
    dark?: {
      primary?: string;
      "primary-foreground"?: string;
      secondary?: string;
      "secondary-foreground"?: string;
      background?: string;
      foreground?: string;
      card?: string;
      "card-foreground"?: string;
      popover?: string;
      "popover-foreground"?: string;
      muted?: string;
      "muted-foreground"?: string;
      accent?: string;
      "accent-foreground"?: string;
      destructive?: string;
      "destructive-foreground"?: string;
      border?: string;
      input?: string;
      ring?: string;
      // Sidebar specific colors
      "sidebar-background"?: string;
      "sidebar-foreground"?: string;
      "sidebar-primary"?: string;
      "sidebar-primary-foreground"?: string;
      "sidebar-accent"?: string;
      "sidebar-accent-foreground"?: string;
      "sidebar-border"?: string;
      "sidebar-ring"?: string;
    };
  };
  // Border radius configuration
  borderRadius?: {
    lg?: string;
    md?: string;
    sm?: string;
  };
  // Sidebar configuration
  sidebar?: {
    // Label to display in the sidebar
    label?: string;
    // URL for the AI avatar image
    aiAvatarUrl?: string;
  };
}

// Default theme configuration
export const defaultThemeConfig: ThemeConfig = {
  colors: {
    light: {
      // Default light mode colors
      primary: "240 5.9% 10%",
      "primary-foreground": "0 0% 98%",
      secondary: "240 4.8% 95.9%",
      "secondary-foreground": "240 5.9% 10%",
      background: "0 0% 100%",
      foreground: "240 10% 3.9%",
      "sidebar-background": "0 0% 98%",
      "sidebar-foreground": "240 5.3% 26.1%",
    },
    dark: {
      // Default dark mode colors
      primary: "0 0% 98%",
      "primary-foreground": "240 5.9% 10%",
      secondary: "240 3.7% 15.9%",
      "secondary-foreground": "0 0% 98%",
      background: "240 10% 3.9%",
      foreground: "0 0% 98%",
      "sidebar-background": "240 5.9% 10%",
      "sidebar-foreground": "240 4.8% 95.9%",
    },
  },
  sidebar: {
    label: "AI Assistant",
    aiAvatarUrl: "/ai-avatar.png",
  },
};

// Function to apply theme configuration
export function applyThemeConfig(
  config: ThemeConfig,
  isDarkMode: boolean = false
) {
  if (typeof document === "undefined") return; // Skip on server-side

  const root = document.documentElement;
  const colorMode = isDarkMode ? "dark" : "light";

  // Apply color variables
  if (config.colors && config.colors[colorMode]) {
    Object.entries(config.colors[colorMode] || {}).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(`--${key}`, value);
      }
    });
  }

  // Apply border radius variables
  if (config.borderRadius) {
    Object.entries(config.borderRadius).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(`--radius-${key}`, value);
      }
    });
  }
}
