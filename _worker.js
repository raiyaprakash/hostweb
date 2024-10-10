export default {
  async fetch(request) {
    // Base URL of the Blogger content
    const base = "https://onlinenoteshare.blogspot.com"; // Proxy the Blogger website
    
    // Construct the source URL from the request
    const source = new URL(request.url);

    // Check if the request is for main.js
    if (source.pathname === '/push-sw.js') {
      // Fetch the main.js file from the CDN
      return fetch('https://cdn.autopush.in/scripts/sw.js');
    }

    // For all other requests, replace the hostname with Blogger's domain
    source.hostname = base.replace('https://', ''); // Update the hostname

    // Fetch the original Blogger content
    let originalResponse = await fetch(source.toString());

    // Clone the response to modify its body, while keeping headers intact
    let responseClone = originalResponse.clone();
    let content = await responseClone.text();

    let modifiedContent = content.replace(/onlinenoteshare\.blogspot\.com/g, 'notes.autopush.in');

    // Return the modified content as a new response
    return new Response(modifiedContent, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: originalResponse.headers // Preserve original headers
    });
  },
};
