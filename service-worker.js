importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js'
);

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

  workbox.precaching.precache([
    {
      url: '/index.html',
      revision: '12162018v3',
    }
  ]);

  workbox.precaching.addRoute();
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}