// TrainFlow Pro — service worker
// Strategy:
//   • App shell (HTML/CSS/JS/icons/manifest)  → cache-first, refreshed in background
//   • Same-origin assets                       → stale-while-revalidate
//   • Supabase API calls                       → network-first, fall back to cache
//   • Supabase Storage / public CDNs           → stale-while-revalidate
//
// Bump CACHE_VERSION to invalidate caches across all clients.

const CACHE_VERSION = "trainflow-v1";
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE     = `${CACHE_VERSION}-api`;

// App-shell URLs that must be available offline. The Vite-built JS/CSS
// have hashed filenames, so we precache the entrypoints; runtime cache
// catches the chunks on first visit.
const SHELL_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-72.png",
  "/icons/icon-96.png",
  "/icons/icon-128.png",
  "/icons/icon-144.png",
  "/icons/icon-152.png",
  "/icons/icon-192.png",
  "/icons/icon-384.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // addAll fails if any URL fails — be lenient by adding individually
      Promise.all(
        SHELL_URLS.map((u) => cache.add(u).catch((err) =>
          console.warn("[sw] precache miss:", u, err.message)
        ))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // Wipe any old version caches
      await Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ── Helpers ──────────────────────────────────────────────────────────────
function isSupabaseAPI(url) {
  return /\.supabase\.co\/(rest|auth|realtime)\//.test(url.href);
}
function isSupabaseStorage(url) {
  return /\.supabase\.co\/storage\//.test(url.href);
}
function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok && request.method === "GET") {
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw _;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
  return fresh;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => cached); // offline fallback
  return cached || fetchPromise;
}

// ── Fetch handler ────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only handle GET — skip POST/PUT/DELETE etc
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Don't cache websocket / EventSource / opaque cross-origin POSTs
  if (req.headers.get("upgrade") === "websocket") return;

  // 1. Supabase REST / auth → network-first, fall back to API cache
  if (isSupabaseAPI(url)) {
    event.respondWith(networkFirst(req, API_CACHE));
    return;
  }

  // 2. Supabase Storage (CV / FAQ PDFs / icons) → stale-while-revalidate
  if (isSupabaseStorage(url)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }

  // 3. Same-origin navigation requests → app shell fallback
  if (isSameOrigin(url) && req.mode === "navigate") {
    event.respondWith(
      networkFirst(req, SHELL_CACHE).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match("/index.html")) || (await cache.match("/"));
      })
    );
    return;
  }

  // 4. Same-origin assets (Vite chunks, icons, manifest) → cache-first
  if (isSameOrigin(url)) {
    event.respondWith(cacheFirst(req, RUNTIME_CACHE).catch(() => fetch(req)));
    return;
  }

  // 5. Cross-origin (fonts.googleapis.com etc) → stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
});

// Allow the page to trigger an immediate update
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
