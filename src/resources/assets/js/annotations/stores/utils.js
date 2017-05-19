/**
 * Store for utility functions
 */
biigle.$declare('annotations.stores.utils', function () {
    var debounceTimeouts = {};
    var throttleTimeouts = {};
    var throttleFunctions = {};
    return {
        // Waits until the debounce wasn't called for 'wait' ms with the id until the
        // callback is executed. If it is contiuously called, the callback is not
        // executed.
        debounce: function (callback, wait, id) {
            if (debounceTimeouts.hasOwnProperty(id)) {
                window.clearTimeout(debounceTimeouts[id]);
            }
            debounceTimeouts[id] = window.setTimeout(callback, wait);
        },
        // Executes the most recent callback every 'wait' ms as long as throttle is
        // called.
        throttle: function (callback, wait, id) {
            throttleFunctions[id] = callback;
            if (!throttleTimeouts.hasOwnProperty(id)) {
                throttleTimeouts[id] = window.setTimeout(function () {
                    throttleFunctions[id]();
                    delete throttleTimeouts[id];
                }, wait);
            }
        },
    };
});
