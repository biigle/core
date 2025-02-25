import { Http } from 'vue-resource';

window.addEventListener('load', function () {
    // Call the API endpoint every hour to keep the CSRF token alive. This is done if a
    // user leaves their browser (tab) idle for a long time and then wants to start
    // working again. Without heartbeat the token would have expired in the meantime and
    // AJAX requests would no longer work.
    let time = new Date().getTime();
    let id = window.setInterval(function () {
        if ((new Date().getTime() - time) > 7200000) {
            // Stop the interval if the last activity has been more than 120 min ago.
            // This can happen if the user's machine is suspended for more than 2 h and
            // then started again.
            window.clearInterval(id);
        } else {
            Http.post('heartbeat')
                .then(function () {
                    time = new Date().getTime();
                }, function () {
                    // Stop the interval if the request failed.
                    window.clearInterval(id);
                });
        }
    }, 3600000);
});
