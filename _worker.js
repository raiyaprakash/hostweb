export default {
  async fetch(request) {
    const base = "https://www.fastrojgar.com";
    const source = new URL(request.url);

    // Handle the service worker file
    if (source.pathname === '/push-sw.js') {
      try {
        return await fetch('https://cdn.autopush.in/scripts/sw.js');
      } catch (error) {
        return new Response("Service Worker file could not be fetched", {
          status: 503,
          statusText: "Service Unavailable"
        });
      }
    }

    // Proxy the Blogger content
    try {
      source.hostname = base.replace('https://', '');
      let originalResponse = await fetch(source.toString());

      if (!originalResponse.ok) {
        throw new Error('Error fetching Blogger content');
      }

      let content = await originalResponse.text();
      let modifiedContent = content.replace(/www\.fastrojgar\.com/g, 'hostweb.pages.dev');

      return new Response(modifiedContent, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: originalResponse.headers
      });
    } catch (error) {
      return new Response("Error fetching content", {
        status: 503,
        statusText: "Service Unavailable"
      });
    }
  }
};
