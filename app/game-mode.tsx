"use client";

import { useSyncExternalStore } from "react";

/**
 * The game is a layer a learner switches on, not a change to the catalog.
 * Off, Course Atlas is the map it always was: what to learn, where, and in
 * what order. On, the same courses gain self-marked checks, levels, experience
 * and a streak. Like the visual style, the choice lives only in this browser:
 * it is never sent to the server, and turning the game off deletes nothing —
 * practice already recorded simply waits until it is switched on again.
 */
export const GAME_STORAGE_KEY = "course-atlas-game";

export type GameMode = "on" | "off";

/**
 * Runs before the page paints, so server-rendered practice is never seen by a
 * learner who has the game off, and never arrives late for one who has it on.
 */
export const GAME_BOOTSTRAP_SCRIPT = `try{
if(localStorage.getItem(${JSON.stringify(GAME_STORAGE_KEY)})==="on")document.documentElement.setAttribute("data-game","on");
}catch(e){}`;

/** The root attribute is the single source of truth, as with the theme. */
function subscribeToGameMode(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-game"],
  });
  return () => observer.disconnect();
}

function currentGameMode(): GameMode {
  return document.documentElement.getAttribute("data-game") === "on"
    ? "on"
    : "off";
}

export function setGameMode(mode: GameMode) {
  if (mode === "on") document.documentElement.setAttribute("data-game", "on");
  else document.documentElement.removeAttribute("data-game");
  try {
    localStorage.setItem(GAME_STORAGE_KEY, mode);
  } catch {
    // A blocked or full storage quota only costs the choice its persistence.
  }
}

export function useGameMode(): GameMode {
  return useSyncExternalStore(
    subscribeToGameMode,
    currentGameMode,
    () => "off",
  );
}

/** A quiet footer control, beside the style switch. */
export function GameSwitch() {
  const mode = useGameMode();
  return (
    <button
      type="button"
      className="theme-switch game-switch"
      aria-pressed={mode === "on"}
      aria-label={mode === "on" ? "Turn the game off" : "Turn the game on"}
      onClick={() => setGameMode(mode === "on" ? "off" : "on")}
    >
      Game: {mode === "on" ? "On" : "Off"}
    </button>
  );
}
