export default {
  async fetch(request) {
    const cache = caches.default; // Access Cloudflare's default cache
    const cacheKey = new Request(request.url, request); // Cache key based on the request

    const url = new URL(request.url);
    const isClearCache = url.searchParams.get('clr') === 'cache'; // Check for cache clearing

    const base = "https://www.updatemarts.com"; // Blogger site URL
    const source = new URL(request.url);

    // If the request is for the service worker file, fetch it from the CDN.
    if (source.pathname === '/push-sw.js') {
      return fetch('https://cdn.autopush.in/scripts/sw.js');
    }

    // Clear the cache if '?clr=cache' is present.
    if (isClearCache) {
      await cache.delete(cacheKey);
      return new Response('Cache cleared.', { status: 200 });
    }

    // Check if the response is already in the cache.
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      console.log('Cache hit');
      return cachedResponse; // Return cached response.
    }

    console.log('Cache miss, fetching new content');
    source.hostname = base.replace('https://', ''); // Set the hostname to Blogger's.

    // Fetch the original content from Blogger.
    const fetchOptions = { cf: { cacheEverything: true, cacheTtl: 3600 } };
    let originalResponse = await fetch(source.toString(), fetchOptions);

    // Only cache responses with status 200.
    if (originalResponse.status !== 200) {
      return originalResponse;
    }

    // Modify the content without altering headers.
    let content = await originalResponse.text();
    let modifiedContent = content.replace(/www\.updatemarts\.com/g, 'notes.autopush.in');

    // Create a new response with the same headers and modified content.
    let response = new Response(modifiedContent, originalResponse);

    // Cache the response for future requests.
    await cache.put(cacheKey, response.clone());

    return response;
  },
};
