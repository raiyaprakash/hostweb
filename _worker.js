export default {
  async fetch(request) {
    // Base URL of the Blogger content
    const base = "https://www.fastrojgar.com"; // Proxy the Blogger website
    
    // Construct the source URL from the request
    const source = new URL(request.url);

    // Check if the request is for push-sw.js
    if (source.pathname === '/push-sw.js') {
      // Fetch the main.js file from the CDN
      return fetch('https://cdn.autopush.in/scripts/sw.js');
    }

    // For all other requests, replace the hostname with Blogger's domain
    source.hostname = base.replace('https://', ''); // Update the hostname

    // Fetch the original Blogger content
    let originalResponse = await fetch(source.toString());

    // Get the content from the original response
    let content = await originalResponse.text();

    // Remove all occurrences of 'www.fastrojgar.com' from the content
    let modifiedContent = content.replace(/www\.fastrojgar\.com/g, '');

    // Create a new response without the Speculation-Rules header
    let responseHeaders = new Headers(originalResponse.headers);
    responseHeaders.delete('Speculation-Rules'); // Remove Speculation-Rules header

    // Return the modified content as a new response
    return new Response(modifiedContent, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: responseHeaders // Use modified headers
    });
  },
};
