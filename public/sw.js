import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));

self.addEventListener("push", (event) => {
  const payload = (() => {
    if (!event.data) return {};
    try { return event.data.json(); } catch { return {}; }
  })();

  const title = payload.title || "New announcement";
  const body = payload.body || "Open GamePlan to view the latest update.";
  const url = payload.url || "/";
  const tag = payload.tag || "announcement";

  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag,
    data: { url },
    badge: "/icons/icon-192x192.png",
    icon: "/icons/icon-192x192.png",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existingClient = windowClients.find((client) => "focus" in client);

    if (existingClient) {
      await existingClient.focus();
      if ("navigate" in existingClient) await existingClient.navigate(targetUrl);
      return;
    }

    if (self.clients.openWindow) await self.clients.openWindow(targetUrl);
  })());
});
