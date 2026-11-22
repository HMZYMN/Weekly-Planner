// Bump this number whenever you update index.html so phones refresh their saved copy.
const CACHE = "weekly-planner-v16";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Online: fetch the latest and save a copy. Offline: serve the saved copy.
self.addEventListener("fetch", e => {
  const req = e.request;
  const u = new URL(req.url);
  // Only cache this site and the font/library hosts. Never cache login or database requests.
  const ok = u.origin === location.origin || ["cdn.jsdelivr.net","fonts.googleapis.com","fonts.gstatic.com"].includes(u.hostname);
  if (req.method !== "GET" || !ok) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});

// Tapping a notification opens (or returns to) the planner.
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      return clients.openWindow("./");
    })
  );
});
