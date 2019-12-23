/**
 * Handle cache request
 * 
 * TODO : Add image cache (and assets!)
 * 
 * @param {*} request 
 */
async function handleRequest(request) {
    const cache = await caches.open("fonts");
    const cacheResponse = await cache.match(request);

    if (cacheResponse) { return cacheResponse; }
    const response = await fetch(request);
    if (
        response.status < 400 &&
        response.headers.has('content-type') &&
        response.headers.get('content-type').match(/(^application\/font|^font\/)/i)
    ) {
        cache.put(request, response.clone());
    }
    return response;
}

/**
 * Handle SW registration
 */
async function handleActivate(){
    await self.registration.unregister();
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        if (client.url && client.navigate)
            client.navigate(client.url);
    });
}

/**
 * Handle fetch
 * @param {Event} e 
 */
async function handleFetch(e){
    event.respondWith(handleRequest(e.request));
}

self.addEventListener('activate', handleActivate);
self.addEventListener('fetch', handleFetch);