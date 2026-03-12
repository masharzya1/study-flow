importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

if (typeof firebase !== "undefined") {
  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey: "AIzaSyA8ViNNFOspA5VYk3lKlMlthhH5XNnFQU8",
      authDomain: "penzo-32811.firebaseapp.com",
      projectId: "penzo-32811",
      storageBucket: "penzo-32811.firebasestorage.app",
      messagingSenderId: "886665295304",
      appId: "1:886665295304:web:2307da7c5732255215fcfd",
    });
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log("[FCM-SW] onBackgroundMessage:", JSON.stringify(payload));

    if (payload.notification) {
      console.log("[FCM-SW] notification payload present, browser will handle display");
      return;
    }

    var data = payload.data || {};
    var title = data.title || "Penzó";
    var body = data.body || "";

    return self.registration.showNotification(title, {
      body: body,
      icon: "/icon-512.png",
      badge: "/notification-badge.png",
      vibrate: [200, 100, 200],
      tag: "penzo-notif",
      renotify: true,
    });
  });
}

self.addEventListener("notificationclick", function(event) {
  console.log("[FCM-SW] notification clicked");
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow("/");
    })
  );
});
