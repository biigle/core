/**
 * Executes the most recent call every 'wait' ms as long as throttle is called.
 */
biigle.$declare('utils.throttle', function () {
    var throttleTimeouts = {};
    var throttleFunctions = {};
    return  function (callback, wait, id) {
        throttleFunctions[id] = callback;
        if (!throttleTimeouts.hasOwnProperty(id)) {
            throttleTimeouts[id] = window.setTimeout(function () {
                throttleFunctions[id]();
                delete throttleTimeouts[id];
            }, wait);
        }
    };
});
