"use client";

import { useEffect } from "react";

/**
 * Registers the offline worker. Studying happens on trains and in libraries,
 * so a page already opened should still open without a connection.
 *
 * Registration is deliberately silent: if the browser has no service worker
 * support, or the page is not on a secure origin, the site simply behaves as
 * it always has.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is an enhancement; failing to install it must never
        // break the page.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
