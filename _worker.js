export default {
  async fetch(request) {
    // Base URL of the Blogger content
    const base = "https://www.fastrojgar.com"; // Proxy the Blogger website
    
    // Construct the source URL from the request
    const source = new URL(request.url);

    // Check if the request is for push-sw.js
    if (source.pathname === '/push-sw.js') {
      // Fetch the push-sw.js file from the CDN
      return fetch('https://cdn.autopush.in/scripts/sw.js');
    }

    // For all other requests, replace the hostname with Blogger's domain
    source.hostname = base.replace('https://', ''); // Update the hostname

    // Fetch the original Blogger content
    let originalResponse = await fetch(source.toString());

    // Read the original response body as text
    let content = await originalResponse.text();

    // Replace all occurrences of 'www.fastrojgar.com' with 'hostweb.pages.dev'
    let modifiedContent = content.replace(/www\.fastrojgar\.com/g, 'hostweb.pages.dev');

    // Return the modified content as a new response
    return new Response(modifiedContent, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: originalResponse.headers // Preserve original headers
    });
  },
};
