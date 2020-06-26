let date = new Date(0);

Vue.filter('videoTime', function (time) {
    // setTime expects milliseconds, time is in seconds.
    date.setTime(time * 1000);
    // Extract the "14:48:00.00" part from a string like "2011-10-05T14:48:00.000Z".
    return date.toISOString().split('T')[1].slice(0, -2);
});
