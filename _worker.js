export default {
  async fetch(request) {
    const cache = caches.default; // Access Cloudflare's cache
    const cacheKey = new Request(request.url, request); // Create cache key based on request

    const url = new URL(request.url);
    const isClearCache = url.searchParams.get('clr') === 'cache'; // Check for ?clr=cache

    const base = "https://www.updatemarts.com"; // Blogger URL
    const source = new URL(request.url);

    // Handle service worker file requests.
    if (source.pathname === '/push-sw.js') {
      return fetch('https://cdn.autopush.in/scripts/sw.js');
    }

    // Clear cache if ?clr=cache is present.
    if (isClearCache) {
      await cache.delete(cacheKey);
      return new Response('Cache cleared.', { status: 200 });
    }

    // Check for cached response.
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      console.log('Cache hit');
      return cachedResponse; // Return cached response.
    }

    console.log('Cache miss, fetching content from origin');
    source.hostname = base.replace('https://', ''); // Update to Blogger hostname

    // Fetch from the origin with cache options.
    const fetchOptions = { cf: { cacheEverything: true, cacheTtl: 3600 } };
    let originalResponse = await fetch(source.toString(), fetchOptions);

    // Only cache if response status is 200.
    if (originalResponse.status !== 200) {
      return originalResponse; // Return as-is without caching.
    }

    // Clone the original response and modify its content.
    let originalText = await originalResponse.text();
    let modifiedContent = originalText.replace(/www\.updatemarts\.com/g, 'notes.autopush.in');

    // Create a new response with the exact same headers.
    let response = new Response(modifiedContent, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: originalResponse.headers, // Clone original headers exactly.
    });

    // Store the new response in cache.
    await cache.put(cacheKey, response.clone());

    return response; // Return the new cached response.
  },
};
