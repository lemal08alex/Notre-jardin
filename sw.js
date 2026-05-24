const CACHE = "jardin-v19";
const FILES = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting(); // prend le contrôle immédiatement
});

// Reçoit le signal de la page pour sauter l'attente
self.addEventListener("message", e => {
  if(e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match("/index.html")))
  );
});

// Handle notification action clicks (approve/reject)
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const action = e.action;
  e.waitUntil(
    clients.matchAll({type: "window"}).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.focus();
          client.postMessage({type: "notifAction", action});
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/").then(client => {
          if(client) client.postMessage({type: "notifAction", action});
        });
      }
    })
  );
});

// Push notifications
self.addEventListener("push", e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || "Notre Jardin", {
      body: data.body || "Une notification de Notre Jardin",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "jardin",
    })
  );
});
