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
      // Check KV for cached response
      const cachedResponse = await env.BLOG_CACHE.get(kvKey, { type: 'json' });
      if (cachedResponse) {
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          headers: cachedResponse.headers,
        });
      }
    }

    // Fetch the original content
    const originalResponse = await fetch(source.toString());
    const content = await originalResponse.text();

    // Modify the content
    const modifiedContent = content.replace(/fastrojgar2220\.blogspot\.com/g, 'notes.autopush.in');

    if (kvKey) {
      // Store in KV
      const kvPayload = {
        body: modifiedContent,
        status: originalResponse.status,
        headers: [...originalResponse.headers].reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {}),
      };

      // Save the response in KV with a 24-hour TTL
      await env.BLOG_CACHE.put(kvKey, JSON.stringify(kvPayload), {
        expirationTtl: 86400, // Cache for 24 hours
      });
    }

    // Return the modified content
    return new Response(modifiedContent, {
      status: originalResponse.status,
      headers: originalResponse.headers,
    });
  },
};
