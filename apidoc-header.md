## General information

There are two methods available for authentication, the session cookie and the API key. The session cookie authentication is for AJAX communication or form requests inside of the application itself, e.g. when the user is logged in and a list of their projects should be asynchronously fetched by JavaScript.

The API key is for external access. Each user is allowed to generate one API key in their user profile. For each HTTPS request, the API key has to be placed in the `X-Auth-Token` header like this:

```
X-Auth-Token: your_api_key
```

Most API endpoints require authentication either via session cookie or API key. Some endpoints are restricted to authentication with a session cookie (e.g. manupulation of user credentials).

Any request other than `GET` **not** using the API key authentication requires a valid XSRF token in the `_token` parameter (form requests) or the encrypted token in the `X-XSRF-TOKEN` header (XMLHttpRequests, usually the browser takes care of setting this header).