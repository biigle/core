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
    "content": "<h2>General information</h2>\n<p>There are two methods available for authentication, the session cookie and the API token. The session cookie authentication is for AJAX communication or form requests inside of the application itself, e.g. when the user is logged in and a list of their projects should be asynchronously fetched by JavaScript.</p>\n<p>The API token is for external access. Each user is allowed to generate multiple API tokens in their user profile. Each token should be specific for one external application. With the API token, authentication is done using <a href=\"https://en.wikipedia.org/wiki/Basic_access_authentication#Client_side\">HTTP Basic Auth</a> where the token serves as password.</p>\n<p>Basically you have to set an HTTP header like this:</p>\n<pre><code>Authorization: Basic am9lQHVzZXIuY29tOndaSXJuYzJXRU5uSlNkT25EUnM0bkcxNGN0OTg2RzdI\n</code></pre>\n<p>Where the stuff after <code>Basic</code> is the base 64 encoded string <code>username:token</code>.</p>\n<p>Most HTTP libraries should support Basic Auth out of the box. A cURL request might look like this:</p>\n<pre><code>curl -u joe@user.com:wZIrnc2WENnJSdOnDRs4nG14ct986G7H biigle-dias.org/api/v1/api-tokens\n</code></pre>\n<p>Most API endpoints require authentication either via session cookie or API token. Some endpoints are restricted to authentication with a session cookie (e.g. manupulation of user credentials).</p>\n<p>Any request other than <code>GET</code> <strong>not</strong> using the API token authentication requires a valid XSRF token in the <code>_token</code> parameter (form requests) or the encrypted token in the <code>X-XSRF-TOKEN</code> header (XMLHttpRequests, usually the browser takes care of setting this header).</p>\n"
  },
  "sampleUrl": false,
  "apidoc": "0.2.0",
  "generator": {
    "name": "apidoc",
    "time": "2016-05-06T08:19:27.823Z",
    "url": "http://apidocjs.com",
    "version": "0.13.2"
  }
});
