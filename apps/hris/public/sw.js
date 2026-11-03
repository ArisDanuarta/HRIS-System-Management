// PSPK HRIS Progressive Web App Service Worker
const CACHE_NAME = "pspk-hris-cache-v1";

const PRECACHE_ASSETS = [
  "/offline",
  "/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/images/logo_pspk_horizontal.png",
  "/images/logo_pspk_vertikal.jpg",
];

// 1. Install Event: Pra-simpan aset statis kritis dan halaman offline
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[PSPK SW] Gagal memuat pra-cache aset:", err);
      }),
  );
});

// 2. Activate Event: Bersihkan cache versi lama saat service worker baru aktif
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// 3. Fetch Event: Strategi Network-First untuk Navigasi, Cache-First untuk Aset Statis
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Jangan tangani permintaan non-GET, panggilan API, dan Server Actions
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    request.headers.get("x-action") ||
    request.headers.get("next-action")
  ) {
    return;
  }

  // A. Permintaan Navigasi Rute (Halaman HTML) -> Network-First dengan Fallback ke /offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedOffline = await caches.match("/offline");
        if (cachedOffline) {
          return cachedOffline;
        }
        return new Response(
          "<!DOCTYPE html><html lang='id'><head><meta charset='utf-8'><title>Offline - HRIS PSPK</title></head><body style='font-family:sans-serif;text-align:center;padding:40px;'><h2>Koneksi Terputus</h2><p>HRIS PSPK membutuhkan koneksi internet. Buka kembali saat online.</p></body></html>",
          {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          },
        );
      }),
    );
    return;
  }

  // B. Aset Statis (CSS, JS Chunks, Gambar, Ikon, Web Fonts) -> Cache-First
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      }),
    );
    return;
  }

  // C. Permintaan Lainnya -> Network dengan Fallback Cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request)),
  );
});
