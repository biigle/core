import Vue from 'vue';
import VueResource from 'vue-resource';
import { configureCompat } from 'vue'

configureCompat({
    FILTERS: false,
});

window.Vue = Vue;
window.Vue.use(VueResource);

const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');

if (csrfTokenElement) {
    const readMethods = ['HEAD', 'GET', 'OPTIONS'];

    Vue.http.interceptors.push(function(request) {
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
