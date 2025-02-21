import Vue from 'vue';
import { configureCompat } from 'vue'
import { Resource, Http } from 'vue-resource';

configureCompat({
    FILTERS: false,
});

window.Vue = Vue;

// Vue resource is not officially supported with Vue 3 and it no longer works as Vue
// plugin. It can be used stand-alone, though, and this is what we do for now. Any
// change here would require significant work with the existing resource definitions.
Vue.resource = function () {
    console.warn('Vue.resource is deprecated. Import Resource directly.');
    return Resource(...arguments);
};

const httpRootElement = document.querySelector('meta[name="http-root"]');

if (httpRootElement) {
    Http.options.root = httpRootElement.getAttribute('content');
}

const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');

if (csrfTokenElement) {
    const readMethods = ['HEAD', 'GET', 'OPTIONS'];

    Http.interceptors.push(function(request) {
        // Only add the CSRF token for non-read requests. This is important for
        // remote volume locations and CORS, as it would require a special CORS
        // configuration to allow this header.
        if (!readMethods.includes(request.method) && !request.crossOrigin) {
            request.headers.set('X-CSRF-TOKEN', csrfTokenElement.getAttribute('content'));
        }
    });
}

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

// window.axios = require('axios');

// window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allows your team to easily build robust real-time web applications.
 */

// import Echo from 'laravel-echo';
// import Pusher from 'pusher-js';

// window.Pusher = Pusher;


// The Echo instance can be obtained through resources/assets/js/core/echo.js.
// window.Echo = new Echo({
//     broadcaster: 'pusher',
//     key: process.env.MIX_PUSHER_APP_KEY,
//     wsHost: process.env.MIX_PUSHER_APP_HOST,
//     wsPort: process.env.MIX_PUSHER_PORT,
//     wssPort: process.env.MIX_PUSHER_PORT,
//     forceTLS: false,
//     encrypted: true,
//     disableStats: true,
//     enableTransports: ['ws', 'wss'],
//     disabledTransports: ['xhr_streaming', 'xhr_polling', 'sockjs'],
// });
