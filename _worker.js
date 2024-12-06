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

    // Fetch `push-sw.js` directly from the CDN
    if (source.pathname === "/push-sw.js") {
      return fetch("https://cdn.autopush.in/scripts/sw.js");
    }

    // Replace hostname for Blogger
    source.hostname = base.replace("https://", "");

    // SQL Key for caching
    const sqlKey = matchedPattern ? `${matchedPattern}:${source.toString()}` : null;

    if (sqlKey) {
      // Check SQL database for cached response
      const query = `SELECT body, status, headers, expiration FROM blog_cache WHERE key = ?`;
      const result = await env.D1.prepare(query).bind(sqlKey).first();

      // If a cached response exists and is valid, return it
      if (result && Date.now() < result.expiration) {
        return new Response(result.body, {
          status: result.status,
          headers: JSON.parse(result.headers),
        });
      }
    }

    // Fetch the original content
    const originalResponse = await fetch(source.toString());
    const content = await originalResponse.text();

    // Modify the content
    const modifiedContent = content.replace(/fastrojgar2220\.blogspot\.com/g, "notes.autopush.in");

    if (sqlKey) {
      // Prepare data for caching
      const headers = {};
      originalResponse.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const expiration = Date.now() + 86400 * 1000; // Cache for 24 hours

      // Insert or update cache in SQL database
      const upsertQuery = `
        INSERT INTO blog_cache (key, body, status, headers, expiration)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          body = excluded.body,
          status = excluded.status,
          headers = excluded.headers,
          expiration = excluded.expiration
      `;

      await env.D1.prepare(upsertQuery)
        .bind(sqlKey, modifiedContent, originalResponse.status, JSON.stringify(headers), expiration)
        .run();
    }

    // Return the modified content
    return new Response(modifiedContent, {
      status: originalResponse.status,
      headers: originalResponse.headers,
    });
  },
};
