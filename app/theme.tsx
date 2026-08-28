"use client";

import { useSyncExternalStore } from "react";

/**
 * Visual styling is a presentation choice, so it lives entirely in the DOM and
 * in this browser's own storage. It is never sent to the server, never part of
 * a learner's progress record, and never affects what the catalog publishes.
 */
export const THEME_STORAGE_KEY = "course-atlas-theme";
export const DEFAULT_THEME = "neobrutalist" as const;

export type ThemeName = "neobrutalist" | "classic";

/**
 * Runs before the page paints, so a learner who has switched back to the
 * classic look never sees the default flash past first. The document already
 * carries the default attribute from the server, so this only has to clear it.
 */
export const THEME_BOOTSTRAP_SCRIPT = `try{
var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
if(t==="classic")document.documentElement.removeAttribute("data-theme");
else if(t)document.documentElement.setAttribute("data-theme",t);
}catch(e){}`;

/**
 * The root element's attribute is the single source of truth: the bootstrap
 * script sets it before React exists, and the stylesheet reads it. Subscribing
 * to it rather than mirroring it into state keeps every switch on the page
 * agreeing, and keeps the server's render honest about what it actually sent.
 */
function subscribeToTheme(onThemeChange: () => void) {
  const observer = new MutationObserver(onThemeChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function currentTheme(): ThemeName {
  return document.documentElement.getAttribute("data-theme") === "neobrutalist"
    ? "neobrutalist"
    : "classic";
}

function applyTheme(theme: ThemeName) {
  if (theme === "neobrutalist") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // A blocked or full storage quota only costs the choice its persistence.
  }
}

export function ThemeSwitch() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    currentTheme,
    () => DEFAULT_THEME,
  );
  const next: ThemeName = theme === "neobrutalist" ? "classic" : "neobrutalist";

  return (
    <button
      type="button"
      className="theme-switch"
      aria-pressed={theme === "neobrutalist"}
      aria-label={
        next === "neobrutalist"
          ? "Switch to the neobrutalist style"
          : "Switch to the classic style"
      }
      onClick={() => applyTheme(next)}
    >
      Style: {theme === "neobrutalist" ? "Brutal" : "Classic"}
    </button>
  );
}
