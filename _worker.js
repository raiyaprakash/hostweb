export default {
  async fetch(request) {
    // Base URL of the Blogger content
    const base = "https://www.fastrojgar.com"; // Proxy the Blogger website

    // Construct the source URL from the request
    const source = new URL(request.url);

    // Check if the request is for push service worker file
    if (source.pathname === '/push-sw.js') {
      // Fetch the service worker file from the CDN
      return fetch('https://cdn.autopush.in/scripts/sw.js');
    }

    // Update the hostname to point to the Blogger domain
    source.hostname = base.replace('https://', '');

    // Check if the response is already cached
    let cacheKey = new Request(source.toString(), {
      method: request.method,
      headers: request.headers
    });

    // Try to get the response from the cache
    let cachedResponse = await caches.default.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse; // Return cached response if available
    }

    // Fetch the original Blogger content
    let originalResponse = await fetch(source.toString());

    // Check if the response is valid before proceeding
    if (!originalResponse.ok) {
      return originalResponse; // Return the original response if there's an error
    }

    // Clone the response to modify its body while keeping headers intact
    let responseClone = originalResponse.clone();
    let content = await responseClone.text();

    // Replace all occurrences of 'www.fastrojgar.com' with 'hostweb.pages.dev'
    let modifiedContent = content.replace(/www\.fastrojgar\.com/g, 'hostweb.pages.dev');

    // Create a new response with the modified content
    let newResponse = new Response(modifiedContent, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: originalResponse.headers // Preserve original headers
    });

    // Cache the new response for future requests
    event.waitUntil(caches.default.put(cacheKey, newResponse.clone()));

    // Return the modified content as a new response
    return newResponse;
  },
};
