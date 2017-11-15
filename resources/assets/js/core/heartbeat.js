window.addEventListener('load', function () {
    // Call the API endpoint every hour to keep the CSRF token alive. This is done if a
    // user leaves their browser (tab) idle for a long time and then wants to start
    // working again. Without heartbeat the token would have expired in the meantime and
    // AJAX requests would no longer work.
    window.setInterval(function () {
        Vue.http.post('heartbeat');
    }, 3600000);
});
