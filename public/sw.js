/**
 * Offline support for Course Atlas.
 *
 * Studying happens on trains and in libraries, so a page you have already
 * opened must still open without a connection. Two caches: hashed build assets
 * are immutable and served cache-first; pages are served network-first so you
 * normally get fresh curriculum, falling back to the last copy seen.
 *
 * Learner progress is deliberately never cached. It lives in localStorage and
 * its API is per-learner, so a stale cached response could show one person's
 * record to another or resurrect work they had undone.
 *
 * Two details this depends on. Framework responses carry a long Vary header
 * (RSC, Next-Router-State-Tree and friends), so every lookup must ignore Vary
 * or an offline navigation will never match the page it just cached. And a
 * rendered course page is close to two megabytes, so the page cache is capped
 * rather than allowed to grow until the browser evicts the lot.
 */
const MAX_CACHED_PAGES = 60;
const VERSION = "v2";
const ASSET_CACHE = `course-atlas-assets-${VERSION}`;
const PAGE_CACHE = `course-atlas-pages-${VERSION}`;
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("course-atlas-") && !key.endsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

/** Keeps the newest pages and drops the oldest, so storage stays bounded. */
async function trimPageCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_CACHED_PAGES) return;
  const excess = keys.length - MAX_CACHED_PAGES;
  for (let index = 0; index < excess; index += 1) {
    if (new URL(keys[index].url).pathname !== OFFLINE_URL) {
      await cache.delete(keys[index]);
    }
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await trimPageCache(cache);
    }
    return response;
  } catch (error) {
    const hit = await cache.match(request, { ignoreVary: true });
    if (hit) return hit;
    const shell = await cache.match(OFFLINE_URL, { ignoreVary: true });
    if (shell) return shell;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Progress is per-learner and must never be served from a shared cache.
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  event.respondWith(cacheFirst(request, ASSET_CACHE));
});
