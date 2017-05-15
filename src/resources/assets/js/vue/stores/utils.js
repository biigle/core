/**
 * Store for utility functions
 */
biigle.$declare('annotations.stores.utils', function () {
    var debounceTimeouts = {};
    var delayTimeouts = {};
    return {
        debounce: function (callback, wait, id) {
            if (debounceTimeouts.hasOwnProperty(id)) {
                window.clearTimeout(debounceTimeouts[id]);
            }
            debounceTimeouts[id] = window.setTimeout(callback, wait);
        },
        delay: function (callback, wait, id) {
            if (!delayTimeouts.hasOwnProperty(id)) {
                delayTimeouts[id] = window.setTimeout(function () {
                    callback();
                    delete delayTimeouts[id];
                }, wait);
            }
        },
    };
});
