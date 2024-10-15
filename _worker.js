export default {
  async fetch(request) {
    const cache = caches.default; // Cloudflare cache
    const cacheKey = new Request(request.url, request); // Create a cache key

    const url = new URL(request.url);
    const isClearCache = url.searchParams.get('clr') === 'cache'; // Clear cache condition

    const base = "https://www.updatemarts.com"; // Blogger site URL
    const source = new URL(request.url);

    // Handle service worker request separately.
    if (source.pathname === '/push-sw.js') {
      return fetch('https://cdn.autopush.in/scripts/sw.js');
    }

    // Clear the cache if the request contains ?clr=cache.
    if (isClearCache) {
      await cache.delete(cacheKey);
      return new Response('Cache cleared.', { status: 200 });
    }

    // Check if the response is already cached.
    let response = await cache.match(cacheKey);
    if (response) {
      console.log('Cache hit');
      return response; // Return cached response.
    }

    console.log('Cache miss, fetching new content');
    source.hostname = base.replace('https://', ''); // Adjust hostname for Blogger.

    // Fetch Blogger content with proper cache headers.
    let originalResponse = await fetch(source.toString(), {
      cf: { cacheEverything: true, cacheTtl: 3600 }, // Cache for 1 hour
    });

    // Check if the response is valid for caching (200 OK).
    if (originalResponse.status !== 200) {
      return originalResponse; // Don't cache non-200 responses.
    }

    // Clone and modify the original response.
    let responseClone = originalResponse.clone();
    let content = await responseClone.text();
    let modifiedContent = content.replace(/www\.updatemarts\.com/g, 'notes.autopush.in');

    // Create a new response with modified content.
    response = new Response(modifiedContent, {
      status: originalResponse.status,
      headers: {
        ...originalResponse.headers,
        'Cache-Control': 'public, max-age=3600', // Ensure content is cacheable.
        'Vary': 'Accept-Encoding', // Handle compressed responses correctly.
      },
    });

    // Store the new response in cache.
    await cache.put(cacheKey, response.clone());

    return response;
  },
};
