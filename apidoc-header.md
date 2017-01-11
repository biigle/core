## General information

There are two methods available for authentication, the session cookie and the API token. The session cookie authentication is for AJAX communication or form requests inside of the application itself, e.g. when the user is logged in and a list of their projects should be asynchronously fetched by JavaScript.

The API token is for external access. Each user is allowed to generate multiple API tokens in their user profile. Each token should be specific for one external application. With the API token, authentication is done using [HTTP Basic Auth](https://en.wikipedia.org/wiki/Basic_access_authentication#Client_side) where the token serves as password.

Basically you have to set an HTTP header like this:

```
Authorization: Basic am9lQHVzZXIuY29tOndaSXJuYzJXRU5uSlNkT25EUnM0bkcxNGN0OTg2RzdI
```

Where the stuff after `Basic` is the base 64 encoded string `username:token`.


Most HTTP libraries should support Basic Auth out of the box. A cURL request might look like this:

```
curl -u joe@user.com:wZIrnc2WENnJSdOnDRs4nG14ct986G7H biigle.de/api/v1/api-tokens
```

Most API endpoints require authentication either via session cookie or API token. Some endpoints are restricted to authentication with a session cookie (e.g. manupulation of user credentials).

Any request other than `GET` **not** using the API token authentication requires a valid XSRF token in the `_token` parameter (form requests) or the encrypted token in the `X-XSRF-TOKEN` header (XMLHttpRequests, usually the browser takes care of setting this header).
