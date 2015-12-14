define({
  "name": "BIIGLE DIAS REST API Documentation",
  "version": "0.1.0",
  "description": "",
  "title": "BIIGLE DIAS REST API Documentation",
  "url": "api/v1/",
  "template": {
    "withCompare": false
  },
  "header": {
    "title": "General",
    "content": "<h2>General information</h2>\n<p>There are two methods available for authentication, the session cookie and the API key. The session cookie authentication is for AJAX communication or form requests inside of the application itself, e.g. when the user is logged in and a list of their projects should be asynchronously fetched by JavaScript.</p>\n<p>The API key is for external access. Each user is allowed to generate one API key in their user profile. For each HTTPS request, the API key has to be placed in the <code>X-Auth-Token</code> header like this:</p>\n<pre><code>X-Auth-Token: your_api_key\n</code></pre>\n<p>Most API endpoints require authentication either via session cookie or API key. Some endpoints are restricted to authentication with a session cookie (e.g. manupulation of user credentials).</p>\n<p>Any request other than <code>GET</code> <strong>not</strong> using the API key authentication requires a valid XSRF token in the <code>_token</code> parameter (form requests) or the encrypted token in the <code>X-XSRF-TOKEN</code> header (XMLHttpRequests, usually the browser takes care of setting this header).</p>\n"
  },
  "sampleUrl": false,
  "apidoc": "0.2.0",
  "generator": {
    "name": "apidoc",
    "time": "2015-12-14T13:52:17.443Z",
    "url": "http://apidocjs.com",
    "version": "0.13.1"
  }
});