/* eslint-disable no-undef */
// Service Worker para Firebase Cloud Messaging — Te Guio Admin
// Este archivo DEBE estar en la raiz del dominio (public/)

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBZVpXYfFs_KYwlm-P6wXWF69WNUJvxxGI',
  authDomain: 'te-guio-a7013.firebaseapp.com',
  projectId: 'te-guio-a7013',
  storageBucket: 'te-guio-a7013.firebasestorage.app',
  messagingSenderId: '549169415615',
  appId: '1:549169415615:android:cb6bdca868023998124d0a',
});

const messaging = firebase.messaging();

// Manejar notificaciones en BACKGROUND (cuando la pestana no esta enfocada)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Push recibido en background:', payload);

  const { title, body, image, icon } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || 'Te Guio', {
    body: body || '',
    icon: icon || '/logo.png',
    badge: '/logo.png',
    image: image || undefined,
    data: data,
    tag: data.event_type || 'teguio-notification',
    renotify: true,
  });
});

// Click en la notificacion — abrir la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/dashboard';

  if (data.event_type) {
    const type = data.event_type;
    if (type.startsWith('admin.pending.product')) url = '/product-requests';
    else if (type.startsWith('admin.pending.store')) url = '/store-requests';
    else if (type.startsWith('admin.pending.seller')) url = '/registration-requests';
    else if (type.startsWith('admin.pending.subscription')) url = '/subscriptions';
    else if (type.startsWith('ticket.')) url = '/complaints';
    else if (type.startsWith('subscription.')) url = '/subscriptions';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
