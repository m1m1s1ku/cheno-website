async function handleRequest(request) {
    const cache = await caches.open("fonts");
    const cacheResponse = await cache.match(request);

    if (cacheResponse) { return cacheResponse; }
    const response = await fetch(request);
    if (
        response.status < 400 &&
        response.headers.has("content-type") &&
        response.headers.get("content-type").match(/(^application\/font|^font\/)/i)
    ) {
        cache.put(request, response.clone());
    }
    return response;
}

self.addEventListener('fetch', event => {
    // TODO : Handle image cache
    event.respondWith(handleRequest(event.request));
});