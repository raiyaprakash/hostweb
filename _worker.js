export default {
  async fetch(request, env) {
    const base = "https://fastrojgar2220.blogspot.com"; // Blogger base URL
    const source = new URL(request.url);

    // Define patterns for specific pages
    const patterns = {
      home: (url) => url.pathname === "/",
      post: (url) => url.pathname.includes(".html"),
      feed: (url) => url.pathname.includes("feed"),
      label: (url) => url.pathname.includes("label"),
      sitemap: (url) => url.pathname.includes("sitemap"),
      robots: (url) => url.pathname === "/robots.txt",
    };

    // Check if the request matches any of the patterns
    const matchedPattern = Object.keys(patterns).find((key) => patterns[key](source));

    // Fetch push-sw.js directly from the CDN
    if (source.pathname === '/push-sw.js') {
      return fetch('https://cdn.autopush.in/scripts/sw.js');
    }

    // Replace hostname for Blogger
    source.hostname = base.replace('https://', '');

    // KV Key for caching
    const kvKey = matchedPattern ? `${matchedPattern}:${source.toString()}` : null;

    if (kvKey) {
      // Check KV for cached content
      const cachedContent = await env.BLOG_CACHE.get(kvKey);
      if (cachedContent) {
        // Serve cached content with default headers
        return new Response(cachedContent, { headers: { 'Content-Type': 'text/html' } });
      }
    }

    // Fetch the original content
    const originalResponse = await fetch(source.toString());
    const contentType = originalResponse.headers.get('Content-Type');

    // Clone the response body for modification
    const content = await originalResponse.text();

    // Modify the content
    const modifiedContent = content.replace(/fastrojgar2220\.blogspot\.com/g, 'notes.autopush.in');

    if (kvKey && contentType.includes("text/html")) {
      // Save only the modified content in KV
      await env.BLOG_CACHE.put(kvKey, modifiedContent, {
        expirationTtl: 86400, // Cache for 24 hours
      });
    }

    // Serve the modified content with original headers
    return new Response(modifiedContent, {
      status: originalResponse.status,
      headers: {
        'Content-Type': contentType, // Serve content type from the original response
      },
    });
  },
};
