"use client";

import { useEffect } from "react";

/**
 * Registers the offline worker. Studying happens on trains and in libraries,
 * so a page already opened should still open without a connection.
 *
 * Registration is deliberately silent: if the browser has no service worker
 * support, or the page is not on a secure origin, the site simply behaves as
 * it always has.
 *
 * It does not register during development, and actively removes a worker it
 * finds there. A worker caching in front of a dev server pins module URLs that
 * the dev server rewrites on every restart, which surfaces as one React
 * instance answering for another and a null hook dispatcher. The dev server
 * does not serve /sw.js either, so a worker installed once can never update
 * itself out of that state; unregistering here is the only path back.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then(async (registrations) => {
          if (registrations.length === 0) return;
          await Promise.all(
            registrations.map((registration) => registration.unregister()),
          );
          if (!("caches" in window)) return;
          const names = await caches.keys();
          await Promise.all(
            names
              .filter((name) => name.startsWith("course-atlas-"))
              .map((name) => caches.delete(name)),
          );
          // The page is already running on whatever the worker served, so the
          // stale modules only clear on the next load.
          window.location.reload();
        })
        .catch(() => {
          // Nothing here is required for the site to work.
        });
      return;
    }

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
