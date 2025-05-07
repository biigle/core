// This file enables temporary websocket connections, as we don't need an active connection
// all the time in BIIGLE. The Echo instance can be obtained when needed and released when
// it's no longer needed. This keeps the websocket server free.

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let instance = null;

let leases = 0;

export default {
    getInstance() {
        if (!instance) {
            const options = {
                broadcaster: 'pusher',
                key: import.meta.env.VITE_PUSHER_APP_KEY,
                wsHost: window.location.hostname,
                wsPort: window.location.port,
                wssPort: window.location.port,
                forceTLS: window.location.port === 443,
                encrypted: true,
                disableStats: true,
                enableTransports: ['ws', 'wss'],
                disabledTransports: ['xhr_streaming', 'xhr_polling', 'sockjs'],
                authEndpoint: '/broadcasting/auth',
            };

            instance = new Echo({
                ...options,
                client: new Pusher(options.key, options),
            });
        }

        leases += 1;

        return instance;
    },
    releaseInstance() {
        leases = Math.max(leases - 1, 0);

        if (leases === 0 && instance) {
            instance.disconnect();
            instance = null;
        }
    },
};
