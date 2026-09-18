const CACHE = "propertycheck-v11";
const PRECACHE = ["/", "/offline.html", "/icon.svg", "/manifest.webmanifest", "/check", "/token", "/dealer"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function fromNetwork(req, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(req, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const isPage = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  event.respondWith(
    (async () => {
      if (isPage) {
        try {
          const fresh = await fromNetwork(req, 2500);
          const copy = fresh.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return fresh;
        } catch {
          const hit = await caches.match(req);
          return hit || (await caches.match("/offline.html")) || (await caches.match("/"));
        }
      }

      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh.ok) {
          const copy = fresh.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return fresh;
      } catch {
        return (await caches.match("/offline.html")) || Response.error();
      }
    })(),
  );
});
