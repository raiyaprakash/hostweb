export default {
  async fetch(request) {
    const cache = caches.default; // Cloudflare Workers cache
    const cacheKey = new Request(request.url, request); // Create a cache key

    const url = new URL(request.url);
    const isClearCache = url.searchParams.get('clr') === 'cache'; // Check if cache needs to be cleared

    const base = "https://www.updatemarts.com"; // Blogger site URL
    const source = new URL(request.url);

    // If the request is for 'push-sw.js', fetch it directly from CDN.
    if (source.pathname === '/push-sw.js') {
      return fetch('https://cdn.autopush.in/scripts/sw.js');
    }

    // Clear the cache if '?clr=cache' is in the query.
    if (isClearCache) {
      await cache.delete(cacheKey);
      return new Response('Cache cleared.', { status: 200 });
    }

    // Try fetching from the cache first.
    let response = await cache.match(cacheKey);
    if (response) {
      console.log('Cache hit');
      return response; // Return cached response if available.
    }

    console.log('Cache miss, fetching new content');
    source.hostname = base.replace('https://', ''); // Update to Blogger's domain.

    // Fetch the original Blogger content.
    let originalResponse = await fetch(source.toString());

    // Clone and modify the response.
    let responseClone = originalResponse.clone();
    let content = await responseClone.text();
    let modifiedContent = content.replace(/www\.updatemarts\.com/g, 'notes.autopush.in');

    // Create a new Response with modified content.
    response = new Response(modifiedContent, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: originalResponse.headers, // Preserve headers.
    });

    // Store the modified response in cache for future requests.
    await cache.put(cacheKey, response.clone());

    return response;
  },
};
