export default {
  async fetch(request) {
    // Base URL of the Blogger content
    const base = "https://www.fastrojgar.com"; // Proxy the Blogger website

    // Construct the source URL from the request
    const source = new URL(request.url);

    // Check if the request is for the service worker script
    if (source.pathname === '/push-sw.js') {
      // Fetch the service worker file from the CDN
      return fetch('https://cdn.autopush.in/scripts/sw.js', {
        cf: { cacheTtl: 0, cacheEverything: false }, // No cache
      });
    }

    // For all other requests, replace the hostname with Blogger's domain
    source.hostname = base.replace('https://', ''); // Update the hostname

    // Fetch the original Blogger content without cache
    let originalResponse = await fetch(source.toString(), {
      cf: { cacheTtl: 0, cacheEverything: false }, // Prevent caching by Cloudflare
      headers: {
        'Cache-Control': 'no-store', // No cache for browsers
      },
    });

    // Clone the response to modify its body
    let responseClone = originalResponse.clone();
    let content = await responseClone.text();

    // Replace all occurrences of 'www.fastrojgar.com' with 'ipl.fast-rojgar.workers.dev'
    let modifiedContent = content.replace(/www\.fastrojgar\.com/g, 'hostweb.pages.dev');

    // Return the modified content with cache disabled
    return new Response(modifiedContent, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: {
        ...originalResponse.headers,
        'Cache-Control': 'no-store', // Disable cache in the response
      }
    });
  },
};
