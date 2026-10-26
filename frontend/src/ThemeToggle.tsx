/* Light/dark theme switch. Style-agnostic: the caller passes the className so
   it can match each design system (shadcn pages, .fileup-landing, .fileup-app).
   Uses the Tabler icon webfont, which is loaded globally in index.html. */

import { useTheme } from "./theme";

type ThemeToggleProps = {
  className?: string;
  /** Show a text label ("Light" / "Dark") next to the icon. */
  showLabel?: boolean;
};

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <i className={"ti " + (isDark ? "ti-sun" : "ti-moon")} aria-hidden="true" />
      {showLabel && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
