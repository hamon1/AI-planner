const CACHE = "ai-planner-v1";
const PRECACHE = ["/", "/planner"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // API 호출: 캐시 없이 네트워크만
  if (url.pathname.startsWith("/api/")) return;

  // Next.js 정적 에셋: 캐시 우선
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(e.request).then(
        (cached) =>
          cached ||
          fetch(e.request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
            return res;
          })
      )
    );
    return;
  }

  // 페이지 탐색: 네트워크 우선, 오프라인 시 캐시 반환
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(
        () => caches.match(e.request) || caches.match("/planner")
      )
    );
  }
});
