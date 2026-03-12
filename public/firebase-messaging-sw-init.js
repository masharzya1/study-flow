importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA8ViNNFOspA5VYk3lKlMlthhH5XNnFQU8",
  authDomain: "penzo-32811.firebaseapp.com",
  projectId: "penzo-32811",
  storageBucket: "penzo-32811.firebasestorage.app",
  messagingSenderId: "886665295304",
  appId: "1:886665295304:web:2307da7c5732255215fcfd",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (title) {
    self.registration.showNotification(title, {
      body: body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [200, 100, 200],
      data: payload.data,
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
