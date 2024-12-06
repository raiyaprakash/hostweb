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
      '/',              // Cache homepage
      /\.html$/,        // Cache .html pages
      /feed/,           // Match any URL containing "feed"
      /label/,          // Match any URL containing "label"
      /sitemap/,        // Match any URL containing "sitemap"
      /\.txt$/          // Cache .txt files
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
        // Reconstruct the cached response with the Content-Type header
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          headers: {
            'Content-Type': cachedResponse.headers['Content-Type'], // Only save the Content-Type
          },
        });
      }

      // If not cached, fetch the original content
      let originalResponse = await fetch(source.toString());

      // Check if the response status is 200 OK
      if (originalResponse.status === 200) {
        // Clone the response to modify it and store it in KV
        let content = await originalResponse.text();
        let modifiedContent = content.replace(/fastrojgar2220\.blogspot\.com/g, 'notes.autopush.in');

        // Save the modified response in KV with only the Content-Type header
        const kvPayload = {
          body: modifiedContent,
          status: originalResponse.status,
          headers: {
            'Content-Type': originalResponse.headers.get('Content-Type') || 'text/html', // Default to 'text/html' if missing
          },
        };

        // Store the cached content in KV without expiration time
        await env.BLOG_CACHE.put(kvKey, JSON.stringify(kvPayload));

        // Return the modified response
        return new Response(modifiedContent, {
          status: originalResponse.status,
          headers: kvPayload.headers, // Return only the modified headers
        });
      } else {
        // If the response is not 200 OK, return it as-is without caching
        return originalResponse;
      }
    } else {
      // If the URL doesn't match, just fetch and return it without caching
      return fetch(source.toString());
    }
  },
};
