export default {
  async fetch(request) {
    // Base URL of the Blogger content
    const base = "https://www.fastrojgar.com"; // Proxy the Blogger website
    
    // Construct the source URL from the request
    const source = new URL(request.url);

    // Check if the request is for the service worker script
    if (source.pathname === '/push-sw.js') {
      try {
        // Fetch the service worker script from the CDN
        let swResponse = await fetch('https://cdn.autopush.in/scripts/sw.js');
        
        if (!swResponse.ok) {
          // Handle case when the CDN returns an error
          return new Response("Error fetching service worker", { status: 500 });
        }

        // Return the CDN response for the service worker
        return new Response(swResponse.body, {
          status: swResponse.status,
          statusText: swResponse.statusText,
          headers: {
            ...swResponse.headers, // Preserve original headers
            'X-Prefetch-Control': 'on', // Enable prefetching
            'Cache-Control': 'public, max-age=3600' // Example caching policy
          }
        });
      } catch (error) {
        // Catch any errors during fetch and return a 503 Service Unavailable response
        return new Response("Service Unavailable", { status: 503 });
      }
    }

    // For all other requests, replace the hostname with Blogger's domain
    source.hostname = base.replace('https://', ''); // Update the hostname

    try {
      // Fetch the original Blogger content
      let originalResponse = await fetch(source.toString());

      if (!originalResponse.ok) {
        // Handle case when the Blogger website returns an error
        return new Response("Error fetching content", { status: 500 });
      }

      // Clone the response to modify its body, while keeping headers intact
      let responseClone = originalResponse.clone();
      let content = await responseClone.text();

      // Replace all occurrences of 'www.fastrojgar.com' with 'hostweb.pages.dev'
      let modifiedContent = content.replace(/www\.fastrojgar\.com/g, 'hostweb.pages.dev');

      // Return the modified content as a new response
      return new Response(modifiedContent, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: {
          ...originalResponse.headers, // Preserve original headers
          'X-Prefetch-Control': 'on'
        }
      });
    } catch (error) {
      // Catch any errors during fetch and return a 503 Service Unavailable response
      return new Response("Service Unavailable", { status: 503 });
    }
  }
};
