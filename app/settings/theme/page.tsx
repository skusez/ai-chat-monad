import { ThemeCustomizer } from "../../../components/theme-customizer";

export default function ThemeSettingsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Theme Settings</h1>
      <ThemeCustomizer />
    </div>
  );
}
