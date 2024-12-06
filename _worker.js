export default {
  async fetch(request, env) {
    // Base URL of the Blogger content
    const base = "https://fastrojgar2220.blogspot.com";

    // Construct the source URL from the request
    const source = new URL(request.url);

    // Check if the request is for push-sw.js
    if (source.pathname === '/push-sw.js') {
      // Fetch the main.js file from the CDN
      return fetch('https://cdn.autopush.in/scripts/sw.js');
    }

    // Replace the hostname with Blogger's domain
    source.hostname = base.replace('https://', '');

    // List of patterns for specific pages to cache
    const cachePatterns = [
      '/',             // Cache homepage
      /\.html$/,       // Cache .html pages
      '/feed',         // Cache feed URLs
      '/label',        // Cache label URLs
      '/sitemap',      // Cache sitemap URLs
      /\.txt$/         // Cache .txt files
    ];

    // Check if the current URL matches any of the cache patterns
    const shouldCache = cachePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return source.pathname === pattern;
      } else if (pattern instanceof RegExp) {
        return pattern.test(source.pathname);
      }
      return false;
    });

    if (shouldCache) {
      // KV Namespace for caching
      const kvKey = source.toString(); // Use the full URL as a key

      // Check KV for cached response
      let cachedResponse = await env.BLOG_CACHE.get(kvKey, { type: 'json' });

      if (cachedResponse) {
        // Reconstruct the cached response
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          headers: cachedResponse.headers,
        });
      }

      // If not cached, fetch the original content
      let originalResponse = await fetch(source.toString());

      // Clone the response to modify it and store it in KV
      let content = await originalResponse.text();
      let modifiedContent = content.replace(/fastrojgar2220\.blogspot\.com/g, 'notes.autopush.in');

      // Save the modified response in KV with headers
      const kvPayload = {
        body: modifiedContent,
        status: originalResponse.status,
        headers: [...originalResponse.headers].reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {}),
      };

      await env.BLOG_CACHE.put(kvKey, JSON.stringify(kvPayload), {
        expirationTtl: 86400, // Cache for 24 hours
      });

      // Return the modified response
      return new Response(modifiedContent, {
        status: originalResponse.status,
        headers: originalResponse.headers,
      });
    } else {
      // If the URL doesn't match, just fetch and return it without caching
      return fetch(source.toString());
    }
  },
};
