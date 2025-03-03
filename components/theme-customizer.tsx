"use client";

import { useState } from "react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { defaultThemeConfig } from "../lib/theme-config";

export function ThemeCustomizer() {
  const { theme, setTheme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<"light" | "dark">(
    isDarkMode ? "dark" : "light"
  );

  const handleColorChange = (
    mode: "light" | "dark",
    key: string,
    value: string
  ) => {
    setTheme({
      ...theme,
      colors: {
        ...theme.colors,
        [mode]: {
          ...(theme.colors?.[mode] || {}),
          [key]: value,
        },
      },
    });
  };

  const handleSidebarChange = (key: string, value: string) => {
    setTheme({
      ...theme,
      sidebar: {
        ...theme.sidebar,
        [key]: value,
      },
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Theme Customization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sidebar Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sidebar Settings</h3>
          <div className="space-y-2">
            <Label htmlFor="sidebar-label">Sidebar Label</Label>
            <Input
              id="sidebar-label"
              value={theme.sidebar?.label || ""}
              onChange={(e) => handleSidebarChange("label", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-avatar">AI Avatar URL</Label>
            <Input
              id="ai-avatar"
              value={theme.sidebar?.aiAvatarUrl || ""}
              onChange={(e) =>
                handleSidebarChange("aiAvatarUrl", e.target.value)
              }
            />
          </div>
        </div>

        {/* Color Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Color Settings</h3>

          <Tabs
            value={activeTab}
            onValueChange={(value: "light" | "dark") =>
              setActiveTab(value as "light" | "dark")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="light">Light Mode</TabsTrigger>
              <TabsTrigger value="dark">Dark Mode</TabsTrigger>
            </TabsList>

            <TabsContent value="light" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(theme.colors?.light || {}).map(
                  ([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`light-${key}`}>{key}</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`light-${key}`}
                          value={value || ""}
                          onChange={(e) =>
                            handleColorChange("light", key, e.target.value)
                          }
                        />
                        <div
                          className="size-8 rounded border"
                          style={{ backgroundColor: `hsl(${value})` }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </TabsContent>

            <TabsContent value="dark" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(theme.colors?.dark || {}).map(
                  ([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`dark-${key}`}>{key}</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`dark-${key}`}
                          value={value || ""}
                          onChange={(e) =>
                            handleColorChange("dark", key, e.target.value)
                          }
                        />
                        <div
                          className="size-8 rounded border"
                          style={{ backgroundColor: `hsl(${value})` }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={() => setTheme(defaultThemeConfig)}
          className="w-full"
        >
          Reset to Default
        </Button>
      </CardContent>
    </Card>
  );
}
