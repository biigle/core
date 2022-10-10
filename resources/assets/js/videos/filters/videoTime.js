let date = new Date(0);
let start = '';
let end = '';

Vue.filter('videoTime', function (time) {
    // setTime expects milliseconds, time is in seconds.
    date.setTime(time * 1000);
    // Extract the "14:48:00" and "000" parts from a string "2011-10-05T14:48:00.000Z".
    [start, end] = date.toISOString().split('T')[1].slice(0, -1).split('.');
    // Round the milliseconds from "000" to "00".
    end = Math.round(parseInt(end, 10) / 10).toString(10).padStart(2, '0');

    return `${start}.${end}`;
});
